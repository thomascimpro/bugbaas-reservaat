import {rng} from './catalogV2';
import {stats,ownedGo,markGoSeen} from './goV2';
import {dayV2} from './safariV2';
import {checkV2 as check} from './shopV2';
import {distance,requireFieldLocation} from './walkingV2';
import type {FriendPair,PlayerV2,Side,Specimen} from './typesV2';

export const GO_TRADE={range:100,daily:20,regularDust:100,specialDust:1000,duration:5*60000} as const;
export type GoTradeProgress={day:string;count:number;specialDay?:string};
export type TradeOffer={bug:Specimen;cp:number};
export type GoTrade={id:string;pair:string;users:[string,string];names:[string,string];revision:number;status:'offering'|'completed'|'cancelled';offers:[TradeOffer|null,TradeOffer|null];accepted:[boolean,boolean];createdAt:number;expiresAt:number;completedAt?:number;terms?:{special:boolean;dust:number};seed?:string};

function friend(players:[PlayerV2,PlayerV2],pair:FriendPair|undefined){
 check(pair&&pair.accepted&&!pair.removed&&pair.users[0]!==pair.users[1]&&players.every((p,i)=>p.uid===pair.users[i]),'Kies twee bevriende spelers.',403);
 check(players.every(p=>p.go&&!p.go.battle&&!p.go.queue),'Rond eerst allebei je gevecht of zoekopdracht af.');return pair;
}
function nearby(players:[PlayerV2,PlayerV2],now:number){const [a,b]=players.map(p=>requireFieldLocation(p.walking,now));check(distance(a.fix,b.fix)<=GO_TRADE.range,'Ga allebei binnen 100 meter staan en vernieuw jullie GPS.');}
function active(t:GoTrade,uid:string,revision:unknown,now:number){check(t.users.includes(uid),'Deze ruil is niet van jou.',403);check(t.status==='offering'&&t.expiresAt>now,'Deze ruil is afgelopen. Start opnieuw.');check(Number.isSafeInteger(revision)&&t.revision===revision,'Het aanbod is veranderd. Bekijk de ruil opnieuw.',409);return t.users.indexOf(uid) as Side;}
export function tradeBugIssue(p:PlayerV2,s:Specimen){
 if(!s.go)return 'Alleen bugs uit de GPS-collectie.';
 if(p.go?.gyms?.deployed.some(d=>d.specimen===s.id))return 'Deze bug verdedigt een gym.';
 if(s.go.traded)return 'Deze bug is al geruild.';
 if(s.favorite||s.id===p.buddy||p.go!.team.includes(s.id))return 'Haal deze bug eerst uit je team, buddy en favorieten.';
 return null;
}
export function startGoTrade(players:[PlayerV2,PlayerV2],pair:FriendPair|undefined,id:string,seed:string,now:number):GoTrade{
 const f=friend(players,pair);nearby(players,now);return {id,pair:f.id,users:[...f.users],names:players.map(p=>p.name) as [string,string],revision:0,status:'offering',offers:[null,null],accepted:[false,false],createdAt:now,expiresAt:now+GO_TRADE.duration,seed};
}
// Traded bugs never carry the original catcher's GPS spot.
function shared(bug:Specimen){const copy=structuredClone(bug);delete copy.catchLocation;return copy;}
export function offerGoTrade(t:GoTrade,players:[PlayerV2,PlayerV2],pair:FriendPair|undefined,uid:string,id:unknown,revision:unknown,now:number){
 const side=active(t,uid,revision,now),f=friend(players,pair);check(f.id===t.pair&&f.users.every((u,i)=>u===t.users[i]),'De vriendschap is veranderd.',409);nearby(players,now);
 const bug=ownedGo(players[side],id),issue=tradeBugIssue(players[side],bug);check(!issue,issue??'Deze bug kan niet geruild worden.');
 t.offers[side]={bug:shared(bug),cp:stats(bug).cp};if(t.offers.every(Boolean))t.terms=tradeTerms(t,players);else delete t.terms;t.accepted=[false,false];t.revision++;
}
export function tradeTerms(t:GoTrade,players:[PlayerV2,PlayerV2]){
 const special=t.offers.some((offer,i)=>offer&&(offer.bug.shiny||!players[1-i].go!.dex?.includes(offer.bug.species)));
 return {special,dust:special?GO_TRADE.specialDust:GO_TRADE.regularDust};
}
export function confirmGoTrade(t:GoTrade,players:[PlayerV2,PlayerV2],pair:FriendPair|undefined,uid:string,revision:unknown,special:unknown,now:number){
 const side=active(t,uid,revision,now),f=friend(players,pair);check(f.id===t.pair&&f.users.every((u,i)=>u===t.users[i]),'De vriendschap is veranderd.',409);nearby(players,now);
 check(t.offers.every(Boolean),'Kies allebei eerst één bug.');
 const bugs=t.offers.map((offer,i)=>{const p=players[i],bug=ownedGo(p,offer!.bug.id),issue=tradeBugIssue(p,bug);check(!issue,issue??'Deze bug kan niet geruild worden.');check(JSON.stringify(shared(bug))===JSON.stringify(offer!.bug),'Een aangeboden bug is veranderd. Kies het aanbod opnieuw.',409);return bug;});
 check(bugs[0].id!==bugs[1].id&&!players[0].specimens.some(s=>s.id===bugs[1].id)&&!players[1].specimens.some(s=>s.id===bugs[0].id),'Deze exemplaren kunnen niet veilig worden geruild.',409);
 const terms=tradeTerms(t,players),day=dayV2(now);
 check(typeof special==='boolean'&&(!terms.special||special),'Bevestig expliciet de speciale ruil en de stofkosten.');
 for(const p of players){const progress=p.go!.trades;check((progress?.day===day?progress.count:0)<GO_TRADE.daily,'Vandaag zijn alle 20 ruilen gebruikt.');check(!terms.special||progress?.specialDay!==day,'Vandaag is de speciale ruil al gebruikt.');check(p.go!.dust>=terms.dust,'Allebei hebben jullie voldoende nectarstof nodig.');}
 check(!t.accepted[side],'Je hebt dit aanbod al bevestigd.',409);
 if(!t.accepted[1-side]){t.accepted[side]=true;return false;}
 check(t.seed,'De ruil is verlopen. Start opnieuw.');
 const floor=f.points>=90?5:f.points>=30?3:f.points>=7?2:1;
 // Every validation precedes the swap. The service persists both players and this document in one transaction.
 const incoming=bugs.map((bug,i)=>{const result=shared(bug),random=rng(t.seed+':'+bug.id+':'+players[1-i].uid);result.go!.iv=[floor+Math.floor(random()*(16-floor)),floor+Math.floor(random()*(16-floor)),floor+Math.floor(random()*(16-floor))];result.go!.item=null;result.item=null;result.go!.traded={id:t.id,at:now,from:players[i].uid};return result;});
 for(let i=0;i<2;i++){const p=players[i],g=p.go!,received=incoming[1-i],previous=g.trades;
  p.specimens=p.specimens.filter(s=>s.id!==bugs[i].id);p.specimens.push(received);g.dust-=terms.dust;g.trades={day,count:(previous?.day===day?previous.count:0)+1,...(terms.special?{specialDay:day}:previous?.specialDay?{specialDay:previous.specialDay}:{})};
  if(!p.discovered.includes(received.species))p.discovered.push(received.species);if(received.shiny&&!p.shinies.includes(received.species))p.shinies.push(received.species);
  g.dex??=[];if(!g.dex.includes(received.species))g.dex.push(received.species);markGoSeen(p,received.species,now);g.entries![received.species].caughtAt??=now;if(received.shiny)g.entries![received.species].shinyAt??=now;
 }
 t.offers=incoming.map(bug=>({bug,cp:stats(bug).cp})) as [TradeOffer,TradeOffer];t.terms=terms;t.accepted=[true,true];t.status='completed';t.completedAt=now;t.revision++;delete t.seed;return true;
}
export function cancelGoTrade(t:GoTrade,uid:string,revision:unknown,_now:number){check(t.users.includes(uid),'Deze ruil is niet van jou.',403);check(t.status==='offering'&&t.revision===revision,'Deze ruil is al veranderd of afgelopen.',409);t.status='cancelled';t.accepted=[false,false];t.revision++;delete t.seed;}
export function publicGoTrade(t:GoTrade,_now:number){const result=structuredClone(t);delete result.seed;return result;}
