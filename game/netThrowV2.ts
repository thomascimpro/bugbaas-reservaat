import type {Bait,Grade,NetPoint} from './fieldV2';
import {bugPose} from './netMotionV2';
import type {NetMotion} from './netMotionV2';

/** `start`: ms between the encounter appearing on screen and the finger going down; it places the moving bug. */
export type NetFlickTrace={kind:'flick'|'sweep'|'swing';points:NetPoint[];start?:number};
export const NET_FLIGHT_MS=400;
export const NET_SWING_FLIGHT_MS=520;
/** A real circle near the hand charges spin; a diagonal bend is not a spin. */
export function netSpin(points:readonly NetPoint[]){
 const hand=points.filter(p=>p.y>=.75);let best={turns:0,direction:1,ready:false};
 // Keep a completed wind-up when the final upward swipe changes the bounding box.
 for(let n=7;n<=hand.length;n++){const result=spinAroundHand(hand.slice(0,n));if(result.turns>best.turns)best=result;}
 return best;
}
function spinAroundHand(hand:readonly NetPoint[]){
 const xs=hand.map(p=>p.x),ys=hand.map(p=>p.y),w=Math.max(...xs)-Math.min(...xs),h=Math.max(...ys)-Math.min(...ys);
 if(w<.07||h<.045)return {turns:0,direction:1,ready:false};
 const cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2;let angle=0,last:number|undefined;
 for(const p of hand){const x=(p.x-cx)/w,y=(p.y-cy)/h;if(Math.hypot(x,y)<.22)continue;const a=Math.atan2(y,x);if(last!==undefined){let d=a-last;while(d>Math.PI)d-=Math.PI*2;while(d< -Math.PI)d+=Math.PI*2;angle+=d;}last=a;}
 const turns=Math.abs(angle)/(2*Math.PI);return {turns,direction:angle<0?-1:1,ready:turns>=.8};
}
/** New throws compress release speed: a short fast swipe cannot launch off-screen. Legacy tickets retain their old projection. */
export function projectNetSwing(points:readonly NetPoint[]){
 const first=points[0],last=points.at(-1)!,v=projectNetFlick(points),travel=first.y-last.y,spin=netSpin(points);
 return {x:last.x+v.vx*.07,y:Math.max(.12,Math.min(1.05,.42+(.28-travel)*.75+Math.max(-2,Math.min(2,1.6+v.vy))*.025)),curved:spin.ready,vx:v.vx,vy:v.vy};
}
export function validNetSwing(points:readonly NetPoint[]){if(points.length<2)return false;const first=points[0],last=points.at(-1)!,v=projectNetFlick(points);return last.t>=80&&last.t<=5000&&first.y-last.y>=.12&&last.y>=.52&&v.vy<=-.55&&-v.vy>=Math.abs(v.vx)*.4;}
export function netSwingLanding(points:readonly NetPoint[],motion?:NetMotion,bait:Bait|null=null){const p=projectNetSwing(points);return {...p,x:p.x+(motion?.wind??0)*(bait==='dew'?.5:1)*(p.curved?.35:1)};}
export function netSwingGrade(points:readonly NetPoint[],bait:Bait|null,motion?:NetMotion,seed='',start=0){
 const p=netSwingLanding(points,motion,bait),duration=points.at(-1)!.t,radius=netSweepRadius(duration,bait),bug=bugPose(motion,seed,start+duration+NET_SWING_FLIGHT_MS,bait),aim=Math.hypot(p.x-bug.x,p.y-bug.y)/(bait==='dew'?1.25:1),dodged=bug.dodge&&aim<=.26;
 const grade:Grade=aim>.26||dodged?'miss':aim>radius?'hit':radius<=.075?'perfect':radius<=.125?'great':'nice';return {grade,curved:grade!=='miss'&&p.curved,duration,dodged,start};
}
/** Hold to shrink the net opening; release timing and landing accuracy both count. */
export function netSweepRadius(ms:number,bait:Bait|null){return .19-.14*((Math.max(0,ms)%(bait==='dew'?2600:1800))/(bait==='dew'?2600:1800));}
/** Where the net lands after wind: a curve throw cuts through the wind. */
export function netLanding(points:readonly NetPoint[],motion?:NetMotion,bait:Bait|null=null){const landed=projectNetFlick(points),wind=(motion?.wind??0)*(bait==='dew'?.5:1)*(landed.curved?.35:1);return {...landed,x:landed.x+wind};}
export function netSweepGrade(points:readonly NetPoint[],bait:Bait|null,motion?:NetMotion,seed='',start=0):{grade:Grade;curved:boolean;duration:number;dodged:boolean}{
 const landed=netLanding(points,motion,bait),duration=points.at(-1)!.t,radius=netSweepRadius(duration,bait),bug=bugPose(motion,seed,start+duration+NET_FLIGHT_MS,bait),aim=Math.hypot(landed.x-bug.x,landed.y-bug.y)/(bait==='dew'?1.25:1);
 const dodged=bug.dodge&&aim<=.26,grade:Grade=aim>.26||dodged?'miss':aim>radius?'hit':radius<=.075?'perfect':radius<=.125?'great':'nice';
 return {grade,curved:grade!=='miss'&&landed.curved,duration,dodged};
}
// The server and flight preview use the same release velocity, not a supplied grade.
export function projectNetFlick(points:readonly NetPoint[]){
 const first=points[0],last=points.at(-1)!,tail=points.find(p=>p.t>=last.t-100&&p.t<last.t)??points.at(-2)??first,seconds=Math.max(.001,(last.t-tail.t)/1000),vx=Math.max(-4,Math.min(4,(last.x-tail.x)/seconds)),vy=Math.max(-4,Math.min(4,(last.y-tail.y)/seconds));
 let length=0,deviation=0;for(let i=1;i<points.length;i++){length+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);deviation=Math.max(deviation,Math.abs(points[i].x-(first.x+(last.x-first.x)*points[i].t/Math.max(1,last.t))));}
 const straight=Math.hypot(last.x-first.x,last.y-first.y),curved=points.length>=5&&length>straight*1.14&&deviation>.1;
 return {x:last.x+vx*.19,y:last.y+vy*.19+.05,curved,vx,vy};
}
/** A throw must leave the hand with upward speed, before the finger reaches the bug. */
export function validNetFlick(points:readonly NetPoint[]){
 if(points.length<2)return false;
 const first=points[0],last=points.at(-1)!,release=projectNetFlick(points);
 return last.t>=60&&last.t<=5000&&first.y-last.y>=.14&&last.y>=.58&&release.vy<=-.9&&-release.vy>=Math.abs(release.vx)*.5;
}
export function netFlickGrade(points:readonly NetPoint[],bait:Bait|null):{grade:Grade;curved:boolean;duration:number}{
 const landed=projectNetFlick(points),aim=Math.hypot(landed.x-.5,landed.y-.42)/(bait==='dew'?1.25:1),grade:Grade=aim>.26?'miss':aim<=.045?'perfect':aim<=.095?'great':aim<=.16?'nice':'hit';
 return {grade,curved:grade!=='miss'&&landed.curved,duration:points.at(-1)!.t};
}
