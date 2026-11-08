import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {judgeNet} from '../game/fieldV2';
import {bugPose,type MotionStyle,type NetMotion} from '../game/netMotionV2';
import {netStrikeFocus,NET_STRIKE_CONTACT_MS} from '../game/netStrikeV2';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2} from '../server/goServiceV2';

const seed='strike-test',trace=(x=.5,y=.42,start=0,ms=400)=>({kind:'strike',start,points:[{x,y,t:0},{x,y,t:ms}]});
test('a path passing through the bug cannot catch when the strike lands elsewhere',()=>{
 const points=[{x:.2,y:.42,t:0},{x:.5,y:.42,t:200},{x:.8,y:.42,t:400}];
 assert.equal(judgeNet({kind:'scoop',points},null).grade,'perfect');
 assert.equal(judgeNet({kind:'strike',points,start:0},null).grade,'miss');
});
test('centred release requires the visible timing opportunity for Perfect, not a gesture duration trick',()=>{
 const times=Array.from({length:180},(_,i)=>600+i*20),good=times.find(t=>netStrikeFocus(undefined,seed,t))!,bad=times.find(t=>!netStrikeFocus(undefined,seed,t))!;
 assert.equal(judgeNet(trace(.5,.42,good-400-NET_STRIKE_CONTACT_MS),null,undefined,seed).grade,'perfect');
 assert.equal(judgeNet(trace(.5,.42,bad-400-NET_STRIKE_CONTACT_MS),null,undefined,seed).grade,'great');
});
test('all five bug movement styles provide distinct, attainable release opportunities',()=>{
 const patterns=new Set<string>();
 for(const style of ['crawl','flutter','hop','dart','glide'] as MotionStyle[]){
  const motion:NetMotion={style,amp:1,wind:0},times=Array.from({length:360},(_,i)=>600+i*20),ready=times.filter(t=>netStrikeFocus(motion,seed,t));
  assert.ok(ready.length>0&&ready.length<times.length/2,style);patterns.add(times.map(t=>Number(netStrikeFocus(motion,seed,t))).join(''));
  const at=ready.find(t=>!bugPose(motion,seed,t).dodge)!,p=bugPose(motion,seed,at);
  assert.equal(judgeNet(trace(p.x,p.y,at-400-NET_STRIKE_CONTACT_MS),null,motion,seed).grade,'perfect',style);
 }
 assert.equal(patterns.size,5);
});
test('a springing bug can be missed during its announced jump; landing can be hit',()=>{
 const motion:NetMotion={style:'hop',amp:1,wind:0},jumpAt=1900,p=bugPose(motion,seed,jumpAt);
 const result=judgeNet(trace(p.x,p.y,jumpAt-400-NET_STRIKE_CONTACT_MS),null,motion,seed);
 assert.equal(result.grade,'miss');assert.equal(result.dodged,true);
 const landed=bugPose(motion,seed,2300);assert.equal(judgeNet(trace(landed.x,landed.y,2300-400-NET_STRIKE_CONTACT_MS),null,motion,seed).grade,'perfect');
});
test('strike validation rejects supplied grades, missing clock, taps and nonfinite data',()=>{
 const {start,...missing}=trace();
 for(const input of [missing,{...trace(),grade:'perfect'},trace(.5,.42,-1),trace(.5,.42,0,30),trace(NaN),{...trace(),points:[{x:.5,y:.42,t:0}]}])assert.throws(()=>judgeNet(input,null));
});
test('server strike retry consumes one net and counts exactly one attempt',async()=>{
 const store=new SqliteStore(':memory:');let now=Date.UTC(2026,10,8,12);const uid='strike-retry',api=new GoServiceV2(store,'local',()=>now);
 try{
  let view=await api.state(uid);const send=async(type:string,params:Record<string,unknown>)=>view=await api.command(uid,{type,...params,commandId:randomUUID(),expectedRevision:view.player.revision});
  await send('worldLocate',{fix:{lat:51.4416,lng:5.4697,accuracy:5,timestamp:now}});await send('worldEncounter',{spawn:view.player.walking!.spawns[0].id});
  const stock=view.player.field!.inventory.basic;now+=600;
  const command={type:'worldCast',net:'basic',bait:null,encounter:view.player.field!.encounter!.id,trace:trace(1,0,0,400),commandId:randomUUID(),expectedRevision:view.player.revision};
  view=await api.command(uid,command);assert.equal(view.player.field!.lastCast!.grade,'miss');assert.equal(view.player.field!.inventory.basic,stock-1);
  view=await api.command(uid,command);assert.equal(view.player.field!.inventory.basic,stock-1);assert.equal(view.player.field!.encounter!.attempt,1);
 }finally{store.close();}
});
