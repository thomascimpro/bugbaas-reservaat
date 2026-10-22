import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo} from '../game/goV2';
import {ensureCocoons,startCocoon,cocoonWalked} from '../game/goCocoonsV2';
import {syncAdventure,mergeGPSWalk,gpsWalkMeters} from '../game/adventureSyncV2';
import {startFieldLure,advanceFieldActivities} from '../game/fieldActivitiesV2';
import {startRoute,advanceRoute} from '../game/worldSitesV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
const NOW=Date.UTC(2026,9,22,10),FIX={lat:51.44,lng:5.47,accuracy:5};
const snap=(steps:number,meters:number,now=NOW)=>({dayUTC:new Date(now).toISOString().slice(0,10),capturedAt:now,steps,meters,source:'health-connect'});
function player(){const p=freshV2('health-qa','HLTH1234',NOW);ensureField(p,NOW);ensureGo(p,NOW);ensureCocoons(p,'seed',NOW);p.walking={at:NOW,fix:FIX,spawns:[],caught:[],count:0,day:'2026-10-22'};return p;}
test('first connection starts a baseline; later step-backed distance is bounded, persistent and never counted twice',()=>{
 const p=player();p.field!.walk={meters:1000,dayMeters:1000,anchor:null,at:NOW};assert.equal(syncAdventure(p,snap(10000,7200),NOW),0);assert.equal(p.field!.walk.meters,1000);
 startCocoon(p,p.go!.cocoons!.items[0].id,NOW);const later=NOW+3600000;assert.equal(syncAdventure(p,snap(13000,9200,later),later),2000);assert.equal(cocoonWalked(p),2000);assert.equal(gpsWalkMeters(p),1000);assert.equal(p.field!.walk.dayMeters,3000);
 assert.equal(syncAdventure(p,snap(13000,9200,later),later),0);assert.equal(p.field!.walk.meters,3000);
 // A replayed lower provider total cannot remove or re-award previously credited distance.
 assert.equal(syncAdventure(p,snap(12000,8500,later+1000),later+1000),0);assert.equal(p.field!.walk.meters,3000);
 const next=later+3600000;syncAdventure(p,snap(30000,21000,next),next);assert.equal(p.field!.walk.dayMeters,8000);assert.equal(p.field!.walk.meters,8000);
});
test('GPS and imported activity use a conservative union while GPS-only routes and lures keep their own meters',()=>{
 const p=player();syncAdventure(p,snap(0,0),NOW);startFieldLure(p,'lure','private',NOW);
 const route={id:'route',name:'QA-pad',source:'osm' as const,osmId:'way/1',meters:80,points:[FIX,{...FIX,lat:FIX.lat+.0002},{...FIX,lat:FIX.lat+.0004}]};p.walking!.routes=[route];startRoute(p,'route',NOW);
 const later=NOW+3600000;syncAdventure(p,snap(3000,2000,later),later);assert.equal(p.field!.walk!.meters,2000);assert.equal(gpsWalkMeters(p),0);
 p.walking!.at=later;advanceFieldActivities(p,later);advanceRoute(p,later);assert.equal(p.field!.lure!.spawned,0);assert.equal(p.go!.sites!.run!.meters,0);
 // The same 1km later recorded by GPS adds route distance, without another 1km of cocoon reward.
 p.field!.walk!.meters+=1000;p.field!.walk!.dayMeters+=1000;mergeGPSWalk(p,2000,2000,later);assert.equal(p.field!.walk!.meters,2000);assert.equal(p.field!.walk!.dayMeters,2000);assert.equal(gpsWalkMeters(p),1000);advanceRoute(p,later);assert.equal(p.go!.sites!.run!.meters,1000);
 p.field!.walk!.meters+=1500;p.field!.walk!.dayMeters+=1500;mergeGPSWalk(p,2000,2000,later);assert.equal(p.field!.walk!.meters,2500);assert.equal(gpsWalkMeters(p),2500);
});
test('bad, stale, manual-source, unbacked or impossibly fast health snapshots cannot award distance',()=>{
 for(const bad of [{...snap(100,100),source:'browser'},{...snap(100,100),extra:999},{...snap(100,100),meters:999},{...snap(100,100),steps:1.1},{...snap(100,100),capturedAt:NOW-120001},{...snap(100,100),dayUTC:'2026-10-21'}]){const p=player();assert.throws(()=>syncAdventure(p,bad,NOW));assert.equal(p.field!.walk?.meters??0,0);}
 const p=player();syncAdventure(p,snap(0,0),NOW);assert.throws(()=>syncAdventure(p,snap(5000,3000,NOW+1000),NOW+1000),/te korte tijd/);assert.equal(p.field!.walk!.meters,0);
 assert.equal(syncAdventure(p,snap(40,30,NOW+1000),NOW+1000),30);assert.throws(()=>syncAdventure(p,snap(80,60,NOW+1000),NOW+1000));assert.equal(p.field!.walk!.meters,30);
});
test('UTC day roll keeps lifetime distance, resets the combined day cap and never creates a GPS fix',()=>{
 const p=player();syncAdventure(p,snap(0,0),NOW);syncAdventure(p,snap(3000,2000,NOW+3600000),NOW+3600000);const before=structuredClone(p.walking),next=NOW+86400000;syncAdventure(p,snap(1500,1000,next),next);assert.equal(p.field!.walk!.meters,3000);assert.equal(p.field!.walk!.dayMeters,1000);assert.deepEqual(p.walking,{...before,day:new Date(next).toISOString().slice(0,10)});
});
test('health command receipts protect distance and reject fabricated direct reward fields',async()=>{
 const store=new SqliteStore(':memory:');try{let now=NOW;const api=new GoServiceV2(store,'local',()=>now),uid='health-receipt';let view=await api.state(uid);const command=(snapshot:unknown)=>({type:'adventureSync',snapshot,commandId:randomUUID(),expectedRevision:view.player.revision});view=await api.command(uid,command(snap(0,0)));now+=3600000;const c=command(snap(3000,2000,now));view=await api.command(uid,c);assert.equal(view.player.field!.walk!.meters,2000);view=await api.command(uid,c);assert.equal(view.player.field!.walk!.meters,2000);await assert.rejects(()=>api.command(uid,{...command(snap(3000,2000,now)),reward:50000}));}finally{store.close();}
});
