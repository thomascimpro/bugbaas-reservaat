import {awardGoCatchCard,sendGoGift,openGoGift} from '../game/goGiftsV2';
import {appendGoJournal,publicGoJournal} from '../game/goJournalV2';
import type {GoJournalEntry} from '../game/goJournalV2';
import {startGoTrade,offerGoTrade,confirmGoTrade,cancelGoTrade,publicGoTrade} from '../game/goTradeV2';
import type {GoTrade} from '../game/goTradeV2';
import {ensureEcho,saveEchoDefense,chooseEchoMatch,makeEchoBattle,settleEcho} from '../game/echoArenaV2';
import type {EchoDefense} from '../game/echoArenaV2';
import {ensureCocoons,awardCocoon,startCocoon,hatchCocoon} from '../game/goCocoonsV2';
import {ensureBosses,makeBossBattle,settleBoss} from '../game/goBossV2';
import type {BossDifficulty} from '../game/goBossV2';
import {claimGoDaily} from '../game/dailyResearchV2';
import {grantXP,claimTrainer,ensureTrainer} from '../game/trainerV2';
import {spinPost,startRoute,advanceRoute,pauseRoute,resumeRoute,finishRoute,cancelRoute} from '../game/worldSitesV2';
import {unknownHabitat} from '../game/habitatsV2';
import type {HabitatContext} from '../game/habitatsV2';
import type {Fix} from '../game/walkingV2';
import {createHash,randomBytes} from 'node:crypto';
import {freshV2,dayV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField,encounterWild,castNet,claimFieldTask,catchChance} from '../game/fieldV2';
import {locate,catchWild,distance,CATCH_RADIUS,validFix,requireFieldLocation,GPS_MAX_AGE} from '../game/walkingV2';
import {recordWalk} from '../game/walkingRewardsV2';
import {startFieldLure,advanceFieldActivities} from '../game/fieldActivitiesV2';
import {ensureGo,markGoSeen,eligible,ownedGo,renameGo,powerUp,secondAttack,teachMove,equipGo,teamGo,transferGo,transferManyGo,evolveGo,awardGoCatch,family,rollGoBug,stats,LEAGUES,buddyDistance} from '../game/goV2';
import type {League} from '../game/goV2';
import {makeGoBattle,advanceGoBattle,actGoBattle} from '../game/goBattleV2';
import type {GoBattle,GoBattleView} from '../game/goBattleV2';
import {rng} from '../game/catalogV2';
import {checkV2 as check} from '../game/shopV2';
import type {CommandV2,PlayerV2,GameViewV2,FriendPair,Side,Specimen} from '../game/typesV2';
import type {Documents,Store} from './store';
import {document} from './store';
const pk=(uid:string)=>'v2Players:'+uid,bk=(id:string)=>'v2GoBattles:'+id,tk=(uid:string)=>'v2GoTickets:'+uid;
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const FIELDS:Record<string,string[]>={profile:['name'],settings:['sound','reducedMotion','largeText'],favorite:['id'],buddy:['id'],worldLocate:['fix'],worldEncounter:['spawn'],worldFocus:['encounter'],worldCast:['encounter','net','bait','trace','rhythm'],fieldLure:[],fieldSupply:[],fieldTask:['task'],poiSpin:['poi'],routeStart:['route'],routePause:[],routeResume:[],routeFinish:[],routeCancel:[],goPower:['id'],goSecond:['id'],goTM:['id','slot'],goEquip:['id','item'],goTransfer:['id'],goTransferMany:['ids'],trainerClaim:[],goEvolve:['id'],goTeam:['ids','league'],goAuto:['enabled'],goQueue:[],goCancel:[],goTrain:[],goInvite:[],goJoin:['code'],goAct:['action','value'],goClose:[],friendRequest:['code'],friendAccept:['pair'],friendRemove:['pair'],giftSend:['pair','card'],giftOpen:['pair'],echoSave:[],echoQueue:[],cocoonStart:['id'],cocoonClaim:[],goBoss:['difficulty'],goRename:['id','name'],tradeStart:['pair'],tradeOffer:['pair','id','tradeRevision'],tradeConfirm:['pair','tradeRevision','special'],tradeCancel:['pair','tradeRevision']};
type Ticket={uid:string;league:League;rating:number;at:number;until:number;status:'waiting'|'matched'|'cancelled'|'expired'};
export function parseGo(raw:unknown):CommandV2{check(raw&&typeof raw==='object'&&!Array.isArray(raw),'Een actie is vereist.');const c=raw as CommandV2;check(typeof c.type==='string'&&Object.hasOwn(FIELDS,c.type),'Deze oude spelmodus is verwijderd. Vernieuw de game.');check(typeof c.commandId==='string'&&/^[\w-]{16,80}$/.test(c.commandId)&&Number.isSafeInteger(c.expectedRevision)&&c.expectedRevision>=0,'Ongeldige spelactie.');check(Object.keys(c).every(k=>['type','commandId','expectedRevision',...FIELDS[c.type]].includes(k)),'De server bepaalt stats, schade en beloningen.');return c;}
export class GoServiceV2{
 constructor(public store:Store,public mode:'local'|'cloud',public clock=Date.now,public environment:(fix:Fix,now:number)=>Promise<HabitatContext>=async(_fix,now)=>unknownHabitat(now)){}
 private get(d:Documents,uid:string,now:number){let p=document<PlayerV2>(d,pk(uid));if(!p){const code=BigInt('0x'+hash(uid).slice(0,12)).toString(32).toUpperCase().padStart(10,'0').slice(-8);p=freshV2(uid,code,now);d.set(pk(uid),p);}ensureAdventure(p,now);ensureField(p,now);ensureGo(p,now);ensureEcho(p,now);ensureBosses(p,now);ensureCocoons(p,randomBytes(24).toString('hex'),now);if(p.go!.ratedDay!==dayV2(now)){p.go!.ratedDay=dayV2(now);p.go!.ratedCount=0;}return p;}
 async ensure(uid:string){const p=await this.store.run([pk(uid)],d=>this.get(d,uid,this.clock()));await this.store.run(['v2Codes:'+p.friendCode],d=>{const old=document<{uid:string}>(d,'v2Codes:'+p.friendCode);check(!old||old.uid===uid,'Spelercode conflicteert.',409);d.set('v2Codes:'+p.friendCode,{uid});});return p;}
 private query<T>(kind:string,filters:Parameters<NonNullable<Store['query']>>[1]=[],order?:{field:string;descending?:boolean},limit=100){check(this.store.query,'Opslag niet beschikbaar.',503);return this.store.query<T>(kind,filters,order,limit);}
 private note(p:PlayerV2,kind:GoJournalEntry['kind'],id:string,s:Specimen,at:number,extra:Partial<GoJournalEntry>={}){appendGoJournal(p,{id,kind,at,species:s.species,specimenId:s.id,shiny:s.shiny,cp:s.go?stats(s).cp:undefined,...extra});}
 private settle(d:Documents,b:GoBattle,now:number){
  if(b.echo){
   const p=this.get(d,b.players[0],now),reward=settleEcho(p,b,now);if(!reward)return;
   const g=p.go!,beforeXP=g.trainer!.xp;g.dust+=reward.dust;grantXP(p,reward.xp);b.rewards=[{dust:reward.dust,xp:g.trainer!.xp-beforeXP,fastTMs:0,chargedTMs:0}];this.noteBattle(p,b,0,now);
   g.history.unshift({id:b.id,opponent:b.names[1]+' · Echo',result:b.winner===null?'Gelijkspel':b.winner===0?'Gewonnen':'Verloren',delta:0,at:now});g.history=g.history.slice(0,30);p.revision++;
   if(reward.rewarded){d.set('v2EchoRanks:'+p.uid,{uid:p.uid,name:p.name,rating:g.echo!.rating,wins:g.echo!.wins});const ownDefense=document<EchoDefense>(d,'v2EchoDefenses:'+p.uid);if(ownDefense)ownDefense.rating=g.echo!.rating;}return;
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
 private noteBattle(p:PlayerV2,b:GoBattle,side:Side,at:number){const reward=b.rewards?.[side];appendGoJournal(p,{id:'battle:'+b.id,kind:b.echo?'echo':b.boss?'boss':'battle',at,result:b.winner===null?'draw':b.winner===side?'win':'loss',opponent:b.names[1-side],dust:reward?.dust??0,xp:reward?.xp??0,method:b.echo||b.boss?undefined:b.ranked?'ranked':b.training?'training':'casual'});}
 private async advance(id:string){const snapshot=await this.store.run([bk(id)],d=>document<GoBattle>(d,bk(id)));if(!snapshot)return;const ids=snapshot.players.slice(0,snapshot.training?1:2),keys=[bk(id),...ids.map(pk),...ids.flatMap(id=>['v2GoRanks:'+id,'v2EchoRanks:'+id,'v2EchoDefenses:'+id])];await this.store.run(keys,d=>{const b=document<GoBattle>(d,bk(id));if(!b)return;advanceGoBattle(b,this.clock());this.settle(d,b,this.clock());});}
 async state(uid:string,linked=false):Promise<GameViewV2>{let p=await this.ensure(uid);if(p.go!.queue)await this.matchmake(uid);p=await this.store.run([pk(uid)],d=>this.get(d,uid,this.clock()));if(p.go!.battle)await this.advance(p.go!.battle);p=await this.store.run([pk(uid)],d=>this.get(d,uid,this.clock()));
  const battle=p.go!.battle?await this.store.run([bk(p.go!.battle)],d=>document<GoBattle>(d,bk(p.go!.battle!))):null,publicPlayer=structuredClone(p);
  if(publicPlayer.go?.cocoons)for(const item of publicPlayer.go.cocoons.items)delete item.hatchSeed;
  if(publicPlayer.walking)delete publicPlayer.walking.seed;if(publicPlayer.field?.lure)delete publicPlayer.field.lure.seed;if(publicPlayer.field?.cocoon)delete publicPlayer.field.cocoon.seed;
  if(publicPlayer.go!.auto.enabled&&(!publicPlayer.walking||this.clock()-Math.min(publicPlayer.walking.at,publicPlayer.walking.fix.timestamp??publicPlayer.walking.at)>=GPS_MAX_AGE))publicPlayer.go!.auto.status='gps';
  // Keep old records recoverable in storage, but do not send old modes or reward seeds to the game.
  publicPlayer.safari=null;publicPlayer.match=null;publicPlayer.ticket=false;publicPlayer.arenaRun=null;
  if(publicPlayer.adventure){publicPlayer.adventure.run=null;publicPlayer.adventure.expedition=null;}
  const friends=await this.query<FriendPair>('v2FriendPairs',[{field:'users',op:'array-contains',value:uid}]),ranks=await this.query<{uid:string;name:string;rating:number;wins:number}>('v2GoRanks',[],{field:'rating',descending:true},30);
  const trades=await this.query<GoTrade>('v2GoTrades',[{field:'users',op:'array-contains',value:uid}]);publicPlayer.go!.journal=publicGoJournal(publicPlayer.go!.journal);
  const echoRanks=await this.query<{uid:string;name:string;rating:number;wins:number}>('v2EchoRanks',[],{field:'rating',descending:true},30);
  const visible=battle?structuredClone(battle) as GoBattleView:null;if(visible){check(visible.players.includes(uid),'Dit gevecht is niet van jou.',403);visible.side=visible.players.indexOf(uid) as Side;const other=(1-visible.side) as Side;visible.teams[other].forEach((f,i)=>{f.energy=0;f.attack=0;f.defense=0;f.readyAt=0;f.go={level:0,iv:[0,0,0],fast:'bite',charged:[],item:null};if(i!==visible.active[other]){f.id='opponent-'+i;f.species='unknown';f.cp=0;f.shiny=false;f.hp=f.hp>0?1:0;f.maxHP=1;}else{f.hp=Math.ceil(f.hp/f.maxHP*100);f.maxHP=100;}});}
  return {goTrades:trades.map(t=>publicGoTrade(t,this.clock())),echoLeaderboard:echoRanks.map(r=>({name:r.name,rating:r.rating,wins:r.wins,me:r.uid===uid})),player:publicPlayer,now:this.clock(),mode:this.mode,linked:linked||this.mode==='local',match:null,ticket:null,friends:friends.filter(f=>!f.removed),leaderboard:ranks.map(r=>({name:r.name,rating:r.rating,wins:r.wins,me:r.uid===uid})),goBattle:visible};
 }
 private auto(p:PlayerV2,now:number,secret:string){const g=p.go!,a=g.auto,w=p.walking;if(!w)return;const previous=g.motion;g.motion={fix:{...w.fix},at:now};if(!a.enabled){a.status='off';return;}if(w.blockedUntil&&w.blockedUntil>now){a.status='too-fast';a.moving=0;return;}if(!previous||w.fix.accuracy>25||previous.fix.accuracy>25){a.status='gps';a.moving=0;return;}
  const seconds=(now-previous.at)/1000,meters=distance(previous.fix,w.fix),speed=meters/seconds;if(seconds<5||seconds>60||meters<Math.max(12,w.fix.accuracy,previous.fix.accuracy)||speed<.7){a.status='waiting';a.moving=0;return;}if(speed>7){a.status='too-fast';a.moving=0;return;}a.status='moving';a.moving++;if(a.moving<2||now-a.lastAt<30000)return;const f=p.field!;if(f.inventory.basic<1){a.status='empty';return;}a.attempted=a.attempted.filter(id=>w.spawns.some(s=>s.id===id&&s.expiresAt>now));const s=w.spawns.find(s=>s.expiresAt>now&&!w.caught.includes(s.id)&&!a.attempted.includes(s.id)&&g.dex?.includes(s.species)&&f.encounter?.spawn!==s.id&&distance(w.fix,s)<=CATCH_RADIUS);if(!s)return;
  a.lastAt=now;a.attempted.push(s.id);f.inventory.basic--;const caught=rng(secret+':auto')()<catchChance(s.species,'basic',null);if(caught){catchWild(p,s.id,now);const bug=p.specimens.at(-1)!,priorDust=g.dust,priorXP=g.trainer!.xp;awardGoCatch(p,bug,w.seed+':go:'+s.id);f.total.catches++;f.daily.catches++;if(!f.daily.species.includes(s.species))f.daily.species.push(s.species);if(s.source==='lure'&&f.lure)f.lure.caught++;awardGoCatchCard(p,bug,s.id,now);awardCocoon(p,secret,now);w.lastCatch!.nectar=g.dust-priorDust;this.note(p,'catch','catch:'+s.id,bug,now,{method:'auto',dust:g.dust-priorDust,xp:g.trainer!.xp-priorXP});}else{w.caught.push(s.id);appendGoJournal(p,{id:'autoMiss:'+s.id,kind:'autoMiss',at:now,species:s.species,method:'auto'});}a.last={species:s.species,caught,at:now};
 }
 private npc(p:PlayerV2,id:string,now:number){const q=freshV2('training-'+p.uid,'TRAINING',now);ensureGo(q,now);q.name='Veldwachter';q.go!.league=p.go!.league;const average=p.go!.team.map(id=>ownedGo(p,id).go!.level).reduce((a,b)=>a+b,0)/3;q.specimens=['ant','beetle','moth'].map((species,i)=>{const s={id:'trainer-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:now,source:'training',hearts:0,item:null,go:rollGoBug(species,id+i)};s.go.level=Math.min(50,Math.max(1,Math.round(average)));while(stats(s).cp>LEAGUES[q.go!.league].cap&&s.go.level>1)s.go.level-=.5;return s;});q.go!.team=q.specimens.map(s=>s.id);return q;}
 async command(uid:string,raw:unknown,linked=false):Promise<GameViewV2>{
  const c=parseGo(raw),now=this.clock(),secret=randomBytes(24).toString('hex'),id=randomBytes(16).toString('hex'),p=await this.ensure(uid);if(p.go!.battle)await this.advance(p.go!.battle);
  const habitat=c.type==='worldLocate'?await this.environment(validFix(c.fix,now),now):undefined;
  const echoDefense=c.type==='echoQueue'?chooseEchoMatch(p,await this.query<EchoDefense>('v2EchoDefenses',[{field:'league',op:'==',value:p.go!.league}]),now):null;
  const receipt='v2GoReceipts:'+uid+'-'+c.commandId,rate='v2GoRate:'+uid,keys=[pk(uid),receipt,rate,tk(uid)];let otherUid:string|undefined;
  if(c.type==='goJoin'||c.type==='friendRequest'){check(typeof c.code==='string'&&/^[A-Z0-9]{8}$/.test(c.code),'Gebruik een geldige achttekencode.');const entry=await this.store.run(['v2Codes:'+c.code],d=>document<{uid:string}>(d,'v2Codes:'+c.code));check(entry&&entry.uid!==uid,'Deze speler is niet gevonden.');otherUid=entry.uid;keys.push(pk(otherUid),'v2GoInvites:'+c.code,'v2FriendPairs:'+([uid,otherUid].sort().join('_')));}
  if(c.type==='friendAccept'||c.type==='friendRemove'||c.type==='giftSend'||c.type==='giftOpen'){check(typeof c.pair==='string'&&c.pair.length<256,'Kies een vriend.');keys.push('v2FriendPairs:'+c.pair);}
  const trading=['tradeStart','tradeOffer','tradeConfirm','tradeCancel'].includes(c.type);
  if(trading){check(linked||this.mode==='local','Koppel je account om te ruilen.',403);check(typeof c.pair==='string'&&c.pair.length>0&&c.pair.length<256,'Kies een vriend.');const pairKey='v2FriendPairs:'+c.pair,pair=await this.store.run([pairKey],d=>document<FriendPair>(d,pairKey));check(pair&&pair.users.length===2&&pair.users.includes(uid)&&pair.users[0]!==pair.users[1],'Deze vriendschap bestaat niet.',403);keys.push(pairKey,'v2GoTrades:'+c.pair,...pair.users.map(pk));}
  if(c.type==='goInvite')keys.push('v2GoInvites:'+p.friendCode);
  if(c.type==='goTrain'||c.type==='goJoin'||c.type==='echoQueue'||c.type==='goBoss')keys.push(bk(id));
  if(c.type==='echoSave')keys.push('v2EchoDefenses:'+uid);
  if(p.go!.battle){const b=await this.store.run([bk(p.go!.battle)],d=>document<GoBattle>(d,bk(p.go!.battle!)));if(b)keys.push(bk(b.id),...b.players.slice(0,b.training?1:2).flatMap(uid=>[pk(uid),'v2GoRanks:'+uid,'v2EchoRanks:'+uid,'v2EchoDefenses:'+uid]));}
  await this.store.run([...new Set(keys)],d=>{
   const fingerprint=hash(JSON.stringify(c)),old=document<{fingerprint:string}>(d,receipt);if(old){check(old.fingerprint===fingerprint,'Dit actie-ID is al voor iets anders gebruikt.',409);return;}
   const x=this.get(d,uid,now),g=x.go!,f=x.field!;check(x.revision===c.expectedRevision,'Je voortgang is veranderd. Probeer opnieuw.',409);const r=document<{at:number;count:number}>(d,rate)??{at:now,count:0};if(now-r.at>=60000){r.at=now;r.count=0;}check(++r.count<=600,'Even rustig: te veel acties.',429);d.set(rate,r);
   const idle=()=>check(!g.battle&&!g.queue,'Rond je gevecht of zoekopdracht eerst af.');
   switch(c.type){
    case 'profile':check(typeof c.name==='string'&&/^[\p{L}\p{N} _-]{2,18}$/u.test(c.name),'Gebruik 2 tot 18 letters of cijfers.');x.name=c.name;x.onboarded=true;break;
    case 'settings':for(const k of ['sound','reducedMotion','largeText'] as const){check(typeof c[k]==='boolean','Ongeldige instelling.');x.settings[k]=c[k] as boolean;}break;
    case 'worldLocate':idle();if(locate(x,validFix(c.fix,now),secret,now,habitat)===false)break;x.walking!.siteSource=habitat?.sites&&habitat.sites.available!==false?'osm':'unavailable';x.walking!.posts=habitat?.sites?.posts??[];x.walking!.routes=habitat?.sites?.routes??[];recordWalk(x,now);advanceRoute(x,now);advanceFieldActivities(x,now,habitat);this.auto(x,now,secret);if(x.buddy&&x.field!.walk){const b=ownedGo(x,x.buddy),meters=x.field!.walk!.meters,required=buddyDistance(b.species),steps=Math.floor((meters-g.buddyMeters)/required);if(steps>0){const key=family(b.species);g.candy[key]=(g.candy[key]??0)+steps;g.buddyMeters+=steps*required;}}break;
    case 'worldEncounter':{idle();requireFieldLocation(x.walking,now);encounterWild(x,c.spawn,secret,now);const s=x.walking!.spawns.find(s=>s.id===c.spawn)!;markGoSeen(x,s.species,now);f.encounter!.cp=stats({...x.specimens[0],species:s.species},rollGoBug(s.species,x.walking!.seed+':go:'+s.id)).cp;break;}
    case 'worldFocus':{idle();requireFieldLocation(x.walking,now);const e=f.encounter;check(e&&e.id===c.encounter,'Open deze bug opnieuw.');check(x.walking!.spawns.some(s=>s.id===e.spawn&&s.expiresAt>now&&!x.walking!.caught.includes(s.id)),'Deze bug is verdwenen.');e.focus={id,at:now+800};break;}
    case 'worldCast':{idle();requireFieldLocation(x.walking,now);check(c.net!=='basic'||f.inventory.basic>0,'Je standaardnetten zijn op.');const bait=f.encounter?.bait??c.bait as string|null;castNet(x,c,id,now);if(c.net==='basic')f.inventory.basic--;if(f.lastCast?.outcome==='caught'){const priorXP=ensureTrainer(x).xp,priorDust=g.dust,held=awardGoCatch(x,x.specimens.at(-1)!,x.walking!.seed+':go:'+f.lastCast.spawn,bait,f.lastCast.grade,f.lastCast.curved);awardGoCatchCard(x,x.specimens.at(-1)!,f.lastCast.spawn,now);awardCocoon(x,secret,now);f.lastCast.xp=ensureTrainer(x).xp-priorXP;if(held)f.lastCast.held=held;f.lastCast.nectar=g.dust-priorDust;f.lastCast.candy=bait==='fruit'?6:bait==='silver'?7:3;f.lastCast.cp=stats(x.specimens.at(-1)!).cp;x.walking!.lastCatch!.nectar=f.lastCast.nectar;this.note(x,'catch','catch:'+f.lastCast.spawn,x.specimens.at(-1)!,now,{method:'manual',dust:f.lastCast.nectar,xp:f.lastCast.xp});}break;}
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
    case 'buddy':idle();ownedGo(x,c.id);if(x.buddy!==c.id){x.buddy=c.id as string;g.buddyMeters=f.walk?.meters??0;}break;
    case 'goRename':idle();renameGo(x,c.id,c.name);break;
    case 'goPower':{idle();const before=g.dust;powerUp(x,c.id);this.note(x,'power','power:'+c.commandId,ownedGo(x,c.id),now,{dust:g.dust-before});break;}
    case 'goSecond':{idle();const before=g.dust;secondAttack(x,c.id,secret);this.note(x,'move','move:'+c.commandId,ownedGo(x,c.id),now,{dust:g.dust-before});break;}
    case 'goTM':idle();teachMove(x,c.id,c.slot,secret);this.note(x,'move','move:'+c.commandId,ownedGo(x,c.id),now);break;
    case 'goEquip':idle();equipGo(x,c.id,c.item);this.note(x,'equip','equip:'+c.commandId,ownedGo(x,c.id),now);break;
    case 'goTransfer':{idle();const bug=ownedGo(x,c.id);transferGo(x,c.id);this.note(x,'transfer','transfer:'+c.commandId,bug,now);break;}
    case 'goTransferMany':{idle();const selected=x.specimens.filter(s=>Array.isArray(c.ids)&&c.ids.includes(s.id));transferManyGo(x,c.ids);for(const bug of selected)this.note(x,'transfer','transfer:'+c.commandId+':'+bug.id,bug,now);break;}
    case 'trainerClaim':claimTrainer(x);break;
    case 'goEvolve':{idle();const fromSpecies=ownedGo(x,c.id).species;evolveGo(x,c.id,secret,now);this.note(x,'evolve','evolve:'+c.commandId,ownedGo(x,c.id),now,{fromSpecies});break;}
    case 'goTeam':idle();teamGo(x,c.ids,c.league);break;
    case 'goBoss':{idle();const b=makeBossBattle(x,c.difficulty as BossDifficulty,id,now);d.set(bk(id),b);g.battle=id;break;}
    case 'cocoonStart':idle();startCocoon(x,c.id,now);break;
    case 'cocoonClaim':{idle();const before={dust:g.dust,xp:g.trainer!.xp};hatchCocoon(x,now);this.note(x,'hatch','hatch:'+g.cocoons!.lastHatch!.id, x.specimens.at(-1)!,now,{dust:g.dust-before.dust,xp:g.trainer!.xp-before.xp});break;}
    case 'echoSave':idle();check(linked||this.mode==='local','Koppel je account om je verdediging te bewaren.',403);d.set('v2EchoDefenses:'+uid,saveEchoDefense(x,now));break;
    case 'echoQueue':{idle();check(linked||this.mode==='local','Koppel je account voor offline duels.',403);teamGo(x,g.team,g.league);check(echoDefense,'Nog geen opgeslagen tegenstander in deze league. Bewaar je verdediging of speel Training.');const b=makeEchoBattle(x,echoDefense,id,now);d.set(bk(id),b);g.battle=id;break;}
    case 'goAuto':check(typeof c.enabled==='boolean','Kies aan of uit.');g.auto.enabled=c.enabled as boolean;g.auto.moving=0;g.auto.status=c.enabled?'waiting':'off';g.motion=x.walking?{fix:{...x.walking.fix},at:now}:undefined;break;
    case 'goQueue':idle();check(linked||this.mode==='local','Koppel je account voor Ranked.',403);check((g.ratedCount??0)<25,'Vandaag zijn alle 25 Ranked-gevechten gespeeld.');teamGo(x,g.team,g.league);g.queue={league:g.league,at:now,until:now+120000};d.set(tk(uid),{uid,league:g.league,rating:g.rating,at:now,until:now+120000,status:'waiting'} satisfies Ticket);break;
    case 'goCancel':check(!g.battle,'Je tegenstander is al gevonden.');g.queue=null;d.set(tk(uid),{status:'cancelled'});break;
    case 'goTrain':{idle();teamGo(x,g.team,g.league);const b=makeGoBattle(x,this.npc(x,id,now),id,now,false,true);d.set(bk(id),b);g.battle=id;break;}
    case 'goInvite':idle();teamGo(x,g.team,g.league);d.set('v2GoInvites:'+x.friendCode,{uid,league:g.league,until:now+300000});break;
    case 'goJoin':{idle();const invite=document<{uid:string;league:League;until:number}>(d,'v2GoInvites:'+c.code);check(invite&&invite.uid===otherUid&&invite.until>now,'Deze uitnodiging is verlopen.');const other=this.get(d,otherUid!,now);check(!other.go!.battle&&!other.go!.queue,'Deze speler is al bezig.');teamGo(x,g.team,invite.league);teamGo(other,other.go!.team,invite.league);const b=makeGoBattle(other,x,id,now,false);d.set(bk(id),b);g.battle=id;other.go!.battle=id;other.revision++;invite.until=0;break;}
    case 'goAct':{check(g.battle,'Je hebt geen gevecht.');const b=document<GoBattle>(d,bk(g.battle));check(b&&b.players.includes(uid),'Dit gevecht is niet van jou.',403);actGoBattle(b,b.players.indexOf(uid) as Side,c.action,c.value,now);this.settle(d,b,now);break;}
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
   x.revision++;d.set(receipt,{fingerprint,at:now,type:c.type});
  });return this.state(uid,linked);
 }
 private async matchmake(uid:string){const now=this.clock(),mine=await this.store.run([tk(uid)],d=>document<Ticket>(d,tk(uid)));if(!mine||mine.status!=='waiting')return;
  if(mine.until<=now){await this.store.run([pk(uid),tk(uid)],d=>{const t=document<Ticket>(d,tk(uid));if(t?.status==='waiting'){t.status='expired';const p=this.get(d,uid,now);p.go!.queue=null;p.revision++;}});return;}
  const pool=await this.query<Ticket>('v2GoTickets',[{field:'status',op:'==',value:'waiting'}]),band=100+Math.floor((now-mine.at)/15000)*50,candidate=pool.filter(t=>t.uid!==uid&&t.league===mine.league&&t.until>now&&Math.abs(t.rating-mine.rating)<=Math.min(400,band,100+Math.floor((now-t.at)/15000)*50)).sort((a,b)=>Math.abs(a.rating-mine.rating)-Math.abs(b.rating-mine.rating)||a.at-b.at)[0];if(!candidate)return;
  const id=randomBytes(16).toString('hex');await this.store.run([pk(uid),pk(candidate.uid),tk(uid),tk(candidate.uid),bk(id)],d=>{const a=document<Ticket>(d,tk(uid)),b=document<Ticket>(d,tk(candidate.uid));if(!a||!b||a.status!=='waiting'||b.status!=='waiting'||a.until<=now||b.until<=now)return;const p=this.get(d,uid,now),q=this.get(d,candidate.uid,now);if(p.go!.battle||q.go!.battle||!p.go!.queue||!q.go!.queue)return;const battle=makeGoBattle(p,q,id,now,true);d.set(bk(id),battle);a.status=b.status='matched';for(const x of [p,q]){x.go!.queue=null;x.go!.battle=id;x.revision++;}});
 }
 async advanceDue(){const battles=await this.query<GoBattle>('v2GoBattles',[{field:'settled',op:'==',value:false}]);for(const b of battles)await this.advance(b.id);return {battles:battles.length};}
}
