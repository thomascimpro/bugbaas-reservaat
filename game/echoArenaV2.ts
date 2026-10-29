import {fighterGo,makeGoBattle} from './goBattleV2';
import type {GoBattle,GoFighter} from './goBattleV2';
import {HELD,LEAGUES,knownMove,rollGoBug,stats,teamIssue} from './goV2';
import type {League} from './goV2';
import {dayV2} from './safariV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2,Specimen} from './typesV2';

export const ECHO_DAILY_LIMIT=5;
export type EchoDefenseSummary={league:League;savedAt:number;snapshotId:string};
export type EchoProgress={rating:number;wins:number;losses:number;day:string;rewarded:number;defeated:string[];snapshots:string[];defense?:EchoDefenseSummary};
export type EchoDefense=EchoDefenseSummary&{uid:string;name:string;rating:number;team:GoFighter[];npc?:boolean};
export type EchoBattleMeta={defenderUid:string;snapshotId:string;savedAt:number;rating:number;delta?:number;rewarded?:boolean;npc?:boolean;normalized?:boolean};
export type EchoReward={dust:number;xp:number;delta:number;rewarded:boolean};

export const COMPETITION_LEVELS={great:20,ultra:30,master:40} as const;
// Only battle copies change. Species, moves, item and appearance remain the trainer's choices.
export function normalizeCompetitionFighter(f:GoFighter,league:League):GoFighter{
 const go={...structuredClone(f.go),level:COMPETITION_LEVELS[league],iv:[10,10,10] as [number,number,number]},specimen={id:f.id,species:f.species,shiny:f.shiny,go} as Specimen;
 while(go.level>1&&stats(specimen).cp>LEAGUES[league].cap)go.level-=.5;
 return fighterGo(specimen);
}
export function competitionPlayer(p:PlayerV2):PlayerV2{
 const copy=structuredClone(p);if(!copy.go)return copy;
 copy.specimens=copy.specimens.map(s=>s.go&&copy.go!.team.includes(s.id)?{...s,go:normalizeCompetitionFighter(fighterGo(s),copy.go!.league).go}:s);return copy;
}
export function competitionTeamIssue(p:PlayerV2):string|null{
 if(!p.go||!Object.hasOwn(LEAGUES,p.go.league))return 'Kies eerst je strijdteam.';
 const copy=competitionPlayer(p);return teamIssue(copy,copy.go!.team,copy.go!.league,true);
}

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
 check(p.go,'Je strijdprofiel ontbreekt.');const g=p.go,issue=competitionTeamIssue(p);check(!issue,issue??'Kies een geldig team.');
 const e=ensureEcho(p,now),team=g.team.map(id=>normalizeCompetitionFighter(fighterGo(p.specimens.find(s=>s.id===id)!),g.league));
 const defense={uid:p.uid,name:p.name,league:g.league,rating:e.rating,savedAt:now,snapshotId:snapshotKey(p.uid,g.league,team),team};
 e.defense={league:defense.league,savedAt:defense.savedAt,snapshotId:defense.snapshotId};return defense;
}

function eligible(e:EchoProgress,defense:Pick<EchoDefense,'uid'|'snapshotId'>){return e.rewarded<ECHO_DAILY_LIMIT&&!e.defeated.includes(defense.uid)&&!e.snapshots.includes(defense.snapshotId);}
function validDefense(d:EchoDefense){try{return !!d.uid&&!!d.snapshotId&&Object.hasOwn(LEAGUES,d.league)&&Number.isFinite(d.rating)&&d.team.length===3&&new Set(d.team.map(f=>f.species)).size===3&&d.team.every(f=>{return !!f.go&&knownMove(f.species,'fast',f.go.fast)&&Array.isArray(f.go.charged)&&f.go.charged.length>=1&&f.go.charged.length<=2&&f.go.charged.every(m=>knownMove(f.species,'charged',m))&&(f.go.item===null||Object.hasOwn(HELD,f.go.item))&&Number.isFinite(f.cp)&&f.cp>0&&f.cp<=LEAGUES[d.league].cap&&Number.isFinite(f.attack)&&f.attack>0&&Number.isFinite(f.defense)&&f.defense>0&&Number.isFinite(f.maxHP)&&f.maxHP>0;});}catch{return false;}}

export function echoNPCDefenses(league:League,now:number):EchoDefense[]{
 const day=dayV2(now),teams=[['ant','beetle','moth'],['bee','mantis','hoverfly'],['moth','antlion','tortoisebeetle'],['beetle','bee','mantis'],['ant','hoverfly','hercules']],names=['Linde','Bram','Noor','Sem','Roos'];
 return teams.map((kinds,index)=>{const uid='echo-npc:'+league+':'+day+':'+index,team=kinds.map((kind,i)=>normalizeCompetitionFighter(fighterGo({id:uid+':'+i,species:kind,shiny:false,go:rollGoBug(kind,uid+':'+i)} as Specimen),league));return {uid,name:'Veldwachter '+names[index]+' · NPC',league,rating:1000,savedAt:Date.parse(day+'T00:00:00Z'),snapshotId:snapshotKey(uid,league,team),team,npc:true};});
}
export function chooseEchoMatch(p:PlayerV2,defenses:EchoDefense[],now:number):EchoDefense{
 const e=ensureEcho(p,now),human=defenses.filter(d=>!d.npc&&d.uid!==p.uid&&d.league===p.go!.league&&validDefense(d)),candidates=[...human,...echoNPCDefenses(p.go!.league,now)];
 // Prefer a fresh reward opportunity; when exhausted the same opponents remain playable for practice.
 candidates.sort((a,b)=>Number(eligible(e,b))-Number(eligible(e,a))||Number(!!a.npc)-Number(!!b.npc)||Math.abs(a.rating-e.rating)-Math.abs(b.rating-e.rating)||a.uid.localeCompare(b.uid));
 return candidates[0];
}

export function makeEchoBattle(p:PlayerV2,defense:EchoDefense,id:string,now:number):GoBattle{
 check(defense.uid!==p.uid,'Je kunt niet tegen je eigen verdediging spelen.');
 check(defense.league===p.go?.league&&validDefense(defense),'Kies een opgeslagen team in dezelfde league.');
 const e=ensureEcho(p,now),opponent=structuredClone(p);opponent.uid=defense.uid;opponent.name=defense.name;
 opponent.specimens=defense.team.map(f=>({id:f.id,species:f.species,shiny:f.shiny,go:structuredClone(f.go),level:1,favorite:false,obtainedAt:defense.savedAt,source:'echo',hearts:0,item:null} satisfies Specimen));
 opponent.go!.team=opponent.specimens.map(s=>s.id);opponent.go!.league=defense.league;
 const issue=competitionTeamIssue(p);check(!issue,issue??'Kies een geldig team.');
 const b=makeGoBattle(competitionPlayer(p),competitionPlayer(opponent),id,now,false,true,true);
 b.teams[1]=defense.team.map(f=>normalizeCompetitionFighter(f,defense.league));
 b.ratings=[e.rating,defense.rating];b.echo={defenderUid:defense.uid,snapshotId:defense.snapshotId,savedAt:defense.savedAt,rating:defense.rating,npc:!!defense.npc,normalized:true};
 return b;
}

// The caller applies dust/XP in the same storage transaction and records actual capped rewards.
// This never reads or writes the absent owner, live Elo, or the Ranked leaderboard.
export function settleEcho(p:PlayerV2,b:GoBattle,now:number):EchoReward|null{
 if(!b.echo||b.phase!=='finished'||b.settled)return null;
 check(b.training&&!b.ranked&&b.players[0]===p.uid&&b.echo.defenderUid!==p.uid,'Dit offline duel is niet van jou.',403);
 const e=ensureEcho(p,now),rewarded=eligible(e,{uid:b.echo.defenderUid,snapshotId:b.echo.snapshotId}),won=b.winner===0;
 let delta=0;
 if(rewarded){
  if(!b.echo.npc){const expected=1/(1+10**((b.ratings[1]-b.ratings[0])/400)),score=b.winner===null?.5:won?1:0;delta=Math.max(-e.rating,Math.round(20*(score-expected)));e.rating+=delta;if(b.winner!==null)won?e.wins++:e.losses++;}
  e.rewarded++;e.defeated.push(b.echo.defenderUid);e.snapshots.push(b.echo.snapshotId);
 }
 b.echo.delta=delta;b.echo.rewarded=rewarded;b.settled=true;
 return {dust:rewarded?(won?150:50):0,xp:rewarded&&won?100:0,delta,rewarded};
}
