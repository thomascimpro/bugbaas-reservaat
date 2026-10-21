import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appendGoJournal,GO_JOURNAL_LIMIT,publicGoJournal} from '../game/goJournalV2';
import type {GoJournalEntry} from '../game/goJournalV2';
import {ensureGo} from '../game/goV2';
import {freshV2} from '../game/safariV2';

const NOW=Date.UTC(2026,9,21,12);
function player(){const p=freshV2('journal-test','JRNL1234',NOW);ensureGo(p,NOW);return p;}
function entry(id='capture-1',at=NOW):GoJournalEntry{return {id,kind:'catch',at,species:'ant',specimenId:'owned-ant',shiny:true,cp:81,dust:100,xp:150,method:'manual'};}

test('journal starts empty and does not invent earlier captures or reward progress',()=>{
 const p=player(),before=JSON.stringify(p);assert.deepEqual(publicGoJournal(p.go!.journal),[]);assert.equal(JSON.stringify(p),before);
 assert.equal(appendGoJournal(p,entry()),true);assert.equal(p.go!.journal!.length,1);
 const {journal,...go}=p.go!;assert.deepEqual(go,JSON.parse(before).go);assert.equal(p.specimens.length,JSON.parse(before).specimens.length);
});

test('same server event is idempotent even if a retry has a later timestamp',()=>{
 const p=player();assert.equal(appendGoJournal(p,entry()),true);assert.equal(appendGoJournal(p,{...entry(),at:NOW+1000,dust:9999}),false);
 assert.deepEqual(p.go!.journal,[entry()]);
});

test('retains at most fifty newest events and sorts by confirmed event time',()=>{
 const p=player();for(let i=0;i<GO_JOURNAL_LIMIT+9;i++)appendGoJournal(p,entry('capture-'+i,NOW+i));
 assert.equal(p.go!.journal!.length,GO_JOURNAL_LIMIT);assert.equal(p.go!.journal![0].id,'capture-58');assert.equal(p.go!.journal!.at(-1)!.id,'capture-9');
 appendGoJournal(p,entry('late-old',NOW));assert.equal(p.go!.journal!.length,GO_JOURNAL_LIMIT);assert.equal(p.go!.journal!.at(-1)!.id,'capture-9');
 const result=publicGoJournal([entry('older',NOW),entry('newer',NOW+1),entry('older',NOW)]);assert.deepEqual(result.map(e=>e.id),['newer','older']);
});

test('event writes and public reads use detached allowlisted copies without private location or rolls',()=>{
 const p=player(),raw={...entry(),lat:51.123,lng:5.123,fix:{lat:51,lng:5},hatchSeed:'private',ivRoll:[15,15,15],secret:'private'};
 assert.equal(appendGoJournal(p,raw),true);raw.cp=999;assert.equal(p.go!.journal![0].cp,81);
 const dirty=[{...raw,at:NOW+1}],snapshot=JSON.stringify(dirty),safe=publicGoJournal(dirty);assert.equal(JSON.stringify(dirty),snapshot);
 assert.deepEqual(Object.keys(safe[0]).sort(),Object.keys(entry()).sort());safe[0].species='moth';assert.equal(dirty[0].species,'ant');
 const serialized=JSON.stringify(p.go!.journal);for(const key of ['lat','lng','fix','hatchSeed','ivRoll','secret'])assert.ok(!serialized.includes('"'+key+'"'));
});

test('invalid entries never create a journal and malformed optional fields are dropped',()=>{
 const p=player();for(const raw of [{...entry(),id:''},{...entry(),at:NaN},{...entry(),at:-1},{...entry(),kind:'gps'},{...entry(),at:Infinity},{...entry(),at:1e16}])assert.equal(appendGoJournal(p,raw as GoJournalEntry),false);
 assert.equal(p.go!.journal,undefined);
 const safe=publicGoJournal([{...entry(),cp:-1,xp:-10,dust:Infinity,species:{lat:51},method:'secret',result:'fake'} as unknown as GoJournalEntry]);
 assert.equal(safe.length,1);for(const key of ['cp','xp','dust','species','method','result'])assert.equal(Object.hasOwn(safe[0],key),false);
});
