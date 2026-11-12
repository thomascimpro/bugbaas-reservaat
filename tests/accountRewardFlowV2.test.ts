import {test} from 'node:test';
import assert from 'node:assert/strict';
import {needsAccountRecoveryV2,readAccountMemoryV2} from '../src/accountSessionV2';
import {mergeRewardBatchV2} from '../src/rewardBatchV2';
import {receiptForRunV3,resultActionV3} from '../src/arcade/resultFlowV3';
import type {ArcadeReceipt} from '../game/arcade/tapDuel';
test('lost or switched sign-in requires recovery instead of silently opening a new guest',()=>{
 const saved={uid:'old-player',name:'Ranger',email:'ranger@example.test',progress:true};
 assert.equal(needsAccountRecoveryV2(saved,null),true);assert.equal(needsAccountRecoveryV2(saved,'new-guest'),true);assert.equal(needsAccountRecoveryV2(saved,'old-player'),false);
 assert.equal(needsAccountRecoveryV2({...saved,email:null},null),true);assert.equal(needsAccountRecoveryV2(null,null),false);assert.equal(needsAccountRecoveryV2({...saved,email:null,progress:false},null),false);
 assert.deepEqual(readAccountMemoryV2(JSON.stringify(saved)),saved);assert.equal(readAccountMemoryV2('{broken'),null);assert.equal(readAccountMemoryV2('{"uid":7}'),null);
});
test('confirmed result survives an unrelated later result; only its own updated receipt replaces it',()=>{
 const original={runId:'run-one',score:80,dust:250,xp:100,qualified:false,won:true,personalBest:false} as ArcadeReceipt,later={...original,runId:'run-two',dust:0},updated={...original,dust:275};
 assert.equal(receiptForRunV3('run-one',later,original),original);assert.equal(receiptForRunV3('run-one',updated,original),updated);assert.equal(receiptForRunV3('run-new',later,original),undefined);assert.equal(receiptForRunV3(undefined,later,original),undefined);
 const crew={...original,crew:{encounter:'invasion-one',faction:'baret',tier:1,rewarded:true,practice:false,candy:3} as const};
 assert.equal(resultActionV3(crew),'done');assert.equal(resultActionV3({...crew,won:false}),'retry');assert.equal(resultActionV3(original),'again');
});
test('unread rewards accumulate across actions; reviewed rewards never come back in a later batch',()=>{
 const dust={id:'dust',name:'Stof',count:250,art:'glyph' as const,icon:'nectar'},xp={id:'xp',name:'XP',count:100,art:'glyph' as const,icon:'star'};
 const first=mergeRewardBatchV2(null,[dust,xp],1),second=mergeRewardBatchV2(first,[{...dust,count:50}],2);assert.equal(second.rows.find(r=>r.id==='dust')!.count,300);assert.equal(second.rows.find(r=>r.id==='xp')!.count,100);assert.equal(first.rows[0].count,250);
 const reviewed={...second,dismissed:['dust']},third=mergeRewardBatchV2(reviewed,[{...dust,count:25}],3);assert.equal(third.rows.find(r=>r.id==='dust')!.count,25);assert.equal(third.rows.find(r=>r.id==='xp')!.count,100);assert.deepEqual(third.dismissed,[]);
});
