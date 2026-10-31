import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activeEvent,wildShinyOdds} from '../game/eventsV2';
import {WILD_SHINY_ODDS,wildShiny} from '../game/shinyV2';

test('Glimmerweekend runs Saturday and Sunday (UTC) with four times the wild shiny chance, weekdays stay 1 in 512',()=>{
 const fri=Date.UTC(2026,9,30,23,59),sat=Date.UTC(2026,9,31,0,0),sun=Date.UTC(2026,10,1,22),mon=Date.UTC(2026,10,2,0,0);
 assert.equal(activeEvent(fri),null);assert.equal(activeEvent(mon),null);assert.equal(wildShinyOdds(fri),WILD_SHINY_ODDS);
 const a=activeEvent(sat)!,b=activeEvent(sun)!;assert.equal(a.id,b.id,'one event for the whole weekend');assert.equal(a.endsAt,mon);assert.equal(wildShinyOdds(sun),WILD_SHINY_ODDS/4);
 const n=4000,hits=(odds:number)=>Array.from({length:n},(_,i)=>wildShiny('seed','spawn-'+i,odds)).filter(Boolean).length;
 assert.ok(hits(128)>hits(512),'more shinies during the event');assert.ok(hits(128)>15&&hits(128)<50);
});
