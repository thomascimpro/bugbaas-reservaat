import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureGo,rollGoBug,stats,family} from '../game/goV2';
import {EVOLUTIONS} from '../game/dexV2';
import {bestOfSpecies,bugAdvice} from '../game/bugAdviceV2';
import type {Specimen} from '../game/typesV2';

const NOW=Date.UTC(2026,9,28,12);
const bug=(id:string,species:string,iv:[number,number,number],level=10):Specimen=>({id,species,level:1,shiny:false,favorite:false,obtainedAt:0,source:'walking',hearts:0,item:null,go:{...rollGoBug(species,id),iv,level}});
function player(...bugs:Specimen[]){const p=freshV2('kid','KID00001',NOW);ensureGo(p,NOW);p.specimens=bugs;return p;}

test('the best bug of a species gets the thumbs-up, a weaker duplicate points to it',()=>{
 const good=bug('a','ant',[15,14,15]),weak=bug('b','ant',[2,3,1],20),solo=bug('c','moth',[5,5,5]);
 const p=player(good,weak,solo);p.go!.dust=100000;p.go!.candy[family('ant')]=50;
 assert.deepEqual([...bestOfSpecies(p.specimens)],['a'],'only species you own twice get a best mark');
 const a=bugAdvice(p,good),w=bugAdvice(p,weak);
 assert.equal(a.best,true);assert.equal(a.gradeName,'Super');assert.ok(a.tips.some(t=>t.good&&t.text.includes('beste')));
 assert.equal(w.best,false);assert.equal(w.better?.id,'a');assert.ok(w.tips.some(t=>!t.good&&t.text.includes('Betere')));
 assert.ok(a.maxCp>=a.cp&&a.cp===stats(good).cp);
});

test('evolve advice follows the nectar you have',()=>{
 const id=Object.keys(EVOLUTIONS).find(k=>EVOLUTIONS[k].candy>0)!,b=bug('e',id,[10,10,10]),p=player(b),key=family(id);
 p.go!.candy[key]=0;assert.ok(bugAdvice(p,b).tips.some(t=>!t.good&&t.text.startsWith('Nog '+EVOLUTIONS[id].candy+' nectar')));
 p.go!.candy[key]=EVOLUTIONS[id].candy;assert.ok(bugAdvice(p,b).tips.some(t=>t.good&&t.text.startsWith('Evolueer')));
 assert.ok(bugAdvice(p,b).tips.length<=2);
});
