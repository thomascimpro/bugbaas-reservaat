import type {PlayerV2} from './typesV2';
import {checkV2 as check} from './shopV2';
import {ensureField} from './fieldV2';

export type HealthSnapshot={dayUTC:string;capturedAt:number;steps:number;meters:number;source:'health-connect'};
export type HealthProgress={day:string;startedAt:number;at:number;steps:number;meters:number;baselineSteps:number;baselineMeters:number;gpsBaseline:number;gpsMeters:number;lastCredit:number};
const day=(now:number)=>new Date(now).toISOString().slice(0,10);
const DAY_CAP=8000;
export function gpsWalkMeters(p:PlayerV2){return p.field?.walk?.gpsMeters??p.field?.walk?.meters??0;}
function healthMeters(h:HealthProgress){return Math.max(0,Math.min(h.meters-h.baselineMeters,(h.steps-h.baselineSteps)*1.15));}
function desiredDay(h:HealthProgress){return Math.floor(Math.min(DAY_CAP,h.gpsBaseline+Math.max(h.gpsMeters-h.gpsBaseline,healthMeters(h))));}
/** GPS has already passed movement validation. Keep its independent total for routes and lures. */
export function mergeGPSWalk(p:PlayerV2,priorTotal:number,priorDay:number,now:number){
 const w=p.field?.walk;if(!w)return;const raw=Math.max(0,w.meters-priorTotal);w.gpsMeters=(w.gpsMeters??priorTotal)+raw;
 const h=p.field?.healthSync;if(!h||h.day!==day(now))return;
 h.gpsMeters+=Math.max(0,w.dayMeters-priorDay);const combined=desiredDay(h),correction=combined-w.dayMeters;
 w.meters+=correction;w.dayMeters=combined;
}
/** Merge daily high-water marks. The first connection starts a baseline, never retroactive loot. */
export function syncAdventure(p:PlayerV2,raw:unknown,now:number){
 check(raw&&typeof raw==='object'&&!Array.isArray(raw),'Geen geldige Health Connect-meting.');const s=raw as HealthSnapshot;
 check(Object.keys(s).every(k=>['dayUTC','capturedAt','steps','meters','source'].includes(k))&&s.source==='health-connect'&&s.dayUTC===day(now),'Deze wandelmeting is niet van vandaag.');
 check(Number.isSafeInteger(s.capturedAt)&&now-s.capturedAt<=120000&&s.capturedAt<=now+5000,'Vernieuw de wandelmeting.');
 check(Number.isSafeInteger(s.steps)&&s.steps>=0&&s.steps<=100000&&Number.isSafeInteger(s.meters)&&s.meters>=0&&s.meters<=100000&&s.meters<=s.steps*1.15+5,'Deze afstand past niet bij de stappen.');
 const f=ensureField(p,now),w=f.walk??={meters:0,dayMeters:0,anchor:null,at:now};w.gpsMeters??=w.meters;
 let h=f.healthSync;
 if(!h){f.healthSync={day:s.dayUTC,startedAt:now,at:s.capturedAt,steps:s.steps,meters:s.meters,baselineSteps:s.steps,baselineMeters:s.meters,gpsBaseline:w.dayMeters,gpsMeters:w.dayMeters,lastCredit:0};return 0;}
 if(h.day!==s.dayUTC){const midnight=Date.parse(s.dayUTC+'T00:00:00Z');h=f.healthSync={day:s.dayUTC,startedAt:midnight,at:midnight,steps:0,meters:0,baselineSteps:0,baselineMeters:0,gpsBaseline:0,gpsMeters:w.dayMeters,lastCredit:0};}
 check(s.capturedAt>=h.at,'Deze wandelmeting is ouder dan je vorige.');
 // One cumulative allowance, rather than a new allowance on every request.
 check(s.meters-h.baselineMeters<=Math.max(0,(s.capturedAt-h.startedAt)/1000)*3.5+30,'Deze afstand is in te korte tijd afgelegd.');
 h.steps=Math.max(h.steps,s.steps);h.meters=Math.max(h.meters,s.meters);h.at=s.capturedAt;
 const credit=Math.max(0,Math.floor(desiredDay(h)-w.dayMeters));w.meters+=credit;w.dayMeters+=credit;h.lastCredit=credit;return credit;
}
