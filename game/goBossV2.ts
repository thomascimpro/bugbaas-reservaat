import {rng,species} from './catalogV2';
import {makeGoBattle,fighterGo} from './goBattleV2';
import type {GoBattle} from './goBattleV2';
import {HELD,rollGoBug,teamIssue} from './goV2';
import type {Held} from './goV2';
import {dayV2} from './safariV2';
import {trainerLevel} from './trainerV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2,Specimen} from './typesV2';

export type BossDifficulty='early'|'mid'|'end';
export type BossProgress={day:string;claimed:string[];wins:number};
export type BossBattleMeta={challengeId:string;day:string;difficulty:BossDifficulty;species:string;level:number;hpMultiplier:number;rewarded?:boolean};
export type BossReward={dust:number;xp:number;fastTMs:number;chargedTMs:number;item:Held|null;rewarded:boolean};
export const BOSS_LEVELS={
 early:{name:'Verkenner',level:10,hp:2,trainer:1,dust:150,xp:100},
 mid:{name:'Jager',level:25,hp:2.8,trainer:8,dust:300,xp:200},
 end:{name:'Meester',level:45,hp:3.6,trainer:15,dust:500,xp:300},
} as const;
const BOSSES=['hercules','mantis','giantwaterbug','moth','antlion','tortoisebeetle'] as const;
export function bossChallenge(difficulty:BossDifficulty,now:number){
 check(Object.hasOwn(BOSS_LEVELS,difficulty),'Kies een uitdaging.');
 const day=dayV2(now),id=day+':'+difficulty,random=rng('dagbaas:'+id),kind=BOSSES[Math.floor(random()*BOSSES.length)];
 return {id,day,species:kind,...BOSS_LEVELS[difficulty]};
}
export function ensureBosses(p:PlayerV2,now:number):BossProgress{
 check(p.go,'Kies eerst je bugs.');const g=p.go.bosses??={day:dayV2(now),claimed:[],wins:0};
 if(g.day!==dayV2(now)){g.day=dayV2(now);g.claimed=g.claimed.slice(-12);}return g;
}
export function bossIssue(p:PlayerV2,difficulty:BossDifficulty){
 if(!Object.hasOwn(BOSS_LEVELS,difficulty))return 'Kies een uitdaging.';
 const required=BOSS_LEVELS[difficulty].trainer;
 if(trainerLevel(p.go?.trainer?.xp??0)<required)return 'Trainerlevel '+required+' nodig.';
 return p.go?teamIssue(p,p.go.team,p.go.league):'Kies eerst je bugs.';
}
export function makeBossBattle(p:PlayerV2,difficulty:BossDifficulty,id:string,now:number):GoBattle{
 const issue=bossIssue(p,difficulty);check(!issue,issue??'Kies een geldig team.');
 const challenge=bossChallenge(difficulty,now),opponent=structuredClone(p);
 opponent.uid='dagbaas-'+challenge.id;opponent.name='Dagbaas · '+species(challenge.species).name;
 const kinds=[challenge.species,...BOSSES.filter(kind=>kind!==challenge.species).slice(0,2)];
 opponent.specimens=kinds.map((kind,i)=>({id:'boss-'+i,species:kind,shiny:false,favorite:false,level:1,obtainedAt:now,source:'boss',hearts:0,item:null,go:{...rollGoBug(kind,challenge.id+':'+i),level:1,iv:[10,10,10]}} satisfies Specimen));
 opponent.go!.team=opponent.specimens.map(s=>s.id);
 const b=makeGoBattle(p,opponent,id,now,false,true),bossSpecimen=opponent.specimens[0];
 bossSpecimen.go!.level=challenge.level;const boss=fighterGo(bossSpecimen);
 boss.maxHP=Math.floor(boss.maxHP*challenge.hp);boss.hp=boss.maxHP;boss.cp=Math.floor(boss.cp*Math.sqrt(challenge.hp));
 b.teams[1]=[boss,...b.teams[1].slice(1).map(f=>({...f,hp:0}))] as typeof b.teams[1];b.shields[1]=0;
 b.boss={challengeId:challenge.id,day:challenge.day,difficulty,species:challenge.species,level:challenge.level,hpMultiplier:challenge.hp};return b;
}
export function settleBoss(p:PlayerV2,b:GoBattle,now:number):BossReward|null{
 if(!b.boss||b.phase!=='finished'||b.settled)return null;
 check(b.training&&!b.ranked&&b.players[0]===p.uid,'Deze uitdaging is niet van jou.',403);
 const g=ensureBosses(p,now),won=b.winner===0,rewarded=won&&!g.claimed.includes(b.boss.challengeId),reward:BossReward={dust:0,xp:0,fastTMs:0,chargedTMs:0,item:null,rewarded};
 if(rewarded){const config=BOSS_LEVELS[b.boss.difficulty];reward.dust=config.dust;reward.xp=config.xp;g.claimed.push(b.boss.challengeId);g.wins++;
  if(b.boss.difficulty==='end'){const n=rng(p.uid+':boss-loot:'+b.boss.challengeId)();if(n<.5)reward.item=(Object.keys(HELD) as Held[])[Math.floor(n*2*Object.keys(HELD).length)];else if(n<.75)reward.fastTMs=1;else reward.chargedTMs=1;}
 }
 b.boss.rewarded=rewarded;b.settled=true;return reward;
}
