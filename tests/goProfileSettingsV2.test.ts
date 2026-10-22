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
