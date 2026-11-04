/** Original mechanics extracted from CimPro BugBaas-3.0/src/components/minigames/NestDefenseGame.tsx.
 * Path, prices, enemy roles, waves, abilities, targeting and score formulas are retained.
 * React refs/Date.now are replaced by state and a 90ms simulation accumulator for server replay.
 * Old account/category bonuses are replaced by bounded actual squad stats; no score multiplier.
 */
import type {ArcadeTicket} from '../tapDuel';
import {originalSquadPower} from './types';
import type {OriginalInput,OriginalPort,OriginalState} from './types';

export type NestTowerKind='heavy'|'rapid'|'slow';
export type NestEnemyKind='armored'|'boss'|'fast'|'healer'|'normal'|'swarm'|'tank';
export type OriginalNestTower={cooldownUntil:number;id:string;kind?:NestTowerKind;level:number;x:number;y:number};
export type OriginalNestEnemy={hp:number;id:string;kind:NestEnemyKind;maxHp:number;progress:number;slowUntil:number;speed:number};
export type OriginalNestState=OriginalState&{
 game:'nest_defense';coins:number;maxHearts:number;wave:number;enemies:OriginalNestEnemy[];towers:OriginalNestTower[];selectedTower:NestTowerKind;
 kills:number;leaks:number;manualKills:number;manualCombo:number;maxManualCombo:number;lastManualKillAt:number;manualCooldownUntil:number;
 tapDamageLevel:number;tapSpeedLevel:number;sprayCooldownUntil:number;stickyCooldownUntil:number;lastControlTapAt:number;
 slowZones:{id:string;progress:number;until:number}[];bossWaves:number[];accumulator:number;simulatedMs:number;
 impacts:{id:number;x:number;y:number;at:number}[];impactId:number;
 help:{damageMultiplier:number;fireRateMultiplier:number;rechargeMultiplier:number;slowMultiplier:number};
};
export const NEST_CONTROLS=['field','tower_select','tower_slot','tap_damage','tap_speed','spray','sticky'] as const;
export const NEST_TOWER_KINDS:NestTowerKind[]=['rapid','heavy','slow'];
export const NEST_FIELD={width:360,height:420};
export const NEST_TOWER_COST:Record<NestTowerKind,number>={rapid:45,slow:65,heavy:80};
export const NEST_PATH=[{x:-8,y:14},{x:34,y:14},{x:34,y:40},{x:78,y:40},{x:78,y:64},{x:40,y:64},{x:40,y:88},{x:104,y:88}];
const towerSlots:OriginalNestTower[]=[{cooldownUntil:0,id:'a',level:0,x:24,y:24},{cooldownUntil:0,id:'b',level:0,x:68,y:27},{cooldownUntil:0,id:'c',level:0,x:50,y:48},{cooldownUntil:0,id:'d',level:0,x:24,y:69},{cooldownUntil:0,id:'e',level:0,x:70,y:75}];
const durationMs=150000,tickMs=90,manualCooldownMs=850,maxTapUpgradeLevel=4,sprayCooldownMs=12500,stickyCooldownMs=13000,stickyDurationMs=5600,healerAuraRange=.13;
// Original arcadeResultService.ts seededNumber, retained including its denominator.
function seededNumber(seed:string,index:number){const text=`${seed}:${index}`;let hash=2166136261;for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0)/4294967295;}
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export function nestPointOnPath(progress:number){const safe=clamp(progress,0,.999),scaled=safe*(NEST_PATH.length-1),index=Math.floor(scaled),mix=scaled-index,from=NEST_PATH[index],to=NEST_PATH[index+1];return {x:from.x+(to.x-from.x)*mix,y:from.y+(to.y-from.y)*mix};}
export function nestTowerSpec(kind:NestTowerKind,level:number,enemyKind:NestEnemyKind,damageMultiplier=1,fireRateMultiplier=1){
 if(kind==='rapid')return {cooldownMs:Math.max(230,Math.round((540-level*48)*fireRateMultiplier)),damage:Math.ceil(((enemyKind==='fast'||enemyKind==='swarm'?2:1)+Math.floor(level*.72))*damageMultiplier),range:21+level*3,slowMs:0};
 if(kind==='heavy')return {cooldownMs:Math.max(780,Math.round((1350-level*86)*fireRateMultiplier)),damage:Math.ceil(((enemyKind==='tank'||enemyKind==='boss'||enemyKind==='armored'?5:2)+level*2)*damageMultiplier),range:26+level*4,slowMs:0};
 return {cooldownMs:Math.max(820,Math.round((1180-level*66)*fireRateMultiplier)),damage:Math.ceil((1+Math.floor(level/2))*damageMultiplier),range:30+level*3,slowMs:enemyKind==='boss'?900+level*160:1400+level*300};
}
export function nestTowerUpgradeCost(kind:NestTowerKind,level:number){return (kind==='rapid'?82:kind==='slow'?94:112)+level*72+level*level*16;}
export function nestTapUpgradeCost(kind:'damage'|'speed',level:number){return (kind==='damage'?58:46)+level*54+level*level*12;}
export function nestManualCooldown(level:number){return Math.max(360,manualCooldownMs-(level-1)*135);}
export function nestManualDamage(level:number,wave:number){return 1+Math.floor(wave/7)+(level-1);}
export function nestEffectiveDamage(enemyKind:NestEnemyKind,damage:number,source:NestTowerKind|'manual'|'spray'){
 if(enemyKind==='armored'&&source!=='heavy')return Math.max(1,Math.floor(damage*.42));
 if(enemyKind==='swarm'&&source==='heavy')return Math.max(1,Math.floor(damage*.55));
 if(enemyKind==='healer'&&source==='slow')return Math.max(1,Math.floor(damage*.5));
 if(enemyKind==='boss'&&source==='manual')return Math.max(1,Math.floor(damage*.55));return damage;
}
function targetPriority(enemy:OriginalNestEnemy,kind:NestTowerKind,now:number){if(enemy.kind==='healer')return kind==='heavy'?24:18;if(kind==='rapid'&&(enemy.kind==='fast'||enemy.kind==='swarm'))return 22;if(kind==='heavy'&&['tank','boss','armored'].includes(enemy.kind))return 22;if(kind==='slow'&&enemy.slowUntil<=now)return enemy.kind==='swarm'?20:14;return enemy.kind==='boss'?12:enemy.kind==='armored'?10:enemy.kind==='tank'?9:enemy.kind==='fast'?7:enemy.kind==='swarm'?6:4;}
function coinReward(kind:NestEnemyKind){return kind==='boss'?72:kind==='tank'?26:kind==='armored'?28:kind==='healer'?24:kind==='fast'?16:kind==='swarm'?9:12;}
function killScore(kind:NestEnemyKind){return kind==='boss'?155:kind==='tank'?50:kind==='armored'?56:kind==='healer'?52:kind==='fast'?34:kind==='swarm'?18:25;}
function damageEnemy(s:OriginalNestState,id:string,damage:number,now:number,manual:boolean,slowMs:number,source:NestTowerKind|'manual'|'spray'){
 s.enemies=s.enemies.flatMap(enemy=>{if(enemy.id!==id)return [enemy];const hp=enemy.hp-nestEffectiveDamage(enemy.kind,damage,source);if(hp<=0){s.kills++;s.coins+=coinReward(enemy.kind);s.score+=killScore(enemy.kind);if(manual){s.manualKills++;s.manualCombo=now-s.lastManualKillAt<3200?s.manualCombo+1:1;s.maxManualCombo=Math.max(s.maxManualCombo,s.manualCombo);s.lastManualKillAt=now;s.score+=12+Math.min(6,s.manualCombo)*5;}return [];}return [{...enemy,hp,slowUntil:slowMs?Math.max(enemy.slowUntil,now+slowMs):enemy.slowUntil}];});
}
function densestEnemyProgress(s:OriginalNestState){return s.enemies.map(enemy=>({enemy,count:s.enemies.filter(e=>Math.abs(e.progress-enemy.progress)<.16).length})).sort((a,b)=>b.count-a.count||b.enemy.progress-a.enemy.progress)[0]?.enemy.progress??.5;}
function impact(s:OriginalNestState,pos:{x:number;y:number}){s.impacts=[...s.impacts.slice(-5),{...pos,id:s.impactId++,at:s.elapsedMs}];}
function finish(s:OriginalNestState,won:boolean){if(s.finished)return;s.score=Math.max(0,s.score+s.wave*45+s.hearts*55+s.kills*7+s.manualKills*22+s.maxManualCombo*28-s.leaks*30+(won?180:0));s.hearts=Math.max(0,s.hearts);s.finished=true;s.reason=won?'time':'hearts';}
function create(ticket:ArcadeTicket):OriginalNestState{
 const p=originalSquadPower(ticket.squad,ticket.league),hp=13+Math.floor(13*.14*p.hp);
 return {game:'nest_defense',elapsedMs:0,score:0,finished:false,reason:null,hearts:hp,maxHearts:hp,coins:125+Math.floor(125*.14*p.attack),wave:1,enemies:[],towers:towerSlots.map(t=>({...t})),selectedTower:'rapid',kills:0,leaks:0,manualKills:0,manualCombo:0,maxManualCombo:0,lastManualKillAt:0,manualCooldownUntil:0,tapDamageLevel:1,tapSpeedLevel:1,sprayCooldownUntil:0,stickyCooldownUntil:0,lastControlTapAt:0,slowZones:[],bossWaves:[],accumulator:0,simulatedMs:0,impacts:[],impactId:0,help:{damageMultiplier:1+.1*p.attack,fireRateMultiplier:1-.08*p.defense,rechargeMultiplier:1-.12*p.hp,slowMultiplier:1-.14*p.defense}};
}
function spawnEnemies(s:OriginalNestState,ticket:ArcadeTicket,elapsed:number){
 if(s.enemies.length>38)return;const wave=s.wave;
 if(wave>=6&&(wave-6)%5===0&&!s.bossWaves.includes(wave)){s.bossWaves.push(wave);const maxHp=46+wave*7+Math.max(0,wave-11)*5;s.enemies.push({hp:maxHp,id:`boss:${wave}:${elapsed}`,kind:'boss',maxHp,progress:0,slowUntil:0,speed:.00255+Math.min(16,wave)*.000075});}
 const interval=Math.max(260,900-wave*38);if(elapsed%interval>=tickMs)return;const step=Math.floor(elapsed/interval),roll=seededNumber(String(ticket.seed),step);
 const kind:NestEnemyKind=wave>=7&&step%13===0?'healer':wave>=5&&step%7===0?'armored':wave>=6&&roll<.16?'swarm':wave>=4&&step%5===0?'tank':wave>=2&&roll>.62?'fast':'normal';
 const maxHp=kind==='healer'?8+Math.floor(wave*1.15):kind==='armored'||kind==='tank'?10+(kind==='armored'?1:0)+Math.floor(wave*1.75):kind==='swarm'?2+Math.floor(wave*.28):kind==='fast'?2+Math.floor(wave*.42):3+Math.floor(wave*.68);
 const speed=kind==='swarm'?.0071+wave*.00028:kind==='fast'?.0064+wave*.00025:kind==='healer'?.0035+wave*.00013:kind==='tank'||kind==='armored'?.0029+wave*.00012:.0045+wave*.00019;
 s.enemies.push({hp:maxHp,id:`${elapsed}:${step}`,kind,maxHp,progress:0,slowUntil:0,speed});
}
function simulationTick(s:OriginalNestState,ticket:ArcadeTicket,now:number){
 s.wave=1+Math.floor(now/9000);s.slowZones=s.slowZones.filter(z=>z.until>now);
 s.enemies=s.enemies.filter(enemy=>{const zoneSlow=s.slowZones.some(z=>Math.abs(z.progress-enemy.progress)<.12)?.44:1,towerSlow=now<enemy.slowUntil?.52*s.help.slowMultiplier:1;enemy.progress+=enemy.speed*zoneSlow*towerSlow;if(enemy.progress<1)return true;s.hearts-=enemy.kind==='boss'?(s.wave>=21?6:s.wave>=16?5:s.wave>=11?4:3):enemy.kind==='tank'||enemy.kind==='armored'?2:1;s.leaks++;return false;});
 const healers=s.enemies.filter(e=>e.kind==='healer');s.enemies=s.enemies.map(e=>e.kind!=='healer'&&e.hp<e.maxHp&&healers.some(h=>Math.abs(h.progress-e.progress)<=healerAuraRange)?{...e,hp:Math.min(e.maxHp,e.hp+.18+s.wave*.015)}:e);
 for(const tower of s.towers){if(!tower.kind||tower.cooldownUntil>now)continue;const kind=tower.kind,target=s.enemies.filter(e=>{const p=nestPointOnPath(e.progress);return Math.hypot(p.x-tower.x,p.y-tower.y)<=nestTowerSpec(kind,tower.level,e.kind).range;}).sort((a,b)=>targetPriority(b,kind,now)-targetPriority(a,kind,now)||b.progress-a.progress)[0];if(!target)continue;const spec=nestTowerSpec(kind,tower.level,target.kind,s.help.damageMultiplier,s.help.fireRateMultiplier);damageEnemy(s,target.id,spec.damage,now,false,spec.slowMs,kind);impact(s,nestPointOnPath(target.progress));tower.cooldownUntil=now+spec.cooldownMs;}
 spawnEnemies(s,ticket,now);if(s.hearts<=0)finish(s,false);
}
function step(s:OriginalNestState,ticket:ArcadeTicket,dt:number){if(s.finished)return;s.elapsedMs=Math.min(durationMs,s.elapsedMs+dt);s.accumulator+=dt;while(s.accumulator>=tickMs&&!s.finished){s.accumulator-=tickMs;s.simulatedMs+=tickMs;simulationTick(s,ticket,s.simulatedMs);}s.impacts=s.impacts.filter(i=>s.elapsedMs-i.at<260);if(!s.finished&&s.elapsedMs>=durationMs)finish(s,true);}
function input(s:OriginalNestState,_ticket:ArcadeTicket,i:OriginalInput){
 if(s.finished||(i.action??'down')!=='down')return false;const control=i.control??'field',now=s.elapsedMs;
 if(control==='field'){
  if(now-s.lastControlTapAt<120||now<s.manualCooldownUntil)return false;const x=i.x/1000*NEST_FIELD.width,y=i.y/1000*NEST_FIELD.height;
  const target=s.enemies.map(enemy=>{const p=nestPointOnPath(enemy.progress);return {enemy,d:Math.hypot(x-p.x*NEST_FIELD.width/100,y-p.y*NEST_FIELD.height/100)};}).filter(e=>e.d<=48).sort((a,b)=>a.d-b.d)[0]?.enemy;if(!target)return false;
  s.manualCooldownUntil=now+nestManualCooldown(s.tapSpeedLevel);impact(s,{x:i.x/10,y:i.y/10});damageEnemy(s,target.id,nestManualDamage(s.tapDamageLevel,s.wave),now,true,0,'manual');return true;
 }
 if(!NEST_CONTROLS.includes(control as typeof NEST_CONTROLS[number]))return false;s.lastControlTapAt=now;
 if(control==='tower_select'){const kind=NEST_TOWER_KINDS[Math.min(2,Math.floor(i.x*3/1001))];if(s.selectedTower===kind)return false;s.selectedTower=kind;return true;}
 if(control==='tower_slot'){const tower=s.towers[Math.min(4,Math.floor(i.x*5/1001))];if(!tower.kind){const cost=NEST_TOWER_COST[s.selectedTower];if(s.coins<cost)return false;s.coins-=cost;tower.kind=s.selectedTower;tower.level=1;return true;}const cost=nestTowerUpgradeCost(tower.kind,tower.level);if(tower.level>=4||s.coins<cost)return false;s.coins-=cost;tower.level++;return true;}
 if(control==='tap_damage'||control==='tap_speed'){const kind=control==='tap_damage'?'damage':'speed',level=kind==='damage'?s.tapDamageLevel:s.tapSpeedLevel,cost=nestTapUpgradeCost(kind,level);if(level>=maxTapUpgradeLevel||s.coins<cost)return false;s.coins-=cost;if(kind==='damage')s.tapDamageLevel++;else s.tapSpeedLevel++;return true;}
 if(control==='spray'){if(now<s.sprayCooldownUntil||!s.enemies.length)return false;s.sprayCooldownUntil=now+Math.round(sprayCooldownMs*s.help.rechargeMultiplier);const center=densestEnemyProgress(s);for(const e of [...s.enemies].filter(e=>Math.abs(e.progress-center)<.18)){impact(s,nestPointOnPath(e.progress));damageEnemy(s,e.id,3+Math.floor(s.wave/5),now,false,0,'spray');}return true;}
 if(control==='sticky'){if(now<s.stickyCooldownUntil||!s.enemies.length)return false;s.stickyCooldownUntil=now+Math.round(stickyCooldownMs*s.help.rechargeMultiplier);s.slowZones=[...s.slowZones.slice(-2),{id:`web:${now}`,progress:densestEnemyProgress(s),until:now+stickyDurationMs}];return true;}
 return false;
}
export const originalNestDefense:OriginalPort<OriginalNestState>&{controls:readonly string[]}={game:'nest_defense',name:'Nestwacht',help:'Bouw torens langs het pad. Tik bugs, gebruik spray en web; bescherm je nest.',durationMs,controls:NEST_CONTROLS,create,step,input};
