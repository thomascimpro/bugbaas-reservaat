import {createHash} from 'node:crypto';
import {arcadeSeed,arcadeSquad,TICK_MS} from '../game/arcade/tapDuel';
import {ARCADE_GAMES,gameRules,replayArcade,supportsArcadeRules} from '../game/arcade/games';
import {isOriginalRules,ORIGINAL_MAX_BYTES} from '../game/arcade/original';
import type {ArcadeGameId} from '../game/arcade/games';
import type {ArcadeNext,ArcadeProgress,ArcadeProgressView,ArcadeScoreView,ArcadeTicket,ArcadeWeeklyReward} from '../game/arcade/tapDuel';
import {family} from '../game/goV2';
import type {League} from '../game/goV2';
import type {PlayerV2} from '../game/typesV2';
import {grantXP} from '../game/trainerV2';
import {creditBuddyPlay} from '../game/buddyV2';
import {crewName,crewBudget,settleCrew} from '../game/arcade/crew';
import type {CrewEncounter} from '../game/arcade/crew';
import {checkV2 as check} from '../game/shopV2';
import {document} from './store';
import type {Documents,Store} from './store';

export const arcadeRunKey=(uid:string,id:string)=>'v2ArcadeRuns:'+uid+'-'+id;
export const arcadeScoreKey=(uid:string,challenge:string)=>'v2ArcadeScores:'+createHash('sha256').update(challenge+':'+uid).digest('hex');
export type ArcadeScore={uid:string;name:string;challenge:string;score:number;run:string;at:number;game?:ArcadeGameId;seed?:number;rules?:string;league?:League};
const INTRO:readonly ArcadeGameId[]=['tap_duel','nest_defense','bubble_swarm'];
const WEIGHTS:readonly [ArcadeGameId,number][]=[['tap_duel',25],['nest_defense',25],['bug_glide',15],['bubble_swarm',15],['web_runner',10],['bug_tower',5],['butterfly_catch',5]];
const MEDALS=[3,10,30];
const utcDay=(now:number)=>new Date(now).toISOString().slice(0,10);
export function arcadeWeek(now:number){const date=new Date(now);date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);return date.toISOString().slice(0,10);}
export function arcadeChallengeFor(game:ArcadeGameId,league:League,now:number){return utcDay(now)+':'+league+':'+gameRules(game);}
function chooseNext(p:PlayerV2,a:ArcadeProgress):ArcadeGameId{
 const index=a.rotationIndex??0;if(index<INTRO.length)return INTRO[index];
 const recent=a.recentGames??[],available=WEIGHTS.filter(([id])=>!recent.includes(id));
 let choice=arcadeSeed(p.uid+':arcade:'+index+':'+recent.join(','))%available.reduce((sum,[,weight])=>sum+weight,0);
 for(const [id,weight] of available){if(choice<weight)return id;choice-=weight;}
 return available[0][0];
}
export function arcadeProgress(p:PlayerV2,now:number):ArcadeProgress{
 const day=utcDay(now);
 const a=p.arcade??={day,rewarded:0,dailyDust:0,dailyXP:0,first:false,best:{},completed:0};
 if(a.day!==day){a.day=day;a.rewarded=0;a.dailyDust=0;a.dailyXP=0;a.first=false;}
 // Old accounts only played Tikduel. Keep their totals and earned thresholds, then introduce the other two games.
 a.games??=a.completed?{tap_duel:{completed:a.completed,medals:MEDALS.filter(n=>a.completed>=n)}}:{};
 a.rotationIndex??=a.completed?1:0;a.recentGames??=a.completed?['tap_duel']:[];
 const week=arcadeWeek(now);if(a.week?.key!==week)a.week={key:week,days:[],claimed:false};
 a.nextGame??=chooseNext(p,a);
 return a;
}
export function nextArcadeGame(p:PlayerV2,now:number):ArcadeGameId{return arcadeProgress(p,now).nextGame!;}
export function arcadeNext(p:PlayerV2,now:number):ArcadeNext{const game=nextArcadeGame(p,now),info=ARCADE_GAMES.find(g=>g.id===game)!;return {game,name:info.name,durationSeconds:info.durationSeconds,gesture:info.gesture,help:info.help};}
export function arcadeProgressView(p:PlayerV2,now:number):ArcadeProgressView{const a=arcadeProgress(p,now);return {completed:a.completed,games:structuredClone(a.games!),week:{key:a.week!.key,days:a.week!.days.length,required:5,claimed:a.week!.claimed},rewarded:a.rewarded,dailyDust:a.dailyDust,dailyXP:a.dailyXP};}
export function issueArcade(p:PlayerV2,ids:unknown,league:unknown,id:string,now:number,target:ArcadeTicket['target'],game=nextArcadeGame(p,now),mode:'rotation'|'practice'='rotation',chosen=false):ArcadeTicket{
 const squad=arcadeSquad(p,ids,league),challenge=arcadeChallengeFor(game,league as League,now);
 check(ARCADE_GAMES.some(g=>g.id===game),'Kies een bekend spel.');
 check(mode==='practice'||chosen||game===nextArcadeGame(p,now),'Je volgende ronde is veranderd. Probeer opnieuw.',409);
 const ticket:ArcadeTicket={id,owner:p.uid,mode,game,challenge,rules:gameRules(game),league:league as League,seed:arcadeSeed(challenge),squad,issuedAt:now,expiresAt:now+86400000,target,status:'started'};
 arcadeProgress(p,now).active=id;return ticket;
}
export function issueCrewArcade(p:PlayerV2,ids:unknown,league:unknown,id:string,now:number,encounter:CrewEncounter):ArcadeTicket{
 check(encounter.version==='crew-1'&&encounter.game!=='combat','Deze leider gebruikt een squadgevecht.');check(encounter.expiresAt>now,'Deze bende is vertrokken.');
 const squad=arcadeSquad(p,ids,league),crew={...encounter,practice:crewBudget(p,now).wins>=3},game=crew.game as ArcadeGameId,challenge='crew-1:'+crew.id+':'+gameRules(game),ticket:ArcadeTicket={id,owner:p.uid,game,crew,challenge,rules:gameRules(game),league:league as League,seed:arcadeSeed(challenge),squad,issuedAt:now,expiresAt:crew.expiresAt,target:{name:crewName(crew.faction),score:crew.targetScore,kind:'computer'},status:'started'};
 arcadeProgress(p,now).active=id;return ticket;
}
export function submitArcade(d:Documents,p:PlayerV2,ticket:ArcadeTicket|undefined,raw:unknown,now:number){
 check(ticket&&ticket.owner===p.uid,'Deze ronde is niet van jou.',403);
 if(ticket.status==='accepted'){check(ticket.receipt,'De bevestiging ontbreekt.',409);arcadeProgress(p,now).last=ticket.receipt;return ticket.receipt;}
 check(ticket.status==='started'&&p.arcade?.active===ticket.id,'Deze ronde is afgesloten.');
 const game=ticket.game??'tap_duel';
 check(supportsArcadeRules(ticket)&&now<=ticket.expiresAt,'Deze ronde is verlopen.');
 // The HTTP envelope has the same bound; direct/local calls must not bypass it either.
 check(Buffer.byteLength(JSON.stringify(raw)??'','utf8')<(isOriginalRules(ticket)?ORIGINAL_MAX_BYTES:65536),'Deze invoer is te groot.');
 const {state,qualified}=replayArcade(ticket,raw);
 check(now-ticket.issuedAt>=state.tick*TICK_MS,'De ronde is nog niet afgelopen.');
 if(ticket.crew){
  check(ticket.crew.version==='crew-1'&&ticket.crew.game===game&&ticket.target.score===ticket.crew.targetScore,'Deze bende-uitdaging klopt niet.');
  const won=state.endReason==='target_score'&&state.score>=ticket.crew.targetScore,result=settleCrew(p,ticket.crew,won,ticket.id,now),a=arcadeProgress(p,now);
  if(qualified&&!ticket.crew.practice)creditBuddyPlay(p,ticket.squad.map(b=>b.id),now);
  ticket.audit={inputDigest:createHash('sha256').update(JSON.stringify(raw)).digest('hex'),inputCount:Array.isArray(raw)?raw.length:0,endReason:state.endReason??'time',snapshotHash:createHash('sha256').update(JSON.stringify({game,rules:ticket.rules,seed:ticket.seed,league:ticket.league,squad:ticket.squad,crew:ticket.crew})).digest('hex')};
  ticket.status='accepted';ticket.receipt={acceptedAt:now,runId:ticket.id,score:state.score,dust:result.dust,xp:result.xp,qualified,won,personalBest:false,game,endReason:state.endReason??'time',crew:result.crew,feedback:won?result.crew.rewarded?'Bug gered!':'Doel gehaald · oefenen':'Probeer dezelfde bende opnieuw'};a.last=ticket.receipt;delete a.active;return ticket.receipt;
 }
 if(ticket.mode==='practice'){
  const a=arcadeProgress(p,now),best=a.practiceBest??={},personalBest=qualified&&state.score>(best[game]??0);if(personalBest)best[game]=state.score;
  ticket.audit={inputDigest:createHash('sha256').update(JSON.stringify(raw)).digest('hex'),inputCount:Array.isArray(raw)?raw.length:0,endReason:state.endReason??'time',snapshotHash:createHash('sha256').update(JSON.stringify({game,rules:ticket.rules,seed:ticket.seed,league:ticket.league,squad:ticket.squad})).digest('hex')};
  ticket.status='accepted';ticket.receipt={acceptedAt:now,runId:ticket.id,score:state.score,dust:0,xp:0,qualified,won:false,practice:true,personalBest,game,endReason:state.endReason??'time',feedback:personalBest?'Oefenrecord!':'Goed geoefend!'};a.last=ticket.receipt;delete a.active;return ticket.receipt;
 }
 const a=arcadeProgress(p,now),eligible=qualified&&a.rewarded<3,won=qualified&&state.score>ticket.target.score;
 const dust=eligible?Math.min(400-a.dailyDust,75+(!a.first?100:0)+(won&&ticket.mode!=='ranked'&&ticket.target.kind==='player'?25:0)):0,xp=eligible?Math.min(60-a.dailyXP,20):0;
 const oldBest=a.best[ticket.challenge]??0,personalBest=qualified&&ticket.mode!=='ranked'&&state.score>oldBest;
 if(eligible){p.go!.dust+=dust;grantXP(p,xp);a.rewarded++;a.dailyDust+=dust;a.dailyXP+=xp;a.first=true;}
 const medals:number[]=[];let weekly:ArcadeWeeklyReward|undefined;
 if(qualified){
  creditBuddyPlay(p,ticket.squad.map(b=>b.id),now);
  a.completed++;const progress=a.games![game]??={completed:0,medals:[]};progress.completed++;
  for(const threshold of MEDALS)if(progress.completed>=threshold&&!progress.medals.includes(threshold)){progress.medals.push(threshold);medals.push(threshold);}
  if(personalBest){a.best[ticket.challenge]=state.score;d.set(arcadeScoreKey(p.uid,ticket.challenge),{uid:p.uid,name:p.name,challenge:ticket.challenge,game,seed:ticket.seed,rules:ticket.rules,league:ticket.league,score:state.score,run:ticket.id,at:now} satisfies ArcadeScore);}
  const keep=Object.keys(a.best).sort().slice(-147);a.best=Object.fromEntries(keep.map(k=>[k,a.best[k]]));
  if(!a.week!.days.includes(a.day))a.week!.days.push(a.day);
  if(a.week!.days.length>=5&&!a.week!.claimed){
   const buddy=p.specimens.find(b=>b.id===p.buddy&&b.go),key=buddy?family(buddy.species):undefined;
   weekly={week:a.week!.key,dust:500,candy:key?5:0,...(key?{family:key}:{})};p.go!.dust+=weekly.dust;
   if(key)p.go!.candy[key]=(p.go!.candy[key]??0)+weekly.candy;
   a.week!.claimed=true;a.week!.receipt=weekly;
  }
  if(ticket.mode!=='ranked'){a.recentGames=[...(a.recentGames??[]),game].slice(-2);a.rotationIndex=(a.rotationIndex??0)+1;a.nextGame=chooseNext(p,a);}
 }
 const endReason=state.endReason??'time';
 ticket.audit={inputDigest:createHash('sha256').update(JSON.stringify(raw)).digest('hex'),inputCount:Array.isArray(raw)?raw.length:0,endReason,snapshotHash:createHash('sha256').update(JSON.stringify({game,rules:ticket.rules,seed:ticket.seed,league:ticket.league,squad:ticket.squad})).digest('hex')};
 ticket.status='accepted';ticket.receipt={acceptedAt:now,runId:ticket.id,score:state.score,dust,xp,qualified,won,personalBest,game,endReason,feedback:!qualified?'Goed geoefend!':personalBest?'Nieuw record!':won?'Doel gehaald!':'Mooi gespeeld!',medals,...(weekly?{weekly}:{})};a.last=ticket.receipt;delete a.active;return ticket.receipt;
}
async function scoreRows(store:Store,p:PlayerV2,league:League,now:number,game:ArcadeGameId,challenge=arcadeChallengeFor(game,league,now),seed=arcadeSeed(challenge)){
 const rows=store.query?await store.query<ArcadeScore>('v2ArcadeScores',[{field:'challenge',op:'==',value:challenge}],undefined,50):[];
 return rows.filter(r=>r.challenge===challenge&&(r.game??'tap_duel')===game&&(r.seed??arcadeSeed(r.challenge))===seed&&(r.rules??'tap-1')===gameRules(game)&&(r.league??league)===league&&Number.isSafeInteger(r.score)&&r.score>0&&typeof r.uid==='string'&&typeof r.name==='string'&&Number.isSafeInteger(r.at));
}
export async function arcadeTarget(store:Store,p:PlayerV2,league:League,now:number,game=nextArcadeGame(p,now)):Promise<ArcadeTicket['target']>{
 const challenge=arcadeChallengeFor(game,league,now),own=p.arcade?.best[challenge]??0,rows=await scoreRows(store,p,league,now,game);
 const other=rows.filter(r=>r.uid!==p.uid).sort((a,b)=>Math.abs(a.score-(own||80))-Math.abs(b.score-(own||80))||a.at-b.at)[0];
 return other?{name:other.name,score:other.score,kind:'player'}:own?{name:'Jouw record',score:own,kind:'personal'}:{name:'Veldwachter',score:80,kind:'computer'};
}
export async function arcadeScores(store:Store,p:PlayerV2,now:number,ticket?:ArcadeTicket,chosen?:ArcadeGameId):Promise<ArcadeScoreView[]>{
 const game=ticket?.game??(ticket?'tap_duel':chosen??nextArcadeGame(p,now)),league=ticket?.league??p.go!.league,challenge=ticket?.challenge??arcadeChallengeFor(game,league,now),rows=await scoreRows(store,p,league,now,game,challenge,ticket?.seed??arcadeSeed(challenge));
 const result:ArcadeScoreView[]=rows.sort((a,b)=>b.score-a.score||a.at-b.at).slice(0,10).map(r=>({name:r.uid===p.uid?'Jouw record':r.name,score:r.score,kind:r.uid===p.uid?'personal':'player',me:r.uid===p.uid,at:r.at}));
 const own=p.arcade?.best[challenge]??0;if(own&&!result.some(r=>r.me)){if(result.length>=10)result.pop();result.push({name:'Jouw record',score:own,kind:'personal',me:true});}
 if(!result.length)result.push({name:'Veldwachter',score:80,kind:'computer',me:false});return result;
}
export async function readArcadeTicket(store:Store,p:PlayerV2){
 if(!p.arcade?.active)return undefined;
 return store.run([arcadeRunKey(p.uid,p.arcade.active)],d=>document<ArcadeTicket>(d,arcadeRunKey(p.uid,p.arcade!.active!)));
}
