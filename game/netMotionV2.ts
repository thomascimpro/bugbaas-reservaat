import {rng} from './catalogV2';
import {movePool} from './goV2';
import {bugRarity} from './rarityDisplayV2';
import type {PlayerV2} from './typesV2';
import type {Bait} from './fieldV2';

/** How a wild bug moves in the catch scene. Shared by the server judge and the client animation. */
export type MotionStyle='crawl'|'flutter'|'hop'|'dart'|'glide';
export type NetMotion={style:MotionStyle;amp:number;wind:number};
export const MOTION_INFO:Record<MotionStyle,{name:string;tip:string}>={
 crawl:{name:'Kruipt',tip:'Kruipt langzaam heen en weer. Mik een klein stukje vóór de bug.'},
 flutter:{name:'Fladdert',tip:'Fladdert in een golf. Gooi als hij naar het midden komt.'},
 hop:{name:'Springt',tip:'Springt weg als je een ! ziet. Gooi meteen nadat hij geland is.'},
 dart:{name:'Schiet weg',tip:'Staat even stil en schiet dan opzij. Gooi in de pauze.'},
 glide:{name:'Glijdt',tip:'Glijdt van links naar rechts. Mik waar hij straks is.'},
};
const HOPPERS=/hopper|cricket|flea|click|locust|katydid|springtail/;
const DARTERS=/cockroach|silverfish|tigerbeetle/;
export function motionStyle(species:string):MotionStyle{
 const types:string[]=movePool(species).types;
 if(HOPPERS.test(species))return 'hop';if(DARTERS.test(species))return 'dart';
 if(types.includes('flying')||types.includes('fire'))return 'flutter';if(types.includes('water'))return 'glide';return 'crawl';
}
/** Decided once when the encounter opens: first catches stand still, wind starts after ten catches, rarer bugs move more. */
export function rollNetMotion(p:PlayerV2,species:string,seed:string):NetMotion{
 const beginner=!p.specimens.some(s=>s.source==='walking'),catches=p.field?.total.catches??0,r=rng(seed+':motion');
 const amp=beginner?0:[0,.55,.7,.85,1,1.1][bugRarity(species)];
 const windy=!beginner&&catches>=10&&r()<.55,wind=windy?[.03,.05,.07][Math.floor(r()*3)]*(r()<.5?-1:1):0;
 return {style:motionStyle(species),amp,wind};
}
const wave=(t:number,period:number,phase=0)=>Math.sin(2*Math.PI*t/period+phase);
/** Bug position in throw coordinates (centre .5/.42) at `ms` since the encounter opened on the client. */
export function bugPose(m:NetMotion|undefined,seed:string,ms:number,bait:Bait|null=null){
 if(!m||!m.amp)return {x:.5,y:.42,dodge:false,tell:false};
 const a=m.amp*(bait==='dew'?.5:1),t=Math.max(0,ms),phase=rng(seed+':phase')()*Math.PI*2,spot=(k:number)=>(rng(seed+':spot:'+k)()*2-1)*.13*a;
 let x=0,y=0,dodge=false,tell=false;
 if(m.style==='crawl'){x=.07*a*wave(t,4200,phase);y=.015*a*wave(t,2100);}
 else if(m.style==='flutter'){x=.11*a*wave(t,1700,phase)+.03*a*wave(t,610);y=.05*a*wave(t,850,phase);}
 else if(m.style==='glide'){const u=((t/5200+phase/(2*Math.PI))%1);x=.13*a*(u<.5?4*u-1:3-4*u);y=.01*a*wave(t,1300);}
 else{const cycle=m.style==='hop'?2200:1500,move=m.style==='hop'?500:450,k=Math.floor(t/cycle),inCycle=t-k*cycle,rest=cycle-move;
  if(inCycle<rest){x=spot(k);tell=m.style==='hop'&&inCycle>=rest-350;}
  else{const u=(inCycle-rest)/move;x=spot(k)+(spot(k+1)-spot(k))*u;if(m.style==='hop'){y=-.09*a*4*u*(1-u);dodge=true;}}}
 return {x:.5+x,y:.42+y,dodge,tell};
}
