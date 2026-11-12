import type {RewardRow} from './resourceGainV2';
export type RewardBatch={id:number;rows:RewardRow[];dismissed:string[]};
/** Keep unseen, server-confirmed rewards together until the player reviews them. */
export function mergeRewardBatchV2(previous:RewardBatch|null,rows:RewardRow[],id:number):RewardBatch{
 const combined=new Map((previous?.rows??[]).filter(r=>!previous?.dismissed.includes(r.id)).map(r=>[r.id,{...r}]));
 for(const row of rows){const earlier=combined.get(row.id);combined.set(row.id,{...row,count:row.count+(earlier?.count??0)});}
 return {id:Math.max(id,(previous?.id??0)+1),rows:[...combined.values()],dismissed:[]};
}
