import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshV2} from '../game/safariV2';
import {ensureGo} from '../game/goV2';
import {beginnerSteps,unlockLevel,guidePeeks} from '../game/beginnerGuideV2';
import type {PlayerV2} from '../game/typesV2';

const NOW=Date.UTC(2026,9,28,12);
function player(){const p=freshV2('kid','KIDS001',NOW);ensureGo(p,NOW);p.specimens=p.specimens.filter(s=>s.source!=='walking');return p;}
const catchOf=(p:PlayerV2,species:string,i:number)=>p.specimens.push({id:'w'+i,species,level:1,shiny:false,favorite:false,obtainedAt:NOW,source:'walking',hearts:0,item:null});
const next=(p:PlayerV2,level=1,local:string[]=[])=>beginnerSteps(p,level,local).find(s=>!s.done)?.id;

test('a brand-new player starts with one simple goal: catch a bug',()=>{
 const p=player();assert.equal(next(p),'first-catch');
 assert.equal(beginnerSteps(p,1,[]).filter(s=>!s.done).length,6,'all six steps open for a new player');
});

test('real catches, post spins and taps move the guide forward in order',()=>{
 const p=player();catchOf(p,'ant',1);assert.equal(next(p),'three-kinds');
 catchOf(p,'ant',2);assert.equal(next(p),'three-kinds','the same species twice does not count as a new kind');
 catchOf(p,'beetle',3);catchOf(p,'aphid',4);assert.equal(next(p),'spin-post');
 p.go!.sites={visits:{'post-1':NOW},firstDay:'',routeClaims:[],run:null};assert.equal(next(p),'see-bugs');
 assert.equal(next(p,1,['see-bugs']),'bugdex');assert.equal(next(p,1,['see-bugs','bugdex']),'first-battle');
});

test('battles wait for level 5 and the last step points there first',()=>{
 const p=player(),low=beginnerSteps(p,3,[]).find(s=>s.id==='first-battle')!,high=beginnerSteps(p,5,[]).find(s=>s.id==='first-battle')!;
 assert.equal(low.action,'nearby');assert.match(low.title,/level 5/);assert.equal(low.markOnAction,false);
 assert.equal(high.action,'battle');assert.equal(high.markOnAction,true);
});

test('menu unlock levels follow the beginner path',()=>{
 assert.equal(unlockLevel('Bugdex'),1);assert.equal(unlockLevel('Bugs'),1);assert.equal(unlockLevel('Veldtas'),1);
 assert.equal(unlockLevel('Shop'),3);assert.equal(unlockLevel('Cocons'),3);
 assert.equal(unlockLevel('Strijd'),5);assert.equal(unlockLevel('Gyms'),5);assert.equal(unlockLevel('Vrienden'),5);
});

test('a folded quest card only pops open when a new step starts',()=>{
 assert.equal(guidePeeks(true,'first-catch','three-kinds'),true);assert.equal(guidePeeks(true,'three-kinds','three-kinds'),false);assert.equal(guidePeeks(false,'first-catch','three-kinds'),false);
});
