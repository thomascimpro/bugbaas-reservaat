/** Mechanics extracted from CimPro BugBaas-3.0/src/components/minigames/WebRunnerGame.tsx.
 * Source SHA256 bdaf1e7e8ed5c21b52aa9569a502ae779bd353c3af1c8d74f4826a65e035f8f5.
 * React refs become serializable state and Date.now becomes elapsedMs; the original
 * movement, pattern, pickup, jump, difficulty and score formulas are retained.
 */
import type {ArcadeTicket} from '../tapDuel';
import {originalSquadPower} from './types';
import type {OriginalInput,OriginalPort,OriginalState} from './types';
import {seededLane} from './originalSeed';
import {originalFrameScale} from './originalTiming';

export type RunnerEntityKind='boost'|'flyer'|'magnet'|'nectar'|'shield'|'web';
export type RunnerEntity={id:string;kind:RunnerEntityKind;lane:0|1|2;y:number};
export type WebRunnerState=OriginalState&{game:'web_runner';lane:0|1|2;entities:RunnerEntity[];combo:number;hitCount:number;maxCombo:number;pickups:number;scoreBonus:number;jumpUntil:number;shield:boolean;magnetUntil:number;boostUntil:number;assist:{collisionWindowBonus:number;magnetBonusMs:number;startShield:boolean}};
const simulationStepMs=75,playerY=84,maxHits=3,maxEntities=42,jumpDurationMs=620,difficultyRampMs=52000;
export const isRunnerPickup=(kind:RunnerEntityKind)=>kind==='boost'||kind==='magnet'||kind==='nectar'||kind==='shield';

export function runnerDifficulty(elapsedMs:number){
  const progress=Math.min(1,elapsedMs/difficultyRampMs);
  const endgameTicks=elapsedMs>60000?Math.floor((elapsedMs-60000)/7000):0;
  const tier=Math.min(10,Math.floor(elapsedMs/14000)+endgameTicks);
  return {gap:Math.max(3,21-progress*10-endgameTicks*1.8),spawnMs:Math.max(110,720-progress*320-endgameTicks*55),speed:Math.min(7.4,1.22+progress*1.25+endgameTicks*0.58),tier};
}
export function runnerLiveScore(elapsedMs:number,run:Pick<WebRunnerState,'pickups'|'maxCombo'|'scoreBonus'|'hitCount'>){return Math.max(0,Math.round(elapsedMs/1000)*9+run.pickups*12+run.maxCombo*7+run.scoreBonus-run.hitCount*45);}

function spawnPattern(s:WebRunnerState,ticket:ArcadeTicket,items:RunnerEntity[]):RunnerEntity[]{
 if(items.length>=maxEntities)return items;
 const elapsed=s.elapsedMs,lastY=Math.min(...items.map(item=>item.y),100),difficulty=runnerDifficulty(elapsed);
 if(lastY<difficulty.gap)return items;
 const step=Math.floor(elapsed/difficulty.spawnMs),seedLane=seededLane(String(ticket.seed),step),lanes:Array<0|1|2>=[0,1,2];
 const pickupLane=lanes[(step+seedLane)%lanes.length],safeLane=pickupLane;
 const pickupKind:RunnerEntityKind=step%13===0?'shield':step%9===0?'magnet':step%7===0?'boost':'nectar';
 const next:RunnerEntity[]=[{id:`${elapsed}:pickup`,kind:pickupKind,lane:pickupLane,y:-30}];
 lanes.filter(item=>item!==safeLane).forEach((obstacleLane,index)=>next.push({id:`${elapsed}:hazard:${obstacleLane}`,kind:(step+index)%3===0?'flyer':'web',lane:obstacleLane,y:-8-index*12}));
 if(difficulty.tier>=1&&step%4===0)next.push({id:`${elapsed}:tier1-web`,kind:'web',lane:safeLane,y:-34});
 if(difficulty.tier>=2&&step%5===0)next.push({id:`${elapsed}:tier2-flyer`,kind:'flyer',lane:lanes[(safeLane+1+(step%2))%3],y:-44});
 if(difficulty.tier>=3&&step%6===0)next.push({id:`${elapsed}:tier3-chain`,kind:'web',lane:lanes[(safeLane+2)%3],y:-56});
 if(difficulty.tier>=4&&step%9===0)next.push({id:`${elapsed}:tier4-pressure`,kind:'flyer',lane:lanes[(safeLane+step)%3],y:-70});
 if(difficulty.tier>=5&&step%3===0)next.push({id:`${elapsed}:tier5-web`,kind:'web',lane:lanes[(safeLane+1)%3],y:-82});
 if(difficulty.tier>=6&&step%4===0)next.push({id:`${elapsed}:tier6-flyer`,kind:'flyer',lane:lanes[(safeLane+2)%3],y:-96});
 if(difficulty.tier>=7&&step%5===0)next.push({id:`${elapsed}:tier7-blocker`,kind:step%2===0?'web':'flyer',lane:safeLane,y:-110});
 return [...items,...next].slice(0,maxEntities);
}
export function runnerCollision(s:WebRunnerState,entity:RunnerEntity){
 const now=s.elapsedMs;
 if(isRunnerPickup(entity.kind)){
  s.pickups++;s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);s.scoreBonus+=entity.kind==='nectar'?12:18;
  if(entity.kind==='shield')s.shield=true;
  if(entity.kind==='magnet')s.magnetUntil=now+5200+s.assist.magnetBonusMs;
  if(entity.kind==='boost')s.boostUntil=now+4200;
  return;
 }
 if((entity.kind==='web'||entity.kind==='flyer')&&now<s.jumpUntil){s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);s.scoreBonus+=entity.kind==='flyer'?9:6;return;}
 if(s.shield){s.shield=false;s.combo=0;return;}
 s.hitCount++;s.hearts=Math.max(0,maxHits-s.hitCount);s.combo=0;
 if(s.hitCount>=maxHits){s.finished=true;s.reason='hearts';}
}
export const webRunnerPort:OriginalPort<WebRunnerState>&{controls:readonly string[]}={
 game:'web_runner',name:'Webrenner',help:'Veeg links of rechts om van baan te wisselen. Tik of veeg omhoog om 620 ms te springen. Pak nectar, schild, magneet en boost; overleef zo lang mogelijk.',durationMs:600000,controls:['left','right','jump'],
 create(ticket){const p=originalSquadPower(ticket.squad,ticket.league),assist={collisionWindowBonus:Math.round(p.hp*4),magnetBonusMs:Math.round(p.attack*1200),startShield:ticket.squad.length===3&&p.defense>=.5};return {game:'web_runner',elapsedMs:0,score:0,finished:false,reason:null,hearts:3,lane:1,entities:[],combo:0,hitCount:0,maxCombo:0,pickups:0,scoreBonus:0,jumpUntil:0,shield:assist.startShield,magnetUntil:0,boostUntil:0,assist};},
 step(s,ticket,dt){
  if(s.finished)return;s.elapsedMs+=dt;
  const frameScale=originalFrameScale(s.elapsedMs,dt,simulationStepMs),difficulty=runnerDifficulty(s.elapsedMs),speed=(difficulty.speed+(s.elapsedMs<s.boostUntil?.18:0))*frameScale;
  const moved=s.entities.map(item=>({...item,y:item.y+speed})).filter(item=>item.y<112),spawned=spawnPattern(s,ticket,moved),survivors:RunnerEntity[]=[];
  const collisionWindow=5+s.assist.collisionWindowBonus;
  for(const entity of spawned){
   const magnetCatch=isRunnerPickup(entity.kind)&&s.elapsedMs<s.magnetUntil&&Math.abs(entity.lane-s.lane)<=1&&Math.abs(entity.y-playerY)<18;
   const collides=entity.lane===s.lane&&Math.abs(entity.y-playerY)<=collisionWindow;
   if(collides||magnetCatch)runnerCollision(s,entity);else survivors.push(entity);
  }
  s.entities=survivors;s.score=runnerLiveScore(s.elapsedMs,s);
  if(!s.finished&&s.elapsedMs>=600000){s.finished=true;s.reason='time';}
 },
 input(s,_ticket,input:OriginalInput){
  if(s.finished||(input.action??'down')!=='down')return false;
  const control=input.control??'jump';
  if(control==='left'||control==='right'){s.lane=Math.max(0,Math.min(2,s.lane+(control==='left'?-1:1))) as 0|1|2;return true;}
  if(control!=='jump'||s.elapsedMs<s.jumpUntil)return false;s.jumpUntil=s.elapsedMs+jumpDurationMs;return true;
 }
};
