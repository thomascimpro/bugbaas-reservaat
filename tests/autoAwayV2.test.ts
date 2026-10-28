import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {freshV2,dayV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo} from '../game/goV2';
import {locate} from '../game/walkingV2';
import {AWAY_PER_DAY,GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import type {PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,9,28,12),FIX={lat:51.4416,lng:5.4697,accuracy:5};
type Hidden={auto:(p:PlayerV2,now:number,secret:string)=>void;awayCatch:(p:PlayerV2,meters:number,now:number,secret:string)=>void};
function setup(){const store=new SqliteStore(':memory:'),service=new GoServiceV2(store,'local',()=>NOW) as unknown as Hidden;const p=freshV2('walker','WALKER1',NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);p.field!.inventory.basic=20;p.go!.auto.enabled=true;return {store,service,p};}
const move=(p:PlayerV2,lat:number,at:number)=>{locate(p,{...FIX,lat,timestamp:at},'walk-seed',at);p.walking!.spawns.unshift({id:'near-'+at,species:'ant',lat,lng:FIX.lng,expiresAt:at+900000});};

test('sparse background fixes still credit real walking: 200 m over five minutes triggers an attempt',()=>{
 const {store,service,p}=setup();try{
  move(p,FIX.lat,NOW);service.auto(p,NOW,'s0');const nets=p.field!.inventory.basic;
  const later=NOW+5*60000;move(p,FIX.lat+.0018,later);service.auto(p,later,'s1');
  assert.equal(p.go!.auto.status,'moving');assert.equal(p.field!.inventory.basic,nets-1,'one net used for one attempt');assert.ok(p.go!.auto.last);
 }finally{store.close();}
});

test('driving speed voids the credit and never spends a net; long gaps reset',()=>{
 const {store,service,p}=setup();try{
  move(p,FIX.lat,NOW);service.auto(p,NOW,'d0');const nets=p.field!.inventory.basic;
  const t1=NOW+120000;move(p,FIX.lat+.018,t1);service.auto(p,t1,'d1');assert.equal(p.go!.auto.status,'too-fast');assert.equal(p.go!.auto.credit,0);assert.equal(p.field!.inventory.basic,nets);
  const t2=t1+20*60000;move(p,FIX.lat+.0185,t2);service.auto(p,t2,'d2');assert.equal(p.go!.auto.status,'waiting','a 20 minute gap is not trusted as walking');assert.equal(p.field!.inventory.basic,nets);
 }finally{store.close();}
});

test('Adventure Sync kilometres with the app closed give one attempt per km, keep the rest, and stop at the daily cap',()=>{
 const {store,service,p}=setup();try{
  move(p,FIX.lat,NOW);const nets=p.field!.inventory.basic;
  service.awayCatch(p,1500,NOW,'a1');assert.equal(p.go!.auto.awayCount,1);assert.equal(p.go!.auto.awayCredit,500);assert.equal(p.field!.inventory.basic,nets-1);
  service.awayCatch(p,0,NOW+1000,'a2');assert.equal(p.go!.auto.awayCount,1,'no new distance and only 500 m left: nothing happens');
  for(let i=0;i<10;i++){const t=NOW+2000+i*1000;p.walking!.at=t;service.awayCatch(p,1000,t,'b'+i);}
  assert.equal(p.go!.auto.awayCount,AWAY_PER_DAY);assert.equal(p.go!.auto.awayDay,dayV2(NOW));assert.equal(p.field!.inventory.basic,nets-AWAY_PER_DAY);
 }finally{store.close();}
});

test('away attempts wait for a fresh GPS fix and keep the distance credit',()=>{
 const {store,service,p}=setup();try{
  move(p,FIX.lat,NOW);const nets=p.field!.inventory.basic,late=NOW+5*60000;
  service.awayCatch(p,1200,late,'stale');assert.equal(p.go!.auto.awayCount??0,0);assert.equal(p.go!.auto.awayCredit,1200);assert.equal(p.field!.inventory.basic,nets);
  p.walking!.at=late;service.awayCatch(p,0,late,'fresh');assert.equal(p.go!.auto.awayCount,1);assert.equal(p.field!.inventory.basic,nets-1);
  p.go!.auto.enabled=false;service.awayCatch(p,5000,late+60000,'off');assert.equal(p.go!.auto.awayCount,1,'autovangst uit = geen afwezigheidsvangsten');
 }finally{store.close();}
});

test('kilometres synced before the first fresh GPS fix are spent as soon as that fix arrives',async()=>{
 const store=new SqliteStore(':memory:');let now=NOW;const service=new GoServiceV2(store,'local',()=>now),uid='late-fix';try{
  let v=await service.state(uid);const send=async(type:string,data:Record<string,unknown>={})=>v=await service.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});
  const snap=(steps:number,meters:number)=>({dayUTC:new Date(now).toISOString().slice(0,10),capturedAt:now,steps,meters,source:'health-connect'});
  await send('worldLocate',{fix:{...FIX,timestamp:now}});await send('goAuto',{enabled:true});await send('adventureSync',{snapshot:snap(0,0)});
  now+=3600000;await send('adventureSync',{snapshot:snap(2600,2000)});
  assert.equal(v.player.go!.auto.awayCount??0,0,'no catch on an hour-old fix');assert.equal(v.player.go!.auto.awayCredit,2000);
  now+=2000;await send('worldLocate',{fix:{...FIX,timestamp:now}});
  assert.equal(v.player.go!.auto.awayCount,1,'the fresh fix spends one km of credit');assert.equal(v.player.go!.auto.awayCredit,1000);
 }finally{store.close();}
});
