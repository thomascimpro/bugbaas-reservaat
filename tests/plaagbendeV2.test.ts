import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,randomUUID} from 'node:crypto';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,movePool,rollGoBug,stats} from '../game/goV2';
import {levelXP} from '../game/trainerV2';
import {locate} from '../game/walkingV2';
import {gymCandidate} from '../game/worldSitesV2';
import {BALLOON_EVERY_MS,BALLOON_STAYS_MS,PLAAG_WINDOW_MS,ensureBalloon,invasionAt,plaagPools,plaagTeam,plaagThemes} from '../game/plaagbendeV2';
import type {GoBattle} from '../game/goBattleV2';
import type {PlayerV2} from '../game/typesV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import type {GameViewV2} from '../game/typesV2';

const T0=Date.UTC(2026,9,29,9),FIX={lat:51.4416,lng:5.4697,accuracy:5};
const KEY='plaag-test-key',TOKEN=(input:string)=>createHmac('sha256',KEY).update(input).digest('base64url').slice(0,22);
/** A non-gym post that is invaded at T0 (the schedule is keyed with the stored server secret). */
function invadedPost(){for(let i=0;i<500;i++){const id='plaag-post-'+i;if(!gymCandidate(id)&&invasionAt(id,T0,TOKEN))return {id,name:'Plaagpost',lat:FIX.lat,lng:FIX.lng,source:'virtual' as const};}throw new Error('no fixture');}
/** gymSites turns the first post into a gym when no post is a gym candidate, so fixtures add one real gym post. */
function gymPost(){for(let i=0;;i++){const id='gym-post-'+i;if(gymCandidate(id))return {id,name:'Gympost',lat:FIX.lat+.0003,lng:FIX.lng,source:'virtual' as const};}}
function player(uid:string,now:number,posts:unknown[]){
 const p=freshV2(uid,uid.slice(0,8).toUpperCase().padEnd(8,'X'),now);ensureAdventure(p,now);ensureField(p,now);ensureGo(p,now);p.uid=uid;p.name=uid;p.go!.trainer!.xp=levelXP(10);
 p.specimens=['ant','beetle','moth'].map((species,i)=>({id:'bug-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:now,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:20}}));
 p.go!.team=p.specimens.map(s=>s.id);locate(p,{...FIX,timestamp:now},'walk-'+uid,now);p.walking!.posts=posts as never;return p;
}
async function setup(uid:string,posts:unknown[]){
 const store=new SqliteStore(':memory:'),clock={now:T0};await store.run(['v2RaidSecret:global'],d=>d.set('v2RaidSecret:global',{key:KEY}));
 const service=new GoServiceV2(store,'local',()=>clock.now);await service.state(uid);await store.run(['v2Players:'+uid],d=>d.set('v2Players:'+uid,player(uid,clock.now,posts)));
 let view=await service.state(uid);
 const send=async(type:string,params:Record<string,unknown>={},commandId=randomUUID())=>view=await service.command(uid,{type,...params,commandId,expectedRevision:view.player.revision});
 /** Ends the running fight as a win or loss on the server document, then lets the service settle it. */
 const finish=async(win:boolean)=>{const id=view.player.go!.battle!;await store.run(['v2GoBattles:'+id],d=>{const b=d.get('v2GoBattles:'+id) as GoBattle;for(const f of b.teams[win?1:0])f.hp=0;b.phase='finished';b.winner=win?0:1;d.set('v2GoBattles:'+id,b);});view=await service.state(uid);await send('goClose');return view;};
 return {store,service,clock,send,finish,get view(){return view;},set view(v:GameViewV2){view=v;}};
}

test('schedule is deterministic, keyed, about one in five posts, per 3-hour window',()=>{
 const ids=Array.from({length:2000},(_,i)=>'post-'+i),hits=ids.filter(id=>invasionAt(id,T0,TOKEN));
 assert.ok(hits.length>2000*.15&&hits.length<2000*.25,'about 20%: '+hits.length);
 assert.deepEqual(ids.map(id=>invasionAt(id,T0,TOKEN)?.id??null),ids.map(id=>invasionAt(id,T0+60000,TOKEN)?.id??null),'stable inside a window');
 const other=(input:string)=>createHmac('sha256','another-key').update(input).digest('base64url').slice(0,22);
 assert.notDeepEqual(ids.map(id=>!!invasionAt(id,T0,TOKEN)),ids.map(id=>!!invasionAt(id,T0,other)),'the secret decides the schedule');
 const v=invasionAt(hits[0],T0,TOKEN)!;assert.equal(v.endsAt%PLAAG_WINDOW_MS,0);assert.ok(v.endsAt>T0&&v.endsAt<=T0+PLAAG_WINDOW_MS);
});

test('every theme has three different species of that main type, led by the rescued bug',()=>{
 assert.ok(plaagThemes().length>=8);for(const type of plaagThemes()){assert.ok(plaagPools()[type]!.length>=3);
  for(let i=0;i<20;i++){const team=plaagTeam('x'+i+type,type);assert.equal(new Set(team).size,3);for(const s of team)assert.equal(movePool(s).types[0],type);}}
});

test('post invasion: distance enforced, fair CP, win rewards once with a rescued bug, post cleared, receipts idempotent',async()=>{
 const post=invadedPost(),gym=gymPost(),uid='plaag-player',t=await setup(uid,[gym,post]),inv=t.view.plaagbende!.find(v=>v.postId===post.id)!;
 assert.ok(inv&&!inv.far,'the invaded post is on the map');const ids=['bug-0','bug-1','bug-2'];
 // Too far away: the server refuses.
 await t.store.run(['v2Players:'+uid],d=>{const p=d.get('v2Players:'+uid) as PlayerV2;p.walking!.posts=[gym,{...post,lat:FIX.lat+.002}];d.set('v2Players:'+uid,p);});t.view=await t.service.state(uid);
 await assert.rejects(t.send('plaagFight',{target:post.id,ids}),/65 meter/);
 await t.store.run(['v2Players:'+uid],d=>{const p=d.get('v2Players:'+uid) as PlayerV2;p.walking!.posts=[gym,post];d.set('v2Players:'+uid,p);});t.view=await t.service.state(uid);
 // A loss costs nothing and the post stays.
 await t.send('plaagFight',{target:post.id,ids});const b=t.view.goBattle!;assert.ok(b.plaagbende&&b.plaagbende.type===inv.type);
 const mine=ids.map(id=>stats(t.view.player.specimens.find(s=>s.id===id)!).cp),average=mine.reduce((a,c)=>a+c,0)/3;assert.ok(b.teams[1][0].cp<=average,'grunt is not stronger than the team');assert.ok(b.teams[1][0].cp>average*.6,'grunt is still a fight');
 const before={dust:t.view.player.go!.dust,count:t.view.player.specimens.length};await t.finish(false);
 assert.equal(t.view.player.go!.dust,before.dust);assert.equal(t.view.player.specimens.length,before.count);assert.ok(t.view.plaagbende!.some(v=>v.id===inv.id),'still there after a loss');
 // Win: reward once, a rescued bug of the theme, counter, post cleared. A replayed command id does not start a second fight.
 const commandId=randomUUID(),cmd={type:'plaagFight',target:post.id,ids,commandId,expectedRevision:t.view.player.revision};t.view=await t.service.command(uid,cmd);const battle=t.view.player.go!.battle;t.view=await t.service.command(uid,cmd);assert.equal(t.view.player.go!.battle,battle);
 await t.finish(true);const p=t.view.player,rescued=p.specimens.find(s=>s.source==='plaagbende')!;
 assert.ok(rescued&&movePool(rescued.species).types[0]===inv.type,'rescued bug has the grunt type');assert.equal(rescued.species,inv.team[0]);assert.ok(rescued.go!.iv.every(n=>n>=10),'good IVs');
 assert.ok(p.go!.dust>=before.dust+500);assert.equal(p.go!.plaagbende!.wins,1);assert.ok(!t.view.plaagbende!.some(v=>v.id===inv.id),'cleared for this player');
 await assert.rejects(t.send('plaagFight',{target:post.id,ids}),/al verslagen/);assert.equal(t.view.player.specimens.filter(s=>s.source==='plaagbende').length,1);
});

test('balloon: one at a time near the player, every ~6 hours, playable from anywhere, gone after a win',async()=>{
 const p=player('balloon-unit',T0,[]);const b=ensureBalloon(p,T0,'s1')!;assert.ok(b,'first balloon appears');assert.equal(ensureBalloon(p,T0+1000,'s2')!.id,b.id,'max one open');
 p.walking!.fix={...p.walking!.fix,lat:FIX.lat+.01};assert.ok(Math.abs(ensureBalloon(p,T0+2000,'s3')!.lat-p.walking!.fix.lat)<.001,'it drifts along');
 p.go!.plaagbende!.balloon=null;assert.equal(ensureBalloon(p,T0+BALLOON_EVERY_MS-1,'s4'),null,'waits six hours');assert.ok(ensureBalloon(p,T0+BALLOON_EVERY_MS,'s5'));
 assert.equal(ensureBalloon(p,T0+BALLOON_EVERY_MS+BALLOON_STAYS_MS,'s6'),null,'an old balloon flies away');

 const uid='balloon-player',t=await setup(uid,[]);t.clock.now+=5000;await t.send('worldLocate',{fix:{...FIX,timestamp:t.clock.now}});const balloon=t.view.player.go!.plaagbende!.balloon!;assert.ok(balloon);
 // Far away and with old GPS: the balloon still works.
 t.clock.now+=10*60000;await t.send('plaagFight',{target:'balloon',ids:['bug-0','bug-1','bug-2']});assert.equal(t.view.goBattle!.plaagbende!.kind,'balloon');
 await t.finish(true);assert.equal(t.view.player.go!.plaagbende!.balloon,null);assert.equal(t.view.player.go!.plaagbende!.wins,1);
 await assert.rejects(t.send('plaagFight',{target:'balloon',ids:['bug-0','bug-1','bug-2']}),/weggevlogen/);
});
