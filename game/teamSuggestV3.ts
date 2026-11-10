import {effectiveness} from './goBattleV2';
import {CHARGED,FAST,movePool,stats} from './goV2';
import type {Element} from './goV2';
import type {PlayerV2,Specimen} from './typesV2';

// Team suggestions for the team screen (UX 11 Nov): no arena/CP choice for the player, just ready-made teams.
// 'strongest' = three highest CP of different species; 'coverage' = strong bugs whose attacks cover as many
// different types as possible while sharing as few weaknesses as possible. Pure: only reads the collection.
export const ELEMENTS:readonly Element[]=['bug','flying','poison','grass','ground','rock','steel','dark','normal','fire','water'];
export function attackTypes(s:Specimen):Element[]{
 const g=s.go;if(!g)return [];
 return [...new Set([FAST[g.fast]?.type,...g.charged.map(m=>CHARGED[m]?.type)].filter(Boolean) as Element[])];
}
export function weaknessesOf(team:readonly Specimen[]):{type:Element;count:number}[]{
 return ELEMENTS.map(type=>({type,count:team.filter(s=>effectiveness(type,movePool(s.species).types)>1).length})).filter(w=>w.count>=2).sort((a,b)=>b.count-a.count);
}
export function coverageOf(team:readonly Specimen[]):Element[]{return [...new Set(team.flatMap(attackTypes))];}

function available(p:PlayerV2){
 return p.specimens.filter(s=>s.go&&!p.go?.gyms?.deployed.some(d=>d.specimen===s.id)).sort((a,b)=>stats(b).cp-stats(a).cp);
}
export function strongestTeam(p:PlayerV2):string[]{
 const team:Specimen[]=[];for(const s of available(p)){if(team.length===3)break;if(!team.some(t=>t.species===s.species))team.push(s);}return team.map(s=>s.id);
}
/** Best type coverage among the 15 strongest bugs (all 3-combinations, different species). */
export function coverageTeam(p:PlayerV2):string[]{
 const pool=[] as Specimen[];for(const s of available(p)){if(pool.length===15)break;if(!pool.some(t=>t.species===s.species))pool.push(s);}
 if(pool.length<=3)return pool.map(s=>s.id);
 const top=stats(pool[0]).cp||1;let best:{ids:string[];score:number}|null=null;
 for(let a=0;a<pool.length;a++)for(let b=a+1;b<pool.length;b++)for(let c=b+1;c<pool.length;c++){
  const team=[pool[a],pool[b],pool[c]],cover=coverageOf(team).length,shared=weaknessesOf(team).reduce((n,w)=>n+w.count-1,0),cp=team.reduce((n,s)=>n+stats(s).cp,0)/(3*top);
  const score=cover*10-shared*6+cp*8;
  if(!best||score>best.score)best={ids:team.map(s=>s.id),score};
 }
 return best!.ids;
}
