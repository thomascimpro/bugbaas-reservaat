import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,rollGoBug,FAST,CHARGED,movePool,stats} from '../game/goV2';
import {DEX_SPECIES} from '../game/dexV2';
import {levelXP} from '../game/trainerV2';
import {claimGoDaily} from '../game/dailyResearchV2';
import {awardPostResearch,ensurePostResearch,finishPostResearch,POST_RESEARCH,postTaskProgress} from '../game/postResearchV2';
import {teamPreset} from '../game/teamPresetsV2';
import {postBossChallenge,makeBossBattle,settleBoss,ensureBosses} from '../game/goBossV2';
import {locate,wildSeed} from '../game/walkingV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import type {PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,9,27,12),FIX={lat:51.4416,lng:5.4697,accuracy:5,timestamp:NOW};
function player(){const p=freshV2('field-build-qa','BUILD123',NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);ensureBosses(p,NOW);p.go!.trainer!.xp=levelXP(20);p.specimens=['ant','beetle','moth','mantis'].map((species,i)=>({id:'bug-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,'build-'+i),level:35,fast:'fury' as const,charged:['cut' as const,'buzz' as const]}}));p.go!.team=p.specimens.slice(0,3).map(s=>s.id);return p;}
function taskFor(p:PlayerV2,template:number){for(let i=0;i<200;i++){const task=awardPostResearch(p,'post-'+i,NOW);if(task?.template===template)return task;const g=ensurePostResearch(p);g.tasks=[];}throw Error('No fixture template');}

test('post research is deterministic per post/day, capped at three and cannot reroll after discarding',()=>{
 const a=player(),b=player();b.uid='other';assert.deepEqual(awardPostResearch(a,'same-post',NOW),awardPostResearch(b,'same-post',NOW));
 awardPostResearch(a,'second',NOW);awardPostResearch(a,'third',NOW);assert.equal(awardPostResearch(a,'fourth',NOW),null);const first=a.go!.research!.tasks[0];finishPostResearch(a,first.id,true,NOW);assert.equal(awardPostResearch(a,'same-post',NOW),null);assert.ok(awardPostResearch(a,'fourth',NOW));
 ensureField(a,NOW+86400000);assert.equal(ensurePostResearch(a).tasks.length,0);assert.ok(awardPostResearch(a,'same-post',NOW+86400000));
});
test('post research counts only subsequent progress and shares one daily stamp with fixed tasks',()=>{
 const p=player();p.field!.total.catches=20;const task=taskFor(p,0),before=p.go!.dust;assert.equal(postTaskProgress(p,task),0);assert.throws(()=>finishPostResearch(p,task.id,false,NOW));p.field!.total.catches+=3;assert.equal(postTaskProgress(p,task),3);finishPostResearch(p,task.id,false,NOW);assert.equal(p.go!.dust,before+POST_RESEARCH[0].dust);assert.throws(()=>finishPostResearch(p,task.id,false,NOW));p.field!.daily.catches=3;claimGoDaily(p,'catch');assert.equal(p.go!.trainer!.research!.stamps,1);
 const walk=taskFor(p,5);p.field!.walk={meters:499,dayMeters:499,anchor:FIX,at:NOW};assert.equal(postTaskProgress(p,walk),499);p.field!.walk.meters=700;assert.equal(postTaskProgress(p,walk),500);
});
test('post visits research requires different posts after acceptance, not the issuing spin',()=>{
 const p=player();p.go!.sites={visits:{old:NOW-5000,issuer:NOW},firstDay:'',routeClaims:[],run:null};const task=taskFor(p,6);assert.equal(postTaskProgress(p,task),0);p.go!.sites.visits.issuer=NOW+1000;assert.equal(postTaskProgress(p,task),1);p.go!.sites.visits.issuer=NOW+2000;assert.equal(postTaskProgress(p,task),1);p.go!.sites.visits.next=NOW+3000;assert.equal(postTaskProgress(p,task),2);
});
test('team presets copy slots, revalidate ownership and CP, and cannot alter items or levels',()=>{
 const p=player();p.specimens.forEach(s=>s.go!.level=1);const ids=[...p.go!.team],before=structuredClone(p.specimens);teamPreset(p,'save','great',0,ids);ids.reverse();assert.deepEqual(p.go!.teamPresets!.great![0],p.go!.team);p.go!.team=['bug-3','bug-2','bug-1'];teamPreset(p,'load','great',0,undefined);assert.deepEqual(p.go!.team,['bug-0','bug-1','bug-2']);assert.deepEqual(p.specimens,before);assert.throws(()=>teamPreset(p,'save','great',3,ids));assert.throws(()=>teamPreset(p,'save','great',1,['bug-0','bug-0','bug-1']));p.specimens=p.specimens.filter(s=>s.id!=='bug-0');assert.throws(()=>teamPreset(p,'load','great',0,undefined));
});
test('expanded attack kits are valid for every form and retain existing moves with distinct energy tradeoffs',()=>{
 assert.equal(Object.keys(FAST).length,24);assert.equal(Object.keys(CHARGED).length,23);const sets=new Set<string>();
 for(const s of DEX_SPECIES){const p=movePool(s.id);sets.add(JSON.stringify(p));assert.equal(new Set(p.fast).size,p.fast.length);assert.equal(new Set(p.charged).size,p.charged.length);assert.ok(p.fast.length>=3);for(const f of p.fast)assert.ok(FAST[f].turns>=1&&FAST[f].energy>0);for(const m of p.charged)assert.ok(CHARGED[m].energy>=30&&CHARGED[m].energy<=70);}
 assert.ok(sets.size>25);for(const id of ['bite','fury'])assert.ok(movePool('ant').fast.includes(id as 'bite'));assert.ok(FAST.siphon.energy/FAST.siphon.turns>FAST.claw.energy/FAST.claw.turns);assert.ok(FAST.siphon.power/FAST.siphon.turns<FAST.claw.power/FAST.claw.turns);
});
test('map boss requires real nearby GPS and is fixed per post/day with no duplicate reward',()=>{
 const p=player(),post={id:'boss-post',name:'Kaartpost',lat:FIX.lat,lng:FIX.lng,source:'virtual' as const};locate(p,FIX,'walk',NOW);p.walking!.posts=[post];const c=postBossChallenge(post.id,NOW);assert.deepEqual(postBossChallenge(post.id,NOW),c);assert.throws(()=>makeBossBattle(p,c.difficulty,'bad',NOW+31000,post,'private'));
 const b=makeBossBattle(p,c.difficulty,'boss-once',NOW,post,'private');assert.equal(b.league,'master');assert.equal(p.go!.league,'great');b.phase='finished';b.winner=0;assert.ok(settleBoss(p,b,NOW)!.rewarded);assert.equal(settleBoss(p,b,NOW),null);assert.equal(p.walking!.spawns.filter(s=>s.source==='boss').length,1);assert.throws(()=>makeBossBattle(p,c.difficulty,'again',NOW,post,'private'));
 const bonus=p.walking!.spawns.find(s=>s.source==='boss')!,seed=wildSeed(p.walking!,bonus);locate(p,{...FIX,lat:FIX.lat+.003,timestamp:NOW+180000},'new-walk',NOW+180000);assert.equal(wildSeed(p.walking!,p.walking!.spawns.find(s=>s.id===bonus.id)!),seed);assert.ok(p.walking!.spawns.some(s=>s.id===bonus.id));
});
test('a real map boss fight unlocks a private-seeded capture, exactly once, with stable CP and saved catch place',async()=>{
 const store=new SqliteStore(':memory:');let now=NOW;const uid='post-boss-flow',service=new GoServiceV2(store,'local',()=>now);try{
  await service.state(uid);let postId='';for(let i=0;i<100;i++)if(postBossChallenge('post-'+i,NOW).difficulty==='early'){postId='post-'+i;break;}const post={id:postId,name:'Kaartpost',lat:FIX.lat,lng:FIX.lng,source:'virtual' as const};
  await store.run(['v2Players:'+uid],d=>{const p=player();p.uid=uid;locate(p,FIX,'world-secret',now);p.walking!.posts=[post];p.field!.inventory.royal=1;d.set('v2Players:'+uid,p);});let v=await service.state(uid);const send=async(type:string,params:Record<string,unknown>={})=>v=await service.command(uid,{type,...params,commandId:randomUUID(),expectedRevision:v.player.revision});const c=postBossChallenge(post.id,now);await send('goBoss',{post:post.id,difficulty:c.difficulty,ids:['bug-0','bug-1','bug-2']});assert.equal(v.goBattle!.boss!.catchSeed,undefined);
  for(let i=0;i<600&&v.goBattle?.phase!=='finished';i++){now+=500;v=await service.state(uid);const b=v.goBattle!,a=b.teams[0][b.active[0]];
   if(b.phase==='finished')break;if(b.phase==='charge'){if(b.charge!.side===0){for(let j=0;j<8;j++)if(!v.goBattle!.charge!.hits.includes(j)){now+=130;await send('goAct',{action:'chargeTap',value:j});}}else if(b.charge!.shield===null)await send('goAct',{action:'shield',value:b.shields[0]>0});continue;}
   if(a.hp<=0){const next=b.teams[0].findIndex(f=>f.hp>0);if(next>=0&&!b.replaceAt.some(Boolean))await send('goAct',{action:'switch',value:next});}
   else if(b.phase==='fight'&&!b.replaceAt.some(Boolean)&&a.readyAt<=now&&!b.fast[0]){const move=a.go.charged.find(m=>CHARGED[m].energy<=a.energy);await send('goAct',{action:move?'charged':'fast',value:move??null});}
  }
  assert.equal(v.goBattle!.winner,0);const spawn=v.player.walking!.spawns.find(s=>s.source==='boss')!;assert.ok(spawn);assert.equal(spawn.boss!.seed,undefined);await send('goClose');now+=2000;await send('worldLocate',{fix:{...FIX,timestamp:now}});await send('worldEncounter',{spawn:spawn.id});const cp=v.player.field!.encounter!.cp,count=v.player.specimens.length;now+=500;const cast={type:'worldCast',commandId:randomUUID(),expectedRevision:v.player.revision,encounter:v.player.field!.encounter!.id,net:'royal',bait:null,trace:{kind:'flick',points:[{x:.5,y:1,t:0},{x:.5,y:.85,t:90},{x:.5,y:.7,t:180}]}};v=await service.command(uid,cast);const again=await service.command(uid,cast);assert.equal(v.player.field!.lastCast!.outcome,'caught');assert.equal(again.player.specimens.length,count+1);const bug=v.player.specimens.at(-1)!;assert.equal(stats(bug).cp,cp);assert.equal(bug.go!.level,10);assert.ok(bug.go!.iv.every(n=>n>=10));assert.deepEqual(bug.catchLocation,{lat:FIX.lat,lng:FIX.lng,boss:true});assert.equal(bug.obtainedAt,now);assert.equal(v.player.go!.league,'great');
 }finally{store.close();}
});
