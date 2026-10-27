import type {PlayerV2} from './typesV2';
import {ensureField} from './fieldV2';
import {distance} from './walkingV2';
import {rollFind,duplicateNectar} from './progressionV2';
import {awardFind} from './tacticsV2';
import {checkV2 as check} from './shopV2';
export function recordWalk(p:PlayerV2,now:number){const f=ensureField(p,now),fix=p.walking?.fix;if(!fix)return;const w=f.walk??={meters:0,dayMeters:0,anchor:null,at:now},prior=w.anchor,seconds=(now-w.at)/1000;
 if(!prior||seconds>120||fix.accuracy>35||prior.accuracy>35||(p.walking?.blockedUntil??0)>now){w.anchor={...fix};w.at=now;return;}
 // A background fix can cover more than 75 m while cycling. Bound its distance
 // by the actual sample interval and the same 25 km/h limit as autovangst.
 const meters=distance(prior,fix);if(meters<Math.max(12,fix.accuracy,prior.accuracy))return;w.anchor={...fix};w.at=now;if(seconds<2||meters>seconds*7)return;
 const credit=Math.round(meters);w.meters+=credit;w.dayMeters+=credit;
}
export function startCocoon(p:PlayerV2,km:unknown,id:string,seed:string,now:number){const f=ensureField(p,now);check(km===2||km===5,'Kies een cocon van 2 of 5 km.');check(!f.cocoon,'Je hebt al een actieve cocon.');f.cocoon={id,km,startedMeters:f.walk?.meters??0,stage:p.adventure!.stage,seed};}
export function hatchCocoon(p:PlayerV2,now:number){const f=ensureField(p,now),c=f.cocoon;check(c&&c.seed&&(f.walk?.meters??0)-c.startedMeters>=c.km*1000,'Loop eerst de afstand van je cocon.');const found=rollFind(c.seed,c.stage,undefined,c.km===5?8:2),duplicate=awardFind(p,'cocoon-'+c.id,found.species,now,found.shiny),nectar=(c.km===5?30:10)+(duplicate?duplicateNectar(found.species):0),parts=c.km===5?6:2;p.specimens.at(-1)!.source='cocoon';p.nectar+=nectar;p.adventure!.parts+=parts;f.lastHatch={id:c.id,...found,nectar,parts,at:now};f.cocoon=null;
 const buddy=p.specimens.find(s=>s.id===p.buddy);if(buddy&&p.buddyToday<3){buddy.hearts++;p.buddyToday++;}
}
