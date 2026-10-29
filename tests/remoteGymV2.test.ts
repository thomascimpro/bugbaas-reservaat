import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,rollGoBug} from '../game/goV2';
import {levelXP} from '../game/trainerV2';
import {locate} from '../game/walkingV2';
import {ensureGyms} from '../game/gymsV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import type {GameViewV2,PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,9,30,10),FIX={lat:51.4416,lng:5.4697,accuracy:5};
function player(uid:string){const p=freshV2(uid,uid.slice(0,8).toUpperCase().padEnd(8,'X'),NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);p.uid=uid;p.name=uid;p.go!.trainer!.xp=levelXP(20);
 p.specimens=['ant','beetle','moth','aphid'].map((species,i)=>({id:'bug-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:25}}));
 ensureGyms(p,NOW).team='fern';locate(p,{...FIX,timestamp:NOW},'walk-'+uid,NOW);p.walking!.posts=[];
 p.walking!.mapSites=Array.from({length:30},(_,i)=>({id:'far-post-'+i,name:'Verre post '+i,lat:FIX.lat+.006+i*.0001,lng:FIX.lng,gym:true as const}));return p;}

test('one gym battle per day from afar at a gym you can see; walking is still needed for a second one',async()=>{
 const store=new SqliteStore(':memory:'),service=new GoServiceV2(store,'local',()=>NOW),uid='remote-gym-kid';
 try{
  await service.state(uid);await store.run(['v2Players:'+uid],d=>d.set('v2Players:'+uid,player(uid)));let v:GameViewV2=await service.state(uid);
  const send=async(type:string,params:Record<string,unknown>)=>v=await service.command(uid,{type,...params,commandId:randomUUID(),expectedRevision:v.player.revision});
  const ids=['bug-0','bug-1','bug-2'];
  await assert.rejects(send('gymAttack',{gym:'gym-far-post-0',ids}),/65 meter|niet beschikbaar/,'without the remote ticket a far gym needs walking');
  await assert.rejects(send('gymAttack',{gym:'gym-nowhere',ids,remote:true}),/zie je niet/,'only gyms you can see on the map');
  await send('gymAttack',{gym:'gym-far-post-0',ids,remote:true});
  assert.ok(v.goBattle,'the remote gym battle started');assert.equal((v.player.go!.gyms as {remoteDay?:string}).remoteDay,'2026-10-30');
  await store.run(['v2Players:'+uid],d=>{const p=d.get('v2Players:'+uid) as PlayerV2;p.go!.battle=null;d.set('v2Players:'+uid,p);});v=await service.state(uid);
  await assert.rejects(send('gymAttack',{gym:'gym-far-post-1',ids,remote:true}),/al gebruikt/,'once per day');
 }finally{store.close();}
});
