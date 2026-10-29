import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureGo,rollGoBug,transferManyGo} from '../game/goV2';
import {ensureField} from '../game/fieldV2';
import {ensureAdventure} from '../game/tacticsV2';
import {DEX_SPECIES} from '../game/dexV2';
import {bugRarity} from '../game/rarityDisplayV2';
import {DEFAULT_TRANSFER_OPTIONS,TRANSFER_BATCH,lockedBugV2,transferNectarV2,transferSelectionV2} from '../game/transferSelectionV2';
import type {Specimen} from '../game/typesV2';
const NOW=Date.UTC(2026,9,29,12);
const bug=(id:string,species:string,iv:number,extra:Partial<Specimen>={}):Specimen=>({id,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null,...extra,go:{...rollGoBug(species,id),level:10,iv:[iv,iv,iv] as [number,number,number],charged:['cut']}});
function player(specimens:Specimen[]){const p=freshV2('transfer-owner','TRAN1234',NOW);ensureAdventure(p,NOW);ensureField(p,NOW);ensureGo(p,NOW);p.specimens=specimens;p.buddy=undefined as never;p.go!.team=[];return p;}
const ids=(list:Specimen[])=>list.map(s=>s.id);
const all={keepBest:0,keepRare:false,keepGood:false,keepTwoMoves:false} as const;

test('protected bugs are never selected, whatever the options',()=>{
 const p=player(Array.from({length:7},(_,i)=>bug('ant-'+i,'ant',i)));p.specimens[0].shiny=true;p.specimens[1].favorite=true;p.buddy=p.specimens[2].id;p.go!.team=[p.specimens[3].id];p.go!.gyms={...(p.go!.gyms??{}),deployed:[{specimen:p.specimens[4].id}]} as never;
 const out=ids(transferSelectionV2(p,all));for(const id of ['ant-0','ant-1','ant-2','ant-3','ant-4'])assert.ok(!out.includes(id),id+' is protected');assert.deepEqual(out.sort(),['ant-5','ant-6']);
 assert.ok(p.specimens.slice(0,5).every(s=>lockedBugV2(p,s)));
});
test('the best per species stays: one or two by aanleg, plus the highest CP',()=>{
 const p=player([bug('a1','ant',3),bug('a2','ant',9),bug('a3','ant',6),bug('a4','ant',1)]);p.specimens[3].go!.level=40;
 const one=ids(transferSelectionV2(p,{...all,keepBest:1}));assert.ok(!one.includes('a2'),'best aanleg kept');assert.ok(!one.includes('a4'),'highest CP kept');assert.deepEqual(one,['a1','a3']);
 const two=ids(transferSelectionV2(p,{...all,keepBest:2}));assert.deepEqual(two,['a1']);
 assert.equal(transferSelectionV2(p,all).length,4,'keepBest 0 lets every unprotected bug go');
});
test('options keep rare, Super/Perfect and two-attack bugs; weakest first',()=>{
 const rare=DEX_SPECIES.map(s=>s.id).find(id=>bugRarity(id)>=4)!,common=DEX_SPECIES.map(s=>s.id).find(id=>bugRarity(id)<=2&&id!==rare)!;
 const p=player([bug('r1',rare,2),bug('c1',common,15),bug('c2',common,13),bug('c3',common,4),bug('c4',common,1)]);p.specimens[2].go!.charged=['cut','cut'];p.specimens[3].go!.charged=['cut','buzz'];
 assert.deepEqual(ids(transferSelectionV2(p,all)),['c4','r1','c3','c2','c1'],'weakest aanleg first');
 assert.ok(!ids(transferSelectionV2(p,{...all,keepRare:true})).includes('r1'));
 const good=ids(transferSelectionV2(p,{...all,keepGood:true}));assert.ok(!good.includes('c1')&&!good.includes('c2')&&good.includes('c3'));
 assert.ok(!ids(transferSelectionV2(p,{...all,keepTwoMoves:true})).includes('c3'));
 assert.deepEqual(ids(transferSelectionV2(p,DEFAULT_TRANSFER_OPTIONS)),['c4'],'defaults keep the best, Super/Perfect, two attacks and the rare one');
});
test('selection matches the server reward: 1 nectar per bug per family, max 50 per call',()=>{
 const p=player(Array.from({length:60},(_,i)=>bug('m-'+String(i).padStart(2,'0'),'ant',i%10)));
 const out=transferSelectionV2(p,DEFAULT_TRANSFER_OPTIONS),batch=out.slice(0,TRANSFER_BATCH),nectar=transferNectarV2(batch),before=p.go!.candy[nectar[0][0]]??0;
 assert.ok(out.length>TRANSFER_BATCH);assert.equal(nectar.reduce((a,[,n])=>a+n,0),TRANSFER_BATCH);
 transferManyGo(p,ids(batch));assert.equal(p.go!.candy[nectar[0][0]],before+TRANSFER_BATCH);assert.equal(p.specimens.length,10);
});
