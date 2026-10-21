import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2} from '../server/goServiceV2';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,rollGoBug} from '../game/goV2';
import {collectionSearch} from '../game/collectionSearchV2';
import type {PlayerV2,FriendPair,GameViewV2} from '../game/typesV2';
const NOW=Date.UTC(2026,9,21,12);
function player(uid:string){const p=freshV2(uid,uid==='a'?'AAAAAAAB':'BBBBBBBA',NOW);ensureField(p,NOW);ensureGo(p,NOW);p.name='Ranger '+uid;p.onboarded=true;p.buddy='';
 p.specimens=['ant','beetle','moth'].map((species,i)=>({id:uid+'-bug-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:15}}));p.buddy=uid+'-bug-2';p.go!.team=[];p.go!.candy={ant:100,beetle:100,moth:100};p.go!.dust=5000;p.go!.dex=['ant','beetle','moth'];p.walking={fix:{lat:51,lng:5+(uid==='a'?0:.0001),accuracy:5,timestamp:NOW},at:NOW,seed:'private-'+uid,spawns:[],caught:[],count:0,day:'2026-10-21'};return p;}
async function setup(){const store=new SqliteStore(':memory:'),service=new GoServiceV2(store,'local',()=>NOW),pair:FriendPair={id:'a_b',users:['a','b'],names:['Ranger a','Ranger b'],accepted:true,requestedBy:'a',points:90,lastDay:'',gifts:[null,null]};await store.run(['v2Players:a','v2Players:b','v2FriendPairs:a_b'],d=>{d.set('v2Players:a',player('a'));d.set('v2Players:b',player('b'));d.set('v2FriendPairs:a_b',pair);});
 const send=async(uid:string,type:string,data:Record<string,unknown>={})=>{const v=await service.state(uid);return service.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});};
 const offers=async()=>{await send('a','tradeStart',{pair:'a_b'});await send('a','tradeOffer',{pair:'a_b',id:'a-bug-0',tradeRevision:0});return send('b','tradeOffer',{pair:'a_b',id:'b-bug-1',tradeRevision:1});};return {store,service,send,offers};}
test('server nickname changes preserve specimen and resources, support search/exclusion, and replay safely',async()=>{const {store,service,send}=await setup();try{
 const v=await service.state('a'),original=structuredClone(v.player.specimens[0]),wallet=structuredClone(v.player.go),command={type:'goRename',id:original.id,name:"  Élan-2 O'Neil  ",commandId:randomUUID(),expectedRevision:v.player.revision};
 const renamed=await service.command('a',command),s=renamed.player.specimens[0];assert.equal(s.nickname,"Élan-2 O'Neil");assert.deepEqual({...s,nickname:undefined},{...original,nickname:undefined});assert.deepEqual(renamed.player.go,wallet);assert.ok(collectionSearch('élan',{buddy:'',team:[]})(s));assert.ok(!collectionSearch('!élan',{buddy:'',team:[]})(s));assert.deepEqual((await service.command('a',command)).player,renamed.player);
 for(const name of ['x'.repeat(19),'Oeps😃','a\nb','<script>'])await assert.rejects(()=>send('a','goRename',{id:s.id,name}));await assert.rejects(()=>send('a','goRename',{id:'b-bug-0',name:'gestolen'}));assert.equal((await send('a','goRename',{id:s.id,name:'  '})).player.specimens[0].nickname,undefined);
 }finally{store.close();}});
test('service commits both owners, costs, rerolled identities and journal once after two confirmations',async()=>{const {store,service,send,offers}=await setup();try{
 const ready=await offers(),trade=ready.goTrades![0];assert.equal(trade.revision,2);assert.ok(!JSON.stringify(ready).includes('private-'));assert.equal(trade.seed,undefined);const a=await send('a','tradeConfirm',{pair:'a_b',tradeRevision:2,special:false});assert.equal(a.goTrades![0].accepted[0],true);assert.equal(a.player.go!.dust,5000);assert.equal(a.player.go!.journal!.length,0);
 const b=await service.state('b'),command={type:'tradeConfirm',pair:'a_b',tradeRevision:2,special:false,commandId:randomUUID(),expectedRevision:b.player.revision};const done=await service.command('b',command),other=await service.state('a');assert.equal(done.goTrades![0].status,'completed');
 for(const [v,incoming] of [[other,'b-bug-1'],[done,'a-bug-0']] as [GameViewV2,string][]){assert.equal(v.player.go!.dust,4900);assert.equal(v.player.go!.trades!.count,1);assert.equal(v.player.specimens.filter(s=>s.id===incoming).length,1);assert.equal(v.player.go!.journal!.length,1);assert.equal(v.player.go!.journal![0].kind,'trade');assert.equal(v.player.go!.journal![0].specimenId,incoming);assert.ok(v.player.specimens.find(s=>s.id===incoming)!.go!.traded);}
 assert.deepEqual((await service.command('b',command)).player,done.player);assert.deepEqual((await service.state('a')).player,other.player);await assert.rejects(()=>service.command('b',{...command,special:true}),/actie-ID/);
 await send('a','tradeStart',{pair:'a_b'});await assert.rejects(()=>send('a','tradeOffer',{pair:'a_b',tradeRevision:0,id:'b-bug-1'}),/al geruild/);assert.equal((await service.state('a')).player.go!.dust,4900);
 }finally{store.close();}});
test('changed offers and build changes cannot consume an old consent or partly swap owners',async()=>{const {store,service,send,offers}=await setup();try{
 await offers();await send('a','tradeConfirm',{pair:'a_b',tradeRevision:2,special:false});await send('a','goPower',{id:'a-bug-0'});const before=await service.state('a');await assert.rejects(()=>send('b','tradeConfirm',{pair:'a_b',tradeRevision:2,special:false}),/veranderd/);assert.deepEqual((await service.state('a')).player,before.player);assert.equal((await service.state('b')).player.go!.dust,5000);
 await send('a','tradeOffer',{pair:'a_b',id:'a-bug-0',tradeRevision:2});const trade=(await service.state('a')).goTrades![0];assert.deepEqual(trade.accepted,[false,false]);await assert.rejects(()=>send('b','tradeConfirm',{pair:'a_b',tradeRevision:2,special:false}),/aanbod is veranderd/);
 }finally{store.close();}});
test('server rejects unlinked cloud trades, nonfriends, distance and stale GPS before swapping',async()=>{const {store,service,send}=await setup();try{
 const cloud=new GoServiceV2(store,'cloud',()=>NOW),v=await cloud.state('a');await assert.rejects(()=>cloud.command('a',{type:'tradeStart',pair:'a_b',commandId:randomUUID(),expectedRevision:v.player.revision}),/Koppel/);
 await assert.rejects(()=>send('a','tradeStart',{pair:'a_c'}),/vriendschap/);await store.run(['v2Players:b'],d=>{(d.get('v2Players:b') as PlayerV2).walking!.fix.lng=6;});await assert.rejects(()=>send('a','tradeStart',{pair:'a_b'}),/100 meter/);await store.run(['v2Players:b'],d=>{const p=d.get('v2Players:b') as PlayerV2;p.walking!.fix.lng=5;p.walking!.fix.timestamp=NOW-60000;});await assert.rejects(()=>send('a','tradeStart',{pair:'a_b'}),/GPS/);assert.equal((await service.state('a')).player.go!.dust,5000);
 }finally{store.close();}});
test('confirmed build, cocoon and battle events persist without backfill or duplicate journal rewards',async()=>{const {store,service,send}=await setup();try{
 assert.deepEqual((await service.state('a')).player.go!.journal,[]);await send('a','goPower',{id:'a-bug-0'});let v=await service.state('a');assert.equal(v.player.go!.journal![0].kind,'power');
 await send('a','cocoonStart',{id:v.player.go!.cocoons!.items[0].id});await store.run(['v2Players:a'],d=>{(d.get('v2Players:a') as PlayerV2).field!.walk={meters:2000,dayMeters:2000,anchor:null,at:NOW};});v=await send('a','cocoonClaim');assert.equal(v.player.go!.journal![0].kind,'hatch');assert.equal(v.player.go!.journal![0].specimenId,v.player.go!.cocoons!.lastHatch!.id);
 await send('a','goTeam',{ids:['a-bug-0','a-bug-1','a-bug-2'],league:'great'});await send('a','goTrain');v=await send('a','goAct',{action:'forfeit',value:null});assert.equal(v.player.go!.journal![0].kind,'battle');assert.equal(v.player.go!.journal![0].result,'loss');const prior=structuredClone(v.player.go!.journal!);assert.deepEqual((await service.state('a')).player.go!.journal,prior);assert.equal(prior.length,3);
 }finally{store.close();}});
