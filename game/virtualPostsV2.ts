import type {AreaFeature} from './habitatsV2';
import {canSpawnAt,contains,edgeDistance} from './habitatsV2';
import type {Fix} from './walkingV2';
import {distance} from './walkingV2';
import type {FieldPost} from './worldSitesV2';

const CELL=170,RANGE=450;
const denied=(p:Record<string,unknown>)=>['private','no','customers','permit'].includes(String(p.access??''))||['private','no'].includes(String(p.foot??''));
const pedestrian=(f:AreaFeature)=>f.layer==='transportation'&&!denied(f.properties)&&/^(footway|path|pedestrian|cycleway|steps)$/.test(String(f.properties.subclass??f.properties.class??''));
function lines(f:AreaFeature){return f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.type==='MultiLineString'?f.geometry.coordinates:[];}
function closest(lat:number,lng:number,paths:AreaFeature[]){
 const sx=111320*Math.cos(lat*Math.PI/180),sy=111320;let best=Infinity,result:{lat:number;lng:number}|null=null;
 for(const f of paths)for(const line of lines(f))for(let i=1;i<line.length;i++){
  const a=line[i-1],b=line[i],x=(a[0]-lng)*sx,y=(a[1]-lat)*sy,dx=(b[0]-a[0])*sx,dy=(b[1]-a[1])*sy,t=Math.max(0,Math.min(1,-(x*dx+y*dy)/(dx*dx+dy*dy||1))),d=Math.hypot(x+t*dx,y+t*dy);
  if(d<best){best=d;result={lat:a[1]+(b[1]-a[1])*t,lng:a[0]+(b[0]-a[0])*t};}
 }
 return best<=65?result:null;
}
/** Virtual game objects, anchored to actual mapped pedestrian geometry. Never invented OSM POIs. */
/** Field posts along walking paths on a fixed global grid. `range`/`limit` are larger for display-only horizon posts. */
export function virtualPosts(fix:Pick<Fix,'lat'|'lng'>,features:AreaFeature[],existing:FieldPost[]=[],range=RANGE,limit=20):FieldPost[]{
 const paths=features.filter(pedestrian);if(!paths.length)return [];
 const dy=CELL/111320,row=Math.floor(fix.lat/dy),candidates:FieldPost[]=[];
 const reach=Math.ceil(range/CELL)+1;for(let y=row-reach;y<=row+reach;y++){
  const lat=(y+.5)*dy,dx=CELL/(111320*Math.cos(lat*Math.PI/180)),col=Math.floor(fix.lng/dx);
  for(let x=col-reach;x<=col+reach;x++){
   const point=closest(lat,(x+.5)*dx,paths);if(!point||distance(fix,point)>range||!canSpawnAt(point,features))continue;
   // Do not put resources on motor roads, railways, water, buildings or access-restricted mapped land.
   if(features.some(f=>denied(f.properties)&&(contains(point,f.geometry)||edgeDistance(point,f.geometry)<8)||f.layer==='waterway'&&edgeDistance(point,f.geometry)<4||f.layer==='transportation'&&!pedestrian(f)&&edgeDistance(point,f.geometry)<8))continue;
   if(existing.some(p=>distance(p,point)<60))continue;
   candidates.push({id:'vpost-'+y+'-'+x,name:'Veldpost',...point,source:'virtual'});
  }
 }
 // A fixed cell order avoids changing IDs or moving rewards as the player walks.
 const spaced:FieldPost[]=[];
 for(const post of candidates.sort((a,b)=>a.id.localeCompare(b.id)))if(!spaced.some(p=>distance(p,post)<70))spaced.push(post);
 return spaced.sort((a,b)=>distance(fix,a)-distance(fix,b)).slice(0,Math.max(0,limit-existing.length));
}
