import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {existsSync} from 'node:fs';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import {MINI_TRAINERS,TRAINER_AVATARS,TRAINER_PALETTES,trainerModel} from '../game/avatarV2';

test('server accepts every trainer avatar (old rangers and Mini Characters) and rejects unknown ids',async()=>{
 const store=new SqliteStore(':memory:');try{
  const service=new GoServiceV2(store,'local',()=>Date.UTC(2026,10,1)),uid='trainer-avatars-qa';let v=await service.state(uid);
  const send=async(data:Record<string,unknown>)=>v=await service.command(uid,{type:'profile',...data,expectedRevision:v.player.revision,commandId:randomUUID()});
  assert.equal(TRAINER_AVATARS.length,15);
  for(const avatar of TRAINER_AVATARS){await send({name:'Kever Jager',avatar});assert.equal(v.player.avatar,avatar);}
  for(const avatar of ['fern','amber','tidal']){await send({name:'Kever Jager',avatar});assert.equal(v.player.avatar,avatar,'existing ranger ids stay valid');}
  const before=structuredClone(v.player);
  for(const avatar of ['female_g','male-a','character-male-a','Ranger','__proto__'])await assert.rejects(()=>send({name:'Kever Jager',avatar}),/ranger/);
  assert.deepEqual((await service.state(uid)).player,before);
 }finally{store.close();}
});

test('each avatar maps to an existing map model and has a short name',()=>{
 for(const avatar of ['fern','amber','tidal'] as const)assert.equal(trainerModel(avatar),'Ranger');
 assert.equal(trainerModel(undefined),'Ranger');assert.equal(trainerModel('unknown'),'Ranger');
 for(const avatar of MINI_TRAINERS){const model=trainerModel(avatar);assert.match(model,/^trainers\/character-(female|male)-[a-f]$/);assert.ok(existsSync('public/models/'+model+'.glb'),model);assert.ok(existsSync('assets/v2/trainers/mini-'+avatar.replace('_','-')+'-v1.webp'));}
 for(const avatar of TRAINER_AVATARS)assert.ok(TRAINER_PALETTES[avatar].name.length<=6,avatar);
});
