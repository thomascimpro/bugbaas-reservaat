import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {catchAccuracy,catchPeriod,catchTarget,judgeCatchRhythm} from '../game/catchTimingV2';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2} from '../server/goServiceV2';
import type {PlayerV2} from '../game/typesV2';
const NOW=Date.UTC(2026,9,21,14),focus={id:'server-issued-random-focus',at:NOW};
const perfect=(bait:null|'dew'=null)=>({focus:focus.id,taps:[0,1,2].map(i=>catchTarget(focus,i,bait))});
test('three separate timing windows reward accurate play; slowing bait widens the windows',()=>{
 const proof=perfect();assert.equal(judgeCatchRhythm(proof,focus,null,NOW+5000).grade,'perfect');
 const misses={focus:focus.id,taps:[0,1,2].map(i=>i*catchPeriod(null))};assert.equal(judgeCatchRhythm(misses,focus,null,NOW+5000).grade,'miss');
 const mixed={...proof,taps:[proof.taps[0],1450,proof.taps[2]]};assert.notEqual(judgeCatchRhythm(mixed,focus,null,NOW+5000).grade,'perfect');
 assert.ok(catchPeriod('dew')>catchPeriod(null));assert.ok(catchAccuracy(focus,0,catchTarget(focus,0,'dew')+350,'dew')>0);assert.equal(catchAccuracy(focus,0,catchTarget(focus,0,null)+350,null),0);
});
test('fabricated grades, wrong challenges, spam taps, future times and expired sessions cannot claim a catch',()=>{
 const proof=perfect();for(const bad of [{...proof,grade:'perfect'},{...proof,focus:'another-focus'},{...proof,taps:[0,0,0]},{...proof,taps:[1,2]},{...proof,taps:[0,1450,Infinity]}])assert.throws(()=>judgeCatchRhythm(bad,focus,null,NOW+5000));
 assert.throws(()=>judgeCatchRhythm(proof,undefined,null,NOW+5000));assert.throws(()=>judgeCatchRhythm(proof,focus,null,NOW+100));assert.throws(()=>judgeCatchRhythm(proof,focus,null,NOW+20001));
});
test('a server-issued timing challenge consumes one net for three taps and settles its rewards once',async()=>{
 const store=new SqliteStore(':memory:');let now=NOW;const service=new GoServiceV2(store,'local',()=>now);const uid='rhythm-qa';
 try{let view=await service.state(uid);const send=async(type:string,data:Record<string,unknown>={})=>{view=await service.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:view.player.revision});return view;};
  await send('worldLocate',{fix:{lat:51.4416,lng:5.4697,accuracy:5,timestamp:now}});await send('worldEncounter',{spawn:view.player.walking!.spawns[0].id});
  await store.run(['v2Players:'+uid],d=>{const p=d.get('v2Players:'+uid) as PlayerV2;p.field!.inventory.royal=1;});await send('worldFocus',{encounter:view.player.field!.encounter!.id});
  const f=view.player.field!.encounter!.focus!,rhythm={focus:f.id,taps:[0,1,2].map(i=>catchTarget(f,i,null))},stock=view.player.field!.inventory.royal,dust=view.player.go!.dust;
  const command={type:'worldCast',encounter:view.player.field!.encounter!.id,net:'royal',bait:null,rhythm,commandId:randomUUID(),expectedRevision:view.player.revision};
  await assert.rejects(()=>service.command(uid,command),'Cannot submit a future perfect result');assert.equal((await service.state(uid)).player.field!.inventory.royal,stock);
  now=f.at+rhythm.taps[2]+10;const accepted=await service.command(uid,command),replayed=await service.command(uid,command);
  assert.equal(accepted.player.field!.lastCast!.grade,'perfect');assert.equal(accepted.player.field!.lastCast!.outcome,'caught');assert.equal(accepted.player.field!.inventory.royal,stock-1);assert.equal(accepted.player.go!.dust,dust+100);assert.deepEqual(replayed.player,accepted.player);
  await assert.rejects(()=>service.command(uid,{...command,commandId:randomUUID(),expectedRevision:accepted.player.revision}));
 }finally{store.close();}
});
