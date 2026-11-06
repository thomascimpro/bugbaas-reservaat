/** A small, capped thank-you. Old CP, currency and ranking never become new competitive power. */
export type LegacyReward={key:string;joinedAt:number;dust:number;nets:number;fastTMs:number;chargedTMs:number;badge:'legacy';grantedAt?:number;acknowledgedAt?:number};
export const LEGACY_CUTOFF=Date.UTC(2026,10,6);
export function legacyReward(key:string,joinedAt:number,profile:Record<string,unknown>):LegacyReward{
 const count=(k:string)=>typeof profile[k]==='number'&&Number.isFinite(profile[k])?Math.max(0,profile[k] as number):0;
 const dex=count('bugDexCount'),km=count('movementKmTotal');
 const milestones=Number(dex>=25)+Number(dex>=75)+Number(km>=10)+Number(km>=50);
 return {key,joinedAt,dust:1000+500*milestones,nets:10+5*Math.min(2,milestones),fastTMs:1,chargedTMs:milestones>=2?1:0,badge:'legacy'};
}
