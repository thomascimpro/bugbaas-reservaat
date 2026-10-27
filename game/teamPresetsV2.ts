import {LEAGUES,teamGo,teamIssue} from './goV2';
import type {League} from './goV2';
import type {PlayerV2} from './typesV2';
import {checkV2 as check} from './shopV2';

export function teamPreset(p:PlayerV2,action:unknown,league:unknown,slot:unknown,ids:unknown){
 check(typeof league==='string'&&Object.hasOwn(LEAGUES,league)&&Number.isInteger(slot)&&Number(slot)>=0&&Number(slot)<3,'Kies een teamslot.');
 const key=league as League,index=Number(slot),g=p.go!;
 check(action==='save'||action==='load','Kies bewaren of gebruiken.');
 if(action==='save'){
  const issue=teamIssue(p,ids,league);check(!issue,issue??'Kies een geldig team.');
  g.teamPresets??={};const slots=g.teamPresets[key]??=[null,null,null];slots[index]=[...(ids as string[])];
 }else{
  const saved=g.teamPresets?.[key]?.[index];check(saved,'Dit teamslot is nog leeg.');
  teamGo(p,saved,key);
 }
}
