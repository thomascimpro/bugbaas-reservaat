import type {PlayerV2,Specimen} from './typesV2';
import {appraisal,family,stats} from './goV2';
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
