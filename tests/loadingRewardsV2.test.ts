import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {SqliteStore} from '../server/sqlite';
import type {Store} from '../server/store';
import {GoServiceV2} from '../server/goServiceV2';
import {rewardChanges} from '../src/resourceGainV2';
import {wildShiny,WILD_SHINY_ODDS,COCOON_SHINY_ODDS} from '../game/shinyV2';
import {readFileSync} from 'node:fs';
import type {PlayerV2} from '../game/typesV2';
import {rollGoBug} from '../game/goV2';
import {makeGoBattle} from '../game/goBattleV2';
import type {GoBattle} from '../game/goBattleV2';
test('state reuses social data while balances stay fresh and metadata queries run together',async()=>{
 const db=new SqliteStore(':memory:');let now=Date.UTC(2026,9,23),runs=0,queries=0,inflight=0,peak=0;
 const store:Store={run:async(keys,fn)=>{runs++;return db.run(keys,fn);},listPlayers:()=>db.listPlayers(),query:async(...args)=>{queries++;peak=Math.max(peak,++inflight);await new Promise(resolve=>setTimeout(resolve,5));try{return await db.query(...args);}finally{inflight--;}}};
 try{const service=new GoServiceV2(store,'local',()=>now);await service.state('load-qa');assert.equal(peak,4);assert.equal(queries,4);runs=queries=0;
  let v=await service.state('load-qa');assert.equal(runs,1);assert.equal(queries,0);
  await db.run(['v2Players:load-qa'],d=>{const p=d.get('v2Players:load-qa') as PlayerV2;p.go!.dust+=123;p.revision++;});v=await service.state('load-qa');assert.equal(v.player.go!.dust,123);
  await service.command('load-qa',{type:'profile',name:'Load QA',commandId:randomUUID(),expectedRevision:v.player.revision});assert.equal(queries,4);
  queries=0;now+=10001;await service.state('load-qa');assert.equal(queries,4);
 }finally{db.close();}
});
test('reward feedback shows authoritative positive inventory changes once, with exact types/counts',async()=>{
 const db=new SqliteStore(':memory:');try{const service=new GoServiceV2(db,'local');const v=await service.state('reward-qa'),before=v.player;before.onboarded=true;const after=structuredClone(before);
  after.field!.inventory.basic-=1;after.field!.inventory.blue+=5;after.go!.dust+=500;after.go!.candy.ant=6;after.go!.gyms!.coins+=50;after.go!.fastTMs++;after.go!.trainer!.xp+=700;
  const rows=rewardChanges(before,after);assert.equal(rows.find(r=>r.id==='field:blue')!.count,5);assert.equal(rows.find(r=>r.id==='candy:ant')!.count,6);assert.equal(rows.find(r=>r.id==='dust')!.count,500);assert.equal(rows.find(r=>r.id==='coins')!.count,50);assert.ok(!rows.some(r=>r.id==='field:basic'));
  const metadata=JSON.parse(readFileSync('assets/v2/ui/metadata.json','utf8'));for(const row of rows.filter(r=>r.art==='glyph'))assert.ok(Object.values(metadata).some((atlas:any)=>atlas.frames?.[row.icon]),'Missing reward icon '+row.icon);
  assert.deepEqual(rewardChanges(after,structuredClone(after)),[]);assert.deepEqual(rewardChanges(null,after),[]);assert.deepEqual(rewardChanges({...before,uid:'other'},after),[]);assert.equal(after.field!.inventory.basic,before.field!.inventory.basic-1);
 }finally{db.close();}
});
test('wild shiny uses the stable one-in-512 rule while cocoon odds remain one-in-64',()=>{
 assert.equal(WILD_SHINY_ODDS,512);assert.equal(COCOON_SHINY_ODDS,64);let shinies=0;for(let i=0;i<50000;i++)shinies+=Number(wildShiny('owned-fixed-fixture','spawn-'+i));assert.ok(shinies>60&&shinies<145,String(shinies));
 for(let i=0;i<100;i++)assert.equal(wildShiny('seed','spawn-'+i),wildShiny('seed','spawn-'+i));
});
test('an opponent never receives the other trainer queued intent, and masking preserves stored input',async()=>{
 const db=new SqliteStore(':memory:'),now=Date.UTC(2026,9,24),service=new GoServiceV2(db,'local',()=>now);try{
  const players=await Promise.all(['queue-a','queue-b'].map(id=>service.ensure(id)));
  for(const p of players){p.specimens=['ant','beetle','moth'].map((species,i)=>({id:p.uid+'-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:now,source:'walking',hearts:0,item:null,go:rollGoBug(species,p.uid+i)}));p.go!.team=p.specimens.map(s=>s.id);p.go!.battle='mask-qa';}
  const battle=makeGoBattle(players[0],players[1],'mask-qa',now,false);battle.fast=[{index:0,due:now+500},{index:0,due:now+500}];battle.queued=[{index:0,due:now+500,kind:'fast',value:null},{index:0,due:now+500,kind:'switch',value:1}];
  await db.run(['v2Players:queue-a','v2Players:queue-b','v2GoBattles:mask-qa'],d=>{for(const p of players)d.set('v2Players:'+p.uid,p);d.set('v2GoBattles:mask-qa',battle);});
  const a=await service.state('queue-a'),b=await service.state('queue-b');assert.equal(a.goBattle!.queued![0]!.kind,'fast');assert.equal(a.goBattle!.queued![1],null);assert.equal(b.goBattle!.queued![1]!.kind,'switch');assert.equal(b.goBattle!.queued![0],null);
  assert.equal((await db.run(['v2GoBattles:mask-qa'],d=>d.get('v2GoBattles:mask-qa') as GoBattle)).queued![1]!.kind,'switch');
 }finally{db.close();}
});
