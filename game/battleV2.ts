import { item, rng, species } from './catalogV2';
import type { Ability, BattleEvent, BattleResult, Side, Trigger, Unit } from './typesV2';
export class BattleBudgetError extends Error {}
export const copy = <T,>(value:T):T => JSON.parse(JSON.stringify(value));
export function unit(id:string,kind:string,level=1,held:string|null=null):Unit { const s=species(kind);return {id,species:kind,level,xp:level===3?5:level===2?2:0,attack:Math.min(50,s.attack+(level-1)*2),health:Math.min(50,s.health+(level-1)*2),item:held}; }
export function simulate(left:Unit[],right:Unit[],seed:string):BattleResult {
 if(left.length>5||right.length>5)throw new Error('Maximaal vijf bugs per team.');
 const teams:[Unit[],Unit[]]=[copy(left),copy(right)],random=rng(seed),events:BattleEvent[]=[];let serial=0;
 for(const team of teams)for(const u of team){u.used={};u.shield=item(u.item)?.shield??0;u.health=Math.min(50,u.health+(item(u.item)?.health??0));}
 const initial=copy(teams),hurt:{unit:Unit;side:Side}[]=[];
 function emit(type:BattleEvent['type'],actor:Unit,side:Side,text:string,target?:Unit,amount?:number){if(events.length>=2048)throw new BattleBudgetError('Het gevecht overschrijdt het veilige eventbudget.');events.push({id:events.length,type,actor:actor.id,side,text,...(target?{target:target.id}:{}),...(amount!==undefined?{amount}:{}),animation:type,teams:copy(teams)});}
 function pick(list:Unit[],count=1){const pool=[...list],out:Unit[]=[];while(pool.length&&out.length<count)out.push(pool.splice(Math.floor(random()*pool.length),1)[0]);return out;}
 function targets(a:Ability,u:Unit,s:Side,position:number,appeared?:Unit):Unit[]{
  const friends=teams[s].filter(v=>v.health>0&&v.id!==u.id),enemies=teams[(1-s) as Side].filter(v=>v.health>0),at=teams[s].findIndex(v=>v.id===u.id),i=at<0?position:at;
  switch(a.target){case 'self':return [u];case 'ahead':return teams[s].slice(at<0?i:i+1).filter(v=>v.health>0).slice(0,1);case 'behind':return teams[s].slice(0,i).filter(v=>v.health>0).slice(-1);case 'friends':return friends;case 'randomFriend':return appeared?[appeared]:pick(friends,a.count??1);case 'frontEnemy':return enemies.slice(-1);case 'lastEnemy':return enemies.slice(0,1);case 'randomEnemy':return pick(enemies,a.count??1);case 'enemies':return enemies;case 'weakEnemy':return [...enemies].sort((a,b)=>a.health-b.health||a.id.localeCompare(b.id)).slice(0,1);default:return [];}
 }
 function hit(actor:Unit,target:Unit,s:Side,damage:number){if(damage<=0||target.health<=0)return;if(target.shield){target.shield--;emit('shieldBreak',actor,s,'Bladschild blokkeert de klap.',target,0);return;}const n=Math.max(1,damage-(item(target.item)?.damage??0));target.health-=n;emit('damage',actor,s,`${species(target.species).name} krijgt ${n} schade.`,target,n);hurt.push({unit:target,side:teams[0].includes(target)?0:1});}
 function trigger(u:Unit,s:Side,when:Trigger,position=teams[s].indexOf(u),appeared?:Unit){
  const a=species(u.species).ability;if(a.trigger!==when)return;u.used??={};const used=u.used[when]??0;if(used>=(a.limit??64))return;u.used[when]=used+1;
  if(!['buff','damage','summon','shield','heal'].includes(a.effect)||a.target==='shop')return;
  const level=u.level,ts=targets(a,u,s,position,appeared);emit('ability',u,s,species(u.species).name+': '+species(u.species).text);
  if(a.effect==='summon'){for(let k=0;k<(a.count??1);k++){if(teams[s].length>=5)break;const summoned=unit(`s${s}-token-${serial++}`,a.token??'larva');summoned.attack=(a.attack??1)*level;summoned.health=(a.health??1)*level;teams[s].splice(Math.max(0,Math.min(position,teams[s].length)),0,summoned);emit('summon',u,s,'Een nieuwe helper verschijnt.',summoned);for(const f of [...teams[s]])if(f.id!==summoned.id&&f.health>0)trigger(f,s,'summon',teams[s].indexOf(f),summoned);}return;}
  for(const t of ts){if(a.effect==='damage')hit(u,t,s,(a.amount??1)*level);else if(a.effect==='shield'){t.shield=1;emit('buff',u,s,'Een vriend krijgt een bladschild.',t);}else {const old=t.health;t.attack=Math.min(50,t.attack+(a.attack??0)*level);t.health=Math.min(50,t.health+(a.health??a.amount??0)*level);emit(a.effect==='heal'?'heal':'buff',u,s,'Een bug wordt sterker.',t,t.health-old);}}
 }
 function cleanup(){let guard=0;do {while(hurt.length){if(++guard>512)throw new BattleBudgetError('Te veel schadetriggers.');const h=hurt.shift()!;if(h.unit.health>0&&teams[h.side].includes(h.unit))trigger(h.unit,h.side,'hurt');}if(!teams.some(t=>t.some(u=>u.health<=0)))break;if(++guard>640)throw new BattleBudgetError('Te veel opeenvolgende uitvaltriggers.');const dead: {u:Unit;s:Side;i:number}[]=[];for(const s of [0,1] as Side[])for(let i=teams[s].length-1;i>=0;i--)if(teams[s][i].health<=0)dead.push({u:teams[s][i],s,i});
   for(const {u,s,i} of dead){const at=teams[s].findIndex(v=>v.id===u.id);if(at<0)continue;teams[s].splice(at,1);emit('faint',u,s,`${species(u.species).name} valt uit.`);trigger(u,s,'faint',Math.min(i,teams[s].length));if(item(u.item)?.revive&&teams[s].length<5){const n=unit(`s${s}-honey-${serial++}`,'larva');teams[s].splice(Math.min(i,teams[s].length),0,n);emit('summon',u,s,'Honing roept een larve op.',n);for(const f of [...teams[s]])if(f.id!==n.id&&f.health>0)trigger(f,s,'summon',teams[s].indexOf(f),n);}for(const f of [...teams[s]])if(f.health>0)trigger(f,s,'friendFaint');}
  }while(hurt.length||teams.some(t=>t.some(u=>u.health<=0)));}
 const starters=([0,1] as Side[]).flatMap(s=>teams[s].map(u=>({u,s,tie:random()}))).sort((a,b)=>b.u.attack-a.u.attack||a.tie-b.tie);
 for(const {u,s} of starters){if(u.health>0&&teams[s].includes(u)){trigger(u,s,'start');cleanup();}}
 for(let turn=0;turn<150&&teams[0].length&&teams[1].length;turn++){
  const a=teams[0].at(-1)!,b=teams[1].at(-1)!;trigger(a,0,'attack');trigger(b,1,'attack');cleanup();if(!teams[0].length||!teams[1].length)break;
  const x=teams[0].at(-1)!,y=teams[1].at(-1)!;emit('attack',x,0,'Je voorste bug valt aan.',y);emit('attack',y,1,'De tegenstander valt aan.',x);
  const ax=x.attack+(item(x.item)?.attack??0),ay=y.attack+(item(y.item)?.attack??0);hit(x,y,0,ax);hit(y,x,1,ay);
  if(item(x.item)?.splash){const back=teams[1].at(-2);if(back)hit(x,back,0,item(x.item)!.splash!);}if(item(y.item)?.splash){const back=teams[0].at(-2);if(back)hit(y,back,1,item(y.item)!.splash!);}
  cleanup();
 }
 const winner:Side|null=teams[0].length&&!teams[1].length?0:teams[1].length&&!teams[0].length?1:null;
 const actor=teams[0][0]??teams[1][0]??initial[0][0]??initial[1][0]??unit('result','larva');emit('result',actor,winner??0,winner===null?'Gelijkspel':winner===0?'Je team wint!':'Je team verliest.');
 return {seed,initial,teams:copy(teams),winner,events};
}
