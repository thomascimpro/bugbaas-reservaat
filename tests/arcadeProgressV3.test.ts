import {test} from 'node:test';
import {playOriginalTap,playOriginalNest} from './originalArcadeDriver';
import {isOriginalRules,ORIGINAL_MAX_BYTES} from '../game/arcade/original';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {freshV2} from '../game/safariV2';
import {ensureGo,rollGoBug,family} from '../game/goV2';
import {ensureField} from '../game/fieldV2';
import {arcadeSquad,createTapState,stepTap,tapTarget,targetPosition} from '../game/arcade/tapDuel';
import type {ArcadeTap,ArcadeTicket,ArcadeReceipt} from '../game/arcade/tapDuel';
import {ARCADE_GAMES,applyArcadeInput,createArcadeState,stepArcadeState,replayArcade} from '../game/arcade/games';
import type {ArcadeGameId} from '../game/arcade/games';
import {arcadeChallengeFor,arcadeProgress,arcadeProgressView,arcadeRunKey,arcadeScoreKey,arcadeScores,arcadeTarget,arcadeWeek,issueArcade,nextArcadeGame,submitArcade} from '../server/arcadeServiceV3';
import type {ArcadeScore} from '../server/arcadeServiceV3';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2} from '../server/goServiceV2';
import type {Documents} from '../server/store';

const NOW=Date.UTC(2026,10,2,12),DAY=86400000;
function player(uid='arcade-progress'){
 const p=freshV2(uid,'ARCPROGR',NOW);ensureField(p,NOW);ensureGo(p,NOW);p.onboarded=true;
 p.specimens=['ant','moth','beetle'].map((species,i)=>({id:uid+'-'+i,species,level:1,shiny:i===1,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:10}}));p.go!.team=p.specimens.map(b=>b.id);p.buddy=p.specimens[0].id;return p;
}
function tapInputs(t:ArcadeTicket){
 if(isOriginalRules(t))return playOriginalTap(t).inputs;
 const s=createTapState(t.squad,t.seed,t.league),inputs:ArcadeTap[]=[];
 while(!s.finished){if(s.tick%5===0&&s.targets.length){const enemy=[...s.targets].sort((a,b)=>a.hp-b.hp||a.id-b.id)[0],pos=targetPosition(t.seed,enemy,s.tick),input={tick:s.tick,x:Math.round(pos.x/360*1000),y:Math.round(pos.y/640*1000)};inputs.push(input);tapTarget(s,t.seed,input);}stepTap(s,t.seed,t.league);}return inputs;
}
function nestInputs(t:ArcadeTicket){return playOriginalNest(t).inputs;}
function finishTap(p:ReturnType<typeof player>,now:number,target:ArcadeTicket['target']={name:'Veldwachter',score:80,kind:'computer'}){
 // Isolate reward/medal assertions from game selection; rotation is exercised below through real commands.
 arcadeProgress(p,now).nextGame='tap_duel';const t=issueArcade(p,p.go!.team,'great',randomUUID(),now,target),d:Documents=new Map(),inputs=tapInputs(t),receipt=submitArcade(d,p,t,inputs,now+45000);return {t,receipt,d,inputs};
}

test('stored next game survives reopen, abandon, invalid rounds and day rollover; valid introductions advance once',async()=>{
 const store=new SqliteStore(':memory:'),clock={now:NOW},service=new GoServiceV2(store,'local',()=>clock.now),p=player();
 try{
  await store.run(['v2Players:'+p.uid],d=>d.set('v2Players:'+p.uid,p));let view=await service.state(p.uid);
  const send=async(type:string,params:Record<string,unknown>={})=>view=await service.command(p.uid,{type,...params,expectedRevision:view.player.revision,commandId:randomUUID()});
  assert.equal(view.arcadeNext!.game,'tap_duel');assert.equal((await service.state(p.uid)).arcadeNext!.game,'tap_duel');
  await assert.rejects(send('arcadeStart',{ids:p.go!.team,league:'great',game:'bug_tower'}),/server bepaalt/);
  for(let i=0;i<3;i++){await send('arcadeStart',{ids:p.go!.team,league:'great'});await send('arcadeAbandon',{run:view.arcadeTicket!.id});assert.equal(view.arcadeNext!.game,'tap_duel');}
  await send('arcadeStart',{ids:p.go!.team,league:'great'});clock.now+=45000;await send('arcadeSubmit',{run:view.arcadeTicket!.id,inputs:[]});assert.equal(view.player.arcade!.completed,0);assert.equal(view.arcadeNext!.game,'tap_duel');
  clock.now+=DAY;view=await service.state(p.uid);assert.equal(view.arcadeNext!.game,'tap_duel');
  await send('arcadeStart',{ids:p.go!.team,league:'great'});const tap=view.arcadeTicket!,inputs=tapInputs(tap);clock.now+=45000;await send('arcadeSubmit',{run:tap.id,inputs});assert.equal(view.arcadeNext!.game,'nest_defense');
  const completion=view.player.arcade!.completed;await send('arcadeSubmit',{run:tap.id,inputs:[]});assert.equal(view.player.arcade!.completed,completion);assert.equal(view.arcadeNext!.game,'nest_defense');
  await send('arcadeStart',{ids:p.go!.team,league:'great'});const nest=view.arcadeTicket!,nestLog=nestInputs(nest);assert.equal(replayArcade(nest,nestLog).qualified,true);clock.now+=150000;await send('arcadeSubmit',{run:nest.id,inputs:nestLog});assert.equal(view.arcadeNext!.game,'bubble_swarm');assert.equal(view.player.arcade!.games!.nest_defense!.completed,1);
  await send('arcadeStart',{ids:p.go!.team,league:'great'});assert.equal(view.arcadeTicket!.game,'bubble_swarm');await send('arcadeAbandon',{run:view.arcadeTicket!.id});assert.equal(view.arcadeNext!.game,'bubble_swarm');
 }finally{store.close();}
});

test('weighted rotation is stable per account and excludes both recent qualified games',()=>{
 const selected=new Set<ArcadeGameId>();
 for(let i=0;i<500;i++){const p=player('rotation-'+i),a=arcadeProgress(p,NOW);a.rotationIndex=3+i;a.recentGames=['nest_defense','bubble_swarm'];delete a.nextGame;const next=nextArcadeGame(p,NOW);assert.ok(!a.recentGames.includes(next));assert.equal(nextArcadeGame(structuredClone(p),NOW+DAY),next);selected.add(next);}
 assert.deepEqual([...selected].sort(),ARCADE_GAMES.map(g=>g.id).filter(id=>!['nest_defense','bubble_swarm'].includes(id)).sort());
});

test('completion medals 3/10/30 persist per game without currency beyond the three daily rewards',()=>{
 const p=player(),rating={rating:p.go!.rating,wins:p.go!.wins,losses:p.go!.losses,history:structuredClone(p.go!.history)},before=p.go!.dust;
 for(let i=1;i<=31;i++){
  const {t,receipt,d,inputs}=finishTap(p,NOW+i*60000,{name:'Eerdere speler',score:1,kind:'player'});
  assert.equal(receipt.qualified,true);assert.deepEqual(receipt.medals,[3,10,30].includes(i)?[i]:[]);
  const saved=structuredClone(receipt),dust=p.go!.dust;assert.deepEqual(submitArcade(d,p,t,inputs,NOW+i*60000+45000),saved);assert.equal(p.go!.dust,dust);assert.equal(p.arcade!.completed,i);
 }
 assert.equal(p.go!.dust,before+400);assert.equal(p.arcade!.dailyXP,60);assert.equal(p.arcade!.dailyDust,400);assert.deepEqual(p.arcade!.games!.tap_duel,{completed:31,medals:[3,10,30]});
 assert.deepEqual({rating:p.go!.rating,wins:p.go!.wins,losses:p.go!.losses,history:p.go!.history},rating);
 arcadeProgress(p,NOW+DAY);assert.equal(p.arcade!.rewarded,0);assert.equal(p.arcade!.completed,31);assert.deepEqual(p.arcade!.games!.tap_duel!.medals,[3,10,30]);
});

test('five different UTC acceptance days grant one atomic weekly receipt and five real buddy-family nectar',()=>{
 const p=player(),key=family(p.specimens[0].species),dust=p.go!.dust,candy=p.go!.candy[key]??0;
 let fifth:ReturnType<typeof finishTap>|undefined;
 for(let i=0;i<5;i++){
  const run=finishTap(p,NOW+i*DAY);assert.equal(p.arcade!.week!.days.length,i+1);assert.equal(run.receipt.weekly!==undefined,i===4);if(i===4)fifth=run;
  // An additional qualified run on the same UTC day must not create another day or weekly grant.
  const extra=finishTap(p,NOW+i*DAY+60000);assert.equal(extra.receipt.weekly,undefined);assert.equal(p.arcade!.week!.days.length,i+1);
 }
 assert.deepEqual(fifth!.receipt.weekly,{week:'2026-11-02',dust:500,candy:5,family:key});assert.equal(p.go!.dust,dust+5*250+500);assert.equal(p.go!.candy[key],candy+5);assert.equal(p.arcade!.dailyDust,250);
 const total=p.go!.dust;submitArcade(fifth!.d,p,fifth!.t,[],NOW+4*DAY+120000);assert.equal(p.go!.dust,total);assert.equal(p.go!.candy[key],candy+5);
 const view=arcadeProgressView(p,NOW+4*DAY);assert.deepEqual(view.week,{key:'2026-11-02',days:5,required:5,claimed:true});
 const completed=p.arcade!.completed;arcadeProgress(p,NOW+7*DAY);assert.equal(p.arcade!.week!.days.length,0);assert.equal(p.arcade!.week!.claimed,false);assert.equal(p.arcade!.completed,completed);assert.equal(arcadeWeek(Date.UTC(2026,10,8,23,59)), '2026-11-02');assert.equal(arcadeWeek(Date.UTC(2026,10,9)), '2026-11-09');
});

test('weekly reward has no invented family nectar when no real buddy exists and a crossing-midnight run credits acceptance day',()=>{
 const p=player();p.buddy='missing-owned-bug';
 for(let i=0;i<4;i++)finishTap(p,NOW+i*DAY);
 const candy=structuredClone(p.go!.candy),at=Date.UTC(2026,10,5,23,59,50),a=arcadeProgress(p,at);a.nextGame='tap_duel';const t=issueArcade(p,p.go!.team,'great',randomUUID(),at,{name:'Computer',score:80,kind:'computer'}),receipt=submitArcade(new Map(),p,t,tapInputs(t),at+45000);
 assert.equal(t.challenge.split(':')[0],'2026-11-05');assert.equal(p.arcade!.day,'2026-11-06');assert.deepEqual(receipt.weekly,{week:'2026-11-02',dust:500,candy:0});assert.deepEqual(p.go!.candy,candy);
});

test('old tap-1 tickets and accepted receipts remain valid; audit binds inputs and historical stat snapshot',()=>{
 const p=player(),a=arcadeProgress(p,NOW),old:ArcadeTicket={id:randomUUID(),owner:p.uid,challenge:arcadeChallengeFor('tap_duel','great',NOW),rules:'tap-1',league:'great',seed:42,squad:arcadeSquad(p,p.go!.team,'great'),issuedAt:NOW,expiresAt:NOW+DAY,target:{name:'Computer',score:80,kind:'computer'},status:'started'};a.active=old.id;
 const before=structuredClone(old.squad),inputs=tapInputs(old),receipt=submitArcade(new Map(),p,old,inputs,NOW+45000);assert.equal(receipt.qualified,true);assert.equal(receipt.dust,175);assert.match(old.audit!.inputDigest,/^[a-f0-9]{64}$/);assert.match(old.audit!.snapshotHash,/^[a-f0-9]{64}$/);assert.equal(old.audit!.inputCount,inputs.length);assert.equal(old.audit!.endReason,receipt.endReason);assert.deepEqual(old.squad,before);
 const legacy:ArcadeReceipt={runId:'old-receipt',score:90,dust:175,xp:20,qualified:true,won:true,personalBest:true};old.receipt=legacy;const dust=p.go!.dust;assert.deepEqual(submitArcade(new Map(),p,old,[],NOW+2*DAY),legacy);assert.equal(p.go!.dust,dust);
 const historical=player();historical.arcade={day:'2026-11-02',rewarded:0,dailyDust:0,dailyXP:0,first:false,best:{old:90},completed:30,last:legacy};arcadeProgress(historical,NOW);assert.equal(historical.arcade.nextGame,'nest_defense');assert.deepEqual(historical.arcade.games!.tap_duel,{completed:30,medals:[3,10,30]});assert.deepEqual(historical.arcade.last,legacy);assert.equal(historical.arcade.best.old,90);
});

test('score targets compare exact game, seed, rules and league; public score rows are bounded and computer-labelled',async()=>{
 const store=new SqliteStore(':memory:'),p=player(),game='nest_defense',challenge=arcadeChallengeFor(game,'great',NOW),own=issueArcade({...p,arcade:{...arcadeProgress(p,NOW),nextGame:game}},p.go!.team,'great',randomUUID(),NOW,{name:'Computer',score:80,kind:'computer'},game);
 try{
  assert.deepEqual(await arcadeScores(store,p,NOW),[{name:'Veldwachter',score:80,kind:'computer',me:false}]);
  const rows:ArcadeScore[]=Array.from({length:14},(_,i)=>({uid:'human-'+i,name:'Speler '+i,challenge,game,seed:own.seed,rules:own.rules,league:'great',score:70+i,run:randomUUID(),at:NOW-i}));
  rows.push({...rows[0],uid:'wrong-seed',seed:own.seed+1,score:80},{...rows[0],uid:'wrong-game',game:'tap_duel',score:80},{...rows[0],uid:'wrong-rules',rules:'nest_defense-0',score:80},{...rows[0],uid:'wrong-league',league:'ultra',score:80});
  await store.run(rows.map(r=>arcadeScoreKey(r.uid,challenge)),d=>{for(const r of rows)d.set(arcadeScoreKey(r.uid,challenge),r);});
  const target=await arcadeTarget(store,p,'great',NOW,game);assert.deepEqual(target,{name:'Speler 10',score:80,kind:'player'});
  arcadeProgress(p,NOW).nextGame=game;const scores=await arcadeScores(store,p,NOW);assert.equal(scores.length,10);assert.ok(scores.every(r=>r.kind==='player'&&!r.me));assert.ok(scores.every(r=>r.name.startsWith('Speler ')));
  p.arcade!.best[challenge]=1;const withOwn=await arcadeScores(store,p,NOW);assert.equal(withOwn.length,10);assert.ok(withOwn.some(r=>r.me&&r.kind==='personal'&&r.score===1));
 }finally{store.close();}
});

test('expired and over-budget submissions remain unaccepted without spending resources or advancing rotation',()=>{
 const p=player(),t=issueArcade(p,p.go!.team,'great',randomUUID(),NOW,{name:'Computer',score:80,kind:'computer'}),before=structuredClone(p),inputs=tapInputs(t);
 assert.throws(()=>submitArcade(new Map(),p,t,inputs,NOW+DAY+1),/verlopen/);assert.deepEqual(p,before);assert.equal(t.status,'started');
 const oversized=Array.from({length:22000},(_,tick)=>({tick,x:1000,y:1000,action:'move'}));assert.ok(Buffer.byteLength(JSON.stringify(oversized))>=ORIGINAL_MAX_BYTES);assert.throws(()=>submitArcade(new Map(),p,t,oversized,NOW+45000),/invoer is te groot/);assert.deepEqual(p,before);assert.equal(t.status,'started');
});
