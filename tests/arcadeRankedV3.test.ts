import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import {document} from '../server/store';
import {freshV2} from '../game/safariV2';
import {ensureGo,rollGoBug} from '../game/goV2';
import {ensureField} from '../game/fieldV2';
import type {PlayerV2} from '../game/typesV2';
import type {ArcadeTicket} from '../game/arcade/tapDuel';
import {ARCADE_RANKED_PAIR_MS,ARCADE_RANKED_TTL_MS,arcadeRankedEloDelta,arcadeRankedRatingChange,freshArcadeRanked} from '../game/arcade/ranked';
import {arcadeRankedDuelKey,arcadeRankedRankKey,completeRanked,expireRankedDuels,findRankedCandidate,rankedOwnDuelId,rankedStartKeys,rankedSubmitKeys,readRankedDuel,startRanked,ensureArcadeSeason} from '../server/arcadeRankedV3';
import type {ArcadeRankedDuel} from '../server/arcadeRankedV3';
import {RANKS,rankOf,rankStep,softReset} from '../game/ranksV3';
import {rankedBot} from '../game/arcade/rankedBots';
import {ARCADE_GAMES} from '../game/arcade/games';

test('eight ranks have22 contiguous steps and capped monthly soft reset',()=>{
 assert.equal(RANKS.length,8);assert.equal(rankStep(1370).name,'Goud II');assert.equal(rankStep(1370).next,1400);
 assert.equal(rankOf(1149),0);assert.equal(rankOf(1150),1);assert.equal(rankOf(2049),6);assert.equal(rankOf(2050),7);assert.equal(rankStep(2050).next,null);
 assert.equal(softReset(2050),1525);assert.equal(softReset(4000),1600);assert.equal(softReset(900),1000);
 for(const game of ARCADE_GAMES){const low=rankedBot(game.id,1000,42),high=rankedBot(game.id,2050,42);assert.ok(low.name.startsWith('Bot '));assert.ok(low.score>0&&high.score>low.score);assert.ok(high.rating>low.rating);}
});

test('solo ranked alternates real saved scores with optional bots and caps bot starts at five',async()=>{
 const f=await fixture(['alice']);try{
  let bots=0,waiting=0;
  for(let i=0;i<12;i++){const t=await f.start('alice',null,randomUUID(),true),d=(await readRankedDuel(f.store,t))!;f.now+=35000;
   const result=await f.accept('alice',t.id,d.bot?d.bot.score+10:100);
   if(d.bot){bots++;assert.equal(result.ranked!.status,'completed');assert.equal(result.ranked!.bot,true);assert.ok(result.ranked!.delta>0);}
   else{waiting++;assert.equal(result.ranked!.status,'waiting');assert.equal(result.ranked!.delta,0);}
  }
  assert.equal(bots,5);assert.equal(waiting,7);const p=await f.get('alice');assert.equal(p.arcade!.ranked!.bots,5);assert.equal(p.arcade!.ranked!.season!.played,5);
  const ranks=await f.store.query!<any>('v2ArcadeRanks',[]);assert.deepEqual(ranks.map(r=>r.uid),['alice']);
 }finally{f.store.close();}
});

test('available player score takes priority on a would-be bot turn',async()=>{
 const f=await fixture();try{
  const a=await f.start('alice');f.now+=35000;await f.accept('alice',a.id,200);
  await f.store.run([pk('bob')],d=>{const p=document<PlayerV2>(d,pk('bob'))!;p.arcade={day:'2026-11-04',rewarded:0,dailyDust:0,dailyXP:0,first:false,best:{},completed:0,ranked:{...freshArcadeRanked(f.now),starts:1}};});
  const t=await f.start('bob',undefined,randomUUID(),true);assert.equal(t.ranked!.side,'to');assert.equal(t.target.kind,'player');assert.equal((await readRankedDuel(f.store,t))!.bot,undefined);assert.equal((await f.get('bob')).arcade!.ranked!.bots??0,0);
 }finally{f.store.close();}
});

test('season rewards use highest rank, pay once, retain bugs and do not reward empty months',()=>{
 const p=player('season'),r=freshArcadeRanked(NOW);ensureArcadeSeason(p,r,NOW);r.rating=2050;r.season!.best=2050;r.season!.played=5;r.season!.wins=1;
 const bugs=structuredClone(p.specimens),before=p.go!.dust,items=p.go!.items.thorn,next=Date.UTC(2026,11,1);
 ensureArcadeSeason(p,r,next);assert.equal(r.rating,1525);assert.equal(p.go!.dust-before,11000);assert.equal(p.go!.items.thorn-items,1);assert.equal(r.season!.history[0].fastTMs,2);assert.equal(r.season!.history[0].chargedTMs,2);assert.deepEqual(p.specimens,bugs);
 const dust=p.go!.dust;ensureArcadeSeason(p,r,next);assert.equal(p.go!.dust,dust);ensureArcadeSeason(p,r,Date.UTC(2027,1,1));assert.equal(p.go!.dust,dust);assert.equal(r.season!.history.length,1);
});

const NOW=Date.UTC(2026,10,4,12),pk=(uid:string)=>'v2Players:'+uid,rk=(uid:string,id:string)=>'v2ArcadeRuns:'+uid+'-'+id;
function player(uid:string){
 const p=freshV2(uid,uid.padEnd(8,'0').slice(0,8).toUpperCase(),NOW);ensureField(p,NOW);ensureGo(p,NOW);p.onboarded=true;
 p.specimens=['ant','moth','beetle'].map((species,i)=>({id:uid+'-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:10}}));p.go!.team=p.specimens.map(b=>b.id);return p;
}
async function fixture(uids=['alice','bob','charlie']){
 const store=new SqliteStore(':memory:');let now=NOW;
 for(const uid of uids)await store.run([pk(uid)],d=>d.set(pk(uid),player(uid)));
 const get=(uid:string)=>store.run([pk(uid)],d=>document<PlayerV2>(d,pk(uid))!);
 const run=(uid:string,id:string)=>store.run([rk(uid,id)],d=>document<ArcadeTicket>(d,rk(uid,id))!);
 async function start(uid:string,forced?:ArcadeRankedDuel|null,runId:string=randomUUID(),bots=false){
  const p=await get(uid),candidate=forced===null?undefined:forced??await findRankedCandidate(store,p,'great',now);
  return store.run(rankedStartKeys(uid,runId,candidate),d=>{const current=document<PlayerV2>(d,pk(uid))!,t=startRanked(d,current,current.go!.team,'great',runId,now,candidate,bots);current.revision++;d.set(pk(uid),current);return t;});
 }
 // These are trusted replay outputs; replay/command validation is covered by the integration tests.
 async function accept(uid:string,id:string,score:number,dust=75,forfeit=false){
  const pre=await run(uid,id),duel=await readRankedDuel(store,pre);
  return store.run(rankedSubmitKeys(pre,duel),d=>{const p=document<PlayerV2>(d,pk(uid))!,t=document<ArcadeTicket>(d,rk(uid,id))!;
   if(!forfeit&&t.status==='started'){t.status='accepted';t.audit={inputDigest:'server-replay',inputCount:10,endReason:'time',snapshotHash:'historical-squad'};t.receipt={runId:id,score,dust,xp:dust?20:0,qualified:!!dust,won:false,personalBest:false,game:t.game,acceptedAt:now};p.go!.dust+=dust;p.arcade!.dailyDust+=dust;p.arcade!.last=t.receipt;if(p.arcade!.active===id)delete p.arcade!.active;}
   const result=completeRanked(d,p,t,now,forfeit);p.revision++;d.set(pk(uid),p);return result;
  });
 }
 return {store,get,run,start,accept,get now(){return now;},set now(value:number){now=value;}};
}

test('ranked Elo uses the 400 expectation, fixed40 factor and1000 floor',()=>{
 const r=freshArcadeRanked(NOW);assert.equal(arcadeRankedRatingChange(r,1000,'win').delta,20);assert.equal(arcadeRankedRatingChange(r,1000,'loss').delta,0);assert.equal(arcadeRankedRatingChange(r,1000,'draw').delta,0);
 assert.equal(arcadeRankedRatingChange({...r,wins:10},1000,'win').delta,20);assert.equal(arcadeRankedRatingChange({...r,rating:1500,wins:10},1500,'win').delta,20);
 assert.equal(arcadeRankedRatingChange({...r,rating:1000},1000,'loss').rating,1000);assert.ok(arcadeRankedEloDelta(900,1300,1,32)>arcadeRankedEloDelta(1300,900,1,32));
});

test('a lone player records a ready score, gets no invented opponent/Elo, and remains playable offline',async()=>{
 const f=await fixture();try{const t=await f.start('alice'),snapshot=structuredClone(t.squad);assert.equal(t.mode,'ranked');assert.equal(t.target.kind,'computer');f.now+=35000;
  const receipt=await f.accept('alice',t.id,100);assert.equal(receipt.ranked!.status,'waiting');assert.equal(receipt.ranked!.delta,0);assert.equal(receipt.won,false);
  const p=await f.get('alice'),duel=await readRankedDuel(f.store,t);assert.equal(p.arcade!.ranked!.rating,1000);assert.equal(duel!.status,'ready');assert.equal(p.arcade!.active,undefined);assert.deepEqual((await f.run('alice',t.id)).squad,snapshot);
  const other=await f.start('alice');assert.notEqual(other.id,t.id);assert.notEqual(other.ranked!.duel,t.ranked!.duel);
 }finally{f.store.close();}
});

test('a saved score becomes a real same-rules duel; both Elo changes and the winner bonus settle exactly once',async()=>{
 const f=await fixture();try{const a=await f.start('alice');f.now+=35000;await f.accept('alice',a.id,100);const b=await f.start('bob');
  assert.equal(b.ranked!.side,'to');assert.deepEqual([b.game,b.seed,b.rules,b.challenge,b.league],[a.game,a.seed,a.rules,a.challenge,a.league]);assert.equal(b.target.score,100);assert.equal(b.target.kind,'player');f.now+=35000;
  const receipt=await f.accept('bob',b.id,120);assert.equal(receipt.ranked!.status,'completed');assert.equal(receipt.ranked!.delta,20);assert.equal(receipt.ranked!.bonusDust,25);assert.equal(receipt.dust,100);
  const one=await f.get('alice'),two=await f.get('bob');assert.equal(one.arcade!.ranked!.rating,1000);assert.equal(two.arcade!.ranked!.rating,1020);assert.equal(one.arcade!.last!.ranked!.result,'loss');assert.equal(two.arcade!.ranked!.history.length,1);const dust=two.go!.dust;
  await f.accept('bob',b.id,99999);await f.accept('alice',a.id,99999);assert.equal((await f.get('bob')).go!.dust,dust);assert.equal((await f.get('bob')).arcade!.ranked!.history.length,1);assert.equal((await f.get('alice')).arcade!.ranked!.history.length,1);
 }finally{f.store.close();}
});

test('settlement preserves the offline owner’s newer bug upgrades, current run and latest receipt',async()=>{
 const f=await fixture();try{const a=await f.start('alice');f.now+=35000;await f.accept('alice',a.id,150);const b=await f.start('bob'),newer=await f.start('alice');
  await f.store.run([pk('alice')],d=>{const p=document<PlayerV2>(d,pk('alice'))!;p.specimens[0].favorite=true;p.specimens[0].go!.level=11;p.arcade!.last={runId:'newer-receipt',score:22,dust:0,xp:0,qualified:false,won:false,personalBest:false};p.revision+=7;});
  const before=await f.get('alice');f.now+=35000;await f.accept('bob',b.id,90);const after=await f.get('alice');assert.deepEqual(after.specimens,before.specimens);assert.equal(after.arcade!.active,newer.id);assert.equal(after.arcade!.last!.runId,'newer-receipt');assert.equal(after.revision,before.revision+1);assert.equal(after.arcade!.ranked!.wins,1);assert.equal((await f.run('alice',a.id)).receipt!.ranked!.bonusDust,25);
 }finally{f.store.close();}
});

test('nearest Elo is selected without self/NPC, expired, zero-score, wrong-rules or repeated-pair matches',async()=>{
 const f=await fixture(['alice','bob','charlie','dave']);try{
  for(const [uid,rating] of [['alice',1100],['bob',1450]] as const){await f.store.run([pk(uid)],d=>{const p=document<PlayerV2>(d,pk(uid))!;p.arcade={day:'2026-11-04',rewarded:0,dailyDust:0,dailyXP:0,first:false,best:{},completed:0,ranked:{...freshArcadeRanked(NOW),rating}};});const t=await f.start(uid,null);f.now+=35000;await f.accept(uid,t.id,100);}
  const charlie=await f.get('charlie'),first=await findRankedCandidate(f.store,charlie,'great',f.now);assert.equal(first!.fromUid,'alice');
  const invalids=[{id:'npc',fromUid:'npc:one'},{id:'self',fromUid:'charlie'},{id:'expired',expiresAt:f.now},{id:'zero',fromScore:0},{id:'old',rules:'tap-1'}];
  for(const change of invalids)await f.store.run([arcadeRankedDuelKey(change.id)],d=>d.set(arcadeRankedDuelKey(change.id),{...first,...change}));
  assert.equal((await findRankedCandidate(f.store,charlie,'great',f.now))!.fromUid,'alice');assert.equal(await findRankedCandidate(f.store,charlie,'ultra',f.now),undefined);
  const b=await f.start('charlie',first);f.now+=35000;await f.accept('charlie',b.id,110);assert.equal((await f.get('charlie')).arcade!.ranked!.recent.alice,f.now);assert.equal((await findRankedCandidate(f.store,await f.get('alice'),'great',f.now))?.fromUid,'bob');
 }finally{f.store.close();}
});

test('a raced claim falls back to a fresh own recording without overwriting the first claimant',async()=>{
 const f=await fixture();try{const a=await f.start('alice');f.now+=35000;await f.accept('alice',a.id,100);const candidate=(await readRankedDuel(f.store,a))!,b=await f.start('bob',candidate),c=await f.start('charlie',candidate);
  assert.equal(b.ranked!.side,'to');assert.equal(c.ranked!.side,'from');assert.notEqual(c.ranked!.duel,b.ranked!.duel);assert.equal((await readRankedDuel(f.store,b))!.toUid,'bob');assert.equal((await readRankedDuel(f.store,c))!.fromUid,'charlie');
 }finally{f.store.close();}
});

test('an equal replay score records a draw for both sides without a winner bonus',async()=>{
 const f=await fixture();try{const a=await f.start('alice');f.now+=35000;await f.accept('alice',a.id,100);const b=await f.start('bob');f.now+=35000;const receipt=await f.accept('bob',b.id,100);assert.equal(receipt.ranked!.result,'draw');assert.equal(receipt.ranked!.bonusDust,0);assert.equal(receipt.dust,75);
  for(const uid of ['alice','bob']){const p=await f.get(uid);assert.equal(p.arcade!.ranked!.rating,1000);assert.equal(p.arcade!.ranked!.draws,1);assert.equal(p.arcade!.ranked!.wins,0);assert.equal(p.arcade!.ranked!.losses,0);}
 }finally{f.store.close();}
});

test('the transaction rechecks the saved player’s pair cooldown rather than trusting the candidate query',async()=>{
 const f=await fixture();try{const a=await f.start('alice');f.now+=35000;await f.accept('alice',a.id,100);const candidate=(await readRankedDuel(f.store,a))!;
  await f.store.run([pk('alice')],d=>{document<PlayerV2>(d,pk('alice'))!.arcade!.ranked!.recent.bob=f.now;});
  const b=await f.start('bob',candidate);assert.equal(b.ranked!.side,'from');assert.notEqual(b.ranked!.duel,a.ranked!.duel);assert.equal((await readRankedDuel(f.store,a))!.status,'ready');assert.equal((await readRankedDuel(f.store,a))!.toUid,undefined);
 }finally{f.store.close();}
});

test('recording forfeits cancel unrated; a claimed-side forfeit is one real loss with no free rewards',async()=>{
 const f=await fixture();try{const cancelled=await f.start('charlie'),empty=await f.accept('charlie',cancelled.id,0,0,true);assert.equal(empty.ranked!.status,'cancelled');assert.equal((await f.get('charlie')).arcade!.ranked!.losses,0);
  const a=await f.start('alice');f.now+=35000;await f.accept('alice',a.id,100);const b=await f.start('bob'),before=(await f.get('bob')).go!.dust;const lost=await f.accept('bob',b.id,0,0,true);assert.equal(lost.ranked!.result,'loss');assert.equal(lost.dust,0);assert.equal((await f.get('bob')).go!.dust,before);assert.equal((await f.get('alice')).arcade!.ranked!.wins,1);await f.accept('bob',b.id,0,0,true);assert.equal((await f.get('bob')).arcade!.ranked!.losses,1);
 }finally{f.store.close();}
});

test('unrewarded scores can compete, but only a base-eligible winner receives one25-dust bonus',async()=>{
 const f=await fixture();try{const a=await f.start('alice');f.now+=35000;await f.accept('alice',a.id,100,0);const b=await f.start('bob');f.now+=35000;await f.accept('bob',b.id,90,75);const first=await f.run('alice',a.id);assert.equal(first.receipt!.ranked!.result,'win');assert.equal(first.receipt!.ranked!.bonusDust,0);assert.equal(first.receipt!.dust,0);
 }finally{f.store.close();}
});

test('late settlement adds only the old earned win bonus and does not consume a new UTC-day budget',async()=>{
 const f=await fixture();try{const a=await f.start('alice');f.now+=35000;await f.accept('alice',a.id,100,75);const b=await f.start('bob');f.now=Date.UTC(2026,10,5,0,0,30);await f.store.run([pk('alice')],d=>{const p=document<PlayerV2>(d,pk('alice'))!;p.arcade!.day='2026-11-05';p.arcade!.dailyDust=0;p.arcade!.rewarded=0;});const before=(await f.get('alice')).go!.dust;await f.accept('bob',b.id,90,0);const p=await f.get('alice');assert.equal(p.go!.dust,before+25);assert.equal(p.arcade!.dailyDust,0);assert.equal(p.arcade!.rewarded,0);
 }finally{f.store.close();}
});

test('daily25 limit resets at UTC midnight; run IDs cannot select the game or overwrite another duel',async()=>{
 const f=await fixture();try{const first=await f.start('alice'),again=await f.start('alice',undefined,first.id);assert.equal(again.id,first.id);assert.equal((await f.get('alice')).arcade!.ranked!.starts,1);
  const stored=await f.get('alice');await f.store.run([pk('alice')],d=>{const p=document<PlayerV2>(d,pk('alice'))!;p.arcade!.ranked!.starts=0;});const alternate=await f.start('alice',undefined,'alternative-run-id-12345');assert.equal(alternate.game,first.game);assert.equal(alternate.seed,first.seed);
  await f.store.run([pk('alice')],d=>{const p=document<PlayerV2>(d,pk('alice'))!;p.arcade!.ranked!.starts=25;});await assert.rejects(f.start('alice'),/25/);f.now=Date.UTC(2026,10,5);await f.start('alice');assert.equal((await f.get('alice')).arcade!.ranked!.starts,1);
  assert.notEqual(rankedOwnDuelId('a-b','cdefghijklmnop123'),rankedOwnDuelId('a','b-cdefghijklmnop123'));assert.equal(decodeURIComponent(rankedOwnDuelId('uid/with:chars~','abcdefghijklmnop').split('~').slice(0,-1).join('~')),'uid/with:chars~');assert.equal(stored.arcade!.ranked!.starts,1);
 }finally{f.store.close();}
});

test('only server-accepted own replay scores can settle; corrupt/mismatched snapshots roll back',async()=>{
 const f=await fixture();try{const a=await f.start('alice');await assert.rejects(f.store.run(rankedSubmitKeys(a,await readRankedDuel(f.store,a)),d=>completeRanked(d,document<PlayerV2>(d,pk('alice'))!,document<ArcadeTicket>(d,rk('alice',a.id))!,f.now)),/eerst uit/);
  f.now+=35000;await f.accept('alice',a.id,100);const b=await f.start('bob');await f.store.run([rk('bob',b.id)],d=>{document<ArcadeTicket>(d,rk('bob',b.id))!.seed++;});await assert.rejects(f.accept('bob',b.id,200),/klopt niet/);assert.equal((await f.get('bob')).arcade!.ranked!.rating,1000);assert.equal((await f.run('bob',b.id)).status,'started');assert.equal((await f.get('alice')).arcade!.ranked!.history.length,0);
  assert.equal(ARCADE_RANKED_TTL_MS,48*60*60*1000);assert.equal(ARCADE_RANKED_PAIR_MS,15*60*1000);assert.equal((await f.store.query('v2ArcadeRanks')).length,2);
 }finally{f.store.close();}
});

test('either returning participant lazily settles a vanished challenger after24h, preserving a newer run and exactonce rewards',async()=>{
 const f=await fixture();try{const a=await f.start('alice');f.now+=35000;await f.accept('alice',a.id,100);const b=await f.start('bob');
  f.now=b.expiresAt-60000;const newer=await f.start('alice');await f.store.run([pk('alice')],d=>{const p=document<PlayerV2>(d,pk('alice'))!;p.specimens[0].favorite=true;p.arcade!.last={runId:'different-latest',score:8,dust:0,xp:0,qualified:false,won:false,personalBest:false};});
  f.now=b.expiresAt+1;const before=await f.get('alice');assert.equal(await expireRankedDuels(f.store,before,f.now),true);const owner=await f.get('alice'),challenger=await f.get('bob');
  assert.equal(owner.arcade!.ranked!.wins,1);assert.equal(challenger.arcade!.ranked!.losses,1);assert.equal(owner.go!.dust,before.go!.dust+25);assert.equal(owner.arcade!.active,newer.id);assert.equal(owner.arcade!.last!.runId,'different-latest');assert.deepEqual(owner.specimens,before.specimens);assert.equal(challenger.arcade!.active,undefined);assert.equal((await f.run('bob',b.id)).status,'abandoned');assert.equal((await readRankedDuel(f.store,a))!.status,'completed');
  assert.equal(await expireRankedDuels(f.store,owner,f.now),false);assert.equal(await expireRankedDuels(f.store,challenger,f.now),false);assert.equal((await f.get('alice')).go!.dust,owner.go!.dust);assert.equal((await f.get('bob')).arcade!.ranked!.history.length,1);
 }finally{f.store.close();}
});

test('an expired unplayed recording cancels without rating/rewards and clears only its own active ticket',async()=>{
 const f=await fixture();try{const a=await f.start('alice'),before=await f.get('alice');f.now=a.expiresAt+1;assert.equal(await expireRankedDuels(f.store,await f.get('alice'),f.now),true);const p=await f.get('alice');assert.equal(p.arcade!.active,undefined);assert.equal(p.arcade!.ranked!.rating,1000);assert.equal(p.arcade!.ranked!.history.length,0);assert.equal(p.go!.dust,before.go!.dust);assert.equal((await f.run('alice',a.id)).receipt!.ranked!.status,'cancelled');assert.equal(await expireRankedDuels(f.store,p,f.now),false);
 }finally{f.store.close();}
});

test('an unmatched48h score expires unrated while retaining its already earned base reward and newer receipt',async()=>{
 const f=await fixture();try{const a=await f.start('alice');f.now+=35000;await f.accept('alice',a.id,100);const d=(await readRankedDuel(f.store,a))!;f.now=d.expiresAt+1;const newer=await f.start('alice');await f.store.run([pk('alice')],docs=>{document<PlayerV2>(docs,pk('alice'))!.arcade!.last={runId:'later',score:20,dust:0,xp:0,qualified:false,won:false,personalBest:false};});
  const before=await f.get('alice');assert.equal(await expireRankedDuels(f.store,before,f.now),true);const after=await f.get('alice');assert.equal(after.go!.dust,before.go!.dust);assert.equal(after.arcade!.active,newer.id);assert.equal(after.arcade!.last!.runId,'later');assert.equal(after.arcade!.ranked!.rating,1000);assert.deepEqual(after.arcade!.ranked!.waiting,[]);assert.equal((await f.run('alice',a.id)).receipt!.ranked!.status,'cancelled');
 }finally{f.store.close();}
});

test('checking an unexpired saved score uses one bounded document read and no general query',async()=>{
 const f=await fixture();try{const a=await f.start('alice');f.now+=35000;await f.accept('alice',a.id,100);const p=await f.get('alice'),original=f.store.run.bind(f.store);let reads=0,maxKeys=0;f.store.run=async(keys,fn)=>{reads++;maxKeys=Math.max(maxKeys,keys.length);return original(keys,fn);};f.store.query=async()=>{throw new Error('Expiry must not query every player/duel');};assert.equal(await expireRankedDuels(f.store,p,f.now),false);assert.equal(reads,1);assert.ok(maxKeys<=21);
 }finally{f.store.close();}
});

test('more than100 abandoned old scores cannot hide a new playable saved score behind the query limit',async()=>{
 const f=await fixture();try{const a=await f.start('alice');f.now+=35000;await f.accept('alice',a.id,100);const current=(await readRankedDuel(f.store,a))!,expiredKeys=Array.from({length:120},(_,i)=>arcadeRankedDuelKey('expired-'+i));
  // Insert old records first, then the fresh score, matching a long-lived collection.
  const separate=new SqliteStore(':memory:');try{await separate.run(expiredKeys,d=>expiredKeys.forEach((key,i)=>d.set(key,{...current,id:'expired-'+i,expiresAt:f.now-1})));await separate.run([arcadeRankedDuelKey(current.id)],d=>d.set(arcadeRankedDuelKey(current.id),current));assert.equal((await findRankedCandidate(separate,await f.get('bob'),'great',f.now))!.id,current.id);}finally{separate.close();}
 }finally{f.store.close();}
});
