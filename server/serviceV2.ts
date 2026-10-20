import {startFieldLure,advanceFieldActivities,feedFieldBuddy} from '../game/fieldActivitiesV2';
import {releaseDuplicates,metamorphose} from '../game/collectionActionsV2';
import {recordWalk,startCocoon,hatchCocoon} from '../game/walkingRewardsV2';
import {ensureField,encounterWild,castNet,claimFieldSupply,claimFieldTask} from '../game/fieldV2';
import {locate,catchWild} from '../game/walkingV2';
import { createHash, randomBytes } from 'node:crypto';
import { HABITATS, ITEMS, RULES, SPECIES } from '../game/catalogV2';
import { copy } from '../game/battleV2';
import { advanceSafari, dayV2, freshV2, growSpecimen, ownedTeam, seasonV2, startSafari } from '../game/safariV2';
import { advanceDuel, band, createDuel, settleDuel } from '../game/rankedV2';
import {ARENA_RULES,arenaRankKey,beginArenaBattle,chooseGhost,createArena,ensureArena,forfeitArena,ghostKey,nextArena} from '../game/arenaV2';
import { checkV2 as check, finishShop, shopAction } from '../game/shopV2';
import type { ArenaGhost,CommandV2, Duel, FriendPair, GameViewV2, PlayerV2, QueueTicket, Side } from '../game/typesV2';
import type { Documents, Store } from './store';
import { document } from './store';
import {TACTIC_RULE,challengeDayKey,challengeScoreKey,claimExpedition,claimResearch,ensureAdventure,finishTactic,gearCost,resolveTurn,saveBuild,saveRankedBuild,trainSkill,startExpedition,startTactic,tacticScore,trainingCost,utcDay,GEARS} from '../game/tacticsV2';
import type {ChallengeDay,ChallengeScore,Gear} from '../game/tacticsV2';
import {craftEquipment,upgradeEquipment} from '../game/equipmentV2';
const pk=(uid:string)=>'v2Players:'+uid,tk=(uid:string)=>'v2Tickets:'+uid,mk=(id:string)=>'v2Matches:'+id;
const pairId=(a:string,b:string)=>[a,b].sort().join('_');
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const duelSeeds=():NonNullable<Duel['seeds']>=>Array.from({length:30},()=>({shops:[randomBytes(24).toString('hex'),randomBytes(24).toString('hex')],battle:randomBytes(24).toString('hex')}));
const fields:Record<string,string[]>={profile:['name'],settings:['sound','reducedMotion','largeText'],team:['ids'],equip:['id','item'],grow:['id','extras'],favorite:['id'],buddy:['id'],skin:['species'],safariStart:['route'],safariAdvance:['order'],safariClose:[],queue:[],cancel:[],shop:['action','offer','unit','target','order'],ready:[],forfeit:[],duelClose:[],duelCreate:[],duelJoin:['code'],friendRequest:['code'],friendAccept:['pair'],friendRemove:['pair'],giftSend:['pair','card'],giftOpen:['pair'],seasonClaim:[],arenaStart:[],arenaShop:['action','offer','unit','target','order'],arenaReady:[],arenaNext:[],arenaForfeit:[],arenaClose:[]};
Object.assign(fields,{specimenRelease:['ids'],metamorphose:['id'],worldLocate:['fix'],worldEncounter:['spawn'],worldCast:['encounter','net','bait','trace'],fieldLure:[],buddyFeed:[],fieldSupply:[],fieldTask:['task'],cocoonStart:['km'],cocoonHatch:[],adventureStart:['mode','stage'],adventureAct:['action'],adventureClose:[],adventureForfeit:[],adventureBuild:['build','mode'],skillTrain:['skill'],gearCraft:['gear'],adventureTrain:[],adventureGear:['gear'],expeditionStart:['habitat','hours'],expeditionClaim:[],researchClaim:[]});
export function parseV2(raw:unknown):CommandV2{check(raw&&typeof raw==='object'&&!Array.isArray(raw),'Een commando is vereist.');const a=raw as CommandV2;check(typeof a.type==='string'&&Object.hasOwn(fields,a.type),'Onbekende spelactie.');check(typeof a.commandId==='string'&&/^[\w-]{16,80}$/.test(a.commandId),'Ongeldig commando-ID.');check(Number.isSafeInteger(a.expectedRevision)&&a.expectedRevision>=0,'Ongeldige revisie.');check(Object.keys(a).every(k=>['type','commandId','expectedRevision',...fields[a.type]].includes(k)),'Een actie mag geen eigen scores, stats of extra velden bevatten.');return a;}
export class GameServiceV2 {
 constructor(public store:Store,public mode:'local'|'cloud',public clock=Date.now){}
 private async query<T>(kind:string,filters:Parameters<NonNullable<Store['query']>>[1]=[],order?:{field:string;descending?:boolean},limit=50){check(this.store.query,'Deze opslag ondersteunt de nieuwe game nog niet.',503);return this.store.query<T>(kind,filters,order,limit);}
 private get(docs:Documents,uid:string,now:number):PlayerV2{const key=pk(uid);let p=document<PlayerV2>(docs,key);if(!p){const code=BigInt('0x'+hash(uid).slice(0,12)).toString(32).toUpperCase().padStart(10,'0').slice(-8);p=freshV2(uid,code,now);docs.set(key,p);}else{if(p.buddyDay!==dayV2(now)){p.buddyDay=dayV2(now);p.buddyToday=0;p.revision++;}if(!p.match&&p.season!==seasonV2(now)){this.season(p,now);p.ticket=false;}}ensureArena(p,now);ensureAdventure(p,now);ensureField(p,now);return p;}
 async ensure(uid:string){const now=this.clock();const p=await this.store.run([pk(uid)],d=>this.get(d,uid,now));await this.store.run(['v2Codes:'+p.friendCode],d=>{const exists=document<{uid:string}>(d,'v2Codes:'+p.friendCode);check(!exists||exists.uid===uid,'Spelercode conflicteert; neem contact op.',409);d.set('v2Codes:'+p.friendCode,{uid});});return p;}
 private season(p:PlayerV2,now:number){const current=seasonV2(now);if(p.season!==current){p.rating=Math.round(1000+.75*(p.rating-1000));p.season=current;p.highestRating=p.rating;p.seasonMatches=0;p.revision++;}}
 async state(uid:string,linked=false):Promise<GameViewV2>{let p=await this.ensure(uid);if(p.match)await this.advanceMatch(p.match);if(p.ticket)await this.matchmake(uid);p=await this.store.run([pk(uid)],d=>this.get(d,uid,this.clock()));
  let m=p.match?await this.store.run([mk(p.match)],d=>document<Duel>(d,mk(p.match!))??null):null;check(!m||m.players.includes(uid),'Dit duel is niet van jou.',403);
  if(!m||m.phase==='finished'){p=await this.store.run([pk(uid),`v2SeasonRanks:${seasonV2(this.clock())}-${uid}`],d=>{const x=this.get(d,uid,this.clock());this.season(x,this.clock());d.set(`v2SeasonRanks:${x.season}-${uid}`,{uid,name:x.name,season:x.season,rating:x.rating,wins:x.wins});return x;});}
  const ticket=p.ticket?await this.store.run([tk(uid)],d=>document<QueueTicket>(d,tk(uid))??null):null;
  const friends=await this.query<FriendPair>('v2FriendPairs',[{field:'users',op:'array-contains',value:uid}],undefined,50);
  const ranking=await this.query<{uid:string;name:string;rating:number;wins:number}>('v2SeasonRanks',[{field:'season',op:'==',value:seasonV2(this.clock())}],{field:'rating',descending:true},30);
  let match:GameViewV2['match']=null;if(m){const side=m.players.indexOf(uid) as Side;const visible=copy(m);delete visible.seeds;if(m.phase==='shop'){const other=(1-side) as Side;visible.shops[other]={...visible.shops[other],gold:0,offers:[],team:m.battle?copy(m.battle.initial[other]):[],rolls:0,bonusAttack:0,bonusHealth:0};}match={...visible,side};}
  const publicPlayer=copy(p);if(publicPlayer.field?.cocoon)delete publicPlayer.field.cocoon.seed;if(publicPlayer.field?.lure)delete publicPlayer.field.lure.seed;if(publicPlayer.walking)delete publicPlayer.walking.seed;if(publicPlayer.safari)delete publicPlayer.safari.rewardSeed;if(publicPlayer.arenaRun)delete publicPlayer.arenaRun.seeds;
  if(publicPlayer.adventure?.run){delete publicPlayer.adventure.run.seed;delete publicPlayer.adventure.run.lootSeed;}
  if(publicPlayer.adventure?.expedition)delete publicPlayer.adventure.expedition.seed;
  const scoreRanking=await this.query<ChallengeScore>('v2ChallengeScores',[{field:'day',op:'==',value:utcDay(this.clock())},{field:'rule',op:'==',value:TACTIC_RULE}],{field:'score',descending:true},30);
  const arenaRanking=await this.query<{uid:string;name:string;rating:number;wins:number}>('v2ArenaRanks',[{field:'season',op:'==',value:seasonV2(this.clock())}],{field:'rating',descending:true},30);
  return {player:publicPlayer,now:this.clock(),mode:this.mode,linked:linked||this.mode==='local',challengeLeaderboard:p.adventure!.daily.scores.length>=3?scoreRanking.map(({uid:owner,...r})=>r):[],arenaLeaderboard:arenaRanking.map(r=>({name:r.name,rating:r.rating,wins:r.wins,me:r.uid===uid})),match,ticket:ticket?.status==='waiting'?ticket:null,friends:friends.filter(f=>!f.removed),leaderboard:ranking.map(r=>({name:r.name,rating:r.rating,wins:r.wins,me:r.uid===uid}))};
 }
 async command(uid:string,raw:unknown,linked=false){const c=parseV2(raw),now=this.clock(),seed=randomBytes(24).toString('hex'),secret=randomBytes(24).toString('hex'),seeds=duelSeeds(),p=await this.ensure(uid);if(p.match)await this.advanceMatch(p.match);
  const receipt='v2Receipts:'+uid+'-'+c.commandId,rate='v2Sessions:rate-'+uid,keys=[pk(uid),receipt,rate,tk(uid)];let otherUid:string|undefined;
  if(p.match){const m=await this.store.run([mk(p.match)],d=>document<Duel>(d,mk(p.match!)));if(m){keys.push(mk(m.id),...m.players.map(pk),...m.players.map(id=>`v2SeasonRanks:${m.season}-${id}`),'v2FriendPairs:'+pairId(...m.players));}}
  if(c.type==='friendRequest'||c.type==='duelJoin'){check(typeof c.code==='string'&&/^[A-Z0-9]{8}$/.test(c.code),'Gebruik een geldige achttekencode.');const code=c.code as string;const entry=await this.store.run(['v2Codes:'+code],d=>document<{uid:string}>(d,'v2Codes:'+code));check(entry&&entry.uid!==uid,'Deze andere speler is niet gevonden.');otherUid=entry.uid;keys.push(pk(otherUid),'v2FriendPairs:'+pairId(uid,otherUid));if(c.type==='duelJoin')keys.push('v2Invites:'+code,mk(seed));}
  if(c.type.startsWith('friend')&&c.type!=='friendRequest'||c.type.startsWith('gift')){check(typeof c.pair==='string'&&c.pair.length<256,'Kies een vriend.');keys.push('v2FriendPairs:'+c.pair);}
  if(c.type==='duelCreate')keys.push('v2Invites:'+p.friendCode);
  const arenaSeeds=Array.from({length:30},()=>({shop:randomBytes(24).toString('hex'),battle:randomBytes(24).toString('hex')}));
  const arenaGhost=c.type==='arenaReady'&&p.arenaRun?.phase==='shop'?chooseGhost(await this.query<ArenaGhost>('v2ArenaGhosts',[{field:'rule',op:'==',value:ARENA_RULES},{field:'round',op:'==',value:p.arenaRun.round}],{field:'createdAt',descending:true},100),p,now,secret):null;
  if(c.type.startsWith('arena'))keys.push(arenaRankKey(uid,p.arenaStats!.season));
  if(c.type==='arenaReady'&&p.arenaRun){keys.push(ghostKey(uid,p.arenaRun.season,p.arenaRun.round));if(arenaGhost)keys.push(ghostKey(arenaGhost.owner,arenaGhost.season,arenaGhost.round));}
  if(c.type==='adventureStart'&&c.mode==='score')keys.push(challengeDayKey(utcDay(now)));
  if(['adventureAct','adventureForfeit'].includes(c.type)&&p.adventure?.run?.mode==='score')keys.push(challengeScoreKey(p.adventure.run.day,uid,p.adventure.run.rule));

  await this.store.run([...new Set(keys)],d=>{const fingerprint=hash(JSON.stringify(c)),old=document<{fingerprint:string}>(d,receipt);if(old){check(old.fingerprint===fingerprint,'Dit commando-ID hoort bij een andere actie.',409);return;}
   const x=this.get(d,uid,now);check(x.revision===c.expectedRevision,'Je voortgang is veranderd. Vernieuw en probeer opnieuw.',409);const r=document<{at:number;count:number}>(d,rate)??{at:now,count:0};if(now-r.at>=60000){r.at=now;r.count=0;}check(r.count<150,'Even rustig: probeer het zo opnieuw.',429);r.count++;d.set(rate,r);
   const idle=()=>check(!x.ticket&&!x.match&&!x.arenaRun&&!x.adventure?.run&&x.safari?.status!=='battle','Rond eerst je actieve spel af.');
   const recordScore=()=>{const result=finishTactic(x,now);if(!result)return;const key=challengeScoreKey(result.day,uid,result.rule),oldScore=document<ChallengeScore>(d,key);check(!oldScore||oldScore.rule===result.rule,'Deze dagproef gebruikt andere regels.',409);const scores=oldScore?.scores.slice()??[],attempt=x.adventure!.run!.attempt;check(scores[attempt]===undefined,'Deze score is al opgeslagen.',409);while(scores.length<attempt)scores.push(0);scores[attempt]=result.score;d.set(key,{...result,scores,score:scores.reduce((sum,n)=>sum+n,0),attempts:scores.length});};
   switch(c.type){
    case 'specimenRelease':idle();releaseDuplicates(x,c.ids);break;
    case 'metamorphose':idle();metamorphose(x,c.id);break;
    case 'worldLocate':idle();locate(x,c.fix,secret,now);recordWalk(x,now);advanceFieldActivities(x,now);break;
    case 'worldEncounter':idle();encounterWild(x,c.spawn,secret,now);break;
    case 'worldCast':idle();castNet(x,c,seed,now);break;
    case 'cocoonStart':startCocoon(x,c.km,seed,secret,now);break;
    case 'cocoonHatch':hatchCocoon(x,now);break;
    case 'fieldLure':idle();startFieldLure(x,seed,secret,now);break;
    case 'buddyFeed':idle();feedFieldBuddy(x,now);break;
    case 'fieldSupply':claimFieldSupply(x,now);break;
    case 'fieldTask':claimFieldTask(x,c.task,now);break;
    case 'adventureBuild':idle();check(c.mode===undefined||c.mode==='boss'||c.mode==='score','Kies een spelvorm.');if(c.mode==='score')saveRankedBuild(x,c.build);else saveBuild(x,c.build);break;
    case 'skillTrain':idle();trainSkill(x,c.skill);break;
    case 'gearCraft':idle();craftEquipment(x,c.gear,now);break;
    case 'adventureTrain':{idle();const a=x.adventure!,cost=trainingCost(a.level);check(cost>0&&x.nectar>=cost,'Niet genoeg nectar of je team is maximaal getraind.');x.nectar-=cost;a.level++;break;}
    case 'adventureGear':idle();upgradeEquipment(x,c.gear);break;
    case 'expeditionStart':startExpedition(x,c.habitat,c.hours,seed,secret,now);break;
    case 'expeditionClaim':claimExpedition(x,now);break;
    case 'researchClaim':claimResearch(x);break;
    case 'adventureStart':{idle();check(c.mode==='boss'||c.mode==='score','Kies een geldige spelvorm.');let battleSeed=secret;if(c.mode==='score'){check(linked||this.mode==='local','Koppel je account om een score achter te laten.',403);const key=challengeDayKey(utcDay(now));let challenge=document<ChallengeDay>(d,key);if(!challenge){challenge={day:utcDay(now),rule:TACTIC_RULE,seed:secret};d.set(key,challenge);}check(challenge.rule===TACTIC_RULE,'De dagproef gebruikt andere regels. Probeer morgen opnieuw.',409);battleSeed=challenge.seed;}startTactic(x,c.mode,seed,now,battleSeed,c.stage);x.adventure!.run!.lootSeed=hash(secret+':loot');break;}
    case 'adventureAct':{const r=x.adventure!.run;check(r,'Start eerst een gevecht.');resolveTurn(r,c.action);if(r.phase!=='fight')recordScore();break;}
    case 'adventureForfeit':{const r=x.adventure!.run;check(r?.phase==='fight','Er loopt geen gevecht.');r.phase='lost';r.score=0;recordScore();if(r.reward){x.nectar-=r.reward.nectar;x.adventure!.parts-=r.reward.parts;r.reward={nectar:0,parts:0};x.adventure!.daily.fights--;}break;}
    case 'adventureClose':check(x.adventure!.run&&x.adventure!.run.phase!=='fight','Rond eerst je gevecht af.');x.adventure!.run=null;break;
    case 'profile':check(typeof c.name==='string'&&/^[\p{L}\p{N} _-]{2,18}$/u.test(c.name),'Gebruik 2 tot 18 letters of cijfers.');x.name=c.name;x.onboarded=true;break;
    case 'settings':for(const f of ['sound','reducedMotion','largeText'] as const){check(typeof c[f]==='boolean','Ongeldige instelling.');x.settings[f]=c[f] as boolean;}break;
    case 'team':idle();check(Array.isArray(c.ids)&&c.ids.every(i=>typeof i==='string'),'Kies je vijf bugs.');ownedTeam(x,c.ids as string[]);x.squad=c.ids as string[];break;
    case 'equip':{idle();const s=x.specimens.find(s=>s.id===c.id);check(s,'Kies een eigen bug.');check(c.item===null||(typeof c.item==='string'&&ITEMS.some(i=>i.id===c.item&&i.held)),'Ongeldig held item.');if(c.item){const available=x.items.filter(i=>i===c.item).length,used=x.specimens.filter(o=>o.id!==s.id&&o.item===c.item).length;check(available>used,'Dit voorwerp is al uitgerust of niet in je tas.');}s.item=c.item as string|null;break;}
    case 'grow':idle();check(typeof c.id==='string'&&Array.isArray(c.extras)&&c.extras.every(i=>typeof i==='string'),'Kies extra exemplaren.');check(!x.adventure!.build.some(b=>(c.extras as string[]).includes(b.specimen)),'Een bug uit je build is beschermd.');growSpecimen(x,c.id,c.extras as string[]);break;
    case 'favorite':{const s=x.specimens.find(s=>s.id===c.id);check(s,'Kies een eigen bug.');s.favorite=!s.favorite;break;}
    case 'buddy':idle();check(typeof c.id==='string'&&x.specimens.some(s=>s.id===c.id),'Kies een eigen bug.');x.buddy=c.id;break;
    case 'skin':{idle();check(typeof c.species==='string'&&x.shinies.includes(c.species),'Ontdek eerst deze shiny.');x.shinySkins??=[];x.shinySkins=x.shinySkins.includes(c.species)?x.shinySkins.filter(s=>s!==c.species):[...x.shinySkins,c.species];break;}
    case 'safariStart':idle();check(typeof c.route==='string','Kies een route.');startSafari(x,c.route,seed,secret);break;
    case 'safariAdvance':check(c.order===undefined||(Array.isArray(c.order)&&c.order.every(i=>typeof i==='string')),'Ongeldige volgorde.');advanceSafari(x,seed,now,c.order as string[]|undefined);break;
    case 'safariClose':check(x.safari&&x.safari.status!=='battle','Rond de safari af.');x.safari=null;break;
    case 'queue':idle();check(linked||this.mode==='local','Koppel eerst je account voor Ranked.',403);this.season(x,now);x.ticket=true;d.set(tk(uid),{uid,rating:x.rating,rule:RULES,createdAt:now,expiresAt:now+60000,status:'waiting',match:null} satisfies QueueTicket);break;
    case 'cancel':{const ticket=document<QueueTicket>(d,tk(uid));check(!x.match,'Het duel is al gevormd. Gebruik opgeven.',409);if(ticket?.status==='waiting')ticket.status='cancelled';x.ticket=false;break;}
    case 'duelCreate':idle();d.set('v2Invites:'+x.friendCode,{uid,createdAt:now,expiresAt:now+300000});x.lastReceipt='invite:'+x.friendCode;break;
    case 'duelJoin':{idle();const invite=document<{uid:string;expiresAt:number}>(d,'v2Invites:'+c.code);check(invite&&invite.uid===otherUid&&invite.expiresAt>now,'Deze uitnodiging is verlopen.');const other=this.get(d,otherUid!,now);check(!other.match&&!other.ticket&&!other.arenaRun&&!other.adventure?.run&&other.safari?.status!=='battle','Je vriend is al in een spel.');const m=createDuel(other,x,seed,now,seeds,false);d.set(mk(seed),m);other.match=seed;other.revision++;x.match=seed;invite.expiresAt=0;break;}
    case 'shop':case 'ready':case 'forfeit':case 'duelClose':{check(x.match,'Je hebt geen actief duel.');const m=document<Duel>(d,mk(x.match));check(m&&m.players.includes(uid),'Dit duel is niet van jou.',403);const side=m.players.indexOf(uid) as Side;
     if(c.type==='duelClose'){check(m.phase==='finished','Het duel loopt nog.');x.match=null;break;}
     check(m.phase!=='finished','Dit duel is al afgelopen.');if(c.type==='forfeit'){m.phase='finished';m.winner=(1-side) as Side;}
     else {check(m.phase==='shop'&&m.deadline>now,'Deze winkelronde is gesloten.',409);if(c.type==='ready'){check(!m.shops[side].ready,'Je staat al klaar.');m.shops[side].missed=0;finishShop(m.shops[side],seed);}else{check(typeof c.action==='string','Kies een winkelactie.');shopAction(m.shops[side],m.round,c.action,c,seed);for(const u of m.shops[side].team){u.shiny=!!x.shinySkins?.includes(u.species);const buddy=x.specimens.find(s=>s.id===x.buddy&&s.species===u.species);u.ribbon=buddy?.hearts&&buddy.hearts>=15?2:buddy?.hearts&&buddy.hearts>=3?1:0;}}}
     m.revision++;advanceDuel(m,now);this.settle(d,m,now);break;}
    case 'friendRequest':{check(otherUid,'Speler niet gevonden.');const id=pairId(uid,otherUid),key='v2FriendPairs:'+id,existing=document<FriendPair>(d,key);if(existing&&!existing.removed){check(!existing.accepted,'Jullie zijn al vrienden.');check(existing.requestedBy!==uid,'Je verzoek staat al klaar.');existing.accepted=true;}else{const other=this.get(d,otherUid,now);const users=[uid,otherUid].sort() as [string,string];d.set(key,{id,users,names:users.map(u=>u===uid?x.name:other.name) as [string,string],accepted:false,requestedBy:uid,points:existing?.points??0,lastDay:existing?.lastDay??'',gifts:[null,null]} satisfies FriendPair);}break;}
    case 'friendAccept':case 'friendRemove':case 'giftSend':case 'giftOpen':{const f=document<FriendPair>(d,'v2FriendPairs:'+c.pair);check(f&&f.users.includes(uid)&&!f.removed,'Deze vriendschap is niet beschikbaar.',403);const side=f.users.indexOf(uid) as Side;
     if(c.type==='friendAccept'){check(f.requestedBy!==uid,'Alleen de ontvanger kan accepteren.');f.accepted=true;}
     else if(c.type==='friendRemove')f.removed=true;
     else {check(f.accepted,'Accepteer eerst het verzoek.');if(c.type==='giftSend'){const card=x.cards.find(v=>v.id===c.card);check(card,'Kies een kaart uit je tas.');check(!f.gifts[side]||f.gifts[side]!.opened,'Er staat al een ongeopend cadeau klaar.');check(f.gifts[side]?.sentDay!==dayV2(now),'Vandaag al een cadeau gestuurd.');f.gifts[side]={id:seed,habitat:card.habitat,from:uid,sentDay:dayV2(now),opened:false};x.cards=x.cards.filter(v=>v.id!==card.id);}else{const gift=f.gifts[(1-side) as Side];check(gift&&!gift.opened,'Geen ongeopend cadeau.');gift.opened=true;if(!x.album.includes(gift.habitat))x.album.push(gift.habitat);if(f.lastDay!==dayV2(now)){f.points++;f.lastDay=dayV2(now);}}}break;}
    case 'arenaStart':idle();check(!x.arenaRun,'Sluit eerst je vorige arena.');x.arenaRun=createArena(x,seed,now,arenaSeeds,linked||this.mode==='local');break;
    case 'arenaShop':{const r=x.arenaRun;check(r?.phase==='shop','Deze arenaronde is gesloten.',409);check(typeof c.action==='string','Kies een winkelactie.');shopAction(r.shop,r.round,c.action,c,seed);for(const u of r.shop.team){u.shiny=!!x.shinySkins?.includes(u.species);const buddy=x.specimens.find(s=>s.id===x.buddy&&s.species===u.species);u.ribbon=buddy&&buddy.hearts>=15?2:buddy&&buddy.hearts>=3?1:0;}break;}
    case 'arenaReady':{if(arenaGhost){const stored=document<ArenaGhost>(d,ghostKey(arenaGhost.owner,arenaGhost.season,arenaGhost.round));check(stored?.id===arenaGhost.id,'Het opgeslagen team is veranderd. Probeer opnieuw.',409);}const snapshot=beginArenaBattle(x,arenaGhost,now);if(snapshot)d.set(ghostKey(uid,snapshot.season,snapshot.round),snapshot);break;}
    case 'arenaNext':nextArena(x);break;
    case 'arenaForfeit':forfeitArena(x);break;
    case 'arenaClose':check(x.arenaRun?.phase==='finished','Deze arena loopt nog.');x.arenaRun=null;break;
    case 'seasonClaim':check(x.seasonMatches>=5&&!x.seasonAwards.includes(x.season),'Speel vijf duels of je aandenken is al opgehaald.');x.seasonAwards.push(x.season);x.medals.push('season:'+x.season+':'+x.highestRating);break;
   }
   if(c.type.startsWith('arena')){const a=x.arenaStats!;d.set(arenaRankKey(uid,a.season),{uid,name:x.name,season:a.season,rating:a.rating,wins:a.wins});}
   x.revision++;d.set(receipt,{fingerprint,revision:x.revision,type:c.type,at:now});
  });return this.state(uid,linked);
 }
 private settle(d:Documents,m:Duel,now:number){if(m.phase!=='finished'||m.settled)return;const a=this.get(d,m.players[0],now),b=this.get(d,m.players[1],now);settleDuel(m,a,b,now);m.deadline=Number.MAX_SAFE_INTEGER;
  for(const p of [a,b]){const key=`v2SeasonRanks:${m.season}-${p.uid}`,old=document<{rating:number}>(d,key);d.set(key,{uid:p.uid,name:p.name,season:m.season,rating:p.season===m.season?p.rating:(old?.rating??1000)+(p.uid===a.uid?m.delta:-m.delta),wins:p.wins});}
  if(!m.ranked&&!m.void){const f=document<FriendPair>(d,'v2FriendPairs:'+pairId(...m.players));if(f?.accepted&&!f.removed&&f.lastDay!==dayV2(now)){f.points++;f.lastDay=dayV2(now);}}
 }
 async advanceMatch(id:string){const snapshot=await this.store.run([mk(id)],d=>document<Duel>(d,mk(id)));if(!snapshot||snapshot.phase==='finished')return;const keys=[mk(id),...snapshot.players.map(pk),...snapshot.players.map(uid=>`v2SeasonRanks:${snapshot.season}-${uid}`),'v2FriendPairs:'+pairId(...snapshot.players)];await this.store.run(keys,d=>{const m=document<Duel>(d,mk(id));if(!m)return;advanceDuel(m,this.clock());this.settle(d,m,this.clock());});}
 private async matchmake(uid:string){const now=this.clock(),mine=await this.store.run([tk(uid)],d=>document<QueueTicket>(d,tk(uid)));if(!mine||mine.status!=='waiting')return;
  if(mine.expiresAt<=now){await this.store.run([tk(uid),pk(uid)],d=>{const t=document<QueueTicket>(d,tk(uid));if(t?.status==='waiting'&&t.expiresAt<=now){t.status='expired';const p=this.get(d,uid,now);p.ticket=false;p.revision++;}});return;}
  const pool=await this.query<QueueTicket>('v2Tickets',[{field:'rule',op:'==',value:RULES},{field:'status',op:'==',value:'waiting'},{field:'rating',op:'>=',value:mine.rating-200},{field:'rating',op:'<=',value:mine.rating+200}],{field:'rating'},100);
  const self=await this.store.run([pk(uid)],d=>this.get(d,uid,now));const candidates=pool.filter(t=>t.uid!==uid&&t.expiresAt>now&&Math.abs(t.rating-mine.rating)<=Math.min(band(now-mine.createdAt),band(now-t.createdAt)));
  const fresh=candidates.filter(t=>!self.recent[t.uid]||now-self.recent[t.uid]>900000);const usable=fresh.length?fresh:candidates;if(!usable.length)return;
  usable.sort((a,b)=>Math.abs(a.rating-mine.rating)-Math.abs(b.rating-mine.rating)||a.createdAt-b.createdAt);const nearest=Math.abs(usable[0].rating-mine.rating),similar=usable.filter(t=>Math.abs(t.rating-mine.rating)<=nearest+25);const candidate=similar[randomBytes(2).readUInt16BE()%similar.length],id=randomBytes(16).toString('hex');
  const seeds=duelSeeds();await this.store.run([tk(uid),tk(candidate.uid),pk(uid),pk(candidate.uid),mk(id)],d=>{const a=document<QueueTicket>(d,tk(uid)),b=document<QueueTicket>(d,tk(candidate.uid));if(!a||!b||a.status!=='waiting'||b.status!=='waiting'||a.expiresAt<=now||b.expiresAt<=now)return;const p=this.get(d,uid,now),q=this.get(d,candidate.uid,now);if(p.match||q.match||!p.ticket||!q.ticket||p.safari?.status==='battle'||q.safari?.status==='battle')return;
   const m=createDuel(p,q,id,now,seeds);d.set(mk(id),m);for(const [t,x] of [[a,p],[b,q]] as const){t.status='matched';t.match=id;x.ticket=false;x.match=id;x.revision++;}});
 }
 async advanceDue(){const now=this.clock(),matches=await this.query<Duel>('v2Matches',[{field:'deadline',op:'<=',value:now}],{field:'deadline'},100);for(const m of matches)await this.advanceMatch(m.id);const tickets=await this.query<QueueTicket>('v2Tickets',[{field:'status',op:'==',value:'waiting'},{field:'expiresAt',op:'<=',value:now}],{field:'expiresAt'},100);for(const t of tickets)await this.matchmake(t.uid);return {matches:matches.length,tickets:tickets.length};}
}
