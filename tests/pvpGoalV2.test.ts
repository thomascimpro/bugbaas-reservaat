import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {freshV2} from '../game/safariV2';
import {ensureGo,LEAGUES,rollGoBug,speciesTypes,stats,teamIssue} from '../game/goV2';
import {makeGoBattle} from '../game/goBattleV2';
import {bugRarity} from '../game/rarityDisplayV2';
import {CUP_THEMES,CUP_WIN_GOAL,RANKS,TRACK,cupBlock,cupNpc,cupSuggestion,cupTeamIssue,cupTheme,ensurePvp,makeCupBattle,npcWinPoints,rankOf,settlePvp,softReset,stageOnePool,suggestTeam} from '../game/pvpV2';
import {ensureCocoons} from '../game/goCocoonsV2';
import {ensureField} from '../game/fieldV2';
import type {PlayerV2} from '../game/typesV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';

const NOW=Date.UTC(2026,9,21,12),DAY=86400000;
function player(uid='a',kinds=['ant','beetle','moth'],now=NOW){
 const p=freshV2(uid,'TEST1234',now);ensureGo(p,now);ensureField(p,now);ensureCocoons(p,'seed',now);
 p.specimens=kinds.map((species,i)=>({id:uid+'-bug-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:now,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:10}}));
 p.go!.team=p.specimens.map(s=>s.id);return p;
}
const themedKinds=(now:number)=>stageOnePool().filter(id=>speciesTypes(id).some(t=>cupTheme(now).types.includes(t))).slice(0,3);
const otherKind=(now:number)=>stageOnePool().find(id=>!speciesTypes(id).some(t=>cupTheme(now).types.includes(t)))!;
function trainingWin(p:PlayerV2,id:string,now=NOW,winner:0|1=0){const b=makeGoBattle(p,player('npc'),id,now,false,true);b.phase='finished';b.winner=winner;return b;}

test('arenas have Dutch names everywhere and keep their internal ids',()=>{
 assert.deepEqual(Object.keys(LEAGUES),['great','ultra','master']);
 assert.deepEqual(Object.values(LEAGUES).map(l=>l.name),['Kleine Arena','Grote Arena','Meester-Arena']);
 assert.equal(LEAGUES.great.cap,1500);assert.equal(LEAGUES.ultra.cap,2500);assert.equal(LEAGUES.master.cap,Infinity);
 const p=player();assert.match(teamIssue(p,p.go!.team,'ultra')!,/Grote Arena/);assert.match(teamIssue(p,p.go!.team,'master')!,/Meester-Arena/);assert.doesNotMatch(teamIssue(p,[],'great')!,/League/);
});

test('rank thresholds go Brons → Zilver → Goud → Platina → Kampioen and Zilver takes about two days of computer wins',()=>{
 assert.deepEqual(RANKS.map(r=>r.name),['Brons','Zilver','Goud','Platina','Kampioen']);
 assert.equal(rankOf(0),0);assert.equal(rankOf(1099),0);assert.equal(rankOf(1100),1);assert.equal(rankOf(1250),2);assert.equal(rankOf(1400),3);assert.equal(rankOf(1600),4);assert.equal(rankOf(9999),4);
 let points=1000,wins=0;while(rankOf(points)<1){points+=npcWinPoints(points);wins++;}
 assert.ok(wins>=5&&wins<=10,'Zilver after '+wins+' wins (5 count per day)');
 assert.ok(npcWinPoints(1600)<npcWinPoints(1000));assert.ok(npcWinPoints(1000,true)>npcWinPoints(1000));
 assert.equal(softReset(1400),1200);assert.equal(softReset(800),900);assert.equal(softReset(1000),1000);
});

test('a new month rewards the best rank of the old season once and moves points halfway back to 1000',()=>{
 const p=player(),v=ensurePvp(p,NOW);v.points=1400;v.best=1420;v.seasonWins=4;
 const dust=p.go!.dust,nets=p.field!.inventory.blue,bugs=p.specimens.length,cocoons=p.go!.cocoons!.items.length,next=Date.UTC(2026,10,1,8);
 ensurePvp(p,next);
 assert.equal(v.season,'2026-11');assert.equal(v.points,1200);assert.equal(v.best,1200);assert.equal(v.seasonWins,0);
 assert.equal(v.lastSeason!.rank,3);assert.equal(v.lastSeason!.season,'2026-10');
 assert.ok(p.go!.dust>=dust+3000);assert.equal(p.field!.inventory.blue,nets+20);assert.equal(p.go!.cocoons!.items.length,cocoons+1);
 assert.equal(p.specimens.length,bugs+1);const bug=p.specimens.at(-1)!;assert.equal(bug.source,'pvp');assert.ok(bugRarity(bug.species)>=3);assert.equal(bug.go!.level,15);
 const after=structuredClone(p);ensurePvp(p,next+3600000);assert.deepEqual(p.go,after.go);assert.equal(p.specimens.length,after.specimens.length);
 // No wins in a season: soft reset only, no free reward.
 const q=player('q'),w=ensurePvp(q,NOW);w.points=1200;const qd=q.go!.dust;ensurePvp(q,next);assert.equal(w.points,1100);assert.equal(q.go!.dust,qd);assert.equal(w.lastSeason,undefined);
});

test('reward track: five wins fill five picture slots, a replayed battle counts once and a new day starts empty',()=>{
 const p=player(),v=ensurePvp(p,NOW),dust=p.go!.dust,nets=p.field!.inventory.blue,tms=p.go!.fastTMs+p.go!.chargedTMs,cocoons=p.go!.cocoons!.items.length,bugs=p.specimens.length;
 assert.equal(settlePvp(p,trainingWin(p,'lost',NOW,1),NOW),v.last);assert.equal(v.track.length,0);assert.equal(v.points,1000);
 for(let i=0;i<5;i++){const b=trainingWin(p,'win-'+i),gain=settlePvp(p,b,NOW)!;assert.equal(gain.slot,i);assert.equal(gain.reward!.kind,TRACK[i].kind);assert.equal(settlePvp(p,b,NOW),null);}
 assert.equal(v.track.length,5);assert.equal(p.go!.dust,dust+300+100);assert.equal(p.field!.inventory.blue,nets+5);assert.equal(p.go!.fastTMs+p.go!.chargedTMs,tms+1);assert.equal(p.go!.cocoons!.items.length,cocoons+1);
 assert.equal(p.specimens.length,bugs+1);assert.ok(bugRarity(p.specimens.at(-1)!.species)>=3);assert.ok(v.points>1000);
 const points=v.points,sixth=settlePvp(p,trainingWin(p,'win-6'),NOW)!;assert.equal(sixth.slot,null);assert.equal(v.points,points);
 ensurePvp(p,NOW+DAY);assert.deepEqual(v.track,[]);assert.deepEqual(v.rewards,[]);
 // Friend duels (not ranked, not training) do not count.
 const friend=makeGoBattle(p,player('f'),'friend',NOW+DAY,false,false);friend.phase='finished';friend.winner=0;assert.equal(settlePvp(p,friend,NOW+DAY),null);
});

test('weekly cup: theme rotates per ISO week, only themed bugs within 1500 CP may join, the computer uses the theme',()=>{
 const monday=Date.UTC(2026,9,19,0,0,1),sunday=Date.UTC(2026,9,25,23,59);assert.equal(cupTheme(monday).id,cupTheme(sunday).id);
 assert.equal(new Set(Array.from({length:CUP_THEMES.length},(_,i)=>cupTheme(monday+i*7*DAY).id)).size,CUP_THEMES.length);
 for(const t of CUP_THEMES){assert.ok(t.types.length>=2&&t.types.length<=3);assert.ok(stageOnePool().filter(id=>speciesTypes(id).some(x=>t.types.includes(x))).length>=3,t.id);}
 const kinds=themedKinds(NOW),p=player('c',[...kinds,otherKind(NOW)]),[a,b,c,off]=p.specimens;
 assert.equal(cupBlock(p,a,NOW),null);assert.equal(cupBlock(p,off,NOW),'type');
 a.go!.level=50;assert.ok(stats(a).cp>1500);assert.equal(cupBlock(p,a,NOW),'cp');assert.match(cupTeamIssue(p,[a.id,b.id,c.id],NOW)!,/1500 CP/);a.go!.level=10;
 assert.match(cupTeamIssue(p,[off.id,b.id,c.id],NOW)!,new RegExp(cupTheme(NOW).emoji));assert.equal(cupTeamIssue(p,[a.id,b.id,c.id],NOW),null);
 assert.deepEqual(new Set(cupSuggestion(p,NOW)),new Set([a.id,b.id,c.id]));assert.equal(suggestTeam(p,1500).length,3);
 const npc=cupNpc(p,[a.id,b.id,c.id],'seed',NOW);assert.equal(npc.specimens.length,3);for(const s of npc.specimens){assert.ok(speciesTypes(s.species).some(t=>cupTheme(NOW).types.includes(t)));assert.ok(stats(s).cp<=1500);}
});

test('cup wins give stars and the third win gives the weekly reward once; your normal team stays unchanged',()=>{
 const kinds=themedKinds(NOW),p=player('w',[...kinds,'ant','beetle','moth']),ids=p.specimens.slice(0,3).map(s=>s.id),team=[...p.go!.team],v=ensurePvp(p,NOW);
 p.go!.team=p.specimens.slice(3).map(s=>s.id);const before=[...p.go!.team];
 for(let i=0;i<CUP_WIN_GOAL+1;i++){const dust=p.go!.dust,b=makeCupBattle(p,ids,'cup-'+i,NOW);assert.equal(v.cupBattle,b.id);assert.deepEqual(b.teams[0].map(f=>f.id),ids);b.phase='finished';b.winner=0;const gain=settlePvp(p,b,NOW)!;assert.ok(gain.cup&&gain.cupStar);assert.equal(v.cupBattle,null);
  if(i===CUP_WIN_GOAL-1){assert.ok(gain.cupReward);assert.ok(p.go!.dust>=dust+1500);}else assert.equal(gain.cupReward,undefined);}
 assert.equal(v.cupWins.length,CUP_WIN_GOAL+1);assert.ok(v.cupClaimed);assert.deepEqual(p.go!.team,before);assert.notDeepEqual(before,team);
 ensurePvp(p,NOW+7*DAY);assert.deepEqual(v.cupWins,[]);assert.equal(v.cupClaimed,false);
});

test('server: a won training duel fills the track once across replays and the cup command starts a themed battle',async()=>{
 const store=new SqliteStore(':memory:');try{
  const kinds=themedKinds(NOW);await store.run(['v2Players:s'],d=>d.set('v2Players:s',player('s',[...kinds])));
  const service=new GoServiceV2(store,'local',()=>NOW);let v=await service.state('s');assert.equal(v.player.go!.pvp!.points,1000);
  v=await service.command('s',{type:'goTrain',commandId:randomUUID(),expectedRevision:v.player.revision});const id=v.goBattle!.id;
  await store.run(['v2GoBattles:'+id],d=>{const b=d.get('v2GoBattles:'+id) as {phase:string;winner:number};b.phase='finished';b.winner=0;});
  v=await service.state('s');v=await service.state('s');assert.equal(v.player.go!.pvp!.track.length,1);assert.deepEqual(v.player.go!.pvp!.track,[id]);assert.equal(v.player.go!.pvp!.last!.slot,0);
  const close={type:'goClose',commandId:randomUUID(),expectedRevision:v.player.revision};v=await service.command('s',close);v=await service.command('s',close);assert.equal(v.player.go!.pvp!.track.length,1);
  v=await service.command('s',{type:'cupFight',ids:v.player.specimens.map(s=>s.id),commandId:randomUUID(),expectedRevision:v.player.revision});
  assert.equal(v.player.go!.pvp!.cupBattle,v.goBattle!.id);assert.ok(v.goBattle!.training);
  await assert.rejects(service.command('s',{type:'cupFight',ids:[],cp:9999,commandId:randomUUID(),expectedRevision:v.player.revision}));
 }finally{store.close();}
});
