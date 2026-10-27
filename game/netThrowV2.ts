import type {Bait,Grade,NetPoint} from './fieldV2';

export type NetFlickTrace={kind:'flick';points:NetPoint[]};
export const NET_FLIGHT_MS=400;
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
