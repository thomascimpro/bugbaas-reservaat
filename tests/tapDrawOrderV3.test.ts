import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {ArcadeTicket} from '../game/arcade/tapDuel';
import {originalTapDuel,originalTapTargets,type OriginalTapDuelState} from '../game/arcade/original/tapDuel';
import {tapDrawOrder,topVisibleTarget} from '../src/arcade/original/tapDrawOrder';

const ticket:ArcadeTicket={id:'draw-order',owner:'qa',challenge:'qa',game:'tap_duel',rules:'original-2',league:'great',seed:42,squad:[],issuedAt:0,expiresAt:Number.MAX_SAFE_INTEGER,mode:'practice',target:{name:'qa',score:0}} as unknown as ArcadeTicket;
const hitBy=(s:OriginalTapDuelState,x:number,y:number)=>{const copy=structuredClone(s);if(!originalTapDuel.input(copy,ticket,{tick:0,x:Math.round(x/360*1000),y:Math.round(y/640*1000)}))return undefined;return Object.keys(copy.hitCounts).find(id=>(copy.hitCounts[id]??0)>(s.hitCounts[id]??0));};

test('Tikduel: where bugs overlap, the bug drawn on top is the bug a tap hits',()=>{
 const s=originalTapDuel.create(ticket);let overlaps=0,naiveWrong=0;
 for(let step=0;step<1500&&!s.finished;step++){
  originalTapDuel.step(s,ticket,20);if(step%5)continue;
  const targets=originalTapTargets(s,ticket);
  for(let i=0;i<targets.length;i++)for(let j=i+1;j<targets.length;j++){
   const a=targets[i],b=targets[j],x0=Math.max(a.motion.x*3.6,b.motion.x*3.6),x1=Math.min(a.motion.x*3.6+a.size,b.motion.x*3.6+b.size),y0=Math.max(a.motion.y*6.4,b.motion.y*6.4),y1=Math.min(a.motion.y*6.4+a.size,b.motion.y*6.4+b.size);
   if(x1-x0<4||y1-y0<4)continue;
   // Judge the exact point the simulation sees after the 0..1000 tap rounding.
   const x=Math.round((x0+x1)/2/360*1000)*.36,y=Math.round((y0+y1)/2/640*1000)*.64,hit=hitBy(s,x,y),top=topVisibleTarget(targets,x,y);
   if(hit===undefined)continue;
   const naiveTop=[...targets].reverse().find(t=>x>=t.motion.x*3.6&&x<=t.motion.x*3.6+t.size&&y>=t.motion.y*6.4&&y<=t.motion.y*6.4+t.size);if(naiveTop?.bugId!==hit)naiveWrong++;
   overlaps++;assert.equal(top?.bugId,hit,`step ${step}: top ${top?.bugId} vs hit ${hit}`);
  }
 }
 assert.ok(naiveWrong>0,'drawing the list as-is (last on top) would show a different bug than the one hit; '+naiveWrong+' cases');
 assert.ok(overlaps>0,'the seed must actually produce overlapping bugs, otherwise this test proves nothing');
});

test('draw order is the reverse of the input-priority list and does not mutate it',()=>{
 const list=[{id:1},{id:2},{id:3}];assert.deepEqual(tapDrawOrder(list).map(t=>t.id),[3,2,1]);assert.deepEqual(list.map(t=>t.id),[1,2,3]);
});
