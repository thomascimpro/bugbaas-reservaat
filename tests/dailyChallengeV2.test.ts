import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {FAST,ensureGo,rollGoBug} from '../game/goV2';
import {actGoBattle,advanceGoBattle} from '../game/goBattleV2';
import {dailyChallenge,dailyChallengeScore,dailyChallengeView,dailyWeekKey,ensureDailyChallenge,makeDailyChallengeBattle,settleDailyChallenge,weeklyDailyScore} from '../game/dailyChallengeV2';
import {echoNPCDefenses} from '../game/echoArenaV2';
import {DEX_SPECIES} from '../game/dexV2';
import {WALK_MODELS} from '../game/walkingV2';
import type {PlayerV2} from '../game/typesV2';
const NOW=Date.UTC(2026,9,21,12),DAY=86400000;
function player(uid='daily-player'){
 const p=freshV2(uid,'DAILY123',NOW);ensureGo(p,NOW);p.specimens=['ant','beetle','moth'].map((species,i)=>({id:uid+i,species,level:1,shiny:i===1,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:10}}));p.go!.team=p.specimens.map(s=>s.id);return p;
}
function won(p:PlayerV2,id='daily-win',practice=false,now=NOW){const b=makeDailyChallengeBattle(p,id,now,practice);b.phase='finished';b.winner=0;b.teams[1].forEach(f=>f.hp=0);b.dailyChallenge!.turns=30;return b;}

test('shared daily enemy and seed match every player in a league/date; date and league change the challenge',()=>{
 assert.deepEqual(dailyChallenge('great',NOW),dailyChallenge('great',NOW+10000));assert.notEqual(dailyChallenge('great',NOW).seed,dailyChallenge('great',NOW+DAY).seed);assert.notEqual(dailyChallenge('great',NOW).seed,dailyChallenge('ultra',NOW).seed);
 const a=player('a'),b=player('b');assert.deepEqual(makeDailyChallengeBattle(a,'one',NOW).teams[1],makeDailyChallengeBattle(b,'two',NOW).teams[1]);
});

test('daily battle normalizes only copies and preserves species, moves, item and appearance regardless of account power',()=>{
 const p=player();p.specimens[0].go!.item='leaf';const before=structuredClone(p.specimens),low=makeDailyChallengeBattle(p,'low',NOW);assert.deepEqual(p.specimens,before);p.specimens.forEach(s=>{s.go!.level=50;s.go!.iv=[15,15,15];});const grown=structuredClone(p.specimens),high=makeDailyChallengeBattle(p,'high',NOW);assert.deepEqual(low.teams[0],high.teams[0]);assert.deepEqual(p.specimens,grown);assert.equal(high.ranked,false);assert.equal(high.training,true);
});

test('three scored starts are shared across leagues, failed validation spends no attempt, and unlimited practice spends none',()=>{
 const p=player();p.go!.team[2]='missing';assert.throws(()=>makeDailyChallengeBattle(p,'bad',NOW),/zelfgevangen/);assert.equal(p.go!.dailyChallenge,undefined);p.go!.team=p.specimens.map(s=>s.id);
 for(let i=0;i<3;i++){p.go!.league=i===1?'ultra':'great';assert.equal(makeDailyChallengeBattle(p,'try'+i,NOW).dailyChallenge!.attempt,i+1);}
 const prior=structuredClone(p);assert.throws(()=>makeDailyChallengeBattle(p,'fourth',NOW),/drie scorepogingen/);assert.deepEqual(p,prior);for(let i=0;i<5;i++)assert.equal(makeDailyChallengeBattle(p,'practice'+i,NOW,true).dailyChallenge!.attempt,0);assert.equal(p.go!.dailyChallenge!.attempts,3);
 assert.equal(makeDailyChallengeBattle(p,'tomorrow',NOW+DAY).dailyChallenge!.attempt,1);
});

test('score uses win, defeated bugs, survivors, HP and action turns, never timestamps or tap/event count',()=>{
 const p=player(),b=won(p),score=dailyChallengeScore(b);assert.equal(score,12770);b.createdAt-=DAY;b.endsAt+=DAY;b.serial=100000;b.events=Array.from({length:12},(_,i)=>({id:i,side:0,kind:'tap',amount:0}));assert.equal(dailyChallengeScore(b),score);b.dailyChallenge!.turns+=10;assert.equal(dailyChallengeScore(b),score-10);b.teams[0][0].hp=0;assert.ok(dailyChallengeScore(b)<score-400);b.events.push({id:20,side:0,kind:'forfeit',amount:0});assert.equal(dailyChallengeScore(b),0);
});

test('daily reward settles once across leagues and replay, stores best daily score only, and practice gives no reward or leaderboard score',()=>{
 const p=player(),live=structuredClone(p.go!),first=won(p);assert.deepEqual(settleDailyChallenge(p,first,NOW),{dust:200,xp:100,score:12770,rewarded:true});const after=structuredClone(p);assert.equal(settleDailyChallenge(p,first,NOW),null);assert.deepEqual(p,after);
 const again=won(p,'again');again.dailyChallenge!.turns=80;assert.equal(settleDailyChallenge(p,again,NOW)!.rewarded,false);assert.equal(p.go!.dailyChallenge!.days.length,1);assert.equal(p.go!.dailyChallenge!.days[0].score,12770);
 p.go!.league='ultra';assert.equal(settleDailyChallenge(p,won(p,'ultra'),NOW)!.rewarded,false);const rows=structuredClone(p.go!.dailyChallenge!.days);assert.deepEqual(settleDailyChallenge(p,won(p,'practice',true),NOW),{dust:0,xp:0,score:12770,rewarded:false});assert.deepEqual(p.go!.dailyChallenge!.days,rows);assert.equal(p.go!.rating,live.rating);assert.equal(p.go!.dust,live.dust);assert.equal(p.go!.wins,live.wins);assert.deepEqual(p.go!.history,live.history);
});

test('weekly friends score sums only best days in the same UTC week and league; reward resets next day',()=>{
 const p=player();settleDailyChallenge(p,won(p),NOW);settleDailyChallenge(p,won(p,'tomorrow',false,NOW+DAY),NOW+DAY);const g=ensureDailyChallenge(p,NOW+DAY);assert.equal(g.claimed.length,2);assert.equal(weeklyDailyScore(g,'great',NOW+DAY),25540);assert.equal(weeklyDailyScore(g,'ultra',NOW+DAY),0);assert.equal(dailyWeekKey(NOW),'2026-10-19');assert.equal(weeklyDailyScore(g,'great',Date.UTC(2026,9,26)),0);assert.equal(dailyChallengeView(p,NOW+DAY).best,12770);
});


test('all 365 dates and three leagues construct valid daily and NPC teams using current catchable model species',()=>{
 const catchable=new Set(DEX_SPECIES.map(s=>s.id));for(let day=0;day<365;day++)for(const league of ['great','ultra','master'] as const){const now=Date.UTC(2026,0,1)+day*DAY,challenge=dailyChallenge(league,now),teams=[challenge.team,...echoNPCDefenses(league,now).map(d=>d.team)];for(const team of teams){assert.equal(new Set(team.map(f=>f.species)).size,3);for(const f of team){assert.ok(catchable.has(f.species),f.species);assert.ok(WALK_MODELS[f.species],f.species);assert.ok(Number.isFinite(f.cp)&&f.cp>0&&f.hp>0);assert.ok(f.cp<=(league==='great'?1500:league==='ultra'?2500:Infinity));assert.deepEqual(f.go.iv,[10,10,10]);}}}
});


test('competition score turns count actual own attack starts, not queued taps, NPC actions or eight charged targets',()=>{
 const p=player(),b=makeDailyChallengeBattle(p,'turn-count',NOW),duration=FAST[b.teams[0][0].go.fast].turns*500;
 actGoBattle(b,0,'fast',null,NOW);assert.equal(b.dailyChallenge!.turns,1);actGoBattle(b,0,'fast',null,NOW+1);assert.equal(b.dailyChallenge!.turns,1);advanceGoBattle(b,NOW+duration);assert.equal(b.dailyChallenge!.turns,2);
 const charged=makeDailyChallengeBattle(p,'charge-count',NOW);charged.teams[0][0].energy=100;actGoBattle(charged,0,'charged',charged.teams[0][0].go.charged[0],NOW);assert.equal(charged.dailyChallenge!.turns,1);for(let i=0;i<8;i++)actGoBattle(charged,0,'chargeTap',i,NOW+100*(i+1));assert.equal(charged.dailyChallenge!.turns,1);assert.equal(charged.charge!.hits.length,8);
});
