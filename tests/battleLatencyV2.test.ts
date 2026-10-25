import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import {GoServiceV2} from '../server/goServiceV2';
import type {Documents} from '../server/store';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,rollGoBug} from '../game/goV2';
import {makeGoBattle} from '../game/goBattleV2';
import type {GoBattle} from '../game/goBattleV2';
import {ensureGyms,gymSites,placeGymDefender,makeGymBattle} from '../game/gymsV2';
import type {Gym} from '../game/gymsV2';
import type {GameViewV2,PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,9,24,10);
class MeterStore extends SqliteStore{
 calls:string[][]=[];delay=0;
 constructor(private tick:(ms:number)=>void){super(':memory:');}
 override async run<T>(keys:string[],callback:(docs:Documents)=>T):Promise<T>{this.calls.push([...keys]);this.tick(this.delay);return super.run(keys,callback);}
}
function player(uid:string){
 const p=freshV2(uid,uid.padEnd(8,'0').slice(0,8).toUpperCase(),NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);ensureGyms(p,NOW);
 p.specimens=['ant','beetle','moth'].map((species,i)=>({id:uid+'-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:10}}));p.go!.team=p.specimens.map(s=>s.id);return p;
}
async function fixture(){
 const time={now:NOW},store=new MeterStore(ms=>time.now+=ms),service=new GoServiceV2(store,'local',()=>time.now);
 for(const uid of ['a','b'])await store.run(['v2Players:'+uid],d=>d.set('v2Players:'+uid,player(uid)));
 await service.state('a');await service.state('b');const a=await service.ensure('a'),b=await service.ensure('b'),battle=makeGoBattle(a,b,'latency-battle',NOW,true);
 battle.teams[0][0].go.charged=['cut'];battle.teams[0][0].energy=100;a.go!.battle=b.go!.battle=battle.id;
 await store.run(['v2Players:a','v2Players:b','v2GoBattles:'+battle.id],d=>{d.set('v2Players:a',a);d.set('v2Players:b',b);d.set('v2GoBattles:'+battle.id,battle);});
 return {store,service,time,a,battle};
}
const command=(v:GameViewV2,action:string,value:unknown)=>({type:'goAct',action,value,commandId:randomUUID(),expectedRevision:v.player.revision});

test('100 ms storage rounds allow all eight charged targets before their deadline and reuse atomic snapshots',async()=>{
 const {store,service,time,a}=await fixture();try{
  store.delay=100;store.calls=[];let v=await service.command('a',{type:'goAct',action:'charged',value:'cut',commandId:randomUUID(),expectedRevision:a.revision});
  assert.equal(store.calls.length,3);const deadline=v.goBattle!.charge!.deadline;
  for(let i=0;i<8;i++){store.calls=[];v=await service.command('a',command(v,'chargeTap',i));assert.equal(store.calls.length,2);assert.equal(v.goBattle!.charge!.hits.length,i+1);}
  assert.ok(time.now<deadline);store.calls=[];v=await service.state('a');assert.equal(store.calls.length,2);assert.equal(v.goBattle!.charge!.hits.length,8);
 }finally{store.close();}
});

test('battle acknowledgements read fresh balances, reject stale revisions, hide opponent intent and preserve receipt replay',async()=>{
 const {store,service,time,battle}=await fixture();try{
  battle.queued=[null,{kind:'charged',value:'cut',index:0,due:NOW+30000}];battle.teams[1][0].energy=50;
  await store.run(['v2GoBattles:'+battle.id],d=>d.set('v2GoBattles:'+battle.id,battle));let v=await service.state('a');
  await store.run(['v2Players:a'],d=>{(d.get('v2Players:a') as PlayerV2).go!.dust=321;});
  const action=command(v,'fast',null),ack=await service.command('a',action);assert.equal(ack.player.go!.dust,321);assert.equal(ack.goBattle!.queued![1],null);assert.equal(ack.goBattle!.teams[1][0].energy,0);assert.equal(ack.goBattle!.teams[1][1].species,'unknown');assert.ok(!JSON.stringify(ack).includes('hatchSeed'));
  const stored=await store.run(['v2GoBattles:'+battle.id],d=>d.get('v2GoBattles:'+battle.id) as GoBattle);assert.equal(stored.teams[1][0].energy,50);assert.equal(stored.queued![1]!.value,'cut');
  await assert.rejects(()=>service.command('a',command(v,'fast',null)),/voortgang is veranderd/);v=await service.command('a',action);assert.equal(v.player.revision,ack.player.revision);
  const forfeited=command(v,'forfeit',null);v=await service.command('a',forfeited);const after=structuredClone(v.player);time.now+=1000;const replay=await service.command('a',forfeited);assert.deepEqual(replay.player,after);assert.equal(replay.goBattle!.settled,true);
 }finally{store.close();}
});

test('cached gym document keys retain all defender owners for atomic settlement and single payouts',async()=>{
 const time={now:NOW},store=new MeterStore(ms=>time.now+=ms),service=new GoServiceV2(store,'local',()=>time.now);try{
  const post={id:'latency-gym',name:'Veldpost',lat:51.44,lng:5.47,source:'virtual' as const},site=gymSites([post])[0],gym:Gym={...site,team:null,revision:0,defenders:[]};
  const owners=[player('owner-a'),player('owner-b')],attacker=player('attacker');attacker.go!.gyms!.team='amber';owners[1].specimens[0].species='beetle';
  for(const p of [...owners,attacker]){p.walking={fix:{lat:post.lat,lng:post.lng,accuracy:5,timestamp:NOW},at:NOW,spawns:[],caught:[],day:'2026-10-24',count:0,posts:[post]};if(p!==attacker){p.go!.gyms!.team='fern';placeGymDefender(p,gym,p.specimens[0].id,p.uid,NOW);}}
  time.now+=600000;attacker.walking!.at=time.now;attacker.walking!.fix.timestamp=time.now;gym.defenders.forEach(d=>d.hearts=1);
  const battle=makeGymBattle(attacker,gym,attacker.go!.team,'latency-gym-battle',time.now);attacker.go!.battle=battle.id;
  for(const p of [...owners,attacker])await store.run(['v2Players:'+p.uid],d=>d.set('v2Players:'+p.uid,p));await store.run(['v2GoBattles:'+battle.id,'v2GoGyms:'+gym.id],d=>{d.set('v2GoBattles:'+battle.id,battle);d.set('v2GoGyms:'+gym.id,gym);});
  let v=await service.state(attacker.uid);store.calls=[];v=await service.command(attacker.uid,command(v,'fast',null));assert.equal(store.calls.length,3);const transaction=store.calls.find(keys=>keys.some(key=>key.startsWith('v2GoReceipts:')))!;for(const p of owners)assert.ok(transaction.includes('v2Players:'+p.uid));assert.deepEqual(v.goBattle!.gym!.defenders,[]);
  await store.run(['v2GoBattles:'+battle.id],d=>{const b=d.get('v2GoBattles:'+battle.id) as GoBattle;b.phase='finished';b.winner=0;b.teams[1].forEach(f=>f.hp=0);});v=await service.state(attacker.uid);assert.equal(v.goBattle!.settled,true);assert.equal(v.goGyms![0].defenders.length,0);
  for(const p of owners){const state=await service.state(p.uid);assert.equal(state.player.go!.gyms!.coins,1);assert.equal(state.player.go!.gyms!.deployed.length,0);}await service.state(attacker.uid);for(const p of owners)assert.equal((await service.state(p.uid)).player.go!.gyms!.coins,1);
 }finally{store.close();}
});
