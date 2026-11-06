import {normalizeTrainerName,trainerDisplayName,validTrainerName} from '../game/trainerNameV2';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';

test('avatar and audio/quality settings preserve omitted older-client fields and validate before storage',async()=>{
 const store=new SqliteStore(':memory:');try{
  const service=new GoServiceV2(store,'local',()=>Date.UTC(2026,9,22)),uid='settings-avatar-qa';let v=await service.state(uid);
  const send=async(type:string,data:Record<string,unknown>)=>v=await service.command(uid,{type,...data,expectedRevision:v.player.revision,commandId:randomUUID()});
  await send('profile',{name:'Ranger',avatar:'tidal'});assert.equal(v.player.avatar,'tidal');
  await send('profile',{name:'Ranger Two'});assert.equal(v.player.avatar,'tidal');assert.equal(v.player.onboarded,true);
  await send('settings',{sound:true,reducedMotion:false,largeText:false,music:false,volume:.4,sfxVolume:.7,graphics:'low'});
  await send('settings',{sound:false,reducedMotion:true,largeText:true});assert.equal(v.player.settings.volume,.4);assert.equal(v.player.settings.sfxVolume,.7);assert.equal(v.player.settings.music,false);assert.equal(v.player.settings.graphics,'low');
  const before=structuredClone(v.player);
  for(const data of [{volume:1.1},{volume:-1},{sfxVolume:'loud'},{sfxVolume:NaN},{music:'yes'},{graphics:'ultra'}])await assert.rejects(()=>send('settings',{sound:true,reducedMotion:false,largeText:false,...data}));
  for(const avatar of ['admin','',null,3])await assert.rejects(()=>send('profile',{name:'Ranger',avatar}));
  assert.deepEqual((await service.state(uid)).player,before);
 }finally{store.close();}
});


test('public trainer name can be changed without changing account, friend code or collection',async()=>{
 const store=new SqliteStore(':memory:');try{
  const service=new GoServiceV2(store,'local',()=>Date.UTC(2026,10,6)),uid='nickname-account';let v=await service.state(uid);
  const before=structuredClone(v.player),send=(name:unknown)=>service.command(uid,{type:'profile',name,expectedRevision:v.player.revision,commandId:randomUUID()});
  v=await send('  Zoe\u0308 Ranger  ');assert.equal(v.player.name,'Zoë Ranger');assert.equal(v.player.uid,before.uid);assert.equal(v.player.friendCode,before.friendCode);assert.deepEqual(v.player.specimens,before.specimens);
  const saved=structuredClone(v.player);for(const name of ['  ','A','Hello\u200bWorld','A\u202eName','Bug😀','Trainer'.repeat(4)])await assert.rejects(()=>send(name));
  assert.deepEqual((await service.state(uid)).player,saved);assert.equal(normalizeTrainerName(' Zoe\u0308 '),'Zoë');assert.equal(validTrainerName('Zoë_10'),true);
  assert.equal(trainerDisplayName({name:before.friendCode,uid,friendCode:before.friendCode}),'Trainer');assert.equal(trainerDisplayName({name:'KeverBaas',uid,friendCode:before.friendCode}),'KeverBaas');
 }finally{store.close();}
});
