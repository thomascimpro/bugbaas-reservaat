/** Extracted from CimPro BugBaas-3.0/src/components/minigames/BugGlideGame.tsx.
 * Source SHA256 a27f739159d1bdfc6493edee51a3c5e3fadae5867700660c6dbba300431689f5.
 * Original free XY impulse/inertia, eight objects, streaks and alternating speed/
 * density pressure. Canonical original phone sky (390x640, scale .68) makes the
 * formerly viewport-dependent square collisions identical in server replay.
 */
import type {ArcadeTicket} from '../tapDuel';
import {originalSquadPower} from './types';
import type {OriginalInput,OriginalPort,OriginalState} from './types';
import {seededNumber} from './originalSeed';
import {originalFrameScale} from './originalTiming';

export type GlideEntityKind='bird'|'heart'|'nectar'|'pollen'|'rain'|'shield'|'thorn'|'wind';
export type GlideEntity={expiresAt?:number;id:string;kind:GlideEntityKind;stationary?:boolean;x:number;y:number;vy:number};
export type BugGlideState=OriginalState&{game:'bug_glide';entities:GlideEntity[];x:number;y:number;vx:number;vy:number;rawScore:number;streak:number;maxStreak:number;hits:number;pickups:number;shieldUntil:number;windUntil:number;tapPulses:{at:number;x:number;y:number}[];assist:{extraHeart:number;liftAssist:number;pickupRadiusBonus:number;shieldBonusMs:number}};
const simulationStepMs=66,tickMs=16,gravity=.34,liftImpulse=-3.85,horizontalImpulse=1.35,maxPlayerX=68,maxPickupX=64,tailwindScoreBoostMs=4200,maxHorizontalSpeed=2.35,maxVerticalSpeed=5.15;
const playerHitboxPx=66,playerVisualPx=78,leftControlStripWidth=32,referenceSkyWidth=390,referenceSkyHeight=640,phoneGameScale=.68;
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export const isGlidePickup=(kind:GlideEntityKind)=>kind==='heart'||kind==='nectar'||kind==='pollen'||kind==='shield'||kind==='wind';
export function glideDifficulty(elapsed:number){
 const stage=Math.max(0,Math.floor(elapsed/12000)),pressure=Math.min(7,stage),mode:'density'|'speed'=stage%2===0?'density':'speed';
 return {densityLevel:mode==='density'?pressure:Math.max(0,pressure-1),mode,speedLevel:mode==='speed'?pressure:Math.max(0,pressure-1)};
}
function spreadPickupY(current:GlideEntity[],baseY:number,x:number,step:number){
 let y=baseY;
 for(let attempt=0;attempt<4;attempt++){
  const crowded=current.some(item=>isGlidePickup(item.kind)&&Math.abs(item.x-x)<22&&Math.abs(item.y-y)<16);
  if(!crowded)return y;const direction=(step+attempt)%2===0?1:-1;y=Math.max(12,Math.min(80,y+direction*(18+attempt*6)));
 }
 return y;
}
function spawnEntities(current:GlideEntity[],elapsed:number,seed:string){
 const difficulty=glideDifficulty(elapsed),maxEntities=22+difficulty.densityLevel*2;
 if(current.length>maxEntities)return current;
 const interval=Math.max(155,640-difficulty.densityLevel*58);
 if(elapsed%interval>=tickMs)return current;
 const step=Math.floor(elapsed/interval),roll=seededNumber(seed,step),bonusCrowded=current.filter(item=>isGlidePickup(item.kind)&&item.x>78).length>=3;
 const kind:GlideEntityKind=bonusCrowded?(roll>.5?'bird':'rain'):step%17===0?'heart':step%13===0?'shield':step%9===0?'wind':step%5===0?'nectar':step%7===0?'thorn':roll>.64?'pollen':roll>.44?'rain':'bird';
 const baseY=12+Math.round(seededNumber(seed,step+3)*68),stationary=kind==='heart'||kind==='shield',x=stationary?14+Math.round(seededNumber(seed,step+5)*(maxPickupX-14)):104,y=isGlidePickup(kind)?spreadPickupY(current,baseY,x,step):baseY,expiresAt=stationary?elapsed+7000:undefined,vy=kind==='rain'?.9:kind==='pollen'?Math.sin(step)*.35:0;
 const next:GlideEntity[]=[...current,{expiresAt,id:`${elapsed}:${step}`,kind,stationary,x,y,vy}];
 if(difficulty.mode==='density'){
  if(elapsed>15000&&step%4===0)next.push({id:`${elapsed}:${step}:pair`,kind:'thorn',x:112,y:Math.max(12,Math.min(80,y+(step%2===0?18:-18))),vy:0});
  if(elapsed>30000&&step%5===0)next.push({id:`${elapsed}:${step}:rainline`,kind:'rain',x:118,y:Math.max(12,Math.min(80,y-12)),vy:.6});
  if(elapsed>46000&&step%6===0)next.push({id:`${elapsed}:${step}:birdline`,kind:'bird',x:124,y:Math.max(12,Math.min(80,y+12)),vy:0});
  if(elapsed>60000&&step%3===0)next.push({id:`${elapsed}:${step}:endgame`,kind:step%2===0?'thorn':'bird',x:132,y:Math.max(12,Math.min(80,y+(step%2===0?-24:24))),vy:0});
  if(elapsed>78000&&step%4===0)next.push({id:`${elapsed}:${step}:endrain`,kind:'rain',x:140,y:Math.max(12,Math.min(80,y+10)),vy:.8});
 }
 return next;
}
function movePlayer(s:BugGlideState,frameScale:number){
 s.vx=clamp(s.vx*Math.pow(.91,frameScale),-maxHorizontalSpeed,maxHorizontalSpeed);
 s.vy=clamp(s.vy*Math.pow(.94,frameScale)+gravity*frameScale,-maxVerticalSpeed,maxVerticalSpeed);
 const leftCharacterBoundary=((leftControlStripWidth+(playerVisualPx*phoneGameScale)/2)/referenceSkyWidth)*100;
 s.x=Math.max(leftCharacterBoundary,Math.min(maxPlayerX,s.x+s.vx*frameScale));s.y=Math.max(10,Math.min(82,s.y+s.vy*frameScale));
 if(s.x<=leftCharacterBoundary||s.x>=maxPlayerX)s.vx*=-.3;
 if(s.y<=10)s.vy=Math.max(.8,s.vy*-.2);
 if(s.y>=82)s.vy=Math.min(0,s.vy*-.35);
}
export function glideSquareHit(s:BugGlideState,entity:GlideEntity){
 const playerHalfX=(playerHitboxPx*phoneGameScale/referenceSkyWidth)*50,playerHalfY=(playerHitboxPx*phoneGameScale/referenceSkyHeight)*50;
 const entitySize=(entity.kind==='bird'?48:entity.kind==='heart'?44:52)*phoneGameScale;
 const bonus=isGlidePickup(entity.kind)?s.assist.pickupRadiusBonus:0;
 return Math.abs(entity.x-s.x)<=playerHalfX+(entitySize+bonus)/referenceSkyWidth*50&&Math.abs(entity.y-s.y)<=playerHalfY+(entitySize+bonus)/referenceSkyHeight*50;
}
export function glideCollect(s:BugGlideState,entity:GlideEntity){
 s.pickups++;s.streak++;s.maxStreak=Math.max(s.maxStreak,s.streak);
 s.rawScore+=entity.kind==='nectar'?65:entity.kind==='pollen'?32:entity.kind==='heart'?20:entity.kind==='wind'?55:45;
 if(entity.kind==='heart')s.hearts=Math.min(3+s.assist.extraHeart,s.hearts+1);
 if(entity.kind==='shield')s.shieldUntil=s.elapsedMs+6000+s.assist.shieldBonusMs;
 if(entity.kind==='wind')s.windUntil=s.elapsedMs+tailwindScoreBoostMs;
}
function takeHit(s:BugGlideState){
 if(s.elapsedMs<s.shieldUntil){s.shieldUntil=0;return;}
 s.hits++;s.streak=0;s.hearts--;
}
export function glideFinalScore(s:BugGlideState){return Math.max(0,Math.round(s.rawScore)+Math.round(s.elapsedMs/1000)*2+s.pickups*18+s.maxStreak*9+s.hearts*35-s.hits*45);}
export const bugGlidePort:OriginalPort<BugGlideState>={
 game:'bug_glide',name:'Windvlucht',help:'Tik links of rechts van je bug om vrij door de lucht te sturen. Iedere tik geeft een opwaartse duw. Pak nectar, pollen, hartjes, schild en wind; ontwijk vogels, regen en doornen.',durationMs:600000,
 create(ticket){const p=originalSquadPower(ticket.squad,ticket.league),assist={extraHeart:ticket.squad.length===3&&p.hp>=.5?1:0,liftAssist:p.attack*.16,pickupRadiusBonus:Math.round(p.hp*5),shieldBonusMs:Math.round(p.defense*1400)};return {game:'bug_glide',elapsedMs:0,score:0,finished:false,reason:null,hearts:3+assist.extraHeart,entities:[],x:18,y:48,vx:0,vy:0,rawScore:0,streak:0,maxStreak:0,hits:0,pickups:0,shieldUntil:0,windUntil:0,tapPulses:[],assist};},
 step(s,ticket,dt){
  if(s.finished)return;s.elapsedMs+=dt;const frameScale=originalFrameScale(s.elapsedMs,dt,simulationStepMs);
  if(s.shieldUntil>0&&s.elapsedMs>=s.shieldUntil)s.shieldUntil=0;
  movePlayer(s,frameScale);
  const difficulty=glideDifficulty(s.elapsedMs),speed=Math.min(5.35,2.02+difficulty.speedLevel*.34);
  const moved=s.entities.map(item=>item.stationary?item:{...item,x:item.x-speed*frameScale,y:item.y+item.vy*frameScale}).filter(item=>(item.expiresAt===undefined||s.elapsedMs<item.expiresAt)&&item.x>-12&&item.y>2&&item.y<96),survivors:GlideEntity[]=[];
  for(const entity of moved){if(!glideSquareHit(s,entity)){survivors.push(entity);continue;}if(isGlidePickup(entity.kind))glideCollect(s,entity);else takeHit(s);}
  s.entities=spawnEntities(survivors,s.elapsedMs,String(ticket.seed));
  const tailwindBoost=s.elapsedMs<s.windUntil?.35:0,edgeBonus=s.x>58?.16:0;
  s.rawScore+=(.2+tailwindBoost+edgeBonus)*frameScale;s.score=Math.floor(s.rawScore);s.tapPulses=s.tapPulses.filter(p=>s.elapsedMs-p.at<260);
  if(s.hearts<=0||s.elapsedMs>=600000){s.finished=true;s.reason=s.hearts<=0?'hearts':'time';s.score=glideFinalScore(s);}
 },
 input(s,_ticket,input:OriginalInput){
  if(s.finished||(input.action??'down')!=='down'||input.control)return false;
  const tapX=input.x/10,tapY=input.y/10,distanceFromBug=clamp((s.x-tapX)/62,-1,1),lift=liftImpulse-s.assist.liftAssist*.85;
  s.vx=clamp(s.vx+distanceFromBug*horizontalImpulse,-maxHorizontalSpeed,maxHorizontalSpeed);s.vy=clamp(Math.min(s.vy,0)+lift,-maxVerticalSpeed,maxVerticalSpeed);
  s.tapPulses=[...s.tapPulses.slice(-4),{at:s.elapsedMs,x:tapX,y:tapY}];return true;
 }
};
