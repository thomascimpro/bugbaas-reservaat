import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ARCADE_GAMES,LEGACY_DURATIONS,legacyGameRules,createArcadeState,stepArcadeState,applyArcadeInput,replayArcade,validateArcadeInputs,squadHelpers,createBubbleBoard,bubbleNeighbors,catchBugPosition} from '../game/arcade/games';
import type {ArcadeGameId,ArcadeState} from '../game/arcade/games';
import type {ArcadeTicket,ArcadeTap} from '../game/arcade/tapDuel';
import {replayTap} from '../game/arcade/tapDuel';

function ticket(game:ArcadeGameId,seed=42):ArcadeTicket{return {id:'test-'+game,owner:'test',challenge:'test',game,rules:legacyGameRules(game),league:'great',seed,squad:[
 {id:'a',species:'ant',shiny:false,cp:1000,attack:160,defense:130,hp:150,fast:'leaf',types:['grass']},
 {id:'b',species:'moth',shiny:true,cp:1000,attack:150,defense:120,hp:140,fast:'gust',types:['flying','bug']},
 {id:'c',species:'beetle',shiny:false,cp:1000,attack:140,defense:110,hp:130,fast:'claw',types:['bug']},
 ],issuedAt:0,expiresAt:86400000,target:{name:'Test',score:0,kind:'computer'},status:'started'};}
function run(t:ArcadeTicket,drive:(s:ArcadeState)=>ArcadeTap|undefined){const state=createArcadeState(t),inputs:ArcadeTap[]=[];while(!state.finished){const input=drive(state);if(input){inputs.push(input);applyArcadeInput(state,t,input);}stepArcadeState(state,t);}return {state,inputs};}
const point=(s:ArcadeState,x:number,y:number,action:ArcadeTap['action']='down'):ArcadeTap=>({tick:s.tick,x:Math.round(x),y:Math.round(y),action});
function driver(s:ArcadeState):ArcadeTap|undefined{
 if(s.runner&&s.tick%10===0){const threat=s.runner.things.filter(o=>o.kind==='web'&&o.y>350&&o.y<555).map(o=>o.lane),nectar=s.runner.things.find(o=>o.kind==='nectar'&&o.y>320&&o.y<545&&!threat.includes(o.lane)),wanted=nectar?.lane??[0,1,2].find(l=>!threat.includes(l))!;if(wanted!==s.runner.lane)return point(s,wanted<s.runner.lane?200:800,500);}
 if(s.nest&&s.tick%5===0){const target=[...s.nest.enemies].sort((a,b)=>b.y-a.y||a.id-b.id)[0];if(target)return point(s,(60+target.lane*120)/360*1000,target.y/640*1000);}
 if(s.glide){const gate=s.glide.gates.find(g=>g.x>55),wanted=gate?.center??320,held=s.glide.held?s.glide.y>wanted-10:s.glide.y>wanted+10;if(held!==s.glide.held)return point(s,500,500,held?'down':'up');}
 if(s.catch&&s.tick%3===0){const target=s.catch.bugs.find(b=>b.kind==='butterfly');if(target){const p=catchBugPosition(target,s.tick);return point(s,p.x/.36,p.y/.64,'move');}}
 if(s.tower){const target=s.tower.leaves.find(l=>l.floor===s.tower!.maxFloor+1)!;const direction=Math.abs(target.x-s.tower.x)<5?0:target.x<s.tower.x?-1:1;if(direction!==s.tower.direction)return point(s,direction<0?200:800,500,direction?'down':'up');}
 if(s.bubble&&!s.bubble.shot&&s.tick>=s.bubble.ready)return point(s,175,259,'up');
}

// Persisted v1 tickets keep their exact historical remake rules and replay contracts.
for(const game of ARCADE_GAMES.filter(g=>g.id!=='tap_duel'))test(game.name+': local fixed-step play exactly matches server replay without mutating the ticket',()=>{
 const t=ticket(game.id),before=structuredClone(t),played=run(t,driver),replayed=replayArcade(t,played.inputs);assert.deepEqual(replayed.state,played.state);assert.deepEqual(t,before);assert.equal(played.state.finished,true);assert.ok(played.state.tick<=LEGACY_DURATIONS[game.id]*50);assert.ok(played.inputs.length<=1200);assert.ok(JSON.stringify(played.inputs).length<65536);if(game.id!=='bubble_swarm'){assert.ok(played.state.score>0);assert.equal(replayed.qualified,true);}
});

test('helpers retain the three-slot denominator, real snapshots and strict per-effect caps',()=>{
 const full=ticket('web_runner');const lone={...full,squad:full.squad.slice(0,1)};assert.equal(squadHelpers(lone).a,333);assert.equal(squadHelpers(lone).d,333);assert.equal(squadHelpers(lone).h,333);
 const huge={...full,squad:full.squad.map(b=>({...b,attack:99999,defense:99999,hp:99999,types:['grass','flying','poison'] as typeof b.types}))};const h=squadHelpers(huge);assert.deepEqual([h.a,h.d,h.h],[1000,1000,1000]);assert.equal(h.pickupPct,14);assert.equal(h.netPct,14);assert.equal(h.platformPct,14);assert.equal(h.gateExtra,12);assert.equal(h.graceTicks,6);assert.equal(h.coyoteTicks,9);assert.equal(h.secondPreview,true);
});

test('runner steering has a160ms cooldown and invulnerability prevents stacked damage',()=>{
 const t=ticket('web_runner'),s=createArcadeState(t);assert.equal(applyArcadeInput(s,t,point(s,200,500)),true);assert.equal(s.runner!.lane,0);assert.equal(applyArcadeInput(s,t,point(s,800,500)),false);
 for(let i=0;i<8;i++)stepArcadeState(s,t);assert.equal(applyArcadeInput(s,t,point(s,800,500)),true);
 s.runner!.lastMove=-100;s.runner!.things=[0,1].map(id=>({id,lane:1,y:516,kind:'web'}));stepArcadeState(s,t);assert.equal(s.hearts,2);assert.equal(s.score,0);
});

test('nest shots use real cooldowns, rotate shooters and disappear when their exact target is gone',()=>{
 const t=ticket('nest_defense'),s=createArcadeState(t);for(let i=0;i<50;i++)stepArcadeState(s,t);const enemy=s.nest!.enemies[0],input=point(s,(60+enemy.lane*120)/360*1000,500);assert.equal(applyArcadeInput(s,t,input),true);assert.equal(s.nest!.shots[0].shooter,0);assert.equal(s.squad[0].ready,90);assert.equal(applyArcadeInput(s,t,input),true);assert.equal(s.nest!.shots[1].shooter,1);s.nest!.enemies=[];stepArcadeState(s,t);assert.equal(s.nest!.shots.length,0);assert.equal(s.score,0);assert.equal(s.hearts,3);
});

test('net cannot teleport and needs100ms continuous overlap; no score for wasps',()=>{
 const t=ticket('butterfly_catch'),s=createArcadeState(t),c=s.catch!;applyArcadeInput(s,t,point(s,1000,0,'move'));const before={x:c.x,y:c.y};stepArcadeState(s,t);assert.ok(Math.hypot(c.x-before.x,c.y-before.y)<=18.000001);
 c.bugs=[{id:0,kind:'butterfly',born:s.tick,x:180,y:158,phase:0,vx:0,overlap:0,shiny:false}];c.x=c.targetX=180;c.y=c.targetY=200;
 for(let i=0;i<4;i++)stepArcadeState(s,t);assert.equal(s.score,0);stepArcadeState(s,t);assert.equal(s.score,10);
 c.bugs=[{id:9,kind:'wasp',born:s.tick,x:180,y:158,phase:0,vx:0,overlap:0,shiny:false}];stepArcadeState(s,t);assert.equal(s.score,10);assert.equal(s.hearts,2);
});

test('tower only rewards a first reached floor and every platform remains reachable',()=>{
 const t=ticket('bug_tower'),s=createArcadeState(t);const leaves=s.tower!.leaves;for(let i=1;i<leaves.length;i++){assert.equal(leaves[i-1].y-leaves[i].y,70);assert.ok(Math.abs(leaves[i].x-leaves[i-1].x)<=100);}
 const leaf=leaves[1],tower=s.tower!;tower.x=leaf.x;tower.y=leaf.y-15;tower.vy=50;stepArcadeState(s,t);assert.equal(s.score,20);tower.x=leaf.x;tower.y=leaf.y-15;tower.vy=50;stepArcadeState(s,t);assert.equal(s.score,20);
});

test('200 seeded bubble boards contain40 unique cells, no initial matching groups and a solvable first shot',()=>{
 for(let seed=0;seed<200;seed++){
  const cells=createBubbleBoard(seed);assert.equal(cells.length,40);assert.equal(new Set(cells.map(c=>c.row+':'+c.col)).size,40);
  for(const cell of cells){const queue=[cell],found=new Set([cell.id]);while(queue.length){const c=queue.shift()!;for(const [row,col]of bubbleNeighbors(c.row,c.col)){const n=cells.find(p=>p.row===row&&p.col===col&&p.type===cell.type);if(n&&!found.has(n.id)){found.add(n.id);queue.push(n);}}}assert.ok(found.size<3);}
  const t=ticket('bubble_swarm',seed),s=createArcadeState(t);assert.equal(applyArcadeInput(s,t,point(s,175,259,'up')),true);while(s.bubble!.shot)stepArcadeState(s,t);assert.ok(s.bubble!.removed>=3);
 }
});

// Found through the real seeded physics; no state injection, board refill or client score.
const clearedBoardInputs:ArcadeTap[]=[[0,1000,500],[48,1000,623],[102,1000,431],[150,1000,292],[201,1000,329],[254,1000,329],[309,1000,623],[364,1000,623],[422,117,140],[469,1000,573],[526,1000,623],[591,1000,477],[647,1000,623],[712,1000,623],[777,1000,623],[842,1000,623],[907,1000,623],[972,1000,548],[1031,1000,623],[1096,1000,623],[1161,1000,623],[1226,1000,623],[1291,1000,623],[1356,0,623],[1421,0,623],[1486,0,623],[1551,0,623],[1616,0,623],[1681,1000,623],[1739,1000,623],[1793,1000,573],[1847,1000,623],[1901,1000,623],[1960,1000,623]].map(([tick,x,y])=>({tick,x,y,action:'up'}));
test('a real entire bubble board clears immediately and never refills or accepts a late input',()=>{
 const t=ticket('bubble_swarm',0),r=replayArcade(t,clearedBoardInputs);assert.equal(r.state.endReason,'board_clear');assert.equal(r.state.tick,2007);assert.equal(r.state.score,575);assert.equal(r.state.bubble!.cells.length,0);assert.equal(r.state.acceptedShots,34);assert.equal(r.qualified,true);const before=structuredClone(r.state);stepArcadeState(r.state,t);assert.deepEqual(r.state,before);assert.throws(()=>replayArcade(t,[...clearedBoardInputs,{tick:2008,x:500,y:500,action:'up'}]),/afgelopen/);
});

test('untrusted replay cannot inject scores, board-clear claims, oversized logs or out-of-order ticks',()=>{
 const t=ticket('bubble_swarm');for(const raw of [[{tick:0,x:500,y:500,score:1000}],[{tick:0,x:500,y:500,endReason:'board_clear'}],[{tick:0,x:NaN,y:1}],[{tick:1,x:1,y:1},{tick:0,x:1,y:1}],Array(1201).fill({tick:0,x:1,y:1})])assert.throws(()=>validateArcadeInputs(t,raw));
 assert.equal(replayArcade(t,[]).qualified,false);const absent=ticket('tap_duel');delete absent.game;assert.equal(replayArcade(absent,[]).state.score,replayTap(absent,[]).state.score);assert.throws(()=>replayArcade(absent,[{tick:0,x:1,y:1,action:'down'}]));assert.doesNotThrow(()=>replayArcade(ticket('tap_duel'),[{tick:0,x:1,y:1,action:'down'}]));
});
