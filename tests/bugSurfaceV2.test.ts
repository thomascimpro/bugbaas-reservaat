import test from 'node:test';
import assert from 'node:assert/strict';
import {bugSurface} from '../src/bugModelV2';

// AN-01 realism: material class per body type; "Stage" in model names must not read as stag beetle.
test('bug surface follows body type, not the shared lacquer coat',()=>{
 for(const n of ['AntlionLarva','BeetleGrub','HawkCaterpillar','SnailStage1','Aphid'])assert.equal(bugSurface(n),'soft',n);
 for(const n of ['Bee','beeUltimate','ArmabeeStage2','HawkMoth','SpiderStage3','MonarchButterflyAdult'])assert.equal(bugSurface(n),'fur',n);
 for(const n of ['HerculesBeetle','RainbowScarab','Acornweevil','Twentyeightspotladybird','FireflyStage2','ScorpionStage1'])assert.equal(bugSurface(n),'shell',n);
 for(const n of ['DragonflyStage1','CentipedeStage2','CicadaStage3','SnailStage3','GardenAntAdult'])assert.equal(bugSurface(n),'default',n);
});
