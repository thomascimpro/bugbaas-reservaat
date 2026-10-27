import type {PlayerV2,Specimen} from './typesV2';
import {stats} from './goV2';

/** Select only; the existing protected server transfer and confirmation still decide deletion. */
export function weakDuplicatesV2(p:PlayerV2,shown:Specimen[]){
 const protectedBug=(s:Specimen)=>!s.go||s.shiny||s.favorite||s.id===p.buddy||p.go!.team.includes(s.id)||!!s.go.item||s.go.charged.length>1||!!p.go?.gyms?.deployed.some(d=>d.specimen===s.id);
 const groups=new Map<string,Specimen[]>();for(const s of p.specimens.filter(s=>s.go)){const group=groups.get(s.species)??[];group.push(s);groups.set(s.species,group);}
 const keep=new Set<string>();for(const group of groups.values()){
  const byIV=[...group].sort((a,b)=>b.go!.iv.reduce((x,y)=>x+y,0)-a.go!.iv.reduce((x,y)=>x+y,0)||stats(b).cp-stats(a).cp||a.id.localeCompare(b.id));
  if(byIV[0])keep.add(byIV[0].id);const strongest=[...group].sort((a,b)=>stats(b).cp-stats(a).cp||a.id.localeCompare(b.id))[0];if(strongest)keep.add(strongest.id);
 }
 return shown.filter(s=>!protectedBug(s)&&!keep.has(s.id)&&s.go!.iv.reduce((x,y)=>x+y,0)<30).slice(0,50).map(s=>s.id);
}
