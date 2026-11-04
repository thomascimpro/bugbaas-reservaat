import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2} from '../server/goServiceV2';
import {freshV2} from '../game/safariV2';
import {ensureGo,rollGoBug,stats,family} from '../game/goV2';
import {ensureField} from '../game/fieldV2';
import {arcadeSquad,createTapState,stepTap,tapTarget,targetPosition,replayTap,validateTapInputs,arcadeDamage,DURATION_TICKS} from '../game/arcade/tapDuel';
import type {ArcadeTap,ArcadeTicket} from '../game/arcade/tapDuel';
import {playOriginalTap} from './originalArcadeDriver';
import {isOriginalRules} from '../game/arcade/original';
import {arcadeRunKey,arcadeProgress} from '../server/arcadeServiceV3';

const NOW=Date.UTC(2026,10,3,12);
function player(uid='arcade-player'){
 const p=freshV2(uid,uid.padEnd(8,'0').slice(0,8).toUpperCase(),NOW);ensureField(p,NOW);ensureGo(p,NOW);p.onboarded=true;
 p.specimens=['ant','moth','beetle'].map((species,i)=>({id:uid+'-'+i,species,level:1,shiny:i===1,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:10}}));p.go!.team=p.specimens.map(b=>b.id);return p;
}
function play(ticket:ArcadeTicket,chunk=1,scoreLimit=Infinity){
 if(isOriginalRules(ticket))return playOriginalTap(ticket,scoreLimit);
 return legacyPlay(ticket,chunk,scoreLimit);
}
function legacyPlay(ticket:ArcadeTicket,chunk=1,scoreLimit=Infinity){
 const state=createTapState(ticket.squad,ticket.seed,ticket.league),inputs:ArcadeTap[]=[];
 while(!state.finished){
  if(state.tick%5===0&&state.targets.length){const target=[...state.targets].sort((a,b)=>a.hp-b.hp||a.id-b.id)[0],pos=targetPosition(ticket.seed,target,state.tick),input=state.score<scoreLimit?{tick:state.tick,x:Math.round(pos.x/360*1000),y:Math.round(pos.y/640*1000)}:{tick:state.tick,x:0,y:0};inputs.push(input);tapTarget(state,ticket.seed,input);}
  // Group render frames differently; the simulation still receives the same individual ticks.
  const next=Math.min(DURATION_TICKS,state.tick+chunk);do{stepTap(state,ticket.seed,ticket.league);}while(!state.finished&&state.tick<next&&state.tick%5!==0);
 }
 return {state,inputs};
}
function ticket():ArcadeTicket{const p=player();return {id:randomUUID(),owner:p.uid,challenge:'test',rules:'tap-1',league:'great',seed:42,squad:arcadeSquad(p,p.go!.team,'great'),issuedAt:NOW,expiresAt:NOW+86400000,target:{name:'Veldwachter',score:80,kind:'computer'},status:'started'};}
async function setup(){const store=new SqliteStore(':memory:'),clock={now:NOW},service=new GoServiceV2(store,'local',()=>clock.now),p=player();await service.state(p.uid);await store.run(['v2Players:'+p.uid],d=>d.set('v2Players:'+p.uid,p));let view=await service.state(p.uid);return {store,clock,service,uid:p.uid,get view(){return view;},async send(type:string,params:Record<string,unknown>={},revision?:number,commandId=randomUUID()){/* Keep reward/replay regressions on newly issued original Tikduel; rotation has separate coverage. */if(type==='arcadeStart')await store.run(['v2Players:'+p.uid],d=>{arcadeProgress(d.get('v2Players:'+p.uid) as ReturnType<typeof player>,clock.now).nextGame='tap_duel';});view=await service.command(p.uid,{type,...params,expectedRevision:revision??view.player.revision,commandId});return view;}};}

test('client/server replay agrees; grouped render frames cannot change score, HP or targets',()=>{
 const t=ticket(),before=structuredClone(t),one=play(t),many=play(t,7),replayed=replayTap(t,one.inputs);
 assert.deepEqual(one.inputs,many.inputs);assert.deepEqual(one.state,many.state);assert.deepEqual(one.state,replayed.state);assert.ok(one.state.score>0);assert.ok(replayed.qualified);assert.deepEqual(t,before);
});
test('real stats, IV/item boosts, move typing and CP caps remain relevant without changing owned bugs',()=>{
 const p=player(),before=structuredClone(p.specimens),squad=arcadeSquad(p,p.go!.team,'great');assert.equal(squad[0].attack,stats(p.specimens[0]).attack);assert.deepEqual(p.specimens,before);
 const lowIV=structuredClone(p),highIV=structuredClone(p);lowIV.specimens[0].go!.iv=[0,0,0];lowIV.specimens[0].go!.item=null;highIV.specimens[0].go!.iv=[15,15,15];highIV.specimens[0].go!.item=null;
 const low=arcadeSquad(lowIV,[lowIV.specimens[0].id],'great')[0],high=arcadeSquad(highIV,[highIV.specimens[0].id],'great')[0];assert.ok(high.attack>low.attack&&high.defense>low.defense&&high.hp>low.hp);
 highIV.specimens[0].go!.item='thorn';assert.ok(arcadeSquad(highIV,[highIV.specimens[0].id],'great')[0].attack>high.attack);assert.deepEqual(p.specimens,before);
 const opponent={defense:70,types:['grass'] as const},a={attack:120,types:['fire'] as const};
 assert.ok(arcadeDamage({...a,types:[...a.types]}, {...opponent,types:[...opponent.types]},'fire',10)>arcadeDamage({attack:80,types:['normal']},{defense:70,types:['grass']},'normal',10));
 p.specimens[0].go!.level=50;assert.throws(()=>arcadeSquad(p,[p.specimens[0].id],'great'),/te sterk/);assert.throws(()=>arcadeSquad(p,['someone-else'],'great'),/zelfgevangen/);assert.throws(()=>arcadeSquad(p,[],'great'),/1 tot 3/);
});
test('off-target taps do no damage; malformed, accelerated and oversized input is rejected',()=>{
 const t=ticket(),state=createTapState(t.squad,t.seed,t.league);assert.equal(tapTarget(state,t.seed,{tick:0,x:0,y:0}),false);assert.equal(state.score,0);assert.equal(state.targets[0].hp,state.targets[0].maxHP);
 for(const raw of [[{tick:0,x:NaN,y:1}],[{tick:0,x:1,y:1,score:999}],[{tick:1,x:1,y:1},{tick:2,x:2,y:2}],Array(451).fill({tick:0,x:0,y:0})])assert.throws(()=>validateTapInputs(raw));
});
test('impact events retain their actual target position after defeat and later ticks',()=>{
 const t=ticket(),state=createTapState(t.squad,t.seed,t.league),target=state.targets[0];
 state.tick=123;target.born=100;target.hp=1;
 const pos=targetPosition(t.seed,target,state.tick);
 assert.equal(tapTarget(state,t.seed,{tick:state.tick,x:Math.round(pos.x/360*1000),y:Math.round(pos.y/640*1000)}),true);
 const effect=state.effects.at(-1)!;assert.equal(effect.kind,'defeat');assert.equal(state.targets.some(enemy=>enemy.id===target.id),false);
 assert.deepEqual({x:effect.x,y:effect.y},pos);stepTap(state,t.seed,t.league);
 assert.deepEqual({x:effect.x,y:effect.y},pos);
});
test('a submitted round is server-replayed once, survives a revision change and ignores duplicate receipts',async()=>{
 const box=await setup();try{
  const start=await box.send('arcadeStart',{ids:box.view.player.go!.team,league:'great'}),run=start.arcadeTicket!,result=play(run),revision=start.player.revision,before=start.player.go!.dust;
  await box.send('favorite',{id:start.player.specimens[0].id});box.clock.now+=45000;
  const accepted=await box.send('arcadeSubmit',{run:run.id,inputs:result.inputs},revision);assert.equal(accepted.player.arcade!.last!.score,result.state.score);assert.equal(accepted.player.go!.dust,before+175);assert.equal(accepted.player.arcade!.rewarded,1);assert.equal(accepted.arcadeTicket,undefined);
  const repeat=await box.send('arcadeSubmit',{run:run.id,inputs:[]});assert.equal(repeat.player.go!.dust,accepted.player.go!.dust);assert.equal(repeat.player.arcade!.completed,1);
 }finally{box.store.close();}
});
test('three daily earning rounds, persisted earlier human score, and no reward for a fourth/empty/abandoned round',async()=>{
 const box=await setup();try{const before=box.view.player.go!.dust;for(let i=0;i<4;i++){const v=await box.send('arcadeStart',{ids:box.view.player.go!.team,league:'great'}),t=v.arcadeTicket!,r=play(t);box.clock.now+=45000;await box.send('arcadeSubmit',{run:t.id,inputs:r.inputs});}
  assert.equal(box.view.player.go!.dust,before+325);assert.equal(box.view.player.arcade!.dailyXP,60);assert.equal(box.view.player.arcade!.rewarded,3);assert.equal(box.view.player.arcade!.completed,4);
  const rows=await box.store.query<{uid:string;score:number}>('v2ArcadeScores');assert.equal(rows.length,1);assert.ok(rows[0].score>0);
  const v=await box.send('arcadeStart',{ids:box.view.player.go!.team,league:'great'});assert.equal(v.arcadeTicket!.target.kind,'personal');const id=v.arcadeTicket!.id;await box.send('arcadeAbandon',{run:id});await assert.rejects(box.send('arcadeSubmit',{run:id,inputs:[]}),/afgesloten/);
 }finally{box.store.close();}
});
test('active runs are exclusive, early submissions and other owners are rejected; no partial currency writes',async()=>{
 const box=await setup();try{
  const v=await box.send('arcadeStart',{ids:box.view.player.go!.team,league:'great'}),t=v.arcadeTicket!,r=play(t),before=v.player.go!.dust;
  await assert.rejects(box.send('arcadeStart',{ids:v.player.go!.team,league:'great'}),/opgeslagen ronde/);
  await assert.rejects(box.send('arcadeSubmit',{run:t.id,inputs:r.inputs}),/nog niet afgelopen/);
  const other='other-arcade-owner';await box.service.state(other);await assert.rejects(box.service.command(other,{type:'arcadeSubmit',run:t.id,inputs:r.inputs,commandId:randomUUID(),expectedRevision:0}),/niet van jou/);
  assert.equal((await box.service.state(box.uid)).player.go!.dust,before);
  const saved=await box.store.run([arcadeRunKey(box.uid,t.id)],d=>d.get(arcadeRunKey(box.uid,t.id)) as ArcadeTicket);assert.equal(saved.status,'started');
 }finally{box.store.close();}
});
test('a real earlier player on the same challenge earns exactly the human win bonus; the frozen target does not rise mid-run',async()=>{
 const box=await setup();try{
  const first=await box.send('arcadeStart',{ids:box.view.player.go!.team,league:'great'}),older=first.arcadeTicket!,low=play(older,1,10);box.clock.now+=45000;
  const saved=await box.send('arcadeSubmit',{run:older.id,inputs:low.inputs});assert.equal(saved.player.arcade!.last!.qualified,true);assert.equal(saved.player.arcade!.last!.score,low.state.score);assert.ok(low.state.score>0);
  const other=player('human-two-fixture');await box.service.state(other.uid);await box.store.run(['v2Players:'+other.uid],d=>d.set('v2Players:'+other.uid,other));let otherView=await box.service.state(other.uid);
  otherView=await box.service.command(other.uid,{type:'arcadeStart',ids:other.go!.team,league:'great',commandId:randomUUID(),expectedRevision:otherView.player.revision});const run=otherView.arcadeTicket!,result=play(run),before=otherView.player.go!.dust;
  assert.equal(run.challenge,older.challenge);assert.equal(run.seed,older.seed);assert.deepEqual(run.target,{name:saved.player.name,score:low.state.score,kind:'player'});assert.ok(result.state.score>run.target.score);
  // The first player improves while the second is already playing; its fixed target remains the earlier earned score.
  const improvement=await box.send('arcadeStart',{ids:box.view.player.go!.team,league:'great'}),improvedRun=improvement.arcadeTicket!,improved=play(improvedRun);box.clock.now+=45000;
  const improvedView=await box.send('arcadeSubmit',{run:improvedRun.id,inputs:improved.inputs});assert.ok(improvedView.player.arcade!.last!.score>low.state.score);
  otherView=await box.service.command(other.uid,{type:'arcadeSubmit',run:run.id,inputs:result.inputs,commandId:randomUUID(),expectedRevision:otherView.player.revision});
  assert.equal(otherView.player.arcade!.last!.score,result.state.score);assert.equal(otherView.player.arcade!.last!.won,true);assert.equal(otherView.player.arcade!.last!.dust,200);assert.equal(otherView.player.arcade!.last!.xp,20);assert.equal(otherView.player.go!.dust,before+200);
  const persisted=await box.store.run([arcadeRunKey(other.uid,run.id)],d=>d.get(arcadeRunKey(other.uid,run.id)) as ArcadeTicket);assert.equal(persisted.target.score,low.state.score);
 }finally{box.store.close();}
});
test('UTC rollover resets the acceptance-day reward budget while preserving old challenge records and lifetime completion',async()=>{
 const box=await setup();try{
  box.clock.now=Date.UTC(2026,10,3,23,55);const before=box.view.player.go!.dust;
  for(let i=0;i<3;i++){const start=await box.send('arcadeStart',{ids:box.view.player.go!.team,league:'great'}),run=start.arcadeTicket!,result=play(run);box.clock.now+=45000;await box.send('arcadeSubmit',{run:run.id,inputs:result.inputs});}
  assert.equal(box.view.player.arcade!.rewarded,3);assert.equal(box.view.player.go!.dust,before+325);
  box.clock.now=Date.UTC(2026,10,3,23,59,50);const late=await box.send('arcadeStart',{ids:box.view.player.go!.team,league:'great'}),oldRun=late.arcadeTicket!,oldResult=play(oldRun),oldBest=box.view.player.arcade!.best[oldRun.challenge];box.clock.now+=45000;
  const accepted=await box.send('arcadeSubmit',{run:oldRun.id,inputs:oldResult.inputs});assert.equal(oldRun.challenge.split(':')[0],'2026-11-03');assert.equal(accepted.player.arcade!.day,'2026-11-04');assert.equal(accepted.player.arcade!.last!.dust,175);assert.equal(accepted.player.arcade!.dailyXP,20);assert.equal(accepted.player.arcade!.rewarded,1);assert.equal(accepted.player.arcade!.completed,4);assert.ok(accepted.player.arcade!.best[oldRun.challenge]>=oldBest);
  const next=await box.send('arcadeStart',{ids:box.view.player.go!.team,league:'great'}),newRun=next.arcadeTicket!,newResult=play(newRun);assert.notEqual(newRun.challenge,oldRun.challenge);assert.notEqual(newRun.seed,oldRun.seed);box.clock.now+=45000;
  const second=await box.send('arcadeSubmit',{run:newRun.id,inputs:newResult.inputs});assert.equal(second.player.arcade!.last!.dust,75);assert.equal(second.player.arcade!.dailyDust,250);assert.equal(second.player.arcade!.dailyXP,40);assert.equal(second.player.arcade!.completed,5);assert.ok(second.player.arcade!.best[oldRun.challenge]>0);assert.ok(second.player.arcade!.best[newRun.challenge]>0);
 }finally{box.store.close();}
});
test('legitimate power-up and held-item changes after issue preserve the historical squad and do not undo collection changes at submit',async()=>{
 const box=await setup();try{
  await box.store.run(['v2Players:'+box.uid],d=>{const p=d.get('v2Players:'+box.uid) as ReturnType<typeof player>;p.go!.dust=100000;p.go!.candy[family(p.specimens[0].species)]=50;p.go!.items.thorn=1;});
  const start=await box.send('arcadeStart',{ids:box.view.player.go!.team,league:'great'}),run=start.arcadeTicket!,snapshot=structuredClone(run.squad),result=play(run),revision=start.player.revision,id=snapshot[0].id;
  await box.send('goPower',{id,steps:1});const equipped=await box.send('goEquip',{id,item:'thorn'}),current=equipped.player.specimens.find(b=>b.id===id)!;assert.ok(stats(current).attack>snapshot[0].attack);assert.equal(current.go!.level,10.5);assert.equal(current.go!.item,'thorn');
  const saved=await box.store.run([arcadeRunKey(box.uid,run.id)],d=>d.get(arcadeRunKey(box.uid,run.id)) as ArcadeTicket);assert.deepEqual(saved.squad,snapshot);const before=equipped.player.go!.dust;box.clock.now+=45000;
  const accepted=await box.send('arcadeSubmit',{run:run.id,inputs:result.inputs},revision);assert.equal(accepted.player.arcade!.last!.score,result.state.score);assert.equal(accepted.player.go!.dust,before+175);assert.deepEqual(accepted.player.specimens.find(b=>b.id===id)!.go,current.go);assert.deepEqual(run.squad,snapshot);
 }finally{box.store.close();}
});
