import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo} from '../game/goV2';
import {ensureCocoons,startCocoon,cocoonWalked} from '../game/goCocoonsV2';
import {syncAdventure,mergeGPSWalk,gpsWalkMeters} from '../game/adventureSyncV2';
import {startFieldLure,advanceFieldActivities} from '../game/fieldActivitiesV2';
import {startRoute,advanceRoute} from '../game/worldSitesV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import {recordWalk} from '../game/walkingRewardsV2';
const NOW=Date.UTC(2026,9,22,10),FIX={lat:51.44,lng:5.47,accuracy:5};
const snap=(steps:number,meters:number,now=NOW)=>({dayUTC:new Date(now).toISOString().slice(0,10),capturedAt:now,steps,meters,source:'health-connect'});
function player(){const p=freshV2('health-qa','HLTH1234',NOW);ensureField(p,NOW);ensureGo(p,NOW);ensureCocoons(p,'seed',NOW);p.walking={at:NOW,fix:FIX,spawns:[],caught:[],count:0,day:'2026-10-22'};return p;}
test('first connection starts a baseline; later step-backed distance is bounded, persistent and never counted twice',()=>{
 const p=player();p.field!.walk={meters:1000,dayMeters:1000,anchor:null,at:NOW};assert.equal(syncAdventure(p,snap(10000,7200),NOW),0);assert.equal(p.field!.walk.meters,1000);
 startCocoon(p,p.go!.cocoons!.items[0].id,NOW);const later=NOW+3600000;assert.equal(syncAdventure(p,snap(13000,9200,later),later),2000);assert.equal(cocoonWalked(p),2000);assert.equal(gpsWalkMeters(p),1000);assert.equal(p.field!.walk.dayMeters,3000);
 assert.equal(syncAdventure(p,snap(13000,9200,later),later),0);assert.equal(p.field!.walk.meters,3000);
 // A replayed lower provider total cannot remove or re-award previously credited distance.
 assert.equal(syncAdventure(p,snap(12000,8500,later+1000),later+1000),0);assert.equal(p.field!.walk.meters,3000);
 const next=later+3600000;syncAdventure(p,snap(30000,21000,next),next);assert.equal(p.field!.walk.dayMeters,8000);assert.equal(p.field!.walk.meters,8000);
});
test('GPS and imported activity use a conservative union while GPS-only routes and lures keep their own meters',()=>{
 const p=player();syncAdventure(p,snap(0,0),NOW);startFieldLure(p,'lure','private',NOW);
 const route={id:'route',name:'QA-pad',source:'osm' as const,osmId:'way/1',meters:80,points:[FIX,{...FIX,lat:FIX.lat+.0002},{...FIX,lat:FIX.lat+.0004}]};p.walking!.routes=[route];startRoute(p,'route',NOW);
 const later=NOW+3600000;syncAdventure(p,snap(3000,2000,later),later);assert.equal(p.field!.walk!.meters,2000);assert.equal(gpsWalkMeters(p),0);
 p.walking!.at=later;advanceFieldActivities(p,later);advanceRoute(p,later);assert.equal(p.field!.lure!.spawned,0);assert.equal(p.go!.sites!.run!.meters,0);
 // The same 1km later recorded by GPS adds route distance, without another 1km of cocoon reward.
 p.field!.walk!.meters+=1000;p.field!.walk!.dayMeters+=1000;mergeGPSWalk(p,2000,2000,later);assert.equal(p.field!.walk!.meters,2000);assert.equal(p.field!.walk!.dayMeters,2000);assert.equal(gpsWalkMeters(p),1000);advanceRoute(p,later);assert.equal(p.go!.sites!.run!.meters,1000);
 p.field!.walk!.meters+=1500;p.field!.walk!.dayMeters+=1500;mergeGPSWalk(p,2000,2000,later);assert.equal(p.field!.walk!.meters,2500);assert.equal(gpsWalkMeters(p),2500);
});
test('bad, stale, manual-source, unbacked or impossibly fast health snapshots cannot award distance',()=>{
 for(const bad of [{...snap(100,100),source:'browser'},{...snap(100,100),extra:999},{...snap(100,100),meters:999},{...snap(100,100),steps:1.1},{...snap(100,100),capturedAt:NOW-120001},{...snap(100,100),dayUTC:'2026-10-21'}]){const p=player();assert.throws(()=>syncAdventure(p,bad,NOW));assert.equal(p.field!.walk?.meters??0,0);}
 const p=player();syncAdventure(p,snap(0,0),NOW);assert.throws(()=>syncAdventure(p,snap(5000,3000,NOW+1000),NOW+1000),/te korte tijd/);assert.equal(p.field!.walk!.meters,0);
 assert.equal(syncAdventure(p,snap(40,30,NOW+1000),NOW+1000),30);assert.throws(()=>syncAdventure(p,snap(80,60,NOW+1000),NOW+1000));assert.equal(p.field!.walk!.meters,30);
});
test('UTC day roll keeps lifetime distance, resets the combined day cap and never creates a GPS fix',()=>{
 const p=player();syncAdventure(p,snap(0,0),NOW);syncAdventure(p,snap(3000,2000,NOW+3600000),NOW+3600000);const before=structuredClone(p.walking),next=NOW+86400000;syncAdventure(p,snap(1500,1000,next),next);assert.equal(p.field!.walk!.meters,3000);assert.equal(p.field!.walk!.dayMeters,1000);assert.deepEqual(p.walking,{...before,day:new Date(next).toISOString().slice(0,10)});
});
test('health command receipts protect distance and reject fabricated direct reward fields',async()=>{
 const store=new SqliteStore(':memory:');try{let now=NOW;const api=new GoServiceV2(store,'local',()=>now),uid='health-receipt';let view=await api.state(uid);const command=(snapshot:unknown)=>({type:'adventureSync',snapshot,commandId:randomUUID(),expectedRevision:view.player.revision});view=await api.command(uid,command(snap(0,0)));now+=3600000;const c=command(snap(3000,2000,now));view=await api.command(uid,c);assert.equal(view.player.field!.walk!.meters,2000);view=await api.command(uid,c);assert.equal(view.player.field!.walk!.meters,2000);await assert.rejects(()=>api.command(uid,{...command(snap(3000,2000,now)),reward:50000}));}finally{store.close();}
});

test('15-second cycling samples can exceed seventy-five meters and eight kilometers while faster driving and stale gaps remain excluded',()=>{
 const p=player();recordWalk(p,NOW);const move=(meters:number,seconds:number,accuracy=5)=>{p.walking!.fix={...FIX,lat:FIX.lat+meters/111194.92664455874,accuracy,timestamp:NOW+seconds*1000};recordWalk(p,NOW+seconds*1000);};
 move(90,15);move(180,30);assert.equal(p.field!.walk!.meters,180);
 move(330,45);assert.equal(p.field!.walk!.meters,180); // 10 m/s must not count.
 move(2000,300);assert.equal(p.field!.walk!.meters,180); // No unobserved closed-app jump.
 move(2090,315);assert.equal(p.field!.walk!.meters,270);
 p.field!.walk!.meters=7990;p.field!.walk!.dayMeters=7990;move(2180,330);assert.equal(p.field!.walk!.meters,8080);move(2270,345);assert.equal(p.field!.walk!.meters,8170);
 const health=player();syncAdventure(health,snap(0,0),NOW);assert.throws(()=>syncAdventure(health,snap(200,90,NOW+15000),NOW+15000),/te korte tijd/);assert.equal(health.field!.walk!.meters,0);
});

test('Health Connect merging never removes verified GPS beyond eight kilometers or counts the same distance twice',()=>{
 const p=player();syncAdventure(p,snap(0,0),NOW);p.field!.walk!.meters=8000;p.field!.walk!.dayMeters=8000;mergeGPSWalk(p,0,0,NOW+3600000);assert.equal(gpsWalkMeters(p),8000);
 p.field!.walk!.meters+=900;p.field!.walk!.dayMeters+=900;mergeGPSWalk(p,8000,8000,NOW+4200000);assert.equal(p.field!.walk!.meters,8900);assert.equal(p.field!.walk!.dayMeters,8900);assert.equal(gpsWalkMeters(p),8900);
 assert.equal(syncAdventure(p,snap(14000,10000,NOW+7200000),NOW+7200000),0);assert.equal(p.field!.walk!.meters,8900);assert.equal(p.field!.walk!.dayMeters,8900);assert.equal(gpsWalkMeters(p),8900);
 const late=player();late.field!.walk={meters:8900,dayMeters:8900,anchor:null,at:NOW};syncAdventure(late,snap(10000,8000),NOW);assert.equal(syncAdventure(late,snap(13000,10000,NOW+3600000),NOW+3600000),0);assert.equal(late.field!.walk!.meters,8900);
});

test('real GPS cycling advances cocoon and walk research together and a replay cannot count the distance twice',async()=>{
 const store=new SqliteStore(':memory:');try{
  let now=NOW;const api=new GoServiceV2(store,'local',()=>now),uid='cycle-distance';let view=await api.state(uid),last:Record<string,unknown>|undefined;
  const send=async(type:string,data:Record<string,unknown>={})=>{last={type,...data,commandId:randomUUID(),expectedRevision:view.player.revision};return view=await api.command(uid,last);};
  await send('worldLocate',{fix:{...FIX,timestamp:now}});await send('cocoonStart',{id:view.player.go!.cocoons!.items[0].id});
  for(let i=1;i<=6;i++){now+=15000;await send('worldLocate',{fix:{...FIX,lat:FIX.lat+i*90/111194.92664455874,timestamp:now}});}
  assert.equal(view.player.field!.walk!.meters,540);assert.equal(view.player.field!.walk!.gpsMeters,540);assert.equal(cocoonWalked(view.player),540);const gpsReceipt=last!;
  const nets=view.player.field!.inventory.basic;await send('fieldTask',{task:'walk'});assert.equal(view.player.go!.dust,150);assert.equal(view.player.field!.inventory.basic,nets+5);
  view=await api.command(uid,gpsReceipt);assert.equal(view.player.field!.walk!.meters,540);assert.equal(view.player.go!.dust,150);assert.equal(view.player.field!.inventory.basic,nets+5);
  now+=15000;await send('worldLocate',{fix:{...FIX,lat:FIX.lat+690/111194.92664455874,timestamp:now}});assert.equal(view.player.field!.walk!.meters,540);assert.ok(view.player.walking!.blockedUntil!>now);
 }finally{store.close();}
});
