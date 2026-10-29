import {test} from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {species} from '../game/catalogV2';
import {evolutionStage} from '../game/dexV2';
import {movePool} from '../game/goV2';
import {ACTIVE_MS,EGG_MS,RAID_GAP_MS,RAID_JITTER_MS,RAID_TIERS,raidAt,raidBossFighter,raidPools,raidSchedule,raidTypeKey} from '../game/raidsV2';

const DAY=Date.UTC(2026,9,28),DATE='2026-10-28';
const TOKEN=(input:string)=>createHash('sha256').update('test-key:'+input).digest('base64url').slice(0,22);
const OTHER=(input:string)=>createHash('sha256').update('other-key:'+input).digest('base64url').slice(0,22);
const site=(i:number)=>({id:'gym-post-'+i,name:'Post '+i,lat:52.09+i/1000,lng:5.12});

test('a gym schedule is deterministic per post, day and server key',()=>{
 const a=raidSchedule(site(1),DATE,TOKEN);assert.deepEqual(raidSchedule(site(1),DATE,TOKEN),a,'same for every server instance and player');
 assert.notDeepEqual(raidSchedule(site(2),DATE,TOKEN),a,'posts differ');assert.notDeepEqual(raidSchedule(site(1),'2026-10-29',TOKEN),a,'days differ');
 assert.notDeepEqual(raidSchedule(site(1),DATE,OTHER),a,'without the server key the schedule cannot be predicted');
 for(const w of a){const r=raidAt(site(1),w.hatchAt,TOKEN)!;assert.equal(r.species,w.species);assert.equal(r.tier,w.tier);assert.equal(r.slot,w.n);assert.match(r.id,/^\d{4}-\d\d-\d\d:\d{1,2}:[\w-]{22}$/);assert.ok(!r.id.includes(site(1).id));}
 assert.equal(new Set(a.map(w=>raidAt(site(1),w.visibleAt,TOKEN)!.id)).size,a.length,'every window has its own raid id');
});

test('several egg windows per gym per day, an hour of egg, 45 minutes to fight, never overlapping',()=>{
 let total=0;
 for(let i=0;i<200;i++){const s=raidSchedule(site(i),DATE,TOKEN);total+=s.length;assert.ok(s.length>=3,'post '+i+' hatches several raids');
  s.forEach((w,k)=>{assert.equal(w.endsAt-w.hatchAt,ACTIVE_MS);assert.ok(w.hatchAt-w.visibleAt<=EGG_MS&&(w.hatchAt-w.visibleAt===EGG_MS||w.visibleAt===DAY),'a full hour of egg (only the first egg after midnight can be shorter)');
   assert.ok(w.visibleAt>=DAY&&w.endsAt<=DAY+86400000,'inside the UTC day');assert.equal(w.hatchAt%60000,0);
   if(k){const prev=s[k-1];assert.ok(w.visibleAt>=prev.endsAt,'one raid at a time per post');assert.ok(w.hatchAt-prev.hatchAt>=RAID_GAP_MS&&(w.n>prev.n+1||w.hatchAt-prev.hatchAt<RAID_GAP_MS+RAID_JITTER_MS),'next egg two to three hours later (or a rest window in between)');}});}
 assert.ok(total/200>=6,'on average at least six raids per post and day, got '+total/200);
});

test('tiers: mostly one star, three stars regularly, four stars rarer, no five stars; bosses fit the tier',()=>{
 const count:Record<number,number>={};
 for(let i=0;i<300;i++)for(const w of raidSchedule(site(i),DATE,TOKEN)){count[w.tier]=(count[w.tier]??0)+1;
  assert.ok(species(w.species).name&&movePool(w.species).fast.length,'playable species');
  if(w.tier===4)assert.equal(evolutionStage(w.species),3,'★4 bosses are final stages');if(w.tier===3)assert.equal(evolutionStage(w.species),2,'★3 bosses are second stages');}
 assert.ok(count[1]>count[3]&&count[3]>count[4]&&count[4]>0,'★1 > ★3 > ★4 > 0: '+JSON.stringify(count));assert.equal(count[5],undefined,'no Oerbugs before their models');
 const strong=Object.values(raidPools().pools[4])[0][0];assert.ok(raidBossFighter({id:'x',tier:4,species:strong}).maxHP>raidBossFighter({id:'x',tier:3,species:strong}).maxHP,'★4 boss is tougher than ★3');
 assert.ok(RAID_TIERS[4].trainer>RAID_TIERS[3].trainer);
});

test('boss types vary: each post cycles through types, many types around a player in a day',()=>{
 const {keys}=raidPools();assert.ok(keys.length>=5,'pools are grouped by the runtime main type');
 let distinct=0,possible=0;for(let i=0;i<100;i++){const types=raidSchedule(site(i),DATE,TOKEN).map(w=>raidTypeKey(w.species));distinct+=new Set(types).size;possible+=Math.min(types.length,keys.length);}
 assert.ok(distinct/possible>=.85,'a post rarely repeats a type within a day ('+distinct+'/'+possible+')');
 const near=[0,1,2,3].flatMap(i=>raidSchedule(site(i),DATE,TOKEN)).map(w=>raidTypeKey(w.species));assert.ok(new Set(near).size>=Math.min(keys.length,8),'four gyms nearby show at least eight types in a day');
 const firsts=new Set(Array.from({length:40},(_,i)=>raidTypeKey(raidSchedule(site(i),DATE,TOKEN)[0].species)));assert.ok(firsts.size>=5,'posts start with different types');
});

test('the schedule is cheap enough for every state poll',()=>{
 const t0=performance.now();for(let i=0;i<2000;i++)raidAt(site(i),DAY+12*3600000,TOKEN);assert.ok(performance.now()-t0<1000,'2000 posts within a second');
});
