import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo} from '../game/goV2';
import {COCOON_CAP,ensureCocoons} from '../game/goCocoonsV2';
import {trackWeeklyWalk,weeklyWalkV2,weekV2} from '../game/weeklyWalkV2';
import {awayCursorV2,awaySummaryV2,validAwayCursorV2} from '../game/awaySummaryV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import type {GameViewV2,PlayerV2} from '../game/typesV2';
import type {WeeklyWalkV2} from '../game/weeklyWalkV2';

const MON=Date.UTC(2026,9,26,9),FIX={lat:51.44,lng:5.47,accuracy:5};
const week=(p:PlayerV2)=>(p.field as {weekWalk?:WeeklyWalkV2}).weekWalk!;
function player(meters=0){const p=freshV2('week-qa','WEEK1234',MON);ensureField(p,MON);ensureGo(p,MON);ensureCocoons(p,'seed',MON);p.field!.walk={meters,dayMeters:0,anchor:null,at:MON};return p;}
const walk=(p:PlayerV2,m:number,now:number,seed='s')=>{p.field!.walk!.meters+=m;return trackWeeklyWalk(p,now,seed);};

test('a week starts Monday 00:00 UTC',()=>{
 assert.equal(weekV2(Date.UTC(2026,9,25,23,59,59)),'2026-10-19');assert.equal(weekV2(Date.UTC(2026,9,26)),'2026-10-26');assert.equal(weekV2(Date.UTC(2026,10,1,23,59)),'2026-10-26');assert.equal(weekV2(Date.UTC(2026,10,2)),'2026-11-02');
});

test('old saves start a baseline without retroactive loot; tiers are granted once each',()=>{
 const p=player(42000),dust=p.go!.dust,inv={...p.field!.inventory};
 assert.deepEqual(trackWeeklyWalk(p,MON,'s'),[]);assert.equal(week(p).meters,0);assert.equal(p.go!.dust,dust);
 assert.deepEqual(walk(p,4999,MON+1),[]);assert.deepEqual(walk(p,1,MON+2),[5]);assert.equal(p.go!.dust,dust+1000);assert.equal(p.field!.inventory.basic,inv.basic+10);
 assert.deepEqual(trackWeeklyWalk(p,MON+3,'s'),[]);assert.equal(p.go!.dust,dust+1000,'no double grant on a repeat');
 const cocoons=p.go!.cocoons!.items.length;assert.deepEqual(walk(p,45000,MON+4),[25,50],'a big sync opens every reached chest');
 assert.equal(p.go!.dust,dust+10000);assert.equal(p.field!.inventory.blue,inv.blue+5);assert.equal(p.field!.inventory.pollen,inv.pollen+2);assert.equal(p.field!.inventory.silk,inv.silk+1);
 assert.equal(p.go!.cocoons!.items.length,cocoons+1);assert.equal(p.go!.cocoons!.items.at(-1)!.km,5);assert.deepEqual(week(p).last,{week:'2026-10-26',km:50,at:MON+4,cocoon:true});
 assert.deepEqual(walk(p,10000,MON+5),[]);assert.equal(p.go!.dust,dust+10000);assert.deepEqual(week(p).claimed,[5,25,50]);
});

test('a full cocoon bag still claims the 50 km chest without a cocoon',()=>{
 const p=player();trackWeeklyWalk(p,MON,'s');const g=p.go!.cocoons!;while(g.items.length<COCOON_CAP)g.items.push({id:'cocoon-'+g.nextId++,km:2,obtainedAt:MON});
 assert.deepEqual(walk(p,50000,MON+1),[5,25,50]);assert.equal(g.items.length,COCOON_CAP);assert.equal(week(p).last?.cocoon,false);
});

test('week rollover starts a new week and chests can be earned again',()=>{
 const p=player();trackWeeklyWalk(p,MON,'s');walk(p,6000,MON+1);assert.deepEqual(week(p).claimed,[5]);
 const next=MON+7*86400000;assert.deepEqual(weeklyWalkV2(p,next).meters,0,'screens show a fresh week before any new walk');
 assert.deepEqual(walk(p,3000,next),[]);assert.equal(week(p).week,'2026-11-02');assert.equal(week(p).meters,3000);assert.deepEqual(week(p).claimed,[]);
 assert.deepEqual(walk(p,2000,next+1),[5]);
});

test('missing field, walk or go never throws; rewards wait until the player has GO data',()=>{
 const bare=freshV2('bare','BARE1234',MON);assert.deepEqual(trackWeeklyWalk(bare,MON,'s'),[]);
 const p=player();delete p.field!.walk;assert.deepEqual(trackWeeklyWalk(p,MON,'s'),[]);
 const q=player();trackWeeklyWalk(q,MON,'s');const go=q.go;delete (q as {go?:unknown}).go;assert.deepEqual(walk(q,6000,MON+1),[]);q.go=go;assert.deepEqual(trackWeeklyWalk(q,MON+2,'s'),[5]);
});

test('away summary celebrates newly reached chests and accepts old cursors',()=>{
 const p=player();trackWeeklyWalk(p,MON,'s');const before=awayCursorV2(p);assert.ok(validAwayCursorV2(before));walk(p,6000,MON+1);
 const s=awaySummaryV2(p,before);assert.deepEqual(s.reached,[5]);assert.equal(s.meters,6000);assert.equal(s.week?.next?.km,25);
 const old={caught:0,missed:0,dust:0,xp:0,spins:0,meters:0,lastAutoAt:0};assert.ok(validAwayCursorV2(old));assert.deepEqual(awaySummaryV2(p,old).reached,[]);
 assert.equal(validAwayCursorV2({...old,week:5}),false);
});

test('service: GPS and Health Connect both count once; retried commands never grant twice',async()=>{
 const store=new SqliteStore(':memory:');let now=MON;const api=new GoServiceV2(store,'local',()=>now),uid='weekly-walk';try{
  let v:GameViewV2=await api.state(uid);const send=async(type:string,data:Record<string,unknown>)=>v=await api.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});
  const snap=(steps:number,meters:number)=>({dayUTC:new Date(now).toISOString().slice(0,10),capturedAt:now,steps,meters,source:'health-connect'});
  // GPS: walk north in 60 m steps every 20 s.
  for(let i=0;i<=5;i++){await send('worldLocate',{fix:{...FIX,lat:FIX.lat+i*.00054,timestamp:now}});now+=20000;}
  const gps=v.player.field!.walk!.meters;assert.ok(gps>=200,'GPS walking was credited: '+gps);assert.equal(week(v.player).meters,gps);
  await send('adventureSync',{snapshot:snap(0,0)});assert.equal(week(v.player).meters,gps,'connecting starts a baseline');
  now+=3600000;const dust=v.player.go!.dust,basic=v.player.field!.inventory.basic;
  const command={type:'adventureSync',snapshot:snap(8000,6000),commandId:randomUUID(),expectedRevision:v.player.revision};v=await api.command(uid,command);
  const total=v.player.field!.walk!.meters;assert.ok(total>=6000);assert.equal(week(v.player).meters,total);assert.deepEqual(week(v.player).claimed,[5]);assert.equal(v.player.go!.dust,dust+1000);assert.equal(v.player.field!.inventory.basic,basic+10,'10 nets granted (autovangst is off)');
  v=await api.command(uid,command);assert.equal(v.player.go!.dust,dust+1000);assert.deepEqual(week(v.player).claimed,[5]);assert.equal(week(v.player).meters,total);
  await send('settings',{sound:true,reducedMotion:false,largeText:false});assert.equal(v.player.go!.dust,dust+1000,'unrelated commands do not regrant');
  assert.ok(v.player.go!.cocoons!.items.every(c=>c.hatchSeed===undefined),'cocoon seeds stay hidden');
 }finally{store.close();}
});
