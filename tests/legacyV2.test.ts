import {test} from 'node:test';
import assert from 'node:assert/strict';
import {eligibleLegacy,type AccountIdentity,type LegacyAccount} from '../server/legacyV2';
import {legacyReward,LEGACY_CUTOFF} from '../game/legacyV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {GameService} from '../server/service';
import {apiHandler} from '../server/http';
import {unknownHabitat} from '../game/habitatsV2';

const identity:AccountIdentity={uid:'new-uid',linked:true,email:'trainer@example.test',emailVerified:true,googleId:'google-owner'};
const old:LegacyAccount={uid:'different-old-uid',email:'Trainer@example.test',emailVerified:true,disabled:false,createdAt:LEGACY_CUTOFF-86400000,googleId:'google-owner',profile:{bugDexCount:80,movementKmTotal:60}};

test('legacy account matches verified ownership across different Firebase UIDs',()=>{
 const offer=eligibleLegacy(identity,old)!;assert.ok(offer);assert.match(offer.key,/^[a-f0-9]{64}$/);assert.equal(offer.dust,3000);assert.equal(offer.nets,20);assert.equal(offer.badge,'legacy');
});
test('legacy rejects unverified, mismatched, disabled, new and test accounts',()=>{
 for(const account of [{...old,email:'other@example.test'},{...old,googleId:'other-owner'},{...old,emailVerified:false},{...old,disabled:true},{...old,createdAt:LEGACY_CUTOFF},{...old,profile:{testAccount:true}},{...old,profile:{active:false}}])assert.equal(eligibleLegacy(identity,account),null);
 assert.equal(eligibleLegacy({...identity,linked:false},old),null);assert.equal(eligibleLegacy({...identity,emailVerified:false},old),null);
});
test('verified password account can be recognised; a Google account requires the same Google owner',()=>{
 assert.ok(eligibleLegacy({...identity,googleId:undefined},{...old,googleId:undefined}));assert.equal(eligibleLegacy({...identity,googleId:undefined},old),null);
});
test('old counters are capped and cannot import rating, CP or unlimited currency',()=>{
 const reward=legacyReward('a'.repeat(64),1,{bugDexCount:1e12,movementKmTotal:1e12,duelRating:999999,totalPoints:1e20});
 assert.equal(reward.dust,3000);assert.equal(reward.nets,20);assert.equal(reward.fastTMs+reward.chargedTMs,2);assert.equal('rating' in reward,false);
 assert.equal(legacyReward('a'.repeat(64),1,{bugDexCount:NaN,movementKmTotal:Infinity}).dust,1000);
});
test('legacy claim retry grants once and preserves the existing collection and rating',async()=>{
 const store=new SqliteStore(':memory:'),service=new GoServiceV2(store,'local'),offer=eligibleLegacy(identity,old)!;
 try{const before=(await service.state(identity.uid)).player;const a=await service.grantLegacy(identity.uid,offer),b=await service.grantLegacy(identity.uid,offer);
  assert.equal(b.player.go!.dust,before.go!.dust+offer.dust);assert.equal(a.player.revision,b.player.revision);assert.deepEqual(b.player.specimens,before.specimens);assert.equal(b.player.go!.rating,before.go!.rating);assert.equal(b.player.field!.inventory.basic,before.field!.inventory.basic+offer.nets);
  await assert.rejects(()=>service.grantLegacy('another-new-uid',offer),/ander gekoppeld account/);
  const seen=await service.command(identity.uid,{type:'legacySeen',commandId:randomUUID(),expectedRevision:b.player.revision});assert.ok(seen.player.legacy!.acknowledgedAt);
 }finally{store.close();}
});
test('concurrent accounts cannot both claim one old account',async()=>{
 const store=new SqliteStore(':memory:'),service=new GoServiceV2(store,'local'),offer=eligibleLegacy(identity,old)!;
 try{const results=await Promise.allSettled([service.grantLegacy('one',offer),service.grantLegacy('two',offer)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);}finally{store.close();}
});

test('legacy HTTP accepts only a verified server offer, recovers a repeat and rejects forged rewards',async()=>{
 const store=new SqliteStore(':memory:'),service=new GameService(store,'local'),offer=eligibleLegacy(identity,old)!;
 const handler=apiHandler(service,async token=>token==='guest'?{uid:'guest',linked:false}:identity,async(_fix,now)=>unknownHabitat(now),async()=>({configured:true,offer}));
 const server=createServer(handler);await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+(server.address() as {port:number}).port;
 const post=(body:unknown,token='verified')=>fetch(base+'/api/game/v2/legacy',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});
 try{
  assert.equal((await post({claim:true,dust:999999})).status,400);assert.equal((await post({claim:true},'guest')).status,403);
  const preview=await (await post({})).json();assert.equal(preview.offer.dust,3000);
  const a=await (await post({claim:true})).json(),b=await (await post({claim:true})).json();assert.equal(a.view.player.revision,b.view.player.revision);assert.equal(a.view.player.go.dust,b.view.player.go.dust);assert.ok(a.view.player.legacy.grantedAt);
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));store.close();}
});
