import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2} from '../server/goServiceV2';
import {freshV2} from '../game/safariV2';
import {ensureGo,rollGoBug,family} from '../game/goV2';
import {ensureField} from '../game/fieldV2';
import type {ArcadeTicket} from '../game/arcade/tapDuel';
import {ARCADE_GAMES,replayArcade,gameRules} from '../game/arcade/games';
import {arcadeRunKey} from '../server/arcadeServiceV3';
import {playOriginalTap,playOriginalNest} from './originalArcadeDriver';

const NOW=Date.UTC(2026,10,4,12),ALICE='mode-alice-1',BOB='mode-bob',pk=(uid:string)=>'v2Players:'+uid;
function player(uid:string,index:number){
 const p=freshV2(uid,'MODE'+String(index).padStart(4,'0'),NOW);ensureField(p,NOW);ensureGo(p,NOW);p.onboarded=true;
 p.specimens=['ant','moth','beetle'].map((species,i)=>({id:uid+'-'+i,species,level:1,shiny:i===1,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:10}}));
 p.go!.team=p.specimens.map(b=>b.id);p.go!.dust=100000;p.go!.candy[family(p.specimens[0].species)]=50;p.go!.items.thorn=1;p.go!.trainer!.xp=12500;return p;
}
async function fixture(uids=[ALICE,BOB]){
 const store=new SqliteStore(':memory:'),clock={now:NOW},service=new GoServiceV2(store,'local',()=>clock.now);
 for(const [i,uid]of uids.entries())await store.run([pk(uid)],d=>d.set(pk(uid),player(uid,i)));
 const state=(uid=ALICE)=>service.state(uid);
 const send=async(uid:string,type:string,params:Record<string,unknown>={},revision?:number)=>service.command(uid,{type,...params,expectedRevision:revision??(await state(uid)).player.revision,commandId:randomUUID()});
 const start=async(uid:string,type='arcadeRankedStart',params:Record<string,unknown>={})=>{const v=await state(uid);return (await send(uid,type,{ids:v.player.go!.team,league:'great',...params})).arcadeTicket!;};
 const read=(uid:string,run:string)=>store.run([arcadeRunKey(uid,run)],d=>d.get(arcadeRunKey(uid,run)) as ArcadeTicket);
 return {store,clock,service,state,send,start,read};
}

test('practice allows every game but only saves a private practice best, without resources, medals or rotation changes',async()=>{
 const f=await fixture();try{
  const before=(await f.state()).player;assert.equal((await f.state()).arcadeNext!.game,'tap_duel');
  for(const game of ARCADE_GAMES){const t=await f.start(ALICE,'arcadePracticeStart',{game:game.id});assert.equal(t.mode,'practice');assert.equal(t.game,game.id);assert.equal(t.rules,gameRules(game.id));await f.send(ALICE,'arcadeAbandon',{run:t.id});}
  const ticket=await f.start(ALICE,'arcadePracticeStart',{game:'nest_defense'}),played=playOriginalNest(ticket);assert.equal(replayArcade(ticket,played.inputs).qualified,true);
  f.clock.now+=played.state.tick*20;const saved=await f.send(ALICE,'arcadeSubmit',{run:ticket.id,inputs:played.inputs,format:'original-2'}),receipt=saved.player.arcade!.last!;
  assert.equal(receipt.practice,true);assert.equal(receipt.score,played.state.score);assert.equal(receipt.qualified,true);assert.equal(receipt.personalBest,true);assert.equal(receipt.dust,0);assert.equal(receipt.xp,0);assert.equal(receipt.ranked,undefined);
  assert.deepEqual(saved.player.arcade!.practiceBest,{nest_defense:played.state.score});assert.equal(saved.player.arcade!.completed,0);assert.equal(saved.player.arcade!.rewarded,0);assert.equal(saved.player.arcade!.dailyDust,0);assert.equal(saved.player.arcade!.dailyXP,0);assert.deepEqual(saved.player.arcade!.games,{});assert.deepEqual(saved.player.arcade!.best,{});assert.equal(saved.arcadeNext!.game,'tap_duel');assert.equal(saved.player.arcade!.rotationIndex,0);
  assert.equal(saved.player.go!.dust,before.go!.dust);assert.equal(saved.player.go!.trainer!.xp,before.go!.trainer!.xp);assert.deepEqual(saved.player.go!.candy,before.go!.candy);assert.deepEqual(saved.player.specimens,before.specimens);assert.equal((await f.store.query!('v2ArcadeScores')).length,0);assert.equal((await f.store.query!('v2ArcadeRanks')).length,0);
  const repeat=await f.send(ALICE,'arcadeSubmit',{run:ticket.id,inputs:[],format:'original-2'});assert.deepEqual(repeat.player.arcade!.last,receipt);assert.equal(repeat.player.go!.dust,before.go!.dust);assert.equal(repeat.player.arcade!.completed,0);
 }finally{f.store.close();}
});

test('a chosen normal game has its own scores and real bounded rewards; old rotation and random ranked remain intact',async()=>{
 const f=await fixture();try{
  await f.store.run([pk(ALICE)],d=>{const p=d.get(pk(ALICE)) as ReturnType<typeof player>;p.buddy=p.specimens[0].id;d.set(pk(ALICE),p);});
  const before=(await f.state()).player;
  await assert.rejects(f.start(ALICE,'arcadeStart',{game:'unknown'}),/bekend spel/);
  await assert.rejects(f.start(ALICE,'arcadeRankedStart',{game:'nest_defense'}));
  assert.equal((await f.state()).player.arcade?.active,undefined);
  const t=await f.start(ALICE,'arcadeStart',{game:'nest_defense'});assert.equal(t.game,'nest_defense');assert.equal(t.mode,'rotation');assert.equal(t.rules,'nest_defense-2');
  const played=playOriginalNest(t);assert.equal(replayArcade(t,played.inputs).qualified,true);f.clock.now+=played.state.tick*20;
  const saved=await f.send(ALICE,'arcadeSubmit',{run:t.id,inputs:played.inputs,format:'original-2'}),r=saved.player.arcade!.last!;
  assert.equal(r.game,'nest_defense');assert.equal(r.practice,undefined);assert.equal(r.dust,175);assert.equal(r.xp,20);assert.equal(saved.player.go!.dust,before.go!.dust+175);assert.equal(saved.player.arcade!.games!.nest_defense!.completed,1);assert.equal(saved.player.specimens[0].hearts,1);
  const again=await f.send(ALICE,'arcadeSubmit',{run:t.id,inputs:[],format:'original-2'});assert.equal(again.player.go!.dust,saved.player.go!.dust);assert.equal(again.player.specimens[0].hearts,1);assert.equal(again.player.arcade!.games!.nest_defense!.completed,1);
  const scores=await f.send(ALICE,'arcadeScores',{game:'nest_defense'});assert.equal(scores.arcadeScores!.find(s=>s.me)!.score,r.score);
  const other=await f.send(ALICE,'arcadeScores',{game:'tap_duel'});assert.equal(other.arcadeScores!.some(s=>s.me),false);await assert.rejects(f.send(ALICE,'arcadeScores',{game:'unknown'}),/bekend spel/);
  const legacy=await f.start(ALICE,'arcadeStart');assert.equal(legacy.game,(await f.state()).arcadeNext!.game);await f.send(ALICE,'arcadeAbandon',{run:legacy.id});
  const next=await f.start(ALICE,'arcadeStart',{game:'bubble_swarm'});assert.equal(next.game,'bubble_swarm');assert.equal(next.mode,'rotation');
 }finally{f.store.close();}
});

test('real command replays settle an offline ranked score once and preserve the new active game of the owner and upgraded bug',async()=>{
 const f=await fixture();try{
  // This account's first server-owned rotation is Tap; client command IDs remain random.
  const a=await f.start(ALICE);assert.equal(a.game,'tap_duel');assert.equal(a.mode,'ranked');const low=playOriginalTap(a,10),ownerBefore=(await f.state()).player.go!.dust;assert.equal(replayArcade(a,low.inputs).qualified,true);
  f.clock.now+=low.state.tick*20;const waiting=await f.send(ALICE,'arcadeSubmit',{run:a.id,inputs:low.inputs,format:'original-2'}),first=waiting.player.arcade!.last!;
  assert.equal(first.ranked!.status,'waiting');assert.equal(first.ranked!.delta,0);assert.equal(first.ranked!.bonusDust,0);assert.equal(first.won,false);assert.equal(first.dust,175);assert.equal(waiting.player.go!.dust,ownerBefore+175);assert.equal(waiting.player.arcade!.ranked!.rating,1000);assert.equal(waiting.player.arcade!.ranked!.history.length,0);
  const b=await f.start(BOB);assert.equal(b.ranked!.side,'to');assert.deepEqual([b.game,b.seed,b.rules,b.challenge,b.league],[a.game,a.seed,a.rules,a.challenge,a.league]);assert.deepEqual(b.target,{name:waiting.player.name,score:low.state.score,kind:'player'});const high=playOriginalTap(b);assert.ok(high.state.score>low.state.score);
  const newer=await f.start(ALICE,'arcadePracticeStart',{game:'nest_defense'}),id=waiting.player.specimens[0].id;await f.send(ALICE,'favorite',{id});await f.send(ALICE,'goPower',{id,steps:1});await f.send(ALICE,'goEquip',{id,item:'thorn'});const upgraded=(await f.state()).player,opponentBefore=(await f.state(BOB)).player.go!.dust;
  f.clock.now+=high.state.tick*20;const completed=await f.send(BOB,'arcadeSubmit',{run:b.id,inputs:high.inputs,format:'original-2'}),win=completed.player.arcade!.last!,owner=(await f.state()).player;
  assert.equal(win.score,high.state.score);assert.equal(win.ranked!.status,'completed');assert.equal(win.ranked!.result,'win');assert.equal(win.ranked!.delta,20);assert.equal(win.ranked!.rating,1020);assert.equal(win.ranked!.bonusDust,25);assert.equal(win.dust,200);assert.equal(completed.player.go!.dust,opponentBefore+200);assert.equal(completed.player.arcade!.dailyDust,200);
  assert.equal(owner.arcade!.ranked!.rating,1000);assert.equal(owner.arcade!.ranked!.history[0].result,'loss');assert.equal(owner.arcade!.last!.ranked!.status,'completed');assert.equal(owner.arcade!.active,newer.id);assert.deepEqual(owner.specimens,upgraded.specimens);assert.equal(owner.go!.dust,upgraded.go!.dust);assert.deepEqual((await f.read(ALICE,a.id)).squad,a.squad);assert.equal(owner.arcade!.nextGame,'tap_duel');assert.equal(completed.player.arcade!.nextGame,'tap_duel');
  await f.send(BOB,'arcadeSubmit',{run:b.id,inputs:[],format:'original-2'},0);await f.send(ALICE,'arcadeSubmit',{run:a.id,inputs:[],format:'original-2'},0);
  const ownerAgain=(await f.state()).player,winnerAgain=(await f.state(BOB)).player;assert.equal(winnerAgain.go!.dust,completed.player.go!.dust);assert.equal(ownerAgain.go!.dust,owner.go!.dust);assert.equal(ownerAgain.arcade!.active,newer.id);assert.deepEqual(ownerAgain.specimens,upgraded.specimens);assert.equal(ownerAgain.arcade!.ranked!.history.length,1);assert.equal(winnerAgain.arcade!.ranked!.history.length,1);assert.equal(ownerAgain.arcade!.ranked!.losses,1);assert.equal(winnerAgain.arcade!.ranked!.wins,1);assert.equal(ownerAgain.arcade!.ranked!.rating,1000);assert.equal(winnerAgain.arcade!.ranked!.rating,1020);
  const table=await f.send(BOB,'arcadeScores',{ranked:true});assert.equal(table.arcadeRankedLeaderboard!.length,2);assert.ok(table.arcadeRankedLeaderboard!.some(row=>row.me&&row.rating===1020));assert.equal((await f.store.query!('v2ArcadeScores')).length,0);
 }finally{f.store.close();}
});

test('four human ranked wins share the three-round resource budget and never pay the winner bonus twice',async()=>{
 // Distinct accounts avoid the pair cooldown; each fixture's first server rotation is Tap.
 const owners=['mode-budget-owner-1','mode-budget-owner-7','mode-budget-owner-15','mode-budget-owner-17'],f=await fixture([...owners,BOB]);try{
  const before=(await f.state(BOB)).player.go!.dust;let total=0;
  for(const [i,uid]of owners.entries()){
   const a=await f.start(uid);assert.equal(a.game,'tap_duel');const low=playOriginalTap(a,10);f.clock.now+=low.state.tick*20;await f.send(uid,'arcadeSubmit',{run:a.id,inputs:low.inputs,format:'original-2'});
   const b=await f.start(BOB);assert.equal(b.ranked!.side,'to');const high=playOriginalTap(b);assert.ok(high.state.score>low.state.score);f.clock.now+=high.state.tick*20;
   const saved=await f.send(BOB,'arcadeSubmit',{run:b.id,inputs:high.inputs,format:'original-2'}),receipt=saved.player.arcade!.last!,expected=[200,100,100,0][i];total+=expected;
   assert.equal(receipt.ranked!.result,'win');assert.equal(receipt.dust,expected);assert.equal(receipt.ranked!.bonusDust,i<3?25:0);assert.equal(receipt.xp,i<3?20:0);assert.equal(saved.player.go!.dust,before+total);assert.ok(saved.player.arcade!.dailyDust<=400);
   const again=await f.send(BOB,'arcadeSubmit',{run:b.id,inputs:[],format:'original-2'});assert.equal(again.player.go!.dust,before+total);assert.equal(again.player.arcade!.ranked!.wins,i+1);
  }
  const p=(await f.state(BOB)).player;assert.equal(p.go!.dust,before+400);assert.equal(p.arcade!.dailyDust,400);assert.equal(p.arcade!.dailyXP,60);assert.equal(p.arcade!.rewarded,3);assert.equal(p.arcade!.completed,4);assert.equal(p.arcade!.ranked!.wins,4);assert.equal(p.arcade!.ranked!.history.length,4);
 }finally{f.store.close();}
});

test('invalid input formats are rejected atomically and a lone ranked score never invents computer Elo or a win bonus',async()=>{
 const f=await fixture();try{
  const t=await f.start(ALICE),played=playOriginalTap(t);f.clock.now+=played.state.tick*20;const before=(await f.state()).player;
  await assert.rejects(f.send(ALICE,'arcadeSubmit',{run:t.id,inputs:played.inputs,format:'tap-1'}),/invoerversie/);
  const rejected=(await f.state()).player;assert.equal(rejected.go!.dust,before.go!.dust);assert.equal(rejected.go!.trainer!.xp,before.go!.trainer!.xp);assert.equal(rejected.arcade!.completed,0);assert.equal(rejected.arcade!.active,t.id);assert.equal((await f.read(ALICE,t.id)).status,'started');
  const accepted=await f.send(ALICE,'arcadeSubmit',{run:t.id,inputs:played.inputs,format:'original-2'}),receipt=accepted.player.arcade!.last!;assert.equal(t.target.kind,'computer');assert.equal(receipt.dust,175);assert.equal(receipt.ranked!.bonusDust,0);assert.equal(receipt.ranked!.status,'waiting');assert.equal(receipt.ranked!.delta,0);assert.equal(receipt.won,false);assert.equal(accepted.player.arcade!.ranked!.wins,0);assert.equal(accepted.player.arcade!.ranked!.losses,0);assert.equal(accepted.player.arcade!.ranked!.rating,1000);
 }finally{f.store.close();}
});
