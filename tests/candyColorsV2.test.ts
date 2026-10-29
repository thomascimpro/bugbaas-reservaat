import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEX_SPECIES,candyFamily} from '../game/dexV2';
import {species} from '../game/catalogV2';
import {NECTAR_FAMILIES,familyBase,familyColors} from '../src/resourceGainV2';

test('every nectar family has its own stable two-tone colour and a drawable base bug',()=>{
 assert.equal(NECTAR_FAMILIES.length,new Set(DEX_SPECIES.map(s=>candyFamily(s.id))).size);
 const mains=new Set<string>();for(const f of NECTAR_FAMILIES){const c=familyColors(f);for(const hex of Object.values(c))assert.match(hex,/^#[0-9a-f]{6}$/);assert.notEqual(c.main,c.stripe);assert.deepEqual(familyColors(f),c);mains.add(c.main);assert.doesNotThrow(()=>species(familyBase(f)),f);}
 assert.equal(mains.size,NECTAR_FAMILIES.length,'no two families share a main colour');
 assert.match(familyColors('unknown-family').main,/^#[0-9a-f]{6}$/);
});
