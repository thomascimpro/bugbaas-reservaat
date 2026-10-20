import type {PlayerV2} from './typesV2';
import {checkV2 as check} from './shopV2';
export type ResearchStampBook={stamps:number;lastDay:string;breakthroughs:number};
export type CatchStreak={days:number;lastDay:string};
export type TrainerProgress={xp:number;claimedLevel:number;catchDay:string;catchStreak?:CatchStreak;research?:ResearchStampBook};
export const CATCH_STREAK_BONUS={days:7,dust:500,xp:2000} as const;
export const levelXP=(level:number)=>500*(Math.max(1,Math.min(40,level))-1)**2;
export const trainerLevel=(xp:number)=>Math.min(40,1+Math.floor(Math.sqrt(Math.max(0,xp)/500)));
export function ensureTrainer(p:PlayerV2){if(!p.go!.trainer){const xp=Math.min(levelXP(40),Math.max(0,p.field?.total.catches??0)*100);p.go!.trainer={xp,claimedLevel:trainerLevel(xp),catchDay:''};}return p.go!.trainer;}
export function grantXP(p:PlayerV2,amount:number){check(Number.isSafeInteger(amount)&&amount>=0&&amount<=10000,'Ongeldige ervaringsbeloning.');const t=ensureTrainer(p);t.xp=Math.min(levelXP(40),t.xp+amount);}
export function trainerReward(t:TrainerProgress){const to=trainerLevel(t.xp);let dust=0,nets=0,fast=0,charged=0;for(let level=t.claimedLevel+1;level<=to;level++){dust+=level*50;nets+=5;if(level%10===0)charged++;else if(level%5===0)fast++;}return {to,dust,nets,fast,charged};}
export function claimTrainer(p:PlayerV2){const t=ensureTrainer(p),r=trainerReward(t);check(r.to>t.claimedLevel,'Er staat geen levelbeloning klaar.');p.go!.dust+=r.dust;p.field!.inventory.basic+=r.nets;p.go!.fastTMs+=r.fast;p.go!.chargedTMs+=r.charged;t.claimedLevel=r.to;return r;}
export function catchStreakDays(t:TrainerProgress,day:string){const s=t.catchStreak,at=Date.parse(day+'T00:00:00Z');return s&&Number.isFinite(at)&&(s.lastDay===day||s.days<CATCH_STREAK_BONUS.days&&s.lastDay===new Date(at-86400000).toISOString().slice(0,10))?s.days:0;}
// awardGoCatch supplies the server timestamp of an actual map capture (active or auto).
export function catchXP(p:PlayerV2,newKind:boolean,at:number,grade?:string,curved=false){
 const t=ensureTrainer(p),day=new Date(at).toISOString().slice(0,10),first=(t.catchDay??'')<day;let seventh=false;
 if(first){
  const yesterday=new Date(Date.parse(day+'T00:00:00Z')-86400000).toISOString().slice(0,10),prior=t.catchStreak;
  const days=prior?.lastDay===yesterday&&prior.days>0&&prior.days<CATCH_STREAK_BONUS.days?prior.days+1:1;
  t.catchDay=day;t.catchStreak={days,lastDay:day};seventh=days===CATCH_STREAK_BONUS.days;
  if(seventh)p.go!.dust+=CATCH_STREAK_BONUS.dust;
 }
 const xp=100+(newKind?500:0)+(first?500:0)+(seventh?CATCH_STREAK_BONUS.xp:0)+(grade==='perfect'?300:grade==='great'?100:grade==='nice'?50:0)+(curved?20:0);grantXP(p,xp);return xp;
}
