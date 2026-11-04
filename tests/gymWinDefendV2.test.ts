import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2} from '../server/goServiceV2';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {CHARGED,ensureGo,rollGoBug} from '../game/goV2';
import {levelXP} from '../game/trainerV2';
import {gymSites,ensureGyms,gymCoins,gymTimeLeft,placeGymDefender,settleExpiredGym,firstGymTab,gymFightable,GYM_RULES} from '../game/gymsV2';
import {parseNativeFieldRequest} from '../src/nativeFieldProtocolV2';
import type {Gym} from '../game/gymsV2';
import type {GameViewV2,PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,9,31,10),fix={lat:51.4416,lng:5.4697,accuracy:5,timestamp:NOW};
const post={id:'virtual-win-gym',name:'Veldpost',lat:fix.lat,lng:fix.lng,source:'virtual' as const},site=gymSites([post])[0];
const far={id:'far-win-gym',name:'Verre post',lat:fix.lat+.006,lng:fix.lng,gym:true as const},farId='gym-'+far.id;
function player(uid:string){
 const p=freshV2(uid,uid.padEnd(8,'0').slice(0,8).toUpperCase(),NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);ensureGyms(p,NOW).team='fern';p.name='QA '+uid;p.onboarded=true;p.go!.trainer!.xp=levelXP(20);
 p.specimens=['hercules','mantis','beetle','moth'].map((species,i)=>({id:uid+'-bug-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:50}}));
 p.buddy=p.specimens[3].id;p.go!.team=p.specimens.slice(0,3).map(s=>s.id);p.walking={fix:{...fix},at:NOW,spawns:[],caught:[],day:'2026-10-31',count:0,posts:[post],mapSites:[far]};return p;
}
async function setup(uid:string){
 const store=new SqliteStore(':memory:'),clock={now:NOW},service=new GoServiceV2(store,'local',()=>clock.now);await service.state(uid);await store.run(['v2Players:'+uid],d=>d.set('v2Players:'+uid,player(uid)));
 const box={v:await service.state(uid)};const send=async(type:string,params:Record<string,unknown>={})=>box.v=await service.command(uid,{type,...params,commandId:randomUUID(),expectedRevision:box.v.player.revision});
 const win=async()=>{for(let i=0;i<3000&&box.v.goBattle&&box.v.goBattle.phase!=='finished';i++){
  clock.now+=100;box.v=await service.state(uid);const b=box.v.goBattle!,a=b.teams[0][b.active[0]];if(b.phase==='finished')break;
  if(b.phase==='charge'){const c=b.charge!;if(c.side!==0&&!c.dodged&&b.shields[0]>0&&clock.now>=c.deadline-650)await send('goAct',{action:'dodge',value:{fromX:200,toX:400,fromY:500,toY:500},chargeAt:c.startedAt});continue;}
  if(a.hp<=0){const next=b.teams[0].findIndex(f=>f.hp>0);if(next>=0)await send('goAct',{action:'switch',value:next});}
  else if(!b.replaceAt.some(Boolean)&&a.readyAt<=clock.now&&!b.fast[0]){const move=a.go.charged.find(m=>CHARGED[m].energy<=a.energy);await send('goAct',{action:move?'charged':'fast',value:move??null});}
 }assert.equal(box.v.goBattle!.phase,'finished');assert.equal(box.v.goBattle!.winner,0,'the strong team beats the wild NPC wardens');};
 return {store,clock,service,box,send,win};
}
const bug=(v:GameViewV2)=>v.player.specimens[0].id;

test('after winning a nearby gym the winner places a defender right away: no "finish your battle" error and no stale-GPS error',async()=>{
 const {store,clock,box,send,win}=await setup('near-winner');try{
  await send('gymAttack',{gym:site.id,ids:box.v.player.go!.team});await win();assert.equal(box.v.player.go!.gyms!.won?.id,site.id,'the win gives a short winner right');
  clock.now=Math.max(clock.now,NOW+31000);// the GPS fix from before the battle is stale now
  await send('gymDefend',{gym:site.id,id:bug(box.v)});
  const gym=box.v.goGyms!.find(g=>g.id===site.id)!;assert.equal(gym.team,'fern');assert.equal(gym.defenders.length,1);assert.ok(gym.defenders[0].me);assert.equal(box.v.player.go!.battle,null,'the finished battle was closed for the kid');assert.equal(box.v.player.go!.gyms!.won,undefined,'the right is used once');
 }finally{store.close();}
});

test('after winning a far gym with the daily remote ticket the winner may place a defender from afar',async()=>{
 const {store,box,send,win}=await setup('far-winner');try{
  await send('gymAttack',{gym:farId,ids:box.v.player.go!.team,remote:true});await win();await send('goClose');
  assert.ok(box.v.goGyms!.some(g=>g.id===farId&&!g.defenders.length),'the won far gym shows in the gym list, empty');
  await send('gymDefend',{gym:farId,id:bug(box.v),remote:true});
  assert.ok(box.v.player.go!.gyms!.deployed.some(d=>d.id===farId),'the far gym is defended');assert.ok(box.v.goGyms!.some(g=>g.id===farId&&g.defenders.some(d=>d.me)),'my bug is in the far gym');
 }finally{store.close();}
});

test("the winner's right expires after a few minutes; the daily remote ticket also places a bug at a far gym without fighting",async()=>{
 const {store,clock,service,box,send,win}=await setup('late-winner');try{
  await send('gymAttack',{gym:farId,ids:box.v.player.go!.team,remote:true});await win();await send('goClose');
  clock.now+=GYM_RULES.winnerMs+1000;box.v=await service.state('late-winner');
  await assert.rejects(send('gymDefend',{gym:farId,id:bug(box.v),remote:true}),/al gebruikt/,'the ticket was spent on the fight');
  await assert.rejects(send('gymDefend',{gym:farId,id:bug(box.v)}),/80 meter|GPS/,'too late for the winner right: walking (and fresh GPS) needed again');
  clock.now+=86400000;box.v=await service.state('late-winner');
  await send('gymDefend',{gym:farId,id:bug(box.v),remote:true});assert.ok(box.v.player.go!.gyms!.deployed.some(d=>d.id===farId),'placed with the ticket of the new day');
  await assert.rejects(send('gymAttack',{gym:site.id,ids:box.v.player.go!.team.slice(0,3),remote:true}),/al gebruikt/,'one remote gym action per day');
 }finally{store.close();}
});

test('a defender earns coins for at most 8 hours (48 coins), then comes home by itself; the 50 per day cap stays',()=>{
 assert.equal(GYM_RULES.maxCoins,GYM_RULES.maxStayMs/(GYM_RULES.coinMinutes*60000));
 assert.equal(gymCoins(NOW,NOW+GYM_RULES.maxStayMs),48);assert.equal(gymCoins(NOW,NOW+86400000),48);assert.equal(gymTimeLeft(NOW,NOW+3600000),7*3600000);assert.equal(gymTimeLeft(NOW,NOW+GYM_RULES.maxStayMs+5),0);
 const p=player('coins'),g:Gym={...site,team:null,revision:0,defenders:[],npcSeeded:true},other:Gym={...site,id:'gym-other-coins',team:null,revision:0,defenders:[],npcSeeded:true};
 placeGymDefender(p,g,p.specimens[0].id,'coins-a',NOW);placeGymDefender(p,other,p.specimens[1].id,'coins-b',NOW);const owners=new Map([[p.uid,p]]);
 assert.equal(settleExpiredGym(g,owners,NOW+GYM_RULES.maxStayMs-1),false,'still defending one ms before 8 h');
 assert.equal(settleExpiredGym(g,owners,NOW+GYM_RULES.maxStayMs),true);assert.equal(p.go!.gyms!.coins,48);
 assert.equal(settleExpiredGym(other,owners,NOW+GYM_RULES.maxStayMs),true);assert.equal(p.go!.gyms!.coins,50,'daily cap');assert.equal(p.go!.gyms!.returns[0].coins,2);assert.equal(p.go!.gyms!.deployed.length,0);
});

test('gym screen tabs: the first tab follows what the kid can do right now',()=>{
 const npc={team:null,defenders:[{npc:true}]},enemy={team:'amber' as const,defenders:[{}]},own={team:'fern' as const,defenders:[{}]},empty={team:null,defenders:[]};
 assert.equal(gymFightable(npc,'fern'),true);assert.equal(gymFightable(enemy,'fern'),true);assert.equal(gymFightable(own,'fern'),false);assert.equal(gymFightable(empty,'fern'),false);
 assert.equal(firstGymTab({lobby:false,invites:0,myTeam:'fern'}),'gym','overview starts on Gym');
 assert.equal(firstGymTab({lobby:true,invites:0,myTeam:'fern'}),'raid','an open raid group comes first');assert.equal(firstGymTab({lobby:false,invites:2,myTeam:'fern'}),'raid');
 assert.equal(firstGymTab({lobby:false,invites:0,myTeam:'fern',gym:enemy}),'fight','tapping an enemy gym on the map opens Vechten');
 assert.equal(firstGymTab({lobby:false,invites:0,myTeam:'fern',gym:own}),'gym');assert.equal(firstGymTab({lobby:false,invites:0,myTeam:'fern',gym:own,gymRaid:true}),'raid');
 assert.equal(firstGymTab({lobby:true,invites:0,myTeam:'fern',gym:empty,won:true}),'gym','just won: place a bug first');
 assert.ok(parseNativeFieldRequest(JSON.stringify({kind:'command',id:'place-remote',command:'gymDefend',params:{gym:site.id,id:'bug',remote:true}})),'the Android map may send a remote placement');
});
