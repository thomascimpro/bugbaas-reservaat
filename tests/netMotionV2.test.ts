import {test} from 'node:test';
import assert from 'node:assert/strict';
import {castNet,encounterWild,ensureField,judgeNet} from '../game/fieldV2';
import type {NetPoint} from '../game/fieldV2';
import {bugPose,motionStyle,rollNetMotion} from '../game/netMotionV2';
import type {NetMotion} from '../game/netMotionV2';
import {NET_FLIGHT_MS,netLanding,netSweepGrade} from '../game/netThrowV2';
import {locate} from '../game/walkingV2';
import {ensureAdventure} from '../game/tacticsV2';
import {freshV2} from '../game/safariV2';

const NOW=Date.UTC(2026,9,29,10),FIX={lat:52.0928,lng:5.1339,accuracy:8};
// Hold the net, then sweep up towards `endX`; the landing follows the release speed.
const sweep=(endX:number,held=1500):NetPoint[]=>[{x:.5,y:1,t:0},...Array.from({length:6},(_,i)=>({x:.5+(endX-.5)*(i+1)/6,y:1-.3*(i+1)/6,t:held+Math.round(180*(i+1)/6)}))];
/** The sweep whose landing is closest to where the bug will be. */
function aimAt(m:NetMotion|undefined,seed:string,start:number){let best=sweep(.5),gap=9;for(let x=.1;x<=.9;x+=.002){const pts=sweep(x),bug=bugPose(m,seed,start+pts.at(-1)!.t+NET_FLIGHT_MS),d=Math.abs(netLanding(pts,m).x-bug.x);if(d<gap){gap=d;best=pts;}}return best;}
const experienced=(catches=20)=>{const p=freshV2('thrower','THROW123',NOW);ensureAdventure(p,NOW);ensureField(p,NOW);p.specimens.push({id:'old',species:'ant',level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null});p.field!.total.catches=catches;return p;};

test('every bug moves in its own way and the first catch stands still',()=>{
 assert.equal(motionStyle('grasshopper'),'hop');assert.equal(motionStyle('butterfly'),'flutter');assert.equal(motionStyle('waterstrider'),'glide');assert.equal(motionStyle('cockroach'),'dart');assert.equal(motionStyle('ant'),'crawl');
 const fresh=freshV2('new','NEWBIE12',NOW);ensureField(fresh,NOW);const m=rollNetMotion(fresh,'butterfly','s');assert.equal(m.amp,0);assert.equal(m.wind,0);assert.deepEqual(bugPose(m,'s',1234),{x:.5,y:.42,dodge:false,tell:false});
 const p=experienced(3);assert.ok(rollNetMotion(p,'butterfly','s').amp>0);assert.ok(Array.from({length:40},(_,i)=>rollNetMotion(p,'ant','w'+i)).every(m=>m.wind===0),'no wind before ten catches');
 const q=experienced(20),winds=Array.from({length:60},(_,i)=>rollNetMotion(q,'ant','w'+i).wind);assert.ok(winds.some(w=>w>0)&&winds.some(w=>w<0)&&winds.some(w=>w===0));
 const calm=bugPose({style:'flutter',amp:1,wind:0},'x',400,'dew'),wild=bugPose({style:'flutter',amp:1,wind:0},'x',400);assert.ok(Math.abs(calm.x-.5)<Math.abs(wild.x-.5),'dew calms the bug');
});

test('leading the moving bug hits; throwing where it was misses',()=>{
 const m:NetMotion={style:'glide',amp:1,wind:0},seed='glider',start=1300,aimed=aimAt(m,seed,start);
 assert.notEqual(netSweepGrade(aimed,null,m,seed,start).grade,'miss');
 const old=bugPose(m,seed,start);assert.ok(Math.abs(old.x-bugPose(m,seed,start+aimed.at(-1)!.t+NET_FLIGHT_MS).x)>.05,'the bug really moved during the throw');
 const stale=[...Array(401)].map((_,i)=>sweep(.1+i*.002)).reduce((x,y)=>Math.abs(netLanding(y).x-old.x)<Math.abs(netLanding(x).x-old.x)?y:x),order=['miss','hit','nice','great','perfect'];
 assert.ok(order.indexOf(netSweepGrade(stale,null,m,seed,start).grade)<order.indexOf(netSweepGrade(aimed,null,m,seed,start).grade),'aiming where the bug was scores worse than leading it');
});

test('a hopper dodges a net that lands mid-jump; right after landing it can be caught',()=>{
 const m:NetMotion={style:'hop',amp:1,wind:0},seed='hopper',duration=sweep(.5).at(-1)!.t;
 const jump=Array.from({length:4400},(_,t)=>t).find(t=>bugPose(m,seed,t).dodge)!,rest=jump+600;
 assert.ok(bugPose(m,seed,jump-100).tell,'a ! warns before the jump');
 const mid=jump+200-duration-NET_FLIGHT_MS,dodged=netSweepGrade(aimAt(m,seed,mid),null,m,seed,mid);assert.equal(dodged.grade,'miss');assert.equal(dodged.dodged,true);
 const calm=rest-duration-NET_FLIGHT_MS,hit=netSweepGrade(aimAt(m,seed,calm),null,m,seed,calm);assert.notEqual(hit.grade,'miss');assert.equal(hit.dodged,false);
});

test('wind pushes a straight net away; a curve throw cuts through it',()=>{
 const m:NetMotion={style:'crawl',amp:0,wind:.07},straight=sweep(.5);
 assert.ok(Math.abs(netLanding(straight,m).x-netLanding(straight).x-.07)<1e-9);
 const curved=straight.map((p,i)=>({...p,x:p.x+(i>0&&i<5?Math.sin(i/4*Math.PI)*.2:0)}));assert.equal(netLanding(curved).curved,true);
 assert.ok(Math.abs(netLanding(curved,m).x-netLanding(curved).x-.07*.35)<1e-9);
 const order=['miss','hit','nice','great','perfect'];assert.ok(order.indexOf(netSweepGrade(straight,null,m).grade)<order.indexOf(netSweepGrade(straight,null).grade),'wind costs a grade on a straight throw');
});

test('the server judges the same moving bug, keeps old clients working and rejects a throw from the future',()=>{
 const p=experienced(20);locate(p,FIX,'motion-secret',NOW);const spawn=p.walking!.spawns[0];encounterWild(p,spawn.id,'enc-m',NOW);const e=p.field!.encounter!;
 assert.ok(e.motion&&e.motion.amp>0,'experienced players get a moving bug');
 assert.equal(judgeNet({kind:'sweep',points:sweep(.5)},null,e.motion,e.id).grade,judgeNet({kind:'sweep',points:sweep(.5)},null).grade,'no start = old client = standing bug');
 assert.throws(()=>castNet(p,{encounter:'enc-m',net:'basic',bait:null,trace:{kind:'sweep',points:sweep(.5),start:60000}},'future',NOW+2000),/nog niet klaar/);
 assert.throws(()=>judgeNet({kind:'sweep',points:sweep(.5),start:-5},null,e.motion,e.id),/werptijd/);
 const start=500,aimed=aimAt({...e.motion!,wind:e.motion!.wind},e.id,start);castNet(p,{encounter:'enc-m',net:'basic',bait:null,trace:{kind:'sweep',points:aimed,start}},'aimed',NOW+3000);
 const expected=netSweepGrade(aimed,null,e.motion,e.id,start);assert.equal(p.field!.lastCast!.grade,expected.grade);assert.notEqual(expected.grade,'miss');
});
