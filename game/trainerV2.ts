import type {PlayerV2} from './typesV2';
import {checkV2 as check} from './shopV2';
export type ResearchStampBook={stamps:number;lastDay:string;breakthroughs:number};
export type TrainerProgress={xp:number;claimedLevel:number;catchDay:string;research?:ResearchStampBook};
export const levelXP=(level:number)=>500*(Math.max(1,Math.min(40,level))-1)**2;
export const trainerLevel=(xp:number)=>Math.min(40,1+Math.floor(Math.sqrt(Math.max(0,xp)/500)));
export function ensureTrainer(p:PlayerV2){if(!p.go!.trainer){const xp=Math.min(levelXP(40),Math.max(0,p.field?.total.catches??0)*100);p.go!.trainer={xp,claimedLevel:trainerLevel(xp),catchDay:''};}return p.go!.trainer;}
export function grantXP(p:PlayerV2,amount:number){check(Number.isSafeInteger(amount)&&amount>=0&&amount<=10000,'Ongeldige ervaringsbeloning.');const t=ensureTrainer(p);t.xp=Math.min(levelXP(40),t.xp+amount);}
export function trainerReward(t:TrainerProgress){const to=trainerLevel(t.xp);let dust=0,nets=0,fast=0,charged=0;for(let level=t.claimedLevel+1;level<=to;level++){dust+=level*50;nets+=5;if(level%10===0)charged++;else if(level%5===0)fast++;}return {to,dust,nets,fast,charged};}
export function claimTrainer(p:PlayerV2){const t=ensureTrainer(p),r=trainerReward(t);check(r.to>t.claimedLevel,'Er staat geen levelbeloning klaar.');p.go!.dust+=r.dust;p.field!.inventory.basic+=r.nets;p.go!.fastTMs+=r.fast;p.go!.chargedTMs+=r.charged;t.claimedLevel=r.to;return r;}
export function catchXP(p:PlayerV2,newKind:boolean,at:number,grade?:string,curved=false){const t=ensureTrainer(p),day=new Date(at).toISOString().slice(0,10),first=t.catchDay!==day;t.catchDay=day;const xp=100+(newKind?500:0)+(first?500:0)+(grade==='perfect'?300:grade==='great'?100:grade==='nice'?50:0)+(curved?20:0);grantXP(p,xp);return xp;}
