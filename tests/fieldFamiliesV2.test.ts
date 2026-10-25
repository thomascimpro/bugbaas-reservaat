import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {FIELD_FAMILIES,FIELD_FAMILY_SPECIES} from '../game/fieldFamiliesV2';
import {DEX_SPECIES,EVOLUTIONS,candyFamily,dexNumber,evolutionLine} from '../game/dexV2';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,evolveGo,rollGoBug,stats,movePool} from '../game/goV2';
import {WALK_MODELS,WALK_WEIGHTS} from '../game/walkingV2';
import {habitatWeight} from '../game/habitatsV2';
const NOW=Date.UTC(2026,9,24,12);

test('new three-stage families append after all 62 published dex entries',()=>{
 assert.equal(DEX_SPECIES.length,92);assert.equal(dexNumber('beetle'),1);assert.equal(dexNumber('bee'),32);
 assert.equal(dexNumber('lesserstag'),63);assert.equal(dexNumber('rainbowscarab'),71);assert.equal(dexNumber('acornweevil'),72);
 assert.equal(dexNumber('beetle_elite'),33);assert.equal(dexNumber('bee_elite'),62);
 assert.deepEqual(DEX_SPECIES.slice(62).map(s=>s.id),FIELD_FAMILY_SPECIES.map(s=>s.id));
 for(const f of FIELD_FAMILIES){
  assert.deepEqual(evolutionLine(f.stages[1].id),f.stages.map(s=>s.id));
  assert.equal(new Set(f.stages.map(s=>WALK_MODELS[s.id])).size,3);
  assert.deepEqual(f.stages.map(s=>candyFamily(s.id)),[f.family,f.family,f.family]);
  assert.equal(EVOLUTIONS[f.stages[0].id].candy,25);assert.equal(EVOLUTIONS[f.stages[1].id].candy,100);
  assert.equal(EVOLUTIONS[f.stages[2].id],undefined);
 }
 assert.deepEqual(EVOLUTIONS.caterpillar,{to:'moth',candy:50});
});

test('two evolutions share nectar, improve CP and retain owned shiny identity and build',()=>{
 for(const f of FIELD_FAMILIES){
  const p=freshV2('family-'+f.family,'FAM12345',NOW);ensureField(p,NOW);ensureGo(p,NOW);
  const bug={id:'mine',nickname:'Favoriet',species:f.stages[0].id as string,source:'walking',level:1,shiny:true,favorite:true,obtainedAt:NOW-1000,hearts:4,item:null,go:{...rollGoBug(f.family,'fixed'),level:20,iv:[13,14,15] as [number,number,number],item:'leaf' as const,charged:movePool(f.family).charged.slice(0,2)}};
  p.specimens.push(bug);p.buddy=bug.id;p.go!.team=[bug.id];p.go!.candy[f.family]=125;p.go!.dust=777;
  const identity={id:bug.id,nickname:bug.nickname,iv:bug.go.iv,level:bug.go.level,item:bug.go.item,shiny:bug.shiny,obtainedAt:bug.obtainedAt};
  for(const s of f.stages.slice(1)){const before=stats(bug).cp;evolveGo(p,bug.id,'evolve-'+s.id,NOW);assert.equal(bug.species,s.id);assert.ok(stats(bug).cp>before);assert.equal(bug.go.charged.length,2);assert.deepEqual({id:bug.id,nickname:bug.nickname,iv:bug.go.iv,level:bug.go.level,item:bug.go.item,shiny:bug.shiny,obtainedAt:bug.obtainedAt},identity);}
  assert.equal(p.go!.candy[f.family],0);assert.equal(p.go!.dust,777);assert.equal(p.buddy,'mine');assert.deepEqual(p.go!.team,['mine']);assert.throws(()=>evolveGo(p,'mine','terminal',NOW));
  assert.equal(p.go!.candy[f.family],0);
 }
});

test('new species have genuine licensed animated models and distinct framed shiny portraits',async()=>{
 const provenance=JSON.parse(await readFile('assets/3d/gobkit-insects002/source.json','utf8'));assert.equal(provenance.license,'CC0-1.0');
 for(const s of FIELD_FAMILY_SPECIES){
  const source=provenance.models.find((m:{file:string})=>m.file===s.model+'.glb'),model=await readFile('public/models/'+s.model+'.glb');
  assert.equal(createHash('sha256').update(model).digest('hex'),source.sha256);const gltf=JSON.parse(model.toString('utf8',20,20+model.readUInt32LE(12)));
  assert.ok(gltf.meshes.length);assert.ok(gltf.animations.some((a:{name:string})=>a.name==='idle'));assert.ok(gltf.animations.some((a:{name:string})=>a.name==='attack'));
  const variants=[];for(const suffix of ['','-shiny']){const image=sharp('assets/v2/portraits/v1/'+s.id+suffix+'.webp'),meta=await image.metadata();assert.equal(meta.width,1024);assert.equal(meta.height,1024);assert.equal(meta.hasAlpha,true);const pixels=await image.ensureAlpha().raw().toBuffer();let visible=0;for(let y=0;y<1024;y++)for(let x=0;x<1024;x++)if(pixels[(y*1024+x)*4+3]>5){visible++;assert.ok(x>=12&&x<=1011&&y>=12&&y<=1011);}assert.ok(visible>10000);variants.push(pixels);}
  assert.notDeepEqual(variants[0],variants[1]);
 }
});

test('later stages are rarer in the wild and families favour their own biomes',()=>{
 for(const f of FIELD_FAMILIES){const [a,b,c]=f.stages;assert.ok(WALK_WEIGHTS[a.id]>WALK_WEIGHTS[b.id]);assert.ok(WALK_WEIGHTS[b.id]>WALK_WEIGHTS[c.id]);assert.ok(WALK_WEIGHTS[c.id]>0);for(const s of f.stages)assert.ok(habitatWeight(s.id,1,f.biome)>habitatWeight(s.id,1,'urban'));}
});
