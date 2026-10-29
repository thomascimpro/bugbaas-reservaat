import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEX_SPECIES} from '../game/dexV2';
import {CHARGED,ELEMENTS,FAST,TYPE_CHART,family,knownMove,legacyMoves,movePool,rollGoBug,secondAttack,teachMove,ensureGo} from '../game/goV2';
import type {Element} from '../game/goV2';
import {effectiveness} from '../game/goBattleV2';
import {saveEchoDefense,makeEchoBattle} from '../game/echoArenaV2';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';

const NOW=Date.UTC(2026,9,29,12),ids=(DEX_SPECIES as {id:string}[]).map(s=>s.id);
const OLD_FAST=['water','bite','fury','wing','poison','mud','leaf','claw','siphon','snap','metal','gust','spark'];
const OLD_CHARGED=['stream','flare','cut','buzz','air','venom','rock','seed','earth','iron','dark','needle','web','crush','shell','dive','night','sap','burst'];
function player(uid:string){const p=freshV2(uid,'QAABCDEF',NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);p.onboarded=true;p.name='QA '+uid;
 p.specimens=['ant','beetle','moth'].map((species,i)=>({id:'owned-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:15}}));p.go!.team=p.specimens.map(s=>s.id);return p;}

test('every family has one main type, spread over all eleven types with at most six Bug families',()=>{
 const main=new Map<string,Element>();
 for(const id of ids){const t=movePool(id).types[0],f=family(id);if(main.has(f))assert.equal(t,main.get(f),'family shares its main type: '+id);main.set(f,t);for(const x of movePool(id).types)assert.ok(ELEMENTS.includes(x),id);}
 assert.equal(main.size,50);const count=(t:Element)=>[...main.values()].filter(x=>x===t).length;
 for(const t of ELEMENTS)assert.ok(count(t)>=3&&count(t)<=6,t+' has '+count(t)+' families');assert.ok(count('bug')<=6);
});

test('the chart is a fair set of cycles: each type beats two and is blocked by two',()=>{
 for(const t of ELEMENTS){const c=TYPE_CHART[t];assert.equal(c.strong.length,2,t);assert.equal(c.weak.length,2,t);assert.ok(!c.strong.some(x=>c.weak.includes(x)),t);
  assert.equal(ELEMENTS.filter(a=>TYPE_CHART[a].strong.includes(t)).length,2,t+' is beaten by two types');}
 assert.ok(Math.abs(effectiveness('fire',['grass'])-1.6)<1e-9);assert.ok(Math.abs(effectiveness('fire',['water'])-.625)<1e-9);assert.ok(Math.abs(effectiveness('ground',['flying'])-.390625)<1e-9);
});

test('no attack type is super effective against more than 40% of the bugs, and each one hits some',()=>{
 for(const t of ELEMENTS){const n=ids.filter(id=>effectiveness(t,movePool(id).types)>1).length;assert.ok(n>0,t+' hits nobody');assert.ok(n<=ids.length*.4,t+' hits '+n);}
});

test('every type has two fast and two charged attacks, and every bug gets attacks of its own types',()=>{
 for(const t of ELEMENTS){assert.ok(Object.values(FAST).filter(m=>m.type===t).length>=2,t+' fast');assert.ok(Object.values(CHARGED).filter(m=>m.type===t).length>=2,t+' charged');}
 for(const id of ids){const p=movePool(id),[main]=p.types;
  assert.ok(p.fast.some(m=>FAST[m].type===main),id+' fast STAB');assert.ok(p.charged.some(m=>CHARGED[m].type===main),id+' charged STAB');
  for(const t of p.types)assert.ok([...p.fast.map(m=>FAST[m].type),...p.charged.map(m=>CHARGED[m].type)].includes(t),id+' has a '+t+' attack');
  assert.ok(p.fast.length>=3&&p.charged.length>=3,id);}
});

test('old attack ids still exist and every attack a bug could own before stays legal',()=>{
 for(const m of OLD_FAST)assert.ok(Object.hasOwn(FAST,m),m);for(const m of OLD_CHARGED)assert.ok(Object.hasOwn(CHARGED,m),m);
 for(const id of ids){const old=legacyMoves(id);for(const m of old.fast)assert.ok(knownMove(id,'fast',m),id+' '+m);for(const m of old.charged)assert.ok(knownMove(id,'charged',m),id+' '+m);}
 assert.equal(knownMove('beetle','charged','nope'),false);assert.equal(knownMove('beetle','fast',undefined),false);
});

test('a saved team with old attacks still defends, keeps its attacks and can learn new ones',()=>{
 const owner=player('old'),a=player('new'),moth=owner.specimens[2];
 const old=legacyMoves('moth'),stale=old.charged.filter(m=>!movePool('moth').charged.includes(m));assert.ok(stale.length,'moth had attacks outside the new pool');
 moth.go!.fast=old.fast.find(m=>!movePool('moth').fast.includes(m))!;moth.go!.charged=[stale[0]];const before=structuredClone(moth.go);ensureGo(owner,NOW);assert.deepEqual(moth.go,before);
 const defense=saveEchoDefense(owner,NOW);assert.doesNotThrow(()=>makeEchoBattle(a,defense,'old-moves',NOW));
 owner.go!.dust=1e6;owner.go!.candy[family('moth')]=1000;secondAttack(owner,moth.id,'second');assert.equal(moth.go!.charged[0],stale[0]);assert.ok(movePool('moth').charged.includes(moth.go!.charged[1]));
 owner.go!.chargedTMs=1;teachMove(owner,moth.id,0,'tm');assert.ok(movePool('moth').charged.includes(moth.go!.charged[0]));
});
