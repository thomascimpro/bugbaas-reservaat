import {gymSites,ensureGyms,chooseGymTeam,placeGymDefender,makeGymBattle,settleGymBattle,publicGym,ensureNpcGym,settleExpiredGym,GYM_RULES} from '../game/gymsV2';
import {ensureDailyChallenge,dailyChallengeView,makeDailyChallengeBattle,settleDailyChallenge,dailyWeekKey,weeklyDailyScore} from '../game/dailyChallengeV2';
/** Autovanger: one attempt per walked step, gaps up to 15 min, and at most a few Adventure Sync catches per day. */
import type {WildBug} from '../game/walkingV2';
export const AUTO_STEP=40,AUTO_MAX_GAP=900,AWAY_PER_DAY=5;
import type {Gym,GymSite} from '../game/gymsV2';
import {buyCoinOffer} from '../game/coinShopV2';
import {awardGoCatchCard,sendGoGift,openGoGift} from '../game/goGiftsV2';
import {appendGoJournal,publicGoJournal} from '../game/goJournalV2';
import type {GoJournalEntry} from '../game/goJournalV2';
import {startGoTrade,offerGoTrade,confirmGoTrade,cancelGoTrade,publicGoTrade} from '../game/goTradeV2';
import type {GoTrade} from '../game/goTradeV2';
import {ensureEcho,saveEchoDefense,chooseEchoMatch,makeEchoBattle,settleEcho,competitionTeamIssue} from '../game/echoArenaV2';
import type {EchoDefense} from '../game/echoArenaV2';
import {ensureCocoons,awardCocoon,startCocoon,hatchCocoon} from '../game/goCocoonsV2';
import {ensureBosses,makeBossBattle,settleBoss} from '../game/goBossV2';
import type {BossDifficulty} from '../game/goBossV2';
import {claimGoDaily} from '../game/dailyResearchV2';
import {ensurePostResearch,finishPostResearch} from '../game/postResearchV2';
import {teamPreset} from '../game/teamPresetsV2';
import {grantXP,claimTrainer,ensureTrainer,trainerLevel} from '../game/trainerV2';
import {ACTIVE_MS,EGG_MS,RAID_RULES,RAID_TIERS,raidAt,raidJoinableUntil,ensureRaids,claimFreePass,openLobby,lobbyOpen,joinLobby,leaveLobby,startLobby,resolveLobby,claimRaid,inviteIssue,raidInvite,addInvite,publicRaid,makeRaidBattle,syncRaidBattle,lobbyView} from '../game/raidsV2';
import type {Raid,RaidLobby,RaidInvite,RaidLobbyView,RaidToken} from '../game/raidsV2';
import {spinPost,POST_COOLDOWN,startRoute,advanceRoute,pauseRoute,resumeRoute,finishRoute,cancelRoute,MAP_GYM_TEAM_LIMIT} from '../game/worldSitesV2';
import {unknownHabitat} from '../game/habitatsV2';
import type {HabitatContext} from '../game/habitatsV2';
import type {Fix} from '../game/walkingV2';
import {createHash,createHmac,randomBytes} from 'node:crypto';
import {freshV2,dayV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField,encounterWild,castNet,claimFieldTask,catchChance,streakBonus} from '../game/fieldV2';
import {locate,catchWild,distance,CATCH_RADIUS,validFix,requireFieldLocation,GPS_MAX_AGE,GPS_CATCH_ACCURACY,wildSeed,wildSpawns} from '../game/walkingV2';
import {recordWalk} from '../game/walkingRewardsV2';
import {mergeGPSWalk,syncAdventure} from '../game/adventureSyncV2';
import {trackWeeklyWalk} from '../game/weeklyWalkV2';
import {startFieldLure,advanceFieldActivities} from '../game/fieldActivitiesV2';
import {isOutfit,STARTER_PARTNERS} from '../game/avatarV2';
import {ensureGo,markGoSeen,eligible,ownedGo,availableGo,renameGo,powerUp,secondAttack,teachMove,equipGo,teamGo,transferGo,transferManyGo,evolveGo,awardGoCatch,goCatchRewards,family,rollGoBug,stats,LEAGUES,buddyDistance} from '../game/goV2';
import type {League} from '../game/goV2';
import {makeGoBattle,advanceGoBattle,actGoBattle} from '../game/goBattleV2';
import type {GoBattle,GoBattleView} from '../game/goBattleV2';
import {rng} from '../game/catalogV2';
import {checkV2 as check} from '../game/shopV2';
import type {CommandV2,PlayerV2,GameViewV2,FriendPair,Side,Specimen} from '../game/typesV2';
import type {Documents,Store} from './store';
import {document} from './store';
const pk=(uid:string)=>'v2Players:'+uid,bk=(id:string)=>'v2GoBattles:'+id,tk=(uid:string)=>'v2GoTickets:'+uid;
const gyk=(id:string)=>'v2GoGyms:'+id;
const rk=(id:string)=>'v2Raids:'+id,lk=(id:string)=>'v2RaidLobbies:'+id,dk=(lobby:string,uid:string)=>'v2RaidDamage:'+lobby+':'+uid,ik=(uid:string)=>'v2RaidInbox:'+uid;
type RaidDoc={raid:Raid;open:number;invited:Record<string,number>};type DamageDoc={uid:string;damage:number};
const dailyScoreKey=(uid:string,league:League,now:number)=>'v2DailyScores:'+dailyWeekKey(now)+':'+league+':'+uid;
type DailyScoreRow={uid:string;name:string;week:string;league:League;score:number};
const AUTO_DEFENSE_COMMANDS=new Set(['teamPreset','goTeam','goPower','goSecond','goTM','goEquip','goEvolve','goRename','profile','echoQueue','dailyChallenge']);
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const FIELDS:Record<string,string[]>={postResearch:['id','discard'],teamPreset:['action','league','slot','ids'],gymTeam:['team'],gymDefend:['gym','id'],gymAttack:['gym','ids'],coinBuy:['offer'],adventureSync:['snapshot'],profile:['name','avatar','outfit','starter'],settings:['sound','reducedMotion','largeText','music','volume','sfxVolume','graphics'],favorite:['id'],buddy:['id'],worldLocate:['fix'],worldEncounter:['spawn'],worldFocus:['encounter'],worldCast:['encounter','net','bait','trace','rhythm'],fieldLure:[],fieldSupply:[],fieldTask:['task'],poiSpin:['poi'],routeStart:['route'],routePause:[],routeResume:[],routeFinish:[],routeCancel:[],goPower:['id','steps'],goSecond:['id'],goTM:['id','slot'],goEquip:['id','item'],goTransfer:['id'],goTransferMany:['ids'],trainerClaim:[],goEvolve:['id'],goTeam:['ids','league'],goAuto:['enabled'],goQueue:[],goCancel:[],goTrain:[],goInvite:[],goJoin:['code'],goAct:['action','value'],goClose:[],friendRequest:['code'],friendAccept:['pair'],friendRemove:['pair'],giftSend:['pair','card'],giftOpen:['pair'],echoSave:[],echoQueue:[],cocoonStart:['id','incubator'],cocoonClaim:['id'],goBoss:['difficulty','post','ids'],dailyChallenge:['practice'],goRename:['id','name'],tradeStart:['pair'],tradeOffer:['pair','id','tradeRevision'],tradeConfirm:['pair','tradeRevision','special'],tradeCancel:['pair','tradeRevision'],raidPass:[],raidJoin:['raid','remote'],raidLeave:[],raidInvite:['raid','friends'],raidFight:['ids'],raidClaim:['lobby']};
const SOCIAL_COMMANDS=new Set(['profile','friendRequest','friendAccept','friendRemove','giftSend','giftOpen','tradeStart','tradeOffer','tradeConfirm','tradeCancel','echoSave','raidInvite']);
type Ticket={uid:string;league:League;rating:number;at:number;until:number;status:'waiting'|'matched'|'cancelled'|'expired'};
export function parseGo(raw:unknown):CommandV2{check(raw&&typeof raw==='object'&&!Array.isArray(raw),'Een actie is vereist.');const c=raw as CommandV2;check(typeof c.type==='string'&&Object.hasOwn(FIELDS,c.type),'Deze oude spelmodus is verwijderd. Vernieuw de game.');check(typeof c.commandId==='string'&&/^[\w-]{16,80}$/.test(c.commandId)&&Number.isSafeInteger(c.expectedRevision)&&c.expectedRevision>=0,'Ongeldige spelactie.');check(Object.keys(c).every(k=>['type','commandId','expectedRevision',...FIELDS[c.type]].includes(k)),'De server bepaalt stats, schade en beloningen.');return c;}
export class GoServiceV2{
 private claimedCodes=new Map<string,string>();
 // Other raid members' pooled damage, read just before a battle transaction (keyed by battle document).
 private raidOthers=new Map<string,{sum:number;damage:Record<string,number>}>();
 private inboxCache=new Map<string,{until:number;value:Promise<RaidInvite[]>}>();
 private raidSecret?:Promise<string>;
 /** Keyed public raid ids. The key is created once in storage (never in Git, unreadable for clients) and shared by every server instance. */
 private raidToken():Promise<RaidToken>{
  const secret=this.raidSecret??=this.store.run(['v2RaidSecret:global'],d=>{let s=document<{key:string}>(d,'v2RaidSecret:global');if(!s){s={key:randomBytes(32).toString('hex')};d.set('v2RaidSecret:global',s);}return s.key;});
  void secret.catch(()=>{if(this.raidSecret===secret)this.raidSecret=undefined;});
  return secret.then(key=>(input:string)=>createHmac('sha256',key).update(input).digest('base64url').slice(0,22));
 }
 // Cache document membership only; every player, battle and reward stays transactionally fresh.
 private battleDocumentKeys=new Map<string,readonly string[]>();
 private dailyRankCache=new Map<string,{until:number;value:Promise<DailyScoreRow[]>}>();
 private mapGymCache=new Map<string,{until:number;value:Promise<Record<string,Gym['team']>>}>();
 // Horizon gyms only show a team colour: a cached read-only lookup, never creating gym documents or NPC defenders.
 private async markMapGyms(p:PlayerV2){const sites=(p.walking?.mapSites??[]).filter(s=>s.gym).slice(0,MAP_GYM_TEAM_LIMIT);if(!sites.length)return;const keys=sites.map(s=>gyk('gym-'+s.id)),cacheKey=[...keys].sort().join(','),now=this.clock();let entry=this.mapGymCache.get(cacheKey);if(!entry||entry.until<=now){if(this.mapGymCache.size>=1000)this.mapGymCache.clear();const value=this.store.run(keys,d=>Object.fromEntries(keys.map(k=>[k,document<Gym>(d,k)?.team??null]))),fresh={until:now+30000,value};entry=fresh;this.mapGymCache.set(cacheKey,fresh);void value.catch(()=>{if(this.mapGymCache.get(cacheKey)===fresh)this.mapGymCache.delete(cacheKey);});}const teams=await entry.value.catch(()=>({} as Record<string,Gym['team']>));for(const s of sites)s.team=teams[gyk('gym-'+s.id)]??null;}
 private socialCache=new Map<string,{until:number;value:Promise<{friends:FriendPair[];ranks:{uid:string;name:string;rating:number;wins:number}[];trades:GoTrade[];echoRanks:{uid:string;name:string;rating:number;wins:number}[]}>}>();
 constructor(public store:Store,public mode:'local'|'cloud',public clock=Date.now,public environment:(fix:Fix,now:number)=>Promise<HabitatContext>=async(_fix,now)=>unknownHabitat(now)){}
 private get(d:Documents,uid:string,now:number){let p=document<PlayerV2>(d,pk(uid));if(!p){const code=BigInt('0x'+hash(uid).slice(0,12)).toString(32).toUpperCase().padStart(10,'0').slice(-8);p=freshV2(uid,code,now);d.set(pk(uid),p);}ensureAdventure(p,now);ensureField(p,now);ensureGo(p,now);ensureGyms(p,now);ensureEcho(p,now);ensureBosses(p,now);ensureDailyChallenge(p,now);ensurePostResearch(p);ensureCocoons(p,randomBytes(24).toString('hex'),now);if(p.go!.ratedDay!==dayV2(now)){p.go!.ratedDay=dayV2(now);p.go!.ratedCount=0;}return p;}
 async ensure(uid:string){const p=await this.store.run([pk(uid)],d=>this.get(d,uid,this.clock()));if(this.claimedCodes.get(uid)!==p.friendCode){await this.store.run(['v2Codes:'+p.friendCode],d=>{const old=document<{uid:string}>(d,'v2Codes:'+p.friendCode);check(!old||old.uid===uid,'Spelercode conflicteert.',409);if(!old)d.set('v2Codes:'+p.friendCode,{uid});});if(this.claimedCodes.size>=1000)this.claimedCodes.clear();this.claimedCodes.set(uid,p.friendCode);}return p;}
 private query<T>(kind:string,filters:Parameters<NonNullable<Store['query']>>[1]=[],order?:{field:string;descending?:boolean},limit=100){check(this.store.query,'Opslag niet beschikbaar.',503);return this.store.query<T>(kind,filters,order,limit);}
 private social(uid:string){const cached=this.socialCache.get(uid);if(cached&&cached.until>this.clock())return cached.value;
  const value=Promise.all([this.query<FriendPair>('v2FriendPairs',[{field:'users',op:'array-contains',value:uid}]),this.query<{uid:string;name:string;rating:number;wins:number}>('v2GoRanks',[],{field:'rating',descending:true},30),this.query<GoTrade>('v2GoTrades',[{field:'users',op:'array-contains',value:uid}]),this.query<{uid:string;name:string;rating:number;wins:number}>('v2EchoRanks',[],{field:'rating',descending:true},30)]).then(([friends,ranks,trades,echoRanks])=>({friends,ranks,trades,echoRanks}));
  if(this.socialCache.size>=1000)this.socialCache.clear();const entry={until:this.clock()+10000,value};this.socialCache.set(uid,entry);void value.catch(()=>{if(this.socialCache.get(uid)===entry)this.socialCache.delete(uid);});return value;
 }
 private note(p:PlayerV2,kind:GoJournalEntry['kind'],id:string,s:Specimen,at:number,extra:Partial<GoJournalEntry>={}){appendGoJournal(p,{id,kind,at,species:s.species,specimenId:s.id,shiny:s.shiny,cp:s.go?stats(s).cp:undefined,...extra});}
 private dailyRanks(uids:string[],league:League,now:number){const week=dailyWeekKey(now),ids=[...new Set(uids)].sort(),cacheKey=week+':'+league+':'+ids.join(','),cached=this.dailyRankCache.get(cacheKey);if(cached&&cached.until>now)return cached.value;const keys=ids.map(uid=>dailyScoreKey(uid,league,now)),value=this.store.run(keys,d=>keys.flatMap(key=>{const row=document<DailyScoreRow>(d,key);return row?[row]:[];}));if(this.dailyRankCache.size>=1000)this.dailyRankCache.clear();const entry={until:now+10000,value};this.dailyRankCache.set(cacheKey,entry);void value.catch(()=>{if(this.dailyRankCache.get(cacheKey)===entry)this.dailyRankCache.delete(cacheKey);});return value;}
 private settle(d:Documents,b:GoBattle,now:number){
  if(b.phase==='finished'&&!b.settled)this.socialCache.clear();
  if(b.raid){
   this.raidSync(d,b,now);if(b.phase!=='finished'||b.settled)return;b.settled=true;
   const p=this.get(d,b.players[0],now);b.rewards=[{dust:0,xp:0,fastTMs:0,chargedTMs:0}];this.noteBattle(p,b,0,now);p.revision++;return;
  }
  if(b.dailyChallenge){
   const p=this.get(d,b.players[0],now),reward=settleDailyChallenge(p,b,now);if(!reward)return;
   const g=p.go!,beforeXP=g.trainer!.xp;g.dust+=reward.dust;grantXP(p,reward.xp);b.rewards=[{dust:reward.dust,xp:g.trainer!.xp-beforeXP,fastTMs:0,chargedTMs:0}];this.noteBattle(p,b,0,now);p.revision++;
   if(!b.dailyChallenge.practice){d.set(dailyScoreKey(p.uid,b.league,b.createdAt),{uid:p.uid,name:p.name,week:dailyWeekKey(b.createdAt),league:b.league,score:weeklyDailyScore(g.dailyChallenge,b.league,b.createdAt)} satisfies DailyScoreRow);this.dailyRankCache.clear();}return;
  }
  if(b.gym){
   const g=document<Gym>(d,gyk(b.gym.id));check(g,'Deze gym is niet beschikbaar.',409);
   const owners=new Map(b.gym.defenders.filter(ref=>!ref.npc).flatMap(ref=>{const owner=document<PlayerV2>(d,pk(ref.uid));return owner?[[ref.uid,owner] as [string,PlayerV2]]:[];}));
   if(settleGymBattle(g,b,owners,now)){const p=this.get(d,b.players[0],now);p.revision++;b.rewards=[{dust:0,xp:0,fastTMs:0,chargedTMs:0}];}return;
  }
  if(b.echo){
   const p=this.get(d,b.players[0],now),reward=settleEcho(p,b,now);if(!reward)return;
   const g=p.go!,beforeXP=g.trainer!.xp;g.dust+=reward.dust;grantXP(p,reward.xp);b.rewards=[{dust:reward.dust,xp:g.trainer!.xp-beforeXP,fastTMs:0,chargedTMs:0}];this.noteBattle(p,b,0,now);
   g.history.unshift({id:b.id,opponent:b.names[1]+' · Echo',result:b.winner===null?'Gelijkspel':b.winner===0?'Gewonnen':'Verloren',delta:0,at:now});g.history=g.history.slice(0,30);p.revision++;
   if(reward.rewarded&&!b.echo.npc){d.set('v2EchoRanks:'+p.uid,{uid:p.uid,name:p.name,rating:g.echo!.rating,wins:g.echo!.wins});const ownDefense=document<EchoDefense>(d,'v2EchoDefenses:'+p.uid);if(ownDefense)ownDefense.rating=g.echo!.rating;const leagueDefense=document<EchoDefense>(d,'v2EchoDefenses:'+p.uid+'-'+b.league);if(leagueDefense)leagueDefense.rating=g.echo!.rating;}return;
  }
  if(b.boss){
   const p=this.get(d,b.players[0],now),reward=settleBoss(p,b,now);if(!reward)return;
   const g=p.go!,beforeXP=g.trainer!.xp;g.dust+=reward.dust;grantXP(p,reward.xp);g.fastTMs+=reward.fastTMs;g.chargedTMs+=reward.chargedTMs;if(reward.item)g.items[reward.item]++;
   b.rewards=[{dust:reward.dust,xp:g.trainer!.xp-beforeXP,fastTMs:reward.fastTMs,chargedTMs:reward.chargedTMs,item:reward.item}];this.noteBattle(p,b,0,now);p.revision++;return;
  }
  if(b.phase!=='finished'||b.settled)return;b.settled=true;const players=b.players.slice(0,b.training?1:2).map(id=>this.get(d,id,now));
  const expected=1/(1+10**((b.ratings[1]-b.ratings[0])/400));b.delta=b.ranked&&b.winner!==null?Math.round(24*((b.winner===0?1:0)-expected)):0;
  b.rewards=[];
  for(let i=0;i<players.length;i++){
   const p=players[i],g=p.go!,won=b.winner===i,delta=i===0?b.delta:-b.delta,before={dust:g.dust,xp:g.trainer!.xp,fastTMs:g.fastTMs,chargedTMs:g.chargedTMs};
   if(b.ranked){g.ratedCount=(g.ratedCount??0)+1;g.rating=Math.max(0,g.rating+delta);if(b.winner!==null)won?g.wins++:g.losses++;g.dust+=won?500:100;if(won)grantXP(p,250);if(g.ratedCount===1){const random=rng(b.id+p.uid);random()<.5?g.fastTMs++:g.chargedTMs++;}}
   b.rewards.push({dust:g.dust-before.dust,xp:g.trainer!.xp-before.xp,fastTMs:g.fastTMs-before.fastTMs,chargedTMs:g.chargedTMs-before.chargedTMs});this.noteBattle(p,b,i as Side,now);
   g.history.unshift({id:b.id,opponent:b.names[1-i],result:b.winner===null?'Gelijkspel':won?'Gewonnen':'Verloren',delta,at:now});g.history=g.history.slice(0,30);p.revision++;if(!b.training)d.set('v2GoRanks:'+p.uid,{uid:p.uid,name:p.name,rating:g.rating,wins:g.wins});
  }
 }
 private noteBattle(p:PlayerV2,b:GoBattle,side:Side,at:number){const reward=b.rewards?.[side];appendGoJournal(p,{id:'battle:'+b.id,kind:b.dailyChallenge?'challenge':b.echo?'echo':b.boss||b.raid?'boss':'battle',at,result:b.winner===null?'draw':b.winner===side?'win':'loss',opponent:b.names[1-side],dust:reward?.dust??0,xp:reward?.xp??0,method:b.dailyChallenge||b.echo||b.boss||b.raid?undefined:b.ranked?'ranked':b.training?'training':'casual'});}
 private rememberBattleKeys(b:GoBattle){const ids=b.players.slice(0,b.training?1:2),keys=[bk(b.id),...ids.flatMap(uid=>[pk(uid),'v2GoRanks:'+uid,'v2EchoRanks:'+uid,'v2EchoDefenses:'+uid,'v2EchoDefenses:'+uid+'-'+b.league])];if(b.dailyChallenge)keys.push(dailyScoreKey(b.players[0],b.league,b.createdAt));if(b.gym)keys.push(gyk(b.gym.id),...b.gym.defenders.filter(ref=>!ref.npc).map(ref=>pk(ref.uid)));if(b.raid)keys.push(lk(b.raid.lobbyId),dk(b.raid.lobbyId,b.players[0]));const immutable=Object.freeze([...new Set(keys)]);if(!this.battleDocumentKeys.has(b.id)&&this.battleDocumentKeys.size>=1000)this.battleDocumentKeys.delete(this.battleDocumentKeys.keys().next().value!);this.battleDocumentKeys.set(b.id,immutable);return immutable;}
 private async battleKeys(id:string){const cached=this.battleDocumentKeys.get(id);if(cached)return cached;const b=await this.store.run([bk(id)],d=>document<GoBattle>(d,bk(id)));return b?this.rememberBattleKeys(b):[];}
 private checkBattleKeys(d:Documents,b:GoBattle){check(this.rememberBattleKeys(b).every(key=>d.has(key)),'Je gevecht is veranderd. Probeer opnieuw.',409);}
 private async advance(id:string,uid?:string){const keys=await this.battleKeys(id);if(!keys.length)return;await this.prefetchRaid(keys);return this.store.run([...keys],d=>{const b=document<GoBattle>(d,bk(id));if(!b)return;this.checkBattleKeys(d,b);advanceGoBattle(b,this.clock());this.settle(d,b,this.clock());return {battle:b,player:uid?document<PlayerV2>(d,pk(uid)):undefined};});}
 /** Reads all members' pooled damage. Outside the battle transaction a stale read only underestimates damage. */
 // Lobby member lists (fixed once the fight starts), pooled damage per lobby (1.5 s) and immutable raid documents.
 private raidMembers=new Map<string,string[]>();
 private raidDamageCache=new Map<string,{until:number;value:Promise<{lobby:RaidLobby|undefined;damage:Record<string,number>}>}>();
 private raidDocs=new Map<string,Promise<RaidDoc|undefined>>();
 /** One transaction for a lobby and its known members' damage, shared by all polls for 1.5 s. Stale or missing values only underestimate damage. */
 private async raidDamage(lobbyId:string){
  let entry=this.raidDamageCache.get(lobbyId);
  if(!entry||entry.until<=this.clock()){
   const members=this.raidMembers.get(lobbyId)??[],value=this.store.run([lk(lobbyId),...members.map(uid=>dk(lobbyId,uid))],d=>{const lobby=document<RaidLobby>(d,lk(lobbyId));return {lobby,damage:Object.fromEntries((lobby?.members??[]).map(m=>[m.uid,document<DamageDoc>(d,dk(lobbyId,m.uid))?.damage??0])) as Record<string,number>};});
   if(this.raidDamageCache.size>=1000){this.raidDamageCache.clear();this.raidMembers.clear();}
   const created={until:this.clock()+1500,value};entry=created;this.raidDamageCache.set(lobbyId,created);void value.then(r=>{if(r.lobby)this.raidMembers.set(lobbyId,r.lobby.members.map(m=>m.uid));},()=>{if(this.raidDamageCache.get(lobbyId)===created)this.raidDamageCache.delete(lobbyId);});
  }
  const {lobby,damage}=await entry.value;return {lobby,damage:{...damage}};
 }
 private raidDoc(raidId:string){
  let doc=this.raidDocs.get(raidId);if(!doc){if(this.raidDocs.size>=1000)this.raidDocs.clear();const created=this.store.run([rk(raidId)],d=>document<RaidDoc>(d,rk(raidId)));doc=created;this.raidDocs.set(raidId,created);void created.then(r=>{if(!r&&this.raidDocs.get(raidId)===created)this.raidDocs.delete(raidId);},()=>{if(this.raidDocs.get(raidId)===created)this.raidDocs.delete(raidId);});}
  return doc;
 }
 private async prefetchRaid(keys:readonly string[]){
  const lobbyKey=keys.find(k=>k.startsWith('v2RaidLobbies:')),own=keys.find(k=>k.startsWith('v2RaidDamage:'));if(!lobbyKey||!own)return;
  const lobbyId=lobbyKey.slice('v2RaidLobbies:'.length),uid=own.slice(dk(lobbyId,'').length),{damage}=await this.raidDamage(lobbyId);delete damage[uid];
  if(this.raidOthers.size>=1000)this.raidOthers.clear();this.raidOthers.set(keys[0],{sum:Object.values(damage).reduce((a,b)=>a+b,0),damage});
 }
 private raidSync(d:Documents,b:GoBattle,now:number){
  const r=b.raid!,uid=b.players[0],others=this.raidOthers.get(bk(b.id))??{sum:0,damage:{}},dealt=syncRaidBattle(b,others.sum),own=document<DamageDoc>(d,dk(r.lobbyId,uid));
  if(!own||own.damage<dealt)d.set(dk(r.lobbyId,uid),{uid,damage:dealt});
  const l=document<RaidLobby>(d,lk(r.lobbyId));if(l)resolveLobby(l,{...others.damage,[uid]:Math.max(dealt,own?.damage??0)},now);
  // Once the group has won, every member's own fight ends as a win too.
  if(l?.status==='won'&&b.phase!=='finished')syncRaidBattle(b,Infinity);
 }
 private localRaidSite(p:PlayerV2,raid:string,now:number,token:RaidToken){
  const w=requireFieldLocation(p.walking,now),site=gymSites(w.posts??[]).find(s=>raidAt(s,now,token)?.id===raid);check(site,'Deze zwerm is niet in de buurt.');check(distance(w.fix,site)<=65,'Loop binnen 65 meter van de gympost.');return site;
 }
 private inbox(uid:string){
  const cached=this.inboxCache.get(uid);if(cached&&cached.until>this.clock())return cached.value;
  const value=this.store.run([ik(uid)],d=>document<{items:RaidInvite[]}>(d,ik(uid))?.items??[]);if(this.inboxCache.size>=1000)this.inboxCache.clear();
  const entry={until:this.clock()+10000,value};this.inboxCache.set(uid,entry);void value.catch(()=>{if(this.inboxCache.get(uid)===entry)this.inboxCache.delete(uid);});return value;
 }
 private async raidView(uid:string,p:PlayerV2){
  const now=this.clock(),w=p.walking,fresh=!!w&&now-w.at<45000,token=await this.raidToken();
  const raids=w?gymSites(w.posts??[]).flatMap(site=>{const r=raidAt(site,now,token);return r?[{...publicRaid(r),joinableUntil:raidJoinableUntil(r),local:fresh&&distance(w.fix,site)<=65}]:[];}):[];
  let raidLobby:RaidLobbyView|null=null;const lobbyId=p.go?.raids?.lobby;
  if(lobbyId){const {lobby,damage}=await this.raidDamage(lobbyId),doc=lobby?await this.raidDoc(lobby.raidId):undefined;
   if(lobby&&doc){const shown=structuredClone(lobby);resolveLobby(shown,damage,now);raidLobby=lobbyView(shown,doc.raid,uid,damage,p.go!.raids!);}}
  const invited=(p.go?.raids?.invitedAt??0)>now-EGG_MS-ACTIVE_MS;
  return {raids,raidLobby,raidInvites:invited?(await this.inbox(uid)).filter(i=>i.endsAt>now):[]};
 }
 private async gyms(p:PlayerV2){
  const now=this.clock(),sites=new Map<string,GymSite>([...gymSites(p.walking?.posts??[]),...(p.go!.gyms?.deployed??[])].map(site=>[site.id,site]));
  if(!sites.size)return {items:[] as Gym[],changed:false};
  const keys=[...sites.keys()].map(gyk),read=()=>this.store.run(keys,d=>[...sites.values()].map(site=>{let g=document<Gym>(d,gyk(site.id));if(!g){g={...site,team:null,revision:0,defenders:[]};d.set(gyk(site.id),g);}ensureNpcGym(g,now);return g;}));
  let gyms=await read(),changed=false;const expiredBattles=gyms.filter(g=>g.battle&&g.battle.until<=now);
  for(const g of expiredBattles)await this.advance(g.battle!.id);if(expiredBattles.length){gyms=await read();changed=true;}
  const expiring=gyms.filter(g=>(!g.battle||g.battle.until<=now)&&g.defenders.some(defender=>!defender.npc&&now-defender.at>=GYM_RULES.maxStayMs));
  if(expiring.length){
   const ownerKeys=[...new Set(expiring.flatMap(g=>g.defenders.filter(defender=>!defender.npc).map(defender=>pk(defender.uid))))],ownersAllowed=new Set(ownerKeys);
   const result=await this.store.run([...expiring.map(g=>gyk(g.id)),...ownerKeys],d=>{
    const owners=new Map<string,PlayerV2>();for(const key of ownerKeys){const owner=document<PlayerV2>(d,key);if(owner)owners.set(owner.uid,owner);}
    let returned=false;const updated=expiring.map(prior=>{const g=document<Gym>(d,gyk(prior.id));check(g,'Deze gym is veranderd.',409);check(g.defenders.filter(defender=>!defender.npc&&now-defender.at>=GYM_RULES.maxStayMs).every(defender=>ownersAllowed.has(pk(defender.uid))),'De gymverdediging is veranderd. Vernieuw de kaart.',409);if(settleExpiredGym(g,owners,now))returned=true;return g;});return {returned,updated};
   });
   const updates=new Map(result.updated.map(g=>[g.id,g]));gyms=gyms.map(g=>updates.get(g.id)??g);changed||=result.returned;
  }
  return {items:gyms,changed};
 }
 async state(uid:string,linked=false):Promise<GameViewV2>{let p=await this.ensure(uid),battle:GoBattle|null=null;if(p.go!.queue){await this.matchmake(uid);p=await this.store.run([pk(uid)],d=>this.get(d,uid,this.clock()));}if(p.go!.battle){const snapshot=await this.advance(p.go!.battle,uid);if(snapshot){p=snapshot.player??p;battle=snapshot.battle;}}return this.view(uid,p,battle,linked);}
 private async view(uid:string,p:PlayerV2,battle:GoBattle|null,linked:boolean):Promise<GameViewV2>{
  const gymState=await this.gyms(p),gyms=gymState.items;if(gymState.changed){p=await this.store.run([pk(uid)],d=>this.get(d,uid,this.clock()));battle=p.go!.battle?await this.store.run([bk(p.go!.battle)],d=>document<GoBattle>(d,bk(p.go!.battle!))??null):null;}
  const publicPlayer=structuredClone(p);await this.markMapGyms(publicPlayer);
  if(publicPlayer.go?.cocoons)for(const item of publicPlayer.go.cocoons.items)delete item.hatchSeed;
  if(publicPlayer.walking){delete publicPlayer.walking.seed;for(const s of publicPlayer.walking.spawns)if(s.boss)delete s.boss.seed;}if(publicPlayer.field?.lure)delete publicPlayer.field.lure.seed;if(publicPlayer.field?.cocoon)delete publicPlayer.field.cocoon.seed;
  if(publicPlayer.go!.auto.enabled&&(!publicPlayer.walking||this.clock()-Math.min(publicPlayer.walking.at,publicPlayer.walking.fix.timestamp??publicPlayer.walking.at)>=GPS_MAX_AGE))publicPlayer.go!.auto.status='gps';
  // Keep old records recoverable in storage, but do not send old modes or reward seeds to the game.
  publicPlayer.safari=null;publicPlayer.match=null;publicPlayer.ticket=false;publicPlayer.arenaRun=null;
  if(publicPlayer.adventure){publicPlayer.adventure.run=null;publicPlayer.adventure.expedition=null;}
  const {friends,ranks,trades,echoRanks}=await this.social(uid);publicPlayer.go!.journal=publicGoJournal(publicPlayer.go!.journal);
  const friendUids=new Set([uid,...friends.filter(pair=>pair.accepted&&!pair.removed).flatMap(pair=>pair.users)]),weeklyRows=publicPlayer.go!.dailyChallenge!.days.length||friendUids.size>1?await this.dailyRanks([...friendUids],publicPlayer.go!.league,this.clock()):[],dailyChallengeLeaderboard=weeklyRows.filter(row=>row.week===dailyWeekKey(this.clock())&&row.league===publicPlayer.go!.league&&friendUids.has(row.uid)&&Number.isSafeInteger(row.score)&&row.score>=0).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).map(row=>({name:row.name,score:row.score,me:row.uid===uid}));
  const visible=battle?structuredClone(battle) as GoBattleView:null;if(visible){check(visible.players.includes(uid),'Dit gevecht is niet van jou.',403);visible.side=visible.players.indexOf(uid) as Side;if(visible.boss)delete visible.boss.catchSeed;if(visible.gym)visible.gym.defenders=[];const other=(1-visible.side) as Side;if(visible.queued)visible.queued[other]=null;visible.teams[other].forEach((f,i)=>{f.energy=0;f.attack=0;f.defense=0;f.readyAt=0;f.go={level:0,iv:[0,0,0],fast:'bite',charged:[],item:null};if(i!==visible.active[other]){f.id='opponent-'+i;f.species='unknown';f.cp=0;f.shiny=false;f.hp=f.hp>0?1:0;f.maxHP=1;}else{f.hp=Math.ceil(f.hp/f.maxHP*100);f.maxHP=100;}});}
  const raidState=await this.raidView(uid,p);
  return {...raidState,dailyChallenge:dailyChallengeView(publicPlayer,this.clock()),dailyChallengeLeaderboard,goGyms:gyms.map(g=>publicGym(g,uid,this.clock())),goTrades:trades.map(t=>publicGoTrade(t,this.clock())),echoLeaderboard:echoRanks.map(r=>({name:r.name,rating:r.rating,wins:r.wins,me:r.uid===uid})),player:publicPlayer,now:this.clock(),mode:this.mode,linked:linked||this.mode==='local',match:null,ticket:null,friends:friends.filter(f=>!f.removed),leaderboard:ranks.map(r=>({name:r.name,rating:r.rating,wins:r.wins,me:r.uid===uid})),goBattle:visible};
 }
 private auto(p:PlayerV2,now:number,secret:string){
  const g=p.go!,a=g.auto,w=p.walking;if(!w)return;const previous=g.motion;
  // Keep the older anchor for very short GPS intervals so small steps still add up to distance.
  if(a.enabled&&previous&&now-previous.at<5000)return;g.motion={fix:{...w.fix},at:now};
  if(!a.enabled){a.status='off';return;}if(w.blockedUntil&&w.blockedUntil>now){a.status='too-fast';a.moving=0;return;}
  if(!previous||w.fix.accuracy>25||previous.fix.accuracy>25){a.status='gps';a.moving=0;return;}
  // Background Android delivers sparse fixes; credit plausible walking distance across gaps up to 15 minutes instead of
  // demanding back-to-back fixes. Driving speed still voids the credit.
  const seconds=(now-previous.at)/1000,meters=distance(previous.fix,w.fix),speed=meters/Math.max(1,seconds);
  if(seconds>AUTO_MAX_GAP){a.status='waiting';a.moving=0;a.credit=0;return;}
  if(speed>7){a.status='too-fast';a.moving=0;a.credit=0;return;}
  if(meters<Math.max(12,w.fix.accuracy,previous.fix.accuracy)){a.status='waiting';a.moving=0;return;}
  a.status='moving';a.moving++;a.credit=Math.min(AUTO_STEP*4,(a.credit??0)+meters);if(a.credit<AUTO_STEP||now-a.lastAt<30000)return;a.credit-=AUTO_STEP;
  const f=p.field!,before={dust:g.dust,xp:g.trainer!.xp},totals=a.totals??={caught:0,missed:0,dust:0,xp:0};
  // A moving autovanger replenishes at the same server-validated posts and cooldown as manual spinning.
  const post=w.posts?.find(post=>distance(w.fix,post)<=CATCH_RADIUS&&now-(g.sites?.visits[post.id]??0)>=POST_COOLDOWN);
  if(post){spinPost(p,post.id,secret+':auto-post',now);totals.spins=(totals.spins??0)+1;}
  const accountRewards=()=>{totals.dust+=g.dust-before.dust;totals.xp+=g.trainer!.xp-before.xp;};
  if(f.inventory.basic<1){a.status='empty';accountRewards();return;}
  a.attempted=a.attempted.filter(id=>w.spawns.some(s=>s.id===id&&s.expiresAt>now));
  const s=w.spawns.find(s=>!s.boss&&s.expiresAt>now&&!w.caught.includes(s.id)&&!a.attempted.includes(s.id)&&f.encounter?.spawn!==s.id&&distance(w.fix,s)<=CATCH_RADIUS);
  if(!s||!w.seed){accountRewards();return;}
  this.autoCatch(p,s,now,secret,totals);accountRewards();
 }
 /** One autovanger attempt on a spawn: consumes a basic net and records a catch or a miss. */
 private autoCatch(p:PlayerV2,s:WildBug,now:number,secret:string,totals:{caught:number;missed:number}){
  const g=p.go!,a=g.auto,f=p.field!,w=p.walking!;
  a.lastAt=now;a.attempted.push(s.id);f.inventory.basic--;const caught=rng(secret+':auto')()<.75*catchChance(s.species,'basic',null);
  if(caught){catchWild(p,s.id,now);const bug=p.specimens.at(-1)!,priorDust=g.dust,priorXP=g.trainer!.xp;awardGoCatch(p,bug,w.seed+':go:'+s.id);f.total.catches++;f.daily.catches++;if(!f.daily.species.includes(s.species))f.daily.species.push(s.species);if(s.source==='lure'&&f.lure)f.lure.caught++;awardGoCatchCard(p,bug,s.id,now);awardCocoon(p,secret,now);w.lastCatch!.nectar=g.dust-priorDust;this.note(p,'catch','catch:'+s.id,bug,now,{method:'auto',dust:g.dust-priorDust,xp:g.trainer!.xp-priorXP});totals.caught++;}
  else{w.caught.push(s.id);appendGoJournal(p,{id:'autoMiss:'+s.id,kind:'autoMiss',at:now,species:s.species,method:'auto'});totals.missed++;}
  a.last={species:s.species,caught,at:now};
 }
 /** Kilometres from Adventure Sync while the app was closed: one auto attempt per full km, max per day, at the fresh current location. */
 private awayCatch(p:PlayerV2,meters:number,now:number,secret:string){
  const g=p.go!,a=g.auto,w=p.walking,f=p.field!,day=dayV2(now);if(!a.enabled||!w?.seed||!(meters>=0))return;
  if(a.awayDay!==day){a.awayDay=day;a.awayCount=0;}
  a.awayCredit=Math.min(AWAY_PER_DAY*1000,(a.awayCredit??0)+meters);
  if(a.awayCredit<1000||(a.awayCount??0)>=AWAY_PER_DAY||f.inventory.basic<1)return;
  // catchWild needs a fresh fix and a short gap after the previous catch; otherwise keep the credit for the next sync.
  if(now-w.at>=40000||w.fix.accuracy>GPS_CATCH_ACCURACY||(w.lastCatch&&now-w.lastCatch.at<900))return;
  a.awayCount=(a.awayCount??0)+1;a.awayCredit-=1000;
  const spawn={...wildSpawns(w.fix,secret+':away:'+day+':'+a.awayCount,now)[0],id:'away-'+day+'-'+a.awayCount+'-'+hash(secret).slice(0,8)};
  w.spawns.push(spawn);const totals=a.totals??={caught:0,missed:0,dust:0,xp:0},before={dust:g.dust,xp:g.trainer!.xp};
  this.autoCatch(p,spawn,now,secret+':away',totals);totals.dust+=g.dust-before.dust;totals.xp+=g.trainer!.xp-before.xp;
 }
 /** The chosen first partner: a real GO bug (level 12, good IV, favourite) that becomes the buddy; only once, at the start. */
 private givePartner(p:PlayerV2,kind:string,now:number){const g=ensureGo(p,now),id='partner-'+kind;p.specimens.push({id,species:kind,level:1,shiny:false,favorite:true,obtainedAt:now,source:'partner',hearts:0,item:null,go:rollGoBug(kind,p.uid+':partner',{level:12})});ensureGo(p,now);g.candy[family(kind)]=(g.candy[family(kind)]??0)+10;p.buddy=id;markGoSeen(p,kind,now);}
 private npc(p:PlayerV2,id:string,now:number){const q=freshV2('training-'+p.uid,'TRAINING',now);ensureGo(q,now);q.name='Veldwachter';q.go!.league=p.go!.league;const average=p.go!.team.map(id=>ownedGo(p,id).go!.level).reduce((a,b)=>a+b,0)/3;q.specimens=['ant','beetle','moth'].map((species,i)=>{const s={id:'trainer-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:now,source:'training',hearts:0,item:null,go:rollGoBug(species,id+i)};s.go.level=Math.min(50,Math.max(1,Math.round(average)));while(stats(s).cp>LEAGUES[q.go!.league].cap&&s.go.level>1)s.go.level-=.5;return s;});q.go!.team=q.specimens.map(s=>s.id);return q;}
 private commandSnapshot(d:Documents,player:PlayerV2){
  const id=player.go!.battle;
  // Queued players still need matchmaking; a concurrently created battle needs
  // its own transaction instead of returning an incomplete acknowledgement.
  if(player.go!.queue||id&&!d.has(bk(id)))return null;
  return {player,battle:id?document<GoBattle>(d,bk(id))??null:null};
 }
 async command(uid:string,raw:unknown,linked=false):Promise<GameViewV2>{
  const c=parseGo(raw),now=this.clock(),secret=randomBytes(24).toString('hex'),id=randomBytes(16).toString('hex');let p=await this.ensure(uid);if(c.type==='gymDefend'||c.type==='gymAttack'){const gymState=await this.gyms(p);if(gymState.changed)p=await this.store.run([pk(uid)],d=>this.get(d,uid,now));}if(p.go!.battle&&c.type!=='goAct')await this.advance(p.go!.battle);
  const habitat=c.type==='worldLocate'?await this.environment(validFix(c.fix,now),now):undefined;
  const echoDefense=c.type==='echoQueue'?chooseEchoMatch(p,linked||this.mode==='local'?await this.query<EchoDefense>('v2EchoDefenses',[{field:'league',op:'==',value:p.go!.league}]):[],now):null;
  const receipt='v2GoReceipts:'+uid+'-'+c.commandId,rate='v2GoRate:'+uid,keys=[pk(uid),receipt,rate,tk(uid)];let otherUid:string|undefined;
  if(c.type==='goJoin'||c.type==='friendRequest'){check(typeof c.code==='string'&&/^[A-Z0-9]{8}$/.test(c.code),'Gebruik een geldige achttekencode.');const entry=await this.store.run(['v2Codes:'+c.code],d=>document<{uid:string}>(d,'v2Codes:'+c.code));check(entry&&entry.uid!==uid,'Deze speler is niet gevonden.');otherUid=entry.uid;keys.push(pk(otherUid),'v2GoInvites:'+c.code,'v2FriendPairs:'+([uid,otherUid].sort().join('_')));}
  if(c.type==='friendAccept'||c.type==='friendRemove'||c.type==='giftSend'||c.type==='giftOpen'){check(typeof c.pair==='string'&&c.pair.length<256,'Kies een vriend.');keys.push('v2FriendPairs:'+c.pair);}
  const trading=['tradeStart','tradeOffer','tradeConfirm','tradeCancel'].includes(c.type);
  if(trading){check(linked||this.mode==='local','Koppel je account om te ruilen.',403);check(typeof c.pair==='string'&&c.pair.length>0&&c.pair.length<256,'Kies een vriend.');const pairKey='v2FriendPairs:'+c.pair,pair=await this.store.run([pairKey],d=>document<FriendPair>(d,pairKey));check(pair&&pair.users.length===2&&pair.users.includes(uid)&&pair.users[0]!==pair.users[1],'Deze vriendschap bestaat niet.',403);keys.push(pairKey,'v2GoTrades:'+c.pair,...pair.users.map(pk));}
  if(c.type==='gymDefend'||c.type==='gymAttack'){check(typeof c.gym==='string'&&/^gym-[\w:.-]{1,180}$/.test(c.gym),'Kies een geldige gym.');keys.push(gyk(c.gym));}
  if(c.type==='goInvite')keys.push('v2GoInvites:'+p.friendCode);
  if(c.type==='goTrain'||c.type==='goJoin'||c.type==='echoQueue'||c.type==='goBoss'||c.type==='dailyChallenge'||c.type==='gymAttack')keys.push(bk(id));
  if(c.type==='echoSave'||AUTO_DEFENSE_COMMANDS.has(c.type))keys.push('v2EchoDefenses:'+uid,...Object.keys(LEAGUES).map(league=>'v2EchoDefenses:'+uid+'-'+league));
  if(p.go!.battle){const battleKeys=await this.battleKeys(p.go!.battle);keys.push(...battleKeys);await this.prefetchRaid(battleKeys);}
  const raidToken=c.type==='raidJoin'||c.type==='raidInvite'?await this.raidToken():undefined;
  const currentLobby=p.go!.raids?.lobby;let raidOthers=0,raidFriends:string[]=[],inviteFriends:string[]=[];
  if(c.type==='raidJoin'||c.type==='raidInvite'){check(typeof c.raid==='string'&&/^\d{4}-\d\d-\d\d:\d{1,2}:[\w-]{22}$/.test(c.raid),'Kies een zwerm.');keys.push(rk(c.raid));}
  if(c.type==='raidJoin'){const doc=await this.store.run([rk(c.raid as string)],d=>document<RaidDoc>(d,rk(c.raid as string))),open=doc?.open??0;keys.push(lk(c.raid+'#'+open),lk(c.raid+'#'+(open+1)),ik(uid));}
  if(currentLobby&&(c.type==='raidJoin'||c.type==='raidLeave'||c.type==='raidFight'||c.type==='raidInvite'))keys.push(lk(currentLobby),dk(currentLobby,uid));
  if(c.type==='raidFight'){check(currentLobby,'Je zit niet in een zwerm.');const {damage}=await this.raidDamage(currentLobby);delete damage[uid];raidOthers=Object.values(damage).reduce((a,b)=>a+b,0);keys.push(bk(id));}
  if(c.type==='raidInvite'){check(Array.isArray(c.friends)&&c.friends.length>0&&c.friends.length<=RAID_RULES.invitesPerRaid&&c.friends.every(f=>typeof f==='string'&&f.length>0&&f.length<128&&f!==uid),'Kies maximaal vijf vrienden.');inviteFriends=c.friends as string[];keys.push(...inviteFriends.flatMap(f=>['v2FriendPairs:'+[uid,f].sort().join('_'),ik(f),pk(f)]));}
  if(c.type==='raidClaim'){check(typeof c.lobby==='string'&&c.lobby.length<320,'Kies een zwerm.');const lobby=await this.store.run([lk(c.lobby)],d=>document<RaidLobby>(d,lk(c.lobby as string)));check(lobby&&lobby.members.some(m=>m.uid===uid),'Je zat niet in deze zwerm.',403);keys.push(lk(c.lobby),rk(lobby.raidId),...lobby.members.map(m=>dk(lobby.id,m.uid)));const {friends}=await this.social(uid);raidFriends=friends.filter(pair=>pair.accepted&&!pair.removed).flatMap(pair=>pair.users).filter(u=>u!==uid);}
  const snapshot=await this.store.run([...new Set(keys)],d=>{
   const fingerprint=hash(JSON.stringify(c)),old=document<{fingerprint:string}>(d,receipt);if(old){check(old.fingerprint===fingerprint,'Dit actie-ID is al voor iets anders gebruikt.',409);const player=this.get(d,uid,now);if(c.type==='goAct'){const battle=player.go!.battle?document<GoBattle>(d,bk(player.go!.battle)):undefined;if(battle){this.checkBattleKeys(d,battle);advanceGoBattle(battle,now);this.settle(d,battle,now);}}return this.commandSnapshot(d,player);}
   const x=this.get(d,uid,now),g=x.go!,f=x.field!;check(x.revision===c.expectedRevision,'Je voortgang is veranderd. Probeer opnieuw.',409);const r=document<{at:number;count:number}>(d,rate)??{at:now,count:0};if(now-r.at>=60000){r.at=now;r.count=0;}check(++r.count<=600,'Even rustig: te veel acties.',429);d.set(rate,r);
   const idle=()=>check(!g.battle&&!g.queue,'Rond je gevecht of zoekopdracht eerst af.');
   switch(c.type){
    case 'gymTeam':idle();check(linked||this.mode==='local','Koppel je account voor gyms.',403);chooseGymTeam(x,c.team,now);break;
    case 'gymDefend':case 'gymAttack':{
     idle();check(linked||this.mode==='local','Koppel je account voor gyms.',403);const key=gyk(c.gym as string),site=gymSites(x.walking?.posts??[]).find(s=>s.id===c.gym);let gym=document<Gym>(d,key);if(!gym){check(site,'Deze gym is niet beschikbaar.');gym={...site,team:null,revision:0,defenders:[]};d.set(key,gym);}
     ensureNpcGym(gym,now);if(c.type==='gymDefend')placeGymDefender(x,gym,c.id,id,now);else{const b=makeGymBattle(x,gym,c.ids,id,now);d.set(bk(id),b);g.battle=id;}break;
    }
    case 'coinBuy':idle();buyCoinOffer(x,c.offer,now);break;
    case 'profile':check(typeof c.name==='string'&&/^[\p{L}\p{N} _-]{2,18}$/u.test(c.name),'Gebruik 2 tot 18 letters of cijfers.');if(c.avatar!==undefined){check(['fern','amber','tidal'].includes(c.avatar as string),'Kies een ranger.');x.avatar=c.avatar as 'fern'|'amber'|'tidal';}if(c.outfit!==undefined){check(isOutfit(c.outfit),'Kies een kleur.');x.outfit=c.outfit;}if(c.starter!==undefined){check((STARTER_PARTNERS as readonly unknown[]).includes(c.starter),'Kies een eerste maatje.');if(!x.onboarded&&!x.specimens.some(s=>s.source==='partner'))this.givePartner(x,c.starter as string,now);}x.name=c.name;x.onboarded=true;break;
    case 'settings':for(const k of ['sound','reducedMotion','largeText'] as const){check(typeof c[k]==='boolean','Ongeldige instelling.');x.settings[k]=c[k] as boolean;}if(c.music!==undefined){check(typeof c.music==='boolean','Ongeldige muziekinstelling.');x.settings.music=c.music;}for(const k of ['volume','sfxVolume'] as const)if(c[k]!==undefined){check(typeof c[k]==='number'&&Number.isFinite(c[k])&&c[k]>=0&&c[k]<=1,'Kies een volume tussen 0 en 100%.');x.settings[k]=c[k] as number;}if(c.graphics!==undefined){check(['low','normal','high'].includes(c.graphics as string),'Kies lage, normale of hoge kwaliteit.');x.settings.graphics=c.graphics as 'low'|'normal'|'high';}break;
    case 'worldLocate':idle();if(locate(x,validFix(c.fix,now),secret,now,habitat)===false)break;x.walking!.siteSource=habitat?.sites&&habitat.sites.available!==false?'osm':'unavailable';x.walking!.posts=habitat?.sites?.posts??[];x.walking!.mapSites=habitat?.sites?.map??[];x.walking!.routes=habitat?.sites?.routes??[];const priorWalk=f.walk?.meters??0,priorDayWalk=f.walk?.dayMeters??0;recordWalk(x,now);mergeGPSWalk(x,priorWalk,priorDayWalk,now);advanceRoute(x,now);advanceFieldActivities(x,now,habitat);this.auto(x,now,secret);if((g.auto.awayCredit??0)>=1000)this.awayCatch(x,0,now,secret);if(x.buddy&&x.field!.walk){const b=ownedGo(x,x.buddy),meters=x.field!.walk!.meters,required=buddyDistance(b.species),steps=Math.floor((meters-g.buddyMeters)/required);if(steps>0){const key=family(b.species);g.candy[key]=(g.candy[key]??0)+steps;g.buddyMeters+=steps*required;}}break;
    case 'adventureSync':{idle();const priorHealthWalk=f.walk?.meters??0;syncAdventure(x,c.snapshot,now);this.awayCatch(x,Math.max(0,(f.walk?.meters??0)-priorHealthWalk),now,secret);if(x.buddy&&f.walk){const b=ownedGo(x,x.buddy),required=buddyDistance(b.species),steps=Math.floor((f.walk.meters-g.buddyMeters)/required);if(steps>0){const key=family(b.species);g.candy[key]=(g.candy[key]??0)+steps;g.buddyMeters+=steps*required;}}break;}
    case 'worldEncounter':{idle();if(x.walking?.spawns.find(s=>s.id===c.spawn)?.source!=='raid')requireFieldLocation(x.walking,now);encounterWild(x,c.spawn,secret,now);const s=x.walking!.spawns.find(s=>s.id===c.spawn)!;markGoSeen(x,s.species,now);f.encounter!.cp=stats({...x.specimens[0],species:s.species},rollGoBug(s.species,wildSeed(x.walking!,s)+':go:'+s.id,s.boss)).cp;break;}
    case 'worldFocus':{idle();requireFieldLocation(x.walking,now);const e=f.encounter;check(e&&e.id===c.encounter,'Open deze bug opnieuw.');check(x.walking!.spawns.some(s=>s.id===e.spawn&&s.expiresAt>now&&!x.walking!.caught.includes(s.id)),'Deze bug is verdwenen.');e.focus={id,at:now+800};break;}
    case 'worldCast':{idle();const raidCast=x.walking?.spawns.find(s=>s.id===f.encounter?.spawn)?.source==='raid';if(!raidCast)requireFieldLocation(x.walking,now);check(raidCast||c.net!=='basic'||f.inventory.basic>0,'Je standaardnetten zijn op.');const bait=f.encounter?.bait??c.bait as string|null;castNet(x,c,id,now);if(c.net==='basic'&&!raidCast)f.inventory.basic--;if(f.lastCast?.outcome==='caught'){const spawn=x.walking!.spawns.find(s=>s.id===f.lastCast!.spawn)!,priorXP=ensureTrainer(x).xp,priorDust=g.dust,held=awardGoCatch(x,x.specimens.at(-1)!,wildSeed(x.walking!,spawn)+':go:'+f.lastCast.spawn,bait,f.lastCast.grade,f.lastCast.curved,spawn.boss);if(streakBonus(f.lastCast.streak))grantXP(x,streakBonus(f.lastCast.streak));awardGoCatchCard(x,x.specimens.at(-1)!,f.lastCast.spawn,now);awardCocoon(x,secret,now);f.lastCast.xp=ensureTrainer(x).xp-priorXP;if(held)f.lastCast.held=held;f.lastCast.nectar=g.dust-priorDust;f.lastCast.candy=goCatchRewards(f.lastCast.species,bait).candy;f.lastCast.cp=stats(x.specimens.at(-1)!).cp;x.walking!.lastCatch!.nectar=f.lastCast.nectar;this.note(x,'catch','catch:'+f.lastCast.spawn,x.specimens.at(-1)!,now,{method:'manual',dust:f.lastCast.nectar,xp:f.lastCast.xp});}break;}
    case 'fieldLure':idle();requireFieldLocation(x.walking,now);startFieldLure(x,id,secret,now);break;
    case 'fieldSupply':check(!f.daily.supply,'De dagbox is al geopend.');f.daily.supply=true;f.inventory.basic+=20;f.inventory.blue+=5;f.inventory.pollen+=2;f.inventory.fruit+=3;break;
    case 'fieldTask':claimGoDaily(x,c.task);if(c.task==='catch')rng(secret)()<.5?g.fastTMs++:g.chargedTMs++;break;
    case 'poiSpin':idle();spinPost(x,c.poi,secret,now);break;
    case 'routeStart':idle();startRoute(x,c.route,now);break;
    case 'routePause':idle();pauseRoute(x);break;
    case 'routeResume':idle();resumeRoute(x,now);break;
    case 'routeFinish':idle();finishRoute(x,now);break;
    case 'routeCancel':idle();cancelRoute(x);break;
    case 'favorite':{const s=ownedGo(x,c.id);s.favorite=!s.favorite;break;}
    case 'buddy':idle();availableGo(x,c.id);ownedGo(x,c.id);if(x.buddy!==c.id){x.buddy=c.id as string;g.buddyMeters=f.walk?.meters??0;}break;
    case 'goRename':idle();renameGo(x,c.id,c.name);break;
    case 'goPower':{idle();const before=g.dust;powerUp(x,c.id,c.steps);this.note(x,'power','power:'+c.commandId,ownedGo(x,c.id),now,{dust:g.dust-before});break;}
    case 'goSecond':{idle();const before=g.dust;secondAttack(x,c.id,secret);this.note(x,'move','move:'+c.commandId,ownedGo(x,c.id),now,{dust:g.dust-before});break;}
    case 'postResearch':idle();finishPostResearch(x,c.id,c.discard,now);break;
    case 'teamPreset':idle();teamPreset(x,c.action,c.league,c.slot,c.ids);break;
    case 'goTM':idle();teachMove(x,c.id,c.slot,secret);this.note(x,'move','move:'+c.commandId,ownedGo(x,c.id),now);break;
    case 'goEquip':idle();equipGo(x,c.id,c.item);this.note(x,'equip','equip:'+c.commandId,ownedGo(x,c.id),now);break;
    case 'goTransfer':{idle();const bug=ownedGo(x,c.id);transferGo(x,c.id);this.note(x,'transfer','transfer:'+c.commandId,bug,now);break;}
    case 'goTransferMany':{idle();const selected=x.specimens.filter(s=>Array.isArray(c.ids)&&c.ids.includes(s.id));transferManyGo(x,c.ids);for(const bug of selected)this.note(x,'transfer','transfer:'+c.commandId+':'+bug.id,bug,now);break;}
    case 'trainerClaim':claimTrainer(x);break;
    case 'goEvolve':{idle();const fromSpecies=ownedGo(x,c.id).species;evolveGo(x,c.id,secret,now);this.note(x,'evolve','evolve:'+c.commandId,ownedGo(x,c.id),now,{fromSpecies});break;}
    case 'goTeam':idle();teamGo(x,c.ids,c.league);break;
    case 'goBoss':{idle();const post=c.post===undefined?undefined:x.walking?.posts?.find(s=>s.id===c.post);check(c.post===undefined||post,'Kies een gympost in de buurt.');check(!post||gymSites(x.walking!.posts??[]).some(g=>g.postId===post.id),'Deze post is geen gym.');check(c.ids===undefined||post,'Kies een kaartbaas voor een apart team.');const b=makeBossBattle(x,c.difficulty as BossDifficulty,id,now,post,secret,c.ids);d.set(bk(id),b);g.battle=id;break;}
    case 'dailyChallenge':{idle();const b=makeDailyChallengeBattle(x,id,now,c.practice===undefined?false:c.practice as boolean);d.set(bk(id),b);g.battle=id;break;}
    case 'cocoonStart':idle();startCocoon(x,c.id,now,c.incubator);break;
    case 'cocoonClaim':{idle();const before={dust:g.dust,xp:g.trainer!.xp};hatchCocoon(x,now,c.id);this.note(x,'hatch','hatch:'+g.cocoons!.lastHatch!.id, x.specimens.at(-1)!,now,{dust:g.dust-before.dust,xp:g.trainer!.xp-before.xp});break;}
    case 'echoSave':{idle();check(linked||this.mode==='local','Koppel je account om je verdediging te bewaren.',403);const defense=saveEchoDefense(x,now);d.set('v2EchoDefenses:'+uid,defense);d.set('v2EchoDefenses:'+uid+'-'+g.league,defense);break;}
    case 'echoQueue':{idle();check(echoDefense,'Deze tegenstander is niet beschikbaar.');const b=makeEchoBattle(x,echoDefense,id,now);d.set(bk(id),b);g.battle=id;break;}
    case 'goAuto':check(typeof c.enabled==='boolean','Kies aan of uit.');g.auto.enabled=c.enabled as boolean;g.auto.moving=0;g.auto.status=c.enabled?'waiting':'off';g.motion=x.walking?{fix:{...x.walking.fix},at:now}:undefined;break;
    case 'goQueue':idle();check(linked||this.mode==='local','Koppel je account voor Ranked.',403);check((g.ratedCount??0)<25,'Vandaag zijn alle 25 Ranked-gevechten gespeeld.');teamGo(x,g.team,g.league);g.queue={league:g.league,at:now,until:now+120000};d.set(tk(uid),{uid,league:g.league,rating:g.rating,at:now,until:now+120000,status:'waiting'} satisfies Ticket);break;
    case 'goCancel':check(!g.battle,'Je tegenstander is al gevonden.');g.queue=null;d.set(tk(uid),{status:'cancelled'});break;
    case 'goTrain':{idle();teamGo(x,g.team,g.league);const b=makeGoBattle(x,this.npc(x,id,now),id,now,false,true);d.set(bk(id),b);g.battle=id;break;}
    case 'goInvite':idle();teamGo(x,g.team,g.league);d.set('v2GoInvites:'+x.friendCode,{uid,league:g.league,until:now+300000});break;
    case 'goJoin':{idle();const invite=document<{uid:string;league:League;until:number}>(d,'v2GoInvites:'+c.code);check(invite&&invite.uid===otherUid&&invite.until>now,'Deze uitnodiging is verlopen.');const other=this.get(d,otherUid!,now);check(!other.go!.battle&&!other.go!.queue,'Deze speler is al bezig.');teamGo(x,g.team,invite.league);teamGo(other,other.go!.team,invite.league);const b=makeGoBattle(other,x,id,now,false);d.set(bk(id),b);g.battle=id;other.go!.battle=id;other.revision++;invite.until=0;break;}
    case 'raidPass':claimFreePass(ensureRaids(g,now),now);break;
    case 'raidJoin':{idle();check(typeof c.remote==='boolean','Kies lokaal of op afstand.');const rg=ensureRaids(g,now),raidId=c.raid as string;
     if(rg.lobby){const old=document<RaidLobby>(d,lk(rg.lobby));if(!old||old.status==='won'||old.status==='failed'||!old.members.some(m=>m.uid===uid))rg.lobby=null;}
     let doc=document<RaidDoc>(d,rk(raidId));
     if(c.remote){check(doc,'Deze zwerm is niet gevonden.');check((document<{items:RaidInvite[]}>(d,ik(uid))?.items??[]).some(i=>i.raidId===raidId&&i.endsAt>now),'Op afstand meedoen kan alleen met een uitnodiging van een vriend.');}
     else{const site=this.localRaidSite(x,raidId,now,raidToken!);doc??={raid:raidAt(site,now,raidToken!)!,open:0,invited:{}};d.set(rk(raidId),doc);}
     const need=RAID_TIERS[doc.raid.tier].trainer;check(trainerLevel(g.trainer!.xp)>=need,'Trainerlevel '+need+' nodig.');
     let l=document<RaidLobby>(d,lk(raidId+'#'+doc.open));
     if(!l||!lobbyOpen(l,now)){const n=doc.open+1;check(d.has(lk(raidId+'#'+n)),'De zwerm is veranderd. Probeer opnieuw.',409);l=openLobby(doc.raid,n,now);doc.open=n;d.set(lk(l.id),l);}
     joinLobby(l,rg,{uid,name:x.name,remote:c.remote,joinedAt:now},now);break;}
    case 'raidLeave':{const rg=ensureRaids(g,now);check(rg.lobby,'Je zit niet in een zwerm.');const l=document<RaidLobby>(d,lk(rg.lobby));if(l&&l.status==='lobby')leaveLobby(l,rg,uid,now);else{check(!l||l.status!=='fighting','Het gevecht is al begonnen.');rg.lobby=null;}break;}
    case 'raidInvite':{const rg=ensureRaids(g,now),raidId=c.raid as string;let doc=document<RaidDoc>(d,rk(raidId));
     const member=!!doc&&!!rg.lobby&&rg.lobby.startsWith(raidId+'#')&&!!document<RaidLobby>(d,lk(rg.lobby))?.members.some(m=>m.uid===uid);
     if(!member){const site=this.localRaidSite(x,raidId,now,raidToken!);doc??={raid:raidAt(site,now,raidToken!)!,open:0,invited:{}};d.set(rk(raidId),doc);}
     const raidDoc=doc!,friends=inviteFriends.filter(f=>{const pair=document<FriendPair>(d,'v2FriendPairs:'+[uid,f].sort().join('_'));return !!pair&&pair.accepted&&!pair.removed&&pair.users.includes(uid)&&pair.users.includes(f);});
     const issue=inviteIssue(rg,raidDoc.raid,inviteFriends,friends,raidDoc.invited[uid]??0,now);check(!issue,issue??'');
     const invite=raidInvite(raidDoc.raid,{uid,name:x.name},now);for(const f of inviteFriends){const inbox=document<{items:RaidInvite[]}>(d,ik(f))??{items:[]};inbox.items=addInvite(inbox.items,invite,now);d.set(ik(f),inbox);const friend=document<PlayerV2>(d,pk(f));if(friend?.go)ensureRaids(friend.go,now).invitedAt=now;}
     raidDoc.invited[uid]=(raidDoc.invited[uid]??0)+inviteFriends.length;rg.invites+=inviteFriends.length;this.inboxCache.clear();break;}
    case 'raidFight':{idle();const rg=ensureRaids(g,now),l=document<RaidLobby>(d,lk(rg.lobby!));check(l,'Deze zwerm bestaat niet meer.');startLobby(l,now);check(l.status!=='lobby','De lobby wacht nog op spelers.');
     const dealt=document<DamageDoc>(d,dk(l.id,uid))?.damage??0,b=makeRaidBattle(x,l,c.ids,dealt,raidOthers,id,now);d.set(bk(id),b);d.set(dk(l.id,uid),{uid,damage:dealt});g.battle=id;break;}
    case 'raidClaim':{const l=document<RaidLobby>(d,lk(c.lobby as string))!,damage=Object.fromEntries(l.members.map(m=>[m.uid,document<DamageDoc>(d,dk(l.id,m.uid))?.damage??0])) as Record<string,number>;resolveLobby(l,damage,now);
     check(l.status==='won'||l.status==='failed','Het zwermgevecht loopt nog.');const rg=ensureRaids(g,now),reward=claimRaid(l,rg,uid,damage,raidFriends);if(rg.lobby===l.id)rg.lobby=null;
     if(reward){g.dust+=reward.dust;grantXP(x,reward.xp);if(x.walking)x.walking.spawns.push({id:'raid-'+l.id.replace(/[^\w-]/g,'-'),species:l.species,lat:x.walking.fix.lat,lng:x.walking.fix.lng,expiresAt:now+30*60000,source:'raid',boss:{seed:secret,level:reward.catchLevel},raid:{nets:reward.nets}});}break;}
    case 'goAct':{check(g.battle,'Je hebt geen gevecht.');const b=document<GoBattle>(d,bk(g.battle));check(b&&b.players.includes(uid),'Dit gevecht is niet van jou.',403);this.checkBattleKeys(d,b);actGoBattle(b,b.players.indexOf(uid) as Side,c.action,c.value,now);this.settle(d,b,now);break;}
    case 'goClose':{check(g.battle&&document<GoBattle>(d,bk(g.battle))?.phase==='finished','Rond het gevecht eerst af.');g.battle=null;break;}
    case 'tradeStart':case 'tradeOffer':case 'tradeConfirm':case 'tradeCancel':{
     idle();const pair=document<FriendPair>(d,'v2FriendPairs:'+c.pair);check(pair&&pair.users.includes(uid),'Deze vriendschap bestaat niet.',403);const players=pair.users.map(id=>this.get(d,id,now)) as [PlayerV2,PlayerV2],key='v2GoTrades:'+c.pair,trade=document<GoTrade>(d,key);
     if(c.type==='tradeStart'){check(!trade||trade.status!=='offering'||trade.expiresAt<=now,'Er staat al een ruil klaar. Open die ruil.');d.set(key,startGoTrade(players,pair,id,secret,now));}
     else{check(trade,'Start eerst een ruil.');if(c.type==='tradeOffer')offerGoTrade(trade,players,pair,uid,c.id,c.tradeRevision,now);else if(c.type==='tradeCancel')cancelGoTrade(trade,uid,c.tradeRevision,now);else if(confirmGoTrade(trade,players,pair,uid,c.tradeRevision,c.special,now)){for(let side=0;side<2;side++){const player=players[side],received=trade.offers[1-side]!.bug;this.note(player,'trade','trade:'+trade.id,received,now,{opponent:players[1-side].name,dust:-trade.terms!.dust});if(player.uid!==uid)player.revision++;}}}
     break;
    }
    case 'friendRequest':{const key='v2FriendPairs:'+([uid,otherUid!].sort().join('_')),old=document<FriendPair>(d,key),other=this.get(d,otherUid!,now);if(old&&!old.removed){check(!old.accepted&&old.requestedBy!==uid,'Dit verzoek bestaat al.');old.accepted=true;}else{const users=[uid,otherUid!].sort() as [string,string];d.set(key,{id:users.join('_'),users,names:users.map(id=>id===uid?x.name:other.name) as [string,string],accepted:false,requestedBy:uid,points:old?.points??0,lastDay:old?.lastDay??'',gifts:old?.gifts??[null,null]} satisfies FriendPair);}break;}
    case 'giftSend':sendGoGift(x,document<FriendPair>(d,'v2FriendPairs:'+c.pair),c.card,id,now);break;
    case 'giftOpen':openGoGift(x,document<FriendPair>(d,'v2FriendPairs:'+c.pair),now);break;
    case 'friendAccept':case 'friendRemove':{const pair=document<FriendPair>(d,'v2FriendPairs:'+c.pair);check(pair&&pair.users.includes(uid)&&!pair.removed,'Deze vriendschap bestaat niet.',403);if(c.type==='friendRemove')pair.removed=true;else{check(pair.requestedBy!==uid,'Alleen de ontvanger kan accepteren.');pair.accepted=true;}break;}
   }
    trackWeeklyWalk(x,now,secret);
    if(AUTO_DEFENSE_COMMANDS.has(c.type)&&(linked||this.mode==='local')&&!competitionTeamIssue(x)){const defense=saveEchoDefense(x,now);d.set('v2EchoDefenses:'+uid+'-'+g.league,defense);}
    x.revision++;d.set(receipt,{fingerprint,at:now,type:c.type});return this.commandSnapshot(d,x);
  });if(SOCIAL_COMMANDS.has(c.type))this.socialCache.clear();if(c.type.startsWith('raid'))this.raidDamageCache.clear();if(snapshot?.battle)this.rememberBattleKeys(snapshot.battle);return snapshot?this.view(uid,snapshot.player,snapshot.battle,linked):this.state(uid,linked);
 }
 private async matchmake(uid:string){const now=this.clock(),mine=await this.store.run([tk(uid)],d=>document<Ticket>(d,tk(uid)));if(!mine||mine.status!=='waiting')return;
  if(mine.until<=now){await this.store.run([pk(uid),tk(uid)],d=>{const t=document<Ticket>(d,tk(uid));if(t?.status==='waiting'){t.status='expired';const p=this.get(d,uid,now);p.go!.queue=null;p.revision++;}});return;}
  const pool=await this.query<Ticket>('v2GoTickets',[{field:'status',op:'==',value:'waiting'}]),band=100+Math.floor((now-mine.at)/15000)*50,candidate=pool.filter(t=>t.uid!==uid&&t.league===mine.league&&t.until>now&&Math.abs(t.rating-mine.rating)<=Math.min(400,band,100+Math.floor((now-t.at)/15000)*50)).sort((a,b)=>Math.abs(a.rating-mine.rating)-Math.abs(b.rating-mine.rating)||a.at-b.at)[0];if(!candidate)return;
  const id=randomBytes(16).toString('hex');await this.store.run([pk(uid),pk(candidate.uid),tk(uid),tk(candidate.uid),bk(id)],d=>{const a=document<Ticket>(d,tk(uid)),b=document<Ticket>(d,tk(candidate.uid));if(!a||!b||a.status!=='waiting'||b.status!=='waiting'||a.until<=now||b.until<=now)return;const p=this.get(d,uid,now),q=this.get(d,candidate.uid,now);if(p.go!.battle||q.go!.battle||!p.go!.queue||!q.go!.queue)return;const battle=makeGoBattle(p,q,id,now,true);d.set(bk(id),battle);a.status=b.status='matched';for(const x of [p,q]){x.go!.queue=null;x.go!.battle=id;x.revision++;}});
 }
 async advanceDue(){const battles=await this.query<GoBattle>('v2GoBattles',[{field:'settled',op:'==',value:false}]);for(const b of battles)await this.advance(b.id);return {battles:battles.length};}
}
