import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WALK_MODELS} from '../game/walkingV2';
import {advanceWorldPosition,worldHeading,worldIdle,worldClip,worldRoam} from '../src/worldMotionV2';

test('map movement eases only the cosmetic position, converges without overshoot and snaps large GPS jumps',()=>{
 const target={x:12,z:-6},before={...target};let current={x:0,z:0};
 const first=advanceWorldPosition(current,target,.1);assert.ok(first.x>0&&first.x<12);assert.ok(first.z<0&&first.z>-6);assert.equal(first.moving,true);
 for(let i=0;i<25;i++){const next=advanceWorldPosition(current,target,.1);assert.ok(next.x>=current.x&&next.x<=12);current=next;}
 assert.deepEqual(current,{...target,moving:false});assert.deepEqual(target,before);
 assert.deepEqual(advanceWorldPosition({x:0,z:0},{x:500,z:20},.1),{x:500,z:20,moving:false});
 assert.deepEqual(advanceWorldPosition({x:0,z:0},target,.1,true),{...target,moving:false});
});
test('trainer turns through the shortest heading and only available real clips are selected',()=>{
 const turned=worldHeading(Math.PI-.05,-Math.PI+.05,.1);assert.ok(turned>Math.PI-.05&&turned<Math.PI+.05);
 assert.equal(worldClip(['idle','walk','fly'],true,'ant'),'walk');assert.equal(worldClip(['idle','walk','fly'],false,'butterfly'),'fly');assert.equal(worldClip(['Animation'],true),'Animation');assert.equal(worldClip([],true),undefined);
});
test('species idle stays anchored with bounded motion, independent phases and an exact reduced-motion rest',()=>{
 for(const species of ['butterfly','ant','stick'])for(let t=0;t<20;t+=.3){const idle=worldIdle(species,'spawn-1',t);assert.ok(idle.height>=0&&idle.height<=1.1);assert.ok(Math.abs(idle.turn)<=.055);assert.deepEqual(Object.keys(idle).sort(),['height','turn']);}
 assert.notDeepEqual(worldIdle('butterfly','spawn-1',1),worldIdle('butterfly','spawn-2',1));assert.deepEqual(worldIdle('butterfly','spawn-1',1,true),{height:0,turn:0});
});


test('real exported models provide the selected idle/flying clip and Ranger switches between idle and running',()=>{
 const clips=(model:string)=>{const bytes=readFileSync(`public/models/${model}.glb`),json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());return (json.animations??[]).map((clip:{name:string})=>clip.name) as string[];};
 const ranger=clips('Ranger');assert.deepEqual(ranger,['idle','run']);assert.equal(worldClip(ranger,false),'idle');assert.equal(worldClip(ranger,true),'run');
 for(const [species,model] of Object.entries(WALK_MODELS)){const names=clips(model),selected=worldClip(names,false,species);assert.ok(selected&&names.includes(selected),`${species} needs a real idle clip`);assert.ok(['idle','fly'].includes(selected.toLowerCase()),`${species}: ${selected}`);}
});

test('cosmetic wild steps stay within two meters of each real spawn and reduced motion rests exactly',()=>{
 for(const species of ['ant','butterfly','caterpillar'])for(let t=0;t<30;t+=.3){const step=worldRoam(species,'spawn-1',t);assert.ok(Math.hypot(step.x,step.z)<2);assert.ok(Number.isFinite(step.heading));}
 assert.notDeepEqual(worldRoam('ant','spawn-1',0),worldRoam('ant','spawn-1',2));assert.deepEqual(worldRoam('ant','spawn-1',2,true),{x:0,z:0,heading:0,moving:false});
});
