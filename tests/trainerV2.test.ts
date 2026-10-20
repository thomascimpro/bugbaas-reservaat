import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,rollGoBug,transferManyGo} from '../game/goV2';
import {catchXP,catchStreakDays,CATCH_STREAK_BONUS,claimTrainer,ensureTrainer,grantXP,levelXP,trainerLevel} from '../game/trainerV2';
import {claimGoDaily,GO_BREAKTHROUGH} from '../game/dailyResearchV2';
const NOW=Date.UTC(2026,9,20,14);
function player(){const p=freshV2('trainer','TRAIN123',NOW);ensureField(p,NOW);ensureGo(p,NOW);return p;}
test('trainer XP grows to level 40, historical catches receive no retroactive resource claim, and level rewards claim once',()=>{
 const p=player();delete p.go!.trainer;p.field!.total.catches=20;const t=ensureTrainer(p);assert.equal(t.xp,2000);assert.equal(trainerLevel(t.xp),3);assert.throws(()=>claimTrainer(p));grantXP(p,2500);assert.equal(trainerLevel(t.xp),4);const before=p.go!.dust,nets=p.field!.inventory.basic;claimTrainer(p);assert.equal(p.go!.dust,before+200);assert.equal(p.field!.inventory.basic,nets+5);assert.throws(()=>claimTrainer(p));assert.throws(()=>grantXP(p,-1));assert.equal(trainerLevel(levelXP(40)),40);assert.equal(trainerLevel(1e9),40);
});
test('active catch skill earns more XP; first/new species bonuses are factual and shiny has no separate XP advantage',()=>{
 const p=player(),q=player();assert.equal(catchXP(p,true,NOW,'perfect',true),1420);assert.equal(catchXP(q,true,NOW,'perfect',true),1420);assert.equal(catchXP(p,false,NOW),100);assert.equal(catchXP(q,false,NOW,'great'),200);assert.equal(catchXP(p,false,NOW+86400000),600);
});

test('catch streak advances once per server UTC day and keeps ordinary first-catch XP unchanged',()=>{
 const p=player(),dust=p.go!.dust,midnight=Date.UTC(2026,9,21);
 assert.equal(catchXP(p,false,midnight-1),600);assert.equal(catchXP(p,false,midnight-1),100);
 assert.deepEqual(p.go!.trainer!.catchStreak,{days:1,lastDay:'2026-10-20'});
 assert.equal(catchXP(p,false,midnight),600);assert.deepEqual(p.go!.trainer!.catchStreak,{days:2,lastDay:'2026-10-21'});
 const before=structuredClone(p.go!.trainer!.catchStreak);assert.equal(catchXP(p,false,midnight-1),100);assert.deepEqual(p.go!.trainer!.catchStreak,before);assert.equal(p.go!.trainer!.catchDay,'2026-10-21');assert.equal(p.go!.dust,dust);
});

test('missed catch days reset the next streak while keeping XP and research stamps',()=>{
 const p=player();p.go!.trainer!.research={stamps:5,lastDay:'2026-10-19',breakthroughs:0};
 catchXP(p,false,NOW);catchXP(p,false,NOW+86400000);const xp=p.go!.trainer!.xp,research=structuredClone(p.go!.trainer!.research);
 assert.equal(catchStreakDays(p.go!.trainer!,'2026-10-22'),2);assert.equal(catchStreakDays(p.go!.trainer!,'2026-10-23'),0);
 ensureField(p,NOW+3*86400000);ensureGo(p,NOW+3*86400000);assert.equal(p.go!.trainer!.xp,xp);assert.deepEqual(p.go!.trainer!.research,research);
 assert.equal(catchXP(p,false,NOW+3*86400000),600);assert.equal(p.go!.trainer!.catchStreak!.days,1);assert.deepEqual(p.go!.trainer!.research,research);
});

test('seventh consecutive catch day grants the small bonus once and starts a fresh cycle afterwards',()=>{
 const p=player(),dust=p.go!.dust;
 for(let day=0;day<6;day++)assert.equal(catchXP(p,false,NOW+day*86400000),600);
 assert.equal(p.go!.dust,dust);assert.equal(catchXP(p,false,NOW+6*86400000),2600);assert.equal(p.go!.dust,dust+CATCH_STREAK_BONUS.dust);assert.equal(p.go!.trainer!.catchStreak!.days,7);
 assert.equal(catchXP(p,false,NOW+6*86400000+1000),100);assert.equal(p.go!.dust,dust+500);
 assert.equal(catchStreakDays(p.go!.trainer!,'2026-10-26'),7);assert.equal(catchStreakDays(p.go!.trainer!,'2026-10-27'),0);
 assert.equal(catchXP(p,false,NOW+7*86400000),600);assert.equal(p.go!.trainer!.catchStreak!.days,1);
 for(let day=8;day<14;day++)catchXP(p,false,NOW+day*86400000);assert.equal(p.go!.dust,dust+1000);
});

test('legacy catchDay never creates retrospective streak days or rewards on login, research or same-day catches',()=>{
 const p=player();p.go!.trainer={xp:1234,claimedLevel:2,catchDay:'2026-10-20',research:{stamps:3,lastDay:'2026-10-19',breakthroughs:0}};const dust=p.go!.dust;
 ensureGo(p,NOW);assert.equal(p.go!.trainer.catchStreak,undefined);assert.equal(p.go!.trainer.xp,1234);assert.equal(p.go!.dust,dust);
 assert.equal(catchXP(p,false,NOW),100);assert.equal(p.go!.trainer.catchStreak,undefined);assert.equal(p.go!.dust,dust);
 assert.equal(catchXP(p,false,NOW+86400000),600);assert.equal(p.go!.trainer.catchStreak!.days,1);assert.equal(p.go!.dust,dust);assert.deepEqual(p.go!.trainer.research,{stamps:3,lastDay:'2026-10-19',breakthroughs:0});
 assert.equal(catchStreakDays({xp:0,claimedLevel:1,catchDay:''},''),0);
});
test('daily research checks server progress and cannot be claimed twice or without completing the requirement',()=>{
 const p=player();for(const id of ['catch','walk','skill'])assert.throws(()=>claimGoDaily(p,id));p.field!.walk={meters:500,dayMeters:500,anchor:null,at:NOW};const basic=p.field!.inventory.basic;claimGoDaily(p,'walk');assert.equal(p.field!.inventory.basic,basic+5);assert.equal(p.go!.dust,150);assert.equal(p.go!.trainer!.xp,300);assert.throws(()=>claimGoDaily(p,'walk'));p.field!.daily.skilled=1;claimGoDaily(p,'skill');assert.equal(p.go!.dust,350);assert.throws(()=>claimGoDaily(p,'fake'));
});

function stamp(p:ReturnType<typeof player>,day:number){ensureField(p,NOW+day*86400000);p.field!.daily.skilled=1;claimGoDaily(p,'skill');}

test('research grants one stamp for the first claimed task per server day, never for login or unfinished research',()=>{
 const p=player();assert.equal(p.go!.trainer?.research,undefined);assert.throws(()=>claimGoDaily(p,'skill'));assert.equal(p.go!.trainer?.research,undefined);
 stamp(p,0);p.field!.daily.catches=3;p.field!.walk={meters:500,dayMeters:500,anchor:null,at:NOW};claimGoDaily(p,'catch');claimGoDaily(p,'walk');
 assert.deepEqual(p.go!.trainer!.research,{stamps:1,lastDay:'2026-10-20',breakthroughs:0});
});

test('research stamps survive missed server days without a streak reset',()=>{
 const p=player();stamp(p,0);ensureField(p,NOW+5*86400000);assert.equal(p.go!.trainer!.research!.stamps,1);stamp(p,5);
 assert.deepEqual(p.go!.trainer!.research,{stamps:2,lastDay:'2026-10-25',breakthroughs:0});
});

test('seven stamped days grant exactly one fixed breakthrough bundle and no specimen',()=>{
 const p=player(),dust=p.go!.dust,nets=p.field!.inventory.basic,lures=p.field!.inventory.pollen,tms=p.go!.fastTMs,owned=structuredClone(p.specimens);
 for(let day=0;day<6;day++)stamp(p,day*2);
 assert.equal(p.go!.trainer!.research!.breakthroughs,0);assert.equal(p.go!.fastTMs,tms);
 stamp(p,12);assert.equal(p.go!.trainer!.research!.stamps,7);assert.equal(p.go!.trainer!.research!.breakthroughs,1);
 assert.equal(p.go!.dust,dust+7*200+GO_BREAKTHROUGH.dust);assert.equal(p.field!.inventory.basic,nets+GO_BREAKTHROUGH.nets);assert.equal(p.field!.inventory.pollen,lures+GO_BREAKTHROUGH.lures);assert.equal(p.go!.fastTMs,tms+1);assert.deepEqual(p.specimens,owned);assert.equal(p.go!.trainer!.xp,7*300);
});

test('research breakthrough is safe on retries, further same-day claims and later books',()=>{
 const p=player();for(let day=0;day<7;day++)stamp(p,day);const awarded=structuredClone(p);
 assert.throws(()=>claimGoDaily(p,'skill'));assert.deepEqual(p,awarded);
 p.field!.daily.catches=3;claimGoDaily(p,'catch');assert.equal(p.go!.trainer!.research!.stamps,7);assert.equal(p.go!.trainer!.research!.breakthroughs,1);assert.equal(p.go!.fastTMs,awarded.go!.fastTMs);
 // Even a reset of the daily claim list cannot stamp the same day again.
 p.field!.daily.claimed=[];claimGoDaily(p,'skill');assert.equal(p.go!.trainer!.research!.stamps,7);assert.equal(p.go!.fastTMs,awarded.go!.fastTMs);
 for(let day=7;day<14;day++)stamp(p,day);
 assert.equal(p.go!.trainer!.research!.stamps,14);assert.equal(p.go!.trainer!.research!.breakthroughs,2);assert.equal(p.go!.fastTMs,awarded.go!.fastTMs+1);
});

test('old trainer profiles retain XP, catch day, inventory and claimed research without retroactive stamps',()=>{
 const p=player();p.go!.trainer={xp:1234,claimedLevel:2,catchDay:'2026-10-19'};p.field!.daily.claimed=['catch'];p.field!.daily.skilled=1;const before=structuredClone(p);
 claimGoDaily(p,'skill');assert.equal(p.go!.trainer!.xp,1534);assert.equal(p.go!.trainer!.claimedLevel,2);assert.equal(p.go!.trainer!.catchDay,'2026-10-19');assert.equal(p.go!.trainer!.research,undefined);assert.equal(p.go!.dust,before.go!.dust+200);assert.equal(p.field!.inventory.basic,before.field!.inventory.basic);assert.equal(p.field!.inventory.pollen,before.field!.inventory.pollen);assert.deepEqual(p.specimens,before.specimens);
 stamp(p,1);assert.equal(p.go!.trainer!.research!.stamps,1);assert.equal(p.go!.trainer!.xp,1834);assert.equal(p.go!.trainer!.catchDay,'2026-10-19');
});
test('batch release validates every owned specimen before changing anything and preserves favorite/shiny/buddy/team bugs',()=>{
 const p=player();for(let i=0;i<3;i++)p.specimens.push({id:'batch-'+i,species:'ant',go:rollGoBug('ant','batch'+i),level:1,source:'walking',shiny:false,favorite:false,hearts:0,item:null,obtainedAt:NOW});const a=p.specimens.find(s=>s.id==='batch-0')!,b=p.specimens.find(s=>s.id==='batch-1')!;const original=p.specimens.length,candy=p.go!.candy.ant??0;
 for(const protection of ['favorite','shiny','buddy','team']){a.favorite=protection==='favorite';a.shiny=protection==='shiny';p.buddy=protection==='buddy'?a.id:'';p.go!.team=protection==='team'?[a.id]:[];assert.throws(()=>transferManyGo(p,[b.id,a.id]));assert.equal(p.specimens.length,original);assert.equal(p.go!.candy.ant??0,candy);}
 a.favorite=false;a.shiny=false;p.buddy='';p.go!.team=[];transferManyGo(p,[a.id,b.id]);assert.equal(p.specimens.length,original-2);assert.equal(p.go!.candy.ant,candy+2);assert.throws(()=>transferManyGo(p,['batch-2','batch-2']));
});
