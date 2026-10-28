import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import {STARTER_PARTNERS,trainerPalette,OUTFITS} from '../game/avatarV2';
import {beginnerSteps} from '../game/beginnerGuideV2';

const NOW=Date.UTC(2026,9,29,9);
async function setup(uid='newbie'){const store=new SqliteStore(':memory:'),api=new GoServiceV2(store,'local',()=>NOW);let v=await api.state(uid);const send=async(type:string,data:Record<string,unknown>)=>v=await api.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});return {store,send,get:()=>v};}

test('the first partner is a real buddy bug, chosen once; outfit colours are validated',async()=>{
 const {store,send,get}=await setup();try{
  assert.equal(get().player.specimens.filter(s=>s.go).length,0,'new players own no GO bugs yet');
  await assert.rejects(()=>send('profile',{name:'Kever Jager',avatar:'amber',outfit:'neon',starter:'waterstrider'}),/kleur/);
  await assert.rejects(()=>send('profile',{name:'Kever Jager',avatar:'amber',outfit:'sea',starter:'mantis'}),/maatje/);
  await send('profile',{name:'Kever Jager',avatar:'amber',outfit:'sea',starter:'waterstrider'});
  const p=get().player,partner=p.specimens.find(s=>s.source==='partner')!;
  assert.equal(p.onboarded,true);assert.equal(p.outfit,'sea');assert.equal(partner.species,'waterstrider');assert.ok(partner.go&&partner.go.level===12&&partner.favorite);
  assert.equal(p.buddy,partner.id);assert.ok(p.go!.dex!.includes('waterstrider'));assert.ok(Object.values(p.go!.candy).some(n=>n>=10),'starter nectar for its family');
  assert.equal(beginnerSteps(p,1,[]).find(s=>s.id==='first-catch')!.done,false,'the partner does not count as your first catch');
  await send('profile',{name:'Kever Jager',avatar:'fern',starter:'firefly_1'});
  assert.equal(get().player.specimens.filter(s=>s.source==='partner').length,1,'no second partner later');assert.equal(get().player.avatar,'fern');
 }finally{store.close();}
});

test('outfits recolour the ranger jacket and trim but keep the ranger',()=>{
 for(const id of Object.keys(OUTFITS) as (keyof typeof OUTFITS)[]){const c=trainerPalette('amber',id);assert.equal(c.jacket,OUTFITS[id].jacket);assert.equal(c.name,'Zon');}
 assert.deepEqual(trainerPalette('tidal','unknown'),trainerPalette('tidal'));assert.equal(STARTER_PARTNERS.length,3);
});
