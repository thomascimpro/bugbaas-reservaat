import type {PlayerV2} from './typesV2';
import {checkV2 as check} from './shopV2';
import {ensureField} from './fieldV2';

export type HealthSnapshot={dayUTC:string;capturedAt:number;steps:number;meters:number;source:'health-connect';distanceBasis?:'measured'|'steps'};
export type HealthBatch={source:'health-connect';capturedAt:number;days:HealthSnapshot[]};
type HealthDay={day:string;startedAt:number;at:number;steps:number;meters:number;baselineSteps:number;baselineMeters:number;gpsBaseline:number;gpsMeters:number;lastCredit:number;credited?:number;distanceBasis?:'measured'|'steps'};
export type HealthProgress=HealthDay&{connectedAt?:number;history?:Record<string,HealthDay>};
export const HEALTH_HISTORY_DAYS=30;
const day=(now:number)=>new Date(now).toISOString().slice(0,10);
export function gpsWalkMeters(p:PlayerV2){return p.field?.walk?.gpsMeters??p.field?.walk?.meters??0;}
function healthMeters(h:HealthDay){return Math.max(0,Math.min(h.meters-h.baselineMeters,(h.steps-h.baselineSteps)*1.15));}
function desiredDay(h:HealthDay){return Math.floor(h.gpsBaseline+Math.max(h.gpsMeters-h.gpsBaseline,healthMeters(h)));}
/** GPS has already passed movement validation. Keep its independent total for routes and lures. */
export function mergeGPSWalk(p:PlayerV2,priorTotal:number,priorDay:number,now:number){
 const w=p.field?.walk;if(!w)return;const raw=Math.max(0,w.meters-priorTotal);w.gpsMeters=(w.gpsMeters??priorTotal)+raw;
 const h=p.field?.healthSync;if(!h||h.day!==day(now))return;
 h.gpsMeters+=Math.max(0,w.dayMeters-priorDay);const combined=desiredDay(h),correction=combined-w.dayMeters;
 w.meters+=correction;w.dayMeters=combined;
}
function validSnapshot(raw:unknown,now:number,past:boolean):HealthSnapshot{
 check(raw&&typeof raw==='object'&&!Array.isArray(raw),'Geen geldige Health Connect-meting.');const s=raw as HealthSnapshot,midnight=Date.parse(s.dayUTC+'T00:00:00Z');
 check(Object.keys(s).every(k=>['dayUTC','capturedAt','steps','meters','source','distanceBasis'].includes(k))&&s.source==='health-connect'&&/^\d{4}-\d\d-\d\d$/.test(s.dayUTC)&&Number.isFinite(midnight)&&day(midnight)===s.dayUTC&&(past?s.dayUTC>=day(now-HEALTH_HISTORY_DAYS*86400000)&&s.dayUTC<=day(now):s.dayUTC===day(now)),'Deze wandelmeting is niet van vandaag.');
 check(Number.isSafeInteger(s.capturedAt)&&now-s.capturedAt<=120000&&s.capturedAt<=now+5000,'Vernieuw de wandelmeting.');
 check(Number.isSafeInteger(s.steps)&&s.steps>=0&&s.steps<=100000&&Number.isSafeInteger(s.meters)&&s.meters>=0&&s.meters<=100000&&s.meters<=s.steps*1.15+5&&(s.distanceBasis===undefined||s.distanceBasis==='measured'||s.distanceBasis==='steps'),'Deze afstand past niet bij de stappen.');
 return s;
}
function archive(h:HealthProgress):HealthDay{const {connectedAt,history,...entry}=h;return {...entry,credited:Math.max(entry.credited??0,desiredDay(entry))};}
/** Daily high-water marks also cover an app closed over midnight. First linking never grants old activity. */
export function syncAdventure(p:PlayerV2,raw:unknown,now:number){
 check(raw&&typeof raw==='object'&&!Array.isArray(raw),'Geen geldige Health Connect-meting.');
 const batch=raw as HealthBatch,isBatch=Object.hasOwn(raw,'days');
 if(isBatch)check(Object.keys(batch).every(k=>['days','source','capturedAt'].includes(k))&&batch.source==='health-connect'&&Number.isSafeInteger(batch.capturedAt)&&now-batch.capturedAt<=120000&&batch.capturedAt<=now+5000&&Array.isArray(batch.days)&&batch.days.length>0&&batch.days.length<=HEALTH_HISTORY_DAYS+1,'Geen geldige wandelgeschiedenis.');
 const snapshots=(isBatch?batch.days:[raw]).map(s=>validSnapshot(s,now,isBatch)).sort((a,b)=>a.dayUTC.localeCompare(b.dayUTC));
 check(new Set(snapshots.map(s=>s.dayUTC)).size===snapshots.length&&snapshots.at(-1)!.dayUTC===day(now),'Vernieuw de wandelgeschiedenis.');
 const f=ensureField(p,now),w=f.walk??={meters:0,dayMeters:0,anchor:null,at:now};w.gpsMeters??=w.meters;
 let h=f.healthSync;
 if(!h){const s=snapshots.at(-1)!;f.healthSync={day:s.dayUTC,connectedAt:now,startedAt:now,at:s.capturedAt,steps:s.steps,meters:s.meters,baselineSteps:s.steps,baselineMeters:s.meters,gpsBaseline:w.dayMeters,gpsMeters:w.dayMeters,lastCredit:0,distanceBasis:s.distanceBasis};return 0;}
 const connectedAt=h.connectedAt??h.startedAt,history={...h.history};let total=0;
 for(const s of snapshots){
  if(s.dayUTC<day(connectedAt))continue;
  let entry:HealthDay;
  if(s.dayUTC===h.day)entry=h;
  else if(s.dayUTC<h.day){entry=history[s.dayUTC];if(!entry)continue;}
  else{
   history[h.day]=archive(h);const midnight=Date.parse(s.dayUTC+'T00:00:00Z');
   entry={day:s.dayUTC,startedAt:midnight,at:midnight,steps:0,meters:0,baselineSteps:0,baselineMeters:0,gpsBaseline:0,gpsMeters:s.dayUTC===day(now)?w.dayMeters:0,lastCredit:0};h=entry;
  }
  check(s.capturedAt>=entry.at,'Deze wandelmeting is ouder dan je vorige.');
  const end=Math.min(s.capturedAt,Date.parse(s.dayUTC+'T00:00:00Z')+86400000);
  check(s.meters-entry.baselineMeters<=Math.max(0,(end-entry.startedAt)/1000)*3.5+30,'Deze afstand is in te korte tijd afgelegd.');
  const previous=s.dayUTC===day(now)?w.dayMeters:Math.max(entry.credited??0,desiredDay(entry));
  entry.steps=Math.max(entry.steps,s.steps);entry.meters=Math.max(entry.meters,s.meters);entry.at=s.capturedAt;entry.distanceBasis=s.distanceBasis??entry.distanceBasis;
  const combined=desiredDay(entry),credit=Math.max(0,combined-previous);entry.credited=Math.max(previous,combined);entry.lastCredit=credit;
  w.meters+=credit;if(s.dayUTC===day(now))w.dayMeters+=credit;total+=credit;
 }
 f.healthSync={...h,connectedAt,history:Object.fromEntries(Object.entries(history).filter(([date])=>date>=day(now-HEALTH_HISTORY_DAYS*86400000)))};
 return total;
}
