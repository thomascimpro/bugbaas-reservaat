import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {autoLocationOwnerV2,backgroundAutoTickV2,commandSerialV2,freshAutoLocationV2} from '../src/backgroundAutoSessionV2';
import type {AutoLocationV2,AutoSessionV2,AutoSessionIOV2} from '../src/backgroundAutoSessionV2';
import type {GameViewV2,PlayerV2} from '../game/typesV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';

const NOW=Date.UTC(2026,9,26,12),FIX={lat:51.44,lng:5.47,accuracy:5};
const location=(timestamp=NOW,latitude=FIX.lat):AutoLocationV2=>({timestamp,coords:{latitude,longitude:FIX.lng,accuracy:5}});
test('one GPS owner: service runs while backgrounded or viewing a paused map, foreground map owns its own fixes',()=>{assert.equal(autoLocationOwnerV2(true,true),false);assert.equal(autoLocationOwnerV2(true,false),true);assert.equal(autoLocationOwnerV2(false,true),true);assert.equal(autoLocationOwnerV2(false,false),true);});
function view(revision=1):GameViewV2{return {player:{uid:'owner',revision,go:{auto:{enabled:true},battle:null,queue:null},walking:{fix:{...FIX,timestamp:NOW-20000}}}} as GameViewV2;}
function io(extra:Partial<AutoSessionIOV2>={}):AutoSessionIOV2{return {now:()=>NOW,newId:randomUUID,current:()=>true,state:async()=>view(),command:async()=>view(2),save:async()=>{},...extra};}

test('background batches use only the newest fresh accurate fix and do not replay cached or malformed positions',()=>{
 const good=location(NOW-1000),old=location(NOW-15001),future=location(NOW+5001),coarse={...location(),coords:{...location().coords,accuracy:81}};
 assert.deepEqual(freshAutoLocationV2([old,future,coarse,good],NOW),{...FIX,timestamp:NOW-1000});assert.equal(freshAutoLocationV2([good],NOW,NOW-1000),null);
 assert.equal(freshAutoLocationV2([{...location(),coords:{...location().coords,latitude:NaN}},{...location(),coords:{...location().coords,accuracy:null}}],NOW),null);
});

test('account changes, stopped sessions, disabled autocatch and battles never start new background GPS mutations',async()=>{
 for(const state of [()=>({...view(),player:{...view().player,uid:'someone-else'}}),()=>({...view(),player:{...view().player,go:{...view().player.go!,auto:{...view().player.go!.auto,enabled:false}}}}),()=>({...view(),player:{...view().player,go:{...view().player.go!,battle:'live-fight'}}})]){
  let commands=0;await backgroundAutoTickV2({uid:'owner'},[location()],io({state:async()=>state(),command:async()=>{commands++;return view();}}));assert.equal(commands,0);
 }
 let reads=0;assert.equal(await backgroundAutoTickV2({uid:'owner'},[location()],io({current:()=>false,state:async()=>{reads++;return view();}})),null);assert.equal(reads,0);
 let active=true,commands=0;await backgroundAutoTickV2({uid:'owner'},[location()],io({current:()=>active,state:async()=>{active=false;return view();},command:async()=>{commands++;return view();}}));assert.equal(commands,0);
});

test('uncertain network failures retain exactly the same pending command and recovery resolves it before a new fix',async()=>{
 const session:AutoSessionV2={uid:'owner'};let saved:AutoSessionV2|undefined,posted:unknown;
 await assert.rejects(()=>backgroundAutoTickV2(session,[location()],io({save:async s=>{saved=structuredClone(s);},command:async c=>{posted=structuredClone(c);throw {status:0};}})));
 assert.deepEqual(session,saved);assert.deepEqual(session.pending,posted);const original=structuredClone(session.pending!),sent:unknown[]=[];
 await backgroundAutoTickV2(session,[location()],io({state:async()=>view(9),command:async c=>{sent.push(structuredClone(c));return {...view(10),player:{...view(10).player,walking:{...view().player.walking!,fix:{...FIX,timestamp:NOW}}}};} }));
 assert.deepEqual(sent,[original]);assert.equal(session.pending,undefined);
});

test('a known revision rejection clears an uncommitted receipt and uses fresh server revision; auth failures do not send a replacement',async()=>{
 const pending={type:'worldLocate',fix:{...FIX,timestamp:NOW-5000},commandId:randomUUID(),expectedRevision:1},session:AutoSessionV2={uid:'owner',pending};const sent:unknown[]=[];
 await backgroundAutoTickV2(session,[location()],io({state:async()=>view(7),command:async c=>{sent.push(structuredClone(c));if(c.commandId===pending.commandId)throw {status:409};return view(8);}}));
 assert.equal(sent.length,2);assert.deepEqual(sent[0],pending);assert.equal((sent[1] as typeof pending).expectedRevision,7);assert.notEqual((sent[1] as typeof pending).commandId,pending.commandId);assert.equal(session.pending,undefined);
 const unauthorized:AutoSessionV2={uid:'owner',pending};let commands=0;await assert.rejects(()=>backgroundAutoTickV2(unauthorized,[location()],io({state:async()=>{throw {status:401};},command:async()=>{commands++;return view();}})));assert.equal(commands,0);assert.deepEqual(unauthorized.pending,pending);
});

test('native command queue serializes foreground/background work and releases after a rejected action',async()=>{
 const serial=commandSerialV2(),seen:string[]=[];let active=0,max=0;const work=(name:string,fail=false)=>serial(async()=>{active++;max=Math.max(max,active);seen.push(name);await new Promise(r=>setTimeout(r,5));active--;if(fail)throw new Error('expected');return name;});
 const result=await Promise.allSettled([work('foreground'),work('background',true),work('foreground-next')]);assert.equal(max,1);assert.deepEqual(seen,['foreground','background','foreground-next']);assert.deepEqual(result.map(r=>r.status),['fulfilled','rejected','fulfilled']);
});

test('foreground handoff resolves a committed in-flight receipt before disabling with the current server revision',async()=>{
 const store=new SqliteStore(':memory:');let now=NOW;try{
  const service=new GoServiceV2(store,'local',()=>now),uid='handoff-owner';let v=await service.state(uid);const send=async(type:string,data:Record<string,unknown>)=>v=await service.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});await send('worldLocate',{fix:{...FIX,timestamp:now}});await send('goAuto',{enabled:true});
  const session:AutoSessionV2={uid};let saved=structuredClone(session),background=true,release!:()=>void,committed!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;}),started=new Promise<void>(resolve=>{committed=resolve;});now+=15000;
  const inflight=backgroundAutoTickV2(session,[location(now,FIX.lat+.0002)],io({now:()=>now,current:()=>background,state:()=>service.state(uid),save:async s=>{if(background)saved=structuredClone(s);},command:async c=>{const next=await service.command(uid,c);committed();await gate;return next;}}));
  await started;assert.ok(saved.pending);const receipt=structuredClone(saved.pending!);background=false;release();const finished=await inflight;assert.ok(finished!.player.revision>v.player.revision);assert.ok(saved.pending);let retries=0;
  const recovered=await backgroundAutoTickV2(saved,[],io({now:()=>now,state:()=>service.state(uid),command:async c=>{retries++;assert.deepEqual(c,receipt);return service.command(uid,c);},save:async s=>{saved=structuredClone(s);}}));assert.equal(retries,1);assert.equal(saved.pending,undefined);assert.equal(recovered!.player.revision,finished!.player.revision);
  const off=await service.command(uid,{type:'goAuto',enabled:false,commandId:randomUUID(),expectedRevision:recovered!.player.revision});assert.equal(off.player.go!.auto.enabled,false);assert.equal(off.player.field!.inventory.basic,v.player.field!.inventory.basic);
 }finally{store.close();}
});

test('real background GPS commits keep existing movement rules and a lost response cannot spend a second net',async()=>{
 const store=new SqliteStore(':memory:');let now=NOW;try{
  const service=new GoServiceV2(store,'local',()=>now),uid='background-owner',key='v2Players:'+uid;let v=await service.state(uid);
  const send=async(type:string,data:Record<string,unknown>)=>v=await service.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});
  await send('worldLocate',{fix:{...FIX,timestamp:now}});await send('goAuto',{enabled:true});await store.run([key],d=>{(d.get(key) as PlayerV2).go!.dex=['ant'];});const stock=v.player.field!.inventory.basic,session:AutoSessionV2={uid};let lose=false,lostId='',replayed=0;
  const api=io({now:()=>now,state:()=>service.state(uid),command:async c=>{const next=await service.command(uid,c);if(c.commandId===lostId)replayed++;if(lose){lose=false;lostId=c.commandId;throw {status:0};}return next;}});
  for(let i=1;i<=3;i++){
   now+=15000;const lat=FIX.lat+i*.0002;await store.run([key],d=>{(d.get(key) as PlayerV2).walking!.spawns.push({id:'background-ant-'+i,species:'ant',lat,lng:FIX.lng,expiresAt:now+900000});});
   if(i===2){lose=true;await assert.rejects(()=>backgroundAutoTickV2(session,[location(now,lat)],api));assert.equal((await service.state(uid)).player.field!.inventory.basic,stock-1);assert.ok(session.pending);}
   else await backgroundAutoTickV2(session,[location(now,lat)],api);
  }
  const after=await service.state(uid);assert.equal(replayed,1);assert.equal(session.pending,undefined);assert.equal(after.player.field!.inventory.basic,stock-1);assert.ok(after.player.go!.auto.last);assert.equal(after.player.go!.rating,1000);
 }finally{store.close();}
});
