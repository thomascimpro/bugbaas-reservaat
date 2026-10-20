import {grantXP} from './trainerV2';
import type {PlayerV2} from './typesV2';
import type {FieldItem} from './fieldV2';
import {distance,requireFieldLocation} from './walkingV2';
import {rng} from './catalogV2';
import {checkV2 as check} from './shopV2';

export type FieldPost={id:string;name:string;lat:number;lng:number;source:'osm';osmId:string};
export type FieldRoute={id:string;name:string;points:{lat:number;lng:number}[];meters:number;source:'osm';osmId:string};
export type RouteRun={route:FieldRoute;status:'active'|'paused'|'ready'|'claimed';next:number;meters:number;anchor:number;startedAt:number;claimedAt?:number};
export type WorldSites={available?:boolean;dataAt?:number;posts:FieldPost[];routes:FieldRoute[]};
export type SiteProgress={visits:Record<string,number>;firstDay:string;routeClaims:string[];run:RouteRun|null;lastLoot?:{post:string;items:Partial<Record<FieldItem,number>>;at:number}};
export const POST_RADIUS=65,POST_COOLDOWN=300000;
export function ensureSites(p:PlayerV2){return p.go!.sites??={visits:{},firstDay:'',routeClaims:[],run:null};}
export function spinPost(p:PlayerV2,id:unknown,seed:string,now:number){
 requireFieldLocation(p.walking,now);const post=p.walking!.posts?.find(x=>x.id===id);check(post,'Deze insectenpost is niet beschikbaar.');check(distance(p.walking!.fix,post)<=POST_RADIUS,'Loop binnen 65 meter van de post.');const s=ensureSites(p);check(now-(s.visits[post.id]??0)>=POST_COOLDOWN,'Deze post laadt nog op.');
 const random=rng(seed),items:Partial<Record<FieldItem,number>>={basic:2+Math.floor(random()*3)};if(random()<.35)items.blue=1;if(random()<.05)items.silk=1;if(random()<.25)items[(['pollen','fruit','dew'] as const)[Math.floor(random()*3)]]=1;
 for(const [kind,count] of Object.entries(items))p.field!.inventory[kind as FieldItem]+=count!;s.visits[post.id]=now;
 for(const [key,at] of Object.entries(s.visits))if(now-at>86400000)delete s.visits[key];s.lastLoot={post:post.id,items,at:now};grantXP(p,50);return items;
}
const day=(now:number)=>new Date(now).toISOString().slice(0,10);
export function startRoute(p:PlayerV2,id:unknown,now:number){
 requireFieldLocation(p.walking,now);const route=p.walking!.routes?.find(r=>r.id===id);check(route&&route.points.length>=3,'Deze route is niet beschikbaar.');check(distance(p.walking!.fix,route.points[0])<=POST_RADIUS,'Loop eerst naar het startpunt.');const s=ensureSites(p);check(!s.run||s.run.status==='claimed','Rond je huidige route eerst af.');if(s.firstDay!==day(now)){s.firstDay=day(now);s.routeClaims=[];}check(!s.routeClaims.includes(route.id)&&s.routeClaims.length<3,'Deze routebeloning is vandaag al opgehaald, of je drie dagbeloningen zijn op.');s.run={route:structuredClone(route),status:'active',next:1,meters:0,anchor:p.field!.walk?.meters??0,startedAt:now};
}
export function advanceRoute(p:PlayerV2,now:number){const r=p.go?.sites?.run;if(!r||r.status!=='active')return;const w=p.walking!;if((w.blockedUntil??0)>now||w.fix.accuracy>35)return;const meters=p.field!.walk?.meters??0,delta=Math.max(0,meters-r.anchor);r.anchor=meters;if(!delta)return;r.meters+=delta;while(r.next<r.route.points.length&&distance(w.fix,r.route.points[r.next])<=30)r.next++;if(r.next>=r.route.points.length&&r.meters>=r.route.meters*.85)r.status='ready';}
export function pauseRoute(p:PlayerV2){const r=ensureSites(p).run;check(r&&r.status==='active','Je hebt geen actieve route.');r.status='paused';}
export function resumeRoute(p:PlayerV2,now:number){requireFieldLocation(p.walking,now);const r=ensureSites(p).run;check(r&&r.status==='paused','Er is geen gepauzeerde route.');r.anchor=p.field!.walk?.meters??0;r.status='active';}
export function finishRoute(p:PlayerV2,now:number){requireFieldLocation(p.walking,now);const s=ensureSites(p),r=s.run;check(r&&r.status==='ready','Volg eerst de route en loop de afstand.');check(distance(p.walking!.fix,r.route.points.at(-1)!)<=POST_RADIUS,'Loop naar het einde van je route.');if(s.firstDay!==day(now)){s.firstDay=day(now);s.routeClaims=[];}check(!s.routeClaims.includes(r.route.id)&&s.routeClaims.length<3,'Deze dagbeloning is al opgehaald.');r.status='claimed';r.claimedAt=now;s.routeClaims.push(r.route.id);p.go!.dust+=150;p.field!.inventory.basic+=5;grantXP(p,1500);}
export function cancelRoute(p:PlayerV2){const s=ensureSites(p);check(s.run&&s.run.status!=='claimed','Er is geen route om te stoppen.');s.run=null;}
