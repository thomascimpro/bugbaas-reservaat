import {rng} from './catalogV2';
import type {Bait,Grade} from './fieldV2';
import {checkV2 as check} from './shopV2';
export type CatchFocus={id:string;at:number};
export type CatchRhythm={focus:string;taps:number[]};
export const catchPeriod=(bait:Bait|null)=>bait==='dew'?1900:1450;
export function catchTarget(focus:CatchFocus,index:number,bait:Bait|null){return index*catchPeriod(bait)+Math.round(catchPeriod(bait)*(.52+rng(focus.id+':beat:'+index)()*.23));}
export function catchAccuracy(focus:CatchFocus,index:number,tap:number,bait:Bait|null){return Math.max(0,1-Math.abs(tap-catchTarget(focus,index,bait))/(bait==='dew'?420:320));}
export function judgeCatchRhythm(raw:unknown,focus:CatchFocus|undefined,bait:Bait|null,now:number):{grade:Grade;curved:false;duration:number}{
 check(raw&&typeof raw==='object'&&!Array.isArray(raw),'Ongeldig vangritme.');const value=raw as CatchRhythm;
 check(Object.keys(value).every(k=>['focus','taps'].includes(k))&&focus&&value.focus===focus.id,'Start een nieuw vangspel.');
 check(Array.isArray(value.taps)&&value.taps.length===3,'Maak drie vangtikken.');const period=catchPeriod(bait);
 check(value.taps.every((t,i)=>Number.isSafeInteger(t)&&t>=i*period&&t<(i+1)*period),'Ongeldige tikvolgorde.');
 const duration=value.taps[2];check(now>=focus.at&&now-focus.at<20000&&duration<=now-focus.at+250,'Deze vangpoging is nog niet klaar of verlopen.');
 const accuracy=value.taps.map((t,i)=>catchAccuracy(focus,i,t,bait)),hits=accuracy.filter(n=>n>0).length,average=accuracy.reduce((a,b)=>a+b,0)/3;
 const grade:Grade=hits===0?'miss':hits===3&&average>=.72?'perfect':hits>=2&&average>=.4?'great':hits>=2?'nice':'hit';
 return {grade,curved:false,duration};
}
