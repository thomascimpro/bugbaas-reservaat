import {rng,species} from './catalogV2';
import {fighterGo,makeGoBattle} from './goBattleV2';
import type {GoBattle,GoFighter} from './goBattleV2';
import {movePool,rollGoBug,teamIssue} from './goV2';
import {DEX_SPECIES,evolutionStage} from './dexV2';
import {dayV2} from './safariV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2,Specimen} from './typesV2';

// Zwermraids: every gym post hatches a deterministic series of raids per UTC day (an egg every two to three hours), fought by up to six players in one lobby.
// Every player fights an own server-clocked boss battle; damage is pooled per player so no shared document is hot.
export type RaidTier=1|3|4|5;
export type RaidSite={id:string;name:string;lat:number;lng:number};
/** `slot` is the window number of this raid within the post's day. */
export type Raid={id:string;day:string;slot:number;site:RaidSite;tier:RaidTier;species:string;visibleAt:number;hatchAt:number;endsAt:number};
/** `free`: this remote place used the daily free ticket instead of a Zwermfluit. */
export type RaidMember={uid:string;name:string;remote:boolean;joinedAt:number;free?:boolean};
export type RaidLobby={id:string;raidId:string;n:number;tier:RaidTier;species:string;members:RaidMember[];lobbyUntil:number;status:'lobby'|'fighting'|'won'|'failed';fight:{startedAt:number;until:number;maxHP:number}|null;revision:number;createdAt:number};
/** `freeRemote`: UTC day on which the daily free remote raid was used (missing in older saves = still free). */
export type RaidProgress={day:string;claimed:string[];rewards:number;remote:number;passes:number;freeDay:string;invites:number;lobby:string|null;invitedAt?:number;freeRemote?:string};
export type RaidInvite={raidId:string;from:{uid:string;name:string};postName:string;tier:RaidTier;species:string;endsAt:number;at:number};
export type RaidReward={dust:number;xp:number;nets:number;catchLevel:number};

export const LOBBY_MS=90000,FIGHT_MS=180000,ACTIVE_MS=45*60000,EGG_MS=60*60000,DAY_MS=86400000;
/** A post hatches its next egg two to three hours after the previous one (minute steps). */
export const RAID_GAP_MS=120*60000,RAID_JITTER_MS=60*60000;
export const RAID_RULES={maxMembers:6,maxRemote:4,remotePerDay:3,maxPasses:3,rewardsPerDay:5,invitesPerRaid:5,invitesPerDay:20,inboxSize:10} as const;
export const RAID_TIERS={
 1:{name:'Zwerm',level:20,hp:5,trainer:5,dust:300,xp:300,nets:5,catchLevel:15},
 3:{name:'Grote zwerm',level:30,hp:10,trainer:10,dust:600,xp:800,nets:6,catchLevel:20},
 4:{name:'Reuzenzwerm',level:35,hp:15,trainer:15,dust:800,xp:1100,nets:6,catchLevel:20},
 5:{name:'Oerzwerm',level:40,hp:30,trainer:20,dust:1000,xp:1500,nets:7,catchLevel:20},
} as const satisfies Record<RaidTier,unknown>;
/** Oerbugs stay empty until their models are approved; five-star raids are not scheduled until then. */
export const LEGENDARY_RAID_SPECIES:readonly string[]=[];
/** Main type used to spread bosses: the first type that is not 'bug' (almost every bug also has 'bug'). Read at runtime, so retyped species follow. */
export const raidTypeKey=(kind:string)=>{const t=movePool(kind).types;return t.find(x=>x!=='bug')??t[0];};
type BossPools=Record<1|3|4,Record<string,string[]>>;
let bossPools:{pools:BossPools;keys:string[]}|undefined;
/** Boss candidates per tier, grouped by main type: ★1 first stages, ★3 second stages, ★4 final stages. Built once per process from the dex. */
export function raidPools(){
 if(bossPools)return bossPools;const pools:BossPools={1:{},3:{},4:{}};
 for(const {id} of DEX_SPECIES){const stage=evolutionStage(id);(pools[stage>=3?4:stage===2?3:1][raidTypeKey(id)]??=[]).push(id);}
 return bossPools={pools,keys:[...new Set(Object.values(pools).flatMap(p=>Object.keys(p)))].sort()};
}
export type RaidWindow={n:number;tier:Exclude<RaidTier,5>;species:string;visibleAt:number;hatchAt:number;endsAt:number};
/** Public part of a raid id. The server passes a keyed hash: post ids of virtual posts encode a 170 m grid cell, OSM ids a public node. */
export type RaidToken=(input:string)=>string;
/**
 * One post's raids for a UTC day, the same for everyone. Seeded through the keyed token, so clients cannot plan ahead.
 * A new egg every two to three hours (the first egg of the day can be shorter than an hour), 45 minutes to fight, all inside the day; one in five windows rests.
 * Each post walks through the main types in its own shuffled order, so a day brings many different bosses.
 */
export function raidSchedule(site:Pick<RaidSite,'id'>,day:string,token:RaidToken):RaidWindow[]{
 const seed=token('plan:'+day+':'+site.id),timing=rng(seed),start=Date.parse(day+'T00:00:00Z'),{pools,keys}=raidPools(),order=[...keys],shuffle=rng(seed+':types'),out:RaidWindow[]=[];
 for(let i=order.length-1;i>0;i--){const j=Math.floor(shuffle()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 for(let n=0,hatchAt=start+Math.floor(timing()*RAID_GAP_MS/60000)*60000;hatchAt+ACTIVE_MS<=start+DAY_MS;n++,hatchAt+=RAID_GAP_MS+Math.floor(timing()*RAID_JITTER_MS/60000)*60000){
  const random=rng(seed+':'+n),roll=random();if(roll<.2)continue;
  const tier=roll<.65?1:roll<.9?3:4,pool=pools[tier],key=order.map((_,k)=>order[(n+k)%order.length]).find(k=>pool[k]?.length);if(!key)continue;
  const list=pool[key];out.push({n,tier,species:list[Math.floor(random()*list.length)],visibleAt:Math.max(start,hatchAt-EGG_MS),hatchAt,endsAt:hatchAt+ACTIVE_MS});
 }
 return out;
}
/** The raid visible at this post right now (egg or active), or null when the post rests. Ids use another token input than the former six-hour slots. */
export function raidAt(site:RaidSite,now:number,token:RaidToken):Raid|null{
 const day=dayV2(now),w=raidSchedule(site,day,token).find(w=>now>=w.visibleAt&&now<w.endsAt);if(!w)return null;
 return {id:day+':'+w.n+':'+token(day+':w'+w.n+':'+site.id),day,slot:w.n,site:{id:site.id,name:site.name,lat:site.lat,lng:site.lng},tier:w.tier,species:w.species,visibleAt:w.visibleAt,hatchAt:w.hatchAt,endsAt:w.endsAt};
}
export function raidPhase(r:Raid,now:number){return now<r.hatchAt?'egg':now<r.endsAt?'active':'ended';}
/** Last moment a lobby can still be opened and fully fought before the raid disappears. */
export const raidJoinableUntil=(r:Raid)=>r.endsAt-LOBBY_MS-FIGHT_MS;

export function raidBossFighter(r:Pick<Raid,'id'|'tier'|'species'>):GoFighter{
 const config=RAID_TIERS[r.tier],boss:Specimen={id:'raid-boss',species:r.species,shiny:false,favorite:false,level:1,obtainedAt:0,source:'raid',hearts:0,item:null,go:{...rollGoBug(r.species,'raid-boss:'+r.id),level:config.level,iv:[15,15,15]}};
 const f=fighterGo(boss);f.maxHP=Math.floor(f.maxHP*config.hp);f.hp=f.maxHP;f.cp=Math.floor(f.cp*Math.sqrt(config.hp));return f;
}

export function ensureRaids(go:{raids?:RaidProgress},now:number):RaidProgress{
 const day=dayV2(now),g=go.raids??={day,claimed:[],rewards:0,remote:0,passes:0,freeDay:'',invites:0,lobby:null};
 if(g.day!==day){g.day=day;g.rewards=0;g.remote=0;g.invites=0;g.claimed=g.claimed.slice(-40);}return g;
}
/** One free Zwermfluit per UTC day; never more than three in the bag. */
export function claimFreePass(g:RaidProgress,now:number){check(g.freeDay!==dayV2(now),'Je gratis Zwermfluit van vandaag is al opgehaald.');check(g.passes<RAID_RULES.maxPasses,'Je hebt al drie Zwermfluiten.');g.passes++;g.freeDay=dayV2(now);}
/** One remote raid per UTC day needs no Zwermfluit. */
export const freeRemoteLeft=(g:Pick<RaidProgress,'freeRemote'>|undefined,now:number)=>g?.freeRemote!==dayV2(now);

export function openLobby(r:Raid,n:number,now:number):RaidLobby{
 check(raidPhase(r,now)==='active','Deze zwerm is nog niet uitgekomen of al weg.');check(now<raidJoinableUntil(r),'Deze zwerm vertrekt bijna; er past geen nieuw gevecht meer in.');
 return {id:r.id+'#'+n,raidId:r.id,n,tier:r.tier,species:r.species,members:[],lobbyUntil:now+LOBBY_MS,status:'lobby',fight:null,revision:0,createdAt:now};
}
export const lobbyOpen=(l:RaidLobby,now:number)=>l.status==='lobby'&&now<l.lobbyUntil&&l.members.length<RAID_RULES.maxMembers;
/** Adds a player to an open lobby. Joining twice is a no-op, so a retried command cannot spend a second pass or the free ticket. */
export function joinLobby(l:RaidLobby,g:RaidProgress,member:RaidMember,now:number):boolean{
 if(l.members.some(m=>m.uid===member.uid))return false;
 check(lobbyOpen(l,now),'Deze lobby is vol of al gestart.');check(!g.lobby||g.lobby===l.id,'Je zit al in een andere zwerm.');check(!g.claimed.includes(l.raidId),'Deze zwerm heb je vandaag al verslagen.');check(g.rewards<RAID_RULES.rewardsPerDay,'Vandaag zijn je vijf zwermbeloningen al verdiend.');
 const entry:RaidMember={uid:member.uid,name:member.name,remote:member.remote,joinedAt:now};
 if(member.remote){check(l.members.filter(m=>m.remote).length<RAID_RULES.maxRemote,'Er doen al vier spelers op afstand mee.');check(g.remote<RAID_RULES.remotePerDay,'Vandaag deed je al drie keer op afstand mee.');
  if(freeRemoteLeft(g,now)){g.freeRemote=dayV2(now);entry.free=true;}else{check(g.passes>0,'Je hebt een Zwermfluit nodig om op afstand mee te doen.');g.passes--;}g.remote++;}
 l.members.push(entry);g.lobby=l.id;if(l.members.length>=RAID_RULES.maxMembers)l.lobbyUntil=now;l.revision++;return true;
}
/** Leaving before the start refunds a spent remote pass (or today's free ticket); after the start the place stays taken. */
export function leaveLobby(l:RaidLobby,g:RaidProgress,uid:string,now:number){
 const m=l.members.find(m=>m.uid===uid);if(g.lobby===l.id)g.lobby=null;if(!m)return;
 check(l.status==='lobby'&&now<l.lobbyUntil,'Het gevecht is al begonnen.');
 if(m.remote){if(m.free){if(g.freeRemote===dayV2(now))delete g.freeRemote;}else g.passes=Math.min(RAID_RULES.maxPasses,g.passes+1);g.remote=Math.max(0,g.remote-1);}
 l.members=l.members.filter(x=>x.uid!==uid);l.revision++;
}
/** Starts the shared fight once the lobby timer ran out. Returns true when the lobby changed. */
export function startLobby(l:RaidLobby,now:number):boolean{
 if(l.status!=='lobby'||now<l.lobbyUntil)return false;
 if(!l.members.length){l.status='failed';l.revision++;return true;}
 l.status='fighting';l.fight={startedAt:l.lobbyUntil,until:l.lobbyUntil+FIGHT_MS,maxHP:raidBossFighter({id:l.raidId,tier:l.tier,species:l.species}).maxHP};l.revision++;return true;
}
const totalDamage=(l:RaidLobby,damage:Record<string,number>)=>l.members.reduce((n,m)=>n+Math.max(0,Math.floor(damage[m.uid]??0)),0);
export function raidHP(l:RaidLobby,damage:Record<string,number>){return l.fight?Math.max(0,l.fight.maxHP-totalDamage(l,damage)):0;}
/** Settles the shared outcome: boss defeated, or the fight window closed. */
export function resolveLobby(l:RaidLobby,damage:Record<string,number>,now:number):boolean{
 startLobby(l,now);if(l.status!=='fighting'||!l.fight)return false;
 if(raidHP(l,damage)<=0){l.status='won';l.revision++;return true;}
 if(now>=l.fight.until){l.status='failed';l.revision++;return true;}return false;
}
/** One reward per raid and player, only for players who actually hit the boss. */
export function claimRaid(l:RaidLobby,g:RaidProgress,uid:string,damage:Record<string,number>,friends:readonly string[]):RaidReward|null{
 const m=l.members.find(m=>m.uid===uid);if(g.lobby===l.id&&l.status!=='lobby'&&l.status!=='fighting')g.lobby=null;
 if(l.status!=='won'||!m||(damage[uid]??0)<=0||g.claimed.includes(l.raidId)||g.rewards>=RAID_RULES.rewardsPerDay)return null;
 const config=RAID_TIERS[l.tier],top=Math.max(...l.members.map(x=>damage[x.uid]??0));
 const friendBonus=Math.min(3,l.members.filter(x=>x.uid!==uid&&friends.includes(x.uid)).length);
 g.claimed.push(l.raidId);g.rewards++;
 return {dust:config.dust,xp:config.xp,nets:config.nets+(m.remote?0:1)+friendBonus+((damage[uid]??0)===top?1:0),catchLevel:config.catchLevel};
}

export type RaidBattleMeta={lobbyId:string;raidId:string;tier:RaidTier;species:string;remote:boolean;dealt:number;synced:number;until:number};
/** A personal, server-clocked fight against the shared boss; it starts at the shared HP still left. */
export function makeRaidBattle(p:PlayerV2,l:RaidLobby,ids:unknown,dealt:number,others:number,id:string,now:number):GoBattle{
 check(l.status==='fighting'&&l.fight&&now<l.fight.until,'Het zwermgevecht is niet bezig.');const m=l.members.find(m=>m.uid===p.uid);check(m,'Je zit niet in deze zwerm.',403);
 const issue=teamIssue(p,ids,'master',true);check(!issue,issue??'Kies een geldig team.');
 const hp=Math.max(0,l.fight.maxHP-dealt-others);check(hp>0,'Deze zwerm is al verslagen.');
 const attacker=structuredClone(p),opponent=structuredClone(p);attacker.go!.league='master';attacker.go!.team=[...ids as string[]];opponent.go!.league='master';
 opponent.uid='zwerm-'+l.id;opponent.name=raidLabel(l);
 opponent.specimens=[l.species,...['ant','cricket','ladybug'].filter(k=>k!==l.species).slice(0,2)].map((kind,i)=>({id:'raid-'+i,species:kind,shiny:false,favorite:false,level:1,obtainedAt:now,source:'raid',hearts:0,item:null,go:{...rollGoBug(kind,l.raidId+':'+i),level:1,iv:[10,10,10]}} satisfies Specimen));
 opponent.go!.team=opponent.specimens.map(s=>s.id);
 const b=makeGoBattle(attacker,opponent,id,now,false,true,true),boss=raidBossFighter({id:l.raidId,tier:l.tier,species:l.species});boss.hp=hp;
 b.teams[1]=[boss,...b.teams[1].slice(1).map(f=>({...f,hp:0}))];b.shields[1]=0;b.endsAt=Math.min(b.endsAt,l.fight.until);
 b.raid={lobbyId:l.id,raidId:l.raidId,tier:l.tier,species:l.species,remote:m.remote,dealt,synced:hp,until:l.fight.until};return b;
}
/** Books own damage since the last sync and lowers the boss to the pooled HP. Other players never raise it again. */
export function syncRaidBattle(b:GoBattle,others:number){
 const r=b.raid;if(!r)return 0;const boss=b.teams[1][0];r.dealt+=Math.max(0,r.synced-boss.hp);boss.hp=Math.min(boss.hp,Math.max(0,boss.maxHP-r.dealt-others));r.synced=boss.hp;
 if(boss.hp<=0&&b.phase!=='finished'){b.phase='finished';b.winner=0;b.charge=null;b.fast=[null,null];b.queued=[null,null];b.events.push({id:++b.serial,side:0,kind:'result',amount:0});b.events=b.events.slice(-12);b.revision++;}
 return r.dealt;
}

/** Invites go only to accepted friends, never carry coordinates and are bounded per raid and per day. */
export function inviteIssue(g:RaidProgress,r:Raid,targets:unknown,friends:readonly string[],alreadyInvited:number,now:number):string|null{
 if(!Array.isArray(targets)||!targets.length||targets.some(t=>typeof t!=='string'))return 'Kies vrienden om uit te nodigen.';
 if(new Set(targets).size!==targets.length)return 'Kies iedere vriend maar een keer.';
 if(targets.some(t=>!friends.includes(t)))return 'Je kunt alleen geaccepteerde vrienden uitnodigen.';
 if(alreadyInvited+targets.length>RAID_RULES.invitesPerRaid)return 'Per zwerm kun je vijf vrienden uitnodigen.';
 if(g.invites+targets.length>RAID_RULES.invitesPerDay)return 'Vandaag heb je al twintig uitnodigingen verstuurd.';
 if(raidPhase(r,now)==='ended'||now>=raidJoinableUntil(r))return 'Deze zwerm vertrekt bijna.';return null;
}
export function raidInvite(r:Raid,from:{uid:string;name:string},now:number):RaidInvite{return {raidId:r.id,from:{uid:from.uid,name:from.name},postName:r.site.name,tier:r.tier,species:r.species,endsAt:r.endsAt,at:now};}
export function addInvite(inbox:RaidInvite[],invite:RaidInvite,now:number):RaidInvite[]{
 return [invite,...inbox.filter(i=>i.endsAt>now&&!(i.raidId===invite.raidId&&i.from.uid===invite.from.uid))].slice(0,RAID_RULES.inboxSize);
}
/** What any participant may see. Coordinates stay on the server: a post can sit close to someone's home. */
export function publicRaid(r:Raid){const {site,...rest}=r;return {...rest,site:{id:site.id,name:site.name}};}
export type RaidView=ReturnType<typeof publicRaid>&{joinableUntil:number;local:boolean};
export type RaidLobbyView={id:string;raidId:string;postName:string;tier:RaidTier;species:string;status:RaidLobby['status'];lobbyUntil:number;fightUntil:number|null;maxHP:number;hp:number;remote:boolean;claimed:boolean;members:{name:string;remote:boolean;damage:number;me:boolean}[]};
/** Lobby summary for one member: names and damage, never other players' ids or positions. */
export function lobbyView(l:RaidLobby,raid:Raid,uid:string,damage:Record<string,number>,g:RaidProgress):RaidLobbyView{
 const maxHP=l.fight?.maxHP??raidBossFighter({id:l.raidId,tier:l.tier,species:l.species}).maxHP;
 return {id:l.id,raidId:l.raidId,postName:raid.site.name,tier:l.tier,species:l.species,status:l.status,lobbyUntil:l.lobbyUntil,fightUntil:l.fight?.until??null,maxHP,hp:l.fight?raidHP(l,damage):maxHP,
  remote:!!l.members.find(m=>m.uid===uid)?.remote,claimed:g.claimed.includes(l.raidId),members:l.members.map(m=>({name:m.name,remote:m.remote,damage:Math.max(0,Math.floor(damage[m.uid]??0)),me:m.uid===uid}))};
}
export const raidLabel=(r:Pick<Raid,'tier'|'species'>)=>RAID_TIERS[r.tier].name+' · '+species(r.species).name;
