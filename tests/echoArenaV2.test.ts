import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureGo,rollGoBug,stats} from '../game/goV2';
import {actGoBattle,advanceGoBattle,fighterGo,prepareGoBattle} from '../game/goBattleV2';
import {chooseEchoMatch,ensureEcho,makeEchoBattle,saveEchoDefense,settleEcho,echoNPCDefenses,normalizeCompetitionFighter,competitionTeamIssue,echoTeamIssue} from '../game/echoArenaV2';
import type {EchoDefense} from '../game/echoArenaV2';
import type {PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,9,21,12),DAY=86400000;
function player(uid='a'){
 const p=freshV2(uid,'TEST1234',NOW);ensureGo(p,NOW);
 p.specimens=['ant','beetle','moth'].map((species,i)=>({id:uid+'-caught-'+i,species,level:1,shiny:i===1,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:10}}));
 p.specimens[0].go!.item='leaf';p.go!.team=p.specimens.map(s=>s.id);return p;
}
function finished(p:PlayerV2,d:EchoDefense,id:string,now=NOW,winner:0|1|null=0){const b=makeEchoBattle(p,d,id,now);b.phase='finished';b.winner=winner;return b;}

test('new Echo defense snapshots actual owned level, IV, stats, moves, shiny and items within the CP cap',()=>{
 const p=player(),before=structuredClone(p.specimens),d=saveEchoDefense(p,NOW);
 assert.equal(d.uid,p.uid);assert.equal(d.league,p.go!.league);assert.deepEqual(d.team.map(f=>f.id),p.go!.team);
 assert.equal(d.policy,'owned-1');assert.equal(p.go!.echo!.defense!.policy,'owned-1');
 for(let i=0;i<3;i++){assert.deepEqual(d.team[i],fighterGo(before[i]));assert.deepEqual(d.team[i].go.iv,before[i].go!.iv);assert.equal(d.team[i].go.level,before[i].go!.level);assert.equal(d.team[i].shiny,before[i].shiny);assert.equal(d.team[i].attack,stats(before[i]).attack);assert.ok(d.team[i].cp<=1500);}
 assert.equal(d.team[0].go.item,'leaf');const frozen=structuredClone(d);
 p.specimens[0].go!.iv[0]=15;p.specimens[0].go!.level=11;p.specimens[0].go!.charged.push('buzz');p.specimens[1].shiny=false;p.go!.team.reverse();
 assert.deepEqual(d,frozen);assert.equal(Object.hasOwn(p.go!.echo!.defense!,'team'),false);
 const bad=player('invalid');bad.go!.team[2]='missing';assert.throws(()=>saveEchoDefense(bad,NOW),/zelfgevangen/);assert.equal(bad.go!.echo,undefined);
});

test('saving unchanged defense preserves its fingerprint across time; a real build change creates a new copy',()=>{
 const p=player(),first=saveEchoDefense(p,NOW),again=saveEchoDefense(p,NOW+DAY);
 assert.equal(first.snapshotId,again.snapshotId);assert.notEqual(first.savedAt,again.savedAt);
 p.specimens[0].go!.item='thorn';assert.notEqual(saveEchoDefense(p,NOW+DAY).snapshotId,first.snapshotId);
 const itemChanged=saveEchoDefense(p,NOW+DAY);p.specimens[0].go!.level+=.5;assert.notEqual(saveEchoDefense(p,NOW+DAY).snapshotId,itemChanged.snapshotId);
 const levelChanged=saveEchoDefense(p,NOW+DAY);p.specimens[0].go!.iv[0]=(p.specimens[0].go!.iv[0]+1)%16;assert.notEqual(saveEchoDefense(p,NOW+DAY).snapshotId,levelChanged.snapshotId);
});

test('echo chooses genuine other owners in the same league closest to the separate echo rating',()=>{
 const p=player(),own=saveEchoDefense(p,NOW),near=saveEchoDefense(player('near'),NOW),far=saveEchoDefense(player('far'),NOW),wrong={...near,uid:'wrong',league:'ultra' as const};
 ensureEcho(p,NOW).rating=1150;p.go!.rating=3000;near.rating=1160;far.rating=2900;
 assert.equal(chooseEchoMatch(p,[own,wrong,far,near],NOW)?.uid,'near');
 assert.equal(chooseEchoMatch(p,[own,wrong],NOW).npc,true);
 assert.throws(()=>makeEchoBattle(p,own,'self',NOW),/eigen verdediging/);
 assert.throws(()=>makeEchoBattle(p,wrong,'league',NOW),/dezelfde arena/);
 const invalid={...near,team:near.team.slice(0,2)};assert.equal(chooseEchoMatch(p,[invalid],NOW).npc,true);
});

test('offline battle runs existing combat against an independent copy and never mutates the defense owner',()=>{
 const a=player(),owner=player('b'),d=saveEchoDefense(owner,NOW),original=structuredClone(d),before=structuredClone(owner);
 // A forged aggregate cannot masquerade as an owned-stat snapshot.
 d.team[0].attack+=2;assert.throws(()=>makeEchoBattle(a,d,'forged',NOW),/opgeslagen team/);d.team[0].attack=original.team[0].attack;
 const b=makeEchoBattle(a,d,'combat',NOW);assert.equal(b.training,true);assert.equal(b.ranked,false);assert.equal(b.echo!.policy,'owned-1');assert.equal(b.echo!.normalized,false);
 assert.equal(b.echo!.defenderUid,owner.uid);assert.deepEqual(b.ratings,[1000,1000]);assert.deepEqual(b.teams[1],original.team);assert.deepEqual(b.teams[0],a.specimens.map(fighterGo));
 actGoBattle(b,0,'fast',null,NOW);advanceGoBattle(b,NOW+1000);advanceGoBattle(b,NOW+2000);
 assert.ok(b.events.some(e=>e.kind==='damage'));assert.ok(b.teams[0][0].hp<b.teams[0][0].maxHP||b.teams[1][0].hp<b.teams[1][0].maxHP);
 assert.deepEqual(owner,before);assert.deepEqual(d.team[0].go,original.team[0].go);assert.equal(d.team[0].hp,d.team[0].maxHP);
 b.teams[1][0].go.iv[0]=99;assert.notEqual(d.team[0].go.iv[0],99);
});

test('echo result is idempotent, changes only its own rating and returns modest rewards to the server',()=>{
 const p=player(),d=saveEchoDefense(player('b'),NOW),before=structuredClone(p.go!),b=finished(p,d,'win');
 assert.deepEqual(settleEcho(p,b,NOW),{dust:150,xp:100,delta:10,rewarded:true});
 assert.equal(p.go!.rating,before.rating);assert.equal(p.go!.wins,before.wins);assert.deepEqual(p.go!.history,before.history);assert.equal(p.go!.dust,before.dust);
 assert.equal(p.go!.echo!.rating,1010);assert.equal(p.go!.echo!.wins,1);assert.equal(b.delta,0);assert.equal(b.echo!.delta,10);
 const snapshot=structuredClone(p);assert.equal(settleEcho(p,b,NOW),null);assert.deepEqual(p,snapshot);
 const lost=finished(player('loser'),d,'lost',NOW,1),loser=player('loser');assert.deepEqual(settleEcho(loser,lost,NOW),{dust:50,xp:0,delta:-10,rewarded:true});
 const draw=player('draw');assert.deepEqual(settleEcho(draw,finished(draw,d,'draw',NOW,null),NOW),{dust:50,xp:0,delta:0,rewarded:true});
});

test('same snapshot and changed or re-saved defenses cannot farm the same owner; unchanged copies reward again next day',()=>{
 const p=player(),owner=player('b'),d=saveEchoDefense(owner,NOW);
 settleEcho(p,finished(p,d,'one'),NOW);const rating=p.go!.echo!.rating;
 const repeat=settleEcho(p,finished(p,d,'two'),NOW)!;assert.deepEqual(repeat,{dust:0,xp:0,delta:0,rewarded:false});
 owner.specimens[0].go!.item='thorn';const changed=saveEchoDefense(owner,NOW+1);
 assert.notEqual(changed.snapshotId,d.snapshotId);assert.equal(settleEcho(p,finished(p,changed,'changed'),NOW)!.rewarded,false);
 const resaved={...d,savedAt:NOW+1};assert.equal(settleEcho(p,finished(p,resaved,'resaved'),NOW)!.rewarded,false);
 assert.equal(p.go!.echo!.rating,rating);assert.equal(p.go!.echo!.rewarded,1);
 assert.equal(settleEcho(p,finished(p,d,'same-copy-tomorrow',NOW+DAY),NOW+DAY)!.rewarded,true);
 assert.equal(p.go!.echo!.rewarded,1);assert.equal(settleEcho(p,finished(p,changed,'changed-tomorrow',NOW+DAY),NOW+DAY)!.rewarded,false);
});

test('five daily rewards cap grants while leaving practice playable and resumes for fresh owners next day',()=>{
 const p=player();for(let i=0;i<6;i++){const d=saveEchoDefense(player('owner'+i),NOW),reward=settleEcho(p,finished(p,d,'battle'+i),NOW)!;assert.equal(reward.rewarded,i<5);assert.equal(reward.dust,i<5?150:0);}
 assert.equal(p.go!.echo!.rewarded,5);const next=saveEchoDefense(player('next'),NOW);
 assert.equal(settleEcho(p,finished(p,next,'next-day',NOW+DAY),NOW+DAY)!.rewarded,true);assert.equal(p.go!.echo!.rewarded,1);
});

test('match selection prefers an unfarmed eligible owner before nearest practice opponent',()=>{
 const p=player(),near=saveEchoDefense(player('near'),NOW),fresh=saveEchoDefense(player('fresh'),NOW);fresh.rating=1200;
 settleEcho(p,finished(p,near,'one'),NOW);assert.equal(chooseEchoMatch(p,[near,fresh],NOW)?.uid,'fresh');
 assert.equal(chooseEchoMatch(p,[near],NOW)?.npc,true);
});


test('solo echo has stable same-league NPC identities and grants at most five resource rewards without any rating or ranked wins',()=>{
 const p=player(),before=structuredClone(p.go!);const first=echoNPCDefenses('great',NOW);assert.deepEqual(first,echoNPCDefenses('great',NOW+10000));assert.notEqual(first[0].uid,echoNPCDefenses('great',NOW+DAY)[0].uid);
 for(let i=0;i<6;i++){const d=chooseEchoMatch(p,[],NOW);assert.equal(d.npc,true);assert.match(d.name,/NPC/);assert.equal(d.league,p.go!.league);const b=finished(p,d,'npc-'+i);assert.deepEqual(settleEcho(p,b,NOW),{dust:i<5?150:0,xp:i<5?100:0,delta:0,rewarded:i<5});}
 assert.equal(p.go!.echo!.rating,1000);assert.equal(p.go!.echo!.wins,0);assert.equal(p.go!.echo!.losses,0);assert.equal(p.go!.rating,before.rating);assert.equal(p.go!.wins,before.wins);
});

test('fresh human defenses outrank NPCs, exhausted human defense yields to fresh NPC, and actual growth changes copied power',()=>{
 const p=player(),d=saveEchoDefense(player('owner'),NOW),before=structuredClone(p.specimens);assert.equal(chooseEchoMatch(p,[d],NOW).uid,d.uid);settleEcho(p,finished(p,d,'first-human'),NOW);assert.equal(chooseEchoMatch(p,[d],NOW).npc,true);
 const low=makeEchoBattle(p,d,'low',NOW);p.specimens.forEach(s=>{s.go!.level=11;s.go!.iv=[15,15,15];});const actual=structuredClone(p.specimens),high=makeEchoBattle(p,d,'high',NOW);assert.ok(high.teams[0][0].cp>low.teams[0][0].cp);assert.ok(high.teams[0][0].attack>low.teams[0][0].attack);assert.deepEqual(high.teams[1],low.teams[1]);assert.deepEqual(p.specimens,actual);assert.notDeepEqual(p.specimens,before);
 for(const league of ['great','ultra','master'] as const)for(const npc of echoNPCDefenses(league,NOW))assert.ok(npc.team.every(f=>f.cp<=(league==='great'?1500:league==='ultra'?2500:Infinity)));
});

test('above-cap actual teams are rejected without changing the normalized daily-challenge helper',()=>{
 const p=player();p.specimens.forEach(s=>{s.go!.level=50;s.go!.iv=[15,15,15];});const before=structuredClone(p);
 assert.match(echoTeamIssue(p)!,/CP-limiet/);assert.equal(competitionTeamIssue(p),null);assert.throws(()=>saveEchoDefense(p,NOW),/CP-limiet/);assert.deepEqual(p,before);
 const d=saveEchoDefense(player('other'),NOW);assert.throws(()=>makeEchoBattle(p,d,'over-cap',NOW),/CP-limiet/);
});

test('unknown legacy defenses stay stored but are excluded from owned-stat matchmaking; explicit legacy battles retain flow2',()=>{
 const owner=player('legacy-owner'),current=saveEchoDefense(owner,NOW),legacy:EchoDefense={...structuredClone(current),snapshotId:'old-normalized-snapshot',team:current.team.map(f=>normalizeCompetitionFighter(f,current.league))};delete legacy.policy;const saved=structuredClone(legacy),p=player();
 assert.equal(chooseEchoMatch(p,[legacy],NOW).npc,true);assert.deepEqual(legacy,saved);
 const b=makeEchoBattle(p,legacy,'legacy',NOW);assert.equal(b.echo!.policy,'normalized-1');assert.equal(b.echo!.normalized,true);assert.equal(b.flow,2);const prepared=prepareGoBattle(b);assert.equal(prepared.flow,2);assert.deepEqual(b.teams[1],legacy.team);assert.ok(b.teams[0].every(f=>f.go.iv.every(n=>n===10)));
 const active=structuredClone(b);owner.specimens[0].go!.level+=.5;const replacement=saveEchoDefense(owner,NOW+1000);assert.equal(replacement.policy,'owned-1');assert.equal(chooseEchoMatch(p,[replacement],NOW).uid,owner.uid);assert.deepEqual(b,active);assert.deepEqual(legacy,saved);
});

test('already stored old-policy battles settle without upgrading missing policy or flow',()=>{
 const p=player(),d=saveEchoDefense(player('legacy'),NOW),b=makeEchoBattle(p,d,'stored',NOW);delete b.flow;delete b.echo!.policy;b.echo!.normalized=true;b.phase='finished';b.winner=0;
 assert.deepEqual(settleEcho(p,b,NOW),{dust:150,xp:100,delta:10,rewarded:true});assert.equal(b.flow,undefined);assert.equal(b.echo!.policy,undefined);assert.equal(b.echo!.normalized,true);
});
