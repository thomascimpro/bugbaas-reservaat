import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureField} from '../game/fieldV2';
import {ensureGo,rollGoBug,transferManyGo} from '../game/goV2';
import {catchXP,claimTrainer,ensureTrainer,grantXP,levelXP,trainerLevel} from '../game/trainerV2';
import {claimGoDaily} from '../game/dailyResearchV2';
const NOW=Date.UTC(2026,9,20,14);
function player(){const p=freshV2('trainer','TRAIN123',NOW);ensureField(p,NOW);ensureGo(p,NOW);return p;}
test('trainer XP grows to level 40, historical catches receive no retroactive resource claim, and level rewards claim once',()=>{
 const p=player();delete p.go!.trainer;p.field!.total.catches=20;const t=ensureTrainer(p);assert.equal(t.xp,2000);assert.equal(trainerLevel(t.xp),3);assert.throws(()=>claimTrainer(p));grantXP(p,2500);assert.equal(trainerLevel(t.xp),4);const before=p.go!.dust,nets=p.field!.inventory.basic;claimTrainer(p);assert.equal(p.go!.dust,before+200);assert.equal(p.field!.inventory.basic,nets+5);assert.throws(()=>claimTrainer(p));assert.throws(()=>grantXP(p,-1));assert.equal(trainerLevel(levelXP(40)),40);assert.equal(trainerLevel(1e9),40);
});
test('active catch skill earns more XP; first/new species bonuses are factual and shiny has no separate XP advantage',()=>{
 const p=player(),q=player();assert.equal(catchXP(p,true,NOW,'perfect',true),1420);assert.equal(catchXP(q,true,NOW,'perfect',true),1420);assert.equal(catchXP(p,false,NOW),100);assert.equal(catchXP(q,false,NOW,'great'),200);assert.equal(catchXP(p,false,NOW+86400000),600);
});
test('daily research checks server progress and cannot be claimed twice or without completing the requirement',()=>{
 const p=player();for(const id of ['catch','walk','skill'])assert.throws(()=>claimGoDaily(p,id));p.field!.walk={meters:500,dayMeters:500,anchor:null,at:NOW};const basic=p.field!.inventory.basic;claimGoDaily(p,'walk');assert.equal(p.field!.inventory.basic,basic+5);assert.equal(p.go!.dust,150);assert.equal(p.go!.trainer!.xp,300);assert.throws(()=>claimGoDaily(p,'walk'));p.field!.daily.skilled=1;claimGoDaily(p,'skill');assert.equal(p.go!.dust,350);assert.throws(()=>claimGoDaily(p,'fake'));
});
test('batch release validates every owned specimen before changing anything and preserves favorite/shiny/buddy/team bugs',()=>{
 const p=player();for(let i=0;i<3;i++)p.specimens.push({id:'batch-'+i,species:'ant',go:rollGoBug('ant','batch'+i),level:1,source:'walking',shiny:false,favorite:false,hearts:0,item:null,obtainedAt:NOW});const a=p.specimens.find(s=>s.id==='batch-0')!,b=p.specimens.find(s=>s.id==='batch-1')!;const original=p.specimens.length,candy=p.go!.candy.ant??0;
 for(const protection of ['favorite','shiny','buddy','team']){a.favorite=protection==='favorite';a.shiny=protection==='shiny';p.buddy=protection==='buddy'?a.id:'';p.go!.team=protection==='team'?[a.id]:[];assert.throws(()=>transferManyGo(p,[b.id,a.id]));assert.equal(p.specimens.length,original);assert.equal(p.go!.candy.ant??0,candy);}
 a.favorite=false;a.shiny=false;p.buddy='';p.go!.team=[];transferManyGo(p,[a.id,b.id]);assert.equal(p.specimens.length,original-2);assert.equal(p.go!.candy.ant,candy+2);assert.throws(()=>transferManyGo(p,['batch-2','batch-2']));
});
