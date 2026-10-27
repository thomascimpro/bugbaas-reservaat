import {test} from 'node:test';
import assert from 'node:assert/strict';
import {judgeNet,catchChance} from '../game/fieldV2';
import {projectNetFlick} from '../game/netThrowV2';
import type {NetPoint} from '../game/fieldV2';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2} from '../server/goServiceV2';
const points=(endX=.5,ms=180):NetPoint[]=>Array.from({length:7},(_,i)=>({x:.5+(endX-.5)*i/6,y:1-.3*i/6,t:Math.round(ms*i/6)}));
const flick=(endX=.5,ms=180)=>({kind:'flick',points:points(endX,ms)});
test('quick flick skill uses landing aim and release speed without a timing ring',()=>{
 assert.equal(judgeNet(flick(),null).grade,'perfect');assert.equal(judgeNet(flick(.525),null).grade,'great');assert.equal(judgeNet(flick(.55),null).grade,'nice');assert.equal(judgeNet(flick(.7),null).grade,'miss');assert.equal(judgeNet(flick(.5,500),null).grade,'hit');assert.equal(judgeNet(flick(.5,80),null).grade,'miss');
 const a=projectNetFlick(points());assert.ok(Math.abs(a.x-.5)<.001&&Math.abs(a.y-.42)<.02);assert.ok(judgeNet(flick(.56),'dew').grade!=='miss');
});
test('curve bonus requires a genuine curved path ending in a hit; plain drags do not earn it',()=>{
 const curved=points().map((p,i)=>({...p,x:p.x+(i<4?Math.sin(i/3*Math.PI)*.2:0)}));assert.equal(judgeNet({kind:'flick',points:curved},null).curved,true);assert.equal(judgeNet(flick(),null).curved,false);
});
test('forged outcomes, invalid samples, timing and non-net origins cannot submit a flick',()=>{
 for(const bad of [{...flick(),grade:'perfect'},{kind:'other',points:points()},{kind:'flick',points:[]},flick(.5,20),flick(.5,1500),{kind:'flick',points:[{x:.5,y:.4,t:0},{x:.5,y:.1,t:180}]},{kind:'flick',points:points().map((p,i)=>i===3?{...p,x:NaN}:p)},{kind:'flick',points:points().map((p,i)=>i===3?{...p,t:0}:p)}])assert.throws(()=>judgeNet(bad,null));
});
test('new field rarity affects capture odds while legacy rates and royal hits stay intact',()=>{
 assert.equal(catchChance('ant','basic',null),.72);assert.ok(Math.abs(catchChance('lesserstag','basic',null)-.65)<1e-9);assert.ok(catchChance('giraffestag','basic',null)<catchChance('lesserstag','basic',null));assert.equal(catchChance('giraffestag','royal',null,'perfect'),1);assert.equal(catchChance('giraffestag','royal',null,'miss'),0);
});
test('fast repeat flicks remain server-authoritative and a lost-response retry never spends another net',async()=>{
 const store=new SqliteStore(':memory:');let now=Date.UTC(2026,9,26,12);const uid='flick-qa',service=new GoServiceV2(store,'local',()=>now);
 try{let v=await service.state(uid);const send=async(type:string,data:Record<string,unknown>={})=>v=await service.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});await send('worldLocate',{fix:{lat:51.4416,lng:5.4697,accuracy:5,timestamp:now}});await send('worldEncounter',{spawn:v.player.walking!.spawns[0].id});const stock=v.player.field!.inventory.basic;now+=250;
  const command={type:'worldCast',encounter:v.player.field!.encounter!.id,net:'basic',bait:null,trace:flick(.7),commandId:randomUUID(),expectedRevision:v.player.revision};v=await service.command(uid,command);assert.equal(v.player.field!.lastCast!.outcome,'miss');assert.equal(v.player.field!.inventory.basic,stock-1);v=await service.command(uid,command);assert.equal(v.player.field!.inventory.basic,stock-1);now+=400;await send('worldCast',{encounter:v.player.field!.encounter!.id,net:'basic',bait:null,trace:flick(.7)});assert.equal(v.player.field!.inventory.basic,stock-2);assert.equal(v.player.field!.encounter!.attempt,2);
 }finally{store.close();}
});
