import {DEX_SPECIES} from './dexV2';
import type {PlayerV2} from './typesV2';

// Trainer medals (display only, PoGO-style): read from lifetime counters the server already keeps.
// No rewards and no new rules; a medal never changes stats, rewards or matchmaking. Raids and gyms have no
// lifetime counter yet, so they are not listed (would need a server counter first).
export const MEDAL_TIERS=['brons','zilver','goud','platina'] as const;
export type MedalTier=typeof MEDAL_TIERS[number];
export type MedalId='jager'|'wandelaar'|'verzamelaar'|'broeder'|'strijder'|'scherpschutter'|'shinyjager'|'arcade';
export type MedalDef={id:MedalId;name:string;what:string;unit:string;goals:readonly [number,number,number,number];value:(p:PlayerV2)=>number};

export const MEDALS:readonly MedalDef[]=[
 {id:'jager',name:'Jager',what:'Bugs gevangen op de kaart',unit:'bugs',goals:[25,150,600,2000],value:p=>p.field?.total.catches??0},
 {id:'wandelaar',name:'Wandelaar',what:'Kilometers gelopen',unit:'km',goals:[5,25,100,300],value:p=>Math.floor((p.field?.walk?.meters??0)/100)/10},
 {id:'verzamelaar',name:'Verzamelaar',what:'Verschillende soorten in je Bugdex',unit:'soorten',goals:[10,30,75,DEX_SPECIES.length],value:p=>new Set(p.go?.dex??[]).size},
 {id:'broeder',name:'Broeder',what:'Cocons uitgebroed',unit:'cocons',goals:[3,15,50,150],value:p=>p.go?.cocoons?.hatched??0},
 {id:'strijder',name:'Strijder',what:'Gevechten gewonnen',unit:'zeges',goals:[5,25,100,300],value:p=>p.go?.wins??0},
 {id:'scherpschutter',name:'Netmeester',what:'Perfecte networpen',unit:'perfect',goals:[10,50,200,750],value:p=>p.field?.total.perfect??0},
 {id:'shinyjager',name:'Shinyjager',what:'Verschillende shiny bugs',unit:'shiny',goals:[1,5,15,40],value:p=>new Set(p.shinies??[]).size},
 {id:'arcade',name:'Arcadeheld',what:'Arcaderondes uitgespeeld',unit:'rondes',goals:[10,50,150,400],value:p=>p.arcade?.completed??0},
];

export type MedalState={def:MedalDef;value:number;tier:number;next:number|null;progress:number};
/** tier: 0 = none yet, 1..4 = brons..platina; progress = share toward the next goal (1 when complete). */
export function medalState(def:MedalDef,p:PlayerV2):MedalState{
 const value=Math.max(0,def.value(p)),tier=def.goals.filter(g=>value>=g).length,next=tier<4?def.goals[tier]:null,from=tier?def.goals[tier-1]:0;
 return {def,value,tier,next,progress:next===null?1:Math.max(0,Math.min(1,(value-from)/(next-from)))};
}
export function medalStates(p:PlayerV2){return MEDALS.map(m=>medalState(m,p));}
export function medalScore(p:PlayerV2){return medalStates(p).reduce((sum,m)=>sum+m.tier,0);}
