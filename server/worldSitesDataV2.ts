import {createHash} from 'node:crypto';
import {distance} from '../game/walkingV2';
import type {Fix} from '../game/walkingV2';
import type {WorldSites,FieldPost,FieldRoute} from '../game/worldSitesV2';

type Element={type:string;id:number;lat?:number;lon?:number;tags?:Record<string,string|undefined>;geometry?:{lat:number;lon:number}[]};
const allowed=(e:Element)=>!['private','no','customers','permit'].includes(e.tags?.access??'')&&!['private','no'].includes(e.tags?.foot??'');
const id=(prefix:string,source:string)=>prefix+createHash('sha256').update(source).digest('hex').slice(0,20);
export function buildWorldSites(elements:Element[],fix:Fix,walkable:(p:{lat:number;lng:number})=>boolean):WorldSites{
 const ways=elements.filter(e=>e.type==='way'&&allowed(e)&&['footway','path','pedestrian','steps'].includes(e.tags?.highway??'')&&e.geometry&&e.geometry.length>1),posts:FieldPost[]=[],routes:FieldRoute[]=[];
 const nearPath=(p:{lat:number;lng:number})=>ways.some(w=>w.geometry!.some(n=>distance(p,{lat:n.lat,lng:n.lon})<40));
 for(const e of elements.filter(e=>e.type==='node'&&allowed(e)&&Number.isFinite(e.lat)&&Number.isFinite(e.lon)).sort((a,b)=>distance(fix,{lat:a.lat!,lng:a.lon!})-distance(fix,{lat:b.lat!,lng:b.lon!}))){
  const point={lat:e.lat!,lng:e.lon!};if(distance(fix,point)>600||!walkable(point)||!nearPath(point)||posts.some(p=>distance(p,point)<80))continue;
  const kind=e.tags?.tourism??e.tags?.historic??e.tags?.amenity??'';if(!['artwork','information','viewpoint','picnic_site','memorial','monument','drinking_water'].includes(kind))continue;
  const name=(e.tags?.name??({artwork:'Kunstwerk',information:'Informatiebord',viewpoint:'Uitzichtpunt',picnic_site:'Picknickplek',memorial:'Gedenkplek',monument:'Monument',drinking_water:'Waterpunt'} as Record<string,string>)[kind]).slice(0,70),osmId='node/'+e.id;posts.push({id:id('post-',osmId),name,...point,source:'osm',osmId});if(posts.length===12)break;
 }
 for(const way of ways){let points=way.geometry!.map(p=>({lat:p.lat,lng:p.lon}));if(points.some(p=>distance(fix,p)>900||!walkable(p)))continue;if(distance(fix,points.at(-1)!)<distance(fix,points[0]))points.reverse();if(distance(fix,points[0])>500)continue;
  const samples=[points[0]];let total=0,remainder=0;for(let i=1;i<points.length&&total<600;i++){const a=points[i-1],b=points[i],meters=distance(a,b);if(meters>150)break;for(let d=40-remainder;d<=meters;d+=40){const t=d/meters;samples.push({lat:a.lat+(b.lat-a.lat)*t,lng:a.lng+(b.lng-a.lng)*t});}total+=meters;remainder=(remainder+meters)%40;}
  if(total<160||samples.length<5)continue;const path=[...samples,...samples.slice(0,-1).reverse()],meters=Math.round(path.slice(1).reduce((sum,p,i)=>sum+distance(path[i],p),0)),osmId='way/'+way.id;if(routes.some(r=>distance(r.points[0],path[0])<120))continue;
  routes.push({id:id('route-',osmId),name:('Rondje '+(way.tags?.name??'natuurpad')).slice(0,70),points:path,meters,source:'osm',osmId});
 }
 return {posts,routes:routes.sort((a,b)=>distance(fix,a.points[0])-distance(fix,b.points[0])).slice(0,3)};
}
type CacheEntry={until:number;data:Element[];available:boolean;at:number;pending?:Promise<void>};
const CACHE_MS=900000,MIN_REQUEST_MS=30000,MAX_BODY_BYTES=6000000;
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
 return async function(fix:Fix,walkable:(p:{lat:number;lng:number})=>boolean,waitForNetwork=false):Promise<WorldSites>{
  if(endpoint===null)return {posts:[],routes:[],available:false,dataAt:0};
  const lat=Math.round(fix.lat*100)/100,lng=Math.round(fix.lng*100)/100,key=lat+','+lng;let entry=cache.get(key);
  if((!entry||entry.until<=clock())&&!entry?.pending&&!blocked&&!busy&&clock()>=nextRequestAt){
   const dy=.012,dx=.012/Math.max(.15,Math.cos(lat*Math.PI/180)),box=[lat-dy,lng-dx,lat+dy,lng+dx].join(','),query=`[out:json][timeout:8];(node["tourism"~"^(artwork|information|viewpoint|picnic_site)$"](${box});node["historic"~"^(memorial|monument)$"](${box});node["amenity"="drinking_water"](${box});way["highway"~"^(footway|path|pedestrian|steps)$"](${box}););out geom;`;
   entry={until:0,data:entry?.data??[],available:false,at:entry?.at??0};const current=entry;busy=true;nextRequestAt=clock()+MIN_REQUEST_MS;
   current.pending=(async()=>{try{
    const r=await request(endpoint,{method:'POST',body:new URLSearchParams({data:query}),headers:{'User-Agent':'BugBaas-Preview/0.1','Content-Type':'application/x-www-form-urlencoded'},signal:AbortSignal.timeout(12000)});
    if(!r.ok){
     // A refusal is not a reason to rotate endpoints or identity. Stop until restart.
     if(r.status===403||r.status===406)blocked=true;
     if(r.status===429){const value=r.headers.get('retry-after'),seconds=value===null?NaN:Number(value),until=Number.isFinite(seconds)?clock()+Math.max(0,seconds)*1000:Date.parse(value??'');nextRequestAt=Math.max(nextRequestAt,clock()+60000,Number.isFinite(until)?until:0);}
     await r.body?.cancel();throw new Error('World provider unavailable');
    }
    const data=parseElements(await responseText(r));current.data=data;current.available=true;current.at=clock();current.until=clock()+CACHE_MS;failures=0;
   }catch{failures++;nextRequestAt=Math.max(nextRequestAt,clock()+Math.min(CACHE_MS,60000*2**Math.min(failures-1,4)));current.until=nextRequestAt;current.available=false;
   }finally{busy=false;delete current.pending;}})();cache.set(key,current);if(cache.size>64)cache.delete(cache.keys().next().value!);
  }
  if(waitForNetwork&&entry?.pending)await entry.pending;
  const available=!!entry?.available&&clock()-entry.at<CACHE_MS;
  return {...(available?buildWorldSites(entry!.data,fix,walkable):{posts:[],routes:[]}),available,dataAt:entry?.at??0};
 };
}
export const getWorldSites=createWorldSitesProvider();
