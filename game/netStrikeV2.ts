import type {Bait,Grade,NetPoint} from './fieldV2';
import {bugPose,type NetMotion} from './netMotionV2';
import {rng} from './catalogV2';

export const NET_STRIKE_CONTACT_MS=150;
export const NET_STRIKE_RECOVER_MS=280;

/** The visible opportunity belongs to the bug's movement, never to gesture length. */
export function netStrikeFocus(motion:NetMotion|undefined,seed:string,at:number){
 const phase=rng(seed+':phase')()*Math.PI*2,t=Math.max(0,at);
 if(!motion?.amp)return Math.cos(t/1800*Math.PI*2+phase)<-.6;
 switch(motion.style){
  case 'hop':return t%2200<380; // Just landed; the existing ! announces the jump.
  case 'dart':return t%1500<280; // Pause after changing position.
  case 'flutter':return Math.abs(Math.cos(t/850*Math.PI*2+phase))<.4;
  case 'glide':{const u=(t/5200+phase/(Math.PI*2))%1;return u<.055||u>.945||Math.abs(u-.5)<.055;}
  case 'crawl':return Math.abs(Math.cos(t/4200*Math.PI*2+phase))<.4;
 }
}

export function validNetStrike(points:readonly NetPoint[]){return points.length>=2&&points.at(-1)!.t>=60&&points.at(-1)!.t<=5000;}

/** Only the release aim at the actual strike frame counts. Sweeping across is not a hit. */
export function netStrikeGrade(points:readonly NetPoint[],bait:Bait|null,motion:NetMotion|undefined,seed:string,start:number){
 const at=points.at(-1)!,contactAt=start+at.t+NET_STRIKE_CONTACT_MS,bug=bugPose(motion,seed,contactAt,bait);
 const error=Math.hypot(at.x-bug.x,(at.y-bug.y)*.9)/(bait==='dew'?1.2:1),focus=netStrikeFocus(motion,seed,contactAt),dodged=bug.dodge&&error<=.14;
 const grade:Grade=error>.14||dodged?'miss':error<=.025&&focus?'perfect':error<=.065?'great':error<=.1?'nice':'hit';
 return {grade,curved:false,duration:at.t,dodged,start,at:{x:at.x,y:at.y},focus,contactAt};
}
