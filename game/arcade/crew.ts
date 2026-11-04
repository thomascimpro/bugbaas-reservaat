import {arcadeSeed} from './tapDuel';
import type {ArcadeGameId} from './games';
import {ensurePlaag,plaagTarget,plaagTeam,plaagPools} from '../plaagbendeV2';
import type {PlaagToken,PlaagView} from '../plaagbendeV2';
import {trainerLevel,grantXP} from '../trainerV2';
import {evolutionStage} from '../dexV2';
import {rollGoBug,markGoSeen,family} from '../goV2';
import type {Element} from '../goV2';
import type {PlayerV2,Specimen} from '../typesV2';
import {checkV2 as check} from '../shopV2';

export type CrewEncounter={version:'crew-1';id:string;kind:'post'|'balloon';postId?:string;type:Element;faction:'baret'|'olijf';game:ArcadeGameId|'combat';tier:1|2|3;targetScore:number;rescueSpecies:string;shiny:boolean;expiresAt:number;practice?:boolean};
export type CrewReceipt={encounter:string;faction:'baret'|'olijf';tier:number;rewarded:boolean;practice:boolean;rescued?:{id:string;species:string;shiny:boolean};candy:number;family?:string};
export const CREW_REWARD={dust:250,xp:100,rescueLevel:10,candy:3,dailyWins:3} as const;
export const crewName=(faction:CrewEncounter['faction'])=>faction==='baret'?'Baretbende':'Olijfgarde';
const day=(now:number)=>new Date(now).toISOString().slice(0,10);
export function crewBudget(p:PlayerV2,now:number){const g=ensurePlaag(p);if(g.arcadeReward?.day!==day(now))g.arcadeReward={day:day(now),wins:0};return g.arcadeReward!;}
function createCrew(p:PlayerV2,source:{id:string;kind:'post'|'balloon';postId?:string;type:Element;expiresAt:number},token:PlaagToken):CrewEncounter{
 const h=arcadeSeed(token('crew-1:'+source.id)),faction=h%2?'baret':'olijf',roll=Math.floor(h/2)%100,level=trainerLevel(p.go!.trainer!.xp),tier=level<10?1:level<20?2:3;
 const ready=new Set(p.specimens.filter(b=>b.go&&!p.go?.gyms?.deployed.some(d=>d.specimen===b.id)).map(b=>b.species)).size>=3;
 const game=roll>=90&&ready?'combat':faction==='baret'?(roll<60||roll>=90?'tap_duel':'butterfly_catch'):(roll<60||roll>=90?'nest_defense':'bubble_swarm');
 const goals={tap_duel:[80,120,160],butterfly_catch:[100,140,180],nest_defense:[180,240,300],bubble_swarm:[120,180,240]},pool=(plaagPools()[source.type]??[]).filter(s=>evolutionStage(s)===1),rescueSpecies=pool[arcadeSeed(token('crew-rescue:'+p.uid+':'+source.id))%pool.length]??plaagTeam(source.id,source.type)[0];
 return {version:'crew-1',...source,faction,game,tier,targetScore:game==='combat'?0:goals[game][tier-1],rescueSpecies,shiny:arcadeSeed(token('crew-shiny:'+p.uid+':'+source.id))%512===0};
}
export function ensureCrewEncounter(p:PlayerV2,source:Parameters<typeof createCrew>[1],token:PlaagToken){const g=ensurePlaag(p),all=g.encounters??={};return all[source.id]??=createCrew(p,source,token);}
/** Called only with server-computed visible invasions/stored balloon, never client-supplied identities. */
export function prepareCrewViews(p:PlayerV2,views:PlaagView[],now:number,token:PlaagToken){
 const g=ensurePlaag(p);g.encounters??={};for(const v of views)ensureCrewEncounter(p,{id:v.id,kind:'post',postId:v.postId,type:v.type,expiresAt:v.endsAt},token);
 const b=g.balloon;if(b&&b.until>now&&!g.cleared.includes(b.id))ensureCrewEncounter(p,{id:b.id,kind:'balloon',type:b.type,expiresAt:b.until},token);
 for(const [id,c]of Object.entries(g.encounters))if(c.expiresAt<=now)delete g.encounters[id];
}
export function resolveCrew(p:PlayerV2,raw:unknown,now:number,token:PlaagToken){
 const source=plaagTarget(p,raw,now,token),expiresAt=source.kind==='balloon'?ensurePlaag(p).balloon!.until:(Math.floor(now/(3*3600000))+1)*3*3600000;
 return ensureCrewEncounter(p,{...source,expiresAt},token);
}
export function settleCrew(p:PlayerV2,crew:CrewEncounter,won:boolean,run:string,now:number){
 check(crew.version==='crew-1','Deze bendeversie is niet beschikbaar.');const g=ensurePlaag(p),budget=crewBudget(p,now),first=won&&!g.cleared.includes(crew.id),rewarded=first&&!crew.practice&&budget.wins<CREW_REWARD.dailyWins;
 const receipt:CrewReceipt={encounter:crew.id,faction:crew.faction,tier:crew.tier,rewarded,practice:!!crew.practice||budget.wins>=3,candy:0};
 if(first){g.cleared=[...g.cleared,crew.id].slice(-60);g.wins++;if(g.balloon?.id===crew.id)g.balloon=null;}
 if(!rewarded)return {dust:0,xp:0,crew:receipt};
 budget.wins++;const species=crew.rescueSpecies,go=rollGoBug(species,'crew-1:'+p.uid+':'+crew.id);go.level=10;
 const rescued:Specimen={id:'gered-'+run,species,level:1,shiny:crew.shiny,favorite:false,obtainedAt:now,source:'plaagbende',hearts:0,item:null,go};p.specimens.push(rescued);if(!p.discovered.includes(species))p.discovered.push(species);
 const own=p.go!,key=family(species);own.dust+=250;grantXP(p,100);own.candy[key]=(own.candy[key]??0)+3;own.dex??=[];if(!own.dex.includes(species))own.dex.push(species);markGoSeen(p,species,now);own.entries![species].caughtAt??=now;if(rescued.shiny)own.entries![species].shinyAt??=now;if(!p.buddy)p.buddy=rescued.id;
 receipt.rescued={id:rescued.id,species,shiny:rescued.shiny};receipt.candy=3;receipt.family=key;return {dust:250,xp:100,crew:receipt,rescued};
}
