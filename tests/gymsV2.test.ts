import {parseNativeFieldRequest} from '../src/nativeFieldProtocolV2';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2,parseGo} from '../server/goServiceV2';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,rollGoBug,powerUp,teachMove,equipGo,evolveGo,transferManyGo,teamIssue} from '../game/goV2';
import {GYM_TEAMS,gymSites,ensureGyms,gymCoins,chooseGymTeam,placeGymDefender,makeGymBattle,settleGymBattle,publicGym} from '../game/gymsV2';
import type {Gym,GymTeam} from '../game/gymsV2';
import {buyCoinOffer} from '../game/coinShopV2';
import {advanceGoBattle} from '../game/goBattleV2';
import {tradeBugIssue} from '../game/goTradeV2';
import type {PlayerV2,GameViewV2} from '../game/typesV2';
const NOW=Date.UTC(2026,9,22,10),fix={lat:51.4416,lng:5.4697,accuracy:5,timestamp:NOW};
const post={id:'virtual-gym-qa',name:'Veldpost',lat:fix.lat,lng:fix.lng,source:'virtual' as const},site=gymSites([post])[0];
function player(uid:string,team:GymTeam='fern',kind='ant',level=10){
 const p=freshV2(uid,uid.padEnd(8,'0').slice(0,8).toUpperCase(),NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);ensureGyms(p,NOW);p.name='QA '+uid;p.onboarded=true;
 const kinds=[kind,...['moth','beetle','earwig'].filter(k=>k!==kind).slice(0,2)];p.specimens=kinds.map((species,i)=>({id:uid+'-owned-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level}}));p.buddy=p.specimens[2].id;p.go!.team=p.specimens.map(s=>s.id);p.go!.gyms!.team=team;p.walking={fix:{...fix},at:NOW,spawns:[],caught:[],day:'2026-10-22',count:0,posts:[post]};return p;
}
const gym=():Gym=>({...site,team:null,revision:0,defenders:[]});
test('gyms use deterministic server post sites and allow six distinct players/species of one team',()=>{
 assert.deepEqual(gymSites([post]),gymSites([post]));assert.equal(gymSites([]).length,0);assert.equal(Object.keys(GYM_TEAMS).length,3);
 const g=gym(),kinds=['ant','beetle','moth','earwig','mantis','waterstrider'];
 for(let i=0;i<6;i++){const p=player('owner'+i,'fern',kinds[i]);placeGymDefender(p,g,p.specimens[0].id,'deployment-'+i,NOW);assert.equal(p.go!.team.length,2);}
 assert.equal(g.defenders.length,6);const seventh=player('seventh');assert.throws(()=>placeGymDefender(seventh,g,seventh.specimens[0].id,'seventh',NOW),/zes/);
 const view=publicGym(g,'owner1',NOW);assert.equal(view.defenders.length,6);assert.equal(view.defenders.filter(d=>d.me).length,1);assert.ok(!JSON.stringify(view).includes('"uid"'));assert.ok(!JSON.stringify(view).includes('"iv"'));
});
test('gym placement rejects wrong team, duplicate species/player, remote/stale GPS and an already deployed bug',()=>{
 const g=gym(),a=player('a'),b=player('b'),enemy=player('enemy','amber');placeGymDefender(a,g,a.specimens[0].id,'a-deploy',NOW);
 assert.throws(()=>placeGymDefender(a,g,a.specimens[1].id,'again',NOW),/verdedigt deze gym/);assert.throws(()=>placeGymDefender(b,g,b.specimens[0].id,'duplicate',NOW),/soort/);assert.throws(()=>placeGymDefender(enemy,g,enemy.specimens[0].id,'enemy',NOW),/andere ploeg/);
 b.specimens[0].species='mantis';b.walking!.fix.lat+=.01;assert.throws(()=>placeGymDefender(b,g,b.specimens[0].id,'far',NOW),/65 meter/);b.walking!.fix={...fix};assert.throws(()=>placeGymDefender(b,g,b.specimens[0].id,'stale',NOW+31000),/GPS/);
 const other={...gym(),id:'gym-other'};assert.throws(()=>placeGymDefender(a,other,a.specimens[0].id,'twice',NOW),/al een gym/);
 const unchosen=player('unchosen');unchosen.go!.gyms!.team=null;chooseGymTeam(unchosen,'tidal',NOW);assert.throws(()=>chooseGymTeam(unchosen,'amber',NOW),/al gekozen/);
});
test('defending bugs cannot be changed, traded, transferred or used on a battle team',()=>{
 const p=player('locked'),g=gym(),id=p.specimens[0].id;placeGymDefender(p,g,id,'locked-deploy',NOW);const before=structuredClone(p);
 for(const work of [()=>powerUp(p,id),()=>teachMove(p,id,'fast','seed'),()=>equipGo(p,id,null),()=>evolveGo(p,id,'seed'),()=>transferManyGo(p,[id])])assert.throws(work,/gym/);
 assert.match(teamIssue(p,p.specimens.map(s=>s.id),'great')!,/gym/);assert.match(tradeBugIssue(p,p.specimens[0])!,/gym/);assert.deepEqual(p,before);
});
test('coins use whole server minutes, pay only on return, cap all returns at fifty on return UTC day, and settle once',()=>{
 assert.equal(gymCoins(NOW,NOW+599999),0);assert.equal(gymCoins(NOW,NOW+600000),1);assert.equal(gymCoins(NOW,NOW+86400000),50);
 const owner=player('owner'),attacker=player('attacker','amber','ant',50),g=gym();placeGymDefender(owner,g,owner.specimens[0].id,'return-1',NOW);assert.equal(owner.go!.gyms!.coins,0);
 const later=NOW+9*3600000;attacker.walking!.at=later;attacker.walking!.fix.timestamp=later;const b=makeGymBattle(attacker,g,attacker.go!.team,'battle-1',later);b.teams[1][0].hp=0;b.phase='finished';b.winner=0;
 const owners=new Map([[owner.uid,owner]]);assert.equal(settleGymBattle(g,b,owners,later),true);assert.equal(owner.go!.gyms!.coins,50);assert.equal(owner.go!.gyms!.deployed.length,0);assert.equal(g.team,null);assert.equal(settleGymBattle(g,b,owners,later),false);assert.equal(owner.go!.gyms!.coins,50);
 owner.walking!.at=later;owner.walking!.fix.timestamp=later;placeGymDefender(owner,g,owner.specimens[0].id,'return-2',later);g.defenders[0].hearts=1;const again=makeGymBattle(attacker,g,attacker.go!.team,'battle-2',later);again.teams[1][0].hp=0;again.phase='finished';again.winner=0;settleGymBattle(g,again,owners,later+600000);assert.equal(owner.go!.gyms!.coins,50);assert.equal(owner.go!.gyms!.returns[0].coins,0);
 const tomorrow=NOW+86400000;owner.walking!.at=tomorrow;owner.walking!.fix.timestamp=tomorrow;attacker.walking!.at=tomorrow;attacker.walking!.fix.timestamp=tomorrow;placeGymDefender(owner,g,owner.specimens[0].id,'return-3',tomorrow);g.defenders[0].hearts=1;const next=makeGymBattle(attacker,g,attacker.go!.team,'battle-3',tomorrow);next.teams[1][0].hp=0;next.phase='finished';next.winner=0;settleGymBattle(g,next,owners,tomorrow+1200000);assert.equal(owner.go!.gyms!.coins,52);assert.equal(owner.go!.gyms!.earned,2);
});
test('gym combat uses actual uncapped builds, six offline defenders and no shields; timeout/forfeit cannot remove living defenders',()=>{
 const g=gym(),owners=['ant','beetle','moth','earwig','mantis','waterstrider'].map((kind,i)=>player('def'+i,'fern',kind));for(const p of owners)placeGymDefender(p,g,p.specimens[0].id,p.uid+'-deployment',NOW);
 const a=player('attack','amber','hercules',50),b=makeGymBattle(a,g,a.go!.team,'gym-battle',NOW);assert.equal(b.teams[1].length,6);assert.equal(b.teams[0][0].go.level,50);assert.equal(a.go!.league,'great');assert.deepEqual(b.shields,[0,0]);assert.throws(()=>makeGymBattle(a,g,a.go!.team,'race',NOW),/al gevochten/);
 const hp=g.defenders.map(d=>d.hearts);advanceGoBattle(b,b.endsAt);assert.equal(b.winner,1);settleGymBattle(g,b,new Map(owners.map(p=>[p.uid,p])),b.endsAt);assert.deepEqual(g.defenders.map(d=>d.hearts),hp);assert.equal(g.defenders.length,6);assert.equal(g.battle,undefined);
});
test('coin shop validates server catalog/balance, rejects forged prices and preserves old resources',()=>{
 const p=player('shop');p.go!.gyms!.coins=80;const count=p.field!.inventory.basic;buyCoinOffer(p,'field-nets',NOW);assert.equal(p.go!.gyms!.coins,0);assert.equal(p.field!.inventory.basic,count+20);assert.throws(()=>buyCoinOffer(p,'field-nets',NOW),/coins/);assert.throws(()=>buyCoinOffer(p,'unknown',NOW),/shopartikel/);
 for(const forged of [{type:'coinBuy',offer:'field-nets',coins:0},{type:'gymDefend',gym:site.id,id:'bug',cp:99999},{type:'gymAttack',gym:site.id,ids:[],damage:99999}])assert.throws(()=>parseGo({...forged,commandId:randomUUID(),expectedRevision:0}));
});
test('shared service persists an absent owner defense, resolves real taps, returns coins atomically and keeps PvP rating unchanged',async()=>{
 const store=new SqliteStore(':memory:');let now=NOW;try{
  const service=new GoServiceV2(store,'local',()=>now),a=player('owner','fern','ant',1),b=player('attacker','amber','hercules',50);for(const p of [a,b])await store.run(['v2Players:'+p.uid],d=>d.set('v2Players:'+p.uid,p));
  let owner=await service.state(a.uid),attack=await service.state(b.uid);const send=(uid:string,v:GameViewV2,type:string,data:Record<string,unknown>={})=>service.command(uid,{type,...data,commandId:randomUUID(),expectedRevision:v.player.revision});owner=await send(a.uid,owner,'gymDefend',{gym:site.id,id:a.specimens[0].id});assert.equal((await service.state(b.uid)).goGyms![0].defenders[0].name,a.name);
  now+=9*3600000;await store.run(['v2Players:'+b.uid],d=>{const x=d.get('v2Players:'+b.uid) as PlayerV2;x.walking!.at=now;x.walking!.fix.timestamp=now;});attack=await service.state(b.uid);attack=await send(b.uid,attack,'gymAttack',{gym:site.id,ids:b.go!.team});assert.ok(attack.goBattle!.gym);assert.deepEqual(attack.goBattle!.gym!.defenders,[]);
  let accepted:Record<string,unknown>|undefined;for(let i=0;i<100&&attack.goBattle!.phase!=='finished';i++){
   if(attack.goBattle!.phase==='fight'&&!attack.goBattle!.fast[0]){accepted={type:'goAct',action:'fast',value:null,commandId:randomUUID(),expectedRevision:attack.player.revision};attack=await service.command(b.uid,accepted);}
   now+=500;attack=await service.state(b.uid);
  }
  assert.equal(attack.goBattle!.winner,0);assert.equal(attack.goGyms![0].team,null);owner=await service.state(a.uid);assert.equal(owner.player.go!.gyms!.coins,50);assert.equal(owner.player.go!.gyms!.deployed.length,0);assert.ok(owner.player.specimens.some(s=>s.id===a.specimens[0].id));assert.equal(owner.player.go!.rating,1000);assert.equal(attack.player.go!.rating,1000);
  await Promise.all(Array.from({length:4},()=>service.command(b.uid,accepted!)));assert.equal((await service.state(a.uid)).player.go!.gyms!.coins,50);
 }finally{store.close();}
});
test('shop command retries spend and grant once; concurrent deposits never exceed capacity',async()=>{
 const store=new SqliteStore(':memory:');try{const p=player('shopper');p.go!.gyms!.coins=160;await store.run(['v2Players:'+p.uid],d=>d.set('v2Players:'+p.uid,p));const service=new GoServiceV2(store,'local',()=>NOW),v=await service.state(p.uid),command={type:'coinBuy',offer:'field-nets',commandId:randomUUID(),expectedRevision:v.player.revision};await Promise.all(Array.from({length:4},()=>service.command(p.uid,command)));const next=await service.state(p.uid);assert.equal(next.player.go!.gyms!.coins,80);assert.equal(next.player.field!.inventory.basic,p.field!.inventory.basic+20);
  const kinds=['ant','beetle','moth','earwig','mantis','waterstrider','hercules'];for(let i=0;i<kinds.length;i++){const x=player('slot'+i,'fern',kinds[i]);await store.run(['v2Players:'+x.uid],d=>d.set('v2Players:'+x.uid,x));}const views=await Promise.all(kinds.map((_,i)=>service.state('slot'+i)));const results=await Promise.allSettled(views.map(v=>service.command(v.player.uid,{type:'gymDefend',gym:site.id,id:v.player.specimens[0].id,commandId:randomUUID(),expectedRevision:v.player.revision})));assert.equal(results.filter(r=>r.status==='fulfilled').length,6);assert.equal((await service.state('slot0')).goGyms![0].defenders.length,6);
 }finally{store.close();}
});

test('native map allows only the new gym/shop commands and destinations, never client revisions or rewards',()=>{
 for(const command of ['gymTeam','gymDefend','gymAttack','coinBuy']){assert.ok(parseNativeFieldRequest(JSON.stringify({kind:'command',id:'request1',command,params:{}})));assert.equal(parseNativeFieldRequest(JSON.stringify({kind:'command',id:'request1',command,params:{expectedRevision:99}})),null);}
 for(const name of ['gyms','coinShop'])assert.ok(parseNativeFieldRequest(JSON.stringify({kind:'navigate',name})));
 assert.equal(parseNativeFieldRequest(JSON.stringify({kind:'navigate',name:'adminGyms'})),null);
});
