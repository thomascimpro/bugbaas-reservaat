/** Original mechanics extracted from CimPro BugBaas-3.0/src/components/minigames/BubbleSwarmGame.tsx.
 * Original board/path selection, pressure rows, Bomb/Freeze, chains, drops and level rules retained.
 * Animated flight completion + 120ms resolution is driven by shared simulation time instead of React.
 * No old Firebase/account/storage imports; bounded real squad support does not multiply score.
 */
import type {ArcadeTicket} from '../tapDuel';
import {originalSquadPower} from './types';
import type {OriginalInput,OriginalPort,OriginalState} from './types';
export type BubbleKind='bee'|'beetle'|'dragonfly'|'firefly'|'ladybug'|'moth';
export type GridPower='bomb'|'freeze';
export type GridBubble={col:number;id:string;kind:BubbleKind;power?:GridPower;row:number};
export type Point={x:number;y:number};
type Shot={bubbleKind:BubbleKind};
export type OriginalBubbleProjectile={path:Point[];shot:Shot;targetCell:{col:number;row:number};durationMs:number;startedAt:number;resolveAt:number};
export type OriginalBubbleState=OriginalState&{
 game:'bubble_swarm';board:GridBubble[];gridPhase:0|1;currentShot:Shot;nextShot:Shot;aim:Point;projectile:OriginalBubbleProjectile|null;
 shotCount:number;nextId:number;combo:number;maxCombo:number;misses:number;popped:number;level:number;nextPressureAt:number;freezeUntil:number;
 pressureAccumulator:number;simulatedPressureMs:number;impact:Point|null;help:{pressureMultiplier:number;freezeMultiplier:number;guidePct:number};
};
export const BUBBLE_CONTROLS=['field'] as const;
const columns=8,dangerRow=10,shooter={x:50,y:91};
export const BUBBLE_KINDS:BubbleKind[]=['bee','beetle','dragonfly','firefly','ladybug','moth'];
const allKinds=BUBBLE_KINDS,baseLevelKindCount=3,durationMs=600000;
// Original arcadeResultService seededNumber, kept unchanged.
function seededNumber(seed:string,index:number){const text=`${seed}:${index}`;let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0)/4294967295;}

function buildInitialBoard(seed: string, level = 1) {
  const bubbles: GridBubble[] = [];
  const kinds = levelKinds(level);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const kind = kinds[(col + row * 2 + Math.floor(seededNumber(seed, level * 1000 + row * columns + col) * 2)) % kinds.length];
      const power = row === 2 && col === Math.floor(seededNumber(seed, 810) * columns)
        ? "bomb"
        : row === 3 && col === Math.floor(seededNumber(seed, 820) * columns) ? "freeze" : undefined;
      bubbles.push({ col, id: `level-${level}-${row}-${col}`, kind, power, row });
    }
  }
  return bubbles;
}

function nextShotKind(seed: string, shot: number, activeKinds: BubbleKind[]): Shot {
  const kinds = activeKinds.length ? activeKinds : levelKinds(1);
  const bubbleKind = kinds[Math.floor(seededNumber(seed, 500 + shot * 11) * kinds.length)];
  return { bubbleKind };
}

function activeKindsForBoard(board: GridBubble[], fallback: BubbleKind[]) {
  const present = new Set(board.map((bubble) => bubble.kind));
  const active = allKinds.filter((kind) => present.has(kind));
  return active.length ? active : fallback;
}

function levelKinds(level: number) {
  return allKinds.slice(0, Math.min(allKinds.length, baseLevelKindCount + level - 1));
}

function incomingGridPower(seed: string, serial: number): GridPower | undefined {
  const roll = seededNumber(seed, 1100 + serial * 13);
  if (roll > 0.965) return "bomb";
  if (roll > 0.93) return "freeze";
  return undefined;
}

function pressureDelay(elapsed: number) {
  return clamp(Math.round(8200 / (1 + Math.max(0, elapsed) / 150000)), 2200, 8200);
}

function missLimit(elapsed: number) {
  if (elapsed >= 180000) return 2;
  if (elapsed >= 80000) return 3;
  if (elapsed >= 45000) return 4;
  return 5;
}

function gridPoint(row: number, col: number, phase: 0 | 1 = 0): Point {
  return { x: 6.4 + col * 11.6 + ((row + phase) % 2 ? 5.8 : 0), y: 6.2 + row * 7.2 };
}

export function traceShotPath(from: Point, aim: Point, endY = 5): Point[] {
  const direction = normalize({ x: aim.x - from.x, y: Math.min(-3, aim.y - from.y) });
  const points = [from];
  let current = { ...from };
  let dx = direction.x;
  const dy = direction.y;
  const boundaryLeft = 5;
  const boundaryRight = 95;
  const targetY = clamp(endY, boundaryLeft, 82);
  for (let step = 0; step < 4 && current.y > targetY; step += 1) {
    const targetTime = (targetY - current.y) / dy;
    const wallTime = dx > 0 ? (boundaryRight - current.x) / dx : dx < 0 ? (boundaryLeft - current.x) / dx : Number.POSITIVE_INFINITY;
    if (wallTime >= 0 && wallTime < targetTime) {
      current = { x: dx > 0 ? boundaryRight : boundaryLeft, y: current.y + dy * wallTime };
      points.push(current);
      dx *= -1;
      continue;
    }
    current = { x: current.x + dx * targetTime, y: targetY };
    points.push(current);
    break;
  }
  return points.length > 1 ? points : [from, { x: from.x, y: targetY }];
}

function selectTargetCell(board: GridBubble[], aim: Point, phase: 0 | 1) {
  const occupied = new Set(board.map(cellKey));
  const candidates = new Map<string, { col: number; row: number }>();
  for (let col = 0; col < columns; col += 1) candidates.set(`0:${col}`, { col, row: 0 });
  for (const bubble of board) {
    for (const neighbor of neighborCells(bubble.row, bubble.col, phase)) {
      if (neighbor.row < 0 || neighbor.row > dangerRow || neighbor.col < 0 || neighbor.col >= columns) continue;
      const key = cellKey(neighbor);
      if (!occupied.has(key)) candidates.set(key, neighbor);
    }
  }
  let best: { cell: { col: number; row: number }; score: number } | null = null;
  for (const cell of candidates.values()) {
    if (occupied.has(cellKey(cell))) continue;
    const point = gridPoint(cell.row, cell.col, phase);
    const ray = traceShotPath(shooter, aim, point.y);
    const impact = ray[ray.length - 1] ?? aim;
    const exposedNeighbors = neighborCells(cell.row, cell.col, phase).filter((neighbor) => occupied.has(cellKey(neighbor))).length;
    const candidateScore = distance(point, impact) - exposedNeighbors * 0.12;
    if (!best || candidateScore < best.score) best = { cell, score: candidateScore };
  }
  return best?.cell ?? null;
}

function pathToTarget(aim: Point, targetCell: { col: number; row: number }, phase: 0 | 1) {
  const target = gridPoint(targetCell.row, targetCell.col, phase);
  const traced = traceShotPath(shooter, aim, target.y);
  return [...traced.slice(0, -1), target];
}

function connectedCluster(board: GridBubble[], start: GridBubble, include: (bubble: GridBubble) => boolean, phase: 0 | 1) {
  const byCell = new Map(board.map((bubble) => [cellKey(bubble), bubble]));
  const visited = new Set<string>();
  const queue = [start];
  const found: GridBubble[] = [];
  while (queue.length) {
    const bubble = queue.shift()!;
    if (visited.has(bubble.id) || !include(bubble)) continue;
    visited.add(bubble.id);
    found.push(bubble);
    for (const cell of neighborCells(bubble.row, bubble.col, phase)) {
      const neighbor = byCell.get(cellKey(cell));
      if (neighbor && !visited.has(neighbor.id)) queue.push(neighbor);
    }
  }
  return found;
}

function supportedBubbleIds(board: GridBubble[], phase: 0 | 1) {
  const byCell = new Map(board.map((bubble) => [cellKey(bubble), bubble]));
  const supported = new Set<string>();
  const queue = board.filter((bubble) => bubble.row === 0);
  while (queue.length) {
    const bubble = queue.shift()!;
    if (supported.has(bubble.id)) continue;
    supported.add(bubble.id);
    for (const cell of neighborCells(bubble.row, bubble.col, phase)) {
      const neighbor = byCell.get(cellKey(cell));
      if (neighbor && !supported.has(neighbor.id)) queue.push(neighbor);
    }
  }
  return supported;
}

function neighborCells(row: number, col: number, phase: 0 | 1) {
  const diagonal = (row + phase) % 2 ? 1 : -1;
  return [
    { row, col: col - 1 }, { row, col: col + 1 },
    { row: row - 1, col }, { row: row + 1, col },
    { row: row - 1, col: col + diagonal }, { row: row + 1, col: col + diagonal }
  ];
}

function cellKey(cell: { col: number; row: number }) {
  return `${cell.row}:${cell.col}`;
}

function pathLength(path: Point[]) {
  return path.slice(1).reduce((total, point, index) => total + distance(path[index], point), 0);
}

function pointAtPathDistance(path: Point[], progress: number): Point {
  const total = pathLength(path);
  let remaining = total * progress;
  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    const segment = distance(start, end);
    if (remaining <= segment) {
      const ratio = segment ? remaining / segment : 1;
      return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
    }
    remaining -= segment;
  }
  return path[path.length - 1] ?? { x: 50, y: 91 };
}

function samplePath(path: Point[], count: number) {
  return Array.from({ length: count }, (_, index) => pointAtPathDistance(path, index / Math.max(1, count - 1)));
}

function normalize(point: Point) {
  const length = Math.max(0.001, Math.sqrt(point.x * point.x + point.y * point.y));
  return { x: point.x / length, y: point.y / length };
}

function distance(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function create(ticket:ArcadeTicket):OriginalBubbleState{
 const p=originalSquadPower(ticket.squad,ticket.league),seed=String(ticket.seed),board=buildInitialBoard(seed,1),active=activeKindsForBoard(board,levelKinds(1));
 const help={pressureMultiplier:1+.14*p.defense,freezeMultiplier:1+.14*p.hp,guidePct:Math.round(14*p.attack)};
 return {game:'bubble_swarm',elapsedMs:0,score:0,finished:false,reason:null,hearts:1,board,gridPhase:0,currentShot:nextShotKind(seed,0,active),nextShot:nextShotKind(seed,1,active),aim:{x:50,y:32},projectile:null,shotCount:0,nextId:100,combo:0,maxCombo:0,misses:0,popped:0,level:1,nextPressureAt:Math.round(pressureDelay(0)*help.pressureMultiplier),freezeUntil:0,pressureAccumulator:0,simulatedPressureMs:0,impact:null,help};
}
function finish(s:OriginalBubbleState,reason='lower_bound'){if(s.finished)return;s.score=Math.max(1,Math.round(s.score+s.popped*4+s.maxCombo*30));s.finished=true;s.reason=reason;}
function pushPressureRow(s:OriginalBubbleState,ticket:ArcadeTicket){
 const shifted=s.board.map(bubble=>({...bubble,row:bubble.row+1})),nextPhase=(s.gridPhase===0?1:0) as 0|1,allowed=activeKindsForBoard(shifted,levelKinds(s.level)),seed=String(ticket.seed);
 // Property evaluation order matches the original nextId++/kind/power sequence.
 const incoming=Array.from({length:columns},(_,col)=>({col,id:`pressure-${s.nextId++}`,kind:allowed[Math.floor(seededNumber(seed,s.nextId*7)*allowed.length)],power:incomingGridPower(seed,s.nextId),row:0}));
 s.board=[...shifted,...incoming];s.gridPhase=nextPhase;s.misses=0;s.combo=0;s.nextPressureAt=s.elapsedMs+Math.round(pressureDelay(s.elapsedMs)*s.help.pressureMultiplier);
 if(s.board.some(b=>b.row>=dangerRow))finish(s);
}
function startNextLevel(s:OriginalBubbleState,ticket:ArcadeTicket){
 const nextLevel=s.level+1,seed=String(ticket.seed),nextBoard=buildInitialBoard(seed,nextLevel),active=activeKindsForBoard(nextBoard,levelKinds(nextLevel));
 s.level=nextLevel;s.board=nextBoard;s.gridPhase=0;s.misses=0;s.combo=0;s.freezeUntil=0;s.nextPressureAt=s.elapsedMs+Math.round(pressureDelay(s.elapsedMs)*s.help.pressureMultiplier);s.currentShot=nextShotKind(seed,s.shotCount,active);s.nextShot=nextShotKind(seed,s.shotCount+1,active);
}
function applyShotResolution(s:OriginalBubbleState,ticket:ArcadeTicket,p:OriginalBubbleProjectile){
 const {shot,targetCell}=p,placed:GridBubble={...targetCell,id:`shot-${s.nextId++}`,kind:shot.bubbleKind};let nextBoard=[...s.board,placed];const cluster=connectedCluster(nextBoard,placed,candidate=>candidate.kind===shot.bubbleKind,s.gridPhase);let removed=0,dropped=0;
 if(cluster.length>=3){
  const matchedIds=new Set(cluster.map(b=>b.id)),poweredMatches=cluster.filter(b=>b.power);
  poweredMatches.filter(b=>b.power==='bomb').forEach(b=>{const blastCells=[b,...neighborCells(b.row,b.col,s.gridPhase)];nextBoard.filter(candidate=>blastCells.some(cell=>cellKey(cell)===cellKey(candidate))).forEach(candidate=>matchedIds.add(candidate.id));});
  const cleared=nextBoard.filter(b=>matchedIds.has(b.id));nextBoard=nextBoard.filter(b=>!matchedIds.has(b.id));removed=cleared.length;
  if(cleared.some(b=>b.power==='freeze')){const freezeMs=Math.round(6000*s.help.freezeMultiplier);s.freezeUntil=Math.max(s.freezeUntil,s.elapsedMs+freezeMs);s.nextPressureAt=Math.max(s.nextPressureAt,s.elapsedMs)+freezeMs;}
  const supported=supportedBubbleIds(nextBoard,s.gridPhase),beforeDrop=nextBoard.length;nextBoard=nextBoard.filter(b=>supported.has(b.id));dropped=beforeDrop-nextBoard.length;s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);s.misses=Math.max(0,s.misses-1);s.score+=removed*35+dropped*60+Math.max(0,s.combo-1)*45;s.popped+=removed+dropped;
 }else{s.combo=0;s.misses++;}
 s.board=nextBoard;s.shotCount++;s.projectile=null;s.impact=null;
 if(!nextBoard.length){startNextLevel(s,ticket);return;}
 const seed=String(ticket.seed),active=activeKindsForBoard(s.board,levelKinds(s.level));s.currentShot=active.includes(s.nextShot.bubbleKind)?s.nextShot:nextShotKind(seed,s.shotCount,active);s.nextShot=nextShotKind(seed,s.shotCount+1,active);
 if(nextBoard.some(b=>b.row>=dangerRow))finish(s);else if(s.misses>=missLimit(s.elapsedMs))pushPressureRow(s,ticket);
}
function step(s:OriginalBubbleState,ticket:ArcadeTicket,dt:number){
 if(s.finished)return;s.elapsedMs=Math.min(durationMs,s.elapsedMs+dt);s.pressureAccumulator+=dt;
 // Like the old 250ms pressure timer, a flying/resolving shot postpones row insertion.
 while(s.pressureAccumulator>=250&&!s.finished){s.pressureAccumulator-=250;s.simulatedPressureMs+=250;if(s.freezeUntil<=s.elapsedMs&&s.elapsedMs>=s.nextPressureAt&&!s.projectile)pushPressureRow(s,ticket);}
 const p=s.projectile;if(p&&s.elapsedMs>=p.startedAt+p.durationMs)s.impact=p.path.at(-1)??shooter;
 if(p&&s.elapsedMs>=p.resolveAt&&!s.finished)applyShotResolution(s,ticket,p);
 if(!s.finished&&s.elapsedMs>=durationMs)finish(s,'time');
}
function input(s:OriginalBubbleState,_ticket:ArcadeTicket,i:OriginalInput){
 if(s.finished||s.projectile||(i.control??'field')!=='field')return false;const action=i.action??'down';
 if(action!=='up'){const aim={x:clamp(i.x/10,5,95),y:clamp(i.y/10,7,80)},changed=aim.x!==s.aim.x||aim.y!==s.aim.y;s.aim=aim;return changed;}
 // Original release shoots the last drag aim; it does not retarget from the release position.
 const targetCell=selectTargetCell(s.board,s.aim,s.gridPhase);if(!targetCell)return false;const target=gridPoint(targetCell.row,targetCell.col,s.gridPhase),traced=traceShotPath(shooter,s.aim,target.y),path=[...traced.slice(0,-1),target],flight=Math.max(320,Math.round(pathLength(path)*6.5));
 s.projectile={path,shot:{...s.currentShot},targetCell,durationMs:flight,startedAt:s.elapsedMs,resolveAt:s.elapsedMs+Math.ceil(flight/20)*20+120};return true;
}
export const bubbleGridPoint=gridPoint;
export const bubblePathPosition=pointAtPathDistance;
export const bubbleMissLimit=missLimit;
export const bubblePreviewPath=(s:OriginalBubbleState)=>{const target=selectTargetCell(s.board,s.aim,s.gridPhase);return target?pathToTarget(s.aim,target,s.gridPhase):traceShotPath(shooter,s.aim);};
export const originalBubbleSwarm:OriginalPort<OriginalBubbleState>&{controls:readonly string[]}={game:'bubble_swarm',name:'Bubbelzwerm',help:'Sleep om te richten, laat los. Maak drie gelijke bugs; bom en ijs helpen tegen de zwerm.',durationMs,controls:BUBBLE_CONTROLS,create,step,input};
