import test from 'node:test';
import assert from 'node:assert/strict';
import {MEDALS,medalScore,medalState,medalStates} from '../game/medalsV3';
import type {PlayerV2} from '../game/typesV2';

const player=(x:Record<string,unknown>)=>x as unknown as PlayerV2;
test('medals read lifetime counters and climb brons → platina',()=>{
 const jager=MEDALS.find(m=>m.id==='jager')!;
 assert.deepEqual([0,24,25,149,150,2000,99999].map(n=>medalState(jager,player({field:{total:{catches:n,perfect:0,curved:0}}})).tier),[0,0,1,1,2,4,4]);
 const s=medalState(jager,player({field:{total:{catches:87,perfect:0,curved:0}}}));assert.equal(s.next,150);assert.ok(Math.abs(s.progress-(87-25)/(150-25))<1e-9);
 assert.equal(medalState(jager,player({field:{total:{catches:5000,perfect:0,curved:0}}})).next,null);
});
test('medals tolerate a fresh player and count unique dex species and shinies',()=>{
 assert.equal(medalScore(player({})),0);
 const p=player({go:{dex:['ant','ant','beetle'],wins:0},shinies:['ant','ant']});
 const states=Object.fromEntries(medalStates(p).map(m=>[m.def.id,m.value]));
 assert.equal(states.verzamelaar,2);assert.equal(states.shinyjager,1);
 for(const m of MEDALS)assert.ok(m.goals.every((g,i)=>i===0||g>m.goals[i-1]),m.id+' goals increase');
});
test('walking medal uses km with one decimal',()=>{
 const w=MEDALS.find(m=>m.id==='wandelaar')!;assert.equal(medalState(w,player({field:{walk:{meters:5049}}})).value,5);assert.equal(medalState(w,player({field:{walk:{meters:5049}}})).tier,1);
});
