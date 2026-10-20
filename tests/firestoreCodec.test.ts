import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encodeFirestorePayload,decodeFirestorePayload} from '../server/firestoreCodec';
import {freshV2} from '../game/safariV2';
import {ensureAdventure,startTactic,resolveTurn} from '../game/tacticsV2';
import type {PlayerV2} from '../game/typesV2';

function assertFirestoreArrays(value:unknown){
  if(Array.isArray(value)){assert.ok(value.every(item=>!Array.isArray(item)),'Firestore cannot store a directly nested array');value.forEach(assertFirestoreArrays);}
  else if(value&&typeof value==='object')Object.values(value).forEach(assertFirestoreArrays);
}

test('real battle teams survive Firestore encoding and resume with identical combat results',()=>{
  const p=freshV2('codec-player','CODEC123',Date.now());ensureAdventure(p,Date.now());startTactic(p,'boss','codec-battle',Date.now(),'server-secret');
  const encoded=encodeFirestorePayload(p);assertFirestoreArrays(encoded);
  const restored=decodeFirestorePayload<PlayerV2>(encoded);assert.deepEqual(restored,p);
  resolveTurn(restored.adventure!.run!,{kind:'basic'});resolveTurn(p.adventure!.run!,{kind:'basic'});assert.deepEqual(restored,p);
});

test('legacy documents and indexed player fields stay compatible; optional values follow JSON storage',()=>{
  const p={rating:1100,season:'2026-10',users:['a','b'],battle:{teams:[[{id:'a',optional:undefined}],[{id:'b'}]],events:[{teams:[[],[{id:'b'}]]}]},optional:undefined};
  const encoded=encodeFirestorePayload(p) as typeof p;assertFirestoreArrays(encoded);
  assert.equal(encoded.rating,1100);assert.equal(encoded.season,p.season);assert.deepEqual(encoded.users,p.users);
  assert.deepEqual(decodeFirestorePayload(encoded),JSON.parse(JSON.stringify(p)));
  const legacy={rating:1000,users:['a','b'],history:[{round:1,result:'won'}]};assert.deepEqual(decodeFirestorePayload(legacy),legacy);
});
