import test from 'node:test';
import assert from 'node:assert/strict';
import {rollGoBug,stats} from '../game/goV2';
import {coverageOf,coverageTeam,strongestTeam,weaknessesOf} from '../game/teamSuggestV3';
import type {PlayerV2,Specimen} from '../game/typesV2';

const bug=(id:string,species:string,level=20):Specimen=>({id,species,level:1,shiny:false,favorite:false,obtainedAt:0,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,'seed-'+id),level,iv:[10,10,10]}});
const player=(bugs:Specimen[])=>({specimens:bugs,go:{gyms:{deployed:[]}}}) as unknown as PlayerV2;

test('strongest team: three highest CP of different species, never a gym defender',()=>{
 const bugs=[bug('a1','ant',30),bug('a2','ant',29),bug('b','beetle',25),bug('c','butterfly',20),bug('d','caterpillar',10)];
 const p=player(bugs);const ids=strongestTeam(p);
 assert.equal(ids.length,3);assert.equal(new Set(ids.map(id=>bugs.find(b=>b.id===id)!.species)).size,3);
 assert.ok(ids.includes('a1')&&!ids.includes('a2'));
 (p.go as any).gyms.deployed=[{specimen:'a1'}];assert.ok(!strongestTeam(p).includes('a1'));
});
test('coverage team covers at least as many attack types as the strongest team',()=>{
 const bugs=['ant','beetle','butterfly','caterpillar','moth','mantis','divingbeetle','hercules','stick','leaf'].map((s,i)=>bug('x'+i,s,15+i));
 const p=player(bugs),pick=(ids:string[])=>ids.map(id=>bugs.find(b=>b.id===id)!);
 const cover=pick(coverageTeam(p)),strong=pick(strongestTeam(p));
 assert.equal(cover.length,3);assert.equal(new Set(cover.map(b=>b.species)).size,3);
 assert.ok(coverageOf(cover).length>=coverageOf(strong).length);
 assert.ok(weaknessesOf(cover).every(w=>w.count>=2));assert.ok(cover.every(b=>stats(b).cp>0));
});
