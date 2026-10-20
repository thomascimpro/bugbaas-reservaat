import { BattleBudgetError, simulate } from './battleV2';
import { finishShop, freshShop, nextShop } from './shopV2';
import type { Duel, PlayerV2, Side } from './typesV2';
export const eloDelta=(a:number,b:number,result:number)=>Math.round(32*(result-1/(1+10**((b-a)/400))));
export const rankName=(rating:number)=>rating<1100?'Brons':rating<1300?'Zilver':rating<1500?'Goud':'Diamant';
export const band=(age:number)=>age<15000?100:age<30000?150:200;
export function createDuel(a:PlayerV2,b:PlayerV2,id:string,now:number,seeds:NonNullable<Duel['seeds']>,ranked=true):Duel{return {id,seeds,revision:0,players:[a.uid,b.uid],names:[a.name,b.name],ratings:[a.rating,b.rating],lives:[6,6],shops:[freshShop(1,seeds[0].shops[0]),freshShop(1,seeds[0].shops[1])],round:1,phase:'shop',deadline:now+90000,season:a.season,ranked,battle:null,winner:null,void:false,delta:0,settled:false,createdAt:now};}
export function advanceDuel(m:Duel,now:number){if(m.phase==='finished')return;
 if(m.phase==='shop'&&(m.deadline<=now||m.shops.every(s=>s.ready))){for(const s of [0,1] as Side[]){if(!m.shops[s].ready){m.shops[s].missed++;finishShop(m.shops[s],m.id+'-end-'+m.round+'-'+s);}}
 const absent=([0,1] as Side[]).filter(s=>m.shops[s].missed>=2);if(absent.length){m.phase='finished';m.void=absent.length===2;m.winner=absent.length===2?null:(1-absent[0]) as Side;m.revision++;return;}
 try{m.battle=simulate(m.shops[0].team,m.shops[1].team,m.seeds![m.round-1].battle);}catch(e){if(!(e instanceof BattleBudgetError))throw e;m.phase='finished';m.void=true;m.winner=null;m.revision++;return;}
 if(m.battle.winner!==null)m.lives[(1-m.battle.winner) as Side]--;m.phase='battle';m.deadline=now+Math.min(20000,Math.max(4000,m.battle.events.length*480+1000));m.revision++;return;}
 if(m.phase==='battle'&&m.deadline<=now){if(m.lives.some(l=>l<=0)||m.round>=30){m.phase='finished';m.winner=m.lives[0]===m.lives[1]?null:m.lives[0]>m.lives[1]?0:1;}else{m.round++;for(const s of [0,1] as Side[])nextShop(m.shops[s],m.round,m.seeds![m.round-1].shops[s]);m.phase='shop';m.deadline=now+90000;}m.revision++;}
}
export function settleDuel(m:Duel,a:PlayerV2,b:PlayerV2,now:number){if(m.phase!=='finished'||m.settled)return;m.settled=true;const ps=[a,b];m.delta=m.ranked&&!m.void?eloDelta(m.ratings[0],m.ratings[1],m.winner===null?.5:m.winner===0?1:0):0;
 for(const s of [0,1] as Side[]){const p=ps[s],other=ps[(1-s) as Side],change=s===0?m.delta:-m.delta;if(m.ranked&&!m.void){if(p.season===m.season){p.rating+=change;p.highestRating=Math.max(p.highestRating,p.rating);p.seasonMatches++;}if(m.winner===s)p.wins++;else if(m.winner!==null)p.losses++;}p.recent[other.uid]=now;p.history.unshift({id:m.id,opponent:other.name,result:m.void?'Ongeldig':m.winner===null?'Gelijkspel':m.winner===s?'Gewonnen':'Verloren',delta:change,at:now,season:m.season});p.history=p.history.slice(0,30);p.revision++;}
}
