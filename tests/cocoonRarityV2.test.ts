import {test} from 'node:test';
import assert from 'node:assert/strict';
import {COCOON_POOLS,cocoonChance,cocoonSpecies,cocoonTier} from '../game/goCocoonsV2';
import {WALK_WEIGHTS} from '../game/walkingV2';
import {rng} from '../game/catalogV2';

for(const km of [2,5] as const){
 test(`${km} km cocoon chances use five rarity tiers and add up to 100%`,()=>{
  const pool=COCOON_POOLS[km],chances=pool.map(id=>cocoonChance(id,km)),tiers=new Set(pool.map(id=>cocoonTier(id,km)));
  assert.ok(Math.abs(chances.reduce((a,b)=>a+b,0)-1)<1e-9);assert.deepEqual([...tiers].sort(),[1,2,3,4,5]);
  const common=pool.filter(id=>cocoonTier(id,km)===1),rare=pool.filter(id=>cocoonTier(id,km)===5);
  assert.ok(cocoonChance(common[0],km)>=10*cocoonChance(rare[0],km),'common hatches are at least ten times likelier than very rare ones');
  // Tiers follow the wild spawn weight: every tier-1 species spawns at least as often in the wild as every tier-5 species.
  assert.ok(Math.min(...common.map(id=>WALK_WEIGHTS[id]))>=Math.max(...rare.map(id=>WALK_WEIGHTS[id])));
 });
}

test('the hatch picker follows the published chances in a large deterministic sample',()=>{
 const km=2,pool=COCOON_POOLS[km],counts=new Map<string,number>(),random=rng('cocoon-rarity-sample'),n=20000;
 for(let i=0;i<n;i++){const pick=cocoonSpecies(km,random());counts.set(pick,(counts.get(pick)??0)+1);}
 for(const id of pool){const expected=cocoonChance(id,km)*n;assert.ok(Math.abs((counts.get(id)??0)-expected)<=Math.max(25,expected*.15),id);}
});
