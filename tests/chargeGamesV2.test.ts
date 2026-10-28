import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CHARGE_BEAT,CHARGE_GAMES,CHARGE_H,CHARGE_W,rhythmHit,swarmPosition,swipeMatches} from '../game/chargeGamesV2';

const TYPES=['bug','flying','poison','grass','ground','rock','steel','dark','normal','fire','water'] as const;

test('every attack type has its own charged-attack mini-game',()=>{
 for(const type of TYPES){const g=CHARGE_GAMES[type];assert.ok(g&&g.title&&g.hint,type);if(g.kind==='swarm')assert.ok(g.motion,type);}
 assert.deepEqual(new Set(TYPES.map(t=>CHARGE_GAMES[t].kind)),new Set(['swarm','rub','rhythm','swipe']));
});

test('rhythm only rewards taps close to the beat',()=>{
 assert.equal(rhythmHit(CHARGE_BEAT*3),true);assert.equal(rhythmHit(CHARGE_BEAT*3-40),true);assert.equal(rhythmHit(CHARGE_BEAT*3+20),true);
 assert.equal(rhythmHit(CHARGE_BEAT*3+CHARGE_BEAT/2),false);assert.equal(rhythmHit(CHARGE_BEAT*3+CHARGE_BEAT*.3),false);
 // Roughly a quarter of each beat counts: hard enough that tapping blindly does not max out a charge.
 let hits=0;for(let t=0;t<CHARGE_BEAT;t++)if(rhythmHit(t))hits++;assert.ok(hits/CHARGE_BEAT>.2&&hits/CHARGE_BEAT<.35);
});

test('swipes must be long enough and in the shown direction',()=>{
 assert.equal(swipeMatches(0,-80,0),true);assert.equal(swipeMatches(80,5,1),true);assert.equal(swipeMatches(0,80,2),true);assert.equal(swipeMatches(-80,0,3),true);
 assert.equal(swipeMatches(0,-20,0),false,'short drags are ignored');assert.equal(swipeMatches(80,0,0),false,'wrong direction');assert.equal(swipeMatches(60,-70,1),false,'mostly vertical is not right');
});

test('swarm targets stay inside the play area for every motion style',()=>{
 for(const motion of ['orbit','rise','drift','flash'] as const)for(let t=0;t<6000;t+=97)for(let i=0;i<8;i++){const p=swarmPosition(motion,i,t);assert.ok(p.x>=10&&p.x<=CHARGE_W-10&&p.y>=10&&p.y<=CHARGE_H-10,motion+' '+i+' '+t+' '+JSON.stringify(p));}
 // Flashing shadows are hidden part of the time but each one shows up within the 6 s window.
 for(let i=0;i<8;i++){let seen=false;for(let t=0;t<6000;t+=50)if(swarmPosition('flash',i,t).visible)seen=true;assert.ok(seen,'shadow '+i);}
});
