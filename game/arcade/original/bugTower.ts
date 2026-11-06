/** Extracted from CimPro BugBaas-3.0/src/components/minigames/BugTowerGame.tsx.
 * Source SHA256 dc21f2a1085a34c94c20d625587da4e721263fa59a124a7d775fa2db67f382bb.
 * Original hold/run/charge/release jump, salto chain, world progression and
 * pickups. React refs and wall clock become a replayable state/elapsedMs.
 */
import type {ArcadeTicket} from '../tapDuel';
import {originalSquadPower} from './types';
import type {OriginalInput,OriginalPort,OriginalState} from './types';
import {seededNumber} from './originalSeed';
import {originalFrameScale} from './originalTiming';
import {towerJumpVelocity,towerPlatformGap,towerPlatformX,towerScrollSpeed} from './originalBugTowerBalance';

export type TowerPlatform={drift:number;floor:number;id:string;width:number;x:number;y:number};
export type TowerPickup={id:string;kind:'coin'|'rocket'|'spring';x:number;y:number};
export type TowerPlayer={grounded:boolean;highJump:boolean;lastGroundAt:number;spinAngle:number;spinning:boolean;vx:number;vy:number;x:number;y:number};
export type BugTowerState=OriginalState&{game:'bug_tower';platforms:TowerPlatform[];pickups:TowerPickup[];player:TowerPlayer;nextFloor:number;floor:number;rawScore:number;combo:number;maxCombo:number;manualDirection:-1|0|1;runDistance:number;landedAt:number;chainUntil:number;coinsCollected:number;rocketUntil:number;rocketCooldownUntil:number;springReady:boolean;assist:{landingMargin:number;coyoteBonusMs:number}};
const simulationStepMs=20,gravity=.145,horizontalAcceleration=.035,maxHorizontalSpeed=.6,playerHalfWidth=6.5,playerHalfHeight=5.2,landingChainWindowMs=360,rocketDurationMs=3000,rocketClimbSpeed=-.76;
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export function initialTowerPlayer():TowerPlayer{return {grounded:true,highJump:false,lastGroundAt:0,spinAngle:0,spinning:false,vx:0,vy:0,x:50,y:82.8};}
export function platformWidthForFloor(floor:number,seed='balance'){const baseWidth=56+seededNumber(seed,0)*6;return clamp(baseWidth*platformWidthMultiplierForFloor(floor),12,62);}
export function platformWidthMultiplierForFloor(floor:number){
 if(floor<20)return 1;
 if(floor<=50)return 1-((floor-20)/30)*.5;
 if(floor<=100)return .5-((floor-50)/50)*(1/6);
 if(floor<=200)return (1/3)-((floor-100)/100)*(1/12);
 return Math.max(.18,.25-((floor-200)/400)*.07);
}
export function movingPlatformChance(floor:number){
 if(floor<8)return 0;
 if(floor<=25)return .1+((floor-8)/17)*.15;
 if(floor<=50)return .25+((floor-25)/25)*.2;
 if(floor<=100)return .45+((floor-50)/50)*.2;
 if(floor<=200)return .65+((floor-100)/100)*.17;
 return Math.min(.9,.82+((floor-200)/100)*.08);
}
export function createTowerPlatform(previous:TowerPlatform|null,floor:number,seed:string):TowerPlatform{
 const width=platformWidthForFloor(floor,seed),gap=towerPlatformGap(floor,seededNumber(seed,floor*5+1),seededNumber(seed,floor*5+7)),x=towerPlatformX(previous?.x??12,previous?.width??76,width,floor,seededNumber(seed,floor*5+2)),driftRoll=seededNumber(seed,floor*5+3),moving=driftRoll<movingPlatformChance(floor),drift=moving?(seededNumber(seed,floor*5+4)>.5?1:-1)*clamp(.032+floor*.0002,.032,.12):0;
 return {drift,floor,id:`floor-${floor}`,width,x,y:(previous?.y??2)-gap};
}
export function buildInitialPlatforms(seed:string){const platforms:TowerPlatform[]=[{drift:0,floor:0,id:'floor-0',width:76,x:12,y:88}];for(let floor=1;floor<11;floor++)platforms.push(createTowerPlatform(platforms[platforms.length-1],floor,seed));return platforms;}
export function platformBoostForFloor(seed:string,floor:number):'rocket'|'spring'|null{
 let boostFloor=8+Math.floor(seededNumber(seed,701)*3),index=0;
 while(boostFloor<=floor){if(boostFloor===floor)return seededNumber(seed,730+index*43)<.44?'rocket':'spring';boostFloor+=8+Math.floor(seededNumber(seed,760+index*41)*7);index++;}
 return null;
}
export function createTowerPickup(platform:TowerPlatform,seed:string):TowerPickup|null{
 if(platform.floor<=0)return null;
 const boost=platformBoostForFloor(seed,platform.floor),kind=boost??(platform.floor===3||seededNumber(seed,platform.floor*5+6)>.82?'coin':null);
 if(!kind)return null;return {id:`pickup-${platform.floor}-${kind}`,kind,x:8+seededNumber(seed,platform.floor*17+91)*84,y:platform.y-4-seededNumber(seed,platform.floor*19+103)*5};
}
function movePlatform(platform:TowerPlatform,scroll:number):TowerPlatform{
 if(!platform.drift)return {...platform,y:platform.y+scroll};
 let x=platform.x+platform.drift,drift=platform.drift;
 if(x<=3.5||x+platform.width>=96.5){drift*=-1;x=clamp(x,3.5,96.5-platform.width);}
 return {...platform,drift,x,y:platform.y+scroll};
}
export function towerZone(floor:number){const names=['Ice Citadel','Hive Jungle','Ember Forge','Sky Temple','Cosmic Void'],zone=Math.floor(floor/100),remix=Math.floor(zone/names.length);return `${names[zone%names.length]}${remix>0?` R${remix}`:''}`;}
export const towerCharge=(s:BugTowerState)=>Math.round(clamp(s.runDistance/32,0,1)*100);
export const towerChainProgress=(s:BugTowerState)=>clamp((s.chainUntil-s.elapsedMs)/landingChainWindowMs,0,1);
export function towerAnimationFrame(s:BugTowerState){const p=s.player;if(s.elapsedMs-s.landedAt<120&&p.grounded)return 5;if(p.vy<-.2)return 3;if(p.vy>.45)return 4;if(Math.abs(p.vx)>.12)return p.vx<0?1:2;return 0;}
export function landOnTowerFloor(s:BugTowerState,floor:number){
 const skipped=floor-s.floor;s.floor=floor;if(skipped>=2)s.combo++;else s.combo=0;s.maxCombo=Math.max(s.maxCombo,s.combo);s.rawScore+=floor*2+Math.max(0,skipped-1)*35+s.combo*25;s.landedAt=s.elapsedMs;
}
export function towerJumpFromRun(s:BugTowerState){
 const player=s.player;if(!player.grounded&&s.elapsedMs-player.lastGroundAt>190+s.assist.coyoteBonusMs){s.runDistance=0;return false;}
 const speed=clamp(Math.abs(player.vx)/maxHorizontalSpeed,0,1),charge=clamp(s.runDistance/32,0,1),jumpVelocity=towerJumpVelocity(speed,charge,s.springReady),spinning=s.springReady||(speed>=.72&&charge>=.58);
 s.springReady=false;s.player={...player,grounded:false,highJump:jumpVelocity<-2.15,spinAngle:0,spinning,vy:jumpVelocity};s.chainUntil=0;s.runDistance=0;return true;
}
export function tryTowerLandingChain(s:BugTowerState){
 if(s.finished||s.chainUntil<=0||s.elapsedMs>s.chainUntil)return false;
 s.player={...s.player,grounded:false,highJump:true,spinAngle:0,spinning:true,vy:-2.35};s.chainUntil=0;return true;
}
export const towerFinalScore=(s:BugTowerState)=>Math.max(1,Math.round(s.rawScore+s.floor*14+s.maxCombo*45));
export const bugTowerPort:OriginalPort<BugTowerState>&{controls:readonly string[]}={
 game:'bug_tower',name:'Bladtoren',help:'Houd links of rechts vast om te rennen en je sprong op te laden. Laat los om te springen. Tik meteen na een salto-landing voor een extra salto. Pak munten, raketten en superveren; overleef tot je valt.',durationMs:600000,controls:['left','right'],
 create(ticket){const seed=String(ticket.seed),platforms=buildInitialPlatforms(seed),pickups=platforms.map(p=>createTowerPickup(p,seed)).filter((p):p is TowerPickup=>Boolean(p)),p=originalSquadPower(ticket.squad,ticket.league);return {game:'bug_tower',elapsedMs:0,score:0,finished:false,reason:null,hearts:1,platforms,pickups,player:initialTowerPlayer(),nextFloor:platforms.length,floor:0,rawScore:0,combo:0,maxCombo:0,manualDirection:0,runDistance:0,landedAt:0,chainUntil:0,coinsCollected:0,rocketUntil:0,rocketCooldownUntil:0,springReady:false,assist:{landingMargin:playerHalfWidth*Math.min(.14,p.defense*.12+(p.has('grass')?.02:0)),coyoteBonusMs:Math.round(p.hp*60)}};},
 step(s,ticket,dt){
  if(s.finished)return;s.elapsedMs+=dt;
  const now=s.elapsedMs,frameScale=originalFrameScale(now,dt,simulationStepMs),previous=s.player,input=s.manualDirection,rocketActive=s.rocketUntil>now,friction=Math.pow(previous.grounded?.84:.995,frameScale);
  const vx=input?clamp(previous.vx*Math.pow(.96,frameScale)+input*horizontalAcceleration*frameScale,-maxHorizontalSpeed,maxHorizontalSpeed):previous.vx*friction;
  if(previous.grounded&&input)s.runDistance=Math.min(32,s.runDistance+Math.abs(vx)*frameScale);
  const nextVy=rocketActive?rocketClimbSpeed:Math.min(2.25,previous.vy+gravity*frameScale);
  let nextPlayer:TowerPlayer={...previous,grounded:false,spinAngle:previous.spinning?previous.spinAngle+Math.sign(previous.vx||input||1)*18*frameScale:0,vx,vy:nextVy,x:previous.x+vx*frameScale,y:previous.y+(rocketActive?rocketClimbSpeed:nextVy)*frameScale};
  if(nextPlayer.x<=playerHalfWidth){nextPlayer.x=playerHalfWidth;nextPlayer.vx=Math.abs(nextPlayer.vx)*.9;}else if(nextPlayer.x>=100-playerHalfWidth){nextPlayer.x=100-playerHalfWidth;nextPlayer.vx=-Math.abs(nextPlayer.vx)*.9;}
  const scroll=towerScrollSpeed(s.floor,now)*frameScale;
  let platforms=s.platforms.map(p=>movePlatform(p,scroll)),pickups=s.pickups.map(p=>({...p,y:p.y+scroll}));nextPlayer.y+=scroll;
  const oldBottom=previous.y+playerHalfHeight+scroll,nextBottom=nextPlayer.y+playerHalfHeight;
  if(nextPlayer.vy>=0){
   const margin=s.assist.landingMargin,landing=platforms.filter(p=>oldBottom<=p.y+.8&&nextBottom>=p.y-.5).filter(p=>nextPlayer.x+playerHalfWidth+margin>=p.x&&nextPlayer.x-playerHalfWidth-margin<=p.x+p.width).sort((a,b)=>a.y-b.y)[0];
   if(landing){const chainLanding=previous.highJump||previous.spinning;nextPlayer.y=landing.y-playerHalfHeight;nextPlayer.vy=0;nextPlayer.grounded=true;nextPlayer.highJump=false;nextPlayer.lastGroundAt=now;nextPlayer.spinAngle=0;nextPlayer.spinning=false;
    // Preserve the advertised 360 ms window across subsequent grounded ticks.
    if(!previous.grounded)s.chainUntil=chainLanding?now+landingChainWindowMs:0;
    if(landing.floor>s.floor)landOnTowerFloor(s,landing.floor);
   }
  }
  const collected=pickups.filter(p=>(p.kind!=='rocket'||s.rocketCooldownUntil<=now)&&Math.abs(p.x-nextPlayer.x)<=7.5&&Math.abs(p.y-nextPlayer.y)<=7.5);
  if(collected.length){const ids=new Set(collected.map(p=>p.id));pickups=pickups.filter(p=>!ids.has(p.id));for(const pickup of collected){if(pickup.kind==='coin'){s.coinsCollected++;s.rawScore+=45;}else if(pickup.kind==='rocket'&&s.rocketCooldownUntil<=now){s.rocketUntil=now+rocketDurationMs;s.rocketCooldownUntil=now+9000;}else if(pickup.kind==='spring'){s.springReady=true;s.rawScore+=100;}}}
  if(nextPlayer.y<36){const shift=36-nextPlayer.y;nextPlayer.y=36;platforms=platforms.map(p=>({...p,y:p.y+shift}));pickups=pickups.map(p=>({...p,y:p.y+shift}));}
  platforms=platforms.filter(p=>p.y<108);pickups=pickups.filter(p=>p.y<108);
  while(platforms.length===0||Math.min(...platforms.map(p=>p.y))>-12){const highest=platforms.reduce<TowerPlatform|null>((best,p)=>!best||p.y<best.y?p:best,null),next=createTowerPlatform(highest,s.nextFloor,String(ticket.seed));platforms.push(next);const pickup=createTowerPickup(next,String(ticket.seed));if(pickup)pickups.push(pickup);s.nextFloor++;}
  s.player=nextPlayer;s.platforms=platforms;s.pickups=pickups;s.rawScore+=(.08+Math.max(0,s.combo-1)*.012)*frameScale;s.score=Math.floor(s.rawScore);
  if((s.rocketUntil<=now&&nextPlayer.y-playerHalfHeight>105)||now>=600000){s.finished=true;s.reason=now>=600000?'time':'lower_bound';s.hearts=0;s.score=towerFinalScore(s);}
 },
 input(s,_ticket,input:OriginalInput){
  if(s.finished||input.action==='move')return false;
  const direction=input.control==='left'?-1:input.control==='right'?1:input.control?0:input.x<500?-1:1;
  if(!direction)return false;
  if(input.action==='up'){if(s.manualDirection!==direction)return false;s.manualDirection=0;towerJumpFromRun(s);return true;}
  tryTowerLandingChain(s);if(s.manualDirection!==direction)s.runDistance=0;s.manualDirection=direction;return true;
 }
};
