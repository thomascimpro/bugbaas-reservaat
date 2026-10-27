import type {Fix} from '../game/walkingV2';

/** Last-known/coarse coordinates may draw the map, never authorize game actions. */
export function displayGPSFixV2(raw:unknown,now:number):Fix|null{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const f=raw as Fix;
 if(![f.lat,f.lng,f.accuracy,f.timestamp].every(Number.isFinite)||Math.abs(f.lat)>85||Math.abs(f.lng)>180||f.accuracy<=0||f.accuracy>5000||now-f.timestamp!>86400000||f.timestamp!>now+5000)return null;
 return {lat:f.lat,lng:f.lng,accuracy:f.accuracy,timestamp:f.timestamp};
}
