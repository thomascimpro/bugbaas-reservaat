import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2} from '../server/goServiceV2';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,rollGoBug} from '../game/goV2';
import {ensureGyms,firstGymTab,placeGymDefender,GYM_RULES} from '../game/gymsV2';
import type {Gym} from '../game/gymsV2';
import type {PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,10,1,10),FIX={lat:51.4416,lng:5.4697,accuracy:5,timestamp:NOW};
function player(uid:string){const p=freshV2(uid,uid.toUpperCase().padEnd(8,'X'),NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);ensureGyms(p,NOW).team='fern';p.onboarded=true;p.specimens=['hercules','beetle','moth','aphid'].map((species,i)=>({id:uid+'-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:50}}));p.go!.team=p.specimens.slice(0,3).map(s=>s.id);p.buddy=p.specimens[3].id;p.walking={fix:{...FIX},at:NOW,seed:'own-fixture',spawns:[],caught:[],day:'2026-11-01',count:0,posts:[],mapSites:[]};return p;}

test('winning a remote round can finish the same human gym, close safely, place once, and receive capped coins after eight hours',async()=>{
 const store=new SqliteStore(':memory:');let now=NOW;const service=new GoServiceV2(store,'local',()=>now),p=player('remote'),owner=player('owner'),g:Gym={id:'gym-rounds',postId:'rounds',name:'Eikenpad',lat:FIX.lat+.006,lng:FIX.lng,team:null,revision:0,defenders:[],npcSeeded:true};
 owner.go!.gyms!.team='amber';owner.specimens[1].go!.level=1;owner.walking!.fix.lat=g.lat;placeGymDefender(owner,g,owner.specimens[1].id,'other-owner',NOW);p.walking!.mapSites=[{id:g.postId,name:g.name,lat:g.lat,lng:g.lng,gym:true}];
 try{
  await store.run(['v2Players:'+p.uid,'v2Players:'+owner.uid,'v2GoGyms:'+g.id],d=>{d.set('v2Players:'+p.uid,p);d.set('v2Players:'+owner.uid,owner);d.set('v2GoGyms:'+g.id,g);});
  let v=await service.state(p.uid);const send=async(type:string,params:Record<string,unknown>={},revision=v.player.revision)=>v=await service.command(p.uid,{type,...params,commandId:randomUUID(),expectedRevision:revision});
  for(let round=0;round<3;round++){
   await send('gymAttack',{gym:g.id,ids:p.go!.team,remote:true});const battle=v.goBattle!.id,oldRevision=v.player.revision;
   for(let step=0;step<200&&v.goBattle!.phase!=='finished';step++){now+=400;v=await service.state(p.uid);}
   assert.equal(v.goBattle!.phase,'finished');assert.equal(v.goBattle!.winner,0);assert.equal(v.player.go!.gyms!.remoteDay,'2026-11-01');
   await send('goClose',{battle},oldRevision);assert.equal(v.goBattle,null,'a stale revision may close only its finished battle');
   await send('goClose',{battle},oldRevision);assert.equal(v.goBattle,null,'a delayed second close is harmless');
   const gym=v.goGyms!.find(x=>x.id===g.id)!;assert.equal(firstGymTab({lobby:false,invites:0,myTeam:'fern',gym,won:true}),round<2?'fight':'gym');
   if(round<2)assert.equal(gym.defenders[0].hearts,2-round);
  }
  await send('gymDefend',{gym:g.id,id:p.specimens[0].id});assert.equal(v.player.go!.gyms!.deployed.length,1);assert.equal(v.player.go!.gyms!.won,undefined);assert.equal(v.player.go!.gyms!.coins,0);
  await assert.rejects(send('gymDefend',{gym:g.id,id:p.specimens[1].id,remote:true}),/al gebruikt/);
  now+=GYM_RULES.maxStayMs;v=await service.state(p.uid);assert.equal(v.player.go!.gyms!.deployed.length,0);assert.equal(v.player.go!.gyms!.coins,48);assert.equal(v.player.go!.gyms!.returns.length,1);assert.equal((await service.state(p.uid)).player.go!.gyms!.coins,48);
 }finally{store.close();}
});

test('a delayed close cannot dismiss a different battle or an active battle',async()=>{
 const store=new SqliteStore(':memory:'),p=player('close');for(const bug of p.specimens)bug.go!.level=10;try{
  await store.run(['v2Players:'+p.uid],d=>d.set('v2Players:'+p.uid,p));const service=new GoServiceV2(store,'local',()=>NOW);let v=await service.state(p.uid);
  v=await service.command(p.uid,{type:'goTrain',commandId:randomUUID(),expectedRevision:v.player.revision});const id=v.goBattle!.id;
  for(const battle of [id,'previous-finished-battle'])await assert.rejects(()=>service.command(p.uid,{type:'goClose',battle,commandId:randomUUID(),expectedRevision:v.player.revision}),/Rond het gevecht|ander gevecht/);
  assert.equal((await service.state(p.uid)).goBattle!.id,id);assert.equal((await service.state(p.uid)).goBattle!.phase,'fight');
 }finally{store.close();}
});
