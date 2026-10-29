import {rng} from './catalogV2';
import {DEX_SPECIES,evolutionStage} from './dexV2';
import {dailyWeekKey} from './dailyChallengeV2';
import {grantField} from './fieldV2';
import {COCOON_CAP} from './goCocoonsV2';
import {makeGoBattle} from './goBattleV2';
import type {GoBattle} from './goBattleV2';
import {awardGoCatch,ensureGo,LEAGUES,rollGoBug,speciesTypes,stats} from './goV2';
import type {Element} from './goV2';
import {bugRarity} from './rarityDisplayV2';
import {dayV2,freshV2} from './safariV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2,Specimen} from './typesV2';
import {WALK_WEIGHTS} from './walkingV2';

/** PvP goals: season rank (Brons–Kampioen), a daily 5-win reward track and a weekly themed cup. All server-side. */
export const RANKS=[
 {id:'bronze',name:'Brons',emoji:'🥉',color:'#C98A4B',min:0},
 {id:'silver',name:'Zilver',emoji:'🥈',color:'#C9D3DA',min:1100},
 {id:'gold',name:'Goud',emoji:'🥇',color:'#F2C94C',min:1250},
 {id:'platinum',name:'Platina',emoji:'💎',color:'#7FE0E6',min:1400},
 {id:'champion',name:'Kampioen',emoji:'👑',color:'#F2A33A',min:1600},
] as const;
export type RankIndex=0|1|2|3|4;
export const rankOf=(points:number):RankIndex=>{let i=0;for(let r=0;r<RANKS.length;r++)if(points>=RANKS[r].min)i=r;return i as RankIndex;};
export const seasonKey=(now:number)=>new Date(now).toISOString().slice(0,7);
export function seasonDaysLeft(now:number){const d=new Date(now),end=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1);return Math.max(1,Math.ceil((end-now)/86400000));}
/** Soft reset at a new month: halfway back to 1000. */
export const softReset=(points:number)=>Math.round(1000+(points-1000)/2);
/** Points for a win against the computer (also the cup): big steps at the start, smaller near the top. Losses against the computer cost nothing. */
export const npcWinPoints=(points:number,cup=false)=>Math.round(Math.max(3,16-(points-1000)/40)*(cup?1.25:1));
export const SEASON_REWARDS=[
 {dust:500,nets:5,cocoon:false,bug:false},
 {dust:1000,nets:10,cocoon:false,bug:false},
 {dust:2000,nets:15,cocoon:true,bug:false},
 {dust:3000,nets:20,cocoon:true,bug:true},
 {dust:5000,nets:30,cocoon:true,bug:true},
] as const;

export type TrackSlot='dust'|'nets'|'tm'|'cocoon'|'bug';
export const TRACK:readonly {kind:TrackSlot;emoji:string;name:string}[]=[
 {kind:'dust',emoji:'✨',name:'300 Stof'},{kind:'nets',emoji:'🥅',name:'5 Bosnetten'},{kind:'tm',emoji:'💿',name:'TM'},{kind:'cocoon',emoji:'🥚',name:'5 km-cocon'},{kind:'bug',emoji:'⭐',name:'Zeldzame bug ★★★'},
];
export type TrackReward={kind:TrackSlot;dust?:number;nets?:number;tm?:'fast'|'charged';cocoon?:boolean;species?:string;shiny?:boolean};

export const CUP_CAP=1500,CUP_WIN_GOAL=3;
export const CUP_THEMES:readonly {id:string;name:string;emoji:string;types:Element[]}[]=[
 {id:'water',name:'Waterweek',emoji:'💧',types:['water','grass']},
 {id:'fire',name:'Vuurweek',emoji:'🔥',types:['fire','rock']},
 {id:'sky',name:'Luchtweek',emoji:'🪽',types:['flying','bug']},
 {id:'shadow',name:'Schaduwweek',emoji:'🌙',types:['dark','poison']},
 {id:'metal',name:'Staalweek',emoji:'🛡️',types:['steel','ground']},
 {id:'meadow',name:'Weideweek',emoji:'🌾',types:['normal','grass','bug']},
];
export const cupWeek=(now:number)=>dailyWeekKey(now);
/** Same theme for everyone in an ISO week (Monday 00:00 UTC), rotating through all themes. */
export function cupTheme(now:number){const monday=Date.parse(cupWeek(now)+'T00:00:00Z'),weeks=Math.round((monday-Date.UTC(1970,0,5))/604800000);return CUP_THEMES[((weeks%CUP_THEMES.length)+CUP_THEMES.length)%CUP_THEMES.length];}
export const CUP_REWARD={dust:1500,chargedTMs:1,bug:true} as const;

export type SeasonResult={season:string;rank:RankIndex;dust:number;nets:number;cocoon:boolean;species?:string;at:number};
export type PvpGain={battle:string;points:number;rank:RankIndex;rankUp:boolean;slot:number|null;reward?:TrackReward;cup:boolean;cupStar:boolean;cupReward?:{dust:number;chargedTMs:number;species?:string}};
export type PvpProgress={version:1;season:string;points:number;best:number;seasonWins:number;day:string;track:string[];rewards:TrackReward[];week:string;cupWins:string[];cupClaimed:boolean;cupBattle?:string|null;done:string[];last?:PvpGain;lastSeason?:SeasonResult};

let stageOne:string[]|undefined;
/** Catchable first stages: NPC cup teams come from here. */
export function stageOnePool(){return stageOne??=DEX_SPECIES.map(s=>s.id).filter(id=>{try{return evolutionStage(id)===1&&speciesTypes(id).length>0;}catch{return false;}});}
let rare:string[]|undefined;
/** Wild ★★★ species (no elite/ultimate forms): the reward bug pool. */
export function rewardBugPool(){return rare??=DEX_SPECIES.map(s=>s.id).filter(id=>WALK_WEIGHTS[id]!==undefined&&bugRarity(id)===3);}

export function ensurePvp(p:PlayerV2,now:number):PvpProgress{
 const g=p.go;check(g,'Je strijdprofiel ontbreekt.');
 const start=Math.max(0,Math.round(Number.isFinite(g.rating)?g.rating:1000));
 const v=g.pvp??={version:1,season:seasonKey(now),points:start,best:start,seasonWins:0,day:dayV2(now),track:[],rewards:[],week:cupWeek(now),cupWins:[],cupClaimed:false,done:[]};
 if(v.season!==seasonKey(now)){
  // Lazy season end: reward by highest rank of the old season (only if you won at least once), then a soft reset.
  if(v.seasonWins>0){const rank=rankOf(v.best),r=SEASON_REWARDS[rank],seed=p.uid+':season:'+v.season;g.dust+=r.dust;grantField(p,{blue:r.nets},now);const cocoon=r.cocoon?addRewardCocoon(p,seed,now):false;if(r.cocoon&&!cocoon)g.dust+=1000;const bug=r.bug?grantRewardBug(p,seed,now):null;v.lastSeason={season:v.season,rank,dust:r.dust+(r.cocoon&&!cocoon?1000:0),nets:r.nets,cocoon,...(bug?{species:bug.species}:{}),at:now};}
  v.season=seasonKey(now);v.points=softReset(v.points);v.best=v.points;v.seasonWins=0;p.revision++;
 }
 if(v.day!==dayV2(now)){v.day=dayV2(now);v.track=[];v.rewards=[];}
 if(v.week!==cupWeek(now)){v.week=cupWeek(now);v.cupWins=[];v.cupClaimed=false;}
 return v;
}

function addRewardCocoon(p:PlayerV2,seed:string,now:number){const c=p.go?.cocoons;if(!c||c.items.length>=COCOON_CAP)return false;c.items.push({id:'cocoon-'+c.nextId++,km:5,obtainedAt:now,hatchSeed:seed+':cocoon'});return true;}
/** A ★★★ bug straight into the collection (level 15, good IVs), counted like a hatched bug. */
export function grantRewardBug(p:PlayerV2,seed:string,now:number,types?:readonly Element[]):Specimen{
 const all=rewardBugPool(),themed=types?all.filter(id=>speciesTypes(id).some(t=>types.includes(t))):[],pool=themed.length?themed:all,random=rng(seed+':reward-bug'),kind=pool[Math.floor(random()*pool.length)];
 let id='pvp-'+(seed.replace(/[^\w-]/g,'-').slice(-40))+'-'+now.toString(36);while(p.specimens.some(s=>s.id===id))id+='x';
 const s:Specimen={id,species:kind,level:1,shiny:random()<1/64,favorite:false,obtainedAt:now,source:'cocoon',hearts:0,item:null};
 awardGoCatch(p,s,seed+':stats',null,undefined,false,{level:15});s.source='pvp';
 p.specimens.push(s);if(!p.discovered.includes(kind))p.discovered.push(kind);if(s.shiny&&!p.shinies.includes(kind))p.shinies.push(kind);return s;
}

function trackReward(p:PlayerV2,slot:number,seed:string,now:number):TrackReward{
 const g=p.go!,kind=TRACK[slot].kind;
 if(kind==='dust'){g.dust+=300;return {kind,dust:300};}
 if(kind==='nets'){grantField(p,{blue:5},now);return {kind,nets:5};}
 if(kind==='tm'){const fast=rng(seed+':tm')()<.5;fast?g.fastTMs++:g.chargedTMs++;return {kind,tm:fast?'fast':'charged'};}
 if(kind==='cocoon'){if(addRewardCocoon(p,seed,now))return {kind,cocoon:true};g.dust+=1000;return {kind,cocoon:false,dust:1000};}
 const bug=grantRewardBug(p,seed,now,cupTheme(now).types);return {kind,species:bug.species,shiny:bug.shiny};
}

export type PvpKind='ranked'|'player'|'npc'|'cup';
/** Which battles count: Arena (ranked), direct duels (player echo or computer), training and the cup. Not gyms, raids, bosses, daily challenge or friend duels. */
export function pvpKind(p:PlayerV2,b:GoBattle):PvpKind|null{
 if(b.raid||b.gym||b.boss||b.dailyChallenge||(b as {plaagbende?:unknown}).plaagbende)return null;
 if(p.go?.pvp?.cupBattle===b.id)return 'cup';
 if(b.echo)return b.echo.npc?'npc':'player';
 if(b.ranked)return 'ranked';
 return b.training?'npc':null;
}
/** Call once per finished battle and player, inside the same storage transaction as the battle. Idempotent per battle id. */
export function settlePvp(p:PlayerV2,b:GoBattle,now:number,side:0|1=0):PvpGain|null{
 if(b.phase!=='finished'||!p.go)return null;const kind=pvpKind(p,b);if(!kind)return null;
 const v=ensurePvp(p,now);if(v.done.includes(b.id))return null;v.done=[b.id,...v.done].slice(0,20);
 const g=p.go,won=b.winner===side,cup=kind==='cup',before=rankOf(v.points),full=v.track.length>=TRACK.length;
 let points=0;
 if(kind==='ranked')points=side===0?b.delta:-b.delta;
 else if(kind==='player')points=b.echo?.delta??0;
 else if(won&&!full)points=npcWinPoints(v.points,cup);
 v.points=Math.max(0,v.points+points);v.best=Math.max(v.best,v.points);if(won)v.seasonWins++;
 let slot:number|null=null,reward:TrackReward|undefined;
 if(won&&!full){slot=v.track.length;v.track.push(b.id);reward=trackReward(p,slot,p.uid+':track:'+b.id,now);v.rewards.push(reward);}
 let cupStar=false,cupReward:PvpGain['cupReward'];
 if(cup){v.cupBattle=null;if(won){cupStar=true;v.cupWins.push(b.id);if(v.cupWins.length>=CUP_WIN_GOAL&&!v.cupClaimed){v.cupClaimed=true;g.dust+=CUP_REWARD.dust;g.chargedTMs+=CUP_REWARD.chargedTMs;const bug=grantRewardBug(p,p.uid+':cup:'+v.week,now,cupTheme(now).types);cupReward={dust:CUP_REWARD.dust,chargedTMs:CUP_REWARD.chargedTMs,species:bug.species};}}}
 const rank=rankOf(v.points);
 v.last={battle:b.id,points,rank,rankUp:rank>before,slot,...(reward?{reward}:{}),cup,cupStar,...(cupReward?{cupReward}:{})};
 return v.last;
}

/** Why a bug cannot join this week's cup (null = 👍 allowed). */
export function cupBlock(p:PlayerV2,s:Specimen,now:number):'type'|'cp'|'gym'|null{
 if(!s.go)return 'type';if(!speciesTypes(s.species).some(t=>cupTheme(now).types.includes(t)))return 'type';
 if(stats(s).cp>CUP_CAP)return 'cp';if(p.go?.gyms?.deployed.some(d=>d.specimen===s.id))return 'gym';return null;
}
export function cupTeamIssue(p:PlayerV2,raw:unknown,now:number):string|null{
 if(!Array.isArray(raw)||raw.length!==3||new Set(raw).size!==3)return 'Kies drie verschillende bugs.';
 const team=raw.map(id=>p.specimens.find(s=>s.id===id&&s.go));if(team.some(s=>!s))return 'Kies een zelfgevangen bug.';
 if(new Set(team.map(s=>s!.species)).size!==3)return 'Kies drie verschillende soorten.';
 const theme=cupTheme(now);for(const s of team){const why=cupBlock(p,s!,now);if(why==='type')return theme.emoji+' Deze week mogen alleen '+theme.name.replace('week','')+'-bugs meedoen.';if(why==='cp')return 'Een bug zit boven '+CUP_CAP+' CP.';if(why==='gym')return 'Een bug verdedigt een gym.';}
 return null;
}
/** Best three different species: highest CP within the cap, preferring different main types. Optional filter (cup). */
export function suggestTeam(p:PlayerV2,cap:number,allowed:(s:Specimen)=>boolean=()=>true):string[]{
 const bugs=p.specimens.filter(s=>s.go&&stats(s).cp<=cap&&!p.go?.gyms?.deployed.some(d=>d.specimen===s.id)&&allowed(s)).sort((a,b)=>stats(b).cp-stats(a).cp),team:Specimen[]=[];
 for(const pass of [0,1])for(const s of bugs){if(team.length>=3)break;if(team.some(t=>t.id===s.id||t.species===s.species))continue;if(pass===0&&team.some(t=>speciesTypes(t.species)[0]===speciesTypes(s.species)[0]))continue;team.push(s);}
 return team.map(s=>s.id);
}
export function cupSuggestion(p:PlayerV2,now:number){return suggestTeam(p,CUP_CAP,s=>cupBlock(p,s,now)===null);}

/** Computer opponent with this week's types, about the level of your own team and within the cap. */
export function cupNpc(p:PlayerV2,team:string[],seed:string,now:number):PlayerV2{
 const theme=cupTheme(now),q=freshV2('cup-'+p.uid,'CUPNPC00',now);ensureGo(q,now);q.name=theme.emoji+' Bekerwachter';q.go!.league='great';
 const average=team.map(id=>p.specimens.find(s=>s.id===id)!.go!.level).reduce((a,b)=>a+b,0)/3,random=rng(seed+':cup-npc'),pool=stageOnePool().filter(id=>speciesTypes(id).some(t=>theme.types.includes(t))),kinds:string[]=[];
 while(kinds.length<3&&kinds.length<pool.length){const k=pool[Math.floor(random()*pool.length)];if(!kinds.includes(k))kinds.push(k);}
 q.specimens=kinds.map((species,i)=>{const s:Specimen={id:'cup-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:now,source:'training',hearts:0,item:null,go:rollGoBug(species,seed+':'+i)};s.go!.level=Math.min(50,Math.max(1,Math.round(average)));while(stats(s).cp>CUP_CAP&&s.go!.level>1)s.go!.level-=.5;return s;});
 q.go!.team=q.specimens.map(s=>s.id);return q;
}
/** Cup battle: your chosen cup team (your normal team and arena stay unchanged) against a themed computer team. */
export function makeCupBattle(p:PlayerV2,ids:unknown,id:string,now:number):GoBattle{
 const issue=cupTeamIssue(p,ids,now);check(!issue,issue??'Kies een geldig bekerteam.');
 const v=ensurePvp(p,now),copy=structuredClone(p);copy.go!.team=[...(ids as string[])];copy.go!.league='great';
 const b=makeGoBattle(copy,cupNpc(p,ids as string[],id,now),id,now,false,true);v.cupBattle=id;return b;
}
export const arenaName=(league:keyof typeof LEAGUES)=>LEAGUES[league].name;
/** Read-only summary for the screen (never mutates; also correct just after midnight before the server rolled over). */
export function pvpView(p:PlayerV2,now:number){
 const v=p.go?.pvp,points=v?.season===seasonKey(now)?v.points:v?softReset(v.points):Math.round(p.go?.rating??1000),rank=rankOf(points),next=rank<4?RANKS[rank+1]:null,from=RANKS[rank].min,today=v?.day===dayV2(now),week=v?.week===cupWeek(now);
 return {points,rank,next,progress:next?Math.max(0,Math.min(1,(points-from)/(next.min-from))):1,daysLeft:seasonDaysLeft(now),track:today?v!.track:[],rewards:today?v!.rewards:[],cupWins:week?v!.cupWins.length:0,cupClaimed:!!(week&&v!.cupClaimed),last:v?.last,lastSeason:v?.lastSeason&&now-v.lastSeason.at<3*86400000?v.lastSeason:undefined};
}
