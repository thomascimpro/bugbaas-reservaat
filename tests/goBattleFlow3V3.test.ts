import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureGo,rollGoBug,CHARGED,FAST} from '../game/goV2';
import {actGoBattle,advanceGoBattle,COMBAT_AIM,damage,makeGoBattle,prepareGoBattle,FLOW3_CHARGE_MS,FLOW3_DURATION_MS} from '../game/goBattleV2';
import type {GoBattleView} from '../game/goBattleV2';
import {BattleInputBuffer,battleReadyEnergy} from '../src/goBattleInputV2';

const NOW=Date.UTC(2026,10,3),SWIPE={fromX:200,toX:400,fromY:500,toY:500};
function battle(training=false){
 const players=['flow3-a','flow3-b'].map((uid,index)=>{const p=freshV2(uid,index?'FLOW5678':'FLOW1234',NOW);ensureGo(p,NOW);p.specimens=['ant','beetle','moth'].map((species,i)=>({id:uid+'-'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,uid+i),level:10,fast:'bite',charged:['cut','buzz']}}));p.go!.team=p.specimens.map(s=>s.id);return p;});
 const b={...makeGoBattle(players[0],players[1],'flow3-test',NOW,false,training),side:0} as GoBattleView;
 for(const team of b.teams)for(const unit of team){unit.hp=unit.maxHP=1000;unit.attack=100;unit.defense=100;}
 return prepareGoBattle(b,3) as GoBattleView;
}
function charge(b:GoBattleView,side:0|1=0){b.teams[side][b.active[side]].energy=100;actGoBattle(b,side,'charged','cut',NOW);advanceGoBattle(b,NOW+100);assert.equal(b.phase,'charge');return b.charge!;}

test('flow3 is explicit, keeps real fighters, and leaves already versioned flow2 unchanged',()=>{
 const b=battle();assert.equal(b.flow,3);assert.equal(b.aiPolicy,'squad-1');assert.equal(b.endsAt,NOW+FLOW3_DURATION_MS);assert.deepEqual(b.fast,[null,null]);assert.equal(b.teams[0][0].maxHP,1000);
 const old=structuredClone(b);old.flow=2;const snapshot=structuredClone(old);prepareGoBattle(old,3);assert.deepEqual(old,snapshot);
});

test('manual basics use move cooldown; spam and idle polling add no player attacks',()=>{
 const b=battle();actGoBattle(b,0,'fast',null,NOW);const due=b.fast[0]!.due;assert.equal(due,NOW+FAST.bite.turns*500);
 for(let i=1;i<500;i++)actGoBattle(b,0,'fast',null,NOW+i);assert.equal(b.fast[0]!.due,due);assert.equal(b.queued?.[0],undefined);
 advanceGoBattle(b,due+2000);assert.equal(b.teams[0][0].energy,FAST.bite.energy);assert.equal(b.fast[0],null);
});

test('server aim ellipse gives at most 15 percent extra basic damage and identical energy',()=>{
 const ordinary=battle(),aimed=structuredClone(ordinary),miss=structuredClone(ordinary),targetHP=ordinary.teams[1][0].hp;
 actGoBattle(ordinary,0,'fast',null,NOW);actGoBattle(aimed,0,'fast',{x:COMBAT_AIM.x,y:COMBAT_AIM.y},NOW);actGoBattle(miss,0,'fast',{x:0,y:0},NOW);
 for(const b of [ordinary,aimed,miss])advanceGoBattle(b,NOW+500);
 const base=targetHP-ordinary.teams[1][0].hp,bonus=targetHP-aimed.teams[1][0].hp;assert.equal(bonus,Math.floor(base*1.15));assert.equal(miss.teams[1][0].hp,ordinary.teams[1][0].hp);assert.equal(aimed.teams[0][0].energy,ordinary.teams[0][0].energy);
 assert.throws(()=>actGoBattle(battle(),0,'fast',{x:740,y:290,bonus:100},NOW),/richtpunt/);
});

test('charge spends shared energy once, resolves full power at1000ms and pauses both basics',()=>{
 const b=battle();actGoBattle(b,1,'fast',null,NOW);const c=charge(b),energy=b.teams[0][0].energy,enemy=b.teams[1][0],expected=damage(b.teams[0][0],enemy,CHARGED.cut.type,CHARGED.cut.power);
 assert.equal(c.deadline-c.startedAt,FLOW3_CHARGE_MS);assert.equal(energy,100-CHARGED.cut.energy);advanceGoBattle(b,c.deadline-1);assert.equal(enemy.hp,1000);assert.equal(b.phase,'charge');
 advanceGoBattle(b,c.deadline);assert.equal(enemy.hp,1000-expected);assert.equal(b.fast[1]!.due,NOW+1500);assert.equal(b.teams[0][0].energy,energy);assert.equal(b.teams[1][0].energy,0);
});

test('only one horizontal40px late-window dodge consumes a team dodge and reduces damage75percent',()=>{
 const b=battle(),c=charge(b,1),start=c.startedAt,full=damage(b.teams[1][0],b.teams[0][0],CHARGED.cut.type,CHARGED.cut.power);
 actGoBattle(b,0,'dodge',SWIPE,c.deadline-651,start);assert.equal(b.shields[0],2);
 actGoBattle(b,0,'dodge',{...SWIPE,toX:250},c.deadline-650,start);assert.equal(b.shields[0],2);
 actGoBattle(b,0,'dodge',{...SWIPE,toY:900},c.deadline-640,start);assert.equal(b.shields[0],2);
 actGoBattle(b,0,'dodge',SWIPE,c.deadline-600,start+1);assert.equal(b.shields[0],2);
 actGoBattle(b,0,'dodge',SWIPE,c.deadline-590,start);assert.equal(b.shields[0],1);assert.equal(c.dodged,true);
 actGoBattle(b,0,'dodge',SWIPE,c.deadline-580,start);assert.equal(b.shields[0],1);advanceGoBattle(b,c.deadline);assert.equal(b.teams[0][0].hp,1000-Math.ceil(full/4));
 actGoBattle(b,0,'dodge',SWIPE,c.deadline+1,start);assert.equal(b.shields[0],1);
});

test('chargeTap and shield cannot improve flow3 damage or consume a dodge',()=>{
 const b=battle(),c=charge(b,1);actGoBattle(b,0,'shield',true,c.startedAt+400,c.startedAt);actGoBattle(b,1,'chargeTap',[0,1,2,3,4,5,6,7],c.startedAt+500,c.startedAt);assert.equal(b.shields[0],2);assert.deepEqual(c.hits,[]);assert.equal(c.dodged,false);
});

test('simultaneous basics resolve together, including a double knockout',()=>{
 const b=battle();for(const team of b.teams){team[0].hp=1;for(const unit of team.slice(1))unit.hp=0;}
 actGoBattle(b,0,'fast',null,NOW);actGoBattle(b,1,'fast',null,NOW);advanceGoBattle(b,NOW+500);assert.equal(b.phase,'finished');assert.equal(b.winner,null);
});

test('same logical charge-start uses attack then deterministic tiebreak independent of submit order',()=>{
 const choices=[battle(),battle()];for(const b of choices){for(const team of b.teams)team[0].energy=100;b.teams[0][0].attack=120;}
 for(const side of [0,1] as const)actGoBattle(choices[0],side,'charged','cut',NOW);
 for(const side of [1,0] as const)actGoBattle(choices[1],side,'charged','cut',NOW);
 for(const b of choices){advanceGoBattle(b,NOW+100);assert.equal(b.charge!.side,0);assert.equal(b.teams[0][0].energy,100-CHARGED.cut.energy);assert.equal(b.teams[1][0].energy,100);}
 assert.deepEqual(choices[0],choices[1]);
});

test('switch retains per-bug energy,12second cooldown and300ms entry; KO auto-selects after5seconds',()=>{
 const b=battle();b.teams[0][0].energy=60;actGoBattle(b,0,'switch',1,NOW);advanceGoBattle(b,NOW+100);assert.equal(b.active[0],1);assert.equal(b.swapAt[0],NOW+12100);assert.equal(b.teams[0][0].energy,60);assert.equal(b.teams[0][1].readyAt,NOW+400);assert.throws(()=>actGoBattle(b,0,'switch',2,NOW+500),/wisselen/);
 const ko=battle();ko.teams[0][0].hp=1;actGoBattle(ko,1,'fast',null,NOW);advanceGoBattle(ko,NOW+500);assert.equal(ko.replaceAt[0],NOW+5500);advanceGoBattle(ko,NOW+5499);assert.equal(ko.active[0],0);advanceGoBattle(ko,NOW+5500);assert.equal(ko.active[0],1);
});

test('fixed AI has same cooldown/energy limits and sparse advance matches frequent polls',()=>{
 const a=battle(true),b=structuredClone(a);advanceGoBattle(a,NOW+10000);for(let t=20;t<=10000;t+=20)advanceGoBattle(b,NOW+t);assert.deepEqual(a,b);assert.equal(a.teams[0][0].energy,0);assert.ok(a.teams[1].every(f=>f.energy>=0&&f.energy<=100));assert.equal(a.aiPolicy,'squad-1');
});

test('180second timeout uses live count then HP ratios; raid timeout stays a loss and originaltimer',()=>{
 const b=battle();b.teams[1][0].hp=999;advanceGoBattle(b,b.endsAt);assert.equal(b.winner,0);
 const equal=battle();advanceGoBattle(equal,equal.endsAt);assert.equal(equal.winner,null);
 const fractions=battle();for(const [side,rows] of [[0,[[1,3],[1,7],[1,11]]],[1,[[1,11],[1,3],[1,7]]]] as const)rows.forEach(([hp,max],i)=>{fractions.teams[side][i].hp=hp;fractions.teams[side][i].maxHP=max;});advanceGoBattle(fractions,fractions.endsAt);assert.equal(fractions.winner,null);
 const raid=battle();raid.raid={} as never;raid.endsAt=NOW+240000;advanceGoBattle(raid,raid.endsAt);assert.equal(raid.winner,1);
});

test('forfeit during charge gives other side victory, retains spent energy and cancels pending attacks',()=>{
 const b=battle(),c=charge(b);actGoBattle(b,0,'forfeit',null,c.startedAt+50);assert.equal(b.phase,'finished');assert.equal(b.winner,1);assert.equal(b.teams[0][0].energy,100-CHARGED.cut.energy);assert.equal(b.charge,null);assert.deepEqual(b.fast,[null,null]);
});

test('buffer sends confirmed energy only and binds one dodge to its specific charge',()=>{
 const b=battle(),q=new BattleInputBuffer();actGoBattle(b,0,'fast',null,NOW);assert.equal(battleReadyEnergy(b),0);q.push(b,'fast',null,NOW+100);assert.equal(q.take(b,NOW+100,false),null);
 const defending=battle(),c=charge(defending,1);q.push(defending,'dodge',SWIPE,c.startedAt+400);assert.equal(q.take(defending,c.startedAt+400,true),null);const sent=q.take(defending,c.startedAt+450,false)!;assert.deepEqual(sent,{action:'dodge',value:SWIPE,chargeAt:c.startedAt});assert.equal(q.take(defending,c.startedAt+500,false),null);actGoBattle(defending,0,sent.action,sent.value,c.startedAt+450,sent.chargeAt);assert.equal(defending.shields[0],1);
});
