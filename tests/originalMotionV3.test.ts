import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import type {ArcadeTicket} from '../game/arcade/tapDuel';
import type {OriginalInput,OriginalPort,OriginalState} from '../game/arcade/original/types';
import {originalSquadPower} from '../game/arcade/original/types';
import {seededNumber,seededLane} from '../game/arcade/original/originalSeed';
import {classifyWebRunnerGesture} from '../game/arcade/original/originalWebRunnerGesture';
import {frameScaleForTick} from '../game/arcade/original/originalTiming';
import {webRunnerPort,runnerCollision,runnerDifficulty,runnerLiveScore} from '../game/arcade/original/webRunner';
import {bugGlidePort,glideCollect,glideDifficulty,glideFinalScore,isGlidePickup} from '../game/arcade/original/bugGlide';
import type {GlideEntityKind} from '../game/arcade/original/bugGlide';
import {bugTowerPort,towerJumpFromRun,tryTowerLandingChain,towerCharge,platformWidthForFloor,movingPlatformChance,platformBoostForFloor,towerFinalScore,towerZone} from '../game/arcade/original/bugTower';
import {towerJumpVelocity,towerPlatformGap,towerScrollSpeed} from '../game/arcade/original/originalBugTowerBalance';

function ticket(game:ArcadeTicket['game']='web_runner',squad=false):ArcadeTicket{return {id:'original-test',owner:'test',game,challenge:'test',rules:game+'-2',seed:421,league:'great',squad:squad?[0,1,2].map(i=>({id:String(i),species:['ant','moth','beetle'][i],shiny:false,cp:1200,attack:160,defense:130,hp:150,fast:'leaf',types:['grass','bug']})):[],issuedAt:0,expiresAt:86400000,status:'started',target:{name:'test',score:0,kind:'computer'}};}
const input=(s:OriginalState,control?:string,action:OriginalInput['action']='down',x=500,y=500):OriginalInput=>({tick:s.elapsedMs/20,x,y,action,...(control?{control}:{})});
const steps=<S extends OriginalState>(port:OriginalPort<S>,s:S,t:ArcadeTicket,n:number)=>{for(let i=0;i<n&&!s.finished;i++)port.step(s,t,20);};

test('copied FNV seed, gesture thresholds and 1.2 timing retain original formulas',()=>{
 const fnv=(text:string)=>{let hash=2166136261;for(const char of text)hash=Math.imul(hash^char.charCodeAt(0),16777619);return (hash>>>0)/4294967295;};
 assert.equal(seededNumber('old-run',18),fnv('old-run:18'));assert.equal(seededLane('old-run',18),Math.floor(fnv('old-run:18')*3));
 assert.equal(classifyWebRunnerGesture(0,0),'jump');assert.equal(classifyWebRunnerGesture(25,2),'right');assert.equal(classifyWebRunnerGesture(-25,2),'left');assert.equal(classifyWebRunnerGesture(2,-25),'jump');assert.equal(classifyWebRunnerGesture(2,25),'none');
 assert.equal(frameScaleForTick(1020,1000,20),1.2);assert.equal(frameScaleForTick(1100,1000,20),48/20*1.2);
});
test('runner retains three lanes, a620ms nonextendable jump and original survival difficulty',()=>{
 const t=ticket(),s=webRunnerPort.create(t);assert.equal(s.lane,1);
 webRunnerPort.input(s,t,input(s,'left'));webRunnerPort.input(s,t,input(s,'left'));assert.equal(s.lane,0);webRunnerPort.input(s,t,input(s,'right'));assert.equal(s.lane,1);
 assert.equal(webRunnerPort.input(s,t,input(s,'jump')),true);assert.equal(s.jumpUntil,620);assert.equal(webRunnerPort.input(s,t,input(s,'jump')),false);assert.equal(s.jumpUntil,620);
 steps(webRunnerPort,s,t,31);assert.equal(s.elapsedMs,620);assert.equal(webRunnerPort.input(s,t,input(s,'jump')),true);assert.equal(s.jumpUntil,1240);
 assert.equal(runnerDifficulty(0).speed,1.22);assert.equal(runnerDifficulty(130000).tier,10);assert.equal(runnerDifficulty(600000).speed,7.4);assert.equal(webRunnerPort.durationMs,600000);
 s.elapsedMs=46000;s.entities=[];webRunnerPort.step(s,t,20);assert.equal(s.finished,false);
});
test('runner original pickups, magnet, shield, boost and jumped hazards affect combo and exact score',()=>{
 const t=ticket(),s=webRunnerPort.create(t);s.elapsedMs=1000;
 runnerCollision(s,{id:'n',kind:'nectar',lane:1,y:84});runnerCollision(s,{id:'m',kind:'magnet',lane:1,y:84});runnerCollision(s,{id:'b',kind:'boost',lane:1,y:84});runnerCollision(s,{id:'s',kind:'shield',lane:1,y:84});
 assert.equal(s.pickups,4);assert.equal(s.maxCombo,4);assert.equal(s.scoreBonus,66);assert.equal(s.magnetUntil,6200);assert.equal(s.boostUntil,5200);assert.equal(s.shield,true);
 webRunnerPort.input(s,t,input(s,'jump'));runnerCollision(s,{id:'w',kind:'web',lane:1,y:84});runnerCollision(s,{id:'f',kind:'flyer',lane:1,y:84});assert.equal(s.hearts,3);assert.equal(s.combo,6);assert.equal(s.scoreBonus,81);assert.equal(runnerLiveScore(1000,s),180);
 s.elapsedMs=s.jumpUntil;runnerCollision(s,{id:'w',kind:'web',lane:1,y:84});assert.equal(s.shield,false);assert.equal(s.hearts,3);assert.equal(s.combo,0);
 for(let i=0;i<3;i++)runnerCollision(s,{id:'f'+i,kind:'flyer',lane:1,y:84});assert.equal(s.finished,true);assert.equal(s.reason,'hearts');assert.equal(s.hearts,0);
});
test('runner magnet reaches an adjacent lane and boost changes original movement speed',()=>{
 const t=ticket(),a=webRunnerPort.create(t),b=webRunnerPort.create(t);a.magnetUntil=1000;a.boostUntil=1000;
 a.entities=[{id:'pickup',kind:'nectar',lane:0,y:74},{id:'far',kind:'web',lane:2,y:10}];b.entities=[{id:'far',kind:'web',lane:2,y:10}];
 webRunnerPort.step(a,t,20);webRunnerPort.step(b,t,20);assert.equal(a.pickups,1);assert.ok(a.entities.find(e=>e.id==='far')!.y>b.entities.find(e=>e.id==='far')!.y);
});
test('glide retains free XY tap impulse, inertia/gravity, bouncing boundaries and no hold-to-fly',()=>{
 const t=ticket('bug_glide'),a=bugGlidePort.create(t),b=bugGlidePort.create(t);
 assert.equal(bugGlidePort.input(a,t,input(a,undefined,'down',0,500)),true);assert.ok(a.vx>0);assert.equal(a.vy,-3.85);
 bugGlidePort.input(b,t,input(b,undefined,'down',1000,100));assert.ok(b.vx<0);assert.equal(b.vy,a.vy);
 const oldY=a.y;bugGlidePort.step(a,t,20);assert.ok(a.y<oldY);assert.ok(a.vy>-3.85);assert.equal(bugGlidePort.input(a,t,input(a,undefined,'up')),false);
 for(let i=0;i<8;i++)bugGlidePort.input(a,t,input(a));assert.equal(a.vy,-5.15);
 a.y=10;a.vy=-5;bugGlidePort.step(a,t,20);assert.equal(a.y,10);assert.ok(a.vy>=.8);
 a.y=82;a.vy=5;bugGlidePort.step(a,t,20);assert.equal(a.y,82);assert.ok(a.vy<=0);
 assert.equal(glideDifficulty(24000).mode,'density');assert.equal(glideDifficulty(36000).mode,'speed');assert.equal(bugGlidePort.durationMs,600000);
});
test('glide preserves all eight object rules, heart cap, timed shield, wind score and streak reset',()=>{
 const kinds:GlideEntityKind[]=['bird','heart','nectar','pollen','rain','shield','thorn','wind'];assert.equal(kinds.filter(isGlidePickup).length,5);
 const t=ticket('bug_glide'),s=bugGlidePort.create(t);s.hearts=2;
 for(const kind of kinds.filter(isGlidePickup))glideCollect(s,{id:kind,kind,x:s.x,y:s.y,vy:0});
 assert.equal(s.hearts,3);assert.equal(s.pickups,5);assert.equal(s.streak,5);assert.equal(s.rawScore,217);assert.equal(s.shieldUntil,6000);assert.equal(s.windUntil,4200);
 s.entities=[{id:'hazard',kind:'bird',x:s.x,y:s.y,vy:0,stationary:true}];bugGlidePort.step(s,t,20);assert.equal(s.hearts,3);assert.equal(s.shieldUntil,0);assert.equal(s.streak,5);
 s.entities=['bird','rain','thorn'].map(kind=>({id:kind,kind:kind as GlideEntityKind,x:s.x,y:s.y,vy:0,stationary:true}));bugGlidePort.step(s,t,20);assert.equal(s.hearts,0);assert.equal(s.streak,0);assert.equal(s.maxStreak,5);assert.equal(s.finished,true);assert.equal(s.reason,'hearts');assert.equal(s.score,glideFinalScore(s));
 const wind=bugGlidePort.create(t),normal=bugGlidePort.create(t);wind.windUntil=4200;bugGlidePort.step(wind,t,20);bugGlidePort.step(normal,t,20);assert.ok(wind.rawScore>normal.rawScore);
});
test('tower stays grounded until release; running charge and spring retain exact original jump formula',()=>{
 const t=ticket('bug_tower'),still=bugTowerPort.create(t);steps(bugTowerPort,still,t,5);assert.equal(still.player.grounded,true);assert.equal(still.player.vy,0);
 bugTowerPort.input(still,t,input(still,'right'));bugTowerPort.input(still,t,input(still,'right','up'));assert.equal(still.player.vy,-1.95);
 const charged=bugTowerPort.create(t);bugTowerPort.input(charged,t,input(charged,'right'));for(let tick=0;tick<100&&towerCharge(charged)<100;tick++)bugTowerPort.step(charged,t,20);assert.equal(towerCharge(charged),100);assert.equal(charged.player.grounded,true);
 const expected=towerJumpVelocity(Math.abs(charged.player.vx)/.6,1,false);bugTowerPort.input(charged,t,input(charged,'right','up'));assert.equal(charged.player.vy,expected);assert.ok(charged.player.vy<=-4.5);assert.equal(charged.player.spinning,true);assert.equal(charged.manualDirection,0);assert.equal(charged.runDistance,0);
 const spring=bugTowerPort.create(t);spring.springReady=true;assert.equal(towerJumpFromRun(spring),true);assert.equal(spring.player.vy,-3);assert.equal(spring.springReady,false);assert.equal(spring.player.spinning,true);
});
test('tower landing opens the full360ms salto chain and preserves skipped-floor combo scoring',()=>{
 const t=ticket('bug_tower'),s=bugTowerPort.create(t);s.player={...s.player,x:50,y:60,vy:.2,grounded:false,spinning:true,highJump:true};s.platforms=[{id:'floor-4',floor:4,x:12,y:66,width:76,drift:0}];s.pickups=[];
 bugTowerPort.step(s,t,20);assert.equal(s.player.grounded,true);assert.equal(s.floor,4);assert.equal(s.combo,1);assert.equal(s.maxCombo,1);assert.equal(s.chainUntil-s.elapsedMs,360);assert.ok(s.rawScore>=138);
 steps(bugTowerPort,s,t,5);assert.ok(s.chainUntil>s.elapsedMs);assert.equal(s.combo,1);assert.equal(bugTowerPort.input(s,t,input(s,'left')),true);assert.equal(s.player.vy,-2.35);assert.equal(s.player.spinning,true);assert.equal(s.chainUntil,0);
 s.chainUntil=s.elapsedMs-1;assert.equal(tryTowerLandingChain(s),false);
});
test('tower original coins,3000ms rocket,9000ms cooldown and MEGA spring survive replay',()=>{
 const t=ticket('bug_tower'),s=bugTowerPort.create(t);s.pickups=['coin','spring','rocket'].map(kind=>({id:kind,kind:kind as 'coin'|'spring'|'rocket',x:50,y:82.8}));
 bugTowerPort.step(s,t,20);assert.equal(s.coinsCollected,1);assert.equal(s.springReady,true);assert.equal(s.score,145);assert.equal(s.rocketUntil,3020);assert.equal(s.rocketCooldownUntil,9020);assert.equal(s.pickups.some(p=>['coin','spring','rocket'].includes(p.id)),false);
 bugTowerPort.step(s,t,20);assert.equal(s.player.vy,-.76);assert.equal(s.hearts,1);
 s.pickups=[{id:'cooldown-rocket',kind:'rocket',x:s.player.x,y:s.player.y}];bugTowerPort.step(s,t,20);assert.equal(s.pickups.some(p=>p.id==='cooldown-rocket'),true);
 s.rocketUntil=0;s.player.y=113;s.platforms=[];bugTowerPort.step(s,t,20);assert.equal(s.finished,true);assert.equal(s.reason,'lower_bound');assert.equal(s.score,towerFinalScore(s));
});
test('tower retains narrowing/moving platforms, procedural boost intervals, zones and rising scroll pressure',()=>{
 assert.equal(platformWidthForFloor(0,'test'),platformWidthForFloor(19,'test'));assert.ok(platformWidthForFloor(50,'test')<platformWidthForFloor(20,'test'));assert.ok(platformWidthForFloor(200,'test')<platformWidthForFloor(100,'test'));
 assert.equal(movingPlatformChance(7),0);assert.ok(movingPlatformChance(200)>movingPlatformChance(25));assert.equal(movingPlatformChance(1000),.9);assert.ok(towerScrollSpeed(200,180000)>towerScrollSpeed(0,0));
 assert.equal(towerPlatformGap(1,0,1),9.8);assert.ok(towerPlatformGap(200,1,0)>towerPlatformGap(1,0,1));
 const boosts=Array.from({length:200},(_,i)=>i+1).filter(floor=>platformBoostForFloor('test',floor));assert.ok(boosts[0]>=8&&boosts[0]<=10);for(let i=1;i<boosts.length;i++)assert.ok(boosts[i]-boosts[i-1]>=8&&boosts[i]-boosts[i-1]<=14);
 assert.equal(towerZone(100),'Hive Jungle');assert.equal(towerZone(500),'Ice Citadel R1');assert.equal(bugTowerPort.durationMs,600000);
});
test('real squad snapshots are bounded, use three slots and alter assistance without multiplying score',()=>{
 const strong=ticket('bug_glide',true),one={...strong,squad:strong.squad.slice(0,1)},huge={...strong,squad:strong.squad.map(b=>({...b,attack:99999,defense:99999,hp:99999}))};
 assert.equal(originalSquadPower(one.squad,'great').attack,1/3);assert.equal(originalSquadPower(huge.squad,'great').attack,1);assert.equal(bugGlidePort.create(huge).assist.liftAssist,.16);assert.equal(bugGlidePort.create(huge).assist.shieldBonusMs,1400);assert.equal(bugGlidePort.create(huge).hearts,4);assert.equal(webRunnerPort.create(huge).assist.magnetBonusMs,1200);assert.ok(bugTowerPort.create(huge).assist.landingMargin<=.91+.000001);
 const base=webRunnerPort.create(ticket()),boosted=webRunnerPort.create(huge),e={id:'n',kind:'nectar' as const,lane:1 as const,y:84};runnerCollision(base,e);runnerCollision(boosted,e);assert.equal(runnerLiveScore(1000,base),runnerLiveScore(1000,boosted));
 const g1=bugGlidePort.create(ticket('bug_glide')),g2=bugGlidePort.create(huge),nectar={id:'n',kind:'nectar' as const,x:18,y:48,vy:0};glideCollect(g1,nectar);glideCollect(g2,nectar);assert.equal(g1.rawScore,g2.rawScore);
});
for(const port of [webRunnerPort,bugGlidePort,bugTowerPort] as OriginalPort<any>[])test(port.name+': identical20ms input replay produces identical complete state without ticket mutations',()=>{
 const t=ticket(port.game,true),before=structuredClone(t),a=port.create(t),b=port.create(t),log:OriginalInput[]=[];
 for(let tick=0;tick<5000&&!a.finished;tick++){
  let i:OriginalInput|undefined;
  if(port.game==='web_runner'&&tick%31===0)i=input(a,'jump');
  if(port.game==='bug_glide'&&tick%9===0)i=input(a,undefined,'down',tick%18===0?0:900);
  if(port.game==='bug_tower'&&tick%65===0)i=input(a,'right','down');else if(port.game==='bug_tower'&&tick%65===50)i=input(a,'right','up');
  if(i){log.push(i);port.input(a,t,i);}port.step(a,t,20);
 }
 for(let tick=0;tick<a.elapsedMs/20;tick++){for(const i of log.filter(i=>i.tick===tick))port.input(b,t,i);port.step(b,t,20);}
 assert.deepEqual(a,b);assert.deepEqual(t,before);assert.ok(a.score>=0);assert.ok(a.elapsedMs>0);
});
test('every copied motion asset is byte-identical to its recorded original source',()=>{
 for(const group of ['runner','glide','tower']){const base=new URL('../assets/v3/original/'+group+'/',import.meta.url),manifest=JSON.parse(readFileSync(new URL('source.json',base),'utf8'));assert.ok(manifest.files.length>=6);for(const f of manifest.files){const bytes=readFileSync(new URL(f.file,base));assert.equal(bytes.length,f.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);}}
});
