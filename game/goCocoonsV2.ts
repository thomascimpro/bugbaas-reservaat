import {rng} from './catalogV2';
import {awardGoCatch} from './goV2';
import {family} from './goV2';
import type {Held} from './goV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2,Specimen} from './typesV2';

export type GoCocoon={id:string;km:2|5;obtainedAt:number;hatchSeed?:string};
export type GoCocoonsProgress={version:1;items:GoCocoon[];active:{id:string;startMeters:number;startedAt:number}|null;nextId:number;hatched:number;lastCatchId?:string;lastPostDrop?:string;lastHatch?:{id:string;species:string;shiny:boolean;at:number;held?:Held;dust?:number;candy?:number}};
export const COCOON_CAP=3,COCOON_CATCH_CHANCE=.1;
export const COCOON_POST_CHANCE=.2,COCOON_REWARDS={2:{dust:500,candy:10},5:{dust:1500,candy:20}};
// Each entry in a distance pool has the same chance. All thirty existing walking species are represented.
export const COCOON_POOLS:Record<2|5,readonly string[]>={
 2:['beetle','ant','aphid','weevil','moth','earwig','grasshopper','lacewing','dungbeetle','hoverfly','leafhopper','cricket','silverfish','caterpillar','antlion','cockroach','cranefly','flea','mayfly','termite'],
 5:['mantis','butterfly','divingbeetle','waterstrider','stick','leaf','hercules','giantwaterbug','tigerbeetle','tortoisebeetle'],
};
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
export function startCocoon(p:PlayerV2,id:unknown,now:number){
 idle(p);const g=progress(p);check(!g.active,'Er wordt al een cocon uitgebroed.');
 const item=g.items.find(c=>c.id===id);check(item,'Kies een cocon uit je voorraad.');
 g.active={id:item.id,startMeters:meters(p),startedAt:now};return item;
}
export function cocoonWalked(p:PlayerV2){
 const g=p.go?.cocoons,a=g?.active,item=g?.items.find(c=>c.id===a?.id);
 return a&&item?Math.min(item.km*1000,Math.max(0,meters(p)-a.startMeters)):0;
}
export function hatchCocoon(p:PlayerV2,now:number):Specimen{
 idle(p);const g=progress(p),a=g.active,item=g.items.find(c=>c.id===a?.id);
 check(a&&item,'Er wordt geen cocon uitgebroed.');
 check(cocoonWalked(p)>=item.km*1000,'Loop eerst de volledige afstand met de kaart open.');
 check(item.hatchSeed,'De cocon is niet beschikbaar.');
 const seed=item.hatchSeed,pool=COCOON_POOLS[item.km],kind=pool[Math.floor(rng(seed+':species')()*pool.length)];
 const s:Specimen={id:'hatched-'+item.id,species:kind,level:1,shiny:rng(seed+':shiny')()<1/64,favorite:false,obtainedAt:now,source:'cocoon',hearts:0,item:null};
 check(!p.specimens.some(b=>b.id===s.id),'Deze cocon is al uitgekomen.');
 // Reuse collection, dust, nectar and dex accounting. Only this new specimen receives hatch IVs.
 let held=awardGoCatch(p,s,seed+':stats');const reward=COCOON_REWARDS[item.km];p.go!.dust+=reward.dust-100;p.go!.candy[family(kind)]+=reward.candy-3;
 if(g.hatched===0&&!Object.values(p.go!.items).some(n=>n>0)){p.go!.items.leaf++;held='leaf';}const random=rng(seed+':iv');s.go!.iv=[10+Math.floor(random()*6),10+Math.floor(random()*6),10+Math.floor(random()*6)];
 p.specimens.push(s);if(!p.discovered.includes(kind))p.discovered.push(kind);if(s.shiny&&!p.shinies.includes(kind))p.shinies.push(kind);
 g.items=g.items.filter(c=>c.id!==item.id);g.active=null;g.hatched++;g.lastHatch={id:s.id,species:kind,shiny:s.shiny,at:now,dust:reward.dust,candy:reward.candy,...(held?{held}:{})};return s;
}
