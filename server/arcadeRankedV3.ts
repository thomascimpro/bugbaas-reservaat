import {arcadeSeed,arcadeSquad} from '../game/arcade/tapDuel';
import type {ArcadeProgress,ArcadeReceipt,ArcadeTicket} from '../game/arcade/tapDuel';
import {ARCADE_GAMES,gameRules} from '../game/arcade/games';
import type {ArcadeGameId} from '../game/arcade/games';
import type {League} from '../game/goV2';
import type {PlayerV2} from '../game/typesV2';
import {checkV2 as check} from '../game/shopV2';
import {ARCADE_RANKED_DAILY_STARTS,ARCADE_RANKED_PAIR_MS,ARCADE_RANKED_TTL_MS,arcadeRankedRatingChange,freshArcadeRanked} from '../game/arcade/ranked';
import type {ArcadeRankedOutcome,ArcadeRankedProgress,ArcadeRankedRank,ArcadeRankedResult,ArcadeRankedTicket} from '../game/arcade/ranked';
import {document} from './store';
import type {Documents,Store} from './store';

export type ArcadeRankedDuel={id:string;status:'recording'|'ready'|'claimed'|'completed'|'cancelled';game:ArcadeGameId;league:League;rules:string;seed:number;challenge:string;createdAt:number;updatedAt:number;expiresAt:number;fromUid:string;fromName:string;fromRun:string;fromRating:number;fromScore?:number;fromAcceptedAt?:number;toUid?:string;toName?:string;toRun?:string;toScore?:number;settledAt?:number;fromResult?:ArcadeRankedResult;toResult?:ArcadeRankedResult};
type RankedRun=ArcadeTicket&{mode?:'rotation'|'practice'|'ranked';ranked?:ArcadeRankedTicket};
type RankedProgress=ArcadeProgress&{ranked?:ArcadeRankedProgress};
type RankedReceipt=ArcadeReceipt&{ranked?:ArcadeRankedResult};
const pk=(uid:string)=>'v2Players:'+uid;
const runKey=(uid:string,id:string)=>'v2ArcadeRuns:'+uid+'-'+id;
export const arcadeRankedDuelKey=(id:string)=>'v2ArcadeDuels:'+id;
export const arcadeRankedRankKey=(uid:string)=>'v2ArcadeRanks:'+uid;
// A separator absent from command IDs prevents another UID/run pair from aliasing this record.
export const rankedOwnDuelId=(uid:string,runId:string)=>encodeURIComponent(uid)+'~'+runId;
const day=(now:number)=>new Date(now).toISOString().slice(0,10);
const realUid=(uid:string)=>!!uid&&!['random','bugbot','computer'].includes(uid)&&!uid.startsWith('npc:');
function progress(p:PlayerV2,now:number){
 const a:RankedProgress=p.arcade??={day:day(now),rewarded:0,dailyDust:0,dailyXP:0,first:false,best:{},completed:0};
 const r=a.ranked??=freshArcadeRanked(now);if(r.day!==day(now)){r.day=day(now);r.starts=0;}
 r.recent=Object.fromEntries(Object.entries(r.recent).filter(([,at])=>Number.isFinite(at)&&now-at<ARCADE_RANKED_PAIR_MS));r.history=r.history.slice(-20);r.waiting=r.waiting.slice(-20);return r;
}
function rankSnapshot(p:PlayerV2){return (p.arcade as RankedProgress|undefined)?.ranked??freshArcadeRanked(0);}
function publishRank(d:Documents,p:PlayerV2,now:number){const r=progress(p,now);d.set(arcadeRankedRankKey(p.uid),{uid:p.uid,name:p.name,rating:r.rating,highest:r.highest,wins:r.wins,losses:r.losses,draws:r.draws,updatedAt:now} satisfies ArcadeRankedRank);}
function sameRules(ticket:RankedRun,duel:ArcadeRankedDuel){return ticket.game===duel.game&&ticket.rules===duel.rules&&ticket.seed===duel.seed&&ticket.challenge===duel.challenge&&ticket.league===duel.league;}
function validDuel(d:ArcadeRankedDuel,p:PlayerV2,league:League,now:number){return d.status==='ready'&&!d.toUid&&realUid(d.fromUid)&&d.fromUid!==p.uid&&d.league===league&&ARCADE_GAMES.some(g=>g.id===d.game)&&d.rules===gameRules(d.game)&&Number.isSafeInteger(d.seed)&&Number.isSafeInteger(d.fromScore)&&d.fromScore!>0&&Number.isFinite(d.expiresAt)&&d.expiresAt>now&&Number.isFinite(d.fromAcceptedAt)&&d.fromAcceptedAt!<=now&&now-d.fromAcceptedAt!<ARCADE_RANKED_TTL_MS&&!((rankSnapshot(p).recent[d.fromUid]??-Infinity)>now-ARCADE_RANKED_PAIR_MS);}
export async function findRankedCandidate(store:Store,p:PlayerV2,league:League,now:number):Promise<ArcadeRankedDuel|undefined>{
 if(!store.query)return undefined;const rows=await store.query<ArcadeRankedDuel>('v2ArcadeDuels',[{field:'status',op:'==',value:'ready'},{field:'league',op:'==',value:league},{field:'expiresAt',op:'>=',value:now}],undefined,100),rating=rankSnapshot(p).rating;
 const valid=rows.filter(d=>validDuel(d,p,league,now)),rankKeys=[...new Set(valid.map(d=>arcadeRankedRankKey(d.fromUid)))],ratings=rankKeys.length?await store.run(rankKeys,d=>Object.fromEntries(valid.map(v=>[v.fromUid,document<ArcadeRankedRank>(d,arcadeRankedRankKey(v.fromUid))?.rating??v.fromRating]))):{};
 return valid.sort((a,b)=>Math.abs(ratings[a.fromUid]-rating)-Math.abs(ratings[b.fromUid]-rating)||a.fromAcceptedAt!-b.fromAcceptedAt!||a.id.localeCompare(b.id))[0];
}
export function rankedStartKeys(uid:string,runId:string,candidate?:ArcadeRankedDuel){
 return [...new Set([pk(uid),runKey(uid,runId),arcadeRankedDuelKey(rankedOwnDuelId(uid,runId)),arcadeRankedRankKey(uid),...(candidate?[arcadeRankedDuelKey(candidate.id),pk(candidate.fromUid),runKey(candidate.fromUid,candidate.fromRun),arcadeRankedRankKey(candidate.fromUid)]:[])])];
}
export function rankedSubmitKeys(ticket:ArcadeTicket,duel?:ArcadeRankedDuel){const ranked=(ticket as RankedRun).ranked;return [...new Set([pk(ticket.owner),runKey(ticket.owner,ticket.id),arcadeRankedRankKey(ticket.owner),...(ranked?[arcadeRankedDuelKey(ranked.duel)]:[]),...(duel?[pk(duel.fromUid),runKey(duel.fromUid,duel.fromRun),arcadeRankedRankKey(duel.fromUid),...(duel.toUid&&duel.toRun?[pk(duel.toUid),runKey(duel.toUid,duel.toRun),arcadeRankedRankKey(duel.toUid)]:[])]:[])])];}
export async function readRankedDuel(store:Store,ticket:ArcadeTicket){const ranked=(ticket as RankedRun).ranked;return ranked?store.run([arcadeRankedDuelKey(ranked.duel)],d=>document<ArcadeRankedDuel>(d,arcadeRankedDuelKey(ranked.duel))):undefined;}
export function startRanked(d:Documents,p:PlayerV2,ids:unknown,league:unknown,runId:string,now:number,candidate?:ArcadeRankedDuel):ArcadeTicket{
 check(realUid(p.uid),'Alleen spelers doen mee aan de ranglijst.');check(typeof runId==='string'&&/^[\w-]{16,80}$/.test(runId),'Kies een geldige ronde.');
 const existing=document<RankedRun>(d,runKey(p.uid,runId));if(existing){check(existing.owner===p.uid&&existing.mode==='ranked','Deze ronde bestaat al.');return existing;}
 const squad=arcadeSquad(p,ids,league),r=progress(p,now);check(r.starts<ARCADE_RANKED_DAILY_STARTS,'Je hebt vandaag alle 25 rangrondes gespeeld.');
 let duel=candidate?document<ArcadeRankedDuel>(d,arcadeRankedDuelKey(candidate.id)):undefined;
 const from=duel?document<PlayerV2>(d,pk(duel.fromUid)):undefined,first=duel?document<RankedRun>(d,runKey(duel.fromUid,duel.fromRun)):undefined;
 // Re-check the read snapshot inside the same transaction. A raced claim falls back to an own run.
 if(!duel||!validDuel(duel,p,league as League,now)||!from||from.schemaVersion!==2||!first||first.owner!==duel.fromUid||first.status!=='accepted'||first.mode!=='ranked'||first.ranked?.side!=='from'||first.ranked.duel!==duel.id||!sameRules(first,duel)||!first.receipt||first.receipt.score!==duel.fromScore||!first.audit||first.audit.inputCount<1||((rankSnapshot(from).recent[p.uid]??-Infinity)>now-ARCADE_RANKED_PAIR_MS))duel=undefined;
 let side:'from'|'to'='from';
 if(duel){side='to';duel.status='claimed';duel.toUid=p.uid;duel.toName=p.name;duel.toRun=runId;duel.updatedAt=now;r.recent[duel.fromUid]=now;progress(from!,now).recent[p.uid]=now;from!.revision++;d.set(pk(from!.uid),from);publishRank(d,from!,now);}
 else{const id=rankedOwnDuelId(p.uid,runId),old=document<ArcadeRankedDuel>(d,arcadeRankedDuelKey(id));check(!old,'Deze rangronde bestaat al.');const choice=p.uid+':'+r.day+':'+r.starts,game=ARCADE_GAMES[arcadeSeed('ranked-game:'+choice)%ARCADE_GAMES.length].id,rules=gameRules(game),challenge='ranked:'+id+':'+rules+':'+league;duel={id,status:'recording',game,league:league as League,rules,seed:arcadeSeed('ranked-seed:'+choice),challenge,createdAt:now,updatedAt:now,expiresAt:now+ARCADE_RANKED_TTL_MS,fromUid:p.uid,fromName:p.name,fromRun:runId,fromRating:r.rating};}
 const ticket:RankedRun={id:runId,owner:p.uid,mode:'ranked',ranked:{duel:duel.id,side},game:duel.game,challenge:duel.challenge,rules:duel.rules,league:duel.league,seed:duel.seed,squad,issuedAt:now,expiresAt:now+86400000,target:side==='to'?{name:duel.fromName,score:duel.fromScore!,kind:'player'}:{name:'Wacht op tegenstander',score:0,kind:'computer'},status:'started'};
 r.starts++;p.arcade!.active=runId;d.set(runKey(p.uid,runId),ticket);d.set(arcadeRankedDuelKey(duel.id),duel);publishRank(d,p,now);return ticket;
}
function updateReceipt(p:PlayerV2,t:RankedRun,result:ArcadeRankedResult){check(t.receipt,'De bevestiging ontbreekt.');(t.receipt as RankedReceipt).ranked=result;t.receipt.won=result.result==='win';t.receipt.feedback=result.status==='waiting'?'Score staat klaar · wachten op tegenstander':result.status==='cancelled'?'Rangronde afgesloten':result.result==='draw'?'Gelijkspel':result.result==='win'?'Rangduel gewonnen!':'Rangduel verloren';if(p.arcade?.last?.runId===t.id)p.arcade.last=t.receipt;}
function terminalReceipt(t:RankedRun):RankedReceipt{return {runId:t.id,score:0,dust:0,xp:0,qualified:false,won:false,personalBest:false,game:t.game,endReason:'time'};}
function bonus(p:PlayerV2,t:RankedRun,now:number){const rt=t.ranked!;if(!rt.baseEligible||rt.bonusPaid||!t.receipt||t.receipt.dust<=0)return 0;rt.bonusPaid=true;p.go!.dust+=25;t.receipt.dust+=25;if(day(rt.acceptedAt!)===day(now)&&p.arcade?.day===day(now))p.arcade.dailyDust+=25;return 25;}
function record(p:PlayerV2,t:RankedRun,opponent:PlayerV2,opponentScore:number,outcome:ArcadeRankedOutcome,opponentRating:number,now:number,duel:ArcadeRankedDuel){const r=progress(p,now),change=arcadeRankedRatingChange(r,opponentRating,outcome);r.rating=change.rating;r.highest=Math.max(r.highest,r.rating);if(outcome==='win')r.wins++;else if(outcome==='loss')r.losses++;else r.draws++;r.recent[opponent.uid]=now;r.waiting=r.waiting.filter(id=>id!==duel.id);r.history=[...r.history,{duel:duel.id,game:duel.game,opponent:opponent.name,result:outcome,score:t.receipt!.score,opponentScore,delta:change.delta,rating:r.rating,at:now}].slice(-20);const result:ArcadeRankedResult={duel:duel.id,status:'completed',result:outcome,opponent:opponent.name,opponentScore,rating:r.rating,delta:change.delta,bonusDust:outcome==='win'?bonus(p,t,now):0,at:now};updateReceipt(p,t,result);return result;}

/** Called only after submitArcade has server-replayed the input (or with explicit forfeit=true).
 * Receipt score/audit are trusted server outputs; this API accepts no client score.
 */
export function completeRanked(d:Documents,p:PlayerV2,raw:ArcadeTicket,now:number,forfeit=false):ArcadeReceipt{
 const ticket=raw as RankedRun,rt=ticket.ranked;check(rt&&ticket.mode==='ranked'&&ticket.owner===p.uid,'Deze rangronde is niet van jou.');const duel=document<ArcadeRankedDuel>(d,arcadeRankedDuelKey(rt.duel));check(duel&&sameRules(ticket,duel),'Deze rangronde klopt niet.');
 check((rt.side==='from'?duel.fromUid===p.uid&&duel.fromRun===ticket.id:duel.toUid===p.uid&&duel.toRun===ticket.id),'Deze rangronde is niet van jou.');
 if(duel.status==='completed'||duel.status==='cancelled'){check(ticket.receipt,'De bevestiging ontbreekt.');return ticket.receipt;}
 if(rt.side==='from'&&(duel.status==='ready'||duel.status==='claimed')){check(ticket.receipt,'De bevestiging ontbreekt.');return ticket.receipt;}
 if(forfeit){ticket.status='abandoned';ticket.receipt=terminalReceipt(ticket);if(p.arcade?.active===ticket.id)delete p.arcade.active;}
 else check(ticket.status==='accepted'&&ticket.receipt&&ticket.audit,'Speel de ronde eerst uit.');
 const receipt=ticket.receipt!;check(Number.isSafeInteger(receipt.score)&&receipt.score>=0,'Deze score klopt niet.');
 if(rt.acceptedAt===undefined){rt.acceptedAt=now;rt.baseEligible=!forfeit&&receipt.dust>0;rt.bonusPaid=false;}
 if(rt.side==='from'){
  if(forfeit||receipt.score<=0||!ticket.audit?.inputCount){duel.status='cancelled';duel.updatedAt=now;updateReceipt(p,ticket,{duel:duel.id,status:'cancelled',rating:progress(p,now).rating,delta:0,bonusDust:0,at:now});}
  else{duel.status='ready';duel.fromScore=receipt.score;duel.fromAcceptedAt=now;duel.expiresAt=now+ARCADE_RANKED_TTL_MS;duel.updatedAt=now;const r=progress(p,now);duel.fromRating=r.rating;r.waiting=[...r.waiting.filter(id=>id!==duel.id),duel.id].slice(-20);updateReceipt(p,ticket,{duel:duel.id,status:'waiting',rating:r.rating,delta:0,bonusDust:0,at:now});}d.set(arcadeRankedDuelKey(duel.id),duel);d.set(runKey(p.uid,ticket.id),ticket);publishRank(d,p,now);return receipt;
 }
 check(duel.status==='claimed','Deze rangronde is al afgesloten.');
 const other=document<PlayerV2>(d,pk(duel.fromUid)),first=document<RankedRun>(d,runKey(duel.fromUid,duel.fromRun));check(other&&realUid(other.uid)&&other.schemaVersion===2&&other.uid!==p.uid&&first&&first.status==='accepted'&&first.mode==='ranked'&&first.ranked?.duel===duel.id&&first.ranked.side==='from'&&first.owner===other.uid&&sameRules(first,duel)&&first.receipt&&first.audit&&first.audit.inputCount>0&&first.receipt.score===duel.fromScore&&first.receipt.score>0,'De eerdere spelersscore ontbreekt.');
 const ownRating=progress(p,now).rating,otherRating=progress(other,now).rating,ownScore=receipt.score,otherScore=first.receipt.score,outcome:ArcadeRankedOutcome=ownScore>otherScore?'win':ownScore<otherScore?'loss':'draw';
 duel.toScore=ownScore;duel.toResult=record(p,ticket,other,otherScore,outcome,otherRating,now,duel);duel.fromResult=record(other,first,p,ownScore,outcome==='win'?'loss':outcome==='loss'?'win':'draw',ownRating,now,duel);duel.status='completed';duel.settledAt=now;duel.updatedAt=now;other.revision++;d.set(pk(other.uid),other);d.set(runKey(other.uid,first.id),first);d.set(runKey(p.uid,ticket.id),ticket);d.set(arcadeRankedDuelKey(duel.id),duel);publishRank(d,p,now);publishRank(d,other,now);return receipt;
}

/** Lazy expiry when either participant returns; bounded by this player's known records.
 * No public duel scan or timer is needed, including when both players have been offline.
 */
export async function expireRankedDuels(store:Store,snapshot:PlayerV2,now:number):Promise<boolean>{
 const waiting=[...new Set(snapshot.arcade?.ranked?.waiting??[])].slice(-20),active=snapshot.arcade?.active;
 if(!waiting.length&&!active)return false;
 const initialKeys=[...waiting.map(arcadeRankedDuelKey),...(active?[runKey(snapshot.uid,active)]:[])];
 const initial=await store.run(initialKeys,d=>({duels:waiting.map(id=>document<ArcadeRankedDuel>(d,arcadeRankedDuelKey(id))).filter((duel):duel is ArcadeRankedDuel=>!!duel),ticket:active?document<RankedRun>(d,runKey(snapshot.uid,active)):undefined}));
 const own=initial.ticket;
 if(own?.owner===snapshot.uid&&own.mode==='ranked'&&own.ranked&&!initial.duels.some(d=>d.id===own.ranked!.duel)){
  const duel=await readRankedDuel(store,own);if(duel)initial.duels.push(duel);
 }
 const candidates=initial.duels.filter(duel=>(duel.fromUid===snapshot.uid||duel.toUid===snapshot.uid)&&(duel.status==='claimed'||duel.status==='ready'&&duel.expiresAt<=now||duel.status==='recording'&&own?.id===duel.fromRun&&own.expiresAt<=now));
 const targetKeys=[...new Set(candidates.map(duel=>runKey(duel.status==='claimed'?duel.toUid!:duel.fromUid,duel.status==='claimed'?duel.toRun!:duel.fromRun)))];
 const runs=targetKeys.length?await store.run(targetKeys,d=>new Map(targetKeys.map(key=>[key,document<RankedRun>(d,key)]))):new Map<string,RankedRun|undefined>();
 let changed=false;
 for(const previous of candidates){
  const targetUid=previous.status==='claimed'?previous.toUid:previous.fromUid,targetRun=previous.status==='claimed'?previous.toRun:previous.fromRun;
  if(!targetUid||!targetRun)continue;
  const preliminary=runs.get(runKey(targetUid,targetRun));
  if(!preliminary?.ranked||preliminary.ranked.duel!==previous.id)continue;
  if(previous.status!=='ready'&&(preliminary.status!=='started'||preliminary.expiresAt>now))continue;
  const updated=await store.run(rankedSubmitKeys(preliminary,previous),d=>{
   const duel=document<ArcadeRankedDuel>(d,arcadeRankedDuelKey(previous.id));
   if(!duel||duel.status!==previous.status||duel.toUid!==previous.toUid||duel.toRun!==previous.toRun)return false;
   const p=document<PlayerV2>(d,pk(targetUid)),ticket=document<RankedRun>(d,runKey(targetUid,targetRun));
   if(!p||p.schemaVersion!==2||!ticket||ticket.owner!==p.uid||ticket.mode!=='ranked'||!ticket.ranked||!sameRules(ticket,duel))return false;
   if(duel.status==='ready'){
    if(duel.expiresAt>now||ticket.status!=='accepted'||!ticket.receipt||ticket.ranked.side!=='from')return false;
    duel.status='cancelled';duel.updatedAt=now;progress(p,now).waiting=progress(p,now).waiting.filter(id=>id!==duel.id);
    updateReceipt(p,ticket,{duel:duel.id,status:'cancelled',rating:progress(p,now).rating,delta:0,bonusDust:0,at:now});
    d.set(arcadeRankedDuelKey(duel.id),duel);d.set(runKey(p.uid,ticket.id),ticket);publishRank(d,p,now);
   }else if(duel.status==='recording'||duel.status==='claimed'){
    if(ticket.status!=='started'||ticket.expiresAt>now)return false;
    completeRanked(d,p,ticket,now,true);
   }else return false;
   p.revision++;d.set(pk(p.uid),p);return true;
  });
  changed||=updated;
 }
 return changed;
}
