import {grantXP} from './trainerV2';
import {gpsWalkMeters} from './adventureSyncV2';
import type {PlayerV2} from './typesV2';
import type {FieldItem} from './fieldV2';
import {distance,requireFieldLocation} from './walkingV2';
import {rng} from './catalogV2';
import {checkV2 as check} from './shopV2';
import {awardPostCocoon} from './goCocoonsV2';
import {HELD} from './goV2';
import {awardPostResearch} from './postResearchV2';
import type {Held} from './goV2';
import type {HabitatContext} from './habitatsV2';
import type {WildBug} from './walkingV2';
import {allRoutes,keepRouteSpawns,routeBonus,routeBadge,routeDistance,routeReward,ROUTE_OFF} from './routesV2';
import type {RouteRecording,RouteResult} from './routesV2';

export type FieldPost={id:string;name:string;lat:number;lng:number;source:'osm'|'virtual';osmId?:string};
export type FieldRoute={id:string;name:string;points:{lat:number;lng:number}[];meters:number;source:'osm'|'own';osmId?:string;emoji?:string;createdAt?:number};
export type RouteRun={route:FieldRoute;status:'active'|'paused'|'ready'|'claimed';next:number;meters:number;anchor:number;startedAt:number;claimedAt?:number;seed?:string;bonus?:number;spawns?:WildBug[];done?:string[]};
/** Display-only map marker beyond the playable post list (PoGO-style horizon). Never used for rewards, gyms or raids. */
export type MapSite={id:string;name:string;lat:number;lng:number;gym?:true;team?:'fern'|'amber'|'tidal'|null};
export type WorldSites={available?:boolean;dataAt?:number;posts:FieldPost[];routes:FieldRoute[];map?:MapSite[]};
/** Horizon at the default camera (zoom 17.6, pitch 56) is ~0.75 km ahead; 1.2 km also covers zooming out. */
export const MAP_SITE_RADIUS=1200,MAP_SITE_LIMIT=60,MAP_GYM_TEAM_LIMIT=12;
// Same FNV-1a rule as gymSites in gymsV2 (kept in sync by a test): a post is a gym candidate when hash%3===0.
export function gymCandidate(id:string){let value=2166136261;for(const c of id)value=Math.imul(value^c.charCodeAt(0),16777619);return (value>>>0)%3===0;}
export type SiteProgress={visits:Record<string,number>;firstDay:string;routeClaims:string[];run:RouteRun|null;own?:FieldRoute[];badges?:Record<string,number>;recording?:RouteRecording|null;lastRoute?:RouteResult;lastLoot?:{post:string;items:Partial<Record<FieldItem,number>>;at:number;cocoon?:2|5;tm?:'fast'|'charged';held?:Held}};
export const POST_RADIUS=65,POST_COOLDOWN=300000;
export const HORIZON_LIMITS={low:16,normal:36,high:60} as const;
export type HorizonSite=MapSite&{meters:number;icon:string};
/** Display-only horizon markers: never the playable posts (those keep their 3D model), nearest first, capped per graphics level. */
export function horizonSites(sites:MapSite[]|undefined,posts:FieldPost[]|undefined,fix:{lat:number;lng:number},graphics:'low'|'normal'|'high'='normal',visited:Record<string,number>={},now=0):HorizonSite[]{
 const near=new Set((posts??[]).map(p=>p.id));
 return (sites??[]).filter(s=>!near.has(s.id)).map(s=>({site:s,meters:Math.round(distance(fix,s))})).filter(x=>x.meters<=MAP_SITE_RADIUS+200).sort((a,b)=>a.meters-b.meters||a.site.id.localeCompare(b.site.id)).slice(0,HORIZON_LIMITS[graphics]??HORIZON_LIMITS.normal).map(({site,meters})=>({...site,meters,icon:site.gym?'bb-gym-'+(site.team??'neutral'):(visited[site.id]??0)+POST_COOLDOWN>now?'bb-post-used':'bb-post'}));
}
export function ensureSites(p:PlayerV2){return p.go!.sites??={visits:{},firstDay:'',routeClaims:[],run:null};}
export function spinPost(p:PlayerV2,id:unknown,seed:string,now:number){
 requireFieldLocation(p.walking,now);const post=p.walking!.posts?.find(x=>x.id===id);check(post,'Deze insectenpost is niet beschikbaar.');check(distance(p.walking!.fix,post)<=POST_RADIUS,'Loop binnen 65 meter van de post.');const s=ensureSites(p);check(now-(s.visits[post.id]??0)>=POST_COOLDOWN,'Deze post laadt nog op.');
 const random=rng(seed),items:Partial<Record<FieldItem,number>>={basic:2+Math.floor(random()*3)};if(random()<.35)items.blue=1;if(random()<.05)items.silk=1;if(random()<.25)items[(['pollen','fruit','dew'] as const)[Math.floor(random()*3)]]=1;if(random()<.02)items.gold=1;if(random()<.02)items.silver=1;
 for(const [kind,count] of Object.entries(items))p.field!.inventory[kind as FieldItem]=Math.min(99999,(p.field!.inventory[kind as FieldItem]??0)+count!);s.visits[post.id]=now;
 const cocoon=awardPostCocoon(p,post.id,seed,now),tmRoll=random(),tm=tmRoll<.01?'fast':tmRoll<.02?'charged':undefined;
 if(tm==='fast')p.go!.fastTMs++;if(tm==='charged')p.go!.chargedTMs++;
 let held:Held|undefined;if(random()<.02){const types=Object.keys(HELD) as Held[];held=types[Math.floor(random()*types.length)];p.go!.items[held]++;}
 awardPostResearch(p,post.id,now);for(const [key,at] of Object.entries(s.visits))if(now-at>86400000)delete s.visits[key];s.lastLoot={post:post.id,items,at:now,...(cocoon?{cocoon:cocoon.km}:{}),...(tm?{tm}:{}),...(held?{held}:{})};grantXP(p,50);return items;
}
const day=(now:number)=>new Date(now).toISOString().slice(0,10);
export function startRoute(p:PlayerV2,id:unknown,now:number,seed?:string){
 requireFieldLocation(p.walking,now);const route=allRoutes(p).find(r=>r.id===id);check(route&&route.points.length>=3,'Deze route is niet beschikbaar.');check(distance(p.walking!.fix,route.points[0])<=POST_RADIUS,'Loop eerst naar het startpunt.');const s=ensureSites(p);check(!s.recording,'Stop eerst je route-opname.');check(!s.run||s.run.status==='claimed','Rond je huidige route eerst af.');if(s.firstDay!==day(now)){s.firstDay=day(now);s.routeClaims=[];}check(!s.routeClaims.includes(route.id)&&s.routeClaims.length<3,'Deze routebeloning is vandaag al opgehaald, of je drie dagbeloningen zijn op.');s.run={route:structuredClone(route),status:'active',next:1,meters:0,anchor:gpsWalkMeters(p),startedAt:now,...(seed?{seed,bonus:0,spawns:[],done:[]}:{})};
}
/** Only verified GPS metres within 50 m of the route line count; bonus bugs follow those metres. */
export function advanceRoute(p:PlayerV2,now:number,habitat?:HabitatContext){const r=p.go?.sites?.run;if(!r||r.status==='claimed')return;keepRouteSpawns(p,now);if(r.status!=='active')return;const w=p.walking!;if((w.blockedUntil??0)>now||w.fix.accuracy>35)return;const meters=gpsWalkMeters(p),delta=Math.max(0,meters-r.anchor);r.anchor=meters;if(!delta||routeDistance(w.fix,r.route.points)>ROUTE_OFF)return;r.meters+=delta;while(r.next<r.route.points.length&&distance(w.fix,r.route.points[r.next])<=30)r.next++;routeBonus(p,now,habitat);if(r.next>=r.route.points.length&&r.meters>=r.route.meters*.85)r.status='ready';}
export function pauseRoute(p:PlayerV2){const r=ensureSites(p).run;check(r&&r.status==='active','Je hebt geen actieve route.');r.status='paused';}
export function resumeRoute(p:PlayerV2,now:number){requireFieldLocation(p.walking,now);const r=ensureSites(p).run;check(r&&r.status==='paused','Er is geen gepauzeerde route.');r.anchor=gpsWalkMeters(p);r.status='active';}
/** Reward chest scaled by length, once per route per day (max three a day); every finish also counts toward the route badge (1/5/10). */
export function finishRoute(p:PlayerV2,now:number,seed?:string){requireFieldLocation(p.walking,now);const s=ensureSites(p),r=s.run;check(r&&r.status==='ready','Volg eerst de route en loop de afstand.');check(distance(p.walking!.fix,r.route.points.at(-1)!)<=POST_RADIUS,'Loop naar het einde van je route.');if(s.firstDay!==day(now)){s.firstDay=day(now);s.routeClaims=[];}check(!s.routeClaims.includes(r.route.id)&&s.routeClaims.length<3,'Deze dagbeloning is al opgehaald.');r.status='claimed';r.claimedAt=now;s.routeClaims.push(r.route.id);
 const reward=routeReward(r.route.meters);p.go!.dust+=reward.dust;p.field!.inventory.basic=Math.min(99999,p.field!.inventory.basic+reward.nets);grantXP(p,reward.xp);s.badges??={};const count=s.badges[r.route.id]=(s.badges[r.route.id]??0)+1;
 // Reuses the post cocoon roll (20%) with a one-off key that is removed again, so it never counts as a post spin.
 let cocoon:2|5|undefined;if(seed){const key='route:'+r.route.id+':'+now;s.visits[key]=now;cocoon=awardPostCocoon(p,key,seed,now)?.km;delete s.visits[key];}
 s.lastRoute={route:r.route.id,dust:reward.dust,xp:reward.xp,nets:reward.nets,...(cocoon?{cocoon}:{}),count,at:now};return {...s.lastRoute,badge:routeBadge(count)};}
export function cancelRoute(p:PlayerV2){const s=ensureSites(p);check(s.run&&s.run.status!=='claimed','Er is geen route om te stoppen.');s.run=null;}
