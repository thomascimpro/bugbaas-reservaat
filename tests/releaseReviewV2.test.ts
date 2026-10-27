import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureGo,rollGoBug} from '../game/goV2';
import {locate,SPAWN_LIFETIME} from '../game/walkingV2';
import {confirmGoTrade,offerGoTrade,startGoTrade} from '../game/goTradeV2';
import type {FriendPair,PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,9,27,12);

test('traded bugs never carry the original catcher GPS spot, in the offer or after the swap',()=>{
 const players=['a','b'].map((uid,i)=>{const p=freshV2(uid,'ABCDEFG'+i,NOW);ensureGo(p,NOW);p.name='Ranger '+uid;p.specimens=[{id:'bug-'+uid,species:i?'moth':'ant',level:1,shiny:false,favorite:false,obtainedAt:NOW-1000,source:'walking',hearts:4,item:null,catchLocation:{lat:51.12345,lng:5.12345},go:{...rollGoBug(i?'moth':'ant','bug-'+uid),charged:['cut','buzz'] as ['cut','buzz'],level:15,iv:[15,15,15] as [number,number,number]}}];p.buddy='';p.go!.team=[];p.go!.dust=5000;p.go!.dex=['ant','moth'];locate(p,{lat:51,lng:5+i*.0001,accuracy:5,timestamp:NOW},'private-location-seed',NOW);return p;}) as [PlayerV2,PlayerV2];
 const pair:FriendPair={id:'a_b',users:['a','b'],names:['Ranger a','Ranger b'],accepted:true,requestedBy:'a',points:90,lastDay:'',gifts:[null,null]};
 const trade=startGoTrade(players,pair,'trade-id','server-only-seed',NOW);
 offerGoTrade(trade,players,pair,'a','bug-a',trade.revision,NOW);offerGoTrade(trade,players,pair,'b','bug-b',trade.revision,NOW);
 for(const offer of trade.offers)assert.equal(offer!.bug.catchLocation,undefined,'a friend must not see the catch spot in the offer');
 confirmGoTrade(trade,players,pair,'a',trade.revision,false,NOW);confirmGoTrade(trade,players,pair,'b',trade.revision,false,NOW);
 assert.equal(trade.status,'completed');
 const received=[players[0].specimens.find(s=>s.id==='bug-b'),players[1].specimens.find(s=>s.id==='bug-a')];
 for(const bug of received){assert.ok(bug,'both bugs were swapped');assert.equal(bug!.catchLocation,undefined);}
});

test('an unexpired bonus boss does not freeze wild spawns after they expire',()=>{
 const p=freshV2('walker','WALKER1',NOW);ensureAdventure(p,NOW);const fix={lat:51.4416,lng:5.4697,accuracy:5};
 locate(p,{...fix,timestamp:NOW},'seed',NOW);const w=p.walking!,first=w.spawns.map(s=>s.id);assert.ok(first.length>0);
 w.spawns.push({...w.spawns[0],id:'boss-bonus',source:'boss',expiresAt:NOW+30*60000});
 const later=NOW+SPAWN_LIFETIME+60000;locate(p,{...fix,timestamp:later},'seed',later);
 const wild=p.walking!.spawns.filter(s=>s.source!=='boss');
 assert.ok(wild.length>0&&wild.every(s=>s.expiresAt>later),'fresh wild bugs appear while the boss is still waiting');
 assert.ok(p.walking!.spawns.some(s=>s.id==='boss-bonus'),'the earned boss stays available');
});
