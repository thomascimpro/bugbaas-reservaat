import type {PlayerV2} from './typesV2';
import {publicGoJournal} from './goJournalV2';
import {WEEK_TIERS} from './weeklyWalkV2';
import type {WeeklyWalkV2} from './weeklyWalkV2';

export type AwayCursorV2={caught:number;missed:number;dust:number;xp:number;spins:number;meters:number;lastAutoAt:number;week?:string;tiers?:number};
const weekOf=(p:PlayerV2)=>(p.field as {weekWalk?:WeeklyWalkV2}|undefined)?.weekWalk;
export function awayCursorV2(p:PlayerV2):AwayCursorV2{
 const a=p.go?.auto,t=a?.totals;
 const w=weekOf(p);return {caught:t?.caught??0,missed:t?.missed??0,dust:t?.dust??0,xp:t?.xp??0,spins:t?.spins??0,meters:p.field?.walk?.meters??0,lastAutoAt:a?.last?.at??0,...(w?{week:w.week,tiers:w.claimed.length}:{})};
}
export function validAwayCursorV2(raw:unknown):raw is AwayCursorV2{return !!raw&&typeof raw==='object'&&['caught','missed','dust','xp','spins','meters','lastAutoAt'].every(k=>Number.isFinite((raw as Record<string,number>)[k])&&(raw as Record<string,number>)[k]>=0)&&((raw as AwayCursorV2).week===undefined||typeof (raw as AwayCursorV2).week==='string'&&Number.isSafeInteger((raw as AwayCursorV2).tiers));}
export function awaySummaryV2(p:PlayerV2,before:AwayCursorV2){
 const after=awayCursorV2(p),difference=(key:'caught'|'missed'|'dust'|'xp'|'spins'|'meters')=>Math.max(0,after[key]-before[key]);
 // Weekly tiers reached while away; an old cursor without week data never celebrates.
 const w=weekOf(p),reached=w&&before.week!==undefined?(w.week===before.week?w.claimed.slice(before.tiers??0):w.claimed):[];
 return {caught:difference('caught'),missed:difference('missed'),dust:difference('dust'),xp:difference('xp'),spins:difference('spins'),meters:difference('meters'),week:w?{meters:w.meters,claimed:w.claimed,next:WEEK_TIERS.find(t=>!w.claimed.includes(t.km))??null}:null,reached,bugs:publicGoJournal(p.go?.journal).filter(e=>e.method==='auto'&&e.kind==='catch'&&e.at>before.lastAutoAt)};
}
export type AwaySummaryV2=ReturnType<typeof awaySummaryV2>;
