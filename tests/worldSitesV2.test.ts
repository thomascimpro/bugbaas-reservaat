import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {buildWorldSites} from '../server/worldSitesDataV2';
import {spinPost,startRoute,advanceRoute,pauseRoute,resumeRoute,finishRoute} from '../game/worldSitesV2';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo} from '../game/goV2';
import {GoServiceV2,parseGo} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import {unknownHabitat} from '../game/habitatsV2';
const NOW=Date.UTC(2026,9,20,14),FIX={lat:52.09,lng:5.13,accuracy:8,timestamp:NOW};
const elements=[{type:'way',id:1,tags:{highway:'footway',access:'yes',name:'Bospaadje'},geometry:Array.from({length:15},(_,i)=>({lat:FIX.lat,lon:FIX.lng+i*.0003}))},{type:'node',id:2,tags:{tourism:'information',name:'Natuurbord'},lat:FIX.lat,lon:FIX.lng+.0001},{type:'node',id:3,tags:{tourism:'artwork',access:'private'},lat:FIX.lat,lon:FIX.lng+.0002},{type:'node',id:4,tags:{tourism:'viewpoint'},lat:FIX.lat+.004,lon:FIX.lng+.004}];
const sites=buildWorldSites(elements,FIX,()=>true);
function player(){const p=freshV2('sites','SITES123',NOW);ensureField(p,NOW);ensureGo(p,NOW);p.walking={fix:FIX,at:NOW,seed:'server',spawns:[],caught:[],day:'2026-10-20',count:0,posts:structuredClone(sites.posts),routes:structuredClone(sites.routes)};return p;}
test('world sites come from real tagged objects near allowed footways and never invent private, blocked or off-path posts',()=>{
 assert.equal(sites.posts.length,1);assert.equal(sites.posts[0].osmId,'node/2');assert.equal(sites.posts[0].name,'Natuurbord');assert.ok(sites.routes.length>0);assert.deepEqual(sites.routes[0].points[0],sites.routes[0].points.at(-1));assert.ok(sites.routes[0].meters>=320);
 assert.deepEqual(buildWorldSites(elements,FIX,()=>false),{posts:[],routes:[]});assert.deepEqual(buildWorldSites(elements.map(e=>({...e,tags:{...e.tags,access:'private'}})),FIX,()=>true),{posts:[],routes:[]});
});
test('post supplies are bounded, require fresh nearby GPS and honor a persistent five-minute cooldown',()=>{
 const p=player(),before=p.field!.inventory.basic;const loot=spinPost(p,sites.posts[0].id,'seed',NOW);assert.ok(loot.basic!>=2&&loot.basic!<=4);assert.equal(p.field!.inventory.basic,before+loot.basic!);assert.throws(()=>spinPost(p,sites.posts[0].id,'new-seed',NOW+1),/laadt/);p.walking!.fix={...FIX,lng:FIX.lng+.01};assert.throws(()=>spinPost(p,sites.posts[0].id,'new',NOW),/65 meter/);p.walking!.fix=FIX;assert.throws(()=>spinPost(p,sites.posts[0].id,'new',NOW+31000),/GPS/);assert.throws(()=>spinPost(p,'fabricated','new',NOW),/niet beschikbaar/);
});
test('route rewards require ordered route points AND verified distance; pause excludes distance and claim pays once',()=>{
 const p=player(),r=sites.routes[0];startRoute(p,r.id,NOW);const run=p.go!.sites!.run!;assert.throws(()=>finishRoute(p,NOW),/Volg eerst/);
 for(const point of r.points){p.walking!.fix={...FIX,...point};advanceRoute(p,NOW);}assert.equal(run.status,'active');assert.equal(run.next,1);
 p.field!.walk={meters:50,dayMeters:50,anchor:FIX,at:NOW};pauseRoute(p);p.field!.walk.meters=500;advanceRoute(p,NOW);assert.equal(run.meters,0);resumeRoute(p,NOW);
 for(const point of r.points.slice(1)){p.walking!.fix={...FIX,...point};p.field!.walk.meters+=40;advanceRoute(p,NOW);}assert.equal(run.status,'ready');const dust=p.go!.dust,nets=p.field!.inventory.basic;finishRoute(p,NOW);assert.equal(p.go!.dust,dust+150);assert.equal(p.field!.inventory.basic,nets+5);assert.throws(()=>finishRoute(p,NOW));assert.throws(()=>startRoute(p,r.id,NOW),/vandaag/);
});
test('post command receipts prevent duplicate supplies under retries and reject caller-defined loot or positions',async()=>{
 const store=new SqliteStore(':memory:');try{const api=new GoServiceV2(store,'local',()=>NOW,async()=>({...unknownHabitat(NOW),sites}));let view=await api.state('site-api');view=await api.command('site-api',{type:'worldLocate',fix:FIX,commandId:randomUUID(),expectedRevision:view.player.revision});const command={type:'poiSpin',poi:sites.posts[0].id,commandId:randomUUID(),expectedRevision:view.player.revision};view=await api.command('site-api',command);const inventory=structuredClone(view.player.field!.inventory);view=await api.command('site-api',command);assert.deepEqual(view.player.field!.inventory,inventory);for(const extra of [{loot:{basic:9999}},{lat:FIX.lat},{reward:10000}])assert.throws(()=>parseGo({...command,...extra}));}finally{store.close();}
});
