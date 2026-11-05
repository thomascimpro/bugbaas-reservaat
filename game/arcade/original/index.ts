import {checkV2 as check} from '../../shopV2';
import type {ArcadeGameId} from '../games';
import type {ArcadeTap,ArcadeTicket} from '../tapDuel';
import {originalTapDuel} from './tapDuel';
import {originalNestDefense} from './nestDefense';
import {originalBubbleSwarm} from './bubbleSwarm';
import {webRunnerPort} from './webRunner';
import {bugGlidePort} from './bugGlide';
import {bugTowerPort} from './bugTower';
import {originalButterflyCatch} from './butterflyCatch';
import type {OriginalPort} from './types';

// State is created and consumed by the same registered port; no state arrives from the client.
const ports=[originalTapDuel,originalNestDefense,originalBubbleSwarm,webRunnerPort,bugGlidePort,bugTowerPort,originalButterflyCatch];
export const originalPorts=Object.fromEntries(ports.map(p=>[p.game,p])) as unknown as Record<ArcadeGameId,OriginalPort>;
export const ORIGINAL_MAX_INPUTS=10000,ORIGINAL_MAX_BYTES=1048576;
export const isOriginalRules=(ticket:Pick<ArcadeTicket,'rules'|'game'>)=>!!ticket.game&&(ticket.rules===ticket.game+'-2'||ticket.game==='bubble_swarm'&&ticket.rules==='bubble_swarm-3');
export function originalPort(ticket:Pick<ArcadeTicket,'game'>){const p=ticket.game&&originalPorts[ticket.game];check(p,'Dit oorspronkelijke spel ontbreekt.');return p;}
export function validateOriginalInputs(ticket:ArcadeTicket,raw:unknown):ArcadeTap[]{
 const port=originalPort(ticket),duration=Math.ceil(port.durationMs/20);
 check(Array.isArray(raw)&&raw.length<=ORIGINAL_MAX_INPUTS&&JSON.stringify(raw).length<ORIGINAL_MAX_BYTES,'Deze spelinvoer is te groot.');
 let previous=-1,same=0;
 for(const i of raw){
  check(i&&typeof i==='object'&&!Array.isArray(i)&&Object.keys(i).every(k=>['tick','x','y','action','control'].includes(k))&&Number.isInteger(i.tick)&&i.tick>=0&&i.tick<duration&&i.tick>=previous&&Number.isInteger(i.x)&&Number.isInteger(i.y)&&i.x>=0&&i.x<=1000&&i.y>=0&&i.y<=1000&&(i.action===undefined||['down','up','move'].includes(i.action))&&(i.control===undefined||typeof i.control==='string'&&!!port.controls?.includes(i.control)),'Ongeldige spelinvoer.');
  same=i.tick===previous?same+1:1;check(same<=3,'Te veel gelijktijdige invoer.');previous=i.tick;
 }
 return raw as ArcadeTap[];
}
