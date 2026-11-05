import {test} from 'node:test';
import assert from 'node:assert/strict';
import {judgeNet} from '../game/fieldV2';
import {netSpin,projectNetSwing,validNetSwing} from '../game/netThrowV2';
import {originalBubbleSwarm,solidBubblePlan,bubbleGridPoint} from '../game/arcade/original/bubbleSwarm';
import type {GridBubble} from '../game/arcade/original/bubbleSwarm';
import {gameRules,replayArcade} from '../game/arcade/games';
import {isOriginalRules} from '../game/arcade/original';
import type {ArcadeTicket} from '../game/arcade/tapDuel';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,rollGoBug,transferManyGo} from '../game/goV2';
import {smartTransferSelectionV2,TRANSFER_BATCH} from '../game/transferSelectionV2';
import {awayCursorV2,awaySummaryV2} from '../game/awaySummaryV2';
import type {Specimen} from '../game/typesV2';

const NOW=Date.UTC(2026,10,5,12),stroke=(ms=180)=>Array.from({length:7},(_,i)=>({x:.5,y:1-.3*i/6,t:Math.round(ms*i/6)}));
test('new swing is controllable across normal swipe speeds while stopped drags cannot spend a net',()=>{
 for(const ms of [80,120,180,280,400]){const points=stroke(ms),landing=projectNetSwing(points);assert.equal(validNetSwing(points),true);assert.ok(landing.y>.3&&landing.y<.5);assert.notEqual(judgeNet({kind:'swing',points},null).grade,'miss');}
 const stopped=[...stroke(),{x:.5,y:.7,t:500}];assert.equal(validNetSwing(stopped),false);assert.throws(()=>judgeNet({kind:'swing',points:stopped},null));assert.equal(validNetSwing(stroke(1500)),false);
});
test('visible spin and the server bonus require a circular wind-up, not a bent straight swipe',()=>{
 const plain=stroke(),bent=plain.map((p,i)=>({...p,x:p.x+Math.sin(i/6*Math.PI)*.15}));assert.equal(netSpin(bent).ready,false);
 const circle=[{x:.5,y:1,t:0},...Array.from({length:19},(_,i)=>({x:.5+.12*Math.cos(Math.PI/2+i/18*2*Math.PI),y:.98+.08*Math.sin(Math.PI/2+i/18*2*Math.PI),t:40+i*40}))];
 assert.equal(netSpin(circle).ready,true);const last=circle.at(-1)!,points=[...circle,...Array.from({length:6},(_,i)=>({x:.5,y:last.y-.3*(i+1)/6,t:last.t+30*(i+1)}))];assert.equal(judgeNet({kind:'swing',points},null).curved,true);assert.equal(judgeNet({kind:'swing',points:plain},null).curved,false);
});
const ticket=(rules=gameRules('bubble_swarm')):ArcadeTicket=>({id:'solid-bubble-test',owner:'test',game:'bubble_swarm',rules,league:'great',seed:42,squad:[],challenge:'solid',issuedAt:0,expiresAt:86400000,target:{kind:'computer',name:'Computer',score:80},status:'started'});
test('solid bubbles stop at the front even when an empty slot exists behind the wall',()=>{
 const board:GridBubble[]=Array.from({length:32},(_,i)=>({id:'b'+i,row:Math.floor(i/8),col:i%8,kind:'bee' as const})).filter(b=>b.row!==1||b.col!==3),aim=bubbleGridPoint(1,3),plan=solidBubblePlan(board,aim,0);assert.ok(plan);assert.ok(plan.targetCell.row>=4);assert.notDeepEqual(plan.targetCell,{row:1,col:3});
 for(let i=1;i<plan.path.length;i++){const a=plan.path[i-1],b=plan.path[i],dx=b.x-a.x,dy=(b.y-a.y)*600/360,l=dx*dx+dy*dy;for(const bubble of board){const c=bubbleGridPoint(bubble.row,bubble.col),x=c.x-a.x,y=(c.y-a.y)*600/360,t=Math.max(0,Math.min(1,(x*dx+y*dy)/l));assert.ok(Math.hypot(x-dx*t,y-dy*t)>=10.9,'flight crosses '+bubble.id);}}
 const bank=solidBubblePlan(board,{x:5,y:45},0);assert.ok(bank);assert.ok(bank.path.length>=3,'wall bank remains possible');
});
test('bubble rules are versioned and legacy replays retain their original targeting',()=>{
 assert.equal(gameRules('bubble_swarm'),'bubble_swarm-3');assert.equal(isOriginalRules(ticket()),true);assert.equal(isOriginalRules(ticket('bubble_swarm-2')),true);assert.equal(originalBubbleSwarm.create(ticket()).solid,true);assert.equal(originalBubbleSwarm.create(ticket('bubble_swarm-2')).solid,false);
 const t=ticket(),inputs=[{tick:0,x:500,y:320,action:'down' as const},{tick:1,x:500,y:320,action:'up' as const},{tick:150,x:150,y:400,action:'down' as const},{tick:152,x:150,y:400,action:'up' as const}];assert.deepEqual(replayArcade(t,inputs),replayArcade(t,inputs));
});
function bug(id:string,iv=0,level=1):Specimen{return {id,species:'ant',level:1,shiny:false,favorite:false,hearts:0,item:null,source:'walking',obtainedAt:NOW,autoCaught:true,go:{...rollGoBug('ant',id),iv:[iv,iv,iv],level}};}
function player(){const p=freshV2('cleanup','CLEAN123',NOW);ensureField(p,NOW);ensureGo(p,NOW);p.go!.team=[];p.specimens=[];return p;}
test('smart return cleanup handles more than50 in one plan and preserves IV, type/CP coverage and investments',()=>{
 const p=player(),weak=Array.from({length:120},(_,i)=>bug('weak'+i));p.specimens=[...weak,bug('perfect',15,5),bug('strong',12,25),{...bug('star'),favorite:true},{...bug('shiny'),shiny:true},{...bug('buddy')},{...bug('team')},{...bug('item'),go:{...bug('item').go!,item:'thorn'}}];p.buddy='buddy';p.go!.team=['team'];
 const plan=smartTransferSelectionV2(p,weak);assert.ok(plan.length>100);const safe=['perfect','strong','star','shiny','buddy','team','item'];assert.ok(smartTransferSelectionV2(p).every(s=>!safe.includes(s.id)));
 const ids=plan.map(s=>s.id);for(let i=0;i<ids.length;i+=TRANSFER_BATCH)transferManyGo(p,ids.slice(i,i+TRANSFER_BATCH));assert.ok(safe.every(id=>p.specimens.some(s=>s.id===id)));assert.equal(p.specimens.some(s=>ids.includes(s.id)),false);
});
test('away receipt retains all actual auto-caught specimens beyond the bounded journal, without including manual catches',()=>{
 const p=player(),before=awayCursorV2(p,NOW-1000);p.specimens=[...Array.from({length:120},(_,i)=>bug('auto'+i)),{...bug('manual'),autoCaught:undefined}];p.go!.auto.totals={caught:120,missed:0,dust:12000,xp:1200};p.go!.auto.last={species:'ant',at:NOW,caught:true};const r=awaySummaryV2(p,before);assert.equal(r.caught,120);assert.equal(r.bugs.length,120);assert.ok(r.bugs.every(b=>b.specimenId!=='manual'));
 const seen=awayCursorV2(p,NOW);assert.equal(awaySummaryV2(p,seen).bugs.length,0,'return receipt does not repeat the same catches');
});
