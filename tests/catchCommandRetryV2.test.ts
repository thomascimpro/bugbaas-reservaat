import {test} from 'node:test';
import assert from 'node:assert/strict';
import {retryCatchCommandV2} from '../src/catchCommandRetryV2';
import type {CommandV2} from '../game/typesV2';
const cast:CommandV2={type:'worldCast',commandId:'same-cast-command-id',expectedRevision:9,encounter:'encounter',net:'basic',bait:null,rhythm:{focus:'same-focus',taps:[1,2,3]}};

test('lost or server-failed cast reply retries only the exact receipt and returns confirmed result',async()=>{
 for(const status of [0,500,502,503]){const calls:{body:string;retry:boolean}[]=[];let count=0;const response=await retryCatchCommandV2(cast,async(command,retry)=>{assert.equal(command,cast);calls.push({body:JSON.stringify(command),retry});if(++count===1)throw {status};return {confirmed:true};});assert.deepEqual(response,{confirmed:true});assert.equal(calls.length,2);assert.equal(calls[0].body,calls[1].body);assert.deepEqual(calls.map(c=>c.retry),[false,true]);}
});
test('rejected, unauthenticated and rate-limited casts and other commands are never automatically repeated',async()=>{
 for(const command of [cast,{...cast,type:'goPower'},{...cast,type:'worldLocate'}])for(const status of [0,400,401,403,409,429,500]){if(command.type==='worldCast'&&(status===0||status===500))continue;let count=0;await assert.rejects(()=>retryCatchCommandV2(command,async()=>{count++;throw {status};}));assert.equal(count,1);}
});
test('a second unknown cast failure stays unresolved for the existing pending-action recovery',async()=>{let calls=0;const error={status:0};await assert.rejects(()=>retryCatchCommandV2(cast,async()=>{calls++;throw error;}),e=>e===error);assert.equal(calls,2);});
