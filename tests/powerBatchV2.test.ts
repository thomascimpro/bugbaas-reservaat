import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,powerCost,powerUp,rollGoBug,stats} from '../game/goV2';
import {GoServiceV2,parseGo} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import type {Store} from '../server/store';

const NOW=Date.UTC(2026,9,24,13);
function player(level=10){const p=freshV2('batch-power','POWERQA1',NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);p.specimens=[{id:'own-bug',species:'ant',level:1,shiny:true,favorite:true,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug('ant','batch-owned'),level}}];p.go!.dust=500000;p.go!.candy.ant=500;p.go!.xl.ant=500;return p;}

test('batch power-up sums every half-level cost, matches separate upgrades and previews mixed candy/XL',()=>{
 for(const level of [1,10,10.5,20,39,45]){const p=player(level),separate=structuredClone(p),steps=level>45?4:10,cost=powerCost(level,steps)!;assert.ok(cost);const before=structuredClone(p),cp=stats(p.specimens[0]).cp;
  for(let i=0;i<steps;i++)powerUp(separate,'own-bug');powerUp(p,'own-bug',steps);assert.deepEqual(p,separate);assert.equal(p.go!.dust,before.go!.dust-cost.dust);assert.equal(p.go!.candy.ant,before.go!.candy.ant-cost.candy);assert.equal(p.go!.xl.ant,before.go!.xl.ant-cost.xl);assert.equal(p.specimens[0].go!.level,level+steps*.5);assert.ok(stats(p.specimens[0]).cp>cp);assert.deepEqual(p.specimens[0].go!.iv,before.specimens[0].go!.iv);assert.equal(p.specimens[0].shiny,true);
 }
 assert.deepEqual(powerCost(39,4),{dust:40000,candy:30,xl:20});assert.equal(powerCost(49,3),null);assert.equal(powerCost(50),null);
 const p=player(),oldClient=structuredClone(p);powerUp(p,'own-bug');powerUp(oldClient,'own-bug',1);assert.deepEqual(p,oldClient);
});

test('invalid batch size, level overflow and insufficient cumulative resources never spend partially',()=>{
 for(const steps of [0,-1,1.5,11,'2',null,NaN,Infinity]){const p=player(),before=structuredClone(p);assert.throws(()=>powerUp(p,'own-bug',steps));assert.deepEqual(p,before);}
 for(const level of [49,49.5,50]){const p=player(level),before=structuredClone(p);assert.throws(()=>powerUp(p,'own-bug',3));assert.deepEqual(p,before);}
 for(const resource of ['dust','candy','xl'] as const){const p=player(39),cost=powerCost(39,4)!;if(resource==='dust')p.go!.dust=cost.dust-1;else p.go![resource].ant=cost[resource]-1;const before=structuredClone(p);assert.throws(()=>powerUp(p,'own-bug',4),/Niet genoeg/);assert.deepEqual(p,before);}
 const p=player(40);delete p.go!.candy.ant;powerUp(p,'own-bug',2);assert.equal(p.go!.candy.ant,0);assert.equal(p.specimens[0].go!.level,41);
});

test('ten power-ups use one server command, revision and receipt; retries cannot spend or grant twice',async()=>{
 const db=new SqliteStore(':memory:');let rounds=0;const store:Store={run:async(keys,fn)=>{rounds++;return db.run(keys,fn);},query:(...args)=>db.query(...args),listPlayers:()=>db.listPlayers()};try{
  const p=player();await db.run(['v2Players:'+p.uid],d=>d.set('v2Players:'+p.uid,p));const service=new GoServiceV2(store,'local',()=>NOW),before=await service.state(p.uid),cost=powerCost(10,10)!;
  const command={type:'goPower',id:'own-bug',steps:10,commandId:randomUUID(),expectedRevision:before.player.revision};assert.doesNotThrow(()=>parseGo(command));rounds=0;const result=await service.command(p.uid,command);assert.equal(rounds,2);assert.equal(result.player.revision,before.player.revision+1);assert.equal(result.player.specimens[0].go!.level,15);assert.equal(result.player.go!.dust,before.player.go!.dust-cost.dust);assert.equal(result.player.go!.journal!.filter(e=>e.kind==='power').length,1);assert.equal((await db.query('v2GoReceipts')).length,1);
  const again=await service.command(p.uid,command);assert.deepEqual(again.player,result.player);await assert.rejects(()=>service.command(p.uid,{...command,commandId:randomUUID()}),/voortgang is veranderd/);
  await assert.rejects(()=>service.command(p.uid,{...command,steps:11,commandId:randomUUID(),expectedRevision:result.player.revision}),/1 tot 10/);assert.deepEqual((await service.state(p.uid)).player,result.player);
  assert.throws(()=>parseGo({...command,cost:0}));assert.throws(()=>parseGo({...command,level:50}));
 }finally{db.close();}
});
