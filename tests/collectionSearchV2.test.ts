import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collectionSearch,powerUpLeagueWarning} from '../game/collectionSearchV2';
import {species} from '../game/catalogV2';
import {stats} from '../game/goV2';
import type {Specimen} from '../game/typesV2';

function bug(id:string,overrides:Partial<Specimen>={}):Specimen{return {id,species:'ant',level:1,shiny:false,favorite:false,obtainedAt:1,source:'walking',hearts:0,item:null,go:{level:20,iv:[15,15,15],fast:'bite',charged:['cut'],item:null},...overrides};}
const context={buddy:'buddy',team:['team']};

test('collection searches names case-insensitively and exact dex numbers with optional zero padding',()=>{
 const ant=bug('ant'),beetle=bug('beetle',{species:'beetle'});
 assert.ok(collectionSearch(' '+species('ant').name.toUpperCase()+' ',context)(ant));
 for(const q of ['2','002','#002']){assert.ok(collectionSearch(q,context)(ant));assert.equal(collectionSearch(q,context)(beetle),false);}
 assert.equal(collectionSearch('1',context)(bug('other',{species:'butterfly'})),false);
 assert.ok(collectionSearch('  ',context)(ant));assert.equal(collectionSearch('',context)(bug('legacy',{go:undefined})),false);
});

test('CP searches use current stats with inclusive exact, maximum, minimum and bounded ranges',()=>{
 const b=bug('cp'),cp=stats(b).cp;
 for(const q of ['cp'+cp,'cp-'+cp,'cp'+cp+'-','cp'+cp+'-'+cp,'CP0-'+cp])assert.ok(collectionSearch(q,context)(b),q);
 for(const q of ['cp'+(cp+1),'cp-'+(cp-1),'cp'+(cp+1)+'-','cp'+(cp+1)+'-'+(cp+20),'cp-','cpabc','cp1500-100'])assert.equal(collectionSearch(q,context)(b),false,q);
 b.go!.item='thorn';assert.ok(collectionSearch('cp'+stats(b).cp,context)(b));
});

test('all five appraisal filters follow existing IV boundaries and keep 3 star separate from perfect',()=>{
 const ivs:[number,number,number][]=[[0,0,0],[8,8,7],[10,10,10],[13,12,12],[15,15,15]];
 for(const [stars,iv] of ivs.entries()){const b=bug('iv');b.go!.iv=iv;for(let n=0;n<=4;n++)assert.equal(collectionSearch(n+'*',context)(b),n===stars);assert.ok(collectionSearch(stars+'★',context)(b));}
});

test('status searches use the individual specimen identity for buddy and team',()=>{
 const favorite=bug('favorite',{favorite:true}),shiny=bug('shiny',{shiny:true});
 for(const q of ['favoriet','favorite','favourite'])assert.ok(collectionSearch(q,context)(favorite));
 assert.ok(collectionSearch('shiny',context)(shiny));assert.equal(collectionSearch('shiny',context)(favorite),false);
 assert.ok(collectionSearch('buddy',context)(bug('buddy')));assert.equal(collectionSearch('buddy',context)(bug('same-species')),false);
 assert.ok(collectionSearch('team',context)(bug('team')));assert.equal(collectionSearch('team',context)(bug('other')),false);
});

test('ampersand and exclusion combine status, CP, stars and name without modifying specimens',()=>{
 const b=bug('buddy',{shiny:true}),before=structuredClone(b),cp=stats(b).cp;
 assert.ok(collectionSearch(' SHINY & !favoriet & buddy & !team & 4* & cp-'+cp,context)(b));
 assert.equal(collectionSearch('shiny&favoriet',context)(b),false);
 assert.equal(collectionSearch('!buddy',context)(b),false);
 assert.ok(collectionSearch('!!shiny',context)(b));assert.equal(collectionSearch('!',context)(b),false);
 assert.deepEqual(b,before);
});

test('power-up warning appears only when crossing a league cap, including a current CP exactly at the cap',()=>{
 assert.equal(powerUpLeagueWarning(1499,1500),'');assert.match(powerUpLeagueWarning(1500,1501),/Kleine Arena \(1500 CP\)/);
 assert.equal(powerUpLeagueWarning(1501,1600),'');assert.equal(powerUpLeagueWarning(2499,2500),'');
 assert.match(powerUpLeagueWarning(2500,2501),/Grote Arena \(2500 CP\)/);assert.equal(powerUpLeagueWarning(2501,2600),'');
 const both=powerUpLeagueWarning(1499,2501);assert.match(both,/Kleine Arena/);assert.match(both,/Grote Arena/);assert.match(both,/niet terugdraaien/);
});
