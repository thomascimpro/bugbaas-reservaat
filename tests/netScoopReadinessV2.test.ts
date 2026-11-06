import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {judgeNet,catchChance} from '../game/fieldV2';
import {validNetScoop} from '../game/netThrowV2';
import {bugPose,type NetMotion} from '../game/netMotionV2';
import {gymBattleHint} from '../game/gymsV2';
import {ArcadePlayClock} from '../src/arcade/arcadeClockV3';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2} from '../server/goServiceV2';

const stroke=(y=.42,ms=400)=>({kind:'scoop',points:Array.from({length:9},(_,i)=>({x:.2+.6*i/8,y,t:ms*i/8}))});

test('netslag rewards accurate controlled strokes in either direction, with no spin bonus',()=>{
 const grades=[.42,.47,.52,.65].map(y=>judgeNet(stroke(y),null).grade);
 assert.deepEqual(grades,['perfect','great','nice','miss']);
 assert.equal(judgeNet({kind:'scoop',points:stroke().points.map(p=>({...p,x:1-p.x}))},null).grade,'perfect');
 assert.equal(judgeNet({kind:'scoop',points:stroke().points.map(p=>({x:.5,y:p.x-.08,t:p.t}))},null).grade,'perfect');
 assert.equal(judgeNet(stroke(.42,1100),null).grade,'perfect');
 assert.equal(judgeNet(stroke(.42,130),null).grade,'hit','rushing loses the skill bonus');
 assert.equal(judgeNet(stroke(),null).curved,false);
 assert.ok(catchChance('mantis','basic',null,'perfect')>catchChance('mantis','basic',null,'hit'));
});

test('netslag rejects taps, slow drags, scribbles, forged grades and malformed samples',()=>{
 const scribble={kind:'scoop',points:stroke().points.map((p,i)=>({...p,y:i%2?.9:.1}))};
 for(const bad of [stroke(.42,50),stroke(.42,1200),scribble,{...stroke(),grade:'perfect'},{kind:'scoop',points:[{x:.5,y:.42,t:0},{x:.51,y:.42,t:400}]},{kind:'scoop',points:stroke().points.map((p,i)=>i===4?{...p,x:NaN}:p)}])assert.throws(()=>judgeNet(bad,null));
 assert.equal(validNetScoop(scribble.points),false);
});

test('netslag follows encounter motion at contact time and respects a jumping dodge',()=>{
 const motion:NetMotion={style:'hop',amp:1,wind:0},start=1800,seed='moving-net';
 const points=stroke().points.map(p=>{const pose=bugPose(motion,seed,start+p.t);return {...p,x:pose.x+(p.t/400-.5)*.6,y:pose.y};});
 assert.equal(judgeNet({kind:'scoop',points,start},null,motion,seed).grade,'miss');
 assert.equal(judgeNet(stroke(),null,motion,seed).grade,'perfect','legacy absent start stays compatible');
 const stillStart=400,still=stroke().points.map(p=>({...p,x:p.x+bugPose(motion,seed,stillStart+p.t).x-.5}));
 assert.equal(judgeNet({kind:'scoop',points:still,start:stillStart},null,motion,seed).grade,'perfect');
});

test('a server-checked netslag spends exactly one net when a response is retried',async()=>{
 const store=new SqliteStore(':memory:');let now=Date.UTC(2026,10,5,12);const uid='scoop-retry',service=new GoServiceV2(store,'local',()=>now);
 try{
  let v=await service.state(uid);const send=async(type:string,data:Record<string,unknown>={})=>v=await service.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});
  await send('worldLocate',{fix:{lat:51.4416,lng:5.4697,accuracy:5,timestamp:now}});await send('worldEncounter',{spawn:v.player.walking!.spawns[0].id});const stock=v.player.field!.inventory.basic;now+=500;
  const command={type:'worldCast',encounter:v.player.field!.encounter!.id,net:'basic',bait:null,trace:stroke(.65),commandId:randomUUID(),expectedRevision:v.player.revision};
  v=await service.command(uid,command);assert.equal(v.player.field!.lastCast!.outcome,'miss');assert.equal(v.player.field!.inventory.basic,stock-1);
  v=await service.command(uid,command);assert.equal(v.player.field!.inventory.basic,stock-1);assert.equal(v.player.field!.encounter!.attempt,1);
 }finally{store.close();}
});

test('Arcade clock gives the full round after loading and a duplicate ready cannot reset it',()=>{
 const clock=new ArcadePlayClock();assert.equal(clock.ready,false);assert.equal(clock.ticks(11000,3000),0);
 clock.start(11000);assert.equal(clock.ready,true);assert.equal(clock.ticks(11999,3000),49);clock.start(12000);assert.equal(clock.ticks(12000,3000),50);assert.equal(clock.ticks(99999,3000),3000);
});

test('a neutral NPC gym is never advertised as free after losing or a partial win',()=>{
 const defended={team:null,defenders:[{}]} as unknown as Parameters<typeof gymBattleHint>[0];
 assert.match(gymBattleHint(defended,false),/Verloren/);assert.doesNotMatch(gymBattleHint(defended,false),/Gym vrij/);
 assert.match(gymBattleHint(defended,true),/overige verdedigers/);assert.match(gymBattleHint({team:null,defenders:[]},true),/Gym vrij/);
});
