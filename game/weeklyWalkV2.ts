import type {PlayerV2} from './typesV2';
import type {FieldItem,FieldState} from './fieldV2';
import {grantField} from './fieldV2';
import {COCOON_CAP,ensureCocoons} from './goCocoonsV2';

/** Weekly distance goal like Pokémon GO: a week starts Monday 00:00 UTC (same UTC days as dayV2). */
export type WeeklyWalkV2={week:string;meters:number;seen:number;claimed:number[];last?:{week:string;km:number;at:number;cocoon?:boolean}};
export type WeekTierV2={km:number;dust:number;items:Partial<Record<FieldItem,number>>;cocoon?:5};
export const WEEK_TIERS:readonly WeekTierV2[]=[{km:5,dust:1000,items:{basic:10}},{km:25,dust:3000,items:{blue:5,pollen:2}},{km:50,dust:6000,items:{silk:1},cocoon:5}];
export function weekV2(now:number){const day=Math.floor(now/86400000),monday=day-(new Date(now).getUTCDay()+6)%7;return new Date(monday*86400000).toISOString().slice(0,10);}
type Holder=FieldState&{weekWalk?:WeeklyWalkV2};
/** Read-only progress for screens; a stored older week shows as a fresh week. */
export function weeklyWalkV2(p:PlayerV2,now:number){const w=(p.field as Holder|undefined)?.weekWalk,current=!!w&&w.week===weekV2(now),meters=current?w.meters:0,claimed=current?w.claimed:[];return {week:weekV2(now),meters,claimed,next:WEEK_TIERS.find(t=>!claimed.includes(t.km))??null,last:current&&w.last?.week===w.week?w.last:undefined};}
/** The single server-side counter: called once after every command, it credits the net change of
 * field.walk.meters (GPS and Health Connect alike) and auto-grants each reached tier once per week.
 * Old saves start a baseline at the current total, never retroactive loot. */
export function trackWeeklyWalk(p:PlayerV2,now:number,seed:string):number[]{
 const f=p.field as Holder|undefined,total=f?.walk?.meters;if(!f||typeof total!=='number'||!Number.isFinite(total))return [];
 const week=weekV2(now);let w=f.weekWalk;if(!w){f.weekWalk={week,meters:0,seen:total,claimed:[]};return [];}
 const delta=total-(Number.isFinite(w.seen)?w.seen:total);w.seen=total;if(w.week!==week){w.week=week;w.meters=0;w.claimed=[];}
 w.meters=Math.max(0,w.meters+delta);if(!p.go)return [];const reached:number[]=[];
 for(const t of WEEK_TIERS){if(w.meters<t.km*1000||w.claimed.includes(t.km))continue;w.claimed.push(t.km);reached.push(t.km);p.go.dust+=t.dust;grantField(p,t.items,now);let cocoon=false;
  if(t.cocoon){const g=ensureCocoons(p,seed+':week-cocoons',now);if(g.items.length<COCOON_CAP){g.items.push({id:'cocoon-'+g.nextId++,km:t.cocoon,obtainedAt:now,hatchSeed:seed+':week-cocoon:'+week});cocoon=true;}}
  w.last={week,km:t.km,at:now,...(t.cocoon?{cocoon}:{})};}
 return reached;
}
