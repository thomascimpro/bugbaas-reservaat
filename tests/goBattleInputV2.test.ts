import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {awardGoCatch,ensureGo} from '../game/goV2';
import {actGoBattle,advanceGoBattle,makeGoBattle} from '../game/goBattleV2';
import type {GoBattleView} from '../game/goBattleV2';
import {BattleInputBuffer} from '../src/goBattleInputV2';

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
 assert.equal(q.take(b,NOW+499,false),null);assert.equal(q.take(b,NOW+500,true),null);
 const action=q.take(b,NOW+500,false);assert.deepEqual(action,{action:'fast',value:null});actGoBattle(b,0,action!.action,action!.value,NOW+500);
 assert.equal(q.take(b,NOW+1500,false),null);assert.equal(q.queued,null);advanceGoBattle(b,NOW+1500);assert.equal(b.teams[0][0].energy,6);
});

test('charged input keeps priority over repeated fast taps and spends the existing energy cost once',()=>{
 const b=battle(),q=new BattleInputBuffer();b.teams[0][0].energy=40;actGoBattle(b,0,'fast',null,NOW);
 q.push(b,'charged','cut',NOW+100);q.push(b,'fast',null,NOW+200);assert.equal(q.queued,'charged');assert.equal(q.take(b,NOW+200,false),null);
 advanceGoBattle(b,NOW+500);const action=q.take(b,NOW+500,false)!;actGoBattle(b,0,action.action,action.value,NOW+500);assert.equal(b.phase,'charge');assert.equal(b.teams[0][0].energy,8);assert.equal(q.take(b,NOW+600,false),null);
});

test('queued input expires and never attacks with a switched, fainted or different battle unit',()=>{
 for(const change of [(b:GoBattleView)=>{b.active[0]=1;},(b:GoBattleView)=>{b.teams[0][0].hp=0;},(b:GoBattleView)=>{b.id='another-battle';},(b:GoBattleView)=>{b.phase='charge';}]){
  const b=battle(),q=new BattleInputBuffer();q.push(b,'fast',null,NOW);change(b);assert.equal(q.take(b,NOW+100,false),null);assert.equal(q.queued,null);
 }
 const b=battle(),q=new BattleInputBuffer();q.push(b,'fast',null,NOW);assert.equal(q.take(b,NOW+2501,false),null);q.push(b,'charged','cut',NOW+2600);assert.equal(q.take(b,NOW+2600,false),null);assert.equal(q.queued,null);
});
