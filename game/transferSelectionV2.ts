import type {PlayerV2,Specimen} from './typesV2';
import {appraisal,family,stats,movePool,FAST,CHARGED} from './goV2';
import {bugRarity} from './rarityDisplayV2';

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

/** Server limit of goTransferMany per call. */
export const TRANSFER_BATCH=50;
/** keepBest: how many of each species stay (best aanleg, then CP; the highest CP also stays). keepRare: 4-5 star rarity. keepGood: Super/Perfect appraisal. keepTwoMoves: two charged attacks. */
export type TransferOptionsV2={keepBest:0|1|2;keepRare:boolean;keepGood:boolean;keepTwoMoves:boolean};
export const DEFAULT_TRANSFER_OPTIONS:TransferOptionsV2={keepBest:1,keepRare:true,keepGood:true,keepTwoMoves:true};
/** Always kept, whatever the options: shiny, favorite, buddy, team and gym defenders (the server refuses these too). */
export function lockedBugV2(p:PlayerV2,s:Specimen){return !s.go||s.shiny||s.favorite||s.id===p.buddy||!!p.go?.team.includes(s.id)||!!p.go?.gyms?.deployed.some(d=>d.specimen===s.id);}
const score=(s:Specimen)=>s.go!.iv.reduce((a,n)=>a+n,0)*100000+stats(s).cp;
/** Pure selection for the transfer helper: every bug that may go, weakest first. The caller sends at most TRANSFER_BATCH per call. */
export function transferSelectionV2(p:PlayerV2,options:TransferOptionsV2=DEFAULT_TRANSFER_OPTIONS,pool:readonly Specimen[]=p.specimens):Specimen[]{
 const keep=new Set<string>(),groups=new Map<string,Specimen[]>();
 for(const s of p.specimens.filter(s=>s.go)){const group=groups.get(s.species)??[];group.push(s);groups.set(s.species,group);}
 if(options.keepBest>0)for(const group of groups.values()){
  const ranked=[...group].sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));for(const s of ranked.slice(0,options.keepBest))keep.add(s.id);
  const strongest=[...group].sort((a,b)=>stats(b).cp-stats(a).cp||a.id.localeCompare(b.id))[0];if(strongest)keep.add(strongest.id);
 }
 return pool.filter(s=>s.go&&!lockedBugV2(p,s)&&!keep.has(s.id)&&!(options.keepRare&&bugRarity(s.species)>=4)&&!(options.keepGood&&appraisal(s)>=3)&&!(options.keepTwoMoves&&s.go.charged.length>1)).sort((a,b)=>score(a)-score(b)||a.id.localeCompare(b.id));
}
/** Nectar per family for a transfer: +1 per bug (transferGo in game/goV2.ts). */
export function transferNectarV2(bugs:readonly Specimen[]){const out=new Map<string,number>();for(const s of bugs)out.set(family(s.species),(out.get(family(s.species))??0)+1);return [...out.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));}

/** Return-screen cleanup: keep useful current fighters, breeding/build potential and investments. */
export function smartTransferSelectionV2(p:PlayerV2,pool:readonly Specimen[]=p.specimens){
 if(!pool.length)return [];
 const all=p.specimens.filter(s=>s.go),keep=new Set<string>(),rated=all.map(s=>({s,st:stats(s),iv:s.go!.iv.reduce((n,v)=>n+v,0),types:movePool(s.species).types})),top=Math.max(0,...rated.map(r=>r.st.cp));
 for(const r of rated){const g=r.s.go!;if(lockedBugV2(p,r.s)||g.item||g.charged.length>1||appraisal(r.s)>=3||r.st.cp>=top*.8||(g.iv[0]<=3&&g.iv[1]>=12&&g.iv[2]>=12))keep.add(r.s.id);}
 const families=new Map<string,typeof rated>();for(const r of rated){const f=family(r.s.species);families.set(f,[...(families.get(f)??[]),r]);}
 for(const group of families.values()){const best=[...group].sort((a,b)=>b.iv-a.iv||b.st.cp-a.st.cp||a.s.id.localeCompare(b.s.id))[0];if(best.iv>=30)keep.add(best.s.id);}
 const types=new Set(rated.flatMap(r=>r.types));
 for(const type of types)for(const cap of [1500,2500,Infinity]){
  const group=rated.filter(r=>r.st.cp<=cap&&r.types.includes(type));
  const bulk=[...group].sort((a,b)=>b.st.cp-a.st.cp||b.iv-a.iv||a.s.id.localeCompare(b.s.id))[0];if(bulk)keep.add(bulk.s.id);
  const power=(r:typeof rated[number])=>r.st.attack*(FAST[r.s.go!.fast].type===type?FAST[r.s.go!.fast].power/(FAST[r.s.go!.fast].turns*.5):0)+r.st.attack*Math.max(0,...r.s.go!.charged.filter(m=>CHARGED[m].type===type).map(m=>CHARGED[m].power/CHARGED[m].energy));
  const attack=[...group].sort((a,b)=>power(b)-power(a)||b.st.cp-a.st.cp||a.s.id.localeCompare(b.s.id))[0];if(attack)keep.add(attack.s.id);
 }
 return pool.filter(s=>s.go&&!keep.has(s.id)&&!lockedBugV2(p,s)).sort((a,b)=>score(a)-score(b)||a.id.localeCompare(b.id));
}
