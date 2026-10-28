import {rng} from './catalogV2';
import {WALK_WEIGHTS} from './walkingV2';
import {COCOON_SHINY_ODDS} from './shinyV2';
import {awardGoCatch} from './goV2';
import {family} from './goV2';
import type {Held} from './goV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2,Specimen} from './typesV2';

export type GoCocoon={id:string;km:2|5;obtainedAt:number;hatchSeed?:string};
export type GoCocoonActive={id:string;startMeters:number;startedAt:number};
export type GoCocoonIncubator={id:string;uses:number};
export type GoCocoonsProgress={version:1;items:GoCocoon[];active:GoCocoonActive|null;parallel?:(GoCocoonActive&{incubatorId:string})[];incubators?:GoCocoonIncubator[];nextIncubatorId?:number;nextId:number;hatched:number;lastCatchId?:string;lastPostDrop?:string;lastHatch?:{id:string;species:string;shiny:boolean;at:number;held?:Held;dust?:number;candy?:number}};
export const COCOON_CAP=3,COCOON_CATCH_CHANCE=.1;
export const COCOON_POST_CHANCE=.2,COCOON_REWARDS={2:{dust:500,candy:10},5:{dust:1500,candy:20}};
// All thirty existing walking species are represented. Chances follow Pokémon GO-style rarity tiers (see cocoonTier).
export const COCOON_POOLS:Record<2|5,readonly string[]>={
 2:['beetle','ant','aphid','weevil','moth','earwig','grasshopper','lacewing','dungbeetle','hoverfly','leafhopper','cricket','silverfish','caterpillar','antlion','cockroach','cranefly','flea','mayfly','termite'],
 5:['mantis','butterfly','divingbeetle','waterstrider','stick','leaf','hercules','giantwaterbug','tigerbeetle','tortoisebeetle'],
};
/** Relative hatch weight per rarity tier: 1 common … 5 very rare (Pokémon GO shows the same five tiers in egg pools). */
export const COCOON_TIER_WEIGHT={1:40,2:25,3:12,4:5,5:1.5} as const;
export type CocoonTier=keyof typeof COCOON_TIER_WEIGHT;
const TIER_SPLIT=[.3,.55,.75,.9,1];
/** Tier inside a distance pool, ranked by the species' wild spawn weight so the map and cocoons agree on what is rare. */
export function cocoonTier(kind:string,km:2|5):CocoonTier{
 const pool=COCOON_POOLS[km],ranked=[...pool].sort((a,b)=>(WALK_WEIGHTS[b]??0)-(WALK_WEIGHTS[a]??0)||a.localeCompare(b)),index=ranked.indexOf(kind);
 if(index<0)return 5;const share=(index+1)/ranked.length;return (TIER_SPLIT.findIndex(limit=>share<=limit+1e-9)+1) as CocoonTier;
}
/** Exact hatch chance of one species in a distance pool (0–1). */
export function cocoonChance(kind:string,km:2|5){const pool=COCOON_POOLS[km];if(!pool.includes(kind))return 0;const total=pool.reduce((sum,id)=>sum+COCOON_TIER_WEIGHT[cocoonTier(id,km)],0);return COCOON_TIER_WEIGHT[cocoonTier(kind,km)]/total;}
export function cocoonSpecies(km:2|5,roll:number){const pool=COCOON_POOLS[km];let left=roll*pool.reduce((sum,id)=>sum+COCOON_TIER_WEIGHT[cocoonTier(id,km)],0);for(const id of pool){left-=COCOON_TIER_WEIGHT[cocoonTier(id,km)];if(left<0)return id;}return pool[pool.length-1];}
function meters(p:PlayerV2){const n=p.field?.walk?.meters??0;check(Number.isFinite(n)&&n>=0,'Je wandelafstand is niet beschikbaar.');return n;}
function progress(p:PlayerV2){check(p.go?.cocoons,'Open eerst de kaart.');return p.go.cocoons;}
function idle(p:PlayerV2){check(p.go&&!p.go.battle&&!p.go.queue,'Rond je gevecht of zoekopdracht eerst af.');}
function addCocoon(g:GoCocoonsProgress,km:2|5,seed:string,now:number){
 check(typeof seed==='string'&&seed.length>0,'De cocon is niet beschikbaar.');
 const item:GoCocoon={id:'cocoon-'+g.nextId++,km,obtainedAt:now,hatchSeed:seed};g.items.push(item);return item;
}
export function ensureCocoons(p:PlayerV2,seed:string,now:number):GoCocoonsProgress{
 check(p.go,'Open eerst de kaart.');if(p.go.cocoons)return p.go.cocoons;
 const g:GoCocoonsProgress={version:1,items:[],active:null,nextId:1,hatched:0};
 addCocoon(g,2,seed+':first-cocoon',now);p.go.cocoons=g;return g;
}
/** Call only after an actual successful server capture. Full bags consume that catch's chance too. */
export function awardCocoon(p:PlayerV2,seed:string,now:number){
 const g=ensureCocoons(p,seed,now),bug=p.specimens.at(-1);
 if(!bug?.go||bug.source!=='walking'||bug.obtainedAt!==now||g.lastCatchId===bug.id)return false;
 g.lastCatchId=bug.id;
 if(g.items.length>=COCOON_CAP||rng(seed+':cocoon-drop')()>=COCOON_CATCH_CHANCE)return false;
 addCocoon(g,rng(seed+':cocoon-distance')()<.75?2:5,seed+':cocoon-hatch',now);return true;
}
/** Called after a validated post spin. The consumed spin cannot reroll after freeing a bag slot. */
export function awardPostCocoon(p:PlayerV2,post:string,seed:string,now:number){
 if(p.go?.sites?.visits[post]!==now)return null;
 const g=ensureCocoons(p,seed,now),spin=post+':'+now;if(g.lastPostDrop===spin)return null;g.lastPostDrop=spin;
 if(g.items.length>=COCOON_CAP||rng(seed+':post-cocoon')()>=COCOON_POST_CHANCE)return null;
 return addCocoon(g,rng(seed+':post-distance')()<.75?2:5,seed+':post-hatch',now);
}
export function addCocoonIncubator(p:PlayerV2,uses=3){
 const g=progress(p);check(Number.isSafeInteger(uses)&&uses>0&&uses<=3,'Deze broedmachine is niet beschikbaar.');
 const item:GoCocoonIncubator={id:'incubator-'+(g.nextIncubatorId??1),uses};g.nextIncubatorId=(g.nextIncubatorId??1)+1;(g.incubators??=[]).push(item);return item;
}
export function cocoonActive(p:PlayerV2,id:string){const g=p.go?.cocoons;return g?.active?.id===id?g.active:g?.parallel?.find(a=>a.id===id);}
export function startCocoon(p:PlayerV2,id:unknown,now:number,incubator?:unknown){
 idle(p);const g=progress(p);
 const item=g.items.find(c=>c.id===id);check(item,'Kies een cocon uit je voorraad.');
 check(!cocoonActive(p,item.id),'Deze cocon wordt al uitgebroed.');
 const active={id:item.id,startMeters:meters(p),startedAt:now};
 if(incubator===undefined){check(!g.active,'Je basisbroedmachine is bezet. Kies een extra broedmachine.');g.active=active;}
 else{const machine=g.incubators?.find(i=>i.id===incubator&&i.uses>0);check(machine,'Kies een beschikbare broedmachine.');check(!g.parallel?.some(a=>a.incubatorId===machine.id),'Deze broedmachine is bezet.');(g.parallel??=[]).push({...active,incubatorId:machine.id});}
 return item;
}
export function cocoonWalked(p:PlayerV2,id?:string){
 const g=p.go?.cocoons,a=id?cocoonActive(p,id):g?.active,item=g?.items.find(c=>c.id===a?.id);
 return a&&item?Math.min(item.km*1000,Math.max(0,meters(p)-a.startMeters)):0;
}
export function hatchCocoon(p:PlayerV2,now:number,id?:unknown):Specimen{
 idle(p);const g=progress(p);check(id===undefined||typeof id==='string','Kies een broedende cocon.');
 const a=id===undefined?g.active:cocoonActive(p,id as string),item=g.items.find(c=>c.id===a?.id);
 check(a&&item,'Er wordt geen cocon uitgebroed.');
 check(cocoonWalked(p,item.id)>=item.km*1000,'Loop eerst de volledige afstand van je cocon.');
 const incubator='incubatorId' in a?g.incubators?.find(i=>i.id===a.incubatorId&&i.uses>0):undefined;
 check(!('incubatorId' in a)||incubator,'De broedmachine is niet beschikbaar.');
 check(item.hatchSeed,'De cocon is niet beschikbaar.');
 const seed=item.hatchSeed,kind=cocoonSpecies(item.km,rng(seed+':species')());
 const s:Specimen={id:'hatched-'+item.id,species:kind,level:1,shiny:rng(seed+':shiny')()<1/COCOON_SHINY_ODDS,favorite:false,obtainedAt:now,source:'cocoon',hearts:0,item:null};
 check(!p.specimens.some(b=>b.id===s.id),'Deze cocon is al uitgekomen.');
 // Reuse collection, dust, nectar and dex accounting. Only this new specimen receives hatch IVs.
 let held=awardGoCatch(p,s,seed+':stats');const reward=COCOON_REWARDS[item.km];p.go!.dust+=reward.dust-100;p.go!.candy[family(kind)]+=reward.candy-3;
 if(g.hatched===0&&!Object.values(p.go!.items).some(n=>n>0)){p.go!.items.leaf++;held='leaf';}const random=rng(seed+':iv');s.go!.iv=[10+Math.floor(random()*6),10+Math.floor(random()*6),10+Math.floor(random()*6)];
 p.specimens.push(s);if(!p.discovered.includes(kind))p.discovered.push(kind);if(s.shiny&&!p.shinies.includes(kind))p.shinies.push(kind);
 g.items=g.items.filter(c=>c.id!==item.id);if(g.active?.id===item.id)g.active=null;else g.parallel=g.parallel?.filter(c=>c.id!==item.id);
 if(incubator){incubator.uses--;g.incubators=g.incubators?.filter(i=>i.uses>0);}
 g.hatched++;g.lastHatch={id:s.id,species:kind,shiny:s.shiny,at:now,dust:reward.dust,candy:reward.candy,...(held?{held}:{})};return s;
}
