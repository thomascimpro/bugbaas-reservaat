import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,randomUUID} from 'node:crypto';
import {freshV2} from '../game/safariV2';
import {ensureGo,rollGoBug,family} from '../game/goV2';
import {ensureField} from '../game/fieldV2';
import {ensurePlaag,makePlaagBattle,invasionAt} from '../game/plaagbendeV2';
import {ensureCrewEncounter,resolveCrew} from '../game/arcade/crew';
import {replayArcade} from '../game/arcade/games';
import {playOriginalTap as play} from './originalArcadeDriver';
import type {GoBattle} from '../game/goBattleV2';
import type {PlayerV2} from '../game/typesV2';
import {locate} from '../game/walkingV2';
import {gymCandidate} from '../game/worldSitesV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';

const NOW=Date.UTC(2026,10,3,12),KEY='crew-test-key',TOKEN=(s:string)=>createHmac('sha256',KEY).update(s).digest('base64url').slice(0,22),FIX={lat:51.4,lng:5.4,accuracy:5,timestamp:NOW};
function player(){const p=freshV2('crew-player','CREWPLAY',NOW);ensureField(p,NOW);ensureGo(p,NOW);p.onboarded=true;p.specimens=['ant','moth','beetle'].map((species,i)=>({id:'crew-bug-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,'crew-test-'+i),level:10}}));p.go!.team=p.specimens.map(b=>b.id);locate(p,FIX,'crew-world',NOW);return p;}
function balloon(p:PlayerV2,game:'tap_duel'|'combat',salt=0){for(let i=salt*1000;i<(salt+1)*1000;i++){const id='crew-balloon-'+i,source={id,kind:'balloon' as const,type:'grass' as const,expiresAt:NOW+3*3600000},crew=ensureCrewEncounter(p,source,TOKEN);if(crew.game===game){ensurePlaag(p).balloon={id,type:'grass',lat:FIX.lat,lng:FIX.lng,at:NOW,until:source.expiresAt};return crew;}delete p.go!.plaagbende!.encounters![id];}throw Error('no fixture');}
async function setup(){const store=new SqliteStore(':memory:'),clock={now:NOW},service=new GoServiceV2(store,'local',()=>clock.now),p=player();balloon(p,'tap_duel');await store.run(['v2RaidSecret:global','v2Players:'+p.uid],d=>{d.set('v2RaidSecret:global',{key:KEY});d.set('v2Players:'+p.uid,p);});let view=await service.state(p.uid);return {store,clock,service,get view(){return view;},async refresh(){view=await service.state(p.uid);return view;},async send(type:string,params:Record<string,unknown>={},commandId=randomUUID()){view=await service.command(p.uid,{type,...params,commandId,expectedRevision:view.player.revision});return view;}};}

test('first appearance freezes faction, game, tier and shiny; supplied IDs and distant posts cannot create encounters',()=>{
 const p=player(),first=balloon(p,'tap_duel'),before=structuredClone(first);p.go!.trainer!.xp=500000;p.specimens[0].go!.level=50;assert.deepEqual(resolveCrew(p,'balloon',NOW,TOKEN),before);assert.throws(()=>resolveCrew(p,'invented-post',NOW,TOKEN),/niet in de buurt/);
 let post='',gym='';for(let i=0;!post||!gym;i++){const id='crew-post-'+i;if(gymCandidate(id))gym=id;else if(invasionAt(id,NOW,TOKEN))post=id;}
 p.walking!.posts=[{id:gym,name:'Gym',lat:FIX.lat,lng:FIX.lng,source:'osm'},{id:post,name:'Post',lat:FIX.lat+.01,lng:FIX.lng,source:'osm'}];assert.throws(()=>resolveCrew(p,post,NOW,TOKEN),/100 meter/);p.walking!.posts[1].lat=FIX.lat;const valid=resolveCrew(p,post,NOW,TOKEN);assert.equal(valid.kind,'post');assert.equal(valid.postId,post);assert.equal(valid.tier,3);
});

test('crew goal ends local play immediately; replay pays250/100/one level10 rescue/three nectar once, with no Arcade progress',async()=>{
 const b=await setup();try{const before=structuredClone(b.view.player),v=await b.send('plaagArcadeStart',{target:'balloon',ids:before.go!.team,league:'great'}),t=v.arcadeTicket!,played=play(t);assert.equal(t.rules,'tap_duel-2');assert.equal(played.state.endReason,'target_score',`Original Tikduel score ${played.state.score}, crew goal ${t.crew!.targetScore}`);assert.ok(played.state.tick<1500);assert.deepEqual(replayArcade(t,played.inputs).state,played.state);await assert.rejects(b.send('arcadeSubmit',{run:t.id,format:'original-2',inputs:played.inputs}),/nog niet afgelopen/);b.clock.now+=played.state.tick*20;
  const result=await b.send('arcadeSubmit',{run:t.id,inputs:played.inputs}),p=result.player,r=p.arcade!.last!,rescued=p.specimens.at(-1)!;assert.equal(r.won,true);assert.equal(r.dust,250);assert.equal(r.xp,100);assert.equal(p.go!.dust-before.go!.dust,250);assert.equal(p.go!.trainer!.xp-before.go!.trainer!.xp,100);assert.equal(p.specimens.length,before.specimens.length+1);assert.equal(rescued.go!.level,10);assert.ok(rescued.go!.iv.every(v=>v>=0&&v<=15));assert.equal(rescued.shiny,t.crew!.shiny);assert.equal((p.go!.candy[family(rescued.species)]??0)-(before.go!.candy[family(rescued.species)]??0),3);
  assert.equal(p.arcade!.completed,before.arcade!.completed);assert.equal(p.arcade!.rewarded,0);assert.deepEqual(p.arcade!.games,before.arcade!.games);assert.equal(p.arcade!.rotationIndex,before.arcade!.rotationIndex);assert.deepEqual(p.arcade!.week,before.arcade!.week);assert.equal(p.go!.plaagbende!.arcadeReward!.wins,1);
  await b.send('arcadeSubmit',{run:t.id,inputs:[]});assert.equal(b.view.player.go!.dust,p.go!.dust);assert.equal(b.view.player.specimens.length,p.specimens.length);await assert.rejects(b.send('plaagArcadeStart',{target:'balloon',ids:before.go!.team,league:'great'}),/weggevlogen/);
 }finally{b.store.close();}
});

test('a loss retries the identical encounter and seed; the fourth distinct win is explicit practice without a rescue',async()=>{
 const b=await setup();try{const first=await b.send('plaagArcadeStart',{target:'balloon',ids:b.view.player.go!.team,league:'great'}),t=first.arcadeTicket!;b.clock.now+=45000;await b.send('arcadeSubmit',{run:t.id,inputs:[]});assert.equal(b.view.player.arcade!.last!.won,false);assert.equal(b.view.player.go!.plaagbende!.arcadeReward!.wins,0);const retry=await b.send('plaagArcadeStart',{target:'balloon',ids:b.view.player.go!.team,league:'great'});assert.deepEqual(retry.arcadeTicket!.crew,t.crew);assert.equal(retry.arcadeTicket!.seed,t.seed);await b.send('arcadeAbandon',{run:retry.arcadeTicket!.id});
  const before=structuredClone(b.view.player);for(let index=0;index<4;index++){if(index){await b.store.run(['v2Players:'+before.uid],d=>{const p=d.get('v2Players:'+before.uid) as PlayerV2;balloon(p,'tap_duel',index);});await b.refresh();}const start=await b.send('plaagArcadeStart',{target:'balloon',ids:before.go!.team,league:'great'}),ticket=start.arcadeTicket!,played=play(ticket);assert.equal(ticket.crew!.practice,index===3);b.clock.now+=45000;await b.send('arcadeSubmit',{run:ticket.id,inputs:played.inputs});assert.equal(b.view.player.arcade!.last!.crew!.rewarded,index<3);}
  assert.equal(b.view.player.go!.dust-before.go!.dust,750);assert.equal(b.view.player.go!.trainer!.xp-before.go!.trainer!.xp,300);assert.equal(b.view.player.specimens.length-before.specimens.length,3);assert.equal(b.view.player.go!.plaagbende!.arcadeReward!.wins,3);assert.equal(b.view.player.arcade!.rewarded,0);
 }finally{b.store.close();}
});

test('new leaders use fixed tierCP and the crew budget; an old stored Plaag battle retains its reward contract',async()=>{
 const b=await setup();try{await b.store.run(['v2Players:'+b.view.player.uid],d=>{const p=d.get('v2Players:'+b.view.player.uid) as PlayerV2;balloon(p,'combat');});await b.refresh();await assert.rejects(b.send('plaagArcadeStart',{target:'balloon',ids:b.view.player.go!.team,league:'great'}),/leider/);await b.send('plaagFight',{target:'balloon',ids:b.view.player.go!.team});const id=b.view.player.go!.battle!;await b.store.run(['v2GoBattles:'+id],d=>{const battle=d.get('v2GoBattles:'+id) as GoBattle;assert.deepEqual(battle.shields,[2,1]);assert.ok(battle.teams[1].every(f=>f.cp<=450));battle.phase='finished';battle.winner=0;});const before=b.view.player.go!.dust;await b.refresh();assert.equal(b.view.player.go!.dust-before,250);await b.send('goClose',{battle:id});
  const uid=b.view.player.uid,oldId=randomUUID();await b.store.run(['v2Players:'+uid,'v2GoBattles:'+oldId],d=>{const p=d.get('v2Players:'+uid) as PlayerV2;balloon(p,'tap_duel',99);const old=makePlaagBattle(p,'balloon',p.go!.team,oldId,b.clock.now,TOKEN);old.phase='finished';old.winner=0;p.go!.battle=oldId;d.set('v2GoBattles:'+oldId,old);});const oldDust=b.view.player.go!.dust;await b.refresh();assert.ok(b.view.player.go!.dust-oldDust>=500);assert.equal(b.view.player.go!.plaagbende!.arcadeReward!.wins,1);
 }finally{b.store.close();}
});
