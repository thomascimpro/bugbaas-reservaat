import {CHARGED} from '../game/goV2';
import type {GoBattleView} from '../game/goBattleV2';

export type BufferedBattleAction={action:'fast'|'charged';value:string|null};
/** One deliberate tap may wait through a request/cooldown. It never repeats itself. */
export class BattleInputBuffer {
 private input:(BufferedBattleAction&{battle:string;unit:string;expires:number})|null=null;
 get queued(){return this.input?.action??null;}
 clear(){this.input=null;}
 push(b:GoBattleView,action:'fast'|'charged',value:string|null,now:number){
  const a=b.teams[b.side][b.active[b.side]];
  if(b.phase!=='fight'||a.hp<=0||b.replaceAt.some(Boolean))return;
  if(this.input?.action==='charged'&&action==='fast')return;
  this.input={battle:b.id,unit:a.id,action,value,expires:now+2500};
 }
 take(b:GoBattleView|null,now:number,busy:boolean):BufferedBattleAction|null {
  const q=this.input;if(!q)return null;
  if(!b||b.id!==q.battle||b.phase!=='fight'||now>q.expires){this.clear();return null;}
  const a=b.teams[b.side][b.active[b.side]],enemy=b.teams[1-b.side][b.active[1-b.side]];
  if(a.id!==q.unit||a.hp<=0||enemy.hp<=0||b.replaceAt.some(Boolean)){this.clear();return null;}
  // The next request advances a due fast attack on the server. Waiting for a
  // later state poll would add up to 500 ms of dead time to every attack.
  if(busy||a.readyAt>now||b.fast[b.side]&&b.fast[b.side]!.due>now)return null;
  if(q.action==='charged'&&(!q.value||!a.go.charged.includes(q.value as keyof typeof CHARGED)||a.energy<CHARGED[q.value as keyof typeof CHARGED].energy)){this.clear();return null;}
  this.clear();return {action:q.action,value:q.value};
 }
}
