import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {startRoute,advanceRoute,pauseRoute,finishRoute} from '../game/worldSitesV2';
import type {FieldRoute} from '../game/worldSitesV2';
import {routeMapPayload,routeReward,routeBadge,routeDistance,simplifyPath,densifyPath,pathMeters,startRecording,recordRouteFix,stopRecording,saveOwnRoute,deleteOwnRoute,noteRouteCatches,keepRouteSpawns,OWN_ROUTE_LIMIT,ROUTE_BONUS_EVERY} from '../game/routesV2';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo} from '../game/goV2';
import {GoServiceV2,parseGo} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import type {PlayerV2} from '../game/typesV2';
const NOW=Date.UTC(2026,9,20,14),FIX={lat:52.09,lng:5.13,accuracy:8,timestamp:NOW},M=111194.92664455874;
const north=(meters:number)=>({lat:FIX.lat+meters/M,lng:FIX.lng});
const line=(count:number,step=40)=>Array.from({length:count},(_,i)=>north(i*step));
const osm:FieldRoute={id:'route-a',name:'Rondje Bospad',points:line(20),meters:Math.round(pathMeters(line(20))),source:'osm',osmId:'way/1'};
function player(uid='routes'){const p=freshV2(uid,'ROUTES12',NOW);ensureField(p,NOW);ensureGo(p,NOW);p.field!.walk={meters:0,dayMeters:0,anchor:FIX,at:NOW} as never;p.walking={fix:FIX,at:NOW,seed:'server',spawns:[],caught:[],day:'2026-10-20',count:0,posts:[],routes:[structuredClone(osm)]};return p;}
function walkRoute(p:PlayerV2,route:FieldRoute,now=NOW){for(const point of route.points.slice(1)){p.walking!.fix={...FIX,...point,timestamp:now};p.walking!.at=now;(p.field!.walk as {meters:number}).meters+=40;advanceRoute(p,now);}}

test('map payload lists nearby OSM routes and own routes with start, length, badge and active run first',()=>{
 const p=player(),own:FieldRoute={id:'own-1',name:'Mijn rondje',emoji:'🦋',points:line(15).map(x=>({lat:x.lat,lng:x.lng+.0005})),meters:560,source:'own'},far:FieldRoute={...own,id:'own-far',points:line(3).map(x=>({lat:x.lat+.03,lng:x.lng}))};
 p.go!.sites={visits:{},firstDay:'',routeClaims:[],run:null,own:[own,far],badges:{'route-a':5}};
 let list=routeMapPayload(p,FIX,NOW);assert.deepEqual(list.map(r=>r.id),['route-a','own-1']);assert.equal(list[0].emoji,'🏁');assert.equal(list[0].badge,2);assert.equal(list[0].own,false);assert.equal(list[1].own,true);assert.equal(list[1].emoji,'🦋');assert.deepEqual(list[0].start,osm.points[0]);assert.equal(list[0].away,0);
 startRoute(p,'own-1',NOW+0,'seed');list=routeMapPayload(p,FIX,NOW);assert.equal(list[0].id,'own-1');assert.equal(list[0].active,true);
 assert.deepEqual([routeBadge(0),routeBadge(1),routeBadge(4),routeBadge(5),routeBadge(10)],[0,1,1,2,3]);
});

test('bonus bugs spawn every 150 verified metres on a running route only, deterministically from the run seed',()=>{
 const a=player(),b=player();walkRoute(a,osm);assert.equal(a.walking!.spawns.length,0); // No run: walking alone never adds route bugs.
 const c=player();startRoute(c,osm.id,NOW);walkRoute(c,osm);assert.equal(c.walking!.spawns.length,0); // A run without a server seed (old data) gets none.
 for(const p of [a,b]){p.walking!.fix=FIX;p.field!.walk={meters:0,dayMeters:0,anchor:FIX,at:NOW} as never;startRoute(p,osm.id,NOW,'secret-seed');walkRoute(p,osm);}
 const spawns=a.walking!.spawns.filter(s=>s.id.startsWith('route-'));assert.equal(spawns.length,Math.floor(osm.meters/ROUTE_BONUS_EVERY));assert.deepEqual(spawns,b.walking!.spawns.filter(s=>s.id.startsWith('route-')));
 for(const s of spawns)assert.ok(routeDistance(s,osm.points)<=15);
 const d=player();startRoute(d,osm.id,NOW,'other-seed');walkRoute(d,osm);assert.notDeepEqual(d.walking!.spawns.map(s=>s.species+s.lat),spawns.map(s=>s.species+s.lat));
 // Paused or off-route metres never count.
 const e=player();startRoute(e,osm.id,NOW,'secret-seed');pauseRoute(e);walkRoute(e,osm);assert.equal(e.walking!.spawns.length,0);
 const f=player();startRoute(f,osm.id,NOW,'secret-seed');for(let i=0;i<20;i++){f.walking!.fix={...FIX,lng:FIX.lng+.002};(f.field!.walk as {meters:number}).meters+=40;advanceRoute(f,NOW);}assert.equal(f.go!.sites!.run!.meters,0);assert.equal(f.walking!.spawns.length,0);
});

test('bonus bugs survive a spawn refresh until caught, and a caught one never returns',()=>{
 const p=player();startRoute(p,osm.id,NOW,'secret-seed');walkRoute(p,osm);const first=p.walking!.spawns.find(s=>s.id.startsWith('route-'))!;
 p.walking!.caught.push(first.id);noteRouteCatches(p);p.walking!.spawns=[];p.walking!.caught=[];keepRouteSpawns(p,NOW+1000);
 assert.ok(!p.walking!.spawns.some(s=>s.id===first.id));assert.equal(p.walking!.spawns.length,Math.floor(osm.meters/ROUTE_BONUS_EVERY)-1);
 p.walking!.spawns=[];keepRouteSpawns(p,NOW+400000);assert.equal(p.walking!.spawns.length,0);
});

test('finish chest scales with length, pays once per route per day and levels the route badge',()=>{
 const p=player();startRoute(p,osm.id,NOW,'seed');walkRoute(p,osm);assert.equal(p.go!.sites!.run!.status,'ready');
 const dust=p.go!.dust,nets=p.field!.inventory.basic,reward=routeReward(osm.meters),result=finishRoute(p,NOW,'seed');
 assert.equal(p.go!.dust,dust+reward.dust);assert.equal(p.field!.inventory.basic,nets+reward.nets);assert.equal(result.badge,1);assert.equal(p.go!.sites!.badges![osm.id],1);assert.equal(p.go!.sites!.lastRoute!.route,osm.id);
 assert.ok(routeReward(5000).dust>routeReward(1200).dust&&routeReward(1200).dust>routeReward(500).dust);assert.ok(!Object.keys(p.go!.sites!.visits).length,'A route cocoon roll is not a post spin');
 p.walking!.fix=FIX;assert.throws(()=>startRoute(p,osm.id,NOW+1000,'seed'),/vandaag/);
 const tomorrow=NOW+86400000;p.walking!.fix={...FIX,timestamp:tomorrow};p.walking!.at=tomorrow;startRoute(p,osm.id,tomorrow,'seed2');walkRoute(p,osm,tomorrow);finishRoute(p,tomorrow,'seed2');assert.equal(p.go!.sites!.badges![osm.id],2);
});

test('path simplification keeps bends and densifies to walkable route points',()=>{
 const raw=[...line(10,15),...Array.from({length:10},(_,i)=>({lat:north(135).lat,lng:FIX.lng+(i+1)*15/(M*Math.cos(FIX.lat*Math.PI/180))}))];
 const simple=simplifyPath(raw);assert.equal(simple.length,3);const dense=densifyPath(simple);assert.ok(dense.every((p,i)=>i===0||pathMeters([dense[i-1],p])<=40.5));assert.ok(Math.abs(pathMeters(dense)-pathMeters(raw))<2);
});

function recorder(){const p=player();let now=NOW;const step=(meters:number,seconds:number,accuracy=8)=>{now+=seconds*1000;const last=p.walking!.fix;p.walking!.fix={lat:last.lat+meters/M,lng:FIX.lng,accuracy,timestamp:now};p.walking!.at=now;recordRouteFix(p,now);};return {p,step,now:()=>now};}
test('recorded collinear U-turns preserve walked length and can be saved after the UI reaches 500 metres',()=>{
 const r=recorder();startRecording(r.p,NOW);for(const [sign,count] of [[1,15],[-1,10],[1,15]])for(let i=0;i<count;i++)r.step(sign*20,20);
 const recorded=r.p.go!.sites!.recording!.meters;assert.ok(recorded>795);stopRecording(r.p);const rec=r.p.go!.sites!.recording!;assert.equal(rec.status,'ready');assert.ok(Math.abs(rec.meters-recorded)<3);assert.ok(Math.abs(pathMeters(rec.path!)-recorded)<3);
 const own=saveOwnRoute(r.p,'u-turn-route','Heen en terug','🌳',r.now());assert.ok(own.meters>795);assert.ok(own.points.some((p,i,a)=>i>0&&i<a.length-1&&(p.lat-a[i-1].lat)*(a[i+1].lat-p.lat)<0),'actual reversals remain in the route');
});
test('own routes: too short and too fast are rejected, a walked loop is saved, cap of five and delete',()=>{
 const short=recorder();startRecording(short.p,NOW);for(let i=0;i<15;i++)short.step(20,15);assert.throws(()=>stopRecording(short.p),/500 m/);assert.equal(short.p.go!.sites!.recording!.status,'recording');
 for(let i=0;i<15;i++)short.step(20,15);stopRecording(short.p);assert.equal(short.p.go!.sites!.recording!.status,'ready');assert.ok(short.p.go!.sites!.recording!.meters>=500);
 assert.throws(()=>saveOwnRoute(short.p,'abc',' x ','🦋',NOW),/2 tot 18/);assert.throws(()=>saveOwnRoute(short.p,'abc','Mijn <script>','🦋',NOW),/2 tot 18/);assert.throws(()=>saveOwnRoute(short.p,'abc','Mijn pad','💣',NOW),/plaatje/);
 const route=saveOwnRoute(short.p,'abcdef','Mijn pad','🦋',NOW);assert.equal(route.source,'own');assert.equal(route.name,'Mijn pad');assert.equal(short.p.go!.sites!.recording,null);assert.ok(route.points.length>=3);
 const fast=recorder();startRecording(fast.p,NOW);for(let i=0;i<12;i++)fast.step(60,10);assert.throws(()=>stopRecording(fast.p),/Te snel/);
 const capped=recorder();capped.p.go!.sites={visits:{},firstDay:'',routeClaims:[],run:null,own:Array.from({length:OWN_ROUTE_LIMIT},(_,i)=>({...route,id:'own-'+i}))};assert.throws(()=>startRecording(capped.p,NOW),/5 eigen routes/);
 deleteOwnRoute(capped.p,'own-0');assert.equal(capped.p.go!.sites!.own!.length,OWN_ROUTE_LIMIT-1);startRecording(capped.p,NOW);assert.throws(()=>deleteOwnRoute(capped.p,'nope'),/bestaat niet/);
});

test('service records an own route only from accepted GPS fixes, keeps it private and lets the creator walk it',async()=>{
 const store=new SqliteStore(':memory:');try{let now=NOW;const api=new GoServiceV2(store,'local',()=>now),uid='route-maker',other='route-other';let view=await api.state(uid);
  const run=async(type:string,extra:Record<string,unknown>={},who=uid)=>{const v=who===uid?view:await api.state(who);const next=await api.command(who,{type,...extra,commandId:randomUUID(),expectedRevision:v.player.revision});if(who===uid)view=next;return next;};
  const at=(meters:number)=>({lat:FIX.lat+meters/M,lng:FIX.lng,accuracy:8,timestamp:now});
  await run('worldLocate',{fix:at(0)});await run('routeRecord',{action:'start'});
  assert.throws(()=>parseGo({type:'routeRecord',action:'stop',points:[FIX],commandId:randomUUID(),expectedRevision:0}),/server/);assert.throws(()=>parseGo({type:'routeSave',name:'x',emoji:'🦋',meters:5000,commandId:randomUUID(),expectedRevision:0}),/server/);
  for(let m=20;m<=300;m+=20){now+=15000;await run('worldLocate',{fix:at(m)});}
  await assert.rejects(()=>run('routeRecord',{action:'stop'}),/500 m/);
  for(let m=320;m<=620;m+=20){now+=15000;await run('worldLocate',{fix:at(m)});}
  await run('routeRecord',{action:'stop'});await run('routeSave',{name:'Schoolpad',emoji:'🌳'});
  const own=view.player.go!.sites!.own!;assert.equal(own.length,1);assert.equal(own[0].name,'Schoolpad');assert.ok(own[0].meters>=500&&own[0].meters<=650);
  const otherView=await run('worldLocate',{fix:at(0)},other);assert.ok(!JSON.stringify(otherView).includes(own[0].id));assert.ok(!JSON.stringify(otherView).includes('Schoolpad'));
  await assert.rejects(()=>run('routeStart',{route:own[0].id},other),/niet beschikbaar/);
  // The creator walks back to the start and runs the route; the run seed stays on the server.
  for(let m=600;m>=0;m-=40){now+=15000;await run('worldLocate',{fix:at(m)});}
  await run('routeStart',{route:own[0].id});assert.equal(view.player.go!.sites!.run!.route.id,own[0].id);assert.equal(view.player.go!.sites!.run!.seed,undefined);
 }finally{store.close();}
});
