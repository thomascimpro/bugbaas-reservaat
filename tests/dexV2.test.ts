import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {DEX_SPECIES,dexNumber,dexStatus} from '../game/dexV2';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,evolveGo,rollGoBug,stats,movePool} from '../game/goV2';
import {WALK_MODELS,WALK_WEIGHTS} from '../game/walkingV2';
import {species} from '../game/catalogV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
const NOW=Date.UTC(2026,9,20,12);

test('published dex numbers stay stable when nine species are appended and each has complete playable data',()=>{
 assert.equal(dexNumber('beetle'),1);assert.equal(dexNumber('moth'),5);assert.equal(dexNumber('caterpillar'),21);
 assert.equal(new Set(DEX_SPECIES.map(s=>s.number)).size,DEX_SPECIES.length);
 assert.deepEqual([...DEX_SPECIES.map(s=>s.id)].sort(),Object.keys(WALK_MODELS).sort());
 for(const s of DEX_SPECIES){assert.equal(species(s.id).id,s.id);assert.ok(WALK_WEIGHTS[s.id]>0);assert.ok(movePool(s.id).fast.length>=2);assert.ok(movePool(s.id).charged.length>=3);}
 const at=(id:string)=>stats({id,source:'walking',species:id,level:1,shiny:false,favorite:false,obtainedAt:NOW,hearts:0,item:null,go:{...rollGoBug(id,'fixed'),level:50,iv:[15,15,15]}});
 for(const s of DEX_SPECIES.slice(21)){const actual=at(s.id),ceiling=at('hercules');assert.ok(actual.cp<=ceiling.cp);}
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
