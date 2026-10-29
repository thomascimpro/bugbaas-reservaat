import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {buildWorldSites,createWorldSitesProvider} from '../server/worldSitesDataV2';
import {spinPost,startRoute,advanceRoute,pauseRoute,resumeRoute,finishRoute} from '../game/worldSitesV2';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo} from '../game/goV2';
import {GoServiceV2,parseGo} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import {unknownHabitat} from '../game/habitatsV2';
import {distance} from '../game/walkingV2';
import {routeReward} from '../game/routesV2';
const NOW=Date.UTC(2026,9,20,14),FIX={lat:52.09,lng:5.13,accuracy:8,timestamp:NOW};
const elements=[{type:'way',id:1,tags:{highway:'footway',access:'yes',name:'Bospaadje'},geometry:Array.from({length:15},(_,i)=>({lat:FIX.lat,lon:FIX.lng+i*.0003}))},{type:'node',id:2,tags:{tourism:'information',name:'Natuurbord'},lat:FIX.lat,lon:FIX.lng+.0001},{type:'node',id:3,tags:{tourism:'artwork',access:'private'},lat:FIX.lat,lon:FIX.lng+.0002},{type:'node',id:4,tags:{tourism:'viewpoint'},lat:FIX.lat+.004,lon:FIX.lng+.004}];
const sites=buildWorldSites(elements,FIX,()=>true);
function player(){const p=freshV2('sites','SITES123',NOW);ensureField(p,NOW);ensureGo(p,NOW);p.walking={fix:FIX,at:NOW,seed:'server',spawns:[],caught:[],day:'2026-10-20',count:0,posts:structuredClone(sites.posts),routes:structuredClone(sites.routes)};return p;}
test('world sites come from real tagged objects near allowed footways and never invent private, blocked or off-path posts',()=>{
 assert.equal(sites.posts.length,1);assert.equal(sites.posts[0].osmId,'node/2');assert.equal(sites.posts[0].name,'Natuurbord');assert.ok(sites.routes.length>0);assert.deepEqual(sites.routes[0].points[0],sites.routes[0].points.at(-1));assert.ok(sites.routes[0].meters>=320);
 assert.deepEqual(buildWorldSites(elements,FIX,()=>false,()=>true),{posts:[],routes:[],map:[]});assert.deepEqual(buildWorldSites(elements.map(e=>({...e,tags:{...e.tags,access:'private'}})),FIX,()=>true),{posts:[],routes:[],map:[]});
 // Unknown walkability (map tile not loaded) keeps a display-only marker but never a playable post.
 assert.deepEqual(buildWorldSites(elements,FIX,()=>false).map?.map(s=>s.id),[sites.posts[0].id]);assert.deepEqual(buildWorldSites(elements,FIX,()=>false).posts,[]);
});

test('posts use distance to a footpath segment rather than only its source vertices',()=>{
 const path={type:'way',id:11,tags:{highway:'footway',access:'yes'},geometry:[{lat:FIX.lat,lon:FIX.lng-.001},{lat:FIX.lat,lon:FIX.lng+.001}]};
 const post={type:'node',id:12,tags:{tourism:'information',name:'Midden op het pad'},lat:FIX.lat+.0001,lon:FIX.lng};
 assert.ok(path.geometry.every(n=>distance(FIX,{lat:n.lat,lng:n.lon})>40));
 assert.equal(buildWorldSites([path,post],FIX,()=>true).posts[0]?.osmId,'node/12');
 assert.equal(buildWorldSites([path,{...post,lat:FIX.lat+.0005}],FIX,()=>true).posts.length,0);
});

test('routes check the spaces between safe source vertices and keep every bend',()=>{
 const corner={lat:FIX.lat,lng:FIX.lng+.0016},end={lat:FIX.lat+.0012,lng:corner.lng};
 const path={type:'way',id:21,tags:{highway:'footway',access:'yes'},geometry:[FIX,corner,end].map(p=>({lat:p.lat,lon:p.lng}))};
 const corridor=(p:{lat:number;lng:number})=>Math.abs(p.lat-FIX.lat)<.00002||Math.abs(p.lng-corner.lng)<.00002;
 const route=buildWorldSites([path],FIX,corridor).routes[0];assert.ok(route);assert.ok(route.points.some(p=>distance(p,corner)<.01));assert.ok(route.points.some(p=>distance(p,end)<.01));
 for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i];assert.ok(corridor({lat:(a.lat+b.lat)/2,lng:(a.lng+b.lng)/2}),'Route must follow the bend, not cut across it');}
 const blocked=(p:{lat:number;lng:number})=>corridor(p)&&Math.abs(p.lng-(FIX.lng+.0008))>.00004;
 assert.ok(path.geometry.every(p=>blocked({lat:p.lat,lng:p.lon})));assert.equal(buildWorldSites([path],FIX,blocked).routes.length,0);
});

test('routes reject long geometry gaps and cap the full out-and-back distance at 1200 metres',()=>{
 const path={type:'way',id:31,tags:{highway:'footway',access:'yes'},geometry:Array.from({length:9},(_,i)=>({lat:FIX.lat+i*.001,lon:FIX.lng}))};
 const route=buildWorldSites([path],FIX,()=>true).routes[0];assert.ok(route);assert.equal(route.meters,1200);
 const gap={...path,geometry:[...path.geometry.slice(0,3),{lat:FIX.lat+.005,lon:FIX.lng}]};
 assert.equal(buildWorldSites([gap],FIX,()=>true).routes.length,0);
});
test('post supplies are bounded, require fresh nearby GPS and honor a persistent five-minute cooldown',()=>{
 const p=player(),before=p.field!.inventory.basic;const loot=spinPost(p,sites.posts[0].id,'seed',NOW);assert.ok(loot.basic!>=2&&loot.basic!<=4);assert.equal(p.field!.inventory.basic,before+loot.basic!);assert.throws(()=>spinPost(p,sites.posts[0].id,'new-seed',NOW+1),/laadt/);p.walking!.fix={...FIX,lng:FIX.lng+.01};assert.throws(()=>spinPost(p,sites.posts[0].id,'new',NOW),/65 meter/);p.walking!.fix=FIX;assert.throws(()=>spinPost(p,sites.posts[0].id,'new',NOW+31000),/GPS/);assert.throws(()=>spinPost(p,'fabricated','new',NOW),/niet beschikbaar/);
});
test('route rewards require ordered route points AND verified distance; pause excludes distance and claim pays once',()=>{
 const p=player(),r=sites.routes[0];startRoute(p,r.id,NOW);const run=p.go!.sites!.run!;assert.throws(()=>finishRoute(p,NOW),/Volg eerst/);
 for(const point of r.points){p.walking!.fix={...FIX,...point};advanceRoute(p,NOW);}assert.equal(run.status,'active');assert.equal(run.next,1);
 p.field!.walk={meters:50,dayMeters:50,anchor:FIX,at:NOW};pauseRoute(p);p.field!.walk.meters=500;advanceRoute(p,NOW);assert.equal(run.meters,0);resumeRoute(p,NOW);
 for(const point of r.points.slice(1)){p.walking!.fix={...FIX,...point};p.field!.walk.meters+=40;advanceRoute(p,NOW);}assert.equal(run.status,'ready');const dust=p.go!.dust,nets=p.field!.inventory.basic;finishRoute(p,NOW);assert.equal(p.go!.dust,dust+routeReward(r.meters).dust);assert.equal(p.field!.inventory.basic,nets+routeReward(r.meters).nets);assert.throws(()=>finishRoute(p,NOW));assert.throws(()=>startRoute(p,r.id,NOW),/vandaag/);
});
test('post command receipts prevent duplicate supplies under retries and reject caller-defined loot or positions',async()=>{
 const store=new SqliteStore(':memory:');try{const api=new GoServiceV2(store,'local',()=>NOW,async()=>({...unknownHabitat(NOW),sites}));let view=await api.state('site-api');view=await api.command('site-api',{type:'worldLocate',fix:FIX,commandId:randomUUID(),expectedRevision:view.player.revision});const command={type:'poiSpin',poi:sites.posts[0].id,commandId:randomUUID(),expectedRevision:view.player.revision};view=await api.command('site-api',command);const inventory=structuredClone(view.player.field!.inventory);view=await api.command('site-api',command);assert.deepEqual(view.player.field!.inventory,inventory);for(const extra of [{loot:{basic:9999}},{lat:FIX.lat},{reward:10000}])assert.throws(()=>parseGo({...command,...extra}));}finally{store.close();}
});

test('world provider shares pending and cached reads and serializes requests across location cells',async()=>{
 let now=NOW,calls=0,release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 const provider=createWorldSitesProvider(async(url,options)=>{calls++;assert.equal(url,'https://overpass-api.de/api/interpreter');assert.equal(options?.method,'POST');assert.ok(String(options?.body).startsWith('data='));await gate;return Response.json({elements});},()=>now);
 const first=provider(FIX,()=>true,true),again=provider(FIX,()=>true,true);
 assert.equal((await provider(FIX,()=>true)).available,false);
 assert.equal((await provider({...FIX,lat:FIX.lat+.02},()=>true,true)).available,false);assert.equal(calls,1);
 release();const [a,b]=await Promise.all([first,again]);assert.equal(a.available,true);assert.deepEqual(a,b);assert.equal(a.posts.length,1);
 assert.equal((await provider(FIX,()=>true,true)).dataAt,NOW);assert.equal(calls,1);
 assert.equal((await provider({...FIX,lat:FIX.lat+.02},()=>true,true)).available,false);assert.equal(calls,1);
 now+=30000;await provider({...FIX,lat:FIX.lat+.02},()=>true,true);assert.equal(calls,2);
});

test('configured world source is the only requested endpoint with unchanged request headers',async()=>{
 const endpoint='https://approved.example/overpass/interpreter',urls:string[]=[];
 const provider=createWorldSitesProvider(async(url,options)=>{urls.push(String(url));assert.deepEqual(options?.headers,{'User-Agent':'BugBaas-Preview/0.1','Content-Type':'application/x-www-form-urlencoded'});assert.equal(options?.method,'POST');return Response.json({elements});},()=>NOW,endpoint);
 const result=await provider(FIX,()=>true,true);assert.equal(result.available,true);assert.equal(result.posts.length,1);assert.deepEqual(urls,[endpoint]);
});

test('invalid configured world sources stay unavailable without a request or default fallback',async()=>{
 for(const endpoint of ['', '/api/interpreter','http://approved.example/api/interpreter','https://user:pass@approved.example/api','https://@approved.example/api','https://approved.example/api?key=secret','https://approved.example/api?','https://approved.example/api#fragment','https://approved.example/api#',' https://approved.example/api','https:\\approved.example/api']){
  let calls=0;const provider=createWorldSitesProvider(async()=>{calls++;return Response.json({elements});},()=>NOW,endpoint);
  for(const lat of [FIX.lat,FIX.lat+.02])assert.deepEqual(await provider({...FIX,lat},()=>true,true),{posts:[],routes:[],available:false,dataAt:0});
  assert.equal(calls,0,endpoint);
 }
});

test('HTTP 406 and 403 stop default and configured provider-wide retries without switching endpoint or identity',async()=>{
 for(const endpoint of [undefined,'https://approved.example/api/interpreter'])for(const status of [406,403]){let now=NOW,calls=0;const provider=createWorldSitesProvider(async(url,options)=>{calls++;assert.equal(url,endpoint??'https://overpass-api.de/api/interpreter');assert.deepEqual(options?.headers,{'User-Agent':'BugBaas-Preview/0.1','Content-Type':'application/x-www-form-urlencoded'});return new Response('refused',{status});},()=>now,endpoint);
  assert.equal((await provider(FIX,()=>true,true)).available,false);
  now+=86400000;for(const lat of [FIX.lat,FIX.lat+.02,FIX.lat+.04]){const result=await provider({...FIX,lat},()=>true,true);assert.equal(result.available,false);assert.deepEqual(result.posts,[]);assert.deepEqual(result.routes,[]);}assert.equal(calls,1);
 }
});

test('HTTP 429 honors seconds and HTTP-date Retry-After across location cells',async()=>{
 for(const retry of ['180',new Date(NOW+180000).toUTCString()]){let now=NOW,calls=0;const provider=createWorldSitesProvider(async()=>{calls++;return calls===1?new Response('busy',{status:429,headers:{'Retry-After':retry}}):Response.json({elements:[]});},()=>now);
  await provider(FIX,()=>true,true);now+=179999;
  assert.equal((await provider({...FIX,lat:FIX.lat+.02},()=>true,true)).available,false);assert.equal(calls,1);
  now++;const empty=await provider(FIX,()=>true,true);assert.equal(empty.available,true);assert.deepEqual(empty.posts,[]);assert.equal(calls,2);
 }
});

test('network failures back off globally and expired cached points do not conceal a failed refresh',async()=>{
 let now=NOW,calls=0;const provider=createWorldSitesProvider(async()=>{calls++;if(calls===1)return Response.json({elements});throw new Error('offline');},()=>now);
 assert.equal((await provider(FIX,()=>true,true)).posts.length,1);now+=900000;
 const failed=await provider(FIX,()=>true,true);assert.equal(failed.available,false);assert.equal(failed.dataAt,NOW);assert.deepEqual(failed.posts,[]);assert.deepEqual(failed.routes,[]);
 now+=59999;await provider({...FIX,lat:FIX.lat+.02},()=>true,true);assert.equal(calls,2);
 now++;await provider(FIX,()=>true,true);assert.equal(calls,3);
 now+=119999;await provider({...FIX,lat:FIX.lat+.02},()=>true,true);assert.equal(calls,3);
 now++;await provider(FIX,()=>true,true);assert.equal(calls,4);
});

test('partial Overpass results and invalid elements never become available sites',async()=>{
 for(const body of [{remark:'runtime error: Query timed out',elements},{elements:null},{elements:[...elements,{type:'node',id:99,lat:91,lon:5,tags:{tourism:'artwork'}}]},{elements:[{...elements[0],geometry:[{lat:FIX.lat,lon:FIX.lng},null]}]},{elements:[{...elements[1],tags:{name:42}}]}]){
  let calls=0;const provider=createWorldSitesProvider(async()=>{calls++;return Response.json(body);},()=>NOW);
  const result=await provider(FIX,()=>true,true);assert.equal(result.available,false);assert.equal(result.dataAt,0);assert.deepEqual(result.posts,[]);assert.deepEqual(result.routes,[]);
  await provider({...FIX,lat:FIX.lat+.02},()=>true,true);assert.equal(calls,1);
 }
});

test('provider rejects oversized or truncated responses before publishing world data',async()=>{
 for(const response of [new Response('{"elements":[',{headers:{'content-type':'application/json'}}),new Response('{}',{headers:{'content-length':'6000001'}}),new Response('x'.repeat(6000001))]){
  const provider=createWorldSitesProvider(async()=>response,()=>NOW),result=await provider(FIX,()=>true,true);
  assert.equal(result.available,false);assert.deepEqual(result.posts,[]);assert.equal(result.dataAt,0);
 }
});
