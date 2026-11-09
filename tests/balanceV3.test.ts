import test from 'node:test';
import assert from 'node:assert/strict';
import {COCOON_REWARDS,COCOON_XP} from '../game/goCocoonsV2';

// Balance 9 Nov: longer cocoons must never pay less per walked km, and hatch XP grows with distance.
test('cocoon rewards per km and hatch XP grow with distance',()=>{
 const kms=[2,5,7,10] as const;
 for(let i=1;i<kms.length;i++){const a=kms[i-1],b=kms[i];
  assert.ok(COCOON_REWARDS[b].dust>COCOON_REWARDS[a].dust,b+' km gives more dust than '+a+' km');
  assert.ok(COCOON_REWARDS[b].candy>COCOON_REWARDS[a].candy,b+' km gives more nectar than '+a+' km');
  assert.ok(COCOON_XP[b]>COCOON_XP[a],b+' km gives more XP than '+a+' km');}
 assert.ok(COCOON_REWARDS[7].dust/7>=COCOON_REWARDS[5].dust/5,'7 km not worse per km than 5 km');
});

import {COIN_SOURCES,grantCoins} from '../game/coinsV3';
import type {PlayerV2} from '../game/typesV2';
test('extra coin sources fill the same shop wallet and ignore invalid amounts',()=>{
 const p={go:{}} as unknown as PlayerV2;grantCoins(p,COIN_SOURCES.daily);grantCoins(p,COIN_SOURCES.week[25]);grantCoins(p,-5);grantCoins(p,1.5);
 assert.equal(p.go!.gyms!.coins,45);assert.equal(p.go!.gyms!.earned,0,'extra coins do not use the daily gym cap');
 const fresh={} as unknown as PlayerV2;grantCoins(fresh,10);assert.equal(fresh.go,undefined);
});
