import {createHash} from 'node:crypto';
import {distance} from '../game/walkingV2';
import type {Fix} from '../game/walkingV2';
import type {WorldSites,FieldPost,FieldRoute,MapSite} from '../game/worldSitesV2';
import {MAP_SITE_LIMIT,MAP_SITE_RADIUS,gymCandidate} from '../game/worldSitesV2';
import {edgeDistance} from '../game/habitatsV2';

type Element={type:string;id:number;lat?:number;lon?:number;tags?:Record<string,string|undefined>;geometry?:{lat:number;lon:number}[]};
const allowed=(e:Element)=>!['private','no','customers','permit'].includes(e.tags?.access??'')&&!['private','no'].includes(e.tags?.foot??'');
const id=(prefix:string,source:string)=>prefix+createHash('sha256').update(source).digest('hex').slice(0,20);
type Point={lat:number;lng:number};
function routePoints(points:Point[],walkable:(p:Point)=>boolean){
 const samples=[points[0]];let total=0,remainder=0;
 for(let i=1;i<points.length&&total<600;i++){
  const a=points[i-1],b=points[i],meters=distance(a,b);if(meters>150)return null;if(meters===0)continue;
  const length=Math.min(meters,600-total),at=(d:number)=>({lat:a.lat+(b.lat-a.lat)*d/meters,lng:a.lng+(b.lng-a.lng)*d/meters});
  // Check between source vertices too; an endpoint-only check misses mapped obstacles.
  const steps=Math.ceil(length/5);for(let step=0;step<=steps;step++)if(!walkable(at(length*step/steps)))return null;
  for(let d=40-remainder;d<=length;d+=40)samples.push(at(d));
  const end=at(length);if(distance(samples.at(-1)!,end)>.01)samples.push(end);
  // Retain every bend, so the displayed route never cuts a corner between samples.
  total+=length;remainder=(remainder+length)%40;
 }
 return total>=160&&samples.length>=5?samples:null;
}
const KINDS:Record<string,string>={artwork:'Kunstwerk',information:'Informatiebord',viewpoint:'Uitzichtpunt',picnic_site:'Picknickplek',memorial:'Gedenkplek',monument:'Monument',drinking_water:'Waterpunt'};
const POST_RANGE=600,SPACING=55,ROUTE_LIMIT=6,POST_LIMIT=20;
/** Grid of allowed footways (100 m cells, bbox grown by the 40 m rule) so a 1.2 km horizon stays cheap; distances still use edgeDistance. */
function pathIndex(ways:Element[],origin:Point){
 const sx=111320*Math.cos(origin.lat*Math.PI/180),sy=111320,size=100,grid=new Map<string,number[]>(),wide:number[]=[],lines=ways.map(w=>({type:'LineString' as const,coordinates:w.geometry!.map(n=>[n.lon,n.lat])}));
 ways.forEach((w,i)=>{let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;for(const n of w.geometry!){const x=(n.lon-origin.lng)*sx,y=(n.lat-origin.lat)*sy;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  const a=Math.floor((x0-40)/size),b=Math.floor((x1+40)/size),c=Math.floor((y0-40)/size),d=Math.floor((y1+40)/size);if((b-a+1)*(d-c+1)>400){wide.push(i);return;}
  for(let x=a;x<=b;x++)for(let y=c;y<=d;y++){const key=x+','+y,list=grid.get(key);if(list)list.push(i);else grid.set(key,[i]);}});
 return (p:Point)=>[...(grid.get(Math.floor((p.lng-origin.lng)*sx/size)+','+Math.floor((p.lat-origin.lat)*sy/size))??[]),...wide].some(i=>edgeDistance(p,lines[i])<40);
}
/** posts: playable (<=600 m, walkable, max 20). map: display-only horizon markers (<=MAP_SITE_RADIUS) without known-blocked spots. */
export function buildWorldSites(elements:Element[],fix:Fix,walkable:(p:{lat:number;lng:number})=>boolean,unwalkable:(p:{lat:number;lng:number})=>boolean=()=>false):WorldSites{
 const ways=elements.filter(e=>e.type==='way'&&allowed(e)&&['footway','path','pedestrian','steps'].includes(e.tags?.highway??'')&&e.geometry&&e.geometry.length>1),posts:FieldPost[]=[],routes:FieldRoute[]=[],map:MapSite[]=[];
 const nearPath=pathIndex(ways,fix),spaced:{lat:number;lng:number;meters:number;id:string;osmId:string;name:string}[]=[];
 // Spacing follows OSM id order, not the player's position: the post seen on the horizon is the post you walk up to.
 for(const e of elements.filter(e=>e.type==='node'&&allowed(e)&&Number.isFinite(e.lat)&&Number.isFinite(e.lon)).sort((a,b)=>a.id-b.id)){
  const point={lat:e.lat!,lng:e.lon!},meters=distance(fix,point),kind=e.tags?.tourism??e.tags?.historic??e.tags?.amenity??'';
  if(!Object.hasOwn(KINDS,kind)||meters>MAP_SITE_RADIUS+SPACING||spaced.some(p=>distance(p,point)<SPACING)||!nearPath(point))continue;
  const osmId='node/'+e.id;spaced.push({...point,meters,id:id('post-',osmId),osmId,name:(e.tags?.name??KINDS[kind]).slice(0,70)});
 }
 spaced.sort((a,b)=>a.meters-b.meters||a.id.localeCompare(b.id));
 for(const s of spaced){if(s.meters>POST_RANGE)break;if(!walkable(s))continue;posts.push({id:s.id,name:s.name,lat:s.lat,lng:s.lng,source:'osm',osmId:s.osmId});if(posts.length===POST_LIMIT)break;}
 for(const s of spaced){if(s.meters>MAP_SITE_RADIUS||map.length>=MAP_SITE_LIMIT+12)break;if(!posts.some(p=>p.id===s.id)&&unwalkable(s))continue;map.push({id:s.id,name:s.name,lat:s.lat,lng:s.lng,...(gymCandidate(s.id)?{gym:true as const}:{})});}
 // Routes up to the visible horizon (start <=1.2 km), nearest first: stop after ROUTE_LIMIT so a big area stays cheap.
 const candidates=ways.map(way=>({way,near:Math.min(distance(fix,{lat:way.geometry![0].lat,lng:way.geometry![0].lon}),distance(fix,{lat:way.geometry!.at(-1)!.lat,lng:way.geometry!.at(-1)!.lon}))})).filter(c=>c.near<=MAP_SITE_RADIUS).sort((a,b)=>a.near-b.near||a.way.id-b.way.id);
 for(const {way} of candidates){if(routes.length>=ROUTE_LIMIT)break;let points=way.geometry!.map(p=>({lat:p.lat,lng:p.lon}));if(points.some(p=>distance(fix,p)>MAP_SITE_RADIUS+200||!walkable(p)))continue;if(distance(fix,points.at(-1)!)<distance(fix,points[0]))points.reverse();if(distance(fix,points[0])>MAP_SITE_RADIUS)continue;
  const samples=routePoints(points,walkable);if(!samples)continue;const path=[...samples,...samples.slice(0,-1).reverse()],meters=Math.round(path.slice(1).reduce((sum,p,i)=>sum+distance(path[i],p),0)),osmId='way/'+way.id;if(routes.some(r=>distance(r.points[0],path[0])<120))continue;
  routes.push({id:id('route-',osmId),name:('Rondje '+(way.tags?.name??'natuurpad')).slice(0,70),points:path,meters,source:'osm',osmId});
 }
 return {posts,routes:routes.sort((a,b)=>distance(fix,a.points[0])-distance(fix,b.points[0])).slice(0,ROUTE_LIMIT),map};
}
type CacheEntry={until:number;data:Element[];available:boolean;at:number;pending?:Promise<void>};
const CACHE_MS=900000,MIN_REQUEST_MS=30000,MAX_BODY_BYTES=6000000,CELL_DEG=.01,MAX_CELLS=288;
type Cell={key:string;s:number;w:number;n:number;e:number};
/** Fixed ~1.1 x 1.1 km grid (0.01 deg rows; one longitude step per whole-degree band, so columns line up). Cells never move with the player, so walking only fetches new edge cells. */
export function worldCell(lat:number,lng:number,dr=0,dc=0):Cell{const row=Math.floor(lat/CELL_DEG)+dr,step=CELL_DEG/Math.max(.15,Math.cos((Math.floor(row*CELL_DEG)+.5)*Math.PI/180)),col=Math.floor(lng/step)+dc,r=(v:number)=>Math.round(v*1e6)/1e6;return {key:row+':'+col,s:r(Math.max(-90,row*CELL_DEG)),n:r(Math.min(90,(row+1)*CELL_DEG)),w:r(Math.max(-180,col*step)),e:r(Math.min(180,(col+1)*step))};}
/** The 3x3 cells around a fix: at least ~1 km of data in every direction, the centre first. */
export function worldCells(fix:{lat:number;lng:number}){const cells=[worldCell(fix.lat,fix.lng)];for(const dr of [-1,0,1])for(const dc of [-1,0,1])if(dr||dc)cells.push(worldCell(fix.lat,fix.lng,dr,dc));return cells;}
function inCell(e:Element,c:Cell){if(e.type==='node')return e.lat!>=c.s&&e.lat!<c.n&&e.lon!>=c.w&&e.lon!<c.e;let s=90,n=-90,w=180,east=-180;for(const p of e.geometry!){s=Math.min(s,p.lat);n=Math.max(n,p.lat);w=Math.min(w,p.lon);east=Math.max(east,p.lon);}return s<=c.n&&n>=c.s&&w<=c.e&&east>=c.w;}
const coordinate=(lat:unknown,lon:unknown)=>typeof lat==='number'&&Number.isFinite(lat)&&Math.abs(lat)<=90&&typeof lon==='number'&&Number.isFinite(lon)&&Math.abs(lon)<=180;
function parseElements(body:string):Element[]{
 const json=JSON.parse(body);
 // Overpass can return HTTP 200 with a runtime-error remark and partial elements.
 if(!json||typeof json!=='object'||json.remark||!Array.isArray(json.elements))throw new Error('Incomplete world data');
 for(const e of json.elements){
  if(!e||!Number.isSafeInteger(e.id)||e.id<=0||!['node','way'].includes(e.type)||!e.tags||typeof e.tags!=='object'||Array.isArray(e.tags)||Object.values(e.tags).some(v=>typeof v!=='string'))throw new Error('Invalid world element');
  if(e.type==='node'?!coordinate(e.lat,e.lon):!Array.isArray(e.geometry)||e.geometry.length<2||e.geometry.some((p:{lat?:unknown;lon?:unknown}|null)=>!p||!coordinate(p.lat,p.lon)))throw new Error('Invalid world geometry');
 }
 return json.elements;
}
async function responseText(response:Response){
 if(Number(response.headers.get('content-length'))>MAX_BODY_BYTES){await response.body?.cancel();throw new Error('World data too large');}
 const reader=response.body?.getReader();if(!reader)throw new Error('Missing world data');
 const decoder=new TextDecoder();let bytes=0,text='';
 try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>MAX_BODY_BYTES)throw new Error('World data too large');text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
function worldSitesUrl(configured:string|undefined){
 if(configured===undefined)return 'https://overpass-api.de/api/interpreter';
 try{const url=new URL(configured);if(!/^https:\/\//i.test(configured)||/[\s\\?#]/.test(configured)||url.username||url.password||configured.split('/')[2].includes('@')||!url.hostname)return null;return url.href;}catch{return null;}
}
export function createWorldSitesProvider(request:typeof fetch=fetch,clock:()=>number=Date.now,configuredUrl:string|undefined=process.env.GAME_WORLD_SITES_URL){
 const endpoint=worldSitesUrl(configuredUrl);
 const cache=new Map<string,CacheEntry>();let busy=false,nextRequestAt=0,blocked=false,failures=0;
 // Serve a cell while its refresh runs (up to twice the TTL), but never after a failed refresh.
 const usable=(e:CacheEntry|undefined)=>!!e?.available&&clock()-e.at<(e.pending?2*CACHE_MS:CACHE_MS);
 return async function(fix:Fix,walkable:(p:{lat:number;lng:number})=>boolean,waitForNetwork=false,unwalkable?:(p:{lat:number;lng:number})=>boolean):Promise<WorldSites>{
  if(endpoint===null)return {posts:[],routes:[],available:false,dataAt:0};
  const cells=worldCells(fix),due=cells.filter(c=>{const e=cache.get(c.key);return (!e||e.until<=clock())&&!e?.pending;});
  if(due.length&&!blocked&&!busy&&clock()>=nextRequestAt){
   // One request per batch of missing cells (fair use); after a failure only the nearest cell, which keeps the box small.
   const batch=failures?due.slice(0,1):due,dy=[Math.min(...batch.map(c=>c.s)),Math.min(...batch.map(c=>c.w)),Math.max(...batch.map(c=>c.n)),Math.max(...batch.map(c=>c.e))],box=dy.join(','),query=`[out:json][timeout:8];(node["tourism"~"^(artwork|information|viewpoint|picnic_site)$"](${box});node["historic"~"^(memorial|monument)$"](${box});node["amenity"="drinking_water"](${box});way["highway"~"^(footway|path|pedestrian|steps)$"](${box}););out geom;`;
   const entries=batch.map(c=>{const old=cache.get(c.key),entry:CacheEntry={until:0,data:old?.data??[],available:old?.available??false,at:old?.at??0};cache.delete(c.key);cache.set(c.key,entry);return entry;});
   busy=true;nextRequestAt=clock()+MIN_REQUEST_MS;
   const pending=(async()=>{try{
    const r=await request(endpoint,{method:'POST',body:new URLSearchParams({data:query}),headers:{'User-Agent':'BugBaas-Preview/0.1','Content-Type':'application/x-www-form-urlencoded'},signal:AbortSignal.timeout(12000)});
    if(!r.ok){
     // A refusal is not a reason to rotate endpoints or identity. Stop until restart.
     if(r.status===403||r.status===406)blocked=true;
     if(r.status===429){const value=r.headers.get('retry-after'),seconds=value===null?NaN:Number(value),until=Number.isFinite(seconds)?clock()+Math.max(0,seconds)*1000:Date.parse(value??'');nextRequestAt=Math.max(nextRequestAt,clock()+60000,Number.isFinite(until)?until:0);}
     await r.body?.cancel();throw new Error('World provider unavailable');
    }
    const data=parseElements(await responseText(r)),at=clock();batch.forEach((c,i)=>{const e=entries[i];e.data=data.filter(el=>inCell(el,c));e.available=true;e.at=at;e.until=at+CACHE_MS;});failures=0;
   }catch{failures++;nextRequestAt=Math.max(nextRequestAt,clock()+Math.min(CACHE_MS,60000*2**Math.min(failures-1,4)));for(const e of entries){e.until=nextRequestAt;e.available=false;}
   }finally{busy=false;for(const e of entries)delete e.pending;}})();
   for(const e of entries)e.pending=pending;while(cache.size>MAX_CELLS)cache.delete(cache.keys().next().value!);
  }
  if(waitForNetwork&&cache.get(cells[0].key)?.pending)await cache.get(cells[0].key)!.pending;
  const centre=cache.get(cells[0].key);
  if(!usable(centre))return {posts:[],routes:[],available:false,dataAt:centre?.at??0};
  const seen=new Set<string>(),elements:Element[]=[];for(const c of cells){const e=cache.get(c.key);if(usable(e))for(const el of e!.data){const key=el.type+el.id;if(!seen.has(key)){seen.add(key);elements.push(el);}}}
  return {...buildWorldSites(elements,fix,walkable,unwalkable),available:true,dataAt:centre!.at};
 };
}
export const getWorldSites=createWorldSitesProvider();
