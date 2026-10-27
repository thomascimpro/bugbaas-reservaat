import type {PlayerV2} from './typesV2';
import {publicGoJournal} from './goJournalV2';

export type AwayCursorV2={caught:number;missed:number;dust:number;xp:number;spins:number;meters:number;lastAutoAt:number};
export function awayCursorV2(p:PlayerV2):AwayCursorV2{
 const a=p.go?.auto,t=a?.totals;
 return {caught:t?.caught??0,missed:t?.missed??0,dust:t?.dust??0,xp:t?.xp??0,spins:t?.spins??0,meters:p.field?.walk?.meters??0,lastAutoAt:a?.last?.at??0};
}
export function validAwayCursorV2(raw:unknown):raw is AwayCursorV2{return !!raw&&typeof raw==='object'&&['caught','missed','dust','xp','spins','meters','lastAutoAt'].every(k=>Number.isFinite((raw as Record<string,number>)[k])&&(raw as Record<string,number>)[k]>=0);}
export function awaySummaryV2(p:PlayerV2,before:AwayCursorV2){
 const after=awayCursorV2(p),difference=(key:keyof AwayCursorV2)=>Math.max(0,after[key]-before[key]);
 return {caught:difference('caught'),missed:difference('missed'),dust:difference('dust'),xp:difference('xp'),spins:difference('spins'),meters:difference('meters'),bugs:publicGoJournal(p.go?.journal).filter(e=>e.method==='auto'&&e.kind==='catch'&&e.at>before.lastAutoAt)};
}
export type AwaySummaryV2=ReturnType<typeof awaySummaryV2>;
