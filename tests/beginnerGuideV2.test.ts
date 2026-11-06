import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2} from '../server/goServiceV2';
import type {GoBattle} from '../game/goBattleV2';
import {freshV2} from '../game/safariV2';
import {ensureGo,rollGoBug} from '../game/goV2';
import {beginnerSteps,unlockLevel,guidePeeks} from '../game/beginnerGuideV2';
import type {PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,9,28,12);
function player(){const p=freshV2('kid','KIDS001',NOW);ensureGo(p,NOW);p.specimens=p.specimens.filter(s=>s.source!=='walking');return p;}
const catchOf=(p:PlayerV2,species:string,i:number)=>p.specimens.push({id:'w'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null});
const next=(p:PlayerV2,level=1,local:string[]=[])=>beginnerSteps(p,level,local).find(s=>!s.done)?.id;

test('a brand-new player starts with one simple goal: catch a bug',()=>{
 const p=player();assert.equal(next(p),'first-catch');
 assert.equal(beginnerSteps(p,1,[]).filter(s=>!s.done).length,6,'all six steps open for a new player');
});

test('real catches, post spins and taps move the guide forward in order',()=>{
 const p=player();catchOf(p,'ant',1);assert.equal(next(p),'three-kinds');
 catchOf(p,'ant',2);assert.equal(next(p),'three-kinds','the same species twice does not count as a new kind');
 catchOf(p,'beetle',3);catchOf(p,'aphid',4);assert.equal(next(p),'spin-post');
 p.go!.sites={visits:{'post-1':NOW},firstDay:'',routeClaims:[],run:null};assert.equal(next(p),'see-bugs');
 assert.equal(next(p,1,['see-bugs']),'bugdex');assert.equal(next(p,1,['see-bugs','bugdex']),'first-battle');
});

test('battles wait for level 5 and the last step points there first',()=>{
 const p=player(),low=beginnerSteps(p,3,[]).find(s=>s.id==='first-battle')!,high=beginnerSteps(p,5,[]).find(s=>s.id==='first-battle')!;
 assert.equal(low.action,'nearby');assert.match(low.title,/level 5/);assert.notEqual(low.markOnAction,true);
 assert.equal(high.action,'battle');assert.equal(high.markOnAction,undefined);
 assert.equal(high.done,false,'navigating to battle never completes the task');
 assert.equal(beginnerSteps(p,5,['first-battle']).find(s=>s.id==='first-battle')!.done,false,'old local tap state cannot fake battle completion');
 p.go!.guideFirstBattle=true;
 assert.equal(beginnerSteps(p,5,[]).find(s=>s.id==='first-battle')!.done,true,'server-confirmed battle completes the guide');
});

test('menu unlock levels follow the beginner path',()=>{
 assert.equal(unlockLevel('Bugdex'),1);assert.equal(unlockLevel('Bugs'),1);assert.equal(unlockLevel('Veldtas'),1);
 assert.equal(unlockLevel('Shop'),3);assert.equal(unlockLevel('Cocons'),3);
 assert.equal(unlockLevel('Strijd'),5);assert.equal(unlockLevel('Gyms'),5);assert.equal(unlockLevel('Vrienden'),5);
});

test('first battle guide only completes after server settlement, never after surrender or navigation',async()=>{
 const store=new SqliteStore(':memory:');
 try{
  const p=player();p.onboarded=true;
  p.specimens=['ant','beetle','moth'].map((species,i)=>({id:'bug-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking' as const,hearts:0,item:null,go:rollGoBug(species,'guide-'+i)}));
  p.go!.team=p.specimens.map(s=>s.id);
  await store.run(['v2Players:kid'],d=>d.set('v2Players:kid',p));
  const service=new GoServiceV2(store,'local',()=>NOW);
  let view=await service.state('kid');
  const send=async(type:string,params:Record<string,unknown>={})=>{
   view=await service.command('kid',{type,...params,commandId:randomUUID(),expectedRevision:view.player.revision});
  };
  assert.equal(beginnerSteps(view.player,5,['first-battle']).at(-1)!.done,false,'old local click cannot complete it');
  await send('goTrain');
  assert.equal(beginnerSteps(view.player,5,[]).at(-1)!.done,false,'opening battle does not count');
  await send('goAct',{action:'forfeit',value:null});
  assert.equal(beginnerSteps(view.player,5,[]).at(-1)!.done,false,'surrender is not a completed match');
  await send('goClose');
  await send('goTrain');
  const battleId=view.goBattle!.id;
  await store.run(['v2GoBattles:'+battleId],d=>{
   const b=d.get('v2GoBattles:'+battleId) as GoBattle;
   b.phase='finished';b.winner=0;b.teams[1].forEach(f=>f.hp=0);
   b.events.push({id:b.serial+1,side:0,kind:'damage',amount:1});
  });
  view=await service.state('kid');
  assert.equal(beginnerSteps(view.player,5,[]).at(-1)!.done,true,'a settled battle completes it');
  assert.equal(view.player.go!.guideFirstBattle,true);
  const again=await service.state('kid');
  assert.equal(again.player.go!.guideFirstBattle,true,'achievement remains after refresh');
 }finally{store.close();}
});

test('a folded quest card only pops open when a new step starts',()=>{
 assert.equal(guidePeeks(true,'first-catch','three-kinds'),true);assert.equal(guidePeeks(true,'three-kinds','three-kinds'),false);assert.equal(guidePeeks(false,'first-catch','three-kinds'),false);
});
