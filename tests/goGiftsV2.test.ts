import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {awardGoCatchCard,friendshipProgress,GO_GIFT_REWARD,openGoGift,sendGoGift} from '../game/goGiftsV2';
import {rng} from '../game/catalogV2';
import {catchChance,ensureField} from '../game/fieldV2';
import {awardGoCatch,ensureGo} from '../game/goV2';
import {dayV2,freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import type {FriendPair,PlayerV2,Specimen} from '../game/typesV2';
import {GoServiceV2,parseGo} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';

const NOW=Date.UTC(2026,9,20,14),FIX={lat:52.0928,lng:5.1339,accuracy:8,timestamp:NOW};
function player(uid='a'){const p=freshV2(uid,uid==='a'?'TEST1234':'TEST5678',NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);return p;}
function bug(now=NOW):Specimen{return {id:'real-catch',species:'ant',level:1,shiny:false,favorite:false,obtainedAt:now,source:'walking',hearts:0,item:null};}
function pair():FriendPair{return {id:'a_b',users:['a','b'],names:['A','B'],accepted:true,requestedBy:'a',points:0,lastDay:'',gifts:[null,null]};}

test('only the first actual daily catch earns one location-free card, preserving existing cards and the ten-card cap',()=>{
 const p=player(),s=bug();awardGoCatch(p,s,'catch');p.field!.daily.catches=1;p.cards=[{id:'old-card',habitat:3}];
 assert.equal(awardGoCatchCard(p,s,'capture-id',NOW),true);assert.deepEqual(p.cards[0],{id:'old-card',habitat:3});assert.deepEqual(Object.keys(p.cards[1]).sort(),['habitat','id']);assert.equal(p.giftDay,dayV2(NOW));
 assert.equal(awardGoCatchCard(p,s,'retry',NOW),false);p.field!.daily.catches=2;assert.equal(awardGoCatchCard(p,s,'later',NOW),false);assert.equal(p.cards.length,2);
 const full=player();full.cards=Array.from({length:10},(_,i)=>({id:'old-'+i,habitat:i%4}));full.field!.daily.catches=1;assert.equal(awardGoCatchCard(full,s,'full',NOW),false);assert.equal(full.cards.length,10);full.cards.pop();assert.equal(awardGoCatchCard(full,s,'freed',NOW),false);
 const next=NOW+86400000;ensureField(p,next);p.field!.daily.catches=1;const tomorrow=bug(next);awardGoCatch(p,tomorrow,'tomorrow');assert.equal(awardGoCatchCard(p,tomorrow,'tomorrow',next),true);
 for(const source of ['starter','training','legacy']){const q=player();q.field!.daily.catches=1;assert.equal(awardGoCatchCard(q,{...s,source},source,NOW),false);assert.deepEqual(q.cards,[]);}
 const q=player();assert.equal(awardGoCatchCard(q,s,'login',NOW),false);q.field!.daily.catches=2;assert.equal(awardGoCatchCard(q,s,'not-first',NOW),false);
});

test('gift opening rewards current GO inventory once and one friendship point per pair/day',()=>{
 const a=player(),b=player('b'),f=pair();a.cards=[{id:'a-card',habitat:0}];b.cards=[{id:'b-card',habitat:2}];const before={dust:b.go!.dust,nets:b.field!.inventory.basic,pollen:b.field!.inventory.pollen,legacy:b.nectar};
 sendGoGift(a,f,'a-card','gift-a',NOW);assert.equal(a.cards.length,0);assert.throws(()=>openGoGift(a,f,NOW),/Geen ongeopend/);openGoGift(b,f,NOW);
 assert.equal(b.go!.dust,before.dust+GO_GIFT_REWARD.dust);assert.equal(b.field!.inventory.basic,before.nets+5);assert.equal(b.field!.inventory.pollen,before.pollen+1);assert.equal(b.nectar,before.legacy);assert.deepEqual(b.album,[0]);assert.equal(f.points,1);
 assert.throws(()=>openGoGift(b,f,NOW),/Geen ongeopend/);sendGoGift(b,f,'b-card','gift-b',NOW);openGoGift(a,f,NOW);assert.equal(f.points,1);assert.deepEqual(a.album,[2]);
 a.cards=[{id:'next',habitat:0}];assert.throws(()=>sendGoGift(a,f,'next','same-day',NOW),/Vandaag/);sendGoGift(a,f,'next','next-day',NOW+86400000);assert.throws(()=>sendGoGift(a,f,'missing','missing',NOW+172800000),/kaart/);openGoGift(b,f,NOW+86400000);assert.equal(f.points,2);assert.deepEqual(b.album,[0]);
});

test('gift helpers reject strangers, self-pairs, pending/removed friends, fabricated cards and unread replacements',()=>{
 const a=player(),f=pair();a.cards=[{id:'card',habitat:0}];
 for(const invalid of [undefined,{...f,accepted:false},{...f,removed:true},{...f,users:['b','c'] as [string,string]},{...f,users:['a','a'] as [string,string]}]){assert.throws(()=>sendGoGift(a,invalid,'card','gift',NOW));assert.throws(()=>openGoGift(a,invalid,NOW));}
 assert.throws(()=>sendGoGift(a,f,'fake','gift',NOW),/kaart/);assert.equal(a.cards.length,1);sendGoGift(a,f,'card','gift',NOW);a.cards.push({id:'next',habitat:2});assert.throws(()=>sendGoGift(a,f,'next','later',NOW+86400000),/ongeopend/);assert.equal(a.cards.length,1);
});

test('friendship milestones expose four hearts and progress at 1, 7, 30 and 90 points',()=>{
 for(const [points,level,next] of [[0,0,1],[1,1,7],[6,1,7],[7,2,30],[29,2,30],[30,3,90],[89,3,90],[90,4,null],[120,4,null]]){const p=friendshipProgress(points!);assert.equal(p.level,level);assert.equal(p.next,next);assert.ok(p.progress>=0&&p.progress<=1);}
 assert.equal(friendshipProgress(6).remaining,1);assert.equal(friendshipProgress(90).progress,1);
});

test('GO gift commands retain atomic receipts and friendship/gift history across remove and re-add',async()=>{
 const store=new SqliteStore(':memory:');try{
  let now=NOW;const api=new GoServiceV2(store,'local',()=>now);const a=player(),b=player('b');a.cards=[{id:'a-card',habitat:0},{id:'a-extra',habitat:1}];b.cards=[{id:'b-card',habitat:2}];
  await store.run(['v2Players:a','v2Players:b'],d=>{d.set('v2Players:a',a);d.set('v2Players:b',b);});
  const cmd=async(uid:string,type:string,data:Record<string,unknown>={})=>{const v=await api.state(uid);return api.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});};
  await api.state('b');await assert.rejects(()=>cmd('a','giftSend',{pair:'a_b',card:'a-card'}));await cmd('a','friendRequest',{code:b.friendCode});await assert.rejects(()=>cmd('a','giftSend',{pair:'a_b',card:'a-card'}));await cmd('b','friendAccept',{pair:'a_b'});
  const v=await api.state('a'),send={type:'giftSend',pair:'a_b',card:'a-card',commandId:randomUUID(),expectedRevision:v.player.revision};await api.command('a',send);await api.command('a',send);assert.equal((await api.state('a')).player.cards.length,1);
  await assert.rejects(()=>cmd('a','giftOpen',{pair:'a_b'}));await assert.rejects(()=>cmd('c','giftOpen',{pair:'a_b'}));
  const receiver=await api.state('b'),open={type:'giftOpen',pair:'a_b',commandId:randomUUID(),expectedRevision:receiver.player.revision};const opened=await api.command('b',open),retried=await api.command('b',open);assert.deepEqual(opened.player.field!.inventory,retried.player.field!.inventory);assert.equal(retried.player.go!.dust,100);await assert.rejects(()=>cmd('b','giftOpen',{pair:'a_b'}));
  await cmd('b','giftSend',{pair:'a_b',card:'b-card'});await cmd('a','giftOpen',{pair:'a_b'});assert.equal((await api.state('a')).friends[0].points,1);
  await cmd('a','friendRemove',{pair:'a_b'});await cmd('a','friendRequest',{code:b.friendCode});await cmd('b','friendAccept',{pair:'a_b'});const restored=(await api.state('a')).friends[0];assert.equal(restored.points,1);assert.equal(restored.lastDay,dayV2(now));assert.equal(restored.gifts[0]!.opened,true);await assert.rejects(()=>cmd('a','giftSend',{pair:'a_b',card:'a-extra'}),/Vandaag/);
  now+=86400000;await cmd('a','giftSend',{pair:'a_b',card:'a-extra'});await cmd('b','friendRemove',{pair:'a_b'});await cmd('b','friendRequest',{code:a.friendCode});await cmd('a','friendAccept',{pair:'a_b'});assert.equal((await api.state('b')).friends[0].gifts[0]!.opened,false);await cmd('b','giftOpen',{pair:'a_b'});assert.equal((await api.state('b')).friends[0].points,2);assert.equal((await api.state('b')).player.go!.dust,200);
  for(const extra of [{reward:9999},{habitat:3},{from:'b'},{lat:FIX.lat}])assert.throws(()=>parseGo({...send,...extra}));
 }finally{store.close();}
});

test('a real server catch creates one card and retrying the capture never creates another',async()=>{
 const store=new SqliteStore(':memory:');try{let now=NOW;const api=new GoServiceV2(store,'local',()=>now);let v=await api.state('catch');assert.deepEqual(v.player.cards,[]);v=await api.command('catch',{type:'worldLocate',fix:FIX,commandId:randomUUID(),expectedRevision:v.player.revision});assert.deepEqual(v.player.cards,[]);v=await api.command('catch',{type:'worldEncounter',spawn:v.player.walking!.spawns[0].id,commandId:randomUUID(),expectedRevision:v.player.revision});await store.run(['v2Players:catch'],d=>{(d.get('v2Players:catch') as PlayerV2).field!.inventory.royal=1;});now+=2500;
  const command={type:'worldCast',encounter:v.player.field!.encounter!.id,net:'royal',bait:null,trace:[{x:.5,y:1,t:0},{x:.5,y:.42,t:1150}],commandId:randomUUID(),expectedRevision:v.player.revision};const caught=await api.command('catch',command),retry=await api.command('catch',command);assert.equal(caught.player.field!.lastCast!.outcome,'caught');assert.equal(caught.player.cards.length,1);assert.deepEqual(caught.player.cards,retry.player.cards);assert.equal(caught.player.giftDay,dayV2(now));
 }finally{store.close();}
});

test('the automatic catch success path awards the same first-catch card without a login or training grant',()=>{
 const store=new SqliteStore(':memory:');try{const api=new GoServiceV2(store,'local',()=>NOW),p=player(),fix={...FIX,lat:FIX.lat+.0002};p.walking={fix,at:NOW,seed:'auto-seed',spawns:[{id:'auto-bug',species:'ant',lat:fix.lat,lng:fix.lng,expiresAt:NOW+900000}],caught:[],day:dayV2(NOW),count:0};p.go!.dex=['ant'];p.go!.auto.enabled=true;p.go!.auto.moving=1;p.go!.auto.lastAt=0;p.go!.motion={fix:FIX,at:NOW-15000};let secret='';for(let i=0;i<100;i++){if(rng('auto-'+i+':auto')()<catchChance('ant','basic',null)){secret='auto-'+i;break;}}assert.ok(secret);
  (api as unknown as {auto:(p:PlayerV2,now:number,secret:string)=>void}).auto(p,NOW,secret);assert.equal(p.go!.auto.last!.caught,true);assert.equal(p.field!.daily.catches,1);assert.equal(p.cards.length,1);assert.equal(p.giftDay,dayV2(NOW));
 }finally{store.close();}
});
