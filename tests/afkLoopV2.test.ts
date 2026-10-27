import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureGo,rollGoBug} from '../game/goV2';
import {ensureField} from '../game/fieldV2';
import {ensureAdventure} from '../game/tacticsV2';
import {weakDuplicatesV2} from '../game/transferSelectionV2';
import {awayCursorV2,awaySummaryV2,validAwayCursorV2} from '../game/awaySummaryV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
const NOW=Date.UTC(2026,9,26,12);
function player(){const p=freshV2('afk-owner','AFK12345',NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);p.specimens=Array.from({length:8},(_,i)=>({id:'bug-'+i,species:'ant',level:1,shiny:false,favorite:false,obtainedAt:NOW+i,source:'walking',hearts:0,item:null,go:{...rollGoBug('ant','ant'+i),level:1,iv:[i,i,i] as [number,number,number]}}));return p;}
test('quick cleanup only selects weak duplicates and keeps valuable, equipped and protected builds',()=>{
 const p=player();p.specimens[0].favorite=true;p.specimens[1].shiny=true;p.buddy=p.specimens[2].id;p.go!.team=[p.specimens[3].id];p.specimens[4].go!.item='leaf';p.specimens[5].go!.charged=['cut','buzz'];
 assert.deepEqual(weakDuplicatesV2(p,p.specimens),['bug-6']);assert.deepEqual(weakDuplicatesV2(p,[p.specimens[7]]),[]);assert.equal(p.specimens.length,8);
});
test('away summary is a confirmed cumulative difference and reads only auto catches newer than the cursor',()=>{
 const p=player(),before=awayCursorV2(p);p.go!.auto.totals={caught:3,missed:2,dust:300,xp:150,spins:1};p.field!.walk={meters:1250,dayMeters:1250,at:NOW,anchor:null};p.go!.journal=[{id:'auto',kind:'catch',at:NOW,method:'auto',species:'ant',specimenId:'bug-1'},{id:'manual',kind:'catch',at:NOW,method:'manual',species:'ant'}];
 const summary=awaySummaryV2(p,before);assert.deepEqual([summary.caught,summary.missed,summary.dust,summary.xp,summary.spins,summary.meters],[3,2,300,150,1,1250]);assert.deepEqual(summary.bugs.map(b=>b.id),['auto']);assert.ok(validAwayCursorV2(awayCursorV2(p)));assert.equal(validAwayCursorV2({...before,caught:NaN}),false);assert.equal(awaySummaryV2(p,awayCursorV2(p)).caught,0);
});
test('moving autovanger uses server post cooldown, can attempt a new species, and never adds resources on an immediate repeat',()=>{
 const store=new SqliteStore(':memory:');try{const service=new GoServiceV2(store,'local',()=>NOW),p=player(),fix={lat:51.4416,lng:5.4697,accuracy:5,timestamp:NOW};p.go!.auto.enabled=true;p.go!.auto.moving=1;p.field!.inventory.basic=0;p.go!.dex=[];p.go!.motion={fix:{...fix,lat:fix.lat-.0004},at:NOW-30000};p.walking={fix,at:NOW,seed:'afk-map',spawns:[{id:'afk-new',species:'ant',lat:fix.lat,lng:fix.lng,expiresAt:NOW+600000}],caught:[],day:'2026-10-26',count:0,posts:[{id:'afk-post',name:'Veldpost',lat:fix.lat,lng:fix.lng,source:'virtual'}]};
  const auto=(service as unknown as {auto:(player:typeof p,now:number,seed:string)=>void}).auto.bind(service);auto(p,NOW,'afk-roll');assert.ok(p.go!.auto.last);assert.equal(p.go!.auto.totals!.spins,1);assert.equal(p.go!.auto.totals!.caught+p.go!.auto.totals!.missed,1);assert.ok(p.field!.inventory.basic>=1);const stock=p.field!.inventory.basic,totals=structuredClone(p.go!.auto.totals);auto(p,NOW+1,'repeated');assert.equal(p.field!.inventory.basic,stock);assert.deepEqual(p.go!.auto.totals,totals);
 }finally{store.close();}
});
