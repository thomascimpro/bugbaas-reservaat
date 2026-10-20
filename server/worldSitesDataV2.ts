import {createHash} from 'node:crypto';
import {distance} from '../game/walkingV2';
import type {Fix} from '../game/walkingV2';
import type {WorldSites,FieldPost,FieldRoute} from '../game/worldSitesV2';

type Element={type:string;id:number;lat?:number;lon?:number;tags?:Record<string,string|undefined>;geometry?:{lat:number;lon:number}[]};
const cache=new Map<string,{until:number;data:Element[];available:boolean;at:number;pending?:Promise<Element[]>}>();
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
export async function getWorldSites(fix:Fix,walkable:(p:{lat:number;lng:number})=>boolean,waitForNetwork=false):Promise<WorldSites>{
 const lat=Math.round(fix.lat*100)/100,lng=Math.round(fix.lng*100)/100,key=lat+','+lng;let entry=cache.get(key);
 if(!entry||entry.until<Date.now()){
  const dy=.012,dx=.012/Math.max(.15,Math.cos(lat*Math.PI/180)),box=[lat-dy,lng-dx,lat+dy,lng+dx].join(','),query=`[out:json][timeout:8];(node["tourism"~"^(artwork|information|viewpoint|picnic_site)$"](${box});node["historic"~"^(memorial|monument)$"](${box});node["amenity"="drinking_water"](${box});way["highway"~"^(footway|path|pedestrian|steps)$"](${box}););out geom;`;
  entry={until:Date.now()+900000,data:entry?.data??[],available:entry?.available??false,at:entry?.at??0};const current=entry;entry.pending=(async()=>{try{const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:new URLSearchParams({data:query}),headers:{'User-Agent':'BugBaas-Preview/0.1','Content-Type':'application/x-www-form-urlencoded'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error();const body=await r.text();if(body.length>6000000)throw new Error();const json=JSON.parse(body);if(!Array.isArray(json.elements))throw new Error();current.data=json.elements.filter((e:Element)=>e&&Number.isSafeInteger(e.id)&&['node','way'].includes(e.type));current.available=true;current.at=Date.now();}catch{current.until=Date.now()+60000;}finally{delete current.pending;}return current.data;})();cache.set(key,entry);if(cache.size>64)cache.delete(cache.keys().next().value!);
 }
 const data=waitForNetwork&&entry.pending?await entry.pending:entry.data,available=entry.available&&Date.now()-entry.at<86400000;return {...(available?buildWorldSites(data,fix,walkable):{posts:[],routes:[]}),available,dataAt:entry.at};
}
