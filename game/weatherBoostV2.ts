import {speciesTypes,goCatchRewards} from './goV2';
import type {Element,GoBug} from './goV2';
import type {FieldWeather,WeatherKind} from './habitatsV2';
import type {PlayerV2,Specimen} from './typesV2';

/** PoGO-style weather boost: every type is boosted by at least one real weather kind. */
export const WEATHER_BOOSTS:Record<Exclude<WeatherKind,'unknown'>,Element[]>={
 sunny:['fire','grass','ground'],rainy:['water','bug'],storm:['water','bug','dark'],cloudy:['normal','poison','rock'],windy:['flying'],fog:['dark','poison'],snowy:['steel','water'],
};
/** Boosted species spawn this much more often; a caught boosted bug gets +5 levels (max 35) and half its catch dust extra. */
export const WEATHER_SPAWN_FACTOR=1.8,WEATHER_LEVEL_BONUS=5,WEATHER_LEVEL_CAP=35;
/** Unknown or stale weather never boosts anything. */
export function boostedTypes(w?:FieldWeather|null):Element[]{if(!w||w.stale||w.kind==='unknown')return [];return WEATHER_BOOSTS[w.kind]??[];}
export function weatherBoosted(kind:string,w?:FieldWeather|null){const boosted=boostedTypes(w);return boosted.length>0&&speciesTypes(kind).some(t=>boosted.includes(t));}
export function weatherSpawnFactor(kind:string,w?:FieldWeather|null){return weatherBoosted(kind,w)?WEATHER_SPAWN_FACTOR:1;}
/** Same level for the encounter CP preview and the caught bug: fixed-level (boss) bugs are never boosted. */
export function weatherGo(bug:GoBug,spawn:{weather?:boolean;boss?:unknown}):GoBug{return spawn.weather&&!spawn.boss?{...bug,level:Math.max(bug.level,Math.min(WEATHER_LEVEL_CAP,bug.level+WEATHER_LEVEL_BONUS))}:bug;}
export function weatherDust(kind:string){return Math.round(goCatchRewards(kind).dust/2);}
/** Applied right after awardGoCatch for a boosted wild spawn; returns the extra dust. */
export function weatherCatch(p:PlayerV2,s:Specimen,spawn:{weather?:boolean;boss?:unknown}){if(!spawn.weather||spawn.boss||!s.go||!p.go)return 0;s.go=weatherGo(s.go,spawn);const dust=weatherDust(s.species);p.go.dust+=dust;return dust;}
