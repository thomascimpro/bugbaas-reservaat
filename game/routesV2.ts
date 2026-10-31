import type {PlayerV2} from './typesV2';
import type {FieldRoute,SiteProgress} from './worldSitesV2';
import type {WildBug} from './walkingV2';
import type {HabitatContext} from './habitatsV2';
import {distance,WALK_WEIGHTS,GPS_CATCH_ACCURACY,requireFieldLocation} from './walkingV2';
import {habitatWeight} from './habitatsV2';
import {weatherBoosted,weatherSpawnFactor} from './weatherBoostV2';
import {rng} from './catalogV2';
import {checkV2 as check} from './shopV2';

type P={lat:number;lng:number};
/** Routes like PoGO: OSM loops plus own recorded routes. Every rule here is server-side; the client only draws. */
export const ROUTE_OFF=50,ROUTE_BONUS_EVERY=150,ROUTE_SPAWN_LIFE=300000,ROUTE_MIN=500,ROUTE_MAX=5000,OWN_ROUTE_LIMIT=5,ROUTE_BADGES=[1,5,10] as const,ROUTE_MAP_RADIUS=1500,ROUTE_MAP_LIMIT=10;
export const ROUTE_EMOJI=['🏁','🌳','🦋','🐞','🌼','🍄','🐝','🌈','⭐','🏞️'] as const;
export const ROUTE_BADGE_ICONS=['','🥉','🥈','🥇'] as const;
/** Recording: max ~12.6 km/h per segment (kids may jog), max 9 km/h on average, at most 3 hours. */
const SEGMENT_MAX_SPEED=3.5,AVERAGE_MAX_SPEED=2.5,RECORD_MAX_MS=3*3600000,RECORD_STEP=12,RECORD_GAP_S=180,RECORD_POINTS=600;
export type RouteRecording={startedAt:number;status:'recording'|'ready';points:{lat:number;lng:number;at:number;acc:number}[];meters:number;fast:number;full?:true;path?:P[]};
export type RouteResult={route:string;dust:number;xp:number;nets:number;cocoon?:2|5;count:number;at:number};
export type MapRoute={id:string;name:string;emoji:string;meters:number;points:P[];start:P;own:boolean;away:number;today:boolean;count:number;badge:number;active:boolean};

const r6=(v:number)=>Math.round(v*1e6)/1e6;
const ensure=(p:PlayerV2):SiteProgress=>p.go!.sites??={visits:{},firstDay:'',routeClaims:[],run:null};
const day=(now:number)=>new Date(now).toISOString().slice(0,10);
export function pathMeters(points:P[]){let m=0;for(let i=1;i<points.length;i++)m+=distance(points[i-1],points[i]);return m;}
function local(o:P){const sx=111320*Math.cos(o.lat*Math.PI/180);return (p:P)=>({x:(p.lng-o.lng)*sx,y:(p.lat-o.lat)*111320});}
/** Shortest distance in metres from a fix to the route line (segments, not only vertices). */
export function routeDistance(fix:P,points:P[]){if(!points.length)return Infinity;if(points.length===1)return distance(fix,points[0]);const xy=local(fix);let best=Infinity;for(let i=1;i<points.length;i++){const a=xy(points[i-1]),b=xy(points[i]),dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,-(a.x*dx+a.y*dy)/len)):0;best=Math.min(best,Math.hypot(a.x+dx*t,a.y+dy*t));}return best;}
/** Douglas-Peucker in local metres. */
export function simplifyPath(points:P[],tolerance=6):P[]{if(points.length<3)return points.map(p=>({lat:p.lat,lng:p.lng}));const xy=local(points[0]),q=points.map(xy),keep=new Uint8Array(points.length),anchors=[0];keep[0]=keep[points.length-1]=1;
 // A walked U-turn is real route length, even when all points lie on one line.
 for(let i=1;i<q.length-1;i++){const a={x:q[i].x-q[i-1].x,y:q[i].y-q[i-1].y},b={x:q[i+1].x-q[i].x,y:q[i+1].y-q[i].y};if(a.x*b.x+a.y*b.y<0&&Math.min(Math.hypot(a.x,a.y),Math.hypot(b.x,b.y))>tolerance){keep[i]=1;anchors.push(i);}}
 anchors.push(points.length-1);const stack:[number,number][]=anchors.slice(1).map((end,i)=>[anchors[i],end]);
 while(stack.length){const [s,e]=stack.pop()!,a=q[s],b=q[e],dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;let max=0,index=-1;for(let i=s+1;i<e;i++){const t=len?Math.max(0,Math.min(1,((q[i].x-a.x)*dx+(q[i].y-a.y)*dy)/len)):0,d=Math.hypot(q[i].x-a.x-t*dx,q[i].y-a.y-t*dy);if(d>max){max=d;index=i;}}if(max>tolerance&&index>0){keep[index]=1;stack.push([s,index],[index,e]);}}
 return points.filter((_,i)=>keep[i]).map(p=>({lat:p.lat,lng:p.lng}));}
/** Route points every <=40 m, the same spacing as OSM routes, so progress lights up smoothly. */
export function densifyPath(points:P[],step=40):P[]{const out:P[]=points.length?[{lat:r6(points[0].lat),lng:r6(points[0].lng)}]:[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(distance(a,b)/step));for(let k=1;k<=n;k++)out.push({lat:r6(a.lat+(b.lat-a.lat)*k/n),lng:r6(a.lng+(b.lng-a.lng)*k/n)});}return out;}
export function routeReward(meters:number){const km=Math.max(0,meters)/1000;return {dust:Math.round((100+km*250)/10)*10,xp:Math.min(10000,500+Math.round(km*10)*100),nets:3+Math.round(km*3),cocoon:.2};}
export function routeBadge(count:number){return ROUTE_BADGES.filter(n=>count>=n).length;}
export function allRoutes(p:PlayerV2):FieldRoute[]{return [...(p.walking?.routes??[]),...(p.go?.sites?.own??[])];}
export function routeDone(p:PlayerV2,id:string,now:number){const s=p.go?.sites;return !!s&&s.firstDay===day(now)&&s.routeClaims.includes(id);}
/** What the map draws: nearby OSM routes (server-built, <=1.2 km) and the player's own routes. Own routes only ever come from this player's own document. */
export function routeMapPayload(p:PlayerV2,fix:P,now:number,all=false):MapRoute[]{
 const s=p.go?.sites,run=s?.run&&s.run.status!=='claimed'?s.run:null,seen=new Set<string>(),list:FieldRoute[]=[...(run?[run.route]:[]),...allRoutes(p)];
 return list.filter(r=>r.points.length>=2&&!seen.has(r.id)&&(seen.add(r.id),true)).map(r=>{const count=s?.badges?.[r.id]??0;return {id:r.id,name:r.name,emoji:r.emoji??'🏁',meters:r.meters,points:r.points,start:r.points[0],own:r.source==='own',away:Math.round(distance(fix,r.points[0])),today:routeDone(p,r.id,now),count,badge:routeBadge(count),active:run?.route.id===r.id};}).filter(r=>all||r.active||r.away<=ROUTE_MAP_RADIUS).sort((a,b)=>Number(b.active)-Number(a.active)||a.away-b.away||a.id.localeCompare(b.id)).slice(0,all?99:ROUTE_MAP_LIMIT);
}
/** Slightly rarer pool than normal walking: square-root weights lift rare species without excluding habitat rules. */
export function routeSpecies(random:()=>number,biome?:Parameters<typeof habitatWeight>[2],weather?:Parameters<typeof habitatWeight>[3]){const weights=Object.entries(WALK_WEIGHTS).map(([id,w])=>[id,habitatWeight(id,Math.sqrt(w),biome,weather)*weatherSpawnFactor(id,weather)] as const);let roll=random()*weights.reduce((sum,[,w])=>sum+w,0);for(const [id,weight] of weights){roll-=weight;if(roll<0)return id;}return 'ant';}
/** Record caught/fled route bonus bugs before a GPS refresh can clear the walking catch list. */
export function noteRouteCatches(p:PlayerV2){const r=p.go?.sites?.run,w=p.walking;if(!r?.spawns?.length||!w)return;r.done??=[];for(const s of r.spawns)if(!r.done.includes(s.id)&&(w.caught.includes(s.id)||p.specimens.some(x=>x.id==='wild-'+s.id)))r.done.push(s.id);}
/** Bonus bugs stay on the map until caught or expired, also after the normal spawn list refreshes. */
export function keepRouteSpawns(p:PlayerV2,now:number){const r=p.go?.sites?.run,w=p.walking;if(!r?.spawns||!w)return;noteRouteCatches(p);r.spawns=r.spawns.filter(s=>s.expiresAt>now&&!r.done?.includes(s.id));for(const s of r.spawns)if(!w.spawns.some(x=>x.id===s.id)&&!w.caught.includes(s.id))w.spawns.push(structuredClone(s));}
/** One deterministic bonus bug per 150 verified on-route metres, from the run's private seed. Only on an active run. */
export function routeBonus(p:PlayerV2,now:number,habitat?:HabitatContext){
 const r=p.go?.sites?.run,w=p.walking;if(!r||r.status!=='active'||!r.seed||!w)return;r.bonus??=0;r.spawns??=[];const cap=Math.floor(r.route.meters/ROUTE_BONUS_EVERY);
 while(r.bonus<cap&&r.meters>=ROUTE_BONUS_EVERY*(r.bonus+1)){
  const i=r.bonus++,random=rng(r.seed+':route-bonus:'+i),pts=r.route.points,ahead=pts[Math.min(r.next,pts.length-1)],here=pts[Math.max(0,Math.min(r.next-1,pts.length-1))],angle=random()*Math.PI*2,off=4+random()*6;
  const candidates=[ahead,here].map(c=>({lat:r6(c.lat+Math.cos(angle)*off/111320),lng:r6(c.lng+Math.sin(angle)*off/(111320*Math.cos(c.lat*Math.PI/180)))})),point=candidates.find(c=>!habitat||habitat.canSpawnAt(c))??{lat:here.lat,lng:here.lng},biome=habitat?.biomeAt(point),weather=habitat?.environment.weather,species=routeSpecies(random,biome,weather);
  const bug:WildBug={id:'route-'+r.seed.slice(0,10)+'-'+i,species,...point,expiresAt:now+ROUTE_SPAWN_LIFE,...(biome?{biome}:{}),...(weatherBoosted(species,weather)?{weather:true}:{})};
  r.spawns.push(bug);w.spawns.push(structuredClone(bug));
 }
}
export function startRecording(p:PlayerV2,now:number){const w=requireFieldLocation(p.walking,now),s=ensure(p);check(!s.recording,'Je maakt al een route.');check(!s.run||s.run.status==='claimed','Rond je huidige route eerst af.');check((s.own?.length??0)<OWN_ROUTE_LIMIT,'Je hebt al '+OWN_ROUTE_LIMIT+' eigen routes. Verwijder er eerst één.');s.recording={startedAt:now,status:'recording',points:[{lat:r6(w.fix.lat),lng:r6(w.fix.lng),at:now,acc:w.fix.accuracy}],meters:0,fast:0};}
/** Called only after the server accepted a GPS fix (worldLocate). The client never sends a path. */
export function recordRouteFix(p:PlayerV2,now:number){
 const rec=p.go?.sites?.recording,w=p.walking;if(!rec||rec.status!=='recording'||!w||rec.full||now-rec.startedAt>RECORD_MAX_MS||w.fix.accuracy>GPS_CATCH_ACCURACY||rec.points.length>=RECORD_POINTS)return;
 const last=rec.points.at(-1)!,seg=distance(last,w.fix),dt=(now-last.at)/1000;if(dt<=0)return;
 const fast=(w.blockedUntil??0)>now||seg/dt>SEGMENT_MAX_SPEED&&seg>last.acc+w.fix.accuracy;
 if(!fast&&seg<RECORD_STEP)return;
 if(fast)rec.fast+=seg;else if(dt<=RECORD_GAP_S)rec.meters+=seg;
 rec.points.push({lat:r6(w.fix.lat),lng:r6(w.fix.lng),at:now,acc:w.fix.accuracy});if(rec.meters>=ROUTE_MAX)rec.full=true;
}
export function stopRecording(p:PlayerV2){
 const s=ensure(p),rec=s.recording;check(rec&&rec.status==='recording','Je maakt geen route.');const last=rec.points.at(-1)!,seconds=Math.max(1,(last.at-rec.startedAt)/1000);
 check(rec.fast<=Math.max(60,rec.meters*.1)&&rec.meters/seconds<=AVERAGE_MAX_SPEED,'Te snel voor een wandelroute. Loop rustig en probeer opnieuw.');
 check(rec.meters>=ROUTE_MIN,'Loop minimaal 500 m voor een route. Nu: '+Math.round(rec.meters)+' m.');
 const path=densifyPath(simplifyPath(rec.points)),meters=Math.round(pathMeters(path));check(meters>=ROUTE_MIN,'Loop minimaal 500 m voor een route. Nu: '+meters+' m.');
 rec.status='ready';rec.path=path;rec.meters=Math.min(meters,ROUTE_MAX);
}
export function cancelRecording(p:PlayerV2){const s=ensure(p);check(s.recording,'Je maakt geen route.');s.recording=null;}
export function routeRecord(p:PlayerV2,action:unknown,now:number){if(action==='start')startRecording(p,now);else if(action==='stop')stopRecording(p);else{check(action==='cancel','Kies starten, stoppen of annuleren.');cancelRecording(p);}}
export function validRouteName(raw:unknown){check(typeof raw==='string','Geef je route een naam.');const name=raw.trim().normalize('NFC').replace(/\s+/g,' ');check(name.length>=2&&name.length<=18&&/^[\p{L}\p{N} _'’\-]+$/u.test(name),'Gebruik 2 tot 18 letters of cijfers.');return name;}
export function saveOwnRoute(p:PlayerV2,id:string,name:unknown,emoji:unknown,now:number){
 const s=ensure(p),rec=s.recording;check(rec&&rec.status==='ready'&&rec.path,'Stop eerst je opname.');const clean=validRouteName(name);check(typeof emoji==='string'&&(ROUTE_EMOJI as readonly string[]).includes(emoji),'Kies een plaatje.');s.own??=[];check(s.own.length<OWN_ROUTE_LIMIT,'Je hebt al '+OWN_ROUTE_LIMIT+' eigen routes. Verwijder er eerst één.');
 const route:FieldRoute={id:'own-'+id.slice(0,20),name:clean,emoji,points:rec.path,meters:rec.meters,source:'own',createdAt:now};s.own.push(route);s.recording=null;return route;
}
export function deleteOwnRoute(p:PlayerV2,id:unknown){const s=ensure(p),i=(s.own??[]).findIndex(r=>r.id===id);check(i>=0,'Deze route bestaat niet.');check(!s.run||s.run.status==='claimed'||s.run.route.id!==id,'Stop eerst deze route.');s.own!.splice(i,1);if(s.badges)delete s.badges[id as string];}
