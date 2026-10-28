import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureGo} from '../game/goV2';
import {candyFamily,DEX_SPECIES} from '../game/dexV2';
import {familyName,rewardChanges} from '../src/resourceGainV2';

const NOW=Date.UTC(2026,9,28,9);

test('every nectar family has a readable name, including families that are not species ids',()=>{
 for(const {id} of DEX_SPECIES){const family=candyFamily(id);assert.doesNotThrow(()=>familyName(family),id+' -> '+family);assert.ok(familyName(family).length>0);}
 for(const family of ['spider','armabee','scorpion','mosquito','snail'])assert.notEqual(familyName(family),family,family+' keeps its raw id');
});

test('reward toast rows for spider/scorpion/snail nectar do not throw "Onbekende soort"',()=>{
 const before=freshV2('reward-family','REWARD1',NOW);before.onboarded=true;ensureGo(before,NOW);const after=structuredClone(before);
 for(const family of ['spider','armabee','scorpion','mosquito','snail']){after.go!.candy[family]=(before.go!.candy[family]??0)+3;after.go!.xl[family]=(before.go!.xl[family]??0)+1;}
 const rows=rewardChanges(before,after);
 assert.equal(rows.filter(r=>r.id.startsWith('candy:')).length,5);assert.equal(rows.filter(r=>r.id.startsWith('xl:')).length,5);
 assert.ok(rows.every(r=>!/^(spider|armabee|scorpion|mosquito|snail) /.test(r.name)),'rows use species names, not raw family ids');
});
