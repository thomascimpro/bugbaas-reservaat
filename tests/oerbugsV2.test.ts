import {assertRuntimeSource,runtimeAssetHash,runtimeAssetBytes} from './assetProvenance';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {LEGENDARY_SPECIES,LEGENDARY_CATCH_CHANCE,isLegendary} from '../game/legendaryV2';
import {DEX_SPECIES,dexNumber,evolutionLine,candyFamily} from '../game/dexV2';
import {species,rng} from '../game/catalogV2';
import {movePool,FAST,CHARGED,rollGoBug} from '../game/goV2';
import {WALK_MODELS,WALK_WEIGHTS,walkingSpecies} from '../game/walkingV2';
import {routeSpecies} from '../game/routesV2';
import {COCOON_POOLS,cocoonSpecies} from '../game/goCocoonsV2';
import type {CocoonKm} from '../game/goCocoonsV2';
import {plaagPools} from '../game/plaagbendeV2';
import {stageOnePool,rewardBugPool} from '../game/pvpV2';
import {LEGENDARY_RAID_SPECIES,RAID_TIERS,legendaryOfWeek,raidBossFighter,raidPools,raidSchedule,raidAt} from '../game/raidsV2';
import {bugRarity} from '../game/rarityDisplayV2';
import {catchChance} from '../game/fieldV2';
import {MIN_CLIENT_VERSION} from '../game/versionV2';
import {SHINY_PALETTES} from '../src/bugModelV2';

const TOKEN=(input:string)=>createHash('sha256').update('oerbug-key:'+input).digest('base64url').slice(0,22);
const site=(i:number)=>({id:'gym-post-'+i,name:'Post '+i,lat:52.09+i/1000,lng:5.12});
const ids=LEGENDARY_SPECIES.map(s=>s.id);

test('three Oerbugs are appended as dex 151-153 with own family, two types, strong moves and no evolution',()=>{
 assert.deepEqual(ids,['kristalkoning','donderwiek','lavaklauw']);assert.deepEqual(LEGENDARY_RAID_SPECIES,ids);
 assert.deepEqual(ids.map(dexNumber),[151,152,153]);assert.deepEqual(DEX_SPECIES.slice(150).map(s=>s.id),ids);assert.equal(dexNumber('snail_3'),150);
 for(const s of LEGENDARY_SPECIES){
  assert.equal(species(s.id).name,s.name);assert.deepEqual(evolutionLine(s.id),[s.id]);assert.equal(candyFamily(s.id),s.id);assert.equal(bugRarity(s.id),5);
  const pool=movePool(s.id);assert.deepEqual(pool.types,[...s.types]);assert.ok(pool.types.length>=1&&pool.types.length<=2);
  for(const f of pool.fast)assert.ok(Object.hasOwn(FAST,f),f);for(const c of pool.charged)assert.ok(Object.hasOwn(CHARGED,c),c);
  assert.ok(pool.charged.some(c=>CHARGED[c].power>=90),'at least one heavy charged attack');assert.ok(pool.types.every(t=>pool.charged.some(c=>CHARGED[c].type===t)),'charged attack for every own type');
  assert.equal(WALK_MODELS[s.id],s.model);assert.deepEqual(SHINY_PALETTES[s.id],s.palette);
 }
 assert.equal(new Set(LEGENDARY_SPECIES.map(s=>s.types.join('/'))).size,3,'three different type pairs');
});

test('Oerbugs never appear in the wild, on routes, in cocoons or in NPC/reward pools',()=>{
 for(const id of ids)assert.equal(WALK_WEIGHTS[id],undefined);
 const random=rng('oerbug-wild');for(let i=0;i<20000;i++){assert.ok(!isLegendary(walkingSpecies(random)));assert.ok(!isLegendary(routeSpecies(random)));}
 for(const biome of ['urban','meadow','forest','wetland'] as const)for(let i=0;i<2000;i++)assert.ok(!isLegendary(walkingSpecies(random,biome)));
 for(const km of Object.keys(COCOON_POOLS).map(Number) as CocoonKm[]){assert.ok(!COCOON_POOLS[km].some(isLegendary));for(let r=0;r<1;r+=.001)assert.ok(!isLegendary(cocoonSpecies(km,r)));}
 assert.ok(!Object.values(plaagPools()).flat().some(id=>isLegendary(id!)));assert.ok(!stageOnePool().some(isLegendary));assert.ok(!rewardBugPool().some(isLegendary));
 for(const tier of [1,3,4] as const)assert.ok(!Object.values(raidPools().pools[tier]).flat().some(isLegendary),'no Oerbug in ★'+tier);
});

test('★5 Oerzwerm raids are scheduled rarely with the Oerbug of the week, rotating through all three',()=>{
 const weeks=['2026-11-02','2026-11-09','2026-11-16'].map(legendaryOfWeek);assert.deepEqual([...weeks].sort(),[...ids].sort(),'each Oerbug gets a week');
 for(const day of ['2026-11-02','2026-11-04','2026-11-08'])assert.equal(legendaryOfWeek(day),weeks[0],'one boss Monday to Sunday');
 let five=0,total=0;
 for(const day of ['2026-11-02','2026-11-10','2026-11-18'])for(let i=0;i<200;i++)for(const w of raidSchedule(site(i),day,TOKEN)){total++;if(w.tier!==5){assert.ok(!isLegendary(w.species));continue;}five++;assert.equal(w.species,legendaryOfWeek(day));
  const r=raidAt(site(i),w.hatchAt,TOKEN)!;assert.equal(r.tier,5);assert.equal(r.species,w.species);}
 assert.ok(five>0&&five/total<.06,'★5 occurs but stays rare: '+five+'/'+total);
 for(const id of ids){const boss=raidBossFighter({id:'r',tier:5,species:id});assert.ok(boss.maxHP>raidBossFighter({id:'r',tier:4,species:'hercules_elite'}).maxHP);}
 assert.equal(RAID_TIERS[5].name,'Oerzwerm');assert.ok(RAID_TIERS[5].trainer>=20);
});

test('raid catches of Oerbugs are harder than common bugs but a royal net always works; raid level and IV floor apply',()=>{
 for(const id of ids){
  const hit=catchChance(id,'basic',null,'hit');assert.ok(hit<=catchChance('ant','basic',null,'hit')/2,'harder than a common bug');assert.ok(hit>=LEGENDARY_CATCH_CHANCE*.9&&hit<=.34,id+' '+hit);
  assert.equal(catchChance(id,'royal',null,'hit'),1);
  const bug=rollGoBug(id,'raid-catch',{level:RAID_TIERS[5].catchLevel});assert.equal(bug.level,20);assert.ok(bug.iv.every(v=>v>=10));
 }
});

test('Oerbug models are original, reproducible, skinned and animated; portraits are framed and shiny differs',async()=>{
 assert.equal(MIN_CLIENT_VERSION,'0.1.29','older apps do not know the Oerbugs');
 const source=JSON.parse(await readFile('assets/3d/oerbugs/source.json','utf8')),older=new Set(JSON.parse(await readFile('assets/3d/evolution-150/source.json','utf8')).models.map((m:{geometrySha256:string})=>m.geometrySha256));
 const manifest=JSON.parse(await readFile('assets/v2/portraits/v1/manifest.json','utf8')).species;
 assert.deepEqual(source.models.map((m:{id:string})=>m.id),ids);assert.equal(new Set(source.models.map((m:{geometrySha256:string})=>m.geometrySha256)).size,3);
 for(const s of LEGENDARY_SPECIES){
  const row=source.models.find((m:{id:string})=>m.id===s.id),model=await readFile('public/models/'+s.model+'.glb');
  assert.equal(row.file,s.model+'.glb');assert.equal(createHash('sha256').update(model).digest('hex'),runtimeAssetHash(s.model,row.sha256));assert.equal(runtimeAssetBytes(s.model),model.length);assert.equal(row.license,'Original BugBaas asset');assert.equal(row.sourceGeometryReused,false);assert.ok(!older.has(row.geometrySha256));
  assert.equal(model.toString('utf8',0,4),'glTF');const g=JSON.parse(model.toString('utf8',20,20+model.readUInt32LE(12)));
  assert.equal(g.skins.length,1);assert.ok(g.meshes[0].primitives.length<=10,'few draw calls');assert.ok(model.length<600000);
  for(const clip of ['idle','walk','attack','hit','dead'])assert.ok(g.animations.some((a:{name:string})=>a.name===clip),s.id+' '+clip);
  assert.ok(g.materials.some((m:{emissiveFactor?:number[]})=>m.emissiveFactor?.some(v=>v>0)),'glowing parts');
  assert.equal(manifest[s.id].model,s.model);const pixels:Buffer[]=[];
  for(const suffix of ['','-shiny']){const file='assets/v2/portraits/v1/'+s.id+suffix+'.webp',meta=await sharp(file).metadata();assert.equal(meta.width,768);assert.equal(meta.height,768);assert.equal(meta.hasAlpha,true);
   const rgba=await sharp(file).ensureAlpha().raw().toBuffer();let visible=0;for(let y=0;y<768;y++)for(let x=0;x<768;x++)if(rgba[(y*768+x)*4+3]>5){visible++;assert.ok(x>=12&&x<=755&&y>=12&&y<=755);}assert.ok(visible>10000);pixels.push(rgba);
   const thumb=await sharp('assets/v2/portraits/thumbs/'+s.id+suffix+'.webp').metadata();assert.equal(thumb.width,256);}
  let changed=0;for(let i=0;i<pixels[0].length;i+=4)if(Math.abs(pixels[0][i]-pixels[1][i])+Math.abs(pixels[0][i+1]-pixels[1][i+1])+Math.abs(pixels[0][i+2]-pixels[1][i+2])>25)changed++;assert.ok(changed>10000,'shiny recolours '+s.id);
 }
});
