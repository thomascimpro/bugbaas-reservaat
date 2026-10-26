import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2} from '../server/goServiceV2';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,rollGoBug,stats} from '../game/goV2';
import {dailyWeekKey} from '../game/dailyChallengeV2';
import type {GoBattle} from '../game/goBattleV2';
import type {PlayerV2,FriendPair} from '../game/typesV2';
const NOW=Date.UTC(2026,11,31,12),DAY=86400000;
function player(uid:string){const p=freshV2(uid,('LOW'+uid).padEnd(8,'0').slice(0,8),NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);p.onboarded=true;p.name=uid;p.specimens=['ant','beetle','moth'].map((species,i)=>({id:uid+'-'+i,species,level:1,shiny:i===1,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:15}}));p.go!.team=p.specimens.map(s=>s.id);p.go!.items.leaf=1;return p;}
async function setup(ids=['solo']){const store=new SqliteStore(':memory:');let now=NOW;for(const uid of ids)await store.run(['v2Players:'+uid],d=>d.set('v2Players:'+uid,player(uid)));const service=new GoServiceV2(store,'local',()=>now);
 const view=(uid=ids[0])=>service.state(uid),send=async(uid:string,type:string,params:Record<string,unknown>={})=>service.command(uid,{type,...params,commandId:randomUUID(),expectedRevision:(await view(uid)).player.revision});
 const finish=async(uid:string,turns=30)=>{const v=await view(uid),key='v2GoBattles:'+v.goBattle!.id;await store.run([key],d=>{const b=d.get(key) as GoBattle;b.phase='finished';b.winner=0;b.fast=[null,null];b.charge=null;b.teams[1].forEach(f=>f.hp=0);b.dailyChallenge!.turns=turns;});return view(uid);};
 return {store,service,view,send,finish,setNow:(value:number)=>now=value};}

test('service enforces three scored starts, receipt replay, once-only cross-league daily win reward, and free practice without leaderboard mutation',async()=>{
 const h=await setup();try{
  const before=await h.view(),uid='solo',owned=structuredClone(before.player.specimens),start={type:'dailyChallenge',commandId:randomUUID(),expectedRevision:before.player.revision};let v=await h.service.command(uid,start);const id=v.goBattle!.id;assert.equal(v.dailyChallenge!.attempts,1);v=await h.service.command(uid,start);assert.equal(v.goBattle!.id,id);assert.equal(v.dailyChallenge!.attempts,1);assert.deepEqual(v.player.specimens,owned);
  v=await h.finish(uid);assert.equal(v.goBattle!.dailyChallenge!.score,12770);assert.equal(v.player.go!.dust,before.player.go!.dust+200);assert.equal(v.goBattle!.dailyChallenge!.rewarded,true);const awarded=structuredClone(v.player.go);v=await h.view();assert.deepEqual(v.player.go,awarded);await h.send(uid,'goClose');
  await h.send(uid,'dailyChallenge');v=await h.finish(uid,10);assert.equal(v.dailyChallenge!.best,12790);assert.equal(v.player.go!.dailyChallenge!.days.length,1);assert.equal(v.goBattle!.dailyChallenge!.rewarded,false);assert.equal(v.player.go!.dust,before.player.go!.dust+200);await h.send(uid,'goClose');
  await h.store.run(['v2Players:'+uid],d=>(d.get('v2Players:'+uid) as PlayerV2).go!.league='ultra');await h.send(uid,'dailyChallenge');v=await h.finish(uid);assert.equal(v.dailyChallenge!.attempts,3);assert.equal(v.goBattle!.dailyChallenge!.rewarded,false);assert.equal(v.player.go!.dust,before.player.go!.dust+200);assert.equal(v.player.go!.dailyChallenge!.claimed.length,1);await h.send(uid,'goClose');
  const capped=await h.view(),battles=(await h.store.query('v2GoBattles')).length;await assert.rejects(()=>h.send(uid,'dailyChallenge'),/drie scorepogingen/);assert.deepEqual((await h.view()).player,capped.player);assert.equal((await h.store.query('v2GoBattles')).length,battles);
  const scores=await h.store.query('v2DailyScores'),progress=structuredClone(capped.player.go!.dailyChallenge);for(let i=0;i<2;i++){await h.send(uid,'dailyChallenge',{practice:true});v=await h.finish(uid,1);assert.equal(v.goBattle!.dailyChallenge!.rewarded,false);assert.equal(v.player.go!.dust,capped.player.go!.dust);assert.deepEqual(v.player.go!.dailyChallenge,progress);await h.send(uid,'goClose');}assert.deepEqual(await h.store.query('v2DailyScores'),scores);assert.equal(v.player.go!.rating,1000);assert.equal(v.player.go!.wins,0);
 }finally{h.store.close();}
});

test('weekly service scores retain best per day and expose only accepted nonremoved friends across UTC year/week boundaries',async()=>{
 const h=await setup(['a','friend','stranger','pending','removed']);try{
  for(const [uid,accepted,removed] of [['friend',true,false],['pending',false,false],['removed',true,true]] as const){const id='a-'+uid;await h.store.run(['v2FriendPairs:'+id],d=>d.set('v2FriendPairs:'+id,{id,users:['a',uid],names:['a',uid],accepted,requestedBy:'a',points:0,lastDay:'',gifts:[null,null],removed} satisfies FriendPair));}
  for(const uid of ['a','friend','stranger','pending','removed']){await h.send(uid,'dailyChallenge');await h.finish(uid,uid==='a'?30:1);await h.send(uid,'goClose');}
  let v=await h.view('a');assert.deepEqual(v.dailyChallengeLeaderboard!.map(r=>r.name),['friend','a']);assert.ok(v.dailyChallengeLeaderboard!.every(r=>!Object.hasOwn(r,'uid')));assert.equal(v.dailyChallengeLeaderboard!.find(r=>r.me)!.score,12770);
  h.setNow(NOW+DAY);await h.send('a','dailyChallenge');v=await h.finish('a');assert.equal(v.player.go!.dailyChallenge!.claimed.length,2);assert.equal(v.dailyChallengeLeaderboard!.find(r=>r.me)!.score,25540);assert.equal(dailyWeekKey(NOW+DAY),'2026-12-28');await h.send('a','goClose');
  h.setNow(Date.UTC(2027,0,4,12));v=await h.view('a');assert.deepEqual(v.dailyChallengeLeaderboard,[]);await h.send('a','dailyChallenge');v=await h.finish('a');assert.equal(v.dailyChallengeLeaderboard!.find(r=>r.me)!.score,12770);assert.equal(v.dailyChallengeLeaderboard!.length,1);const rows=await h.store.query<{week:string}>('v2DailyScores');assert.ok(rows.some(r=>r.week==='2026-12-28'));assert.ok(rows.some(r=>r.week==='2027-01-04'));
 }finally{h.store.close();}
});

test('server rejects forged daily score/seed/turns and invalid attempts with no progress or battle write',async()=>{
 const h=await setup();try{const before=await h.view();for(const extra of [{score:999999},{seed:'chosen'},{turns:0},{practice:'yes'}])await assert.rejects(()=>h.service.command('solo',{type:'dailyChallenge',...extra,commandId:randomUUID(),expectedRevision:before.player.revision}));assert.deepEqual((await h.view()).player,before.player);assert.equal((await h.store.query('v2GoBattles')).length,0);
  await h.store.run(['v2Players:solo'],d=>(d.get('v2Players:solo') as PlayerV2).go!.team[2]='missing');const invalid=await h.view();await assert.rejects(()=>h.send('solo','dailyChallenge'),/zelfgevangen/);assert.deepEqual((await h.view()).player,invalid.player);assert.equal((await h.store.query('v2GoBattles')).length,0);
 }finally{h.store.close();}
});

test('valid team/build commands save one normalized defense per league and six solo NPC duels grant only five capped resources without ranking',async()=>{
 const h=await setup();try{let v=await h.view();await h.send('solo','goTeam',{ids:v.player.go!.team,league:'great'});let defenses=await h.store.query<{uid:string;league:string;snapshotId:string;team:{go:{iv:number[]}}[]}>('v2EchoDefenses');assert.equal(defenses.length,1);const first=defenses[0].snapshotId;assert.deepEqual(defenses[0].team[0].go.iv,[10,10,10]);await h.send('solo','goEquip',{id:v.player.go!.team[0],item:'leaf'});defenses=await h.store.query('v2EchoDefenses');assert.equal(defenses.length,1);assert.notEqual(defenses[0].snapshotId,first);
  await h.store.run(['v2Players:solo'],d=>{const p=d.get('v2Players:solo') as PlayerV2;p.specimens.forEach(s=>{s.go!.level=30;s.go!.iv=[15,15,15];});assert.ok(p.specimens.every(s=>stats(s).cp>1500&&stats(s).cp<=2500));});v=await h.view();await h.send('solo','goTeam',{ids:v.player.go!.team,league:'ultra'});defenses=await h.store.query('v2EchoDefenses');assert.deepEqual(defenses.map(d=>d.league).sort(),['great','ultra']);
  const before=await h.view(),npcs=new Set<string>();for(let i=0;i<6;i++){v=await h.send('solo','echoQueue');assert.equal(v.goBattle!.echo!.npc,true);npcs.add(v.goBattle!.echo!.defenderUid);const command={type:'goAct',action:'forfeit',value:null,commandId:randomUUID(),expectedRevision:v.player.revision};v=await h.service.command('solo',command);assert.equal(v.player.go!.dust,before.player.go!.dust+Math.min(i+1,5)*50);assert.equal(v.goBattle!.echo!.rewarded,i<5);const settled=structuredClone(v.player.go);v=await h.service.command('solo',command);assert.deepEqual(v.player.go,settled);await h.send('solo','goClose');}assert.equal(npcs.size,5);assert.equal(v.player.go!.echo!.rating,1000);assert.equal(v.player.go!.echo!.wins,0);assert.equal(v.player.go!.rating,1000);assert.equal(v.player.go!.wins,0);assert.deepEqual(await h.store.query('v2EchoRanks'),[]);assert.deepEqual(await h.store.query('v2GoRanks'),[]);
 }finally{h.store.close();}
});
