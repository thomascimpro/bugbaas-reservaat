import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {biomeAt,canSpawnAt,contains,habitatWeight,weatherMultiplier,UNKNOWN_WEATHER} from '../game/habitatsV2';
import type {AreaFeature,Biome,HabitatContext} from '../game/habitatsV2';
import {locate,wildSpawns,walkingSpecies,WALK_WEIGHTS} from '../game/walkingV2';
import {rng} from '../game/catalogV2';
import {freshV2} from '../game/safariV2';
import {ensureGo} from '../game/goV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import {getFieldEnvironment,parseWeather,tileXY} from '../server/environmentV2';
import {createWorldSitesProvider} from '../server/worldSitesDataV2';
const NOW=Date.UTC(2026,9,19,14),FIX={lat:52.09,lng:5.13,accuracy:8,timestamp:NOW};
const polygon=(layer:string,kind:string,x=0,size=.001):AreaFeature=>({layer,properties:{class:kind},geometry:{type:'Polygon',coordinates:[[[5.13+x-size,52.09-size],[5.13+x+size,52.09-size],[5.13+x+size,52.09+size],[5.13+x-size,52.09+size],[5.13+x-size,52.09-size]]]}});
function habitat(biome:Biome):HabitatContext{return {environment:{biome,mapSource:'osm',weather:{...UNKNOWN_WEATHER},at:NOW},biomeAt:()=>biome,canSpawnAt:()=>true};}

test('posts and routes cannot extend into map tiles the environment has not loaded',async t=>{
 const x=tileXY(FIX).x,west=x/2**14*360-180,scale=111320*Math.cos(FIX.lat*Math.PI/180),fix={...FIX,lng:west+400/scale};
 const geometry=Array.from({length:7},(_,i)=>({lat:fix.lat,lon:fix.lng-i*100/scale}));
 const elements=[{type:'way',id:901,tags:{highway:'footway',access:'yes'},geometry},{type:'node',id:902,tags:{tourism:'information'},lat:fix.lat,lon:fix.lng-550/scale}];
 const requestedTiles=new Set<string>();
 t.mock.method(globalThis,'fetch',async(input:string|URL|Request)=>{
  const url=String(input);
  if(url==='https://tiles.openfreemap.org/planet')return Response.json({tiles:['https://tiles.openfreemap.org/planet/qa/{z}/{x}/{y}.pbf']});
  if(url.endsWith('.pbf')){requestedTiles.add(url.split('/').slice(-2).join('/').replace('.pbf',''));return new Response(new Uint8Array());}
  if(url.includes('open-meteo.com'))return Response.json({current:{time:Date.now()/1000,weather_code:0,temperature_2m:18,is_day:1,wind_speed_10m:5}});
  assert.equal(url,'https://overpass-api.de/api/interpreter');return Response.json({elements});
 });
 const provider=createWorldSitesProvider(globalThis.fetch);
 let h=await getFieldEnvironment(fix,NOW,provider);
 for(let i=0;i<4&&!h.sites?.available;i++){await new Promise(resolve=>setImmediate(resolve));h=await getFieldEnvironment(fix,NOW,provider);}
 assert.equal(h.environment.mapSource,'osm');assert.equal(h.sites?.available,true);
 const end=tileXY({lat:fix.lat,lng:geometry.at(-1)!.lon});assert.ok(!requestedTiles.has(end.x+'/'+end.y));
 assert.deepEqual(h.sites?.posts,[]);assert.deepEqual(h.sites?.routes,[]);
});

test('OSM polygons determine forest, meadow, water shore and city while respecting holes',()=>{const forest=polygon('landcover','wood'),meadow=polygon('park','park'),water=polygon('water','lake');assert.equal(biomeAt(FIX,[forest]),'forest');assert.equal(biomeAt(FIX,[meadow]),'meadow');assert.equal(biomeAt(FIX,[]),'urban');assert.equal(biomeAt(FIX,[],false),'unknown');assert.equal(biomeAt({...FIX,lng:5.1315},[water]),'wetland');assert.equal(biomeAt({...FIX,lng:5.134},[water]),'urban');if(forest.geometry.type==='Polygon')forest.geometry.coordinates.push(polygon('landcover','wood',0,.0002).geometry.type==='Polygon'?(polygon('landcover','wood',0,.0002).geometry as GeoJSON.Polygon).coordinates[0]:[]);assert.equal(contains(FIX,forest.geometry),false);assert.equal(biomeAt({...FIX,lng:5.1308},[forest]),'forest');});
test('spawns avoid mapped water, buildings and major transport lanes',()=>{assert.equal(canSpawnAt(FIX,[polygon('building','house')]),false);assert.equal(canSpawnAt(FIX,[polygon('water','lake')]),false);assert.equal(canSpawnAt(FIX,[{layer:'transportation',properties:{class:'motorway'},geometry:{type:'LineString',coordinates:[[5.13,52.08],[5.13,52.10]]}}]),false);const h=habitat('meadow');h.canSpawnAt=p=>p.lng>FIX.lng;const bugs=wildSpawns(FIX,'blocked-areas',NOW,h);assert.equal(bugs.length,7);assert.ok(bugs.every(b=>b.lng>FIX.lng));});
test('exclusive species stay inside their biome and every active species has a reachable habitat',()=>{const possible=new Set<string>();for(const biome of ['urban','meadow','forest','wetland','unknown'] as Biome[]){const h=habitat(biome);for(let n=0;n<300;n++)for(const s of wildSpawns(FIX,'habitat-'+n,NOW,h)){assert.ok(habitatWeight(s.species,WALK_WEIGHTS[s.species],biome)>0);possible.add(s.species);if(['waterstrider','divingbeetle'].includes(s.species))assert.equal(biome,'wetland');if(['stick','leaf','hercules'].includes(s.species))assert.equal(biome,'forest');if(['butterfly','leafhopper'].includes(s.species))assert.equal(biome,'meadow');}}for(const id of Object.keys(WALK_WEIGHTS)){const biome=(['urban','meadow','forest','wetland','unknown'] as Biome[]).find(b=>habitatWeight(id,WALK_WEIGHTS[id],b)>0);assert.ok(biome,'reachable habitat for '+id);const weights=Object.entries(WALK_WEIGHTS).map(([key,w])=>[key,habitatWeight(key,w,biome)] as const),total=weights.reduce((n,[,w])=>n+w,0),index=weights.findIndex(([key])=>key===id),before=weights.slice(0,index).reduce((n,[,w])=>n+w,0);assert.equal(walkingSpecies(()=>(before+weights[index][1]/2)/total,biome),id);}});
test('weather and night influence spawn weights without bypassing habitat exclusions',()=>{const sun={kind:'sunny' as const,temperature:20,isDay:true,at:NOW,stale:false},rain={...sun,kind:'rainy' as const};assert.ok(weatherMultiplier('butterfly',sun)>weatherMultiplier('ant',sun));assert.ok(weatherMultiplier('waterstrider',rain)>1);assert.equal(habitatWeight('waterstrider',6,'forest',rain),0);assert.ok(weatherMultiplier('moth',{...sun,isDay:false})>1);assert.equal(weatherMultiplier('butterfly',{...sun,stale:true}),1);assert.equal(weatherMultiplier('butterfly',{...sun,isDay:false}),1);});
test('weather refresh does not reroll living encounters; the next spawn wave uses current habitat',()=>{const p=freshV2('biome','BIOME123',NOW);ensureGo(p,NOW);locate(p,FIX,'initial-secret',NOW,habitat('forest'));const before=structuredClone(p.walking!.spawns);locate(p,{...FIX,timestamp:NOW+1000},'reroll-secret',NOW+1000,habitat('meadow'));assert.deepEqual(p.walking!.spawns,before);assert.equal(p.walking!.environment!.biome,'meadow');locate(p,{...FIX,timestamp:NOW+900001},'next-wave-secret',NOW+900001,habitat('meadow'));assert.ok(p.walking!.spawns.every(s=>s.biome==='meadow'));});
test('the service uses its own environment provider and refuses client biome or weather fields',async()=>{const store=new SqliteStore(':memory:');try{const service=new GoServiceV2(store,'local',()=>NOW,async()=>habitat('forest'));let v=await service.state('biome');await assert.rejects(()=>service.command('biome',{type:'worldLocate',fix:FIX,biome:'wetland',weather:'rainy',commandId:randomUUID(),expectedRevision:v.player.revision}));v=await service.command('biome',{type:'worldLocate',fix:FIX,commandId:randomUUID(),expectedRevision:v.player.revision});assert.equal(v.player.walking!.environment!.biome,'forest');assert.ok(v.player.walking!.spawns.every(s=>s.biome==='forest'));}finally{store.close();}});
test('weather model codes are validated and classified before entering the game',()=>{const data={time:NOW/1000,weather_code:0,temperature_2m:18.6,is_day:1,wind_speed_10m:10};assert.equal(parseWeather(data).kind,'sunny');assert.equal(parseWeather({...data,weather_code:63}).kind,'rainy');assert.equal(parseWeather({...data,weather_code:75}).kind,'snowy');assert.equal(parseWeather({...data,weather_code:95}).kind,'storm');assert.equal(parseWeather({...data,wind_speed_10m:30}).kind,'windy');assert.equal(parseWeather({...data,is_day:0}).isDay,false);assert.throws(()=>parseWeather({...data,temperature_2m:NaN}));});
