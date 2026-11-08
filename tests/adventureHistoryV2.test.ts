import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureGo} from '../game/goV2';
import {syncAdventure,mergeGPSWalk,type HealthSnapshot} from '../game/adventureSyncV2';
import {walkDay,creditWalk} from '../game/walkCatchV2';
const start=Date.UTC(2026,10,7,22),later=Date.UTC(2026,10,8,1);
const snapshot=(dayUTC:string,steps:number,meters:number,capturedAt:number):HealthSnapshot=>({dayUTC,steps,meters,capturedAt,source:'health-connect',distanceBasis:'measured'});
const batch=(capturedAt:number,...days:HealthSnapshot[])=>({source:'health-connect',capturedAt,days});
const player=()=>{const p=freshV2('history-qa','HISTORY1',start);ensureGo(p,start);return p;};

test('closed-app history pays the uncredited part before midnight and today exactly once',()=>{
 const p=player();syncAdventure(p,snapshot('2026-11-07',1000,720,start),start);
 assert.equal(syncAdventure(p,snapshot('2026-11-07',2000,1400,start+3600000),start+3600000),680);
 const update=batch(later,snapshot('2026-11-07',3000,2100,later),snapshot('2026-11-08',1500,1000,later));
 assert.equal(syncAdventure(p,update,later),1700);assert.equal(p.field!.walk!.meters,2380);assert.equal(p.field!.walk!.dayMeters,1000);
 assert.equal(syncAdventure(p,update,later),0);assert.equal(p.field!.walk!.meters,2380);
 const late=later+3600000;
 assert.equal(syncAdventure(p,batch(late,snapshot('2026-11-07',3600,2500,late),snapshot('2026-11-08',1500,1000,late)),late),400);
 assert.equal(p.field!.walk!.meters,2780);assert.equal(p.field!.walk!.dayMeters,1000);
});
test('previous-day GPS already paid after a health sync is not paid again from late history',()=>{
 const p=player();syncAdventure(p,snapshot('2026-11-07',0,0,start),start);
 syncAdventure(p,snapshot('2026-11-07',1500,1000,start+3600000),start+3600000);
 p.field!.walk!.meters+=1500;p.field!.walk!.dayMeters+=1500;mergeGPSWalk(p,1000,1000,start+3600000);
 assert.equal(p.field!.walk!.meters,1500);
 assert.equal(syncAdventure(p,batch(later,snapshot('2026-11-07',1500,1000,later),snapshot('2026-11-08',0,0,later)),later),0);
 assert.equal(p.field!.walk!.meters,1500);
});
test('first connection ignores pre-link history and starts today at its real provider baseline',()=>{
 const p=player();assert.equal(syncAdventure(p,batch(later,snapshot('2026-11-07',8000,6000,later),snapshot('2026-11-08',3000,2200,later)),later),0);
 assert.equal(p.field!.walk!.meters,0);assert.equal(p.field!.healthSync!.baselineMeters,2200);
});
test('history rejects duplicated days, stale batches, fabricated distance and dates outside the thirty-day window',()=>{
 const today=snapshot('2026-11-08',100,72,later);
 for(const bad of [batch(later,today,today),batch(later-120001,today),batch(later,{...today,meters:10000}),batch(later,snapshot('2026-10-01',100,72,later),today)]){
  const p=player();assert.throws(()=>syncAdventure(p,bad,later));assert.equal(p.field?.walk?.meters??0,0);
 }
});
test('earned autocatch credit survives midnight while the new daily catch limit starts fresh',()=>{
 const p=player();p.go!.auto.enabled=true;const before=walkDay(p,start);creditWalk(before,1000,1.3);before.caught=3;before.credit-=600;
 const after=walkDay(p,later);assert.equal(after.caught,0);assert.equal(after.credit,400);
});

test('returning after more than a week recovers intervening daily distances within Health Connect history',()=>{
 const p=player();syncAdventure(p,snapshot('2026-11-07',0,0,start),start);
 const returned=start+10*86400000,days=Array.from({length:11},(_,i)=>snapshot(new Date(start+i*86400000).toISOString().slice(0,10),1500,1000,returned));
 assert.equal(syncAdventure(p,batch(returned,...days),returned),11000);assert.equal(p.field!.walk!.dayMeters,1000);
 assert.equal(syncAdventure(p,batch(returned,...days),returned),0);assert.equal(p.field!.walk!.meters,11000);
});
