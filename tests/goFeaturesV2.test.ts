import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2,parseGo} from '../server/goServiceV2';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,rollGoBug,evolveGo,family,stats,FAST,CHARGED,HELD,equipGo,awardGoCatch} from '../game/goV2';
import {ensureCocoons,startCocoon,hatchCocoon} from '../game/goCocoonsV2';
import {makeBossBattle,bossIssue,bossChallenge,settleBoss} from '../game/goBossV2';
import {actGoBattle,advanceGoBattle,effectiveness,fighterGo,damage} from '../game/goBattleV2';
import {movePool,teachMove} from '../game/goV2';
import {DEX_SPECIES} from '../game/dexV2';
import {saveEchoDefense,makeEchoBattle,normalizeCompetitionFighter} from '../game/echoArenaV2';
import type {GoBattle} from '../game/goBattleV2';
import {levelXP} from '../game/trainerV2';
import type {PlayerV2,GameViewV2} from '../game/typesV2';
const NOW=Date.UTC(2026,9,21,12);
function player(uid='a'){
 const p=freshV2(uid,'QAABCDEF',NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);
 p.onboarded=true;p.name='QA '+uid;p.friendCode=('QA'+uid.toUpperCase()).padEnd(8,'0').slice(0,8);
 p.specimens=['ant','beetle','moth'].map((species,i)=>({id:'owned-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:15}}));
 p.go!.team=p.specimens.map(s=>s.id);return p;
}
test('offline server duel falls back to NPC, normalizes an absent human snapshot, keeps owner/live Elo intact and settles once',async()=>{
 const store=new SqliteStore(':memory:');try{
  let now=NOW;const service=new GoServiceV2(store,'local',()=>now);
  for(const id of ['a','b'])await store.run(['v2Players:'+id],d=>d.set('v2Players:'+id,player(id)));
  let a=await service.state('a'),b=await service.state('b');
  const send=async(uid:string,v:GameViewV2,type:string,data:Record<string,unknown>={})=>service.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});
  a=await send('a',a,'echoSave');a=await send('a',a,'echoQueue');assert.equal(a.goBattle!.echo!.npc,true);a=await send('a',a,'goAct',{action:'forfeit',value:null});assert.equal(a.player.go!.echo!.rating,1000);assert.equal(a.player.go!.dust,50);a=await send('a',a,'goClose');
  b=await send('b',b,'echoSave');const owner=structuredClone(b.player);
  a=await send('a',a,'echoQueue');assert.ok(a.goBattle!.echo);assert.equal(a.goBattle!.echo!.npc,false);assert.equal(a.goBattle!.ranked,false);assert.equal(a.goBattle!.teams[1][0].cp,normalizeCompetitionFighter(fighterGo(owner.specimens[0]),'great').cp);
  const before=a.player.go!.dust,command={type:'goAct',action:'forfeit',value:null,commandId:randomUUID(),expectedRevision:a.player.revision};
  a=await service.command('a',command);const settled=structuredClone(a.player.go);assert.equal(a.player.go!.dust,before+50);assert.equal(a.player.go!.rating,1000);assert.ok(a.player.go!.echo!.rating<1000);const ownDefense=await store.run(['v2EchoDefenses:a'],d=>d.get('v2EchoDefenses:a') as {rating:number});assert.equal(ownDefense.rating,a.player.go!.echo!.rating);
  a=await service.command('a',command);assert.deepEqual(a.player.go,settled);assert.deepEqual((await service.state('b')).player,owner);
  a=await send('a',a,'goClose');a=await send('a',a,'echoQueue');assert.equal(a.goBattle!.echo!.npc,true);a=await send('a',a,'goAct',{action:'forfeit',value:null});assert.equal(a.player.go!.dust,before+100);assert.equal(a.goBattle!.echo!.rewarded,true);assert.equal(a.player.go!.echo!.rating,settled!.echo!.rating);
  while(a.player.go!.echo!.rewarded<5){a=await send('a',a,'goClose');a=await send('a',a,'echoQueue');a=await send('a',a,'goAct',{action:'forfeit',value:null});}
  const capped=a.player.go!.dust;a=await send('a',a,'goClose');a=await send('a',a,'echoQueue');a=await send('a',a,'goAct',{action:'forfeit',value:null});assert.equal(a.player.go!.dust,capped);assert.equal(a.goBattle!.echo!.rewarded,false);
  a=await send('a',a,'goClose');now+=86400000;a=await service.state('a');a=await send('a',a,'echoQueue');assert.equal(a.goBattle!.echo!.npc,false);a=await send('a',a,'goAct',{action:'forfeit',value:null});assert.equal(a.player.go!.dust,capped+50);assert.equal(a.player.go!.echo!.rewarded,1);
 }finally{store.close();}
});

test('cocoon service hides rolls, counts distance since start, and pays no catch streak or duplicate reward',async()=>{
 const store=new SqliteStore(':memory:');try{
  const service=new GoServiceV2(store,'local',()=>NOW);let v=await service.state('walker');const send=async(type:string,data:Record<string,unknown>={})=>v=await service.command('walker',{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});
  assert.equal(v.player.go!.cocoons!.items.length,1);assert.ok(!JSON.stringify(v).includes('hatchSeed'));
  await store.run(['v2Players:walker'],d=>{(d.get('v2Players:walker') as PlayerV2).field!.walk={meters:7000,dayMeters:7000,at:NOW,anchor:null};});
  await send('cocoonStart',{id:v.player.go!.cocoons!.items[0].id});await assert.rejects(()=>send('cocoonClaim'),/volledige afstand/);
  await store.run(['v2Players:walker'],d=>{(d.get('v2Players:walker') as PlayerV2).field!.walk!.meters=9000;});v=await service.state('walker');
  const prior=structuredClone(v.player),command={type:'cocoonClaim',commandId:randomUUID(),expectedRevision:v.player.revision};v=await service.command('walker',command);
  assert.equal(v.player.specimens.length,prior.specimens.length+1);assert.equal(v.player.go!.dust,prior.go!.dust+500);assert.equal(v.player.go!.trainer!.catchDay,prior.go!.trainer!.catchDay);assert.equal(v.player.field!.daily.catches,prior.field!.daily.catches);
  assert.ok(v.player.specimens.at(-1)!.go!.iv.every(n=>n>=10&&n<=15));const after=structuredClone(v.player);v=await service.command('walker',command);assert.deepEqual(v.player,after);
  await assert.rejects(()=>send('cocoonClaim'),/geen cocon/);assert.ok(!JSON.stringify(v).includes('hatchSeed'));
 }finally{store.close();}
});
test('new commands reject client defense stats, hatch rolls and legacy cocoon parameters',()=>{
 for(const extra of [{type:'echoSave',team:[]},{type:'echoQueue',rating:99999},{type:'cocoonStart',km:2},{type:'cocoonClaim',hatchSeed:'chosen'},{type:'goBoss',damage:99999}])assert.throws(()=>parseGo({...extra,commandId:randomUUID(),expectedRevision:0}));
});
test('second evolution family spends existing Hercules currency and preserves identity, IV, shiny, item and slots',()=>{
 const p=player(),s=p.specimens[0];s.species='beetlegrub';s.shiny=true;s.favorite=true;s.hearts=7;s.go!.charged=['cut','buzz'];s.go!.item='thorn';const before=structuredClone(s);
 p.go!.candy.hercules=75;p.go!.xl.hercules=4;assert.equal(family(s.species),'hercules');assert.deepEqual(movePool(s.species).types,['rock']);evolveGo(p,s.id,'evolve',NOW);
 assert.equal(s.species,'hercules');assert.equal(s.id,before.id);assert.equal(s.go!.level,before.go!.level);assert.deepEqual(s.go!.iv,before.go!.iv);assert.equal(s.go!.item,'thorn');assert.equal(s.go!.charged.length,2);assert.equal(s.shiny,true);assert.equal(s.favorite,true);assert.equal(s.hearts,7);
 assert.equal(p.go!.candy.hercules,51);assert.equal(p.go!.xl.hercules,4);assert.ok(p.shinies.includes('hercules'));assert.throws(()=>evolveGo(p,s.id,'again',NOW));
});
test('boss strength is fixed despite player upgrades, has one living enemy, and enforces progression gates',()=>{
 const p=player();assert.ok(bossIssue(p,'mid'));p.go!.trainer!.xp=levelXP(15);const first=makeBossBattle(p,'end','boss-1',NOW);p.specimens[0].go!.level=16;const second=makeBossBattle(p,'end','boss-2',NOW);
 assert.equal(first.teams[1].filter(f=>f.hp>0).length,1);assert.equal(first.shields[1],0);assert.deepEqual(first.teams[1],second.teams[1]);assert.notEqual(first.teams[0][0].cp,second.teams[0][0].cp);assert.equal(first.boss!.level,45);assert.equal(first.ranked,false);
 assert.notEqual(bossChallenge('early',NOW).id,bossChallenge('early',NOW+86400000).id);
});
function fightBoss(b:GoBattle){
 let now=NOW;while(b.phase!=='finished'&&now<NOW+280000){advanceGoBattle(b,now);if(b.phase==='charge'){
   const c=b.charge!;if(c.side===0){for(let i=0;i<8;i++){now+=125;actGoBattle(b,0,'chargeTap',i,now);}}else if(c.shield===null)actGoBattle(b,0,'shield',b.shields[0]>0,now);
   now=Math.max(now,c.deadline);advanceGoBattle(b,now);continue;
  }
  const a=b.teams[0][b.active[0]];if(a.hp<=0){const next=b.teams[0].findIndex(f=>f.hp>0);if(next>=0)actGoBattle(b,0,'switch',next,now);}
  else if(b.phase==='fight'&&a.readyAt<=now&&!b.fast[0]&&!b.replaceAt.some(Boolean)){const move=a.go.charged.find(m=>CHARGED[m].energy<=a.energy);actGoBattle(b,0,move?'charged':'fast',move??null,now);}
  now+=Math.min(500,FAST[a.go.fast].turns*500);
 }return b;
}
test('a real boss fight can be won and its daily reward is single-use while losses allow retry',()=>{
 const p=player(),b=fightBoss(makeBossBattle(p,'early','boss-combat',NOW));assert.equal(b.phase,'finished');assert.equal(b.winner,0);
 const reward=settleBoss(p,b,NOW)!;assert.equal(reward.dust,150);assert.equal(reward.xp,100);assert.equal(p.go!.rating,1000);assert.equal(settleBoss(p,b,NOW),null);
 const repeat=makeBossBattle(p,'early','repeat',NOW);repeat.phase='finished';repeat.winner=0;assert.equal(settleBoss(p,repeat,NOW)!.rewarded,false);
 const tomorrow=makeBossBattle(p,'early','tomorrow',NOW+86400000);tomorrow.phase='finished';tomorrow.winner=1;assert.equal(settleBoss(p,tomorrow,NOW+86400000)!.dust,0);
 const retry=makeBossBattle(p,'early','retry',NOW+86400000);retry.phase='finished';retry.winner=0;assert.equal(settleBoss(p,retry,NOW+86400000)!.dust,150);
});
test('boss timeout requires defeating the boss and never rewards waiting with a larger surviving team',()=>{
 for(const difficulty of ['early','mid','end'] as const){
  const p=player();p.go!.trainer!.xp=levelXP(15);const b=makeBossBattle(p,difficulty,'idle-'+difficulty,NOW),hp=b.teams[1][0].hp;
  advanceGoBattle(b,b.endsAt);assert.equal(b.phase,'finished');assert.equal(b.winner,1);assert.equal(b.teams[1][0].hp,hp);
  const reward=settleBoss(p,b,b.endsAt)!;assert.deepEqual(reward,{dust:0,xp:0,fastTMs:0,chargedTMs:0,item:null,rewarded:false});assert.equal(p.go!.bosses!.wins,0);assert.deepEqual(p.go!.bosses!.claimed,[]);
 }
 const a=player(),b=makeEchoBattle(a,saveEchoDefense(player('other'),NOW),'echo-timeout',NOW);b.teams[1][2].hp=0;
 advanceGoBattle(b,b.endsAt);assert.equal(b.winner,0);
});
test('eight held builds keep old ownership and provide actual stat tradeoffs including CP',()=>{
 const p=player(),s=p.specimens[0],old={leaf:2,thorn:1,bark:3,wing:4};
 p.go!.items=old as NonNullable<PlayerV2['go']>['items'];const dust=p.go!.dust;ensureGo(p,NOW);
 assert.equal(p.go!.items.leaf,2);assert.equal(p.go!.items.wing,4);assert.equal(p.go!.items.moon,0);assert.equal(p.go!.dust,dust);assert.equal(Object.keys(HELD).length,8);
 const base=stats(s);p.go!.items.moon=1;equipGo(p,s.id,'moon');const moon=stats(s);assert.ok(moon.attack>base.attack);assert.ok(moon.hp<base.hp);assert.notEqual(moon.cp,base.cp);
 p.go!.items.sun=1;equipGo(p,s.id,'sun');const sun=stats(s);assert.ok(sun.hp>base.hp);assert.ok(sun.defense<base.defense);assert.throws(()=>equipGo(p,p.specimens[1].id,'sun'));
});
test('all eight held items are reachable through finite catch loot and initialize counts without NaN',()=>{
 const p=player(),found=new Set<string>();for(let i=0;i<5000&&found.size<Object.keys(HELD).length;i++){
  const s={...p.specimens[0],id:'loot-'+i,obtainedAt:NOW};const held=awardGoCatch(p,s,'held-seed-'+i);if(held)found.add(held);
 }
 assert.equal(found.size,8);assert.ok(Object.values(p.go!.items).every(n=>Number.isSafeInteger(n)&&n>=0));
});
test('first cocoon gives an unequipped player real starter gear once and preserves existing equipment',()=>{
 const p=player();ensureCocoons(p,'starter-item',NOW);startCocoon(p,p.go!.cocoons!.items[0].id,NOW);p.field!.walk={meters:2000,dayMeters:2000,anchor:null,at:NOW};hatchCocoon(p,NOW);
 assert.ok(Object.values(p.go!.items).some(n=>n>0));assert.ok(p.go!.cocoons!.lastHatch!.held);assert.throws(()=>hatchCocoon(p,NOW));
 const owned=player('owned');owned.go!.items.sun=2;ensureCocoons(owned,'owned-item',NOW);startCocoon(owned,owned.go!.cocoons!.items[0].id,NOW);owned.field!.walk={meters:2000,dayMeters:2000,anchor:null,at:NOW};hatchCocoon(owned,NOW);
 assert.ok(owned.go!.items.sun>=2);assert.equal(owned.go!.cocoons!.hatched,1);
});
test('every collectible type combination has a reachable super-effective counter, including Bug-Steel',()=>{
 const reachable=new Set(DEX_SPECIES.flatMap(s=>movePool(s.id).charged));
 for(const s of DEX_SPECIES)assert.ok([...reachable].some(m=>effectiveness(CHARGED[m].type,movePool(s.id).types)>1),'No counter for '+s.id);
 assert.ok(Math.abs(effectiveness('fire',['grass','steel'])-2.56)<1e-9);assert.ok(Math.abs(effectiveness('rock',['fire','flying'])-2.56)<1e-9);
 const p=player(),moth=p.specimens[2],beetle=p.specimens[1],old=structuredClone(moth.go);ensureGo(p,NOW);assert.deepEqual(moth.go,old);
 assert.ok(damage(fighterGo(moth),fighterGo(beetle),'fire',90)>damage(fighterGo(moth),fighterGo(beetle),'bug',90));
 const cover=movePool(moth.species).charged.find(m=>!movePool(moth.species).types.includes(CHARGED[m].type))!;assert.ok(cover);p.go!.chargedTMs=100;let learned=false;for(let i=0;i<100&&!learned;i++){teachMove(p,moth.id,0,'cover-tm-'+i);learned=moth.go!.charged.includes(cover);}assert.equal(learned,true);
});
test('saved-team defense banks energy for a strong matchup move instead of wasting it on a resisted cheap attack',()=>{
 const a=player(),owner=player('defender');a.go!.team=['owned-1','owned-0','owned-2'];owner.go!.team=['owned-2','owned-0','owned-1'];owner.specimens[2].go!.charged=['cut','flare'];
 const defense=saveEchoDefense(owner,NOW),waiting=makeEchoBattle(a,defense,'wait-fire',NOW);waiting.teams[1][0].energy=35;advanceGoBattle(waiting,NOW);assert.equal(waiting.phase,'fight');assert.ok(waiting.fast[1]);
 const ready=makeEchoBattle(a,defense,'use-fire',NOW);ready.teams[1][0].energy=55;advanceGoBattle(ready,NOW);assert.equal(ready.phase,'charge');assert.equal(ready.charge!.move,'flare');assert.equal(ready.teams[1][0].energy,0);
});
test('water specialists cover Ground and neutralize Fire, while their existing captured moves stay owned',()=>{
 for(const kind of ['waterstrider','giantwaterbug']){assert.deepEqual(movePool(kind).types,['water']);assert.ok(movePool(kind).fast.includes('water'));assert.ok(movePool(kind).charged.includes('stream'));assert.ok(effectiveness('fire',movePool(kind).types)<1);}
 assert.ok(effectiveness('water',movePool('antlion').types)>1);assert.ok(effectiveness('grass',movePool('waterstrider').types)>1);
 const p=player(),s=p.specimens[0];s.species='giantwaterbug';s.go!.fast='mud';s.go!.charged=['dark','earth'];const old=structuredClone(s.go);ensureGo(p,NOW);assert.deepEqual(s.go,old);
});
