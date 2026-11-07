import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {ArcadeTicket} from '../game/arcade/tapDuel';
import type {OriginalInput} from '../game/arcade/original/types';
import {originalTapCatalog} from '../game/arcade/original/tapCatalog';
import {originalTapDuel,originalPickBugIds,originalPointsByRarity,originalTapsByRarity,originalTargetMotion,originalTapTargets} from '../game/arcade/original/tapDuel';
import {originalButterflyCatch,originalButterflyWorldPosition,originalButterflyProjection,originalFlyingBugSpecs,type OriginalButterflyCatchState} from '../game/arcade/original/butterflyCatch';
import {species} from '../game/catalogV2';
import {tapHitFeedback} from '../src/arcade/original/tapFeedback';
import {tapDrawOrder} from '../src/arcade/original/tapDrawOrder';

test('every native Butterfly loading/fallback sprite resolves to a real catalogue species',()=>{
 for(const bug of originalFlyingBugSpecs)assert.equal(species(bug.sprite).id,bug.sprite);
});

const ticket=(game:'tap_duel'|'butterfly_catch',squad=false):ArcadeTicket=>({id:'original-'+game,owner:'qa',challenge:'qa',game,rules:'original-2',league:'great',seed:42,squad:squad?[{id:'a',species:'ant',shiny:false,cp:700,attack:160,defense:130,hp:150,fast:'leaf',types:['grass']},{id:'b',species:'moth',shiny:false,cp:900,attack:160,defense:130,hp:150,fast:'gust',types:['flying','bug']}]:[],issuedAt:0,expiresAt:999999,target:{name:'qa',score:0,kind:'computer'},status:'started'});

test('original Tap uses original1000-entry pool,56 seeded targets, rarity taps/points and exact30s limit',()=>{
 const t=ticket('tap_duel'),s=originalTapDuel.create(t);
 assert.equal(originalTapCatalog.length,1000);assert.equal(s.bugIds.length,56);assert.equal(new Set(s.bugIds).size,56);
 let value=42;const expected=originalTapCatalog.map(e=>{value=value*16807%2147483647;return{id:e.id,sort:(value-1)/2147483646};}).sort((a,b)=>a.sort-b.sort).slice(0,56).map(e=>e.id);
 assert.deepEqual(originalPickBugIds(42),expected);assert.notDeepEqual(originalPickBugIds(43),expected);
 assert.deepEqual(Object.values(originalTapsByRarity),[2,3,5,7,9]);assert.deepEqual(Object.values(originalPointsByRarity),[1,2,4,6,9]);
 for(let n=0;n<1500;n++)originalTapDuel.step(s,t,20);assert.equal(s.elapsedMs,30000);assert.equal(s.finished,true);assert.equal(s.reason,'time');assert.equal(originalTapDuel.input(s,t,{tick:1500,x:500,y:500}),false);
});

test('original Tap trajectory matches golden outputs from old targetMotion across all five rarities',()=>{
 const cases=[
  ['Gewoon',0,1200,.2969230769230769,21.849230769230765,49.59569150730803,22.35278905964078],
  ['Zeldzaam',9,7500,.5188545454545455,40.850581818181816,46.300510350264105,-3.476843730693436],
  ['Episch',19,14000,.5985337243401758,31.767155425219954,4,2.4371786895271885],
  ['Legendarisch',29,20000,.6100737100737103,30.451597051597034,50.53420077720502,-22.823591556904795],
  ['Mythisch',55,29990,.07441860465116279,91.51627906976745,17.497529578412397,5.237008179601963],
 ] as const;
 for(const [rarity,index,at,progress,x,y,rotate] of cases){const actual=originalTargetMotion(index,42,at,rarity,{speedMultiplier:1});assert.equal(actual.visible,true);for(const [got,want] of [[actual.progress,progress],[actual.x,x],[actual.y,y],[actual.rotate,rotate]])assert.ok(Math.abs(got-want)<1e-11);}
 assert.equal(originalTargetMotion(55,42,29349,'Gewoon',{speedMultiplier:1}).visible,false);
});

test('an overlap tap damages the bug painted in front, without changing server priority',()=>{
 const t=ticket('tap_duel'),s=originalTapDuel.create(t);
 for(let i=0;i<168;i++)originalTapDuel.step(s,t,20);
 const targets=originalTapTargets(s,t),order=targets.map(v=>v.bugId),x=610*.36,y=789*.64;
 const painted=tapDrawOrder(targets),overlap=painted.filter(v=>x>=v.motion.x*3.6&&x<=v.motion.x*3.6+v.size&&y>=v.motion.y*6.4&&y<=v.motion.y*6.4+v.size);
 assert.ok(overlap.length>=2,'fixed seed must reproduce the overlapping bugs');
 const front=overlap.at(-1)!,before=s.hitCounts[front.bugId]??0;
 assert.equal(originalTapDuel.input(s,t,{tick:168,x:610,y:789,action:'down'}),true);
 assert.equal(s.hitCounts[front.bugId],before+1,'the visible front bug must receive the tap');
 assert.deepEqual(targets.map(v=>v.bugId),order,'painting must not mutate hit-test order');
});

test('hit feedback follows the same moving bug and expires after140ms',()=>{
 const t=ticket('tap_duel'),s=originalTapDuel.create(t);
 for(let i=0;i<60;i++)originalTapDuel.step(s,t,20);
 const target=originalTapTargets(s,t).find(v=>v.motion.x>0&&v.motion.x<85)!;
 assert.ok(target.required>1);
 originalTapDuel.input(s,t,{tick:60,x:Math.round((target.motion.x*3.6+target.size/2)/.36),y:Math.round((target.motion.y*6.4+target.size/2)/.64)});
 originalTapDuel.step(s,t,100);
 const moved=originalTapTargets(s,t).find(v=>v.bugId===target.bugId)!;
 assert.notEqual(moved.motion.x,target.motion.x);
 assert.ok(tapHitFeedback(moved,s.effects,s.elapsedMs),'moving away from the impact coordinate must not hide feedback');
 const other=originalTapTargets(s,t).find(v=>v.bugId!==target.bugId);
 if(other)assert.equal(tapHitFeedback(other,s.effects,s.elapsedMs),undefined);
 assert.equal(tapHitFeedback(moved,s.effects,1340),undefined);
});

test('Tap multiple hits, every-fifth combo, helpers and browser-style input log replay agree',()=>{
 const t=ticket('tap_duel',true),s=originalTapDuel.create(t),inputs:OriginalInput[]=[],before=structuredClone(t);
 while(!s.finished){if(s.elapsedMs%100===0){const target=originalTapTargets(s,t).find(a=>a.motion.x>0&&a.motion.x<85);if(target){const i:OriginalInput={tick:s.elapsedMs/20,x:Math.round((target.motion.x*3.6+target.size/2)/.36),y:Math.round((target.motion.y*6.4+target.size/2)/.64),action:'down'};inputs.push(i);originalTapDuel.input(s,t,i);}}originalTapDuel.step(s,t,20);}
 const replay=originalTapDuel.create(t);let cursor=0;while(!replay.finished){while(inputs[cursor]?.tick===replay.elapsedMs/20)originalTapDuel.input(replay,t,inputs[cursor++]);originalTapDuel.step(replay,t,20);}
 assert.deepEqual(replay,s);assert.deepEqual(t,before);assert.ok(s.tapHits>0);assert.ok(s.helperHits>0);assert.ok(s.caughtBugIds.length>0);assert.ok(s.score>0);
 // Fifth capture inside the original650ms grace gives exactly one extra point.
 const q=originalTapDuel.create(ticket('tap_duel'));q.elapsedMs=1200;q.combo=4;q.lastCatchAt=1190;
 const target=originalTapTargets(q,ticket('tap_duel')).find(a=>a.motion.x>0&&a.motion.x<85)!;q.hitCounts[target.bugId]=target.required-1;
 originalTapDuel.input(q,ticket('tap_duel'),{tick:60,x:Math.round((target.motion.x*3.6+target.size/2)/.36),y:Math.round((target.motion.y*6.4+target.size/2)/.64)});
 assert.equal(q.combo,5);assert.equal(q.score,originalPointsByRarity[target.rarity]+1);
});

function stationary(s:OriginalButterflyCatchState){s.bugs=s.bugs.slice(0,1);s.bugs[0].points=Array.from({length:12},()=>[0,1.78,-3]);}
test('working WEB Butterfly requires1.5s focus, swings at48% of880ms, recovers980ms, exact score/streak/respawn',()=>{
 const t=ticket('butterfly_catch'),s=originalButterflyCatch.create(t);stationary(s);
 for(let n=0;n<73;n++)originalButterflyCatch.step(s,t,20);assert.ok(s.focusProgress<.98);
 for(let n=0;n<2;n++)originalButterflyCatch.step(s,t,20);assert.ok(Math.abs(s.focusProgress-1)<1e-12);
 assert.equal(originalButterflyCatch.input(s,t,{tick:75,x:500,y:500,control:'catch'}),true);assert.equal(s.captureCooldownUntil,2480);
 for(let n=0;n<21;n++)originalButterflyCatch.step(s,t,20);assert.equal(s.catches,0);
 originalButterflyCatch.step(s,t,20);assert.equal(s.catches,1);assert.equal(s.score,3);assert.equal(s.streak,1);assert.equal(s.bugs[0].caughtUntil,s.elapsedMs+2720);
 assert.equal(originalButterflyCatch.input(s,t,{tick:s.elapsedMs/20,x:500,y:500,control:'catch'}),false);
 // Same species second perfect catch is round(2*1.5)+25, retaining the original combo.
 s.elapsedMs=s.bugs[0].caughtUntil;originalButterflyCatch.step(s,t,20);s.focusProgress=1;s.aimedBug=0;
 originalButterflyCatch.input(s,t,{tick:s.elapsedMs/20,x:500,y:500,control:'catch'});for(let n=0;n<22;n++)originalButterflyCatch.step(s,t,20);
 assert.equal(s.catches,2);assert.equal(s.score,31);assert.equal(s.bestStreak,2);
});

test('Butterfly early tap misses, breaks streak and triggers original780ms dodge;360 drag is camera movement',()=>{
 const t=ticket('butterfly_catch'),s=originalButterflyCatch.create(t);stationary(s);originalButterflyCatch.step(s,t,20);s.streak=3;
 originalButterflyCatch.input(s,t,{tick:1,x:500,y:500,control:'catch'});for(let n=0;n<22;n++)originalButterflyCatch.step(s,t,20);
 assert.equal(s.misses,1);assert.equal(s.streak,0);assert.equal(s.score,0);assert.equal(s.bugs[0].dodgeUntil,s.elapsedMs+780);
 const side=s.bugs[0].dodgeSide,yaw=s.yaw;originalButterflyCatch.input(s,t,{tick:23,x:500,y:500,action:'down'});originalButterflyCatch.input(s,t,{tick:23,x:1000,y:500,action:'move'});assert.equal(s.yaw,yaw-180*.0048);originalButterflyCatch.input(s,t,{tick:23,x:1000,y:500,action:'up'});assert.equal(s.bugs[0].dodgeSide,side);assert.equal(s.pointer,null);
});

test('Butterfly deterministic moving3D paths and view/focus/catches survive serialized replay; ends60s',()=>{
 const t=ticket('butterfly_catch',true),s=originalButterflyCatch.create(t),replay=JSON.parse(JSON.stringify(s)) as OriginalButterflyCatchState,inputs:OriginalInput[]=[];
 let followed=0;
 while(!s.finished){if(s.elapsedMs%80===0){if(s.bugs[followed].caughtUntil>s.elapsedMs)followed=(followed+1)%s.bugs.length;const p=originalButterflyWorldPosition(s,s.bugs[followed]),yaw=Math.atan2(-p.x,-p.z),pitch=Math.atan2(p.y-1.78,Math.hypot(p.x,p.z));const i:OriginalInput={tick:s.elapsedMs/20,x:Math.round((yaw/(Math.PI*2)+.5)*1000),y:Math.round((Math.max(-1.32,Math.min(1.32,pitch))/2.64+.5)*1000),control:'look',action:'move'};inputs.push(i);originalButterflyCatch.input(s,t,i);}
  if(s.focusProgress>=.98&&!s.swinging&&s.elapsedMs>=s.captureCooldownUntil){const i:OriginalInput={tick:s.elapsedMs/20,x:500,y:500,control:'catch'};inputs.push(i);originalButterflyCatch.input(s,t,i);}
  originalButterflyCatch.step(s,t,20);
 }
 let cursor=0;while(!replay.finished){while(inputs[cursor]?.tick===replay.elapsedMs/20)originalButterflyCatch.input(replay,t,inputs[cursor++]);originalButterflyCatch.step(replay,t,20);}
 assert.deepEqual(replay,s);assert.equal(s.elapsedMs,60000);assert.equal(s.reason,'time');assert.ok(s.catches>1);assert.ok(s.score>0);assert.ok(s.bugs.some(b=>originalButterflyProjection(s,b).distance>0));
 const higherCP={...t,squad:t.squad.map(b=>({...b,cp:999999}))};assert.equal(originalButterflyCatch.create(higherCP).zoneMultiplier,originalButterflyCatch.create(t).zoneMultiplier);
});
