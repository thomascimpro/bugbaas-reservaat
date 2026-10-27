import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {BASE_DEX_SPECIES,DEX_SPECIES,ELITE_FORMS,EVOLUTION_APPEARANCES,EVOLUTIONS,baseSpeciesId,candyFamily,dexNumber,dexStatus,evolutionLine,usesSharedEvolutionModel} from '../game/dexV2';
import {habitatWeight} from '../game/habitatsV2';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,evolveGo,rollGoBug,stats,movePool} from '../game/goV2';
import {WALK_MODELS,WALK_WEIGHTS} from '../game/walkingV2';
import {species} from '../game/catalogV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
const NOW=Date.UTC(2026,9,20,12);

test('published dex numbers stay stable as species are appended and each has complete playable data',()=>{
 assert.deepEqual(DEX_SPECIES.slice(0,30).map(s=>s.id),['beetle','ant','aphid','weevil','moth','earwig','grasshopper','lacewing','dungbeetle','mantis','butterfly','divingbeetle','waterstrider','hoverfly','leafhopper','cricket','stick','leaf','silverfish','hercules','caterpillar','antlion','cockroach','cranefly','flea','giantwaterbug','mayfly','termite','tigerbeetle','tortoisebeetle']);
 assert.equal(dexNumber('beetle'),1);assert.equal(dexNumber('moth'),5);assert.equal(dexNumber('caterpillar'),21);
 assert.equal(new Set(DEX_SPECIES.map(s=>s.number)).size,DEX_SPECIES.length);
 assert.deepEqual([...DEX_SPECIES.map(s=>s.id)].sort(),Object.keys(WALK_MODELS).sort());
 for(const s of DEX_SPECIES){assert.equal(species(s.id).id,s.id);assert.equal((WALK_WEIGHTS[s.id]??0)>0,!ELITE_FORMS[s.id]);assert.ok(movePool(s.id).fast.length>=2);assert.ok(movePool(s.id).charged.length>=3);}
 const at=(id:string)=>stats({id,source:'walking',species:id,level:1,shiny:false,favorite:false,obtainedAt:NOW,hearts:0,item:null,go:{...rollGoBug(id,'fixed'),level:50,iv:[15,15,15]}});
 for(const s of DEX_SPECIES.slice(21)){const actual=at(s.id),ceiling=at('hercules_elite');assert.ok(actual.cp<=ceiling.cp);}
});

test('two larval families use real adult targets, preserve historic nectar keys and spawn in suitable habitats',()=>{
 assert.equal(dexNumber('beetlegrub'),31);
 assert.deepEqual(EVOLUTIONS.caterpillar,{to:'moth',candy:50});assert.deepEqual(EVOLUTIONS.beetlegrub,{to:'hercules',candy:50});
 for(const [from,{to,candy}] of Object.entries(EVOLUTIONS)){assert.ok(dexNumber(from));assert.ok(dexNumber(to));assert.ok(candy>0);assert.equal(candyFamily(from),candyFamily(to));}
 assert.equal(candyFamily('hercules'),'hercules');assert.equal(candyFamily('moth'),'caterpillar');assert.equal(candyFamily('ant'),'ant');
 assert.equal(WALK_MODELS.beetlegrub,'BeetleGrub');assert.ok(habitatWeight('beetlegrub',WALK_WEIGHTS.beetlegrub,'forest')>0);
 for(const biome of ['urban','meadow','wetland','unknown'] as const)assert.equal(habitatWeight('beetlegrub',WALK_WEIGHTS.beetlegrub,biome),0);
});

test('new beetle larva has the licensed animated model and distinct transparent 1024px normal/shiny portraits',async()=>{
 const model=await readFile('public/models/BeetleGrub.glb'),source=await readFile('assets/3d/gobkit-insects/BeetleGrub.glb');assert.deepEqual(model,source);
 assert.equal(model.toString('utf8',0,4),'glTF');assert.equal(model.readUInt32LE(4),2);assert.equal(model.readUInt32LE(8),model.length);
 const gltf=JSON.parse(model.toString('utf8',20,20+model.readUInt32LE(12)));assert.ok(gltf.meshes.length>0);assert.ok(gltf.animations.some((clip:{name:string})=>clip.name==='idle'));
 assert.match(await readFile('assets/3d/gobkit-insects/LICENSE.txt','utf8'),/CC0 1\.0/);
 const manifest=JSON.parse(await readFile('assets/v2/portraits/v1/manifest.json','utf8'));assert.equal(manifest.species.beetlegrub.model,'BeetleGrub');
 const images=[];for(const suffix of ['','-shiny']){const file=`assets/v2/portraits/v1/beetlegrub${suffix}.webp`,metadata=await sharp(file).metadata();assert.equal(metadata.width,1024);assert.equal(metadata.height,1024);assert.equal(metadata.hasAlpha,true);const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});let visible=0;for(let y=0;y<1024;y++)for(let x=0;x<1024;x++){if(data[(y*1024+x)*info.channels+3]>5){visible++;assert.ok(x>=12&&x<=1011&&y>=12&&y<=1011,'portrait stays within frame');}}assert.ok(visible>10000);images.push(data);}
 assert.notDeepEqual(images[0],images[1]);
});

test('all 32 actual base models have matching source files and the new Bee has verified CC0 metadata and real animations',async()=>{
 for(const {id} of BASE_DEX_SPECIES){const name=WALK_MODELS[id],publicModel=await readFile('public/models/'+name+'.glb');assert.equal(publicModel.toString('utf8',0,4),'glTF');assert.equal(publicModel.readUInt32LE(4),2);assert.equal(publicModel.readUInt32LE(8),publicModel.length);const data=JSON.parse(publicModel.toString('utf8',20,20+publicModel.readUInt32LE(12)));assert.ok(data.meshes.length>0);assert.ok(data.animations.some((a:{name:string})=>a.name==='idle'));if(id!=='caterpillar')assert.deepEqual(publicModel,await readFile('assets/3d/'+(id==='bee'?'gobkit-bee':'gobkit-insects')+'/'+name+'.glb'));}
 const source=JSON.parse(await readFile('assets/3d/gobkit-bee/source.json','utf8')),model=await readFile('public/models/Bee.glb');assert.equal(createHash('sha256').update(model).digest('hex'),source.sha256);assert.equal(source.license,'CC0-1.0');assert.equal(source.bytes,model.length);assert.match(await readFile('assets/3d/gobkit-bee/LICENSE.txt','utf8'),/CC0 1\.0/);assert.equal(dexNumber('bee'),32);assert.equal(EVOLUTIONS.bee.to,'bee_elite');
});
test('dex backfill preserves existing ownership, currency, IV and unknown historical dates without awarding twice',()=>{
 const p=freshV2('dex-old','OLD12345',NOW);ensureField(p,NOW);ensureGo(p,NOW);
 const s={id:'old',species:'ant',source:'walking',level:1,shiny:true,favorite:true,obtainedAt:NOW-10000,hearts:0,item:null,go:rollGoBug('ant','old')};p.specimens.push(s);p.go!.dust=1234;p.go!.candy.ant=17;p.go!.dex=['ant','moth'];delete p.go!.entries;
 const before=structuredClone(s);ensureGo(p,NOW);ensureGo(p,NOW);
 assert.deepEqual(s,before);assert.equal(p.go!.dust,1234);assert.equal(p.go!.candy.ant,17);assert.equal(p.go!.entries!.moth.caughtAt,null);assert.equal(dexStatus(p,'moth').caught,true);assert.equal(dexStatus(p,'beetle').seen,false);
});
test('only a validated real encounter records seen; it does not award a catch, shiny registration or rewards',async()=>{
 const store=new SqliteStore(':memory:');try{
  const api=new GoServiceV2(store,'local',()=>NOW);let v=await api.state('dex-seen');
  const cmd=async(type:string,data:Record<string,unknown>)=>v=await api.command('dex-seen',{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});
  await cmd('worldLocate',{fix:{lat:52.09,lng:5.13,accuracy:8,timestamp:NOW}});const spawn=v.player.walking!.spawns[0],before=v.player.go!.dust;
  assert.equal(dexStatus(v.player,spawn.species).seen,false);await cmd('worldEncounter',{spawn:spawn.id});
  assert.deepEqual(dexStatus(v.player,spawn.species),{seen:true,caught:false,shiny:false});assert.equal(v.player.go!.dust,before);assert.equal(v.player.go!.entries![spawn.species].seenAt,NOW);
 }finally{store.close();}
});
test('evolution preserves specimen identity, IV, shiny, favorite, held item, buddy, acquisition and unlocked second slot',()=>{
 const p=freshV2('evo','EVOL1234',NOW);ensureField(p,NOW);ensureGo(p,NOW);const bug={id:'my-rups',species:'caterpillar',source:'walking',level:1,shiny:true,favorite:true,obtainedAt:NOW-1000,hearts:4,item:null,go:{...rollGoBug('caterpillar','rups'),charged:['cut','seed'] as ['cut','seed'],item:'leaf' as const}};p.specimens.push(bug);p.buddy=bug.id;p.go!.candy.caterpillar=50;
 const before=structuredClone(bug);evolveGo(p,bug.id,'evolution',NOW);
 assert.equal(bug.id,before.id);assert.equal(bug.source,before.source);assert.equal(bug.obtainedAt,before.obtainedAt);assert.equal(bug.favorite,true);assert.equal(bug.shiny,true);assert.equal(p.buddy,bug.id);assert.equal(bug.go.item,'leaf');assert.deepEqual(bug.go.iv,before.go.iv);assert.equal(bug.go.level,before.go.level);assert.equal(bug.go.charged.length,2);assert.equal(new Set(bug.go.charged).size,2);assert.equal(p.go!.candy.caterpillar,0);assert.equal(dexStatus(p,'moth').shiny,true);assert.throws(()=>evolveGo(p,bug.id,'again',NOW));
});

test('every base bug has a complete evolution line; published forms preserve currencies, moves and existing specimen data',()=>{
 assert.equal(BASE_DEX_SPECIES.length,32);assert.equal(Object.keys(ELITE_FORMS).length,30);
 for(const base of BASE_DEX_SPECIES){assert.ok(EVOLUTIONS[base.id]);assert.ok(evolutionLine(base.id).length>=2);}
 assert.deepEqual(evolutionLine('moth_elite'),['caterpillar','moth','moth_elite']);assert.deepEqual(evolutionLine('hercules'),['beetlegrub','hercules','hercules_elite']);
 for(const [id,base] of Object.entries(ELITE_FORMS)){
  const p=freshV2('elite-'+base,'ELITE123',NOW);ensureField(p,NOW);ensureGo(p,NOW);
  const bug={id:'original-'+base,species:base,nickname:'Mijn bug',source:'walking',level:1,shiny:true,favorite:true,obtainedAt:NOW-1000,hearts:4,item:null,go:{...rollGoBug(base,'same'),iv:[15,7,11] as [number,number,number],item:'leaf' as const}};p.specimens.push(bug);p.buddy=bug.id;p.go!.team=[bug.id];const key=candyFamily(base);p.go!.candy[key]=100;p.go!.xl[key]=17;
  const before=structuredClone(bug);evolveGo(p,bug.id,'no-reroll',NOW);
  assert.equal(bug.species,id);assert.equal(baseSpeciesId(id),base);assert.equal(WALK_MODELS[id],EVOLUTION_APPEARANCES[id]?.model??WALK_MODELS[base]);assert.equal(usesSharedEvolutionModel(id),!EVOLUTION_APPEARANCES[id]);assert.deepEqual(movePool(id),movePool(base));assert.deepEqual(bug,{...before,species:id});assert.equal(candyFamily(id),key);assert.equal(p.go!.candy[key],0);assert.equal(p.go!.xl[key],17);assert.equal(p.buddy,before.id);assert.deepEqual(p.go!.team,[before.id]);assert.equal(dexStatus(p,id).shiny,true);assert.ok(stats(bug).cp>=stats(before).cp);assert.equal(EVOLUTIONS[id]?.to,['moth_elite','hercules_elite'].includes(id)?undefined:base+'_ultimate');assert.throws(()=>evolveGo(p,bug.id,'again',NOW));
 }
});

test('three named evolution stages use new licensed geometry, embedded assets and visibly different normal/shiny portraits',async()=>{
 const source=JSON.parse(await readFile('assets/3d/evolution-stages/source.json','utf8')),manifest=JSON.parse(await readFile('assets/v2/portraits/v1/manifest.json','utf8'));assert.equal(source.license,'CC0-1.0');assert.match(await readFile('assets/3d/evolution-stages/LICENSE.txt','utf8'),/CC0/);
 const decode=(b:Buffer)=>JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12))),geometry=(b:Buffer)=>{const g=decode(b),start=28+b.readUInt32LE(12),parts:Buffer[]=[];for(const mesh of g.meshes)for(const p of mesh.primitives){const a=g.accessors[p.attributes.POSITION],v=g.bufferViews[a.bufferView],stride=v.byteStride??12,offset=start+(v.byteOffset??0)+(a.byteOffset??0);assert.equal(a.componentType,5126);for(let i=0;i<a.count;i++)parts.push(b.subarray(offset+i*stride,offset+i*stride+12));}return Buffer.concat(parts);};
 assert.equal(source.models.length,3);
 for(const row of source.models){const appearance=EVOLUTION_APPEARANCES[row.id],model=await readFile('public/models/'+row.file),base=await readFile('public/models/'+WALK_MODELS[row.base]+'.glb'),g=decode(model);assert.equal(appearance.model,WALK_MODELS[row.id]);assert.equal(species(row.id).name,appearance.name);assert.notEqual(WALK_MODELS[row.id],WALK_MODELS[row.base]);assert.notDeepEqual(geometry(model),geometry(base),'new positions and topology, not a renamed or tinted base mesh');assert.equal(createHash('sha256').update(model).digest('hex'),row.sha256);assert.deepEqual(model,await readFile('assets/3d/evolution-stages/'+row.file));assert.equal(row.license,'CC0-1.0');assert.ok(g.skins.length);assert.ok(g.animations.some((a:{name:string})=>a.name==='idle'));assert.ok(g.animations.some((a:{name:string})=>a.name==='walk'));assert.ok(g.buffers.every((b:{uri?:string})=>!b.uri));assert.ok((g.images??[]).every((i:{uri?:string})=>!i.uri));assert.equal(manifest.species[row.id].model,appearance.model);
  const pixels:Buffer[]=[];for(const suffix of ['','-shiny']){const file='assets/v2/portraits/v1/'+row.id+suffix+'.webp',meta=await sharp(file).metadata();assert.equal(meta.width,1024);assert.equal(meta.height,1024);assert.equal(meta.hasAlpha,true);const rgba=await sharp(file).ensureAlpha().raw().toBuffer();let visible=0;for(let y=0;y<1024;y++)for(let x=0;x<1024;x++)if(rgba[(y*1024+x)*4+3]>5){visible++;assert.ok(x>=12&&x<=1011&&y>=12&&y<=1011);}assert.ok(visible>10000);pixels.push(rgba);}let changed=0;for(let i=0;i<pixels[0].length;i+=4)if(Math.abs(pixels[0][i]-pixels[1][i])+Math.abs(pixels[0][i+1]-pixels[1][i+1])+Math.abs(pixels[0][i+2]-pixels[1][i+2])>25)changed++;assert.ok(changed>10000,'shiny recolors the model body');
 }
});
