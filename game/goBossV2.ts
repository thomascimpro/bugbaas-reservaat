import {rng,species} from './catalogV2';
import {makeGoBattle,fighterGo} from './goBattleV2';
import type {GoBattle} from './goBattleV2';
import {HELD,rollGoBug,teamIssue} from './goV2';
import type {Held} from './goV2';
import {dayV2} from './safariV2';
import {trainerLevel} from './trainerV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2,Specimen} from './typesV2';
import type {FieldPost} from './worldSitesV2';
import {distance,requireFieldLocation} from './walkingV2';

export type BossDifficulty='early'|'mid'|'end';
export type BossProgress={day:string;claimed:string[];wins:number};
export type BossBattleMeta={challengeId:string;day:string;difficulty:BossDifficulty;species:string;level:number;hpMultiplier:number;rewarded?:boolean;post?:FieldPost;catchSeed?:string};
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
export function postBossChallenge(post:string,now:number){const random=rng('post-boss:'+dayV2(now)+':'+post),roll=random(),difficulty:BossDifficulty=roll<.6?'early':roll<.9?'mid':'end';return {...bossChallenge(difficulty,now),id:dayV2(now)+':post:'+post,species:BOSSES[Math.floor(random()*BOSSES.length)],difficulty};}
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
export function makeBossBattle(p:PlayerV2,difficulty:BossDifficulty,id:string,now:number,post?:FieldPost,catchSeed?:string,ids?:unknown):GoBattle{
 const issue=post?teamIssue(p,ids??p.go!.team,'master',true):bossIssue(p,difficulty);check(!issue,issue??'Kies een geldig team.');
 const challenge=post?postBossChallenge(post.id,now):bossChallenge(difficulty,now);
 if(post){const w=requireFieldLocation(p.walking,now);check(w.posts?.some(s=>s.id===post.id)&&distance(w.fix,post)<=65,'Loop binnen 65 meter van de gympost.');check(postBossChallenge(post.id,now).difficulty===difficulty,'Deze kaartbaas is veranderd.');check(trainerLevel(p.go!.trainer!.xp)>=challenge.trainer,'Je trainerlevel is nog te laag.');check(!p.go!.bosses?.claimed.includes(challenge.id),'Deze kaartbaas is vandaag al verslagen.');check((p.go!.bosses?.claimed.filter(s=>s.startsWith(dayV2(now)+':post:')).length??0)<3,'Vandaag zijn je drie kaartbazen verslagen.');check(!w.spawns.some(s=>s.source==='boss'&&s.expiresAt>now&&!w.caught.includes(s.id)),'Vang eerst je vorige kaartbaas.');check(catchSeed,'De vangbeloning is niet beschikbaar.');}
 const attacker=post?structuredClone(p):p,opponent=structuredClone(p);if(post){attacker.go!.league='master';attacker.go!.team=[...(ids as string[]??p.go!.team)];opponent.go!.league='master';}
 opponent.uid='dagbaas-'+challenge.id;opponent.name='Dagbaas · '+species(challenge.species).name;
 const kinds=[challenge.species,...BOSSES.filter(kind=>kind!==challenge.species).slice(0,2)];
 opponent.specimens=kinds.map((kind,i)=>({id:'boss-'+i,species:kind,shiny:false,favorite:false,level:1,obtainedAt:now,source:'boss',hearts:0,item:null,go:{...rollGoBug(kind,challenge.id+':'+i),level:1,iv:[10,10,10]}} satisfies Specimen));
 opponent.go!.team=opponent.specimens.map(s=>s.id);
 const b=makeGoBattle(attacker,opponent,id,now,false,true,!!post),bossSpecimen=opponent.specimens[0];
 bossSpecimen.go!.level=challenge.level;const boss=fighterGo(bossSpecimen);
 boss.maxHP=Math.floor(boss.maxHP*challenge.hp);boss.hp=boss.maxHP;boss.cp=Math.floor(boss.cp*Math.sqrt(challenge.hp));
 b.teams[1]=[boss,...b.teams[1].slice(1).map(f=>({...f,hp:0}))] as typeof b.teams[1];b.shields[1]=0;
 b.boss={challengeId:challenge.id,day:challenge.day,difficulty,species:challenge.species,level:challenge.level,hpMultiplier:challenge.hp,...(post?{post:{...post},catchSeed}:{})};return b;
}
export function settleBoss(p:PlayerV2,b:GoBattle,now:number):BossReward|null{
 if(!b.boss||b.phase!=='finished'||b.settled)return null;
 check(b.training&&!b.ranked&&b.players[0]===p.uid,'Deze uitdaging is niet van jou.',403);
 const g=ensureBosses(p,now),won=b.winner===0,rewarded=won&&!g.claimed.includes(b.boss.challengeId),reward:BossReward={dust:0,xp:0,fastTMs:0,chargedTMs:0,item:null,rewarded};
 if(rewarded){const config=BOSS_LEVELS[b.boss.difficulty];reward.dust=config.dust;reward.xp=config.xp;g.claimed.push(b.boss.challengeId);g.wins++;
  if(b.boss.post&&b.boss.catchSeed&&p.walking){const post=b.boss.post;p.walking.spawns.push({id:'boss-'+b.id,species:b.boss.species,lat:post.lat,lng:post.lng,expiresAt:now+30*60000,source:'boss',boss:{seed:b.boss.catchSeed,level:b.boss.difficulty==='early'?10:b.boss.difficulty==='mid'?15:20}});}
  if(b.boss.difficulty==='end'){const n=rng(p.uid+':boss-loot:'+b.boss.challengeId)();if(n<.5)reward.item=(Object.keys(HELD) as Held[])[Math.floor(n*2*Object.keys(HELD).length)];else if(n<.75)reward.fastTMs=1;else reward.chargedTMs=1;}
 }
 b.boss.rewarded=rewarded;b.settled=true;return reward;
}
