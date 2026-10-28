import {test} from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {species} from '../game/catalogV2';
import {movePool} from '../game/goV2';
import {RAID_RULES,RAID_TIERS,FIGHT_MS,LOBBY_MS,SLOT_MS,addInvite,claimFreePass,claimRaid,ensureRaids,inviteIssue,joinLobby,leaveLobby,openLobby,publicRaid,raidAt,raidBossFighter,raidHP,raidInvite,raidJoinableUntil,resolveLobby,startLobby} from '../game/raidsV2';
import type {Raid,RaidProgress} from '../game/raidsV2';

const DAY=Date.UTC(2026,9,28);
const TOKEN=(input:string)=>createHash('sha256').update('test-key:'+input).digest('base64url').slice(0,22);
const site=(i:number)=>({id:'gym-post-'+i,name:'Post '+i,lat:52.09+i/1000,lng:5.12});
/** First post/slot combination that has a raid, observed while it is active. */
function activeRaid(tier?:number):Raid{
 for(let i=0;i<500;i++)for(let slot=0;slot<4;slot++){const start=DAY+slot*SLOT_MS;for(let t=start;t<start+SLOT_MS;t+=15*60000){const r=raidAt(site(i),t,TOKEN);if(r&&t>=r.hatchAt&&(!tier||r.tier===tier))return r;}}
 throw new Error('no raid');
}
const progress=(now:number):RaidProgress=>ensureRaids({},now);

test('raids are deterministic per post and slot, use real species and hide coordinates',()=>{
 const seen=new Set<number>();let none=0;
 for(let i=0;i<300;i++){const r=raidAt(site(i),DAY+3*3600000,TOKEN);if(!r){none++;continue;}seen.add(r.tier);
  assert.deepEqual(raidAt(site(i),DAY+3*3600000,TOKEN),r,'everyone sees the same raid');
  assert.ok(species(r.species).name&&movePool(r.species).fast.length,'boss is a playable species');
  assert.ok(r.hatchAt-r.visibleAt<=3600000&&r.visibleAt>=Math.floor(r.hatchAt/SLOT_MS)*SLOT_MS&&r.endsAt<=Math.floor(r.hatchAt/SLOT_MS)*SLOT_MS+SLOT_MS,'egg at most an hour, active window fits in the slot');
  assert.ok(!r.id.includes(site(i).id),'raid id hides the post id');
  const shown=publicRaid(r) as {site:Record<string,unknown>};assert.equal(shown.site.lat,undefined);assert.equal(shown.site.lng,undefined);}
 assert.ok(none>0&&seen.has(1)&&seen.has(3),'some posts rest, both one and three star raids occur');
 assert.ok(!seen.has(5),'no five-star raid while Oerbug models are not approved');
});

test('lobby joins are idempotent, bounded, and remote play costs one pass',()=>{
 const r=activeRaid(),now=r.hatchAt+1000,l=openLobby(r,1,now),gs:RaidProgress[]=[];
 const remote=progress(now);assert.throws(()=>joinLobby(l,remote,{uid:'r0',name:'R0',remote:true,joinedAt:0},now),/Zwermfluit/);
 claimFreePass(remote,now);assert.throws(()=>claimFreePass(remote,now),/al opgehaald/);
 assert.equal(joinLobby(l,remote,{uid:'r0',name:'R0',remote:true,joinedAt:0},now),true);assert.equal(remote.passes,0);
 assert.equal(joinLobby(l,remote,{uid:'r0',name:'R0',remote:true,joinedAt:0},now),false,'retry does not spend again');assert.equal(remote.passes,0);
 for(let i=1;i<4;i++){const g=progress(now);g.passes=1;joinLobby(l,g,{uid:'r'+i,name:'R',remote:true,joinedAt:0},now);gs.push(g);}
 const fifth=progress(now);fifth.passes=1;assert.throws(()=>joinLobby(l,fifth,{uid:'r4',name:'R',remote:true,joinedAt:0},now),/vier spelers/);assert.equal(fifth.passes,1);
 joinLobby(l,progress(now),{uid:'a',name:'A',remote:false,joinedAt:0},now);
 assert.ok(l.lobbyUntil>now);joinLobby(l,progress(now),{uid:'b',name:'B',remote:false,joinedAt:0},now);
 assert.equal(l.members.length,RAID_RULES.maxMembers);assert.equal(l.lobbyUntil,now,'a full lobby starts at once');
 assert.throws(()=>joinLobby(l,progress(now),{uid:'c',name:'C',remote:false,joinedAt:0},now),/vol/);
 leaveLobby(l,gs[0],'r1',now-1);assert.equal(gs[0].passes,1,'leaving before start refunds the pass');assert.equal(gs[0].lobby,null);
});

test('daily caps: three remote raids and one lobby at a time',()=>{
 const r=activeRaid(),now=r.hatchAt,g=progress(now);g.passes=3;
 for(let n=1;n<=3;n++){const l=openLobby(r,n,now);joinLobby(l,g,{uid:'u',name:'U',remote:true,joinedAt:0},now);if(n<3)assert.throws(()=>joinLobby(openLobby(r,9,now),g,{uid:'u',name:'U',remote:false,joinedAt:0},now),/andere zwerm/);g.lobby=null;}
 assert.equal(g.remote,3);g.passes=1;assert.throws(()=>joinLobby(openLobby(r,4,now),g,{uid:'u',name:'U',remote:true,joinedAt:0},now),/drie keer/);
 assert.throws(()=>openLobby(r,5,raidJoinableUntil(r)),/vertrekt bijna/);assert.throws(()=>openLobby(r,5,r.hatchAt-1),/nog niet uitgekomen/);
});

test('pooled damage wins together; rewards are once per raid and only for hitters',()=>{
 const r=activeRaid(),now=r.hatchAt,l=openLobby(r,1,now),a=progress(now),b=progress(now),c=progress(now);b.passes=1;
 joinLobby(l,a,{uid:'a',name:'A',remote:false,joinedAt:0},now);joinLobby(l,b,{uid:'b',name:'B',remote:true,joinedAt:0},now);joinLobby(l,c,{uid:'c',name:'C',remote:false,joinedAt:0},now);
 assert.equal(startLobby(l,now+LOBBY_MS-1),false);assert.equal(startLobby(l,now+LOBBY_MS),true);
 const max=l.fight!.maxHP;assert.equal(max,raidBossFighter(r).maxHP);assert.ok(raidBossFighter({...r,tier:3}).maxHP>raidBossFighter({...r,tier:1}).maxHP,'higher tiers are tougher');
 const damage={a:Math.ceil(max*.6),b:max,c:0,stranger:max*10};assert.equal(raidHP(l,{stranger:max*10}),max,'non-members never count');
 assert.equal(resolveLobby(l,{a:damage.a},now+LOBBY_MS+1000),false);assert.equal(resolveLobby(l,damage,now+LOBBY_MS+2000),true);assert.equal(l.status,'won');
 const ra=claimRaid(l,a,'a',damage,['b'])!,rb=claimRaid(l,b,'b',damage,[])!;
 assert.equal(ra.nets,RAID_TIERS[r.tier].nets+1+1,'local + one friend');assert.equal(rb.nets,RAID_TIERS[r.tier].nets+1,'remote top damage');
 assert.equal(claimRaid(l,a,'a',damage,['b']),null,'second claim pays nothing');assert.equal(a.rewards,1);
 assert.equal(claimRaid(l,c,'c',damage,[]),null,'zero damage earns nothing');assert.equal(c.lobby,null);
});

test('a fight that runs out of time fails and pays nothing',()=>{
 const r=activeRaid(),now=r.hatchAt,l=openLobby(r,1,now),g=progress(now);joinLobby(l,g,{uid:'a',name:'A',remote:false,joinedAt:0},now);
 assert.equal(resolveLobby(l,{a:1},now+LOBBY_MS+FIGHT_MS),true);assert.equal(l.status,'failed');assert.equal(claimRaid(l,g,'a',{a:1},[]),null);assert.equal(g.lobby,null);
 const empty=openLobby(r,2,now);assert.equal(startLobby(empty,now+LOBBY_MS),true);assert.equal(empty.status,'failed');
});

test('five rewards per UTC day, reset the next day',()=>{
 const r=activeRaid(),now=r.hatchAt,g=progress(now);g.rewards=RAID_RULES.rewardsPerDay;
 assert.throws(()=>joinLobby(openLobby(r,1,now),g,{uid:'a',name:'A',remote:false,joinedAt:0},now),/vijf/);
 ensureRaids({raids:g},now+86400000);assert.equal(g.rewards,0);assert.equal(g.remote,0);assert.ok(g.claimed.length<=40);
});

test('invites: friends only, bounded, no coordinates, deduplicated inbox',()=>{
 const r=activeRaid(),now=r.hatchAt,g=progress(now),friends=['f1','f2','f3','f4','f5','f6'];
 assert.equal(inviteIssue(g,r,['x'],friends,0,now),'Je kunt alleen geaccepteerde vrienden uitnodigen.');
 assert.equal(inviteIssue(g,r,['f1','f1'],friends,0,now),'Kies iedere vriend maar een keer.');
 assert.equal(inviteIssue(g,r,friends,friends,0,now),'Per zwerm kun je vijf vrienden uitnodigen.');
 assert.equal(inviteIssue(g,r,['f1'],friends,0,now),null);g.invites=20;assert.match(inviteIssue(g,r,['f1'],friends,0,now)!,/twintig/);
 const invite=raidInvite(r,{uid:'me',name:'Me'},now);assert.equal(JSON.stringify(invite).includes(String(r.site.lat)),false,'no coordinates in invites');
 let inbox=addInvite([],invite,now);inbox=addInvite(inbox,{...invite,at:now+1},now+1);assert.equal(inbox.length,1);
 for(let i=0;i<20;i++)inbox=addInvite(inbox,{...invite,raidId:'x'+i},now);assert.equal(inbox.length,RAID_RULES.inboxSize);
 assert.equal(addInvite(inbox,{...invite,raidId:'new'},r.endsAt).length,1,'expired invites are pruned');
});

test('hatch times are spread so raids exist throughout the day',()=>{
 // Only the first minutes after a slot boundary can be empty.
 for(let t=DAY+15*60000;t<DAY+86400000;t+=30*60000){let active=0;for(let i=0;i<200;i++){const r=raidAt(site(i),t,TOKEN);if(r&&t>=r.hatchAt)active++;}assert.ok(active>0,'some raid is active at '+new Date(t).toISOString());}
});
