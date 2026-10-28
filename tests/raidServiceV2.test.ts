import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,rollGoBug} from '../game/goV2';
import {levelXP} from '../game/trainerV2';
import {locate} from '../game/walkingV2';
import {gymSites} from '../game/gymsV2';
import {LOBBY_MS,raidAt} from '../game/raidsV2';
import type {RaidLobby} from '../game/raidsV2';
import {GoServiceV2} from '../server/goServiceV2';
import {SqliteStore} from '../server/sqlite';
import type {GameViewV2} from '../game/typesV2';

const DAY=Date.UTC(2026,9,28),FIX={lat:51.4416,lng:5.4697,accuracy:5};
/** A post whose gym has a one-star raid, and a moment while it is active. */
function raidPost(){
 for(let i=0;i<400;i++){const post={id:'raid-post-'+i,name:'Zwermpost',lat:FIX.lat,lng:FIX.lng,source:'virtual' as const},site=gymSites([post])[0];
  for(let t=DAY;t<DAY+86400000;t+=15*60000){const r=raidAt(site,t,s=>s);if(r&&r.tier===1&&t>=r.hatchAt&&t+20*60000<r.endsAt)return {post,site,now:t};}}
 throw new Error('no fixture raid');
}
function player(uid:string,now:number,fix:{lat:number;lng:number},posts:unknown[]){
 const p=freshV2(uid,uid.slice(0,8).toUpperCase().padEnd(8,'X'),now);ensureAdventure(p,now);ensureField(p,now);ensureGo(p,now);p.uid=uid;p.name=uid;p.go!.trainer!.xp=levelXP(20);
 p.specimens=['ant','beetle','moth'].map((species,i)=>({id:'bug-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:now,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:30,fast:'fury' as const,charged:['cut' as const,'buzz' as const]}}));
 p.go!.team=p.specimens.map(s=>s.id);locate(p,{...FIX,...fix,timestamp:now},'walk-'+uid,now);p.walking!.posts=posts as never;return p;
}

test('local player invites a friend, the friend joins remotely, pooled damage wins once and both can catch',async()=>{
 const store=new SqliteStore(':memory:'),{post,site,now:start}=raidPost();let now=start;const service=new GoServiceV2(store,'local',()=>now);
 try{
  const A='raid-local-player',B='raid-remote-friend',C='raid-stranger';
  for(const uid of [A,B,C])await service.state(uid);
  await store.run(['v2Players:'+A,'v2Players:'+B,'v2Players:'+C,'v2FriendPairs:'+[A,B].sort().join('_')],d=>{
   d.set('v2Players:'+A,player(A,now,FIX,[post]));d.set('v2Players:'+B,player(B,now,{lat:FIX.lat+.5,lng:FIX.lng},[]));d.set('v2Players:'+C,player(C,now,{lat:FIX.lat+.5,lng:FIX.lng},[]));
   d.set('v2FriendPairs:'+[A,B].sort().join('_'),{id:[A,B].sort().join('_'),users:[A,B].sort(),names:[A,B],accepted:true,requestedBy:A,points:0,lastDay:'',gifts:[null,null]});
  });
  const views:Record<string,GameViewV2>={};for(const uid of [A,B,C])views[uid]=await service.state(uid);
  const send=async(uid:string,type:string,params:Record<string,unknown>={})=>views[uid]=await service.command(uid,{type,...params,commandId:randomUUID(),expectedRevision:views[uid].player.revision});

  const seen=views[A].raids!.find(r=>r.site.id===site.id)!,raid=seen;assert.ok(!raid.id.includes(post.id)&&/^\d{4}-\d\d-\d\d:[0-3]:[\w-]{22}$/.test(raid.id),'public raid id is opaque');assert.ok(seen&&seen.local,'the local player sees the raid at the gym');assert.equal((seen.site as Record<string,unknown>).lat,undefined,'no coordinates in the raid view');
  assert.equal(views[B].raids!.length,0,'a far-away player sees no local raid');
  await assert.rejects(send(B,'raidJoin',{raid:raid.id,remote:true}),/niet gevonden|uitnodiging/);
  await send(A,'raidJoin',{raid:raid.id,remote:false});assert.equal(views[A].raidLobby!.members.length,1);
  await assert.rejects(send(A,'raidInvite',{raid:raid.id,friends:[C]}),/geaccepteerde vrienden/);
  await send(A,'raidInvite',{raid:raid.id,friends:[B]});
  views[B]=await service.state(B);const invite=views[B].raidInvites![0];assert.equal(invite.raidId,raid.id);assert.equal(invite.from.uid,A);assert.equal(JSON.stringify(invite).includes(String(FIX.lat)),false,'invite carries no coordinates');
  await assert.rejects(send(C,'raidJoin',{raid:raid.id,remote:true}),/uitnodiging/,'remote play needs an invite');
  await assert.rejects(send(B,'raidJoin',{raid:raid.id,remote:true}),/Zwermfluit/);
  await send(B,'raidPass');await send(B,'raidJoin',{raid:raid.id,remote:true});assert.equal(views[B].player.go!.raids!.passes,0);assert.equal(views[B].raidLobby!.members.length,2);
  const lobbyId=views[B].raidLobby!.id;
  await assert.rejects(send(A,'raidFight',{ids:['bug-0','bug-1','bug-2']}),/wacht nog/);

  now+=LOBBY_MS+1000;
  for(const uid of [A,B]){await send(uid,'raidFight',{ids:['bug-0','bug-1','bug-2']});assert.ok(views[uid].goBattle!.raid,'personal raid battle');}
  // Load: polls share one pooled-damage read per lobby for 1.5 s, and never-invited players skip the inbox.
  const runs:string[][]=[],run=store.run.bind(store);store.run=((keys:string[],cb:never)=>{runs.push(keys);return run(keys,cb);}) as typeof store.run;
  for(let i=0;i<4;i++){views[A]=await service.state(A);views[B]=await service.state(B);}await service.state(C);
  const damageReads=()=>runs.filter(k=>k.every(key=>key.startsWith('v2RaidLobbies:')||key.startsWith('v2RaidDamage:'))).length;
  assert.ok(damageReads()<=1,'eight polls share at most one pooled-damage read');const before=damageReads();
  now+=1600;views[A]=await service.state(A);views[B]=await service.state(B);assert.equal(damageReads()-before,1,'after 1.5 s both players share one fresh read');
  assert.equal(runs.filter(k=>k.some(key=>key==='v2RaidInbox:'+C)).length,0,'no inbox read without an invite');
  store.run=run;
  // A hits until some damage lands; B then sees the same lower shared HP.
  for(let i=0;i<40&&views[A].goBattle!.teams[1][0].hp>=100;i++){now+=600;views[A]=await service.state(A);const b=views[A].goBattle!,a=b.teams[0][b.active[0]];if(b.phase==='fight'&&a.readyAt<=now&&!b.fast[0]&&a.hp>0)await send(A,'goAct',{action:'fast',value:null});}
  now+=600;views[A]=await service.state(A);views[B]=await service.state(B);
  const shared=views[B].raidLobby!.hp,max=views[B].raidLobby!.maxHP;assert.ok(shared<max,'A\'s damage is pooled');assert.equal(views[A].raidLobby!.hp,shared);
  assert.ok(views[B].goBattle!.teams[1][0].hp<100,'B\'s own fight shows the lowered boss');
  // The group is close to winning: one more of B's hits finishes it for both players.
  await store.run(['v2RaidDamage:'+lobbyId+':'+A],d=>d.set('v2RaidDamage:'+lobbyId+':'+A,{uid:A,damage:max-1}));
  for(let i=0;i<40&&views[B].goBattle!.phase!=='finished';i++){now+=600;views[B]=await service.state(B);const b=views[B].goBattle!,a=b.teams[0][b.active[0]];if(b.phase==='fight'&&a.readyAt<=now&&!b.fast[0]&&a.hp>0)await send(B,'goAct',{action:'fast',value:null});}
  const publicState=JSON.stringify([views[A].raidLobby,views[B].raidLobby,views[B].goBattle!.raid,views[B].raidInvites]);assert.equal(publicState.includes(post.id),false,'no post id reaches other players');
  assert.equal(views[B].goBattle!.winner,0);views[A]=await service.state(A);assert.equal(views[A].goBattle!.phase,'finished');assert.equal(views[A].goBattle!.winner,0,'the group win ends every member\'s fight');
  const lobby=await store.run(['v2RaidLobbies:'+lobbyId],d=>d.get('v2RaidLobbies:'+lobbyId) as RaidLobby);assert.equal(lobby.status,'won');

  await assert.rejects(send(C,'raidClaim',{lobby:lobbyId}),/niet in deze zwerm/);
  for(const uid of [A,B]){await send(uid,'goClose');const dust=views[uid].player.go!.dust;await send(uid,'raidClaim',{lobby:lobbyId});assert.ok(views[uid].player.go!.dust>dust,'reward paid');
   const again=views[uid].player.go!.dust;await send(uid,'raidClaim',{lobby:lobbyId});assert.equal(views[uid].player.go!.dust,again,'no second reward');assert.equal(views[uid].raidLobby,null);}
  const spawn=views[B].player.walking!.spawns.find(s=>s.source==='raid')!;assert.ok(spawn&&spawn.raid!.nets>=5);assert.equal(spawn.boss!.seed,undefined,'seed stays private');
  assert.notEqual(spawn.lat,post.lat,'the remote catch never reveals the post position');
  await send(B,'worldEncounter',{spawn:spawn.id});assert.ok(views[B].player.field!.encounter,'remote players can open the raid catch');
  const count=views[B].player.specimens.length;
  for(let i=0;i<spawn.raid!.nets&&views[B].player.walking!.spawns.some(s=>s.id===spawn.id&&!views[B].player.walking!.caught.includes(s.id));i++){now+=1500;
   await send(B,'worldCast',{encounter:views[B].player.field!.encounter!.id,net:'basic',bait:null,trace:{kind:'flick',points:[{x:.5,y:1,t:0},{x:.5,y:.85,t:90},{x:.5,y:.7,t:180}]}});}
  const after=views[B].player;assert.ok(after.walking!.caught.includes(spawn.id),'caught or gone after the earned nets');
  if(after.specimens.length>count){const bug=after.specimens.at(-1)!;assert.equal(bug.species,raid.species);assert.equal(bug.catchLocation,undefined);assert.ok(bug.go!.iv.every(v=>v>=10));}
 }finally{store.close();}
});
