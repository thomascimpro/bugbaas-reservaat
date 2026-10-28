import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bugRarity,RARITY_TIERS} from '../game/rarityDisplayV2';
import {WALK_WEIGHTS} from '../game/walkingV2';
import {DEX_SPECIES} from '../game/dexV2';
import {matchup,recommendBait,recommendNet,recommendTeam} from '../game/recommendV2';
import {CHARGED,FAST,movePool,rollGoBug} from '../game/goV2';
import {effectiveness} from '../game/goBattleV2';
import type {Specimen} from '../game/typesV2';

const bug=(id:string,species:string,seed=id):Specimen=>({id,species,level:1,shiny:false,favorite:false,obtainedAt:0,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,seed),level:20}});

test('one rarity scale covers every Bugdex form and follows the wild spawn weight',()=>{
 for(const {id} of DEX_SPECIES as {id:string}[]){const t=bugRarity(id);assert.ok(t>=1&&t<=5&&RARITY_TIERS[t].name,id);}
 const wild=Object.entries(WALK_WEIGHTS),common=wild.filter(([,w])=>w>=8).map(([id])=>id),rare=wild.filter(([,w])=>w<.1).map(([id])=>id);
 assert.ok(common.length&&rare.length);assert.ok(common.every(id=>bugRarity(id)===1));assert.ok(rare.every(id=>bugRarity(id)===5));
});

test('a thumbs-up means a move hits the opponent hard and the opponent does not hit back hard',()=>{
 const pool=(DEX_SPECIES as {id:string}[]).map(s=>s.id).slice(0,60),opponent='mantis',enemy=movePool(opponent).types;
 let checked=0;
 for(const [i,id] of pool.entries()){const b=bug('b'+i,id),m=matchup(b,opponent),moves=[FAST[b.go!.fast],...b.go!.charged.map(c=>CHARGED[c])];
  assert.equal(m.strong,moves.some(mv=>effectiveness(mv.type,enemy)>1),id);
  if(m.recommended){checked++;assert.ok(m.offense>1&&m.defense<=1,id);}}
 assert.ok(checked>0,'some counters exist for a mantis');
});

test('the recommended team has three different species and prefers recommended counters',()=>{
 const bugs=['ant','ant','beetle','moth','aphid','mantis','butterfly','weevil'].map((s,i)=>bug('t'+i,s));
 const ids=recommendTeam(bugs,'mantis');assert.equal(ids.length,3);
 const species=ids.map(id=>bugs.find(b=>b.id===id)!.species);assert.equal(new Set(species).size,3,'no duplicate species');
 const firstRecommended=bugs.filter(b=>matchup(b,'mantis').recommended).length;
 if(firstRecommended)assert.ok(matchup(bugs.find(b=>b.id===ids[0])!,'mantis').recommended,'a recommended counter comes first when one exists');
});

test('catch advice saves good nets for rare bugs and only suggests what is in the bag',()=>{
 const bag={basic:10,blue:2,silk:1,royal:1,pollen:2,fruit:3,gold:1};
 assert.equal(recommendNet(bag,1,.8),'basic');assert.equal(recommendNet(bag,4,.5),'silk');assert.equal(recommendNet(bag,5,.2),'royal');assert.equal(recommendNet({basic:3},4,.1),'basic');
 assert.equal(recommendNet({basic:3,blue:1},2,.2),'blue','a hard catch gets a better net even if the bug is common');
 assert.equal(recommendBait(bag,1,.8),'fruit');assert.equal(recommendBait(bag,4,.5),'gold');assert.equal(recommendBait(bag,3,.5),'pollen');assert.equal(recommendBait({},5,.1),null);
});
