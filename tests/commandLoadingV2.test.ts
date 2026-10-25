import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import type {Store} from '../server/store';
import {GoServiceV2} from '../server/goServiceV2';
import {rollGoBug,powerCost} from '../game/goV2';
import type {GameViewV2,PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,9,24,13);
const command=(v:GameViewV2,type:string,params:Record<string,unknown>={})=>({type,...params,commandId:randomUUID(),expectedRevision:v.player.revision});
function meter(){
 const db=new SqliteStore(':memory:'),calls={runs:0,queries:0},store:Store={run:async(keys,fn)=>{calls.runs++;return db.run(keys,fn);},listPlayers:()=>db.listPlayers(),query:async(...args)=>{calls.queries++;return db.query(...args);}};
 return {db,calls,service:new GoServiceV2(store,'local',()=>NOW),reset:()=>{calls.runs=calls.queries=0;}};
}
async function ready(service:GoServiceV2,db:SqliteStore,uid:string){
 await service.state(uid);
 await db.run(['v2Players:'+uid],d=>{const p=d.get('v2Players:'+uid) as PlayerV2;p.onboarded=true;p.go!.dust=5000;p.go!.candy.ant=100;p.specimens=['ant','beetle','moth'].map((species,i)=>({id:uid+'-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:10}}));p.go!.team=p.specimens.map(s=>s.id);});
 return service.state(uid);
}

test('ordinary actions reuse their committed player snapshot: two storage rounds, no unrelated social queries',async()=>{
 const {db,calls,service,reset}=meter();try{
  let v=await ready(service,db,'command-load'),before=structuredClone(v.player);
  reset();v=await service.command(v.player.uid,command(v,'settings',{sound:true,reducedMotion:false,largeText:false,music:false}));
  assert.deepEqual(calls,{runs:2,queries:0});assert.equal(v.player.settings.music,false);assert.equal(v.player.go!.dust,before.go!.dust);
  const power=command(v,'goPower',{id:v.player.specimens[0].id}),cost=powerCost(10)!;
  reset();v=await service.command(v.player.uid,power);assert.deepEqual(calls,{runs:2,queries:0});assert.equal(v.player.go!.dust,5000-cost.dust);assert.equal(v.player.specimens[0].go!.level,10.5);assert.deepEqual(v.player.specimens[0].go!.iv,before.specimens[0].go!.iv);
  const after=structuredClone(v.player);reset();v=await service.command(v.player.uid,power);assert.deepEqual(calls,{runs:2,queries:0});assert.deepEqual(v.player,after);
  await assert.rejects(()=>service.command(v.player.uid,{...power,commandId:randomUUID()}),/voortgang is veranderd/);
  reset();v=await service.command(v.player.uid,command(v,'worldLocate',{fix:{lat:51.44,lng:5.47,accuracy:5,timestamp:NOW}}));assert.deepEqual(calls,{runs:2,queries:0});assert.equal(v.player.walking!.fix.lat,51.44);assert.equal(v.player.walking!.seed,undefined);assert.ok(v.player.go!.cocoons!.items.every(c=>c.hatchSeed===undefined));
  const stored=await db.run(['v2Players:'+v.player.uid],d=>d.get('v2Players:'+v.player.uid) as PlayerV2);assert.ok(stored.walking!.seed);assert.equal(stored.go!.dust,after.go!.dust);
 }finally{db.close();}
});

test('social edits still invalidate warm metadata while ordinary edits keep it reusable',async()=>{
 const {db,calls,service,reset}=meter();try{
  let v=await service.state('social-load');reset();v=await service.command(v.player.uid,command(v,'profile',{name:'Social QA'}));assert.deepEqual(calls,{runs:2,queries:4});
  reset();await service.command(v.player.uid,command(v,'settings',{sound:true,reducedMotion:false,largeText:false,music:true}));assert.deepEqual(calls,{runs:2,queries:0});
 }finally{db.close();}
});

test('queued acknowledgements still match immediately and new battle snapshots retain private data masking',async()=>{
 const {db,calls,service,reset}=meter();try{
  let a=await ready(service,db,'match-load-a'),b=await ready(service,db,'match-load-b');
  a=await service.command(a.player.uid,command(a,'goQueue'));assert.ok(a.player.go!.queue);assert.equal(a.goBattle,null);
  b=await service.command(b.player.uid,command(b,'goQueue'));assert.equal(b.player.go!.queue,null);assert.ok(b.goBattle);a=await service.state(a.player.uid);assert.equal(a.goBattle!.id,b.goBattle!.id);
  a=await service.command(a.player.uid,command(a,'goAct',{action:'forfeit',value:null}));a=await service.command(a.player.uid,command(a,'goClose'));
  a=await service.command(a.player.uid,command(a,'goTrain'));assert.ok(a.goBattle!.training);const other=(1-a.goBattle!.side) as 0|1;assert.equal(a.goBattle!.teams[other][0].attack,0);assert.equal(a.goBattle!.teams[other][1].species,'unknown');
  reset();a=await service.command(a.player.uid,command(a,'goAct',{action:'fast',value:null}));assert.deepEqual(calls,{runs:2,queries:0});assert.equal(a.goBattle!.teams[other][0].attack,0);
 }finally{db.close();}
});
