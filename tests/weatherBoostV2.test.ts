import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {ELEMENTS,speciesTypes,stats,goCatchRewards,rollGoBug} from '../game/goV2';
import {WEATHER_BOOSTS,boostedTypes,weatherBoosted,weatherGo,weatherDust,WEATHER_LEVEL_CAP} from '../game/weatherBoostV2';
import {wildSpawns,walkingSpecies,WALK_WEIGHTS} from '../game/walkingV2';
import {rng} from '../game/catalogV2';
import type {FieldWeather,HabitatContext,WeatherKind} from '../game/habitatsV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import type {PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,9,29,12),FIX={lat:52.0928,lng:5.1339,accuracy:8};
const weather=(kind:WeatherKind,stale=false):FieldWeather=>({kind,temperature:14,isDay:true,at:NOW,stale});
const habitat=(w:FieldWeather):HabitatContext=>({environment:{biome:'meadow',mapSource:'osm',weather:w,at:NOW},biomeAt:()=>'meadow',canSpawnAt:()=>true});

test('every one of the 11 types is boosted by some real weather; unknown or stale weather boosts nothing',()=>{
 assert.equal(ELEMENTS.length,11);
 const covered=new Set(Object.values(WEATHER_BOOSTS).flat());for(const t of ELEMENTS)assert.ok(covered.has(t),t+' has no weather boost');
 assert.deepEqual(boostedTypes(weather('sunny')),['fire','grass','ground']);
 assert.deepEqual(boostedTypes(weather('sunny',true)),[]);assert.deepEqual(boostedTypes(weather('unknown')),[]);assert.deepEqual(boostedTypes(undefined),[]);
 assert.equal(weatherBoosted('firefly',weather('sunny')),speciesTypes('firefly').includes('fire'));assert.equal(weatherBoosted('firefly',weather('sunny',true)),false);
});

test('boosted spawns are deterministic, flagged and more frequent; stale weather flags nothing',()=>{
 const sunny=habitat(weather('sunny'));
 for(let n=0;n<20;n++){const a=wildSpawns(FIX,'wx-'+n,NOW,sunny),b=wildSpawns(FIX,'wx-'+n,NOW,sunny);assert.deepEqual(a,b);for(const s of a)assert.equal(!!s.weather,weatherBoosted(s.species,sunny.environment.weather));}
 for(let n=0;n<20;n++)for(const s of wildSpawns(FIX,'wx-'+n,NOW,habitat(weather('sunny',true))))assert.equal(s.weather,undefined);
 const share=(w:FieldWeather)=>{const random=rng('share');let hit=0;for(let i=0;i<4000;i++)if(weatherBoosted(walkingSpecies(random,'meadow',w),weather('sunny')))hit++;return hit/4000;};
 assert.ok(share(weather('sunny'))>share(weather('sunny',true))*1.3,'sunny weather raises the share of fire/grass/ground bugs');
 assert.ok(Object.keys(WALK_WEIGHTS).some(id=>weatherBoosted(id,weather('windy'))));
});

test('boosted level is +5 capped, never for fixed-level bosses, and extra dust is half the catch dust',()=>{
 const bug=rollGoBug('ant','lvl');assert.equal(weatherGo(bug,{weather:true}).level,Math.min(WEATHER_LEVEL_CAP,bug.level+5));
 assert.equal(weatherGo({...bug,level:34},{weather:true}).level,35);assert.equal(weatherGo({...bug,level:40},{weather:true}).level,40);
 assert.equal(weatherGo(bug,{weather:true,boss:{level:20}}).level,bug.level);assert.equal(weatherGo(bug,{}).level,bug.level);
 assert.equal(weatherDust('ant'),goCatchRewards('ant').dust/2);
});

test('a boosted map catch has exactly the encounter CP preview and pays the extra dust once',async()=>{
 const store=new SqliteStore(':memory:');try{let now=NOW;const service=new GoServiceV2(store,'local',()=>now);let v=await service.state('wx');const cmd=async(type:string,data:Record<string,unknown>={})=>v=await service.command('wx',{type,...data,...(type==='worldLocate'?{fix:{...(data.fix as object),timestamp:now}}:{}),commandId:randomUUID(),expectedRevision:v.player.revision});
  await cmd('worldLocate',{fix:FIX});const spawn=v.player.walking!.spawns[0],id=spawn.id;
  let seed='';await store.run(['v2Players:wx'],d=>{const p=d.get('v2Players:wx') as PlayerV2;seed=p.walking!.seed!;p.walking!.spawns[0].weather=true;p.field!.inventory.royal=1;});
  const unboosted=rollGoBug(spawn.species,seed+':go:'+id).level;
  await cmd('worldEncounter',{spawn:id});const cp=v.player.field!.encounter!.cp;
  now+=2500;v=await service.command('wx',{type:'worldCast',encounter:v.player.field!.encounter!.id,net:'royal',bait:null,trace:[{x:.5,y:1,t:0},{x:.5,y:.42,t:1150}],commandId:randomUUID(),expectedRevision:v.player.revision});
  assert.equal(v.player.field!.lastCast!.outcome,'caught');const bug=v.player.specimens.at(-1)!;
  assert.equal(stats(bug).cp,cp);assert.equal(v.player.field!.lastCast!.cp,cp);
  assert.equal(bug.go!.level,Math.min(WEATHER_LEVEL_CAP,unboosted+5));
  assert.equal(v.player.go!.dust,goCatchRewards(bug.species).dust+weatherDust(bug.species));
 }finally{store.close();}
});
