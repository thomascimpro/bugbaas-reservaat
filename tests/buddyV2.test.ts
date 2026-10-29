import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,family,rollGoBug} from '../game/goV2';
import {BUDDY_DAILY,buddyLevel,creditBuddyWalk,playBuddy} from '../game/buddyV2';

const NOW=Date.UTC(2026,9,29,10);
function player(hearts=0){const p=freshV2('buddy','BUDDY123',NOW);ensureField(p,NOW);ensureGo(p,NOW);p.specimens=[{id:'b1',species:'ant',level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts,item:null,go:rollGoBug('ant','b1')}];p.buddy='b1';p.go!.buddyMeters=0;p.field!.walk={meters:0} as never;return p;}

test('every walked km gives buddy nectar, a heart (max 10 a day) and stof from Goed maatje on',()=>{
 const p=player(),key=family('ant'),before=p.go!.candy[key]??0;p.field!.walk!.meters=3400;assert.equal(creditBuddyWalk(p,NOW),3);
 assert.equal(p.go!.candy[key],before+3);assert.equal(p.specimens[0].hearts,3);assert.equal(p.go!.buddyMeters,3000);
 const q=player(10),dust=q.go!.dust;q.field!.walk!.meters=20000;creditBuddyWalk(q,NOW);assert.equal(q.go!.dust,dust+20*50);assert.equal(q.specimens[0].hearts,10+BUDDY_DAILY.walkHearts,'walking hearts are capped per day');
 const best=player(150),bkey=family('ant'),bc=best.go!.candy[bkey]??0;best.field!.walk!.meters=2000;creditBuddyWalk(best,NOW);assert.equal(best.go!.candy[bkey],bc+4,'Beste maatje: 2 nectar per km');
});

test('petting and feeding give hearts while sitting still, with daily limits and a daily gift from Geweldig maatje',()=>{
 const p=player(29);p.field!.inventory.fruit=5;const nets=p.field!.inventory.basic;
 assert.equal(playBuddy(p,'pet',NOW),'gift','reaching 30 hearts unlocks the daily gift on the first pet');assert.equal(p.field!.inventory.basic,nets+5);
 assert.equal(playBuddy(p,'pet',NOW),'heart');playBuddy(p,'pet',NOW);assert.throws(()=>playBuddy(p,'pet',NOW),/genoeg geaaid/);
 playBuddy(p,'feed',NOW);assert.equal(p.field!.inventory.fruit,4);assert.equal(buddyLevel(p.specimens[0].hearts).name,'Geweldig maatje');
 assert.equal(playBuddy(p,'pet',NOW+86400000),'gift','a new day resets the limits and the gift');
 const empty=player();empty.field!.inventory.fruit=0;assert.throws(()=>playBuddy(empty,'feed',NOW),/bosframboos/);
});
