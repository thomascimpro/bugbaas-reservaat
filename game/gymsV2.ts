import type {PlayerV2,Specimen} from './typesV2';
import type {FieldPost} from './worldSitesV2';
import type {GoBattle} from './goBattleV2';
import {fighterGo,makeGoBattle} from './goBattleV2';
import {ownedGo,rollGoBug,stats,teamIssue} from './goV2';
import {distance,requireFieldLocation} from './walkingV2';
import {checkV2 as check} from './shopV2';

export const GYM_TEAMS={fern:{name:'Bos',color:'#72C68A'},amber:{name:'Zon',color:'#EDB65F'},tidal:{name:'Water',color:'#69BCE0'}} as const;
export type GymTeam=keyof typeof GYM_TEAMS;
export const GYM_RULES={slots:6,range:65,coinMinutes:10,dailyCoins:50,maxDeployed:20,decayMs:4*3600000,maxStayMs:12*3600000} as const;
export type GymSite={id:string;postId:string;name:string;lat:number;lng:number};
export type GymPlacement=GymSite&{specimen:string;deployment:string;at:number};
export type GymReturn={id:string;gym:string;name:string;species:string;shiny:boolean;coins:number;minutes:number;at:number};
export type GymProgress={team:GymTeam|null;coins:number;day:string;earned:number;deployed:GymPlacement[];returns:GymReturn[];lastPurchase?:{offer:string;at:number}};
export type GymDefender={npc?:true;uid:string;name:string;deployment:string;bug:Specimen;at:number;hearts:number;motivationAt:number};
export type Gym=GymSite&{npcSeeded?:true;team:GymTeam|null;revision:number;defenders:GymDefender[];battle?:{id:string;uid:string;until:number}};
export type GymView=GymSite&{team:GymTeam|null;revision:number;battling:boolean;defenders:{id:string;name:string;species:string;shiny:boolean;cp:number;hearts:number;at:number;me:boolean;npc?:boolean}[]};
export type GymBattleMeta={id:string;name:string;defenders:{uid:string;deployment:string;npc?:true}[]};
const day=(now:number)=>new Date(now).toISOString().slice(0,10);
const hash=(text:string)=>{let value=2166136261;for(const c of text)value=Math.imul(value^c.charCodeAt(0),16777619);return value>>>0;};

// Reuse only the server's validated public-path posts; never accept client coordinates.
export function gymSites(posts:FieldPost[]):GymSite[]{
 const sorted=[...posts].sort((a,b)=>hash(a.id)-hash(b.id)||a.id.localeCompare(b.id));
 const chosen=sorted.filter(p=>hash(p.id)%3===0);return (chosen.length?chosen:sorted.slice(0,1)).slice(0,6).map(p=>({id:'gym-'+p.id,postId:p.id,name:p.name==='Veldpost'?'Wachtershonk':p.name+' · Gym',lat:p.lat,lng:p.lng}));
}
export function ensureGyms(p:PlayerV2,now:number):GymProgress{
 const g=p.go!.gyms??={team:null,coins:0,day:day(now),earned:0,deployed:[],returns:[]};
 if(g.day!==day(now)){g.day=day(now);g.earned=0;}return g;
}
export function defendingGym(p:PlayerV2,id:unknown){return p.go?.gyms?.deployed.find(d=>d.specimen===id);}
export function gymHearts(d:GymDefender,now:number){return Math.max(1,d.hearts-Math.floor(Math.max(0,now-d.motivationAt)/GYM_RULES.decayMs));}
export function gymCoins(at:number,now:number){return Math.min(GYM_RULES.dailyCoins,Math.max(0,Math.floor((now-at)/(GYM_RULES.coinMinutes*60000))));}
export function publicGym(g:Gym,uid:string,now:number):GymView{return {...{id:g.id,postId:g.postId,name:g.name,lat:g.lat,lng:g.lng,team:g.team,revision:g.revision},battling:!!g.battle&&g.battle.until>now,defenders:g.defenders.map(d=>({id:d.deployment,name:d.name,species:d.bug.species,shiny:d.bug.shiny,cp:Math.floor(stats(d.bug).cp*(.4+.2*gymHearts(d,now))),hearts:gymHearts(d,now),at:d.at,me:!d.npc&&d.uid===uid,npc:!!d.npc}))};}
// Seed once per real site, never a fake player. Cleared and human-held gyms stay claimable.
export function ensureNpcGym(g:Gym,now:number){
 if(g.npcSeeded)return false;g.npcSeeded=true;
 if(!g.team&&!g.defenders.length&&(!g.battle||g.battle.until<=now)){
  g.defenders=['ant','beetle','moth'].map((kind,i)=>{const id='npc:'+g.id+':'+i;return {npc:true as const,uid:id,name:'Wilde wachter · NPC',deployment:id,at:now,hearts:1,motivationAt:now,bug:{id,species:kind,level:1,shiny:false,favorite:false,obtainedAt:now,source:'gym-npc',hearts:0,item:null,go:{...rollGoBug(kind,id),level:5}}};});
 }
 g.revision++;return true;
}
export function chooseGymTeam(p:PlayerV2,raw:unknown,now:number){const progress=ensureGyms(p,now);check(typeof raw==='string'&&Object.hasOwn(GYM_TEAMS,raw),'Kies Bos, Zon of Water.');check(!progress.team,'Je gymploeg is al gekozen.');progress.team=raw as GymTeam;}
export function requireGymNear(p:PlayerV2,g:GymSite,now:number){requireFieldLocation(p.walking,now);check(distance(p.walking!.fix,g)<=GYM_RULES.range,'Loop binnen 65 meter van de gym.');}
export function placeGymDefender(p:PlayerV2,g:Gym,id:unknown,deployment:string,now:number){
 requireGymNear(p,g,now);const progress=ensureGyms(p,now);check(progress.team,'Kies eerst je gymploeg.');check(!g.battle||g.battle.until<=now,'Er wordt gevochten. Wacht tot het gevecht klaar is.');
 check(!g.defenders.some(d=>d.npc),'Versla eerst de wilde wachters.');check(!g.team||g.team===progress.team,'Versla eerst de andere ploeg.');check(g.defenders.length<GYM_RULES.slots,'Deze gym heeft al zes verdedigers.');check(!g.defenders.some(d=>d.uid===p.uid),'Je verdedigt deze gym al.');check(progress.deployed.length<GYM_RULES.maxDeployed,'Je hebt al twintig bugs in gyms.');
 const bug=ownedGo(p,id);check(!defendingGym(p,bug.id),'Deze bug verdedigt al een gym.');check(p.buddy!==bug.id,'Kies een andere bug dan je buddy.');check(!g.defenders.some(d=>d.bug.species===bug.species),'Deze soort staat al in de gym.');
 g.npcSeeded=true;g.team=progress.team;g.defenders.push({uid:p.uid,name:p.name,deployment,bug:structuredClone(bug),at:now,hearts:3,motivationAt:now});g.revision++;delete g.battle;
 progress.deployed.push({id:g.id,postId:g.postId,name:g.name,lat:g.lat,lng:g.lng,specimen:bug.id,deployment,at:now});p.go!.team=p.go!.team.filter(s=>s!==bug.id);
}
export function gymAttackIssue(p:PlayerV2,ids:unknown){return teamIssue(p,ids,'master',true);}
export function recommendedGymTeam(p:PlayerV2){const seen=new Set<string>();return p.specimens.filter(s=>s.go&&!defendingGym(p,s.id)).sort((a,b)=>stats(b).cp-stats(a).cp).filter(s=>{if(seen.has(s.species))return false;seen.add(s.species);return true;}).slice(0,3).map(s=>s.id);}
export function makeGymBattle(p:PlayerV2,g:Gym,ids:unknown,id:string,now:number):GoBattle{
 requireGymNear(p,g,now);const progress=ensureGyms(p,now);check(progress.team,'Kies eerst je gymploeg.');check(g.defenders.length&&(g.defenders.every(d=>d.npc)||g.team&&g.team!==progress.team),'Deze gym wordt niet door een andere ploeg verdedigd.');check(!g.battle||g.battle.until<=now,'Er wordt al gevochten in deze gym.');
 const issue=gymAttackIssue(p,ids);check(!issue,issue??'Kies drie bugs.');const a=structuredClone(p),opponent=structuredClone(p);a.go!.league='master';a.go!.team=[...(ids as string[])];opponent.uid='gym-defense';opponent.name=g.name;opponent.go!.league='master';opponent.go!.team=[...a.go!.team];
 const b=makeGoBattle(a,opponent,id,now,false,true,true);b.teams[1]=g.defenders.map(d=>{const f=fighterGo(d.bug),scale=Math.sqrt(.4+.2*gymHearts(d,now));f.attack*=scale;f.defense*=scale;f.cp=Math.floor(f.cp*scale*scale);f.maxHP=Math.floor(f.maxHP*scale*2);f.hp=f.maxHP;return f;});
 b.shields=[0,0];b.gym={id:g.id,name:g.name,defenders:g.defenders.map(d=>({uid:d.uid,deployment:d.deployment,...(d.npc?{npc:true as const}:{})}))};g.battle={id,uid:p.uid,until:b.endsAt};g.revision++;return b;
}
function returnDefenders(g:Gym,defenders:GymDefender[],players:Map<string,PlayerV2>,now:number){
 // Validate all owner bindings before changing any balance, slot or return receipt.
 for(const d of defenders){if(d.npc)continue;const owner=players.get(d.uid),placement=owner?.go?.gyms?.deployed.find(x=>x.deployment===d.deployment);
  check(owner?.uid===d.uid&&owner.specimens.some(s=>s.id===d.bug.id)&&placement&&placement.id===g.id&&placement.postId===g.postId&&placement.specimen===d.bug.id&&placement.at===d.at,'De gymverdediging is veranderd.',409);
 }
 for(const d of defenders){if(!d.npc){const owner=players.get(d.uid)!,progress=ensureGyms(owner,now),coins=Math.min(Math.max(0,GYM_RULES.dailyCoins-progress.earned),gymCoins(d.at,now));progress.coins+=coins;progress.earned+=coins;progress.deployed=progress.deployed.filter(x=>x.deployment!==d.deployment);
   progress.returns.unshift({id:d.deployment,gym:g.id,name:g.name,species:d.bug.species,shiny:d.bug.shiny,coins,minutes:Math.max(0,Math.floor((now-d.at)/60000)),at:now});progress.returns=progress.returns.slice(0,20);owner.revision++;
  }g.defenders=g.defenders.filter(x=>x.deployment!==d.deployment);
 }
 if(!g.defenders.length)g.team=null;
 if(defenders.some(d=>!d.npc))g.npcSeeded=true;
}
export function settleExpiredGym(g:Gym,players:Map<string,PlayerV2>,now:number){
 // Keep the battle snapshot intact until its server deadline; stale attacks cannot touch replacements.
 if(g.battle&&g.battle.until>now)return false;
 const expired=g.defenders.filter(d=>!d.npc&&now-d.at>=GYM_RULES.maxStayMs);if(!expired.length)return false;
 returnDefenders(g,expired,players,now);delete g.battle;g.revision++;return true;
}
export function settleGymBattle(g:Gym,b:GoBattle,players:Map<string,PlayerV2>,now:number){
 if(!b.gym||b.phase!=='finished'||b.settled)return false;
 // An expired/replaced attack can never damage a newer defense or pay twice.
 if(g.battle?.id!==b.id){b.settled=true;return false;}
 const hit=b.gym.defenders.flatMap((ref,i)=>{if(b.teams[1][i].hp>0)return [];const d=g.defenders.find(d=>d.deployment===ref.deployment&&d.uid===ref.uid&&!!d.npc===!!ref.npc);return d?[d]:[];}),returned=hit.filter(d=>gymHearts(d,now)<=1);
 returnDefenders(g,returned,players,now);
 for(const d of hit)if(!returned.includes(d)){d.hearts=gymHearts(d,now)-1;d.motivationAt=now;}
 b.settled=true;delete g.battle;g.revision++;return true;
}
