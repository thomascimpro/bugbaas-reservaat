import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {freshV2,dayV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo} from '../game/goV2';
import {locate} from '../game/walkingV2';
import {WALK_CATCH,creditWalk,walkTodayText} from '../game/walkCatchV2';
import {awayCursorV2,awaySummaryV2} from '../game/awaySummaryV2';
import {bugRarity} from '../game/rarityDisplayV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import type {PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,9,28,12),FIX={lat:51.4416,lng:5.4697,accuracy:5},M=1/111320;
type Hidden={auto:(p:PlayerV2,now:number,secret:string)=>void;awayCatch:(p:PlayerV2,meters:number,now:number,secret:string,seconds?:number)=>void};
function setup(){const store=new SqliteStore(':memory:'),service=new GoServiceV2(store,'local',()=>NOW) as unknown as Hidden;const p=freshV2('walker','WALKER1',NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);p.field!.inventory.basic=20;p.go!.auto.enabled=true;return {store,service,p};}
/** Walk north `meters` in `seconds`, as one server-validated GPS fix. */
function step(service:Hidden,p:PlayerV2,state:{lat:number;at:number},meters:number,seconds:number,secret:string){state.lat+=meters*M;state.at+=seconds*1000;locate(p,{...FIX,lat:state.lat,timestamp:state.at},'walk-seed',state.at);service.auto(p,state.at,secret);}
function walk(service:Hidden,p:PlayerV2,km:number,speed:number){const state={lat:FIX.lat,at:NOW};locate(p,{...FIX,timestamp:NOW},'walk-seed',NOW);service.auto(p,NOW,'start');const per=speed*15;for(let i=0;i*per<km*1000;i++)step(service,p,state,per,15,'w'+i);return p.go!.auto.walk!;}

test('normal walking gives 5 bugs per km, a real workout 10 per km; never uses nets',()=>{
 const a=setup(),b=setup();try{
  const nets=a.p.field!.inventory.basic,stroll=walk(a.service,a.p,1,1.3),run=walk(b.service,b.p,1,2.6);
  assert.equal(stroll.workout,false);assert.equal(stroll.caught,5,'1 per 200 m');
  assert.equal(run.workout,true);assert.ok(run.caught>=9&&run.caught<=10,'about 10 per km while running, got '+run.caught);
  assert.equal(a.p.field!.inventory.basic,nets,'walk catches are free');assert.equal(a.p.go!.auto.totals!.caught,5);
 }finally{a.store.close();b.store.close();}
});

test('standing still and driving speed give nothing; long gaps are not trusted',()=>{
 const {store,service,p}=setup();try{
  const state={lat:FIX.lat,at:NOW};locate(p,{...FIX,timestamp:NOW},'walk-seed',NOW);service.auto(p,NOW,'s0');
  for(let i=0;i<4;i++)step(service,p,state,0,15,'rest'+i);assert.equal(p.go!.auto.walk?.caught??0,0);assert.equal(p.go!.auto.status,'waiting');
  step(service,p,state,2000,120,'car');assert.equal(p.go!.auto.status,'too-fast');assert.equal(p.go!.auto.walk?.caught??0,0);
  step(service,p,state,500,20*60,'gap');assert.equal(p.go!.auto.status,'waiting','a 20 minute gap is not trusted as walking');assert.equal(p.go!.auto.walk?.caught??0,0);
 }finally{store.close();}
});

test('walk bugs are random wild spawns; every 10th of the day is the rarest of its spot, and the daily cap holds',()=>{
 const {store,service,p}=setup();try{
  const w=walk(service,p,1.6,2.6);assert.ok(w.caught>=10);
  const walkBugs=p.specimens.filter(s=>s.source==='walking');assert.ok(new Set(walkBugs.map(s=>s.species)).size>1,'not always the same species');
  const tenth=walkBugs[9];assert.ok(tenth&&bugRarity(tenth.species)>=Math.max(...walkBugs.slice(0,9).map(s=>bugRarity(s.species)))-1,'jackpot is at least as rare as the others around it');
  const day=p.go!.auto.walk!;day.caught=WALK_CATCH.dailyCap-1;day.credit=WALK_CATCH.step*5;
  assert.equal(creditWalk(day,1000,1.3)<=1,true,'only one bug left under the cap');
 }finally{store.close();}
});

test('Health Connect kilometres with the app closed feed the same counter and wait for a fresh GPS fix',()=>{
 const {store,service,p}=setup();try{
  locate(p,{...FIX,timestamp:NOW},'walk-seed',NOW);const late=NOW+5*60000;
  service.awayCatch(p,1000,late,'stale',800);assert.equal(p.go!.auto.walk!.caught,0,'stale fix: keep the credit');assert.equal(p.go!.auto.walk!.credit,1000);
  p.walking!.at=late;service.awayCatch(p,0,late,'fresh');assert.equal(p.go!.auto.walk!.caught,WALK_CATCH.perCall,'paid out on the fresh fix');
  assert.equal(p.go!.auto.awayCount,p.go!.auto.walk!.caught,'old away counter mirrors the walk counter');
  p.go!.auto.enabled=false;service.awayCatch(p,5000,late+60000,'off');assert.equal(p.go!.auto.walk!.caught,WALK_CATCH.perCall,'autovangst uit = geen wandelvangst');
 }finally{store.close();}
});

test('a Health Connect workout (fast pace between syncs) counts double',()=>{
 const a=setup(),b=setup();try{
  for(const s of [a,b]){locate(s.p,{...FIX,timestamp:NOW},'walk-seed',NOW);s.p.walking!.at=NOW;}
  a.service.awayCatch(a.p,1000,NOW,'calm',1000/1.2);b.service.awayCatch(b.p,1000,NOW,'run',1000/2.8);
  assert.equal(a.p.go!.auto.walk!.workout,false);assert.equal(b.p.go!.auto.walk!.workout,true);
  assert.equal(a.p.go!.auto.walk!.credit+a.p.go!.auto.walk!.caught*WALK_CATCH.step,1000);
  assert.equal(b.p.go!.auto.walk!.credit+b.p.go!.auto.walk!.caught*WALK_CATCH.step,2000);
 }finally{a.store.close();b.store.close();}
});

test('notification and in-game summary show the same line: today km and today walk bugs',()=>{
 const {store,service,p}=setup();try{
  walk(service,p,1,1.3);const line=walkTodayText(p,NOW+10*60000);
  assert.match(line,/^👟 /);assert.ok(line.endsWith('🐞 5'),line);
  assert.equal(walkTodayText(p,NOW+2*86400000),'👟 0,0 km · 🐞 0','a stale player snapshot must not show yesterday’s kilometres');assert.equal(p.go!.auto.walk!.day,dayV2(NOW));
 }finally{store.close();}
});

test('kilometres synced before the first fresh GPS fix are spent as soon as that fix arrives',async()=>{
 const store=new SqliteStore(':memory:');let now=NOW;const service=new GoServiceV2(store,'local',()=>now),uid='late-fix';try{
  let v=await service.state(uid);const send=async(type:string,data:Record<string,unknown>={})=>v=await service.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});
  const snap=(steps:number,meters:number)=>({dayUTC:new Date(now).toISOString().slice(0,10),capturedAt:now,steps,meters,source:'health-connect'});
  await send('worldLocate',{fix:{...FIX,timestamp:now}});await send('goAuto',{enabled:true});await send('adventureSync',{snapshot:snap(0,0)});
  now+=3600000;await send('adventureSync',{snapshot:snap(2600,2000)});
  assert.equal(v.player.go!.auto.walk?.caught??0,0,'no catch on an hour-old fix');assert.equal(v.player.go!.auto.walk!.credit,2000);
  now+=2000;await send('worldLocate',{fix:{...FIX,timestamp:now}});
  assert.equal(v.player.go!.auto.walk!.caught,10,'the fresh fix pays the complete 2km return batch');assert.equal(v.player.go!.auto.walk!.credit,0);
 }finally{store.close();}
});

test('walking past a bug on the map catches that bug first, like really walking around',()=>{
 const {store,service,p}=setup();try{
  const state={lat:FIX.lat,at:NOW};locate(p,{...FIX,timestamp:NOW},'walk-seed',NOW);service.auto(p,NOW,'s0');
  for(let i=0;i<7;i++){step(service,p,state,26,15,'n'+i);}
  p.walking!.spawns.unshift({id:'map-bug',species:'ladybug',lat:state.lat,lng:FIX.lng,expiresAt:state.at+900000});
  step(service,p,state,26,15,'pass');
  assert.equal(p.go!.auto.walk!.caught,1);assert.ok(p.specimens.some(s=>s.id==='wild-map-bug'),'the map bug you passed is the one caught');
 }finally{store.close();}
});


test('exactly200m saved with stale GPS pays one walk bug on the first fresh worldLocate, once',async()=>{
 const {store,service,p}=setup();const live=service as unknown as GoServiceV2,late=NOW+5*60000;live.clock=()=>late;
 try{
  locate(p,{...FIX,timestamp:NOW},'walk-seed',NOW);service.awayCatch(p,200,late,'earned',200);
  assert.equal(p.go!.auto.walk!.credit,200);assert.equal(p.go!.auto.walk!.caught,0);
  await store.run(['v2Players:'+p.uid],d=>d.set('v2Players:'+p.uid,p));const before=await live.state(p.uid),command={type:'worldLocate',fix:{...FIX,timestamp:late},commandId:randomUUID(),expectedRevision:before.player.revision};
  const result=await live.command(p.uid,command);assert.equal(result.player.go!.auto.walk!.caught,1);assert.equal(result.player.go!.auto.walk!.credit,0);assert.equal(result.player.specimens.length,p.specimens.length+1);assert.equal(result.player.field!.inventory.basic,p.field!.inventory.basic);
  const retry=await live.command(p.uid,command);assert.equal(retry.player.go!.auto.walk!.caught,1);assert.equal(retry.player.specimens.length,result.player.specimens.length);
 }finally{store.close();}
});


test('a 2km closed-app walk across midnight gives one complete ten-bug return receipt and retries give nothing extra',async()=>{
 const store=new SqliteStore(':memory:');let now=Date.UTC(2026,10,7,23);const api=new GoServiceV2(store,'local',()=>now),uid='overnight-return';try{
  let v=await api.state(uid);const send=async(type:string,data:Record<string,unknown>={})=>v=await api.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});
  const snap=(dayUTC:string,steps:number,meters:number)=>({dayUTC,capturedAt:now,steps,meters,source:'health-connect',distanceBasis:'measured'});
  await send('worldLocate',{fix:{...FIX,timestamp:now}});await send('goAuto',{enabled:true});await send('adventureSync',{snapshot:snap('2026-11-07',0,0)});
  const before=awayCursorV2(v.player,now),stock=v.player.field!.inventory.basic;now+=7200000;v=await api.state(uid);
  await send('worldLocate',{fix:{...FIX,timestamp:now}});
  const snapshot={source:'health-connect',capturedAt:now,days:[snap('2026-11-07',1500,1000),snap('2026-11-08',1500,1000)]};
  const command={type:'adventureSync',snapshot,commandId:randomUUID(),expectedRevision:v.player.revision};v=await api.command(uid,command);
  const report=awaySummaryV2(v.player,before);assert.equal(report.meters,2000);assert.equal(report.caught,10);assert.equal(report.bugs.length,10);assert.ok(report.dust>0&&report.xp>0);assert.equal(v.player.field!.walk!.dayMeters,1000);assert.equal(v.player.field!.inventory.basic,stock);
  v=await api.command(uid,command);await send('adventureSync',{snapshot});assert.equal(awaySummaryV2(v.player,before).caught,10);assert.equal(v.player.field!.walk!.meters,2000);
 }finally{store.close();}
});
test('closed-app distance is preserved even before the very first GPS seed, then settled once within the daily cap',()=>{
 const {store,service,p}=setup();try{
  service.awayCatch(p,30000,NOW,'no-gps',30000/1.3);assert.equal(p.walking,undefined);assert.equal(p.go!.auto.walk!.caught,0);assert.ok(p.go!.auto.walk!.credit>=WALK_CATCH.step*WALK_CATCH.dailyCap);
  locate(p,{...FIX,timestamp:NOW},'new-seed',NOW);service.awayCatch(p,0,NOW,'first-gps');assert.equal(p.go!.auto.walk!.caught,120);assert.equal(p.specimens.filter(s=>s.autoCaught).length,120);
  service.awayCatch(p,30000,NOW,'retry',30000/1.3);assert.equal(p.go!.auto.walk!.caught,120);assert.equal(p.specimens.filter(s=>s.autoCaught).length,120);
 }finally{store.close();}
});
