import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {GameServiceV2,parseV2} from '../server/serviceV2';
import {SqliteStore} from '../server/sqlite';
import {copy} from '../game/battleV2';
import {duplicateNectar,expeditionMaterials,lootChances,RARITIES,rarityFor,rollFind,speciesChance,winMaterials} from '../game/progressionV2';
import {SPECIES} from '../game/catalogV2';
import {ALL_GEARS,awardEquipment,equipmentChance,equipmentRollChance,equipmentWeights,GEARS,rollEquipment} from '../game/equipmentV2';
import {encounterFor,masteryStars} from '../game/encountersV2';
import {previewAction,turnLimit} from '../game/tacticsV2';
import {buildAdvice} from '../src/gameplayHelpV2';
import {zone} from '../game/worldV2';
import {builtTeam,challengeScoreKey,ensureAdventure,fighter,finishTactic,legalActions,MAX_ROUNDS,profileFor,resolveTurn,ROLES,roleFor,saveBuild,SKILLS,startTactic,TACTIC_RULE,trainingCost,skillUnlock,skillRank,skillEnergy,trainSkill} from '../game/tacticsV2';
import type {ChallengeScore,TacticAction,TacticRun} from '../game/tacticsV2';
import type {PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,9,15,10);
function setup(mode:'local'|'cloud'='local'){const store=new SqliteStore(':memory:');let now=NOW;return {store,s:new GameServiceV2(store,mode,()=>now),tick:(ms:number)=>now+=ms};}
async function cmd(s:GameServiceV2,uid:string,type:string,data:Record<string,unknown>={},linked=true){const v=await s.state(uid,linked);return s.command(uid,{type,...data,expectedRevision:v.player.revision,commandId:randomUUID()},linked);}
function choose(r:TacticRun):TacticAction {const u=r.teams[0][r.active[0]],enemy=r.teams[1][r.active[1]],all=legalActions(r,0),skill=(id:string)=>all.find(a=>a.skill===id);if(u.poison&&skill('cleanse'))return skill('cleanse')!;if(u.health<u.maxHealth*.5&&skill('heal'))return skill('heal')!;if(!enemy.poison&&skill('venom'))return skill('venom')!;if(skill('burst'))return skill('burst')!;if(skill('crush'))return skill('crush')!;if(enemy.health<enemy.maxHealth*.3&&skill('sting'))return skill('sting')!;return {kind:'basic'};}
async function complete(s:GameServiceV2,uid:string){let v=await s.state(uid);for(let i=0;i<turnLimit(v.player.adventure!.run!)&&v.player.adventure!.run!.phase==='fight';i++)v=await cmd(s,uid,'adventureAct',{action:choose(v.player.adventure!.run!)});assert.notEqual(v.player.adventure!.run!.phase,'fight');return v;}

test('existing players acquire team progress without erasing collection; daily supply is once per visited UTC day',async()=>{const {s,store,tick}=setup();try{const first=await s.state('a'),again=await s.state('a');assert.equal(first.player.nectar,85);assert.equal(again.player.nectar,85);assert.equal(first.player.specimens.length,5);assert.equal(first.player.adventure!.build.length,3);tick(9*86400000);const later=await s.state('a');assert.equal(later.player.nectar,90);assert.equal(later.player.specimens.length,5);}finally{store.close();}});

test('all score opponents and resources are identical even when players have different PvE power and start offline',async()=>{const {s,store}=setup();try{const a=await cmd(s,'a','adventureStart',{mode:'score'});await s.ensure('b');await store.run(['v2Players:b'],d=>{const p=d.get('v2Players:b') as PlayerV2;p.adventure!.level=30;p.adventure!.gear={...p.adventure!.gear,leaf:3,honey:3,thorn:3,wing:3};});const b=await cmd(s,'b','adventureStart',{mode:'score'});assert.deepEqual(a.player.adventure!.run!.teams[1],b.player.adventure!.run!.teams[1]);assert.deepEqual(a.player.adventure!.run!.teams[0],b.player.adventure!.run!.teams[0]);assert.ok(b.player.adventure!.run!.teams.flat().every(u=>u.level===10&&u.grade===1));assert.equal(a.player.adventure!.run!.seed,undefined);assert.deepEqual(a.challengeLeaderboard,[]);}finally{store.close();}});

test('three server-calculated scores remain available after the first player leaves, with no live opponent needed',async()=>{const {s,store}=setup();try{for(let attempt=0;attempt<3;attempt++){await cmd(s,'a','adventureStart',{mode:'score'});await complete(s,'a');await cmd(s,'a','adventureClose');}const saved=await s.state('a');assert.equal(saved.challengeLeaderboard!.length,1);assert.equal(saved.challengeLeaderboard![0].attempts,3);assert.ok(saved.challengeLeaderboard![0].score>0);const score=saved.challengeLeaderboard![0].score;for(let attempt=0;attempt<3;attempt++){const b=await cmd(s,'b','adventureStart',{mode:'score'});assert.deepEqual(b.challengeLeaderboard,[]);await complete(s,'b');await cmd(s,'b','adventureClose');}const b=await s.state('b');assert.equal(b.challengeLeaderboard!.length,2);assert.equal(b.challengeLeaderboard!.find(r=>r.name==='Baas')!.score,score);assert.equal((await s.state('a')).player.adventure!.daily.scores.length,3);await assert.rejects(()=>cmd(s,'a','adventureStart',{mode:'score'}));}finally{store.close();}});

test('turn retries and concurrent commands cannot spend energy, advance or award rewards twice',async()=>{const {s,store}=setup();try{const v=await cmd(s,'a','adventureStart',{mode:'boss'}),c={type:'adventureAct',action:{kind:'basic'},commandId:randomUUID(),expectedRevision:v.player.revision};const [a,b]=await Promise.all([s.command('a',c,true),s.command('a',c,true)]);assert.equal(a.player.adventure!.run!.round,2);assert.equal(b.player.adventure!.run!.round,2);const ended=await complete(s,'a'),nectar=ended.player.nectar;await assert.rejects(()=>cmd(s,'a','adventureAct',{action:{kind:'basic'}}));assert.equal((await s.state('a')).player.nectar,nectar);}finally{store.close();}});

test('clients cannot submit scores, damage, stats, chosen opponents or invalid and unaffordable actions',async()=>{const {s,store}=setup();try{for(const extra of [{score:99999},{seed:'mine'},{team:[]},{winner:0},{enemy:'friend'}])assert.throws(()=>parseV2({type:'adventureStart',mode:'score',commandId:randomUUID(),expectedRevision:0,...extra}));const before=await cmd(s,'a','adventureStart',{mode:'boss'});for(const action of [{kind:'skill',skill:'burst'},{kind:'basic',damage:999},{kind:'switch',target:0},{kind:'switch',target:8}])await assert.rejects(()=>cmd(s,'a','adventureAct',{action}));assert.deepEqual((await s.state('a')).player.adventure!.run,before.player.adventure!.run);}finally{store.close();}});

test('build validation rejects duplicate species, foreign specimens and invented skills, gear or stats',async()=>{const {s,store}=setup();try{const p=(await s.state('a')).player,valid=p.adventure!.build;for(const build of [[valid[0],valid[0],valid[2]],[{...valid[0],specimen:'other'},...valid.slice(1)],[{...valid[0],skills:['heal','venom']},...valid.slice(1)],[{...valid[0],gear:'super'},...valid.slice(1)],[{...valid[0],attack:999},...valid.slice(1)]])await assert.rejects(()=>cmd(s,'a','adventureBuild',{build}));await cmd(s,'a','adventureBuild',{build:valid});}finally{store.close();}});

test('training strengthens PvE stats, keeps every found bug usable and cannot exceed cap or overspend',async()=>{const {s,store}=setup();try{const p=(await s.state('a')).player,before=builtTeam(p);await cmd(s,'a','adventureTrain');const after=(await s.state('a')).player;assert.ok(builtTeam(after).every((u,i)=>u.maxHealth>before[i].maxHealth&&u.attack>=before[i].attack));assert.deepEqual(builtTeam(after,true),builtTeam(p,true));await cmd(s,'a','adventureTrain').then(()=>assert.fail('cannot overspend'),()=>{});await store.run(['v2Players:a'],d=>{const p=d.get('v2Players:a') as PlayerV2;p.adventure!.level=30;p.nectar=9999;});await assert.rejects(()=>cmd(s,'a','adventureTrain'));}finally{store.close();}});

test('items have visible tradeoffs and capped PvE upgrades without changing score stats',async()=>{const {s,store}=setup();try{await s.ensure('a');await store.run(['v2Players:a'],d=>{const a=(d.get('v2Players:a') as PlayerV2).adventure!;a.parts=50;a.stage=15;});const before=(await s.state('a')).player;await cmd(s,'a','adventureGear',{gear:'leaf'});await cmd(s,'a','adventureGear',{gear:'leaf'});const after=(await s.state('a')).player;assert.equal(after.adventure!.parts,10);assert.deepEqual(builtTeam(after,true),builtTeam(before,true));assert.ok(builtTeam(after)[1].armor>builtTeam(before)[1].armor);await assert.rejects(()=>cmd(s,'a','adventureGear',{gear:'leaf'}));const skills=['sting','burst'] as ['sting','burst'],wing=fighter('u','dragonfly',1,skills,'wing',1),honey=fighter('u','dragonfly',1,skills,'honey',1);assert.ok(wing.maxHealth<honey.maxHealth);}finally{store.close();}});

test('expedition uses server elapsed time, allows battles meanwhile and rewards one habitat find exactly once',async()=>{const {s,store,tick}=setup();try{let v=await cmd(s,'a','expeditionStart',{habitat:1,hours:2});assert.equal(v.player.adventure!.expedition!.seed,undefined);await assert.rejects(()=>cmd(s,'a','expeditionClaim'));await assert.rejects(()=>cmd(s,'a','expeditionStart',{habitat:0,hours:8}));await cmd(s,'a','adventureStart',{mode:'boss'});tick(2*3600000);const before=await s.state('a'),c={type:'expeditionClaim',commandId:randomUUID(),expectedRevision:before.player.revision};v=await s.command('a',c,true);const retry=await s.command('a',c,true);assert.equal(v.player.specimens.length,6);assert.equal(retry.player.specimens.length,6);const found=v.player.specimens.at(-1)!;assert.equal(v.player.nectar,before.player.nectar+8+(before.player.discovered.includes(found.species)?duplicateNectar(found.species):0));assert.equal(v.player.adventure!.parts,2+(v.player.adventure!.lastGear?.parts??0));assert.equal(v.player.adventure!.expedition,null);assert.ok(v.player.adventure!.run);await assert.rejects(()=>cmd(s,'a','expeditionClaim'));}finally{store.close();}});

test('forfeiting spends a score attempt but grants no farming rewards or research progress',async()=>{const {s,store}=setup();try{const before=await cmd(s,'a','adventureStart',{mode:'score'});const v=await cmd(s,'a','adventureForfeit');assert.equal(v.player.nectar,before.player.nectar);assert.equal(v.player.adventure!.daily.fights,0);assert.equal(v.player.adventure!.daily.scoreUsed,1);assert.deepEqual(v.player.adventure!.daily.scores,[0]);await assert.rejects(()=>cmd(s,'a','researchClaim'));}finally{store.close();}});

test('research stamps survive missed days, are claimable once and seventh stamp pays one chest',async()=>{const {s,store,tick}=setup();try{await s.ensure('a');for(let day=0;day<7;day++){await cmd(s,'a','adventureStart',{mode:'boss'});await complete(s,'a');await cmd(s,'a','researchClaim');await assert.rejects(()=>cmd(s,'a','researchClaim'));await cmd(s,'a','adventureClose');tick(2*86400000);}const p=(await s.state('a')).player;assert.equal(p.adventure!.stamps,7);assert.equal(p.adventure!.researchChests,1);assert.ok(p.adventure!.parts>=10);}finally{store.close();}});

test('a score fight can finish after midnight and records the original challenge day without consuming today attempts',async()=>{const {s,store,tick}=setup();try{const v=await cmd(s,'a','adventureStart',{mode:'score'}),day=v.player.adventure!.run!.day;tick(86400000);await complete(s,'a');const p=(await s.state('a')).player,records=await store.query<ChallengeScore>('v2ChallengeScores');assert.equal(records[0].day,day);assert.equal(p.adventure!.daily.scoreUsed,0);assert.deepEqual(p.adventure!.daily.scores,[]);assert.equal(records[0].attempts,1);}finally{store.close();}});

test('score guests cannot publish; battles and builds cannot be started beside another game',async()=>{const {s,store}=setup('cloud');try{await assert.rejects(()=>cmd(s,'guest','adventureStart',{mode:'score'},false));await cmd(s,'guest','adventureStart',{mode:'boss'},false);await assert.rejects(()=>cmd(s,'guest','arenaStart'));await assert.rejects(()=>cmd(s,'guest','queue'));await assert.rejects(()=>cmd(s,'guest','adventureTrain'));await assert.rejects(()=>cmd(s,'other','adventureAct',{action:{kind:'basic'}}));}finally{store.close();}});

test('same fight and choices reproduce exactly; legal actions stay bounded and all status effects end',async()=>{const {s,store}=setup();try{const p=(await s.state('a')).player;startTactic(p,'score','fixed',NOW,'test');const a=copy(p.adventure!.run!),b=copy(a);for(let i=0;i<MAX_ROUNDS&&a.phase==='fight';i++){const action=choose(a);resolveTurn(a,action);resolveTurn(b,action);assert.deepEqual(a,b);for(const u of a.teams.flat()){assert.ok(u.health>=0&&u.health<=u.maxHealth);assert.ok(u.energy>=0&&u.energy<=100);assert.ok(u.poison>=0&&u.poison<=4);}assert.ok(legalActions(a,0).length<=6);}assert.notEqual(a.phase,'fight');}finally{store.close();}});

test('switching preserves banked energy, costs the attack and has a real cooldown',async()=>{const {s,store}=setup();try{const p=(await s.state('a')).player;startTactic(p,'score','switch',NOW,'switch');const r=p.adventure!.run!;r.teams[0][0].energy=60;const hp=r.teams[1].map(u=>u.health);resolveTurn(r,{kind:'switch',target:1});assert.equal(r.active[0],1);assert.equal(r.teams[0][0].energy,60);assert.equal(r.teams[0][1].energy,0);assert.deepEqual(r.teams[1].map(u=>u.health),hp);assert.ok(!legalActions(r,0).some(a=>a.kind==='switch'));}finally{store.close();}});

test('a shield has an opportunity cost and reduces the incoming attack without granting attack energy',async()=>{const {s,store}=setup();try{const p=(await s.state('a')).player;startTactic(p,'score','shield',NOW,'shield');const r=p.adventure!.run!;r.teams[1][0]=fighter('e','dragonfly',10,['sting','burst'],'honey',1);r.teams[1][0].energy=60;const basic=copy(r),shield=copy(r);resolveTurn(basic,{kind:'basic'});resolveTurn(shield,{kind:'shield'});assert.ok(shield.teams[0][0].health>basic.teams[0][0].health);assert.equal(shield.shields[0],1);assert.equal(shield.teams[0][0].energy,0);assert.equal(basic.teams[0][0].energy,20);}finally{store.close();}});

test('poison provides an answer to heavy armor and keeps working after the target retreats',async()=>{const {s,store}=setup();try{const p=(await s.state('a')).player;startTactic(p,'score','poison',NOW,'poison');const r=p.adventure!.run!;r.teams[0][0]=fighter('venom','spider',10,['sting','venom'],'thorn',1);r.teams[0][0].energy=40;r.teams[1][0].armor=999;const hp=r.teams[1][0].health;resolveTurn(r,{kind:'skill',skill:'venom'});assert.ok(hp-r.teams[1][0].health>1);assert.ok(r.teams[1][0].poison>0);r.active[1]=1;const before=r.teams[1][0].health;resolveTurn(r,{kind:'basic'});assert.ok(r.teams[1][0].health<before);}finally{store.close();}});

test('published species odds sum to 100 percent for every chapter, duration and habitat',()=>{
 for(const stage of [1,7,8,17,18,30])for(const hours of [2,8])for(const habitat of [undefined,0,1,2,3]){
  assert.equal(Object.values(lootChances(stage,hours)).reduce((n,v)=>n+v,0),100);
  assert.ok(Math.abs(SPECIES.reduce((n,s)=>n+speciesChance(s.id,stage,habitat,hours),0)-100)<1e-8);
  for(const s of SPECIES)if(stage<RARITIES[rarityFor(s.id)].stage||habitat!==undefined&&s.habitat!==habitat)assert.equal(speciesChance(s.id,stage,habitat,hours),0);
 }
});

test('seeded finds respect unlocks and habitats, reproduce shiny status and reach all four mythics',()=>{
 const mythics=new Set<string>();let count=0;
 for(let i=0;i<2000;i++){
  const early=rollFind('early-'+i,1);assert.ok(!['rare','mythic'].includes(rarityFor(early.species)));
  const mid=rollFind('mid-'+i,8);assert.notEqual(rarityFor(mid.species),'mythic');
  const habitat=i%4,late=rollFind('late-'+i,18,habitat,8);assert.equal(SPECIES.find(s=>s.id===late.species)!.habitat,habitat);assert.deepEqual(late,rollFind('late-'+i,18,habitat,8));
  if(rarityFor(late.species)==='mythic'){count++;mythics.add(late.species);}
 }
 assert.equal(mythics.size,4);assert.ok(count>50&&count<150,'8h mythic rate should be near 5%');
});

test('all 64 species have usable roles and equal stat budgets within their role; mythics are sidegrades',()=>{
 for(const s of SPECIES){const profile=profileFor(s.id),base=ROLES[roleFor(s.id)];assert.equal(profile.skills.length,4);assert.equal(new Set(profile.skills).size,4);assert.equal(profile.health+8*profile.attack,base.health+8*base.attack);assert.equal(profile.armor,base.armor);}
 const skills=['sting','burst'] as ['sting','burst'];assert.ok(fighter('u','dragonfly',30,skills,'honey',3).attack>fighter('u','dragonfly',1,skills,'honey',1).attack);
 assert.ok(profileFor('crystalstag').skills.includes('venom'));assert.ok(profileFor('cometmoth').skills.includes('heal'));
});

test('training costs and rewards scale by progress while early training remains affordable',async()=>{
 assert.deepEqual([1,10,20,29,30].map(trainingCost),[40,220,550,1000,0]);
 const {s,store}=setup();try{for(const stage of [1,8,18]){const p=(await s.state('a')).player;p.adventure!.stage=stage;startTactic(p,'boss','reward-'+stage,NOW,'reward-'+stage);p.adventure!.run!.phase='won';finishTactic(p,NOW);assert.equal(p.adventure!.run!.reward!.parts,winMaterials(stage).parts+(p.adventure!.run!.reward!.salvage??0));assert.ok(p.adventure!.run!.reward!.nectar>=winMaterials(stage).nectar);assert.ok(p.adventure!.run!.reward!.species);}}finally{store.close();}
});

test('item upgrades enforce area gates, increasing costs, cap and idempotent spending',async()=>{
 const {s,store}=setup();try{await s.ensure('a');await store.run(['v2Players:a'],d=>{(d.get('v2Players:a') as PlayerV2).adventure!.parts=100;});await assert.rejects(()=>cmd(s,'a','adventureGear',{gear:'leaf'}));
  await store.run(['v2Players:a'],d=>{(d.get('v2Players:a') as PlayerV2).adventure!.stage=5;});let v=await s.state('a');const c={type:'adventureGear',gear:'leaf',commandId:randomUUID(),expectedRevision:v.player.revision};await s.command('a',c,true);await s.command('a',c,true);v=await s.state('a');assert.equal(v.player.adventure!.parts,90);assert.equal(v.player.adventure!.gear.leaf,2);await assert.rejects(()=>cmd(s,'a','adventureGear',{gear:'leaf'}));
  await store.run(['v2Players:a'],d=>{(d.get('v2Players:a') as PlayerV2).adventure!.stage=15;});v=await cmd(s,'a','adventureGear',{gear:'leaf'});assert.equal(v.player.adventure!.parts,60);assert.equal(v.player.adventure!.gear.leaf,3);await assert.rejects(()=>cmd(s,'a','adventureGear',{gear:'leaf'}));
 }finally{store.close();}
});

test('expedition snapshots area on departure; server owns odds, shiny and duplicate compensation',async()=>{
 const {s,store,tick}=setup();try{const v=await cmd(s,'a','expeditionStart',{habitat:1,hours:8});assert.equal(v.player.adventure!.expedition!.stage,1);for(const extra of [{stage:30},{shiny:true},{rarity:'mythic'},{species:'crystalstag'}])assert.throws(()=>parseV2({type:'expeditionStart',habitat:1,hours:8,expectedRevision:0,commandId:randomUUID(),...extra}));
  await store.run(['v2Players:a'],d=>{const p=d.get('v2Players:a') as PlayerV2;p.adventure!.stage=30;p.adventure!.expedition!.seed='frozen';p.discovered=SPECIES.map(s=>s.id);});tick(8*3600000);const before=await s.state('a'),after=await cmd(s,'a','expeditionClaim'),found=after.player.specimens.at(-1)!;assert.ok(['common','uncommon'].includes(rarityFor(found.species)));assert.equal(after.player.nectar-before.player.nectar,expeditionMaterials(1,8).nectar+duplicateNectar(found.species));assert.equal(after.player.adventure!.parts-before.player.adventure!.parts,6);
 }finally{store.close();}
});

test('existing score version rolls over without a second daily gift, erased collection or lost fight state',async()=>{
 const {s,store}=setup();try{await s.ensure('a');await store.run(['v2Players:a'],d=>{const p=d.get('v2Players:a') as PlayerV2;startTactic(p,'score','old-run',NOW,'old');p.adventure!.run!.rule='bugbaas-tactics-1';p.adventure!.daily.rule='bugbaas-tactics-1';p.adventure!.daily.scores=[123];p.adventure!.daily.fights=1;});const before=await s.state('a');assert.equal(before.player.nectar,85);assert.deepEqual(before.player.adventure!.daily.scores,[]);assert.equal(before.player.adventure!.daily.fights,1);assert.equal(before.player.adventure!.run!.rule,'bugbaas-tactics-1');const after=await cmd(s,'a','adventureForfeit');assert.deepEqual(after.player.adventure!.daily.scores,[]);assert.equal(after.player.specimens.length,5);const old=await store.query<ChallengeScore>('v2ChallengeScores');assert.equal(old[0].rule,'bugbaas-tactics-1');assert.deepEqual(after.challengeLeaderboard,[]);}finally{store.close();}
});

test('boss loot has a separate server secret; public state and chosen command IDs cannot select it',async()=>{
 const {s,store}=setup();try{
  const a=await cmd(s,'a','adventureStart',{mode:'boss'}),b=await cmd(s,'b','adventureStart',{mode:'boss'});
  assert.equal(a.player.adventure!.run!.seed,undefined);assert.equal(a.player.adventure!.run!.lootSeed,undefined);
  const runs=await store.run(['v2Players:a','v2Players:b'],d=>['a','b'].map(uid=>(d.get('v2Players:'+uid) as PlayerV2).adventure!.run!));
  assert.match(runs[0].lootSeed!,/^[a-f0-9]{64}$/);assert.notEqual(runs[0].lootSeed,runs[0].seed);assert.notEqual(runs[0].lootSeed,runs[1].lootSeed);assert.notEqual(runs[0].seed,runs[1].seed);assert.equal(b.player.adventure!.run!.lootSeed,undefined);
  assert.throws(()=>parseV2({type:'adventureStart',mode:'boss',lootSeed:'chosen',commandId:randomUUID(),expectedRevision:0}));
 }finally{store.close();}
});


test('thirty named locations are unique and all species unlock two skills at 1 then 5 and 12',()=>{
 const names=Array.from({length:30},(_,i)=>zone(i+1).name);assert.equal(new Set(names).size,30);assert.equal(names[0],'Dauwdal');assert.equal(names.at(-1),'De Oerboom');
 for(const s of SPECIES)assert.deepEqual(profileFor(s.id).skills.map(skill=>skillUnlock(s.id,skill)),[1,1,5,12]);
});

test('server rejects locked skills and unowned gear; old low-level builds retain legal selections',async()=>{
 const {s,store}=setup();try{let v=await s.state('a');const build=v.player.adventure!.build,locked=profileFor('dragonfly').skills[2];
 await assert.rejects(()=>cmd(s,'a','adventureBuild',{build:[{...build[0],skills:['sting',locked]},...build.slice(1)]}));
 await assert.rejects(()=>cmd(s,'a','adventureBuild',{build:[{...build[0],gear:'moon'},...build.slice(1)]}));
 await store.run(['v2Players:a'],d=>{const p=d.get('v2Players:a') as PlayerV2;p.adventure!.level=5;});
 v=await cmd(s,'a','adventureBuild',{build:[{...build[0],skills:['sting',locked]},...build.slice(1)]});assert.equal(v.player.adventure!.build[0].skills[1],locked);
 const old=copy(v.player);old.adventure!.level=1;delete old.adventure!.gearOwned;ensureAdventure(old,NOW);assert.deepEqual(old.adventure!.build[0].skills,['sting','burst']);assert.ok(old.adventure!.gearOwned!.includes('wing'));
 }finally{store.close();}
});

test('free score builds allow all species and items without ownership while power stays 10/I/I',async()=>{
 const {s,store}=setup();try{const before=(await s.state('a')).player;
 const build=['ambermantis','crystalstag','cometmoth'].map((id,i)=>({species:id,skills:profileFor(id).skills.slice(2),gear:ALL_GEARS[i+4]}));
 let v=await cmd(s,'a','adventureBuild',{mode:'score',build});assert.deepEqual(v.player.adventure!.build,before.adventure!.build);assert.deepEqual(v.player.discovered,before.discovered);assert.deepEqual(v.player.adventure!.gearOwned,before.adventure!.gearOwned);
 await store.run(['v2Players:a'],d=>{const p=d.get('v2Players:a') as PlayerV2;p.adventure!.mastery={venom:3,heal:3,crush:3};});v=await cmd(s,'a','adventureStart',{mode:'score'});
 assert.ok(v.player.adventure!.run!.teams[0].every(u=>u.level===10&&u.grade===1&&u.skills.every(skill=>skillRank(u,skill)===1)));
 assert.deepEqual(v.player.adventure!.run!.teams[0].map(u=>u.species),build.map(b=>b.species));
 assert.throws(()=>parseV2({type:'skillTrain',skill:'sting',rank:3,commandId:randomUUID(),expectedRevision:0}));
 assert.throws(()=>parseV2({type:'gearCraft',gear:'moon',cost:0,commandId:randomUUID(),expectedRevision:0}));
 }finally{store.close();}
});

test('skill upgrades enforce levels and materials, charge once on concurrent retry, and cap at III',async()=>{
 const {s,store}=setup();try{await s.state('a');await assert.rejects(()=>cmd(s,'a','skillTrain',{skill:'sting'}));
 await store.run(['v2Players:a'],d=>{const p=d.get('v2Players:a') as PlayerV2;p.adventure!.level=10;p.nectar=1000;p.adventure!.parts=100;});
 let v=await s.state('a');const c={type:'skillTrain',skill:'sting',commandId:randomUUID(),expectedRevision:v.player.revision};await Promise.all([s.command('a',c,true),s.command('a',c,true)]);
 v=await s.state('a');assert.equal(v.player.nectar,940);assert.equal(v.player.adventure!.parts,90);assert.equal(v.player.adventure!.mastery!.sting,2);await assert.rejects(()=>cmd(s,'a','skillTrain',{skill:'sting'}));
 await store.run(['v2Players:a'],d=>{(d.get('v2Players:a') as PlayerV2).adventure!.level=20;});v=await cmd(s,'a','skillTrain',{skill:'sting'});assert.equal(v.player.nectar,780);assert.equal(v.player.adventure!.parts,65);assert.equal(v.player.adventure!.mastery!.sting,3);await assert.rejects(()=>cmd(s,'a','skillTrain',{skill:'sting'}));
 await store.run(['v2Players:a'],d=>{(d.get('v2Players:a') as PlayerV2).adventure!.parts=0;});await assert.rejects(()=>cmd(s,'a','skillTrain',{skill:'burst'}));
 }finally{store.close();}
});

function combatFor(source:PlayerV2){const p=copy(source);p.adventure!.run=null;startTactic(p,'score','gear-test',NOW,'gear-test');const r=p.adventure!.run!;r.teams[0][0]=fighter('own','dragonfly',10,['sting','burst'],'honey',1);r.teams[1][0]=fighter('target','beetle',30,['sting','fortify'],'honey',1);r.teams[1][0].health=r.teams[1][0].maxHealth=1000;return r;}

test('mastery improves real skill damage; moon changes legal energy threshold and sun trades health for damage',async()=>{
 const {s,store}=setup();try{const p=(await s.state('a')).player,base=combatFor(p),trained=copy(base),sun=copy(base);
 for(const r of [base,trained,sun])r.teams[0][0].energy=60;trained.teams[0][0].mastery={burst:3};sun.teams[0][0]=fighter('own','dragonfly',10,['sting','burst'],'sun',3);sun.teams[0][0].energy=60;
 for(const r of [base,trained,sun])resolveTurn(r,{kind:'skill',skill:'burst'});assert.ok(trained.teams[1][0].health<base.teams[1][0].health);assert.ok(sun.teams[1][0].health<base.teams[1][0].health);assert.ok(sun.teams[0][0].maxHealth<base.teams[0][0].maxHealth);
 const moon=combatFor(copy(p));moon.teams[0][0].gear='moon';moon.teams[0][0].energy=27;assert.equal(skillEnergy(moon.teams[0][0],'sting'),27);assert.ok(legalActions(moon,0).some(a=>a.skill==='sting'));resolveTurn(moon,{kind:'skill',skill:'sting'});assert.equal(moon.teams[0][0].energy,0);
 }finally{store.close();}
});

test('bark protects exactly one harmful skill; dew improves real healing with an attack tradeoff',async()=>{
 const {s,store}=setup();try{const p=(await s.state('a')).player,r=combatFor(p);r.teams[0][0].energy=100;r.teams[1][0].gear='bark';r.teams[1][0].grade=1;resolveTurn(r,{kind:'skill',skill:'sting'});assert.equal(r.teams[1][0].wardUsed,true);const first=r.events.filter(e=>e.target==='target'&&e.kind==='damage')[0].amount;r.teams[1][0].energy=0;resolveTurn(r,{kind:'skill',skill:'sting'});const second=r.events.filter(e=>e.target==='target'&&e.kind==='damage')[0].amount;assert.ok(second>first);
 const plain=combatFor(copy(p)),dew=copy(plain);plain.teams[0][0]=fighter('own','ladybug',10,['sting','heal'],'honey',1);dew.teams[0][0]=fighter('own','ladybug',10,['sting','heal'],'dew',1);
 for(const run of [plain,dew]){run.teams[0][0].health=20;run.teams[0][0].energy=40;resolveTurn(run,{kind:'skill',skill:'heal'});}
 assert.ok(dew.events.find(e=>e.kind==='heal')!.amount>plain.events.find(e=>e.kind==='heal')!.amount);assert.ok(dew.teams[0][0].attack<plain.teams[0][0].attack);
 for(const run of [plain,dew]){const g=run===plain?'honey':'dew';run.teams[0][0]=fighter('own','ladybug',10,['sting','heal'],g,3);run.teams[0][0].health=1;run.teams[0][0].energy=40;run.teams[1][0].energy=0;resolveTurn(run,{kind:'skill',skill:'heal'});}assert.ok(dew.events.find(e=>e.kind==='heal')!.amount>plain.events.find(e=>e.kind==='heal')!.amount);
 }finally{store.close();}
});

test('published per-item odds sum to the source rate and seeded rolls respect phase gates',()=>{
 for(const stage of [1,8,18,30])for(const hours of [0,2,8]){assert.equal(Object.values(equipmentWeights(stage)).reduce((n,v)=>n+v,0),100);assert.ok(Math.abs(ALL_GEARS.reduce((sum,g)=>sum+equipmentChance(g,stage,hours),0)-equipmentRollChance(hours)*100)<1e-10);}
 assert.equal(equipmentChance('moon',18),100/160);assert.equal(equipmentChance('moon',18,8),100/40);assert.equal(equipmentChance('moon',8),0);
 let hits=0;const kinds=new Set<string>();for(let i=0;i<4000;i++){const early=rollEquipment('early-'+i,1,8);if(early)assert.ok(GEARS[early].stage===1);const result=rollEquipment('late-'+i,18,8);assert.equal(result,rollEquipment('late-'+i,18,8));if(result){hits++;kinds.add(result);}}
 assert.equal(kinds.size,8);assert.ok(hits>1800&&hits<2200);
});

test('crafting and duplicate items use parts without granting rarity stats; ownership and gates cannot be bypassed',async()=>{
 const {s,store}=setup();try{await s.state('a');await store.run(['v2Players:a'],d=>{(d.get('v2Players:a') as PlayerV2).adventure!.parts=500;});await assert.rejects(()=>cmd(s,'a','gearCraft',{gear:'moon'}));await assert.rejects(()=>cmd(s,'a','adventureGear',{gear:'thorn'}));
 let v=await cmd(s,'a','gearCraft',{gear:'thorn'});assert.equal(v.player.adventure!.parts,480);assert.ok(v.player.adventure!.gearOwned!.includes('thorn'));await assert.rejects(()=>cmd(s,'a','gearCraft',{gear:'thorn'}));
 const p=copy(v.player);const added=awardEquipment(p,'thorn',NOW);assert.equal(added.parts,3);assert.equal(p.adventure!.parts,483);assert.equal(p.adventure!.gearOwned!.filter(g=>g==='thorn').length,1);
 await store.run(['v2Players:a'],d=>{(d.get('v2Players:a') as PlayerV2).adventure!.stage=18;});v=await s.state('a');const c={type:'gearCraft',gear:'moon',commandId:randomUUID(),expectedRevision:v.player.revision};await Promise.all([s.command('a',c,true),s.command('a',c,true)]);v=await s.state('a');assert.equal(v.player.adventure!.parts,320);assert.equal(v.player.adventure!.gear.moon,1);
 }finally{store.close();}
});

test('first Dauwdal win grants Windveer once; claiming the same result cannot roll or pay again',async()=>{
 const {s,store}=setup();try{let v=await cmd(s,'a','adventureStart',{mode:'boss'});await store.run(['v2Players:a'],d=>{const p=d.get('v2Players:a') as PlayerV2;p.adventure!.run!.teams[1].forEach(u=>u.health=0);});
 v=await cmd(s,'a','adventureAct',{action:{kind:'basic'}});assert.equal(v.player.adventure!.run!.reward!.gear,'wing');assert.equal(v.player.adventure!.wingGift,true);assert.ok(v.player.adventure!.gearOwned!.includes('wing'));const parts=v.player.adventure!.parts,nectar=v.player.nectar;
 await assert.rejects(()=>cmd(s,'a','adventureAct',{action:{kind:'basic'}}));v=await s.state('a');assert.equal(v.player.nectar,nectar);assert.equal(v.player.adventure!.parts,parts);
 }finally{store.close();}
});


test('each area has a fixed valid team; boss item milestones respect rarity unlocks',()=>{
 for(let stage=1;stage<=30;stage++){const e=encounterFor(stage);assert.deepEqual(e,encounterFor(stage));assert.equal(new Set(e.team).size,3);assert.ok(e.team.every(id=>SPECIES.some(s=>s.id===id)));assert.equal(e.boss,stage%5===0);if(e.item)assert.ok(GEARS[e.item].stage<=stage);}
 assert.equal(encounterFor(5).item,'thorn');assert.equal(encounterFor(10).item,'dew');assert.equal(encounterFor(20).item,'moon');assert.equal(encounterFor(25).item,'sun');
});

test('locked areas and injected score stages are rejected without spending an attempt or changing resources',async()=>{const {s,store}=setup();try{
 const before=(await s.state('a')).player;
 for(const stage of [0,2,31,1.5,'1',null])await assert.rejects(()=>cmd(s,'a','adventureStart',{mode:'boss',stage}));
 await assert.rejects(()=>cmd(s,'a','adventureStart',{mode:'score',stage:1}));
 const after=(await s.state('a')).player;assert.equal(after.nectar,before.nectar);assert.equal(after.adventure!.daily.scoreUsed,0);assert.equal(after.adventure!.run,null);
}finally{store.close();}});

test('public forecasts match committed server turns without mutating the fight or exposing reward seeds',async()=>{const {s,store}=setup();try{
 let v=await cmd(s,'a','adventureStart',{mode:'score'});const r=v.player.adventure!.run!,before=JSON.stringify(r),prediction=previewAction(r,{kind:'basic'})!;
 assert.ok(r.intent);assert.equal(r.seed,undefined);assert.equal(r.lootSeed,undefined);assert.equal(JSON.stringify(r),before);
 await assert.rejects(()=>cmd(s,'a','adventureAct',{action:{kind:'basic',intent:{kind:'shield'}}}));
 v=await cmd(s,'a','adventureAct',{action:{kind:'basic'}});const events=v.player.adventure!.run!.events;
 assert.equal(prediction.damage,events.filter(e=>e.side===1&&e.kind==='damage').reduce((n,e)=>n+e.amount,0));assert.equal(prediction.incoming,events.filter(e=>e.side===0&&e.kind==='damage').reduce((n,e)=>n+e.amount,0));
 const reloaded=await s.state('a');assert.deepEqual(reloaded.player.adventure!.run!.intent,v.player.adventure!.run!.intent);
}finally{store.close();}});

test('a planned heavy attack can be answered deliberately; previews include the shield opportunity cost',async()=>{const {s,store}=setup();try{
 const p=(await s.state('a')).player;startTactic(p,'score','threat',NOW,'threat');const r=p.adventure!.run!;r.teams[1][0]=fighter('threat','dragonfly',10,['sting','burst'],'honey',1);r.teams[1][0].energy=60;r.intent={kind:'skill',skill:'burst'};
 const before=JSON.stringify(r),attack=previewAction(r,{kind:'basic'})!,shield=previewAction(r,{kind:'shield'})!;assert.ok(shield.incoming<attack.incoming/2);assert.equal(shield.damage,0);assert.ok(attack.damage>0);assert.equal(JSON.stringify(r),before);
}finally{store.close();}});

test('replaying an area gives normal finds, keeps the furthest unlock, and never lowers mastery or repeats a guaranteed boss item',async()=>{const {s,store}=setup();try{
 await s.ensure('a');await store.run(['v2Players:a'],d=>{const p=d.get('v2Players:a') as PlayerV2;p.adventure!.stage=5;p.adventure!.level=10;});
 const win=async()=>{let v=await cmd(s,'a','adventureStart',{mode:'boss',stage:5});await store.run(['v2Players:a'],d=>{const r=(d.get('v2Players:a') as PlayerV2).adventure!.run!;r.teams[1].forEach(u=>{u.health=u.maxHealth=1;u.attack=1;});for(let i=0;i<100;i++){const seed='no-extra-item-'+i;if(!rollEquipment(seed+':equipment:'+r.id,5)){r.lootSeed=seed;break;}}});let last:Record<string,unknown>={};for(let i=0;i<3;i++){v=await s.state('a');last={type:'adventureAct',action:{kind:'basic'},commandId:randomUUID(),expectedRevision:v.player.revision};v=await s.command('a',last,true);}return {v,last};};
 const first=await win();assert.equal(first.v.player.adventure!.stage,6);assert.equal(first.v.player.adventure!.areaStars!['5'],3);assert.equal(first.v.player.adventure!.run!.reward!.gear,'thorn');assert.equal(first.v.player.adventure!.run!.reward!.firstClear,true);
 const retried=await s.command('a',first.last,true);assert.equal(retried.player.nectar,first.v.player.nectar);assert.equal(retried.player.specimens.length,first.v.player.specimens.length);
 await cmd(s,'a','adventureClose');const second=await win();assert.equal(second.v.player.adventure!.stage,6);assert.equal(second.v.player.specimens.length,first.v.player.specimens.length+1);assert.equal(second.v.player.adventure!.areaStars!['5'],3);assert.equal(second.v.player.adventure!.run!.reward!.firstClear,false);assert.equal(second.v.player.adventure!.run!.reward!.gear,undefined);
}finally{store.close();}});

test('mastery rewards tempo and survival; an older ongoing fight can still finish',async()=>{assert.equal(masteryStars(false,5,3),0);assert.equal(masteryStars(true,20,2),1);assert.equal(masteryStars(true,18,2),2);assert.equal(masteryStars(true,20,3),2);assert.equal(masteryStars(true,18,3),3);const {s,store}=setup();try{
 const p=(await s.state('a')).player;startTactic(p,'boss','old-rules',NOW,'old');const r=p.adventure!.run!;r.rule='bugbaas-tactics-3';delete r.intent;resolveTurn(r,{kind:'basic'});assert.equal(r.round,2);assert.equal(r.intent,undefined);
}finally{store.close();}});

test('build feedback flags missing item synergy while safe alternatives remain usable',()=>{assert.equal(buildAdvice(['sting','burst'],'thorn').warning,true);assert.equal(buildAdvice(['sting','venom'],'thorn').warning,false);assert.equal(buildAdvice(['sting','burst'],'dew').warning,true);assert.equal(buildAdvice(['sting','heal'],'dew').warning,false);assert.equal(buildAdvice(['heal','cleanse'],'sun').warning,true);assert.equal(buildAdvice(['sting','burst'],'honey').warning,false);});


test('a counter-build can defeat the final boss where basic attack spam fails at the same progression',async()=>{const {s,store}=setup();try{const original=(await s.state('a')).player;
 const play=(tailored:boolean)=>{const p=copy(original),a=p.adventure!;a.stage=30;a.level=30;for(const g of ALL_GEARS)a.gear[g]=3;a.mastery=Object.fromEntries(Object.keys(SKILLS).map(k=>[k,3]));
 if(tailored){const choices=[{species:'aphid',skills:['sting','venom'],gear:'thorn'},{species:'ant',skills:['crush','burst'],gear:'honey'},{species:'dragonfly',skills:['sting','burst'],gear:'wing'}] as const;a.build=choices.map((c,i)=>{const id='counter-'+i;p.specimens.push({...p.specimens[0],id,species:c.species});return {specimen:id,skills:[...c.skills],gear:c.gear};});}
 startTactic(p,'boss','comparison',NOW,'balance-case-30');const r=a.run!;while(r.phase==='fight'){let action:TacticAction={kind:'basic'};if(tailored){const actions=legalActions(r,0),enemy=r.teams[1][r.active[1]];action=actions.find(v=>v.skill==='venom'&&!enemy.poison)??actions.find(v=>v.skill==='crush'&&!enemy.broken&&enemy.armor>=5)??actions.find(v=>v.skill==='burst')??actions.find(v=>v.skill==='sting')??action;if(r.intent?.kind==='shield')action={kind:'basic'};}resolveTurn(r,action);}return r;};
 assert.equal(play(false).phase,'lost');const winner=play(true);assert.equal(winner.phase,'won');assert.ok(winner.round<turnLimit(winner));
}finally{store.close();}});
