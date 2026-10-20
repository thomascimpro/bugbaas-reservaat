import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {appendRecord,validateRecord} from '../scripts/qa/record';
import type {QaRecord} from '../scripts/qa/record';

const REV='a'.repeat(40),TEST_REV='sha256:'+'b'.repeat(64);
function record(runId='QA-20261020-record-1'):QaRecord{return {runId,taskId:'BB-01a',testId:'QA-RECORD',result:'PASS',actor:'Codex test fixture',actorType:'agent',revision:REV,testRevision:TEST_REV,environment:'Node 24 / isolated filesystem fixture',startedAt:'2026-10-20T13:45:00.000Z',evidencePath:'.local/qa-record-test.log',scope:['scripts/qa/record.ts','tests/qaRecord.test.ts'],origin:'direct'};}
async function journal(run:(path:string)=>Promise<void>){const dir=await mkdtemp(join(tmpdir(),'bugbaas-qa-record-'));try{await run(join(dir,'runs.jsonl'));}finally{await rm(dir,{recursive:true,force:true});}}

test('QA records retain explicit authorship, code/test snapshots, scope and evidence without sharing mutable input',()=>{
 const input=record(),actual=validateRecord(input);assert.deepEqual(actual,input);input.scope.push('another.ts');assert.equal(actual.scope.length,2);
});

test('PASS requires a real snapshot, actor, environment, scope and evidence instead of inferred historical success',()=>{
 for(const field of ['actor','actorType','revision','testRevision','environment','startedAt','scope','evidencePath']){const invalid={...record()};delete invalid[field as keyof QaRecord];assert.throws(()=>validateRecord(invalid),field);}
 for(const revision of ['HEAD','historical','unknown','abcd'])assert.throws(()=>validateRecord({...record(),revision}));
 for(const patch of [{scope:[]},{scope:['a.ts','a.ts']},{environment:'  '},{actor:''},{startedAt:'not-a-date'},{startedAt:'2026-02-31T00:00:00.000Z'},{result:'HIST-GROEN'},{actorType:'unknown'},{inferredAuthor:'Windows owner'}])assert.throws(()=>validateRecord({...record(),...patch}));
});

test('reused results are explicit skips and cannot masquerade as a new direct PASS',()=>{
 const reused={...record('QA-20261020-reused'),result:'SKIP_REUSED',origin:'reused',previousRunId:'QA-20261020-record-1',skipReason:'Code, fixtures and runtime have identical fingerprints'};
 assert.equal(validateRecord(reused).origin,'reused');
 for(const patch of [{result:'PASS'},{origin:'direct'},{previousRunId:undefined},{skipReason:undefined}])assert.throws(()=>validateRecord({...reused,...patch}));
 assert.throws(()=>validateRecord({...record(),previousRunId:record().runId}));
});

test('record metadata rejects credentials, exact synthetic GPS pairs and unsafe evidence paths',()=>{
 const syntheticCoordinates=[12.345678,98.765432].join(',');
 for(const environment of ['Authorization: Bearer synthetic-test-value','token=synthetic-test-value','eyJ'+ 'a'.repeat(12)+'.'+'b'.repeat(14)+'.'+'c'.repeat(14),'GPS '+syntheticCoordinates,'-----BEGIN PRIVATE KEY-----','latitude='+12.345678,'token%3Dsynthetic-value'])assert.throws(()=>validateRecord({...record(),environment}));
 for(const evidencePath of ['../outside.log','C:/private/output.log','https://example.invalid/log?token=test','runs.sqlite','.env','%2e%2e/outside.log','foo\nforged.log'])assert.throws(()=>validateRecord({...record(),evidencePath}));
 assert.throws(()=>validateRecord({...record(),scope:['../outside.ts']}));
});

test('journal appends preserve previous bytes and reject duplicate IDs without rewriting history',async()=>journal(async file=>{
 const first=record();await appendRecord(file,first);const bytes=await readFile(file,'utf8');assert.deepEqual(JSON.parse(bytes),first);assert.ok(bytes.endsWith('\n'));
 const second=record('QA-20261020-record-2');await appendRecord(file,second);const appended=await readFile(file,'utf8');assert.ok(appended.startsWith(bytes));assert.deepEqual(JSON.parse(appended.slice(bytes.length)),second);
 const before=await readFile(file,'utf8');await assert.rejects(()=>appendRecord(file,second),/duplicate/i);assert.equal(await readFile(file,'utf8'),before);
}));

test('skip reuse requires an existing direct PASS for the same test, inputs, scope and runtime',async()=>journal(async file=>{
 const first=record(),skip:QaRecord={...record('QA-20261020-skip'),result:'SKIP_REUSED',origin:'reused',previousRunId:first.runId,skipReason:'Inputs and runtime unchanged'};
 await assert.rejects(()=>appendRecord(file,skip),/previous|prior/i);await appendRecord(file,first);
 for(const patch of [{testId:'ANOTHER'},{revision:'c'.repeat(40)},{testRevision:'d'.repeat(40)},{environment:'Different runtime'},{scope:['another.ts']}])await assert.rejects(()=>appendRecord(file,{...skip,...patch}),/reuse|same|match/i);
 await appendRecord(file,skip);await assert.rejects(()=>appendRecord(file,{...skip,runId:'QA-20261020-chain',previousRunId:skip.runId}),/direct|PASS/i);
 await appendRecord(file,{...record('QA-20261020-failed'),result:'FAIL'});await assert.rejects(()=>appendRecord(file,{...skip,runId:'QA-20261020-failed-skip',previousRunId:'QA-20261020-failed'}),/direct|PASS/i);
}));

test('concurrent appends are serialized and exactly one writer can claim a duplicate run ID',async()=>journal(async file=>{
 await Promise.all(Array.from({length:8},(_,i)=>appendRecord(file,record('QA-20261020-concurrent-'+i))));
 const results=await Promise.allSettled([appendRecord(file,record('QA-20261020-duplicate')),appendRecord(file,record('QA-20261020-duplicate'))]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const lines=(await readFile(file,'utf8')).trim().split('\n').map(line=>JSON.parse(line));assert.equal(lines.length,9);assert.equal(new Set(lines.map(r=>r.runId)).size,9);
}));

test('malformed or truncated journal tails fail closed without appending into damaged history',async()=>journal(async file=>{
 for(const data of ['{broken}\n',JSON.stringify(record()),JSON.stringify({...record(),actor:''})+'\n',JSON.stringify(record())+'\n'+JSON.stringify(record())+'\n']){await writeFile(file,data);await assert.rejects(()=>appendRecord(file,record('QA-20261020-after-damage')));assert.equal(await readFile(file,'utf8'),data);}
}));
