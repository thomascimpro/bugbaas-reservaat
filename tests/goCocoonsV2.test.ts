import {test} from 'node:test';
import assert from 'node:assert/strict';
import {COCOON_POOLS,addCocoonIncubator,awardCocoon,cocoonActive,cocoonWalked,ensureCocoons,hatchCocoon,startCocoon} from '../game/goCocoonsV2';
import {rng} from '../game/catalogV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,rollGoBug} from '../game/goV2';
import {freshV2} from '../game/safariV2';
import {ensureAdventure} from '../game/tacticsV2';
import {locate,WALK_MODELS} from '../game/walkingV2';
import {recordWalk} from '../game/walkingRewardsV2';
import type {PlayerV2,Specimen} from '../game/typesV2';

const NOW=Date.UTC(2026,9,21,10),FIX={lat:52.0928,lng:5.1339,accuracy:8};
function player(){const p=freshV2('cocoon-player','COCOON12',NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);ensureCocoons(p,'private-server-seed',NOW);return p;}
function setMeters(p:PlayerV2,n:number){p.field!.walk={meters:n,dayMeters:n,anchor:FIX,at:NOW};}
function realCatch(p:PlayerV2,id:string,now=NOW){const s:Specimen={id,species:'ant',source:'walking',obtainedAt:now,shiny:false,favorite:false,level:1,hearts:0,item:null,go:rollGoBug('ant','catch')};p.specimens.push(s);return s;}
function dropSeed(km?:2|5){for(let i=0;i<10000;i++){const s='drop-'+i;if(rng(s+':cocoon-drop')()<.1&&(!km||(rng(s+':cocoon-distance')()<.75?2:5)===km))return s;}throw Error('No drop seed');}

test('one free 2km cocoon initializes existing and new profiles once, without changing older bugs or wallets',()=>{
 const p=player(),before=structuredClone(p),g=p.go!.cocoons!;
 assert.equal(g.items.length,1);assert.equal(g.items[0].km,2);assert.equal(g.items[0].hatchSeed,'private-server-seed:first-cocoon');
 assert.equal(ensureCocoons(p,'another-secret',NOW+86400000),g);assert.deepEqual(p,before);
 g.items=[];ensureCocoons(p,'third-secret',NOW+172800000);assert.equal(g.items.length,0);
 assert.ok([...COCOON_POOLS[2],...COCOON_POOLS[5]].every(id=>WALK_MODELS[id]));
 assert.equal(new Set([...COCOON_POOLS[2],...COCOON_POOLS[5]]).size,30);
});

test('only actual new server catches can receive a finite 10 percent drop; full bags consume the chance',()=>{
 const p=player(),seed=dropSeed(5);assert.equal(awardCocoon(p,seed,NOW),false);
 const s=realCatch(p,'catch-1');for(const source of ['starter','training','cocoon']){s.source=source;assert.equal(awardCocoon(p,seed,NOW),false);}
 s.source='walking';assert.equal(awardCocoon(p,seed,NOW+1),false);assert.equal(awardCocoon(p,seed,NOW),true);
 assert.equal(p.go!.cocoons!.items[1].km,5);assert.equal(awardCocoon(p,'different-secret',NOW),false);
 realCatch(p,'catch-2');assert.equal(awardCocoon(p,dropSeed(2),NOW),true);assert.equal(p.go!.cocoons!.items.length,3);
 realCatch(p,'catch-full');assert.equal(awardCocoon(p,seed,NOW),false);p.go!.cocoons!.items.pop();assert.equal(awardCocoon(p,seed,NOW),false);
 realCatch(p,'failed-roll');let noDrop='';for(let i=0;i<100;i++)if(rng('no-'+i+':cocoon-drop')()>=.1){noDrop='no-'+i;break;}
 assert.equal(awardCocoon(p,noDrop,NOW),false);assert.equal(awardCocoon(p,seed,NOW),false);
});

test('one active cocoon counts only distance since start, never elapsed time, preexisting distance or a second incubator',()=>{
 const p=player();setMeters(p,9000);const g=p.go!.cocoons!,id=g.items[0].id;
 assert.throws(()=>startCocoon(p,'missing',NOW));startCocoon(p,id,NOW);assert.equal(cocoonWalked(p),0);
 assert.throws(()=>startCocoon(p,id,NOW));assert.throws(()=>hatchCocoon(p,NOW+86400000));
 setMeters(p,10999);assert.equal(cocoonWalked(p),1999);assert.throws(()=>hatchCocoon(p,NOW+86400000));
 setMeters(p,11000);assert.equal(cocoonWalked(p),2000);const count=p.specimens.length;hatchCocoon(p,NOW+86400000);
 assert.equal(p.specimens.length,count+1);assert.equal(g.active,null);assert.equal(g.items.length,0);assert.equal(g.hatched,1);
 assert.throws(()=>hatchCocoon(p,NOW+172800000));ensureCocoons(p,'new-seed',NOW);assert.equal(g.items.length,0);
});

test('existing GPS validation excludes stationary drift, driving, poor accuracy and closed-map gaps from the cocoon',()=>{
 const p=player();locate(p,FIX,'map-secret',NOW);recordWalk(p,NOW);startCocoon(p,p.go!.cocoons!.items[0].id,NOW);
 const update=(lat:number,accuracy:number,ms:number)=>{p.walking!.fix={...FIX,lat,accuracy};recordWalk(p,NOW+ms);};
 update(FIX.lat+.00001,8,12000);assert.equal(cocoonWalked(p),0);
 update(FIX.lat+.00015,8,24000);const credited=cocoonWalked(p);assert.ok(credited>=16);
 update(FIX.lat+.001,8,25000);update(FIX.lat+.0012,60,40000);update(FIX.lat+.0014,8,300000);
 assert.equal(cocoonWalked(p),credited);assert.throws(()=>hatchCocoon(p,NOW+300000));
});

test('committed seeds keep hatch species, shiny, moves and IV stable across claim time; stats and progression survive',()=>{
 const p=player(),old=realCatch(p,'existing');old.go!.level=35;old.go!.iv=[15,3,7];old.go!.charged=['cut','buzz'];
 const older=structuredClone(old),wallet=p.nectar,parts=p.adventure!.parts,daily=structuredClone(p.field!.daily),trainer=p.go!.trainer!;
 trainer.catchDay='2026-10-20';trainer.catchStreak={days:6,lastDay:'2026-10-20'};const xp=trainer.xp,dust=p.go!.dust,inventory=structuredClone(p.field!.inventory);
 startCocoon(p,p.go!.cocoons!.items[0].id,NOW);setMeters(p,2000);const q=structuredClone(p),a=hatchCocoon(p,NOW),b=hatchCocoon(q,NOW+86400000);
 assert.equal(a.species,b.species);assert.equal(a.shiny,b.shiny);assert.deepEqual(a.go,b.go);assert.ok(COCOON_POOLS[2].includes(a.species));assert.ok(a.go!.iv.every(n=>n>=10&&n<=15));
 assert.deepEqual(p.specimens.find(s=>s.id===old.id),older);assert.equal(p.go!.dust,dust+500);assert.equal(p.go!.candy[a.species==='moth'?'caterpillar':a.species],10);assert.equal(p.go!.cocoons!.lastHatch!.dust,500);assert.equal(p.go!.cocoons!.lastHatch!.candy,10);
 assert.equal(trainer.xp,xp+600);assert.equal(trainer.catchDay,'2026-10-20');assert.deepEqual(trainer.catchStreak,{days:6,lastDay:'2026-10-20'});
 assert.equal(p.nectar,wallet);assert.equal(p.adventure!.parts,parts);assert.deepEqual(p.field!.inventory,inventory);assert.deepEqual(p.field!.daily,daily);
 assert.ok(p.discovered.includes(a.species));assert.ok(p.go!.dex!.includes(a.species));assert.equal(p.go!.entries![a.species].caughtAt,NOW);
});

test('5km needs its full distance; battle and missing private seed prevent start or claim',()=>{
 const p=player();realCatch(p,'rare');awardCocoon(p,dropSeed(5),NOW);const rare=p.go!.cocoons!.items.find(c=>c.km===5)!;
 p.go!.battle='busy';assert.throws(()=>startCocoon(p,rare.id,NOW));p.go!.battle=null;startCocoon(p,rare.id,NOW);
 setMeters(p,4999);assert.throws(()=>hatchCocoon(p,NOW));setMeters(p,5000);p.go!.queue={league:'great',at:NOW,until:NOW+120000};assert.throws(()=>hatchCocoon(p,NOW));p.go!.queue=null;
 const seed=rare.hatchSeed;delete rare.hatchSeed;assert.throws(()=>hatchCocoon(p,NOW));rare.hatchSeed=seed;
 const dust=p.go!.dust,s=hatchCocoon(p,NOW);assert.ok(COCOON_POOLS[5].includes(s.species));assert.equal(p.go!.dust,dust+1500);assert.equal(p.go!.cocoons!.lastHatch!.candy,20);assert.equal(awardCocoon(p,dropSeed(2),NOW),false);
});

test('the fixed one-in-64 shiny roll records its actual shiny specimen and dex entry',()=>{
 const p=player(),item=p.go!.cocoons!.items[0];let seed='';for(let i=0;i<10000;i++)if(rng('shiny-'+i+':shiny')()<1/64){seed='shiny-'+i;break;}
 assert.ok(seed);item.hatchSeed=seed;startCocoon(p,item.id,NOW);setMeters(p,2000);const s=hatchCocoon(p,NOW);
 assert.equal(s.shiny,true);assert.ok(p.shinies.includes(s.species));assert.equal(p.go!.entries![s.species].shinyAt,NOW);
 assert.equal(p.go!.cocoons!.lastHatch!.id,s.id);assert.equal(p.go!.cocoons!.lastHatch!.shiny,true);
});

test('extra incubators count simultaneous distance from independent starts while the unlimited old slot stays intact',()=>{
 const p=player(),g=p.go!.cocoons!,basic=g.items[0];setMeters(p,3000);startCocoon(p,basic.id,NOW);
 const preserved=structuredClone(g.active),incubator=addCocoonIncubator(p);
 realCatch(p,'parallel-drop');awardCocoon(p,dropSeed(5),NOW);const extra=g.items[1];setMeters(p,4000);
 startCocoon(p,extra.id,NOW+1000,incubator.id);assert.deepEqual(g.active,preserved);assert.equal(incubator.uses,3);
 assert.throws(()=>startCocoon(p,extra.id,NOW+1000,incubator.id),/al uitgebroed/);
 assert.equal(cocoonWalked(p,basic.id),1000);assert.equal(cocoonWalked(p,extra.id),0);
 setMeters(p,5000);hatchCocoon(p,NOW+2000);assert.equal(g.active,null);assert.equal(cocoonWalked(p,extra.id),1000);assert.equal(incubator.uses,3);
 setMeters(p,9000);const bug=hatchCocoon(p,NOW+3000,extra.id);assert.equal(bug.id,'hatched-'+extra.id);assert.equal(incubator.uses,2);assert.equal(g.parallel?.length,0);assert.throws(()=>hatchCocoon(p,NOW+4000,extra.id));
});

test('limited incubators cannot be double-booked, forged, or reused after their final hatch',()=>{
 const p=player(),g=p.go!.cocoons!,machine=addCocoonIncubator(p,1),first=g.items[0];
 realCatch(p,'drop-other');awardCocoon(p,dropSeed(2),NOW);const other=g.items[1];
 assert.throws(()=>startCocoon(p,first.id,NOW,'forged'));assert.equal(g.active,null);assert.equal(g.parallel,undefined);
 startCocoon(p,first.id,NOW,machine.id);assert.throws(()=>startCocoon(p,other.id,NOW,machine.id),/bezet/);
 startCocoon(p,other.id,NOW);setMeters(p,2000);const active=structuredClone(g.active);hatchCocoon(p,NOW+1,first.id);
 assert.deepEqual(g.active,active);assert.equal(cocoonActive(p,other.id)?.id,other.id);assert.equal(g.incubators?.length,0);assert.equal(machine.uses,0);
 assert.throws(()=>startCocoon(p,other.id,NOW+2,machine.id));assert.throws(()=>hatchCocoon(p,NOW+2,{}));
 assert.throws(()=>addCocoonIncubator(p,0));assert.throws(()=>addCocoonIncubator(p,Infinity));
});
