import type {PlayerV2} from './typesV2';
import {ensureField} from './fieldV2';
import {weatherBoosted} from './weatherBoostV2';
import {gpsWalkMeters} from './adventureSyncV2';
import {rng} from './catalogV2';
import {walkingSpecies} from './walkingV2';
import {checkV2 as check} from './shopV2';
import type {HabitatContext} from './habitatsV2';

export const LURE_DURATION=15*60000;
export function startFieldLure(p:PlayerV2,id:string,seed:string,now:number){
 const f=ensureField(p,now),w=p.walking;
 check(w&&now-w.at<30000&&w.fix.accuracy<=35,'Zet eerst nauwkeurige GPS aan.');
 check(f.lure?.day!==f.daily.day&&(!f.lure||f.lure.expiresAt<=now),'Je wandellokker is vandaag al gebruikt.');
 f.lure={id,day:f.daily.day,startedAt:now,expiresAt:now+LURE_DURATION,lastAt:now,lastMeters:gpsWalkMeters(p),spawned:0,caught:0,seed};
}
// Only distance already credited by the walking validator can attract a bug.
export function advanceFieldActivities(p:PlayerV2,now:number,habitat?:HabitatContext){
 const f=ensureField(p,now),w=p.walking,l=f.lure,meters=gpsWalkMeters(p);
 if(l&&l.seed&&w&&l.expiresAt>now&&now-l.lastAt>=30000&&meters-l.lastMeters>=25&&l.spawned<20){
  const random=rng(l.seed+':'+l.spawned),angle=random()*Math.PI*2,radius=12,point={lat:w.fix.lat+Math.cos(angle)*radius/111320,lng:w.fix.lng+Math.sin(angle)*radius/(111320*Math.cos(w.fix.lat*Math.PI/180))};
  if(habitat&&!habitat.canSpawnAt(point))return;const biome=habitat?.biomeAt(point);
  w.spawns=w.spawns.filter(s=>s.expiresAt>now);
  {const kind=walkingSpecies(random,biome,habitat?.environment.weather);w.spawns.push({id:'lure-'+l.id+'-'+l.spawned,species:kind,...point,...(biome?{biome}:{}),...(weatherBoosted(kind,habitat?.environment.weather)?{weather:true}:{}),expiresAt:Math.min(l.expiresAt,now+90000),source:'lure'});}
  l.lastAt=now;l.lastMeters=meters;l.spawned++;
 }
 if((f.walk?.dayMeters??0)>=1000&&!f.daily.buddyWalk&&p.buddyToday<3){
  const buddy=p.specimens.find(s=>s.id===p.buddy);if(buddy){buddy.hearts++;p.buddyToday++;f.daily.buddyWalk=true;}
 }
}
export function feedFieldBuddy(p:PlayerV2,now:number){
 const f=ensureField(p,now),buddy=p.specimens.find(s=>s.id===p.buddy);
 check(buddy&&!f.daily.buddyFed&&p.buddyToday<3,'Je buddy is vandaag al gevoerd of heeft alle dagharten.');
 check(f.inventory.fruit>0,'Je hebt een Bosframboos nodig.');
 f.inventory.fruit--;f.daily.buddyFed=true;buddy.hearts++;p.buddyToday++;
}
