import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {buildWorldSites,createWorldSitesProvider,worldCells} from '../server/worldSitesDataV2';
import {gymCandidate,horizonSites,HORIZON_LIMITS,MAP_SITE_LIMIT,MAP_SITE_RADIUS,POST_RADIUS} from '../game/worldSitesV2';
import type {MapSite} from '../game/worldSitesV2';
import {gymSites,GYM_RULES} from '../game/gymsV2';
import {distance} from '../game/walkingV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import {UNKNOWN_WEATHER} from '../game/habitatsV2';
import type {HabitatContext} from '../game/habitatsV2';

const NOW=Date.UTC(2026,9,29,12),FIX={lat:52.0905,lng:5.1305,accuracy:8,timestamp:NOW},SX=111320*Math.cos(FIX.lat*Math.PI/180);
const east=(m:number)=>FIX.lng+m/SX;
// One long public footway running east, with information boards every `step` metres.
const path={type:'way',id:1,tags:{highway:'footway'},geometry:Array.from({length:61},(_,i)=>({lat:FIX.lat,lon:east(-1500+i*50)}))};
const board=(id:number,meters:number,tags:Record<string,string>={tourism:'information'})=>({type:'node',id,tags,lat:FIX.lat+.0001,lon:east(meters)});

test('posts stay within 600 m while display-only map sites reach the 1.2 km horizon',()=>{
 const sites=buildWorldSites([path,board(10,100),board(11,550),board(12,900),board(13,1150),board(14,-1190),board(15,1300)],FIX,()=>true);
 assert.deepEqual(sites.posts.map(p=>p.osmId),['node/10','node/11']);
 assert.equal(sites.map!.length,5);assert.ok(sites.map!.some(s=>Math.abs(distance(FIX,s)-1150)<5)&&sites.map!.some(s=>Math.abs(distance(FIX,s)-1190)<5));
 assert.ok(sites.map!.every(s=>distance(FIX,s)<=MAP_SITE_RADIUS));
 assert.ok(sites.map!.every(s=>!!s.gym===gymCandidate(s.id)));
 assert.equal(POST_RADIUS,65);assert.equal(GYM_RULES.range,65);
});

test('known blocked spots never become horizon markers; unknown tiles stay display-only',()=>{
 const elements=[path,board(20,300),board(21,900)],blocked=(p:{lng:number})=>p.lng>east(800);
 const sites=buildWorldSites(elements,FIX,p=>!blocked(p),blocked);
 assert.equal(sites.posts.length,1);assert.equal(sites.map!.length,1);
 const unknown=buildWorldSites(elements,FIX,()=>false);assert.equal(unknown.posts.length,0);assert.equal(unknown.map!.length,2);
});

test('post selection and ids do not depend on where the player stands',()=>{
 // Two boards 40 m apart: the lower OSM id wins from either side, so the far marker is the post you reach.
 const elements=[path,board(31,400),board(30,440)];
 const fromWest=buildWorldSites(elements,FIX,()=>true),fromEast=buildWorldSites(elements,{...FIX,lng:east(800)},()=>true);
 assert.deepEqual(fromWest.map!.map(s=>s.id),fromEast.map!.map(s=>s.id));assert.equal(fromWest.map!.length,1);
 assert.equal(fromWest.posts[0].osmId,'node/30');assert.equal(fromEast.posts[0].osmId,'node/30');
 assert.deepEqual(buildWorldSites(elements,FIX,()=>true),fromWest);
});

test('payload caps: 12 playable posts, bounded map list and per-graphics horizon counts',()=>{
 const many=[path,...Array.from({length:60},(_,i)=>board(100+i,-1450+i*50))];
 const sites=buildWorldSites(many,FIX,()=>true);assert.ok(sites.posts.length<=12);assert.ok(sites.map!.length<=MAP_SITE_LIMIT+12);
 const list=sites.map!.slice(0,MAP_SITE_LIMIT);
 for(const g of ['low','normal','high'] as const){const shown=horizonSites(list,sites.posts,FIX,g);assert.ok(shown.length<=HORIZON_LIMITS[g]);assert.ok(shown.every(s=>!sites.posts.some(p=>p.id===s.id)));assert.ok(shown.every((s,i)=>!i||shown[i-1].meters<=s.meters));}
 assert.ok(HORIZON_LIMITS.low<HORIZON_LIMITS.normal&&HORIZON_LIMITS.normal<HORIZON_LIMITS.high&&HORIZON_LIMITS.high<=MAP_SITE_LIMIT);
 const used=horizonSites([{id:'post-a',name:'A',lat:FIX.lat,lng:east(800)}],[],FIX,'normal',{'post-a':NOW},NOW+1000);assert.equal(used[0].icon,'bb-post-used');
 assert.equal(horizonSites([{id:'post-g',name:'G',lat:FIX.lat,lng:east(800),gym:true,team:'tidal'}],[],FIX)[0].icon,'bb-gym-tidal');
});

test('horizon gym flag matches the server gym rule for every post',()=>{
 for(let n=0;n<200;n+=7){const posts=Array.from({length:6},(_,i)=>({id:'post-'+(n+i).toString(16).padStart(20,'0'),name:'P',lat:FIX.lat,lng:FIX.lng,source:'osm' as const}));const flagged=posts.filter(p=>gymCandidate(p.id)).map(p=>'gym-'+p.id).sort();if(flagged.length)assert.deepEqual(gymSites(posts).map(g=>g.id).sort(),flagged);}
});

test('fixed grid cells cache the horizon: one batch per new area and only edge cells while walking',async()=>{
 let now=NOW;const boxes:string[]=[];
 const provider=createWorldSitesProvider(async(_url,options)=>{const query=new URLSearchParams(String(options?.body)).get('data')!;boxes.push(query.match(/\(([-\d.,]+)\)/)![1]);return Response.json({elements:[path,board(40,300),board(41,1000)]});},()=>now);
 const first=await provider(FIX,()=>true,true);assert.equal(first.available,true);assert.equal(boxes.length,1);assert.equal(first.posts.length,1);assert.equal(first.map!.length,2);
 const [s,w,n,e]=boxes[0].split(',').map(Number);assert.ok(distance({lat:s,lng:FIX.lng},FIX)>=1000&&distance({lat:n,lng:FIX.lng},FIX)>=1000);assert.ok(distance({lat:FIX.lat,lng:w},FIX)>=1000&&distance({lat:FIX.lat,lng:e},FIX)>=1000);
 // Moving inside the same cell, and within the 15-minute TTL, never refetches.
 now+=60000;for(const m of [50,150,250])assert.equal((await provider({...FIX,lng:east(m)},()=>true,true)).available,true);assert.equal(boxes.length,1);
 // Crossing into the next cell eastwards fetches one new column of three cells; the old cells keep serving.
 const next=worldCells({lat:FIX.lat,lng:east(1200)})[0];const step=next.e-next.w;
 const moved=await provider({...FIX,lng:next.w+step/2},()=>true,true);assert.equal(moved.available,true);assert.equal(boxes.length,2);
 const [s2,w2,n2,e2]=boxes[1].split(',').map(Number);assert.ok(Math.abs((e2-w2)-step)<1e-6,'only one column');assert.ok(n2-s2>.029&&n2-s2<.031);
 assert.equal(new Set(worldCells(FIX).map(c=>c.key)).size,9);
});

test('worldLocate keeps horizon sites separate from playable posts and reads far gym teams without creating gyms',async()=>{
 const ids=Array.from({length:400},(_,i)=>'post-far'+i).filter(gymCandidate).slice(0,2),map:MapSite[]=ids.map((id,i)=>({id,name:'Ver weg '+i,lat:FIX.lat,lng:east(700+i*200),gym:true}));
 const habitat:HabitatContext={environment:{biome:'urban',mapSource:'osm',weather:{...UNKNOWN_WEATHER},at:NOW},biomeAt:()=>'urban',canSpawnAt:()=>true,sites:{posts:[],routes:[],map,available:true}};
 const store=new SqliteStore(':memory:');try{
  await store.run(['v2GoGyms:gym-'+ids[0]],d=>d.set('v2GoGyms:gym-'+ids[0],{id:'gym-'+ids[0],postId:ids[0],name:'Ver weg 0 · Gym',lat:map[0].lat,lng:map[0].lng,team:'amber',revision:3,defenders:[]}));
  const service=new GoServiceV2(store,'local',()=>NOW,async()=>habitat);let v=await service.state('horizon');
  v=await service.command('horizon',{type:'worldLocate',fix:FIX,commandId:randomUUID(),expectedRevision:v.player.revision});
  assert.deepEqual(v.player.walking!.posts,[]);assert.deepEqual(v.player.walking!.mapSites!.map(s=>s.id),ids);
  assert.equal(v.player.walking!.mapSites![0].team,'amber');assert.equal(v.player.walking!.mapSites![1].team,null);
  assert.deepEqual(v.goGyms??[],[]);
  assert.equal(await store.run(['v2GoGyms:gym-'+ids[1]],d=>d.get('v2GoGyms:gym-'+ids[1])),undefined);
  // The stored player keeps only the light list; team colours are view-only.
  const stored=await store.run(['v2Players:horizon'],d=>d.get('v2Players:horizon') as {walking:{mapSites:MapSite[]}});assert.ok(stored.walking.mapSites.every(s=>s.team===undefined));
 }finally{store.close();}
});
