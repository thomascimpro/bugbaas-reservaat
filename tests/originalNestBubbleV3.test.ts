import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {ArcadeTicket} from '../game/arcade/tapDuel';
import type {OriginalInput,OriginalPort,OriginalState} from '../game/arcade/original/types';
import {originalNestDefense,nestPointOnPath,nestTowerSpec,nestTowerUpgradeCost,nestEffectiveDamage} from '../game/arcade/original/nestDefense';
import type {OriginalNestState,OriginalNestEnemy} from '../game/arcade/original/nestDefense';
import {originalBubbleSwarm,traceShotPath} from '../game/arcade/original/bubbleSwarm';
import type {OriginalBubbleState} from '../game/arcade/original/bubbleSwarm';

function ticket(game:'nest_defense'|'bubble_swarm',powered=false):ArcadeTicket{return {id:'original-'+game,owner:'test',challenge:'original',game,rules:'original-1',league:'great',seed:42,squad:powered?[{id:'a',species:'ant',shiny:false,cp:1000,attack:480,defense:390,hp:450,fast:'leaf',types:['grass']}]:[],issuedAt:0,expiresAt:86400000,target:{name:'Computer',kind:'computer',score:0},status:'started'};}
const press=(control:string,x=500,y=500,action:OriginalInput['action']='down'):OriginalInput=>({tick:0,control,x,y,action});
function advance<S extends OriginalState>(port:OriginalPort<S>,s:S,t:ArcadeTicket,ms:number){for(let i=0;i<ms/20&&!s.finished;i++)port.step(s,t,20);}
function shoot(s:OriginalBubbleState,t:ArcadeTicket){originalBubbleSwarm.input(s,t,press('field',500,320));assert.equal(originalBubbleSwarm.input(s,t,press('field',500,320,'up')),true);for(let i=0;s.projectile&&i<200&&!s.finished;i++)originalBubbleSwarm.step(s,t,20);assert.equal(s.projectile,null);}

test('original Nest starts125 coins/13HP and preserves path, role prices, upgrades and90ms cadence',()=>{
 const t=ticket('nest_defense'),s=originalNestDefense.create(t);assert.equal(s.coins,125);assert.equal(s.hearts,13);assert.equal(s.towers.length,5);assert.deepEqual(nestPointOnPath(.5),{x:78,y:52});
 assert.deepEqual(nestTowerSpec('heavy',1,'armored'),{cooldownMs:1264,damage:7,range:30,slowMs:0});assert.equal(nestTowerUpgradeCost('rapid',1),170);assert.equal(nestTowerUpgradeCost('heavy',3),472);
 advance(originalNestDefense,s,t,80);assert.equal(s.simulatedMs,0);advance(originalNestDefense,s,t,20);assert.equal(s.simulatedMs,90);advance(originalNestDefense,s,t,800);assert.equal(s.simulatedMs,900);assert.equal(s.enemies.length,1);assert.equal(s.enemies[0].hp,3);assert.equal(s.enemies[0].progress,0);
 assert.equal(nestEffectiveDamage('armored',7,'manual'),2);assert.equal(nestEffectiveDamage('armored',7,'heavy'),7);assert.equal(nestEffectiveDamage('swarm',7,'heavy'),3);assert.equal(nestEffectiveDamage('boss',5,'manual'),2);
});

test('original Nest purchases cannot create coins or free upgrades through repeated input',()=>{
 const t=ticket('nest_defense'),s=originalNestDefense.create(t);for(let n=0;n<100;n++){originalNestDefense.input(s,t,press('tower_slot',100));originalNestDefense.input(s,t,press('tower_slot',300));originalNestDefense.input(s,t,press('tower_slot',500));originalNestDefense.input(s,t,press('tap_damage'));}
 assert.equal(s.coins,35);assert.equal(s.towers.filter(t=>t.kind).length,2);assert.ok(s.towers.every(t=>t.level<=1));assert.equal(s.tapDamageLevel,1);
 const before=structuredClone(s);assert.equal(originalNestDefense.input(s,t,press('score',1000)),false);assert.deepEqual(s,before);
});

test('original Nest manual kills keep3200ms chains and spray/web keep their cooldown/target rules',()=>{
 const t=ticket('nest_defense'),s=originalNestDefense.create(t),enemy=(id:string,hp=1,progress=.5):OriginalNestEnemy=>({id,hp,maxHp:hp,progress,kind:'normal',speed:0,slowUntil:0});s.elapsedMs=1000;s.enemies=[enemy('a')];
 assert.equal(originalNestDefense.input(s,t,press('field',780,520)),true);assert.equal(s.score,42);assert.equal(s.coins,137);assert.equal(s.manualCombo,1);
 s.elapsedMs=4100;s.enemies=[enemy('b')];originalNestDefense.input(s,t,press('field',780,520));assert.equal(s.score,89);assert.equal(s.manualCombo,2);
 s.elapsedMs=7300;s.enemies=[enemy('c')];originalNestDefense.input(s,t,press('field',780,520));assert.equal(s.score,131);assert.equal(s.manualCombo,1);assert.equal(s.maxManualCombo,2);
 s.elapsedMs=10000;s.enemies=[enemy('d',4,.5),enemy('e',4,.52),enemy('far',4,.9)];assert.equal(originalNestDefense.input(s,t,press('spray')),true);assert.deepEqual(s.enemies.map(e=>e.hp),[1,1,4]);assert.equal(s.sprayCooldownUntil,22500);assert.equal(originalNestDefense.input(s,t,press('spray')),false);
 assert.equal(originalNestDefense.input(s,t,press('sticky')),true);assert.equal(s.slowZones[0].until,15600);assert.equal(s.stickyCooldownUntil,23000);assert.equal(originalNestDefense.input(s,t,press('sticky')),false);
});

test('original Nest naturally reaches healer/boss waves and150s win keeps the original terminal bonus once',()=>{
 const t=ticket('nest_defense'),s=originalNestDefense.create(t);s.hearts=s.maxHearts=10000;advance(originalNestDefense,s,t,150000);assert.equal(s.finished,true);assert.equal(s.reason,'time');assert.ok(s.bossWaves.includes(6));assert.ok(s.bossWaves.includes(11));assert.ok(s.bossWaves.includes(16));assert.equal(s.wave,17);assert.ok(s.leaks>0);const score=s.score;advance(originalNestDefense,s,t,200);assert.equal(s.score,score);
});

test('original Bubble keeps timed pressure, alternating grid parity and no idle board-clear victory',()=>{
 const t=ticket('bubble_swarm'),s=originalBubbleSwarm.create(t);assert.equal(s.board.length,32);assert.equal(new Set(s.board.map(b=>b.kind)).size,3);assert.equal(s.board.filter(b=>b.power==='bomb').length,1);assert.equal(s.board.filter(b=>b.power==='freeze').length,1);
 advance(originalBubbleSwarm,s,t,8240);assert.equal(s.board.length,32);advance(originalBubbleSwarm,s,t,20);assert.equal(s.board.length,40);assert.equal(s.gridPhase,1);assert.equal(s.board.filter(b=>b.row===0).length,8);assert.equal(s.nextPressureAt,16032); //8260 + round(8200/(1+8260/150000)).
 advance(originalBubbleSwarm,s,t,100000);assert.equal(s.finished,true);assert.equal(s.reason,'lower_bound');assert.ok(s.elapsedMs<100000);
});

test('original Bubble shot takes its full flight plus120ms before rule resolution; pressure waits',()=>{
 const t=ticket('bubble_swarm'),s=originalBubbleSwarm.create(t);originalBubbleSwarm.input(s,t,press('field',500,320));originalBubbleSwarm.input(s,t,press('field',500,320,'up'));const p=structuredClone(s.projectile!);s.nextPressureAt=0;const cells=structuredClone(s.board);
 advance(originalBubbleSwarm,s,t,Math.ceil(p.durationMs/20)*20);assert.deepEqual(s.board,cells);assert.ok(s.impact);assert.ok(s.projectile);assert.equal(originalBubbleSwarm.input(s,t,press('field',500,320,'up')),false);
 advance(originalBubbleSwarm,s,t,100);assert.deepEqual(s.board,cells);assert.ok(s.projectile);advance(originalBubbleSwarm,s,t,20);assert.equal(s.projectile,null);assert.equal(s.shotCount,1);
 const phase=s.gridPhase;advance(originalBubbleSwarm,s,t,260);assert.notEqual(s.gridPhase,phase);
});

test('original Bubble Bomb/Freeze + unsupported drops use35/60 scoring and the next consecutive match adds45',()=>{
 const t=ticket('bubble_swarm'),s=originalBubbleSwarm.create(t);s.board=[{id:'anchor',row:0,col:0,kind:'beetle'},{id:'a',row:0,col:3,kind:'bee',power:'freeze'},{id:'b',row:1,col:3,kind:'bee',power:'bomb'},{id:'blast1',row:1,col:4,kind:'moth'},{id:'blast2',row:2,col:4,kind:'firefly'},{id:'drop',row:3,col:4,kind:'ladybug'}];s.currentShot={bubbleKind:'bee'};shoot(s,t);
 assert.equal(s.score,235);assert.equal(s.popped,6);assert.equal(s.combo,1);assert.deepEqual(s.board.map(b=>b.id),['anchor']);assert.equal(s.freezeUntil,s.elapsedMs+6000);assert.equal(s.nextPressureAt,14200);
 s.board=[{id:'anchor',row:0,col:0,kind:'beetle'},{id:'a',row:0,col:3,kind:'bee'},{id:'b',row:1,col:3,kind:'bee'}];s.currentShot={bubbleKind:'bee'};shoot(s,t);assert.equal(s.score,385);assert.equal(s.combo,2);assert.equal(s.maxCombo,2);
});

test('clearing original Bubble advances to a new level with an additional colour and retains score',()=>{
 const t=ticket('bubble_swarm'),s=originalBubbleSwarm.create(t);s.board=[{id:'a',row:0,col:3,kind:'bee'},{id:'b',row:1,col:3,kind:'bee'}];s.currentShot={bubbleKind:'bee'};shoot(s,t);assert.equal(s.level,2);assert.equal(s.board.length,32);assert.equal(new Set(s.board.map(b=>b.kind)).size,4);assert.equal(s.score,105);assert.equal(s.finished,false);assert.equal(s.combo,0);
 const bounced=traceShotPath({x:50,y:91},{x:95,y:80});assert.ok(bounced.length>=3);assert.equal(bounced[1].x,95);
});

test('real squad support is capped and changes survival margins without multiplying scores',()=>{
 const lowNest=originalNestDefense.create(ticket('nest_defense')),highNest=originalNestDefense.create(ticket('nest_defense',true));assert.equal(highNest.coins,142);assert.equal(highNest.hearts,14);assert.equal(highNest.help.damageMultiplier,1.1);assert.equal(highNest.help.fireRateMultiplier,.92);assert.equal(lowNest.score,highNest.score);
 const t=ticket('bubble_swarm',true),high=originalBubbleSwarm.create(t);assert.ok(Math.abs(high.help.pressureMultiplier-1.14)<1e-12);assert.ok(Math.abs(high.help.freezeMultiplier-1.14)<1e-12);assert.equal(high.score,0);
});

test('both original ports replay the same20ms input stream exactly without mutating the ticket',()=>{
 function verify<S extends OriginalState>(port:OriginalPort<S>){const t=ticket(port.game as 'nest_defense'|'bubble_swarm',true),snapshot=structuredClone(t),play=()=>{const s=port.create(t);for(let tick=0;tick<5000&&!s.finished;tick++){if(port.game==='nest_defense'){if(tick<5)port.input(s,t,{tick,x:tick*200+100,y:500,control:'tower_slot',action:'down'});if(tick%50===0)port.input(s,t,{tick,x:500,y:500,control:'spray',action:'down'});}else if(tick%75===0){port.input(s,t,{tick,x:100+(tick%800),y:320,control:'field',action:'down'});port.input(s,t,{tick,x:500,y:320,control:'field',action:'up'});}port.step(s,t,20);}return s;};assert.deepEqual(play(),play());assert.deepEqual(t,snapshot);}
 verify(originalNestDefense);verify(originalBubbleSwarm);
});
