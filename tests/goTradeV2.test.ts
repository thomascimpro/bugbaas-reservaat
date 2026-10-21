import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureGo,rollGoBug,stats,equipGo} from '../game/goV2';
import {locate} from '../game/walkingV2';
import {cancelGoTrade,confirmGoTrade,GO_TRADE,offerGoTrade,publicGoTrade,startGoTrade,tradeBugIssue} from '../game/goTradeV2';
import type {FriendPair,PlayerV2} from '../game/typesV2';
const NOW=Date.UTC(2026,9,21,12);
function setup(shiny=false){
 const players=['a','b'].map((uid,i)=>{const p=freshV2(uid,'ABCDEFG'+i,NOW);ensureGo(p,NOW);p.name='Ranger '+uid;p.specimens=[{id:'bug-'+uid,species:i?'moth':'ant',level:1,shiny:shiny&&i===0,favorite:false,obtainedAt:NOW-1000,source:'walking',hearts:4,item:null,go:{...rollGoBug(i?'moth':'ant','bug-'+uid),charged:['cut','buzz'] as ['cut','buzz'],level:15,iv:[15,15,15] as [number,number,number]}}];p.buddy='';p.go!.team=[];p.go!.dust=5000;p.go!.dex=['ant','moth'];p.go!.items.thorn=1;locate(p,{lat:51,lng:5+i*.0001,accuracy:5,timestamp:NOW},'private-location-seed',NOW);return p;}) as [PlayerV2,PlayerV2];
 const pair:FriendPair={id:'a_b',users:['a','b'],names:['Ranger a','Ranger b'],accepted:true,requestedBy:'a',points:90,lastDay:'',gifts:[null,null]};
 const trade=startGoTrade(players,pair,'trade-id','server-only-seed',NOW);
 const offer=()=>{offerGoTrade(trade,players,pair,'a','bug-a',trade.revision,NOW);offerGoTrade(trade,players,pair,'b','bug-b',trade.revision,NOW);};
 const confirm=(uid:string,special=false,now=NOW)=>confirmGoTrade(trade,players,pair,uid,trade.revision,special,now);
 return {players,pair,trade,offer,confirm};
}
test('two explicit confirmations swap once, reroll privately, preserve builds and retain item ownership',()=>{
 const {players,pair,trade,offer,confirm}=setup();equipGo(players[0],'bug-a','thorn');const before=structuredClone(players);offer();assert.equal(trade.terms!.dust,100);assert.equal(confirm('a'),false);assert.deepEqual(players,before);
 assert.equal(confirm('b'),true);assert.equal(trade.status,'completed');assert.equal(trade.seed,undefined);
 for(let i=0;i<2;i++){const p=players[i],received=p.specimens[0],original=before[1-i].specimens[0];assert.equal(received.id,original.id);assert.equal(received.species,original.species);assert.equal(received.shiny,original.shiny);assert.equal(received.go!.level,15);assert.deepEqual(received.go!.charged,original.go!.charged);assert.equal(received.go!.fast,original.go!.fast);assert.equal(received.go!.item,null);assert.ok(received.go!.iv.every(n=>n>=5&&n<=15));assert.equal(received.go!.traded!.id,trade.id);assert.equal(p.go!.dust,4900);assert.equal(p.go!.trades!.count,1);assert.equal(p.go!.items.thorn,1);assert.equal(trade.offers[1-i]!.cp,stats(received).cp);assert.match(tradeBugIssue(p,received)!,/al geruild/);}
 const after=structuredClone(players);assert.throws(()=>confirm('b'),/afgelopen/);assert.deepEqual(players,after);assert.equal(pair.points,90);
});
test('changing an offer clears both confirmations and stale revision cannot confirm',()=>{
 const {players,pair,trade,offer,confirm}=setup();offer();confirm('a');const stale=trade.revision;
 offerGoTrade(trade,players,pair,'b','bug-b',trade.revision,NOW);assert.deepEqual(trade.accepted,[false,false]);assert.throws(()=>confirmGoTrade(trade,players,pair,'a',stale,false,NOW),/veranderd/);assert.equal(confirm('b'),false);assert.equal(confirm('a'),true);
});
test('special trades require both explicit confirmations and enforce a persistent per-player daily limit',()=>{
 const {players,pair,trade,offer,confirm}=setup(true);offer();assert.deepEqual(trade.terms,{special:true,dust:1000});assert.throws(()=>confirm('a'),/speciale/);assert.equal(confirm('a',true),false);assert.throws(()=>confirm('b'),/speciale/);assert.equal(confirm('b',true),true);assert.equal(players[0].go!.dust,4000);assert.equal(players[1].go!.dust,4000);
 // Removing and re-adding a friendship cannot reset the counter kept on each player.
 const next=startGoTrade(players,{...pair,points:0},'next','fresh-secret',NOW);for(let i=0;i<2;i++){const bug={...structuredClone(players[i].specimens[0]),id:'new-'+i};delete bug.go!.traded;bug.shiny=true;players[i].specimens.push(bug);offerGoTrade(next,players,pair,players[i].uid,bug.id,next.revision,NOW);}
 assert.throws(()=>confirmGoTrade(next,players,pair,'a',next.revision,true,NOW),/speciale ruil al gebruikt/);
});
test('new species counts as a special trade; no catch rewards are granted',()=>{
 const {players,trade,offer,confirm}=setup();players[0].go!.dex=['ant'];const xp=players.map(p=>p.go!.trainer!.xp),candy=players.map(p=>structuredClone(p.go!.candy));offer();assert.equal(trade.terms!.special,true);confirm('a',true);confirm('b',true);assert.ok(players[0].go!.dex!.includes('moth'));assert.ok(players[0].discovered.includes('moth'));assert.equal(players[0].go!.entries!.moth.caughtAt,NOW);assert.deepEqual(players.map(p=>p.go!.trainer!.xp),xp);assert.deepEqual(players.map(p=>p.go!.candy),candy);
});
test('protected, previously traded and non-owned specimens cannot be offered',()=>{
 for(const protection of ['team','buddy','favorite','traded']){const {players,pair,trade}=setup(),p=players[0],b=p.specimens[0];if(protection==='team')p.go!.team=[b.id];if(protection==='buddy')p.buddy=b.id;if(protection==='favorite')b.favorite=true;if(protection==='traded')b.go!.traded={id:'old',at:NOW-5,from:'other'};assert.throws(()=>offerGoTrade(trade,players,pair,'a',b.id,0,NOW));}
 const {players,pair,trade}=setup();assert.throws(()=>offerGoTrade(trade,players,pair,'a','bug-b',0,NOW),/zelfgevangen/);assert.throws(()=>offerGoTrade(trade,players,pair,'outsider','bug-a',0,NOW),/niet van jou/);
});
test('fresh accurate GPS and proximity are required on both confirmations',()=>{
 for(const fault of ['old','far','accuracy','blocked']){const {players,offer,confirm}=setup();offer();confirm('a');const b=players[1];if(fault==='old')b.walking!.at=NOW-30000;if(fault==='far')b.walking!.fix.lng+=.01;if(fault==='accuracy')b.walking!.fix.accuracy=36;if(fault==='blocked')b.walking!.blockedUntil=NOW+1;const before=structuredClone(players);assert.throws(()=>confirm('b'));assert.deepEqual(players,before);}
});
test('changed specimen, removed friendship, battle, daily cap and insufficient dust never partially swap',()=>{
 for(const fault of ['bug','friend','battle','queue','cap','dust']){const {players,pair,trade,offer,confirm}=setup();offer();confirm('a');if(fault==='bug')players[0].specimens[0].go!.level++;if(fault==='friend')pair.removed=true;if(fault==='battle')players[1].go!.battle='active';if(fault==='queue')players[1].go!.queue={league:'great',at:NOW,until:NOW+1000};if(fault==='cap')players[1].go!.trades={day:'2026-10-21',count:20};if(fault==='dust')players[1].go!.dust=99;const before=structuredClone(players);assert.throws(()=>confirm('b'));assert.deepEqual(players,before);assert.equal(trade.status,'offering');}
});
test('cancel and timeout leave original ownership and dust; no private seeds are published',()=>{
 const {players,trade,offer,confirm}=setup();offer();confirm('a');const before=structuredClone(players),visible=publicGoTrade(trade,NOW);assert.ok(!JSON.stringify(visible).includes('server-only-seed'));assert.ok(!JSON.stringify(visible).includes('private-location-seed'));assert.equal(visible.seed,undefined);assert.throws(()=>confirm('b',false,NOW+GO_TRADE.duration),/afgelopen/);assert.deepEqual(players,before);cancelGoTrade(trade,'b',trade.revision,NOW+GO_TRADE.duration);assert.equal(trade.status,'cancelled');assert.deepEqual(players,before);assert.equal(trade.seed,undefined);
});
test('same server seed yields one deterministic fair roll, without accepting client IV choices',()=>{
 const one=setup(),two=setup();for(const fixture of [one,two]){fixture.offer();fixture.confirm('a');fixture.confirm('b');}assert.deepEqual(one.players,two.players);
});
