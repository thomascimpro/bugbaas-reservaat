import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {awardGoCatch,ensureGo} from '../game/goV2';
import {actGoBattle,advanceGoBattle,makeGoBattle} from '../game/goBattleV2';
import type {GoBattleView} from '../game/goBattleV2';
import {battleReadyEnergy,BattleInputBuffer} from '../src/goBattleInputV2';

const NOW=Date.UTC(2026,9,21);
function battle(){
 const players=['input-a','input-b'].map((uid,index)=>{
  const p=freshV2(uid,index?'INPUT567':'INPUT123',NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);
  for(const [i,kind] of ['ant','beetle','moth'].entries()){
   const bug={id:uid+'-'+i,species:kind,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null};
   p.specimens.push(bug);awardGoCatch(p,bug,uid+i);p.specimens.at(-1)!.go!.level=10;
  }
  p.go!.team=p.specimens.filter(s=>s.go).map(s=>s.id);return p;
 });
 const b={...makeGoBattle(players[0],players[1],'input-test',NOW,true),side:0} as GoBattleView;b.teams[0][0].go.fast='bite';b.teams[0][0].go.charged=['cut'];return b;
}

test('rapid combat taps buffer one deliberate next attack without bypassing server cooldown or repeating',()=>{
 const b=battle(),q=new BattleInputBuffer();q.push(b,'fast',null,NOW);assert.deepEqual(q.take(b,NOW,false),{action:'fast',value:null});actGoBattle(b,0,'fast',null,NOW);
 for(let i=0;i<30;i++)q.push(b,'fast',null,NOW+100+i);
 assert.equal(q.take(b,NOW+499,true),null);
 const action=q.take(b,NOW+499,false);assert.deepEqual(action,{action:'fast',value:null});actGoBattle(b,0,action!.action,action!.value,NOW+499);
 assert.equal(b.fast[0]!.due,NOW+500);assert.equal(b.queued![0]!.due,NOW+500);
 assert.equal(q.take(b,NOW+1500,false),null);assert.equal(q.queued,null);advanceGoBattle(b,NOW+1500);assert.equal(b.teams[0][0].energy,6);
});

test('charged input keeps priority over repeated fast taps and spends the existing energy cost once',()=>{
 const b=battle(),q=new BattleInputBuffer();b.teams[0][0].energy=40;actGoBattle(b,0,'fast',null,NOW);
 q.push(b,'charged','cut',NOW+100);q.push(b,'fast',null,NOW+200);assert.equal(q.queued,'charged');assert.equal(q.take(b,NOW+200,true),null);
 const action=q.take(b,NOW+200,false)!;actGoBattle(b,0,action.action,action.value,NOW+200);assert.equal(b.phase,'fight');advanceGoBattle(b,NOW+500);assert.equal(b.phase,'charge');assert.equal(b.teams[0][0].energy,8);assert.equal(q.take(b,NOW+600,false),null);
});

test('queued input expires and never attacks with a switched, fainted or different battle unit',()=>{
 for(const change of [(b:GoBattleView)=>{b.active[0]=1;},(b:GoBattleView)=>{b.teams[0][0].hp=0;},(b:GoBattleView)=>{b.id='another-battle';},(b:GoBattleView)=>{b.phase='charge';}]){
  const b=battle(),q=new BattleInputBuffer();q.push(b,'fast',null,NOW);change(b);assert.equal(q.take(b,NOW+100,false),null);assert.equal(q.queued,null);
 }
 const b=battle(),q=new BattleInputBuffer();q.push(b,'fast',null,NOW);assert.equal(q.take(b,NOW+2501,false),null);q.push(b,'charged','cut',NOW+2600);assert.equal(q.take(b,NOW+2600,false),null);assert.equal(q.queued,null);
});

test('the final fast move can fund a queued charged move before the next state poll',()=>{
 const b=battle(),q=new BattleInputBuffer();b.teams[0][0].energy=32;actGoBattle(b,0,'fast',null,NOW);
 assert.equal(battleReadyEnergy(b),35);q.push(b,'charged','cut',NOW+100);
 const action=q.take(b,NOW+100,false)!;assert.deepEqual(action,{action:'charged',value:'cut'});actGoBattle(b,0,action.action,action.value,NOW+100);assert.equal(b.phase,'fight');assert.equal(b.teams[0][0].energy,32);advanceGoBattle(b,NOW+500);
 assert.equal(b.phase,'charge');assert.equal(b.teams[0][0].energy,0);
});

test('a deliberate switch waits for fast completion and takes priority over attack spam',()=>{
 const b=battle(),q=new BattleInputBuffer();actGoBattle(b,0,'fast',null,NOW);
 q.push(b,'fast',null,NOW+50);q.push(b,'switch',1,NOW+100);q.push(b,'charged','cut',NOW+150);q.push(b,'fast',null,NOW+200);
 assert.equal(q.queued,'switch');
 const action=q.take(b,NOW+200,false)!;actGoBattle(b,0,action.action,action.value,NOW+200);assert.equal(b.active[0],0);advanceGoBattle(b,NOW+500);
 assert.equal(b.active[0],1);assert.equal(b.teams[0][0].energy,3);assert.equal(q.take(b,NOW+600,false),null);
 q.push(b,'switch',2,NOW+600);assert.equal(q.queued,null);
});

test('a forced replacement is retained while another request finishes and bypasses voluntary cooldown',()=>{
 const b=battle(),q=new BattleInputBuffer();b.teams[0][0].hp=0;b.replaceAt[0]=NOW+10000;b.swapAt[0]=NOW+45000;
 q.push(b,'switch',2,NOW);assert.equal(q.take(b,NOW,true),null);assert.equal(q.queued,'switch');
 const action=q.take(b,NOW+100,false)!;actGoBattle(b,0,action.action,action.value,NOW+100);assert.equal(b.active[0],2);assert.equal(b.replaceAt[0],0);assert.equal(b.swapAt[0],NOW+45000);
});

test('rapid charged target taps survive busy requests, are sent once and obey server spacing',()=>{
 const b=battle(),q=new BattleInputBuffer();b.teams[0][0].energy=100;actGoBattle(b,0,'charged','cut',NOW);
 for(let i=0;i<8;i++){q.push(b,'chargeTap',i,NOW+10+i);q.push(b,'chargeTap',i,NOW+30+i);}
 assert.equal(q.pendingTargets.length,8);assert.equal(q.take(b,NOW+50,true),null);
 for(let i=0;i<8;i++){
  const at=NOW+120+i*120,action=q.take(b,at,false)!;assert.deepEqual(action,{action:'chargeTap',value:i});actGoBattle(b,0,action.action,action.value,at);
  assert.equal(q.take(b,at+50,false),null);
 }
 assert.equal(b.charge!.hits.length,8);assert.deepEqual(q.pendingTargets,[]);assert.equal(q.take(b,NOW+1200,false),null);
});

test('charge targets expire with their original charged attack and cannot leak into another',()=>{
 for(const change of [(b:GoBattleView)=>{b.id='different';},(b:GoBattleView)=>{b.charge!.startedAt++;},(b:GoBattleView)=>{b.phase='fight';b.charge=null;}]){
  const b=battle(),q=new BattleInputBuffer();b.teams[0][0].energy=100;actGoBattle(b,0,'charged','cut',NOW);q.push(b,'chargeTap',0,NOW+10);change(b);
  assert.equal(q.take(b,NOW+120,false),null);assert.deepEqual(q.pendingTargets,[]);
 }
 const b=battle(),q=new BattleInputBuffer();b.teams[0][0].energy=100;actGoBattle(b,0,'charged','cut',NOW);q.push(b,'chargeTap',0,NOW+10);assert.equal(q.take(b,NOW+6000,false),null);assert.deepEqual(q.pendingTargets,[]);
});

test('a shield choice waits through a busy request and is submitted only once',()=>{
 const b=battle(),q=new BattleInputBuffer();b.teams[1][0].go.charged=['cut'];b.teams[1][0].energy=100;actGoBattle(b,1,'charged','cut',NOW);
 q.push(b,'shield',true,NOW+100);q.push(b,'shield',false,NOW+101);assert.equal(q.pendingShield,true);assert.equal(q.take(b,NOW+100,true),null);
 const action=q.take(b,NOW+120,false)!;assert.deepEqual(action,{action:'shield',value:true});actGoBattle(b,0,action.action,action.value,NOW+120);assert.equal(q.take(b,NOW+500,false),null);
 advanceGoBattle(b,NOW+6000);assert.equal(b.shields[0],1);assert.equal(b.teams[0][0].hp,b.teams[0][0].maxHP-1);
});

test('gym charged attacks skip the shield decision and retain zero shields',()=>{
 const b=battle();b.gym={id:'test-gym',name:'Testgym',defenders:[]};b.shields=[0,0];b.teams[0][0].energy=100;
 actGoBattle(b,0,'charged','cut',NOW);assert.equal(b.charge!.shield,false);advanceGoBattle(b,NOW+6000);assert.deepEqual(b.shields,[0,0]);assert.equal(b.phase,'fight');
});

test('an NPC charge opening at request time returns its fresh phase without rejecting or replaying the old fight tap',()=>{
 for(const [action,value] of [['fast',null],['charged','cut'],['switch',1]] as const){
  const b=battle();b.training=true;b.teams[0][0].energy=50;b.teams[1][0].go.charged=['cut'];b.teams[1][0].energy=35;
  assert.doesNotThrow(()=>actGoBattle(b,0,action,value,NOW));assert.equal(b.phase,'charge');assert.equal(b.charge!.side,1);assert.equal(b.teams[0][0].energy,50);assert.equal(b.active[0],0);assert.equal(b.fast[0],null);
  actGoBattle(b,0,'shield',true,NOW+120);advanceGoBattle(b,NOW+6000);assert.equal(b.teams[0][0].energy,50);assert.equal(b.fast[0],null);
 }
});

test('a state poll opening charge before an old fight request arrives does not turn that request into a shield error',()=>{
 const b=battle();b.training=true;b.teams[1][0].go.charged=['cut'];b.teams[1][0].energy=35;advanceGoBattle(b,NOW);assert.equal(b.phase,'charge');
 for(const [action,value] of [['fast',null],['charged','cut'],['switch',1]] as const)assert.doesNotThrow(()=>actGoBattle(b,0,action,value,NOW+100));
 assert.equal(b.charge!.shield,null);assert.equal(b.active[0],0);assert.equal(b.fast[0],null);actGoBattle(b,0,'shield',true,NOW+200);assert.equal(b.charge!.shield,true);
});

test('equal human and NPC moves keep equal energy with 150 ms input latency and 600 ms state polls',()=>{
 for(const move of ['bite','wing'] as const){
  const b=battle();b.training=true;
  for(const side of [0,1] as const){const a=b.teams[side][0];a.go.fast=move;a.go.charged=[];a.hp=a.maxHP=10000;a.attack=a.defense=100;}
  const duration=move==='bite'?500:1000,late=structuredClone(b);
  // The first request reaches both fighters together. Each subsequent real
  // tap is sent 200 ms into the move and arrives 150 ms later, before due.
  actGoBattle(b,0,'fast',null,NOW+150);actGoBattle(late,0,'fast',null,NOW+150);
  for(let at=50;at<=6000;at+=50){
   if(at>=350&&(at-350)%duration===0)actGoBattle(b,0,'fast',null,NOW+150+at);
   // The old client waits until due before sending: every move then pays
   // the extra 150 ms again, while the NPC continues from its exact due.
   if(at%(duration+150)===0)actGoBattle(late,0,'fast',null,NOW+150+at);
   if(at%600===0){advanceGoBattle(b,NOW+150+at);advanceGoBattle(late,NOW+150+at);}
  }
  advanceGoBattle(b,NOW+6150);advanceGoBattle(late,NOW+6150);
  const expected=move==='bite'?36:48;assert.equal(b.teams[0][0].energy,expected);assert.equal(b.teams[1][0].energy,expected);
  assert.equal(b.teams[0][0].hp,b.teams[1][0].hp);assert.equal(b.fast[0]!.due,b.fast[1]!.due);
  assert.equal(late.teams[0][0].energy,move==='bite'?27:40);assert.equal(late.teams[1][0].energy,expected);
 }
});

test('server stores only one real follow-up and duplicate early requests never accelerate or repeat it',()=>{
 const b=battle();actGoBattle(b,0,'fast',null,NOW);actGoBattle(b,0,'fast',null,NOW+100);const revision=b.revision;
 for(let i=0;i<100;i++)actGoBattle(b,0,'fast',null,NOW+101+i);
 assert.equal(b.revision,revision);assert.equal(b.queued![0]!.due,NOW+500);assert.equal(b.teams[0][0].energy,0);
 assert.throws(()=>actGoBattle(b,0,'charged','cut',NOW+300));assert.equal(b.queued![0]!.kind,'fast');
 advanceGoBattle(b,NOW+10000);assert.equal(b.teams[0][0].energy,6);assert.equal(b.fast[0],null);assert.equal(b.queued![0],null);
});

test('a server queued fast can be replaced by charged then switch, with one slot and the original cooldown',()=>{
 const b=battle(),q=new BattleInputBuffer();b.teams[0][0].energy=32;actGoBattle(b,0,'fast',null,NOW);actGoBattle(b,0,'fast',null,NOW+100);
 q.push(b,'fast',null,NOW+120);assert.equal(q.take(b,NOW+120,false),null);
 q.push(b,'charged','cut',NOW+150);let action=q.take(b,NOW+150,false)!;actGoBattle(b,0,action.action,action.value,NOW+150);assert.equal(b.queued![0]!.kind,'charged');
 q.push(b,'fast',null,NOW+160);assert.equal(q.queued,null);
 q.push(b,'switch',1,NOW+200);action=q.take(b,NOW+200,false)!;actGoBattle(b,0,action.action,action.value,NOW+200);
 actGoBattle(b,0,'charged','cut',NOW+250);actGoBattle(b,0,'fast',null,NOW+300);assert.equal(b.queued![0]!.kind,'switch');
 advanceGoBattle(b,NOW+500);assert.equal(b.active[0],1);assert.equal(b.swapAt[0],NOW+45500);assert.equal(b.teams[0][0].energy,35);assert.equal(b.fast[0],null);assert.equal(b.queued![0],null);
});

test('a charged phase cancels the next queued tap and pauses the current fast move without leaking a repeat',()=>{
 const b=battle();actGoBattle(b,0,'fast',null,NOW);actGoBattle(b,0,'fast',null,NOW+100);b.teams[1][0].go.charged=['cut'];b.teams[1][0].energy=35;
 actGoBattle(b,1,'charged','cut',NOW+200);assert.deepEqual(b.queued,[null,null]);actGoBattle(b,0,'shield',true,NOW+300);
 advanceGoBattle(b,NOW+6200);assert.equal(b.fast[0]!.due,NOW+6500);assert.equal(b.teams[0][0].energy,0);
 advanceGoBattle(b,NOW+7000);assert.equal(b.teams[0][0].energy,3);assert.equal(b.fast[0],null);assert.deepEqual(b.queued,[null,null]);
});

test('queued follow-ups cannot decide a simultaneous knockout or survive a finished battle',()=>{
 const b=battle();for(const side of [0,1] as const){b.teams[side][0].go.fast='bite';b.teams[side][0].hp=1;b.teams[side][1].hp=b.teams[side][2].hp=0;actGoBattle(b,side,'fast',null,NOW);actGoBattle(b,side,'fast',null,NOW+100);}
 advanceGoBattle(b,NOW+500);assert.equal(b.phase,'finished');assert.equal(b.winner,null);assert.deepEqual(b.queued,[null,null]);assert.deepEqual(b.fast,[null,null]);assert.equal(b.teams[0][0].energy,3);assert.equal(b.teams[1][0].energy,3);
});

test('simultaneous queued charged attacks use combat attack rather than player side or request order',()=>{
 for(const stronger of [0,1] as const){
  const b=battle();for(const side of [0,1] as const){b.teams[side][0].go.fast='bite';b.teams[side][0].go.charged=['cut'];b.teams[side][0].energy=32;b.teams[side][0].attack=side===stronger?101:100;actGoBattle(b,side,'fast',null,NOW);}
  for(const side of [1,0] as const)actGoBattle(b,side,'charged','cut',NOW+100);advanceGoBattle(b,NOW+500);
  assert.equal(b.charge!.side,stronger);assert.equal(b.charge!.startedAt,NOW+500);assert.equal(b.teams[stronger][0].energy,0);assert.equal(b.teams[1-stronger][0].energy,35);assert.deepEqual(b.queued,[null,null]);
 }
});
