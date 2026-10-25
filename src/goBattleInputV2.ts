import {CHARGED,FAST} from '../game/goV2';
import type {GoBattleView} from '../game/goBattleV2';

export type BufferedBattleAction={action:'fast'|'charged'|'switch'|'chargeTap'|'shield';value:string|number|boolean|null};
export function battleReadyEnergy(b:GoBattleView){const a=b.teams[b.side][b.active[b.side]],f=b.fast[b.side];return Math.min(100,a.energy+(f?.index===b.active[b.side]?FAST[a.go.fast].energy:0));}
/** One deliberate tap may wait through a request/cooldown. It never repeats itself. */
export class BattleInputBuffer {
 private input:(BufferedBattleAction&{battle:string;unit:string;expires:number})|null=null;
 private charge:{battle:string;startedAt:number;targets:number[];sent:number[];lastSent:number;shield:boolean|undefined;shieldSent:boolean}|null=null;
 get queued(){return this.input?.action??null;}
 get pendingTargets(){return this.charge?[...this.charge.sent,...this.charge.targets]:[];}
 get pendingShield(){return this.charge?.shield;}
 clear(){this.input=null;this.charge=null;}
 push(b:GoBattleView,action:BufferedBattleAction['action'],value:BufferedBattleAction['value'],now:number){
  if(b.phase==='charge'&&b.charge&&now<b.charge.deadline){
   const c=b.charge;if(!this.charge||this.charge.battle!==b.id||this.charge.startedAt!==c.startedAt)this.charge={battle:b.id,startedAt:c.startedAt,targets:[],sent:[],lastSent:0,shield:undefined,shieldSent:false};
   if(action==='chargeTap'&&c.side===b.side&&Number.isInteger(value)&&Number(value)>=0&&Number(value)<8&&!c.hits.includes(Number(value))&&!this.pendingTargets.includes(Number(value)))this.charge.targets.push(Number(value));
   else if(action==='shield'&&c.side!==b.side&&c.shield===null&&typeof value==='boolean'&&(!value||b.shields[b.side]>0)&&this.charge.shield===undefined)this.charge.shield=value;
   return;
  }
  const a=b.teams[b.side][b.active[b.side]];
  if(b.phase!=='fight'||!['fast','charged','switch'].includes(action))return;
  if(action==='switch'){
   const target=typeof value==='number'?b.teams[b.side][value]:undefined;
   if(!Number.isInteger(value)||!target||target.hp<=0||value===b.active[b.side]||a.hp>0&&b.swapAt[b.side]>now)return;
  }else if(a.hp<=0||b.replaceAt.some(Boolean))return;
  const queued=b.queued?.[b.side]?.kind;
  if((this.input?.action==='switch'||queued==='switch')&&action!=='switch'||(this.input?.action==='charged'||queued==='charged')&&action==='fast')return;
  this.input={battle:b.id,unit:a.id,action,value,expires:now+2500};
 }
 take(b:GoBattleView|null,now:number,busy:boolean):BufferedBattleAction|null {
  if(this.charge){
   const q=this.charge,c=b?.charge;
   if(!b||b.phase!=='charge'||!c||b.id!==q.battle||c.startedAt!==q.startedAt||now>=c.deadline)this.charge=null;
   else{
    this.input=null;q.sent=q.sent.filter(i=>!c.hits.includes(i));q.targets=q.targets.filter(i=>!c.hits.includes(i));
    if(busy)return null;
    if(c.side===b.side&&q.targets.length&&now-Math.max(c.lastTap,q.lastSent)>=120){const value=q.targets.shift()!;q.sent.push(value);q.lastSent=now;return {action:'chargeTap',value};}
    if(c.side!==b.side&&c.shield===null&&q.shield!==undefined&&!q.shieldSent){q.shieldSent=true;return {action:'shield',value:q.shield};}
    return null;
   }
  }
  const q=this.input;if(!q)return null;
  if(!b||b.id!==q.battle||b.phase!=='fight'||now>q.expires){this.input=null;return null;}
  const a=b.teams[b.side][b.active[b.side]],enemy=b.teams[1-b.side][b.active[1-b.side]];
  if(a.id!==q.unit||q.action!=='switch'&&(a.hp<=0||enemy.hp<=0||b.replaceAt.some(Boolean))){this.input=null;return null;}
  if(q.action==='switch'&&a.hp<=0){if(busy)return null;this.input=null;return {action:q.action,value:q.value};}
  // Send one deliberate next action during the fast move. The server owns its
  // due time, avoiding another network round trip between consecutive moves.
  if(busy||a.readyAt>now&&!b.fast[b.side])return null;
  if(q.action==='charged'&&(typeof q.value!=='string'||!a.go.charged.includes(q.value as keyof typeof CHARGED)||battleReadyEnergy(b)<CHARGED[q.value as keyof typeof CHARGED].energy)){this.input=null;return null;}
  const queued=b.queued?.[b.side];if(queued&&queued.kind===q.action&&queued.value===q.value){this.input=null;return null;}
  this.input=null;return {action:q.action,value:q.value};
 }
}
