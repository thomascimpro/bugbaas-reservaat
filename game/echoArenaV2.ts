import {fighterGo,makeGoBattle} from './goBattleV2';
import type {GoBattle,GoFighter} from './goBattleV2';
import {LEAGUES,teamIssue} from './goV2';
import type {League} from './goV2';
import {dayV2} from './safariV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2,Specimen} from './typesV2';

export const ECHO_DAILY_LIMIT=5;
export type EchoDefenseSummary={league:League;savedAt:number;snapshotId:string};
export type EchoProgress={rating:number;wins:number;losses:number;day:string;rewarded:number;defeated:string[];snapshots:string[];defense?:EchoDefenseSummary};
export type EchoDefense=EchoDefenseSummary&{uid:string;name:string;rating:number;team:GoFighter[]};
export type EchoBattleMeta={defenderUid:string;snapshotId:string;savedAt:number;rating:number;delta?:number;rewarded?:boolean};
export type EchoReward={dust:number;xp:number;delta:number;rewarded:boolean};

export function ensureEcho(p:PlayerV2,now:number):EchoProgress{
 check(p.go,'Je strijdprofiel ontbreekt.');
 const e=p.go.echo??={rating:1000,wins:0,losses:0,day:dayV2(now),rewarded:0,defeated:[],snapshots:[]};
 if(e.day!==dayV2(now)){e.day=dayV2(now);e.rewarded=0;e.defeated=[];e.snapshots=[];}
 return e;
}

// Stable across saving again. Re-saving is no new reward opportunity within the same day.
function snapshotKey(uid:string,league:League,team:GoFighter[]){
 const value=JSON.stringify([uid,league,team]);let a=2166136261,b=5381;
 for(let i=0;i<value.length;i++){a=Math.imul(a^value.charCodeAt(i),16777619);b=Math.imul(b,33)^value.charCodeAt(i);}
 return 'echo-'+(a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
}

export function saveEchoDefense(p:PlayerV2,now:number):EchoDefense{
 check(p.go,'Je strijdprofiel ontbreekt.');const g=p.go,issue=teamIssue(p,g.team,g.league);check(!issue,issue??'Kies een geldig team.');
 const e=ensureEcho(p,now),team=g.team.map(id=>fighterGo(p.specimens.find(s=>s.id===id)!));
 const defense={uid:p.uid,name:p.name,league:g.league,rating:e.rating,savedAt:now,snapshotId:snapshotKey(p.uid,g.league,team),team};
 e.defense={league:defense.league,savedAt:defense.savedAt,snapshotId:defense.snapshotId};return defense;
}

function eligible(e:EchoProgress,defense:Pick<EchoDefense,'uid'|'snapshotId'>){return e.rewarded<ECHO_DAILY_LIMIT&&!e.defeated.includes(defense.uid)&&!e.snapshots.includes(defense.snapshotId);}
function validDefense(d:EchoDefense){return !!d.uid&&!!d.snapshotId&&Object.hasOwn(LEAGUES,d.league)&&Number.isFinite(d.rating)&&d.team.length===3&&new Set(d.team.map(f=>f.species)).size===3&&d.team.every(f=>Number.isFinite(f.cp)&&f.cp>0&&f.cp<=LEAGUES[d.league].cap&&Number.isFinite(f.attack)&&f.attack>0&&Number.isFinite(f.defense)&&f.defense>0&&Number.isFinite(f.maxHP)&&f.maxHP>0);}

export function chooseEchoMatch(p:PlayerV2,defenses:EchoDefense[],now:number):EchoDefense|null{
 const e=ensureEcho(p,now),candidates=defenses.filter(d=>d.uid!==p.uid&&d.league===p.go!.league&&validDefense(d));
 // Prefer a fresh reward opportunity; when exhausted the same opponents remain playable for practice.
 candidates.sort((a,b)=>Number(eligible(e,b))-Number(eligible(e,a))||Math.abs(a.rating-e.rating)-Math.abs(b.rating-e.rating)||a.uid.localeCompare(b.uid));
 return candidates[0]??null;
}

export function makeEchoBattle(p:PlayerV2,defense:EchoDefense,id:string,now:number):GoBattle{
 check(defense.uid!==p.uid,'Je kunt niet tegen je eigen verdediging spelen.');
 check(defense.league===p.go?.league&&validDefense(defense),'Kies een opgeslagen team in dezelfde league.');
 const e=ensureEcho(p,now),opponent=structuredClone(p);opponent.uid=defense.uid;opponent.name=defense.name;
 opponent.specimens=defense.team.map(f=>({id:f.id,species:f.species,shiny:f.shiny,go:structuredClone(f.go),level:1,favorite:false,obtainedAt:defense.savedAt,source:'echo',hearts:0,item:null} satisfies Specimen));
 opponent.go!.team=opponent.specimens.map(s=>s.id);opponent.go!.league=defense.league;
 const b=makeGoBattle(p,opponent,id,now,false,true);
 b.teams[1]=structuredClone(defense.team).map(f=>({...f,hp:f.maxHP,energy:0,readyAt:0}));
 b.ratings=[e.rating,defense.rating];b.echo={defenderUid:defense.uid,snapshotId:defense.snapshotId,savedAt:defense.savedAt,rating:defense.rating};
 return b;
}

// The caller applies dust/XP in the same storage transaction and records actual capped rewards.
// This never reads or writes the absent owner, live Elo, or the Ranked leaderboard.
export function settleEcho(p:PlayerV2,b:GoBattle,now:number):EchoReward|null{
 if(!b.echo||b.phase!=='finished'||b.settled)return null;
 check(b.training&&!b.ranked&&b.players[0]===p.uid&&b.echo.defenderUid!==p.uid,'Dit offline duel is niet van jou.',403);
 const e=ensureEcho(p,now),rewarded=eligible(e,{uid:b.echo.defenderUid,snapshotId:b.echo.snapshotId}),won=b.winner===0;
 let delta=0;
 if(rewarded){const expected=1/(1+10**((b.ratings[1]-b.ratings[0])/400)),score=b.winner===null?.5:won?1:0;
  delta=Math.max(-e.rating,Math.round(20*(score-expected)));e.rating+=delta;e.rewarded++;e.defeated.push(b.echo.defenderUid);e.snapshots.push(b.echo.snapshotId);
  if(b.winner!==null)won?e.wins++:e.losses++;
 }
 b.echo.delta=delta;b.echo.rewarded=rewarded;b.settled=true;
 return {dust:rewarded?(won?150:50):0,xp:rewarded&&won?100:0,delta,rewarded};
}
