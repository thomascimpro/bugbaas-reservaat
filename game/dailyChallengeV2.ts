import {rng} from './catalogV2';
import {fighterGo,makeGoBattle} from './goBattleV2';
import type {GoBattle,GoFighter} from './goBattleV2';
import {LEAGUES,rollGoBug} from './goV2';
import type {League} from './goV2';
import {competitionPlayer,competitionTeamIssue,normalizeCompetitionFighter} from './echoArenaV2';
import {dayV2} from './safariV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2,Specimen} from './typesV2';

export const DAILY_CHALLENGE_ATTEMPTS=3;
export type DailyChallengeProgress={day:string;attempts:number;best:number;claimed:string[];days:{day:string;league:League;score:number}[]};
export type DailyChallengeBattleMeta={challengeId:string;day:string;league:League;practice:boolean;attempt:number;turns:number;score?:number;rewarded?:boolean};
export type DailyChallengeReward={dust:number;xp:number;score:number;rewarded:boolean};
export type DailyChallengeView={id:string;day:string;league:League;attempts:number;best:number;rewarded:boolean};
export type DailyChallengeLeaderboardEntry={name:string;score:number;me:boolean};
export function dailyWeekKey(now:number){const date=new Date(dayV2(now)+'T00:00:00Z');date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);return dayV2(date.getTime());}
export function ensureDailyChallenge(p:PlayerV2,now:number):DailyChallengeProgress{
 check(p.go,'Kies eerst je strijdteam.');const day=dayV2(now),g=p.go.dailyChallenge??={day,attempts:0,best:0,claimed:[],days:[]};
 if(g.day!==day){g.day=day;g.attempts=0;g.best=0;}
 const cutoff=dayV2(now-14*86400000);g.days=g.days.filter(d=>d.day>=cutoff);g.claimed=g.claimed.filter(d=>d>=cutoff);return g;
}
export function dailyChallenge(league:League,now:number):{id:string;day:string;league:League;seed:string;team:GoFighter[]}{
 check(Object.hasOwn(LEAGUES,league),'Kies een league.');const day=dayV2(now),id=day+':'+league,seed='dagstrijd:'+id,random=rng(seed),pool=['ant','beetle','moth','bee','mantis','hoverfly','antlion','tortoisebeetle','hercules'],kinds:string[]=[];
 while(kinds.length<3){const at=Math.floor(random()*pool.length);kinds.push(pool.splice(at,1)[0]);}
 return {id,day,league,seed,team:kinds.map((kind,i)=>normalizeCompetitionFighter(fighterGo({id:'daily:'+id+':'+i,species:kind,shiny:false,go:rollGoBug(kind,seed+':'+i)} as Specimen),league))};
}
export function dailyChallengeView(p:PlayerV2,now:number):DailyChallengeView{
 const g=ensureDailyChallenge(p,now),day=dayV2(now),league=p.go!.league;return {id:day+':'+league,day,league,attempts:g.attempts,best:g.days.find(d=>d.day===day&&d.league===league)?.score??0,rewarded:g.claimed.includes(day)};
}
export function weeklyDailyScore(g:DailyChallengeProgress|undefined,league:League,now:number){
 const week=dailyWeekKey(now),today=dayV2(now);return (g?.days??[]).filter(d=>d.league===league&&d.day>=week&&d.day<=today).reduce((sum,d)=>sum+d.score,0);
}
export function makeDailyChallengeBattle(p:PlayerV2,id:string,now:number,practice=false):GoBattle{
 check(typeof practice==='boolean','Kies een geldige poging.');const issue=competitionTeamIssue(p);check(!issue,issue??'Kies drie bugs.');
 const g=ensureDailyChallenge(p,now);check(practice||g.attempts<DAILY_CHALLENGE_ATTEMPTS,'Je drie scorepogingen zijn op. Je kunt blijven oefenen.');
 const challenge=dailyChallenge(p.go!.league,now),opponent=competitionPlayer(p);opponent.uid='daily:'+challenge.id;opponent.name='Dagstrijd · '+challenge.day;
 opponent.specimens=challenge.team.map(f=>({id:f.id,species:f.species,shiny:f.shiny,go:structuredClone(f.go),level:1,favorite:false,obtainedAt:now,source:'daily',hearts:0,item:null} satisfies Specimen));opponent.go!.team=opponent.specimens.map(s=>s.id);
 const b=makeGoBattle(competitionPlayer(p),opponent,id,now,false,true,true);b.teams[1]=structuredClone(challenge.team);b.dailyChallenge={challengeId:challenge.id,day:challenge.day,league:challenge.league,practice,attempt:practice?0:g.attempts+1,turns:0};
 if(!practice)g.attempts++;return b;
}
export function dailyChallengeScore(b:GoBattle):number{
 if(!b.dailyChallenge||b.phase!=='finished'||b.events.some(e=>e.kind==='forfeit'))return 0;
 const own=b.teams[0],enemy=b.teams[1],survivors=own.filter(f=>f.hp>0).length,defeated=enemy.filter(f=>f.hp<=0).length,hp=Math.floor(own.reduce((sum,f)=>sum+Math.max(0,f.hp)/f.maxHP,0)/own.length*1000),turns=Math.max(0,Math.floor(b.dailyChallenge.turns));
 return Math.max(0,(b.winner===0?10000:0)+defeated*500+survivors*100+hp-Math.min(500,turns));
}
// Caller grants returned resources and writes the weekly friends score atomically with this battle.
export function settleDailyChallenge(p:PlayerV2,b:GoBattle,now:number):DailyChallengeReward|null{
 const c=b.dailyChallenge;if(!c||b.phase!=='finished'||b.settled)return null;
 check(b.training&&!b.ranked&&b.players[0]===p.uid,'Deze dagstrijd is niet van jou.',403);const score=dailyChallengeScore(b),g=ensureDailyChallenge(p,now),rewarded=!c.practice&&b.winner===0&&!g.claimed.includes(c.day);
 if(!c.practice){const prior=g.days.find(d=>d.day===c.day&&d.league===c.league);if(prior)prior.score=Math.max(prior.score,score);else g.days.push({day:c.day,league:c.league,score});if(c.day===g.day)g.best=Math.max(g.best,score);if(rewarded)g.claimed.push(c.day);}
 c.score=score;c.rewarded=rewarded;b.settled=true;return {dust:rewarded?200:0,xp:rewarded?100:0,score,rewarded};
}
