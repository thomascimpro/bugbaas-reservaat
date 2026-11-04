import type {GymBattleMeta} from './gymsV2';
import type {DailyChallengeBattleMeta} from './dailyChallengeV2';
import {CHARGED,FAST,LEAGUES,movePool,stats,teamGo,TYPE_CHART} from './goV2';
import type {Charged,Element,GoBug,League} from './goV2';
import type {PlayerV2,Side,Specimen} from './typesV2';
import type {EchoBattleMeta} from './echoArenaV2';
import type {BossBattleMeta} from './goBossV2';
import type {Held} from './goV2';
import {checkV2 as check} from './shopV2';
export type GoFighter={id:string;species:string;shiny:boolean;go:GoBug;cp:number;attack:number;defense:number;maxHP:number;hp:number;energy:number;readyAt:number};
export type GoBattleInput={index:number;due:number;kind:'fast'|'charged'|'switch';value:string|number|null};
export type GoFastAim={x:number;y:number};
export type GoDodgeTrace={fromX:number;toX:number;fromY:number;toY:number};
export type GoBattle={flow?:2|3;aiPolicy?:'squad-1';aiStep?:number;npcChargeAt?:number;dailyChallenge?:DailyChallengeBattleMeta;queued?:[GoBattleInput|null,GoBattleInput|null];gym?:GymBattleMeta;echo?:EchoBattleMeta;boss?:BossBattleMeta;raid?:import('./raidsV2').RaidBattleMeta;plaagbende?:import('./plaagbendeV2').PlaagBattleMeta;id:string;revision:number;players:[string,string];names:[string,string];ratings:[number,number];league:League;ranked:boolean;training:boolean;teams:[GoFighter[],GoFighter[]];active:[number,number];shields:[number,number];swapAt:[number,number];replaceAt:[number,number];fast:[{index:number;due:number;aimed?:boolean}|null,{index:number;due:number;aimed?:boolean}|null];phase:'fight'|'charge'|'finished';charge:{side:Side;move:Charged;startedAt:number;deadline:number;hits:number[];lastTap:number;shield:boolean|null;dodged?:boolean;dodgeAt?:number}|null;winner:Side|null;settled:boolean;delta:number;rewards?:GoBattleReward[];createdAt:number;endsAt:number;events:{id:number;side:Side;kind:string;amount:number}[];serial:number};
export type GoBattleView=GoBattle&{side:Side};
export type GoBattleReward={item?:Held|null;dust:number;xp:number;fastTMs:number;chargedTMs:number};
export const SWITCH_COOLDOWN=45000;
export const FLOW_TURN_MS=400,FLOW_CHARGE_MS=3500,FLOW_SWITCH_MS=12000;
export const FLOW3_CHARGE_MS=1000,FLOW3_DODGE_MS=650,FLOW3_DURATION_MS=180000;
/** Normalized stage coordinates; the renderer shows this exact generous ellipse. */
export const COMBAT_AIM={x:740,y:290,rx:150,ry:110};
export const battleTurnMs=(b:GoBattle)=>b.flow===2?FLOW_TURN_MS:500;
/** Select rules only at construction. Stored versioned fights retain their rules. */
export function prepareGoBattle(b:GoBattle,flow:2|3=2){if(b.flow!==undefined)return b;b.flow=flow;if(flow===3){b.aiPolicy='squad-1';b.aiStep=0;if(!b.gym&&!b.raid)b.endsAt=Math.min(b.endsAt,b.createdAt+FLOW3_DURATION_MS);nextInputs3(b,b.createdAt);}else nextInputs(b,b.createdAt);return b;}
const chart=TYPE_CHART;
export function effectiveness(type:Element,defender:Element[]){return defender.reduce((n,t)=>n*(type==='ground'&&t==='flying'||type==='poison'&&t==='steel'?.390625:chart[type]?.strong.includes(t)?1.6:chart[type]?.weak.includes(t)?.625:1),1);}
export function damage(a:GoFighter,d:GoFighter,type:Element,power:number,quality=1){return Math.max(1,Math.floor(.5*power*a.attack/d.defense*(movePool(a.species).types.includes(type)?1.2:1)*effectiveness(type,movePool(d.species).types)*1.3*quality)+1);}
export function fighterGo(s:Specimen):GoFighter{const st=stats(s);return {id:s.id,species:s.species,shiny:s.shiny,go:structuredClone(s.go!),cp:st.cp,attack:st.attack,defense:st.defense,maxHP:st.hp,hp:st.hp,energy:0,readyAt:0};}
export function makeGoBattle(a:PlayerV2,b:PlayerV2,id:string,now:number,ranked:boolean,training=false,unlimited=false):GoBattle{
 teamGo(a,a.go!.team,a.go!.league,unlimited);teamGo(b,b.go!.team,a.go!.league,training);
 return {id,revision:0,players:[a.uid,b.uid],names:[a.name,b.name],ratings:[a.go!.rating,b.go!.rating],league:a.go!.league,ranked,training,teams:[a.go!.team.map(id=>fighterGo(a.specimens.find(s=>s.id===id)!)),b.go!.team.map(id=>fighterGo(b.specimens.find(s=>s.id===id)!))],active:[0,0],shields:[2,2],swapAt:[0,0],replaceAt:[0,0],fast:[null,null],phase:'fight',charge:null,winner:null,settled:false,delta:0,createdAt:now,endsAt:now+270000,events:[],serial:0};
}
const active=(b:GoBattle,s:Side)=>b.teams[s][b.active[s]];
function event(b:GoBattle,side:Side,kind:string,amount=0){b.events.push({id:++b.serial,side,kind,amount});b.events=b.events.slice(-12);b.revision++;}
function finishCheck(b:GoBattle,at:number){const alive=b.teams.map(t=>t.some(f=>f.hp>0));if(!alive[0]||!alive[1]){b.phase='finished';b.winner=alive[0]===alive[1]?null:alive[0]?0:1;b.charge=null;b.fast=[null,null];b.queued=[null,null];event(b,0,'result');return;}for(const s of [0,1] as const)if(active(b,s).hp<=0&&!b.replaceAt[s]){b.fast=[null,null];b.queued=[null,null];if(b.training&&s===1){b.active[s]=b.teams[s].findIndex(f=>f.hp>0);delete b.npcChargeAt;}else b.replaceAt[s]=at+(b.flow===2?5000:10000);event(b,s,'faint');}}
function chargeStart(b:GoBattle,side:Side,move:Charged,now:number){const a=active(b,side);a.energy-=CHARGED[move].energy;if(side===1)delete b.npcChargeAt;b.phase='charge';if(b.flow===2&&b.queued)b.queued[side]=null;else b.queued=[null,null];b.charge={side,move,startedAt:now,deadline:now+(b.flow===2?FLOW_CHARGE_MS:6000),hits:[],lastTap:0,shield:b.gym?false:null};event(b,side,'charge');}
function chargeEnd(b:GoBattle,now:number){const c=b.charge!;const a=active(b,c.side),other=(1-c.side) as Side,d=active(b,other),move=CHARGED[c.move],hit=c.shield?1:damage(a,d,move.type,move.power,(b.flow===2?.7:.25)+(b.flow===2?.3:.75)*c.hits.length/8);d.hp=Math.max(0,d.hp-hit);if(c.shield)b.shields[other]--;event(b,other,c.shield?'shield':'damage',hit);const pause=c.deadline-c.startedAt;if(b.npcChargeAt)b.npcChargeAt+=pause;for(const s of [0,1] as const){if(b.fast[s])b.fast[s]!.due+=pause;if(b.queued?.[s])b.queued[s]!.due+=pause;for(const f of b.teams[s])if(f.readyAt>c.startedAt)f.readyAt+=pause;}b.phase='fight';b.charge=null;finishCheck(b,now);if(b.flow===2)nextInputs(b,now);}
function inputPriority(kind:GoBattleInput['kind']){return kind==='switch'?2:kind==='charged'?1:0;}
function validInput(b:GoBattle,side:Side,q:GoBattleInput,at:number,energy=active(b,side).energy){const a=active(b,side);if(q.index!==b.active[side]||a.hp<=0||b.replaceAt.some(Boolean))return false;if(q.kind==='charged')return typeof q.value==='string'&&a.go.charged.includes(q.value as Charged)&&energy>=CHARGED[q.value as Charged].energy;if(q.kind==='switch')return Number.isInteger(q.value)&&Number(q.value)>=0&&Number(q.value)<b.teams[side].length&&Number(q.value)!==b.active[side]&&b.teams[side][Number(q.value)].hp>0&&b.swapAt[side]<=at;return true;}
function startInput(b:GoBattle,side:Side,q:GoBattleInput,at:number){const a=active(b,side);if(b.dailyChallenge&&side===0&&(q.kind==='fast'||q.kind==='charged'))b.dailyChallenge.turns++;if(q.kind==='fast'){b.fast[side]={index:b.active[side],due:at+FAST[a.go.fast].turns*battleTurnMs(b)};a.readyAt=b.fast[side]!.due;event(b,side,'fast');}else if(q.kind==='charged')chargeStart(b,side,q.value as Charged,at);else{b.active[side]=Number(q.value);if(a.hp>0)b.swapAt[side]=at+(b.flow===2?FLOW_SWITCH_MS:SWITCH_COOLDOWN);b.replaceAt[side]=0;if(b.queued)b.queued[side]=null;event(b,side,'switch');}}
function nextInputs(b:GoBattle,at:number){
 if(b.phase!=='fight'||b.replaceAt.some(Boolean))return;
 const inputs:{side:Side;input:GoBattleInput}[]=[];
 for(const side of [0,1] as const){const q=b.queued?.[side];if(q&&q.due<=at&&!b.fast[side]){b.queued![side]=null;if(validInput(b,side,q,at))inputs.push({side,input:q});}}
 if(b.training&&!b.fast[1]&&active(b,1).readyAt<=at&&!inputs.some(q=>q.side===1)){
  const a=active(b,1),target=active(b,0),preferred=b.echo?[...a.go.charged].sort((x,y)=>damage(a,target,CHARGED[y].type,CHARGED[y].power)/CHARGED[y].energy-damage(a,target,CHARGED[x].type,CHARGED[x].power)/CHARGED[x].energy)[0]:undefined;
  let move=preferred?(CHARGED[preferred].energy<=a.energy?preferred:undefined):a.go.charged.find(m=>CHARGED[m].energy<=a.energy);if(b.flow===2){if(move){b.npcChargeAt??=at+1200;if(at<b.npcChargeAt)move=undefined;}else delete b.npcChargeAt;}inputs.push({side:1,input:{index:b.active[1],due:at,kind:move?'charged':'fast',value:move??null}});
 }
 if(b.flow===2)for(const side of [0,1] as const)if(!b.fast[side]&&active(b,side).hp>0&&active(b,side).readyAt<=at&&!inputs.some(q=>q.side===side))inputs.push({side,input:{index:b.active[side],due:at,kind:'fast',value:null}});
 // Both trainers' due fast hits have landed. A simultaneous charged choice
 // uses attack, with a server event tie-break, rather than request order.
 const tie=b.serial%2;inputs.sort((a,c)=>inputPriority(c.input.kind)-inputPriority(a.input.kind)||(a.input.kind==='charged'?active(b,c.side).attack-active(b,a.side).attack:0)||((a.side+tie)%2)-((c.side+tie)%2));
 for(const q of inputs){if(b.phase==='fight')startInput(b,q.side,q.input,at);else if(b.flow===2&&q.input.kind==='charged'&&b.charge?.side!==q.side){b.queued??=[null,null];b.queued[q.side]=q.input;}}
}
export function advanceGoBattle(b:GoBattle,now:number){
 if(b.flow===3){advanceFlow3(b,now);return;}
 b.replaceAt??=[0,0];for(const side of [0,1] as const)if(b.replaceAt[side]&&b.replaceAt[side]<=now){b.active[side]=b.teams[side].findIndex(f=>f.hp>0);b.replaceAt[side]=0;event(b,side,'replace');}
 if(b.phase==='finished')return;
 if(b.phase==='charge'){if(b.training&&b.charge!.side===0&&b.charge!.shield===null)b.charge!.shield=b.shields[1]>0&&active(b,1).hp>active(b,1).maxHP*.25;if(b.training&&b.charge!.side===1)b.charge!.hits=Array.from({length:6},(_,i)=>i);const c=b.charge!,early=b.flow===2&&c.shield!==null&&(c.hits.length===8||b.training&&c.side===1)&&now-c.startedAt>=2000;if(early&&now<c.deadline)c.deadline=now;if(now>=c.deadline)chargeEnd(b,c.deadline);else return;}
 if((b.phase as string)==='finished')return;
 if(b.replaceAt.some(Boolean))return;
 // Resolve attacks with the same due time together, so request order cannot decide a simultaneous knockout.
 let safety=0;while(b.phase==='fight'&&safety++<(b.flow===2?1200:600)){
  const due=Math.min(...b.fast.filter(Boolean).map(f=>f!.due));if(!Number.isFinite(due)||due>now)break;
  const hits:{side:Side;amount:number;energy:number}[]=[];
  for(const side of [0,1] as const){const f=b.fast[side];if(!f||f.due!==due)continue;b.fast[side]=null;const a=b.teams[side][f.index];if(a.hp<=0||f.index!==b.active[side])continue;const m=FAST[a.go.fast];hits.push({side,amount:damage(a,active(b,(1-side) as Side),m.type,m.power),energy:m.energy});}
  for(const h of hits){const d=active(b,(1-h.side) as Side);d.hp=Math.max(0,d.hp-h.amount);active(b,h.side).energy=Math.min(100,active(b,h.side).energy+h.energy);event(b,(1-h.side) as Side,'damage',h.amount);}
  finishCheck(b,due);if(b.replaceAt.some(Boolean))break;nextInputs(b,due);
 }
 if(b.phase==='fight'&&now>=b.endsAt){const score=b.teams.map(t=>t.filter(f=>f.hp>0).length*1000+t.reduce((n,f)=>n+f.hp/f.maxHP,0));b.phase='finished';b.queued=[null,null];b.winner=b.boss||b.gym||b.raid?1:score[0]===score[1]?null:score[0]>score[1]?0:1;event(b,0,'result');}
 nextInputs(b,now);
}
export function actGoBattle(b:GoBattle,side:Side,kind:unknown,value:unknown,now:number,chargeAt?:unknown){
 if(b.flow===3){actFlow3(b,side,kind,value,now,chargeAt);return;}
 advanceGoBattle(b,now);
 if(chargeAt!==undefined){check(Number.isSafeInteger(chargeAt)&&Number(chargeAt)>0,'Ongeldige aanval.');if(b.flow===2&&(kind==='chargeTap'||kind==='shield')&&(b.phase!=='charge'||b.charge?.startedAt!==chargeAt))return;}
 if(b.flow===2&&b.phase==='finished'&&['fast','charged','switch','chargeTap','shield'].includes(String(kind)))return;
 if(b.flow===2&&kind==='fast')return;
 // A due NPC move or another player's poll can open a charge after the tap.
 // Keep a valid new-flow choice for after the incoming charge; legacy inputs only receive the fresh phase.
 if(b.phase==='charge'&&(kind==='fast'||kind==='charged'||kind==='switch')){if(b.flow===2&&b.charge!.side!==side&&kind!=='fast'){const q:GoBattleInput={index:b.active[side],due:b.charge!.startedAt,kind,value:value as string|number};if(validInput(b,side,q,now)){b.queued??=[null,null];const prior=b.queued[side];if(!prior||inputPriority(q.kind)>=inputPriority(prior.kind)){b.queued[side]=q;b.revision++;}}}return;}
 check(b.phase!=='finished','Dit gevecht is afgelopen.');
 if(kind==='forfeit'){b.phase='finished';b.winner=(1-side) as Side;b.fast=[null,null];b.queued=[null,null];b.charge=null;event(b,side,'forfeit');return;}
 if(b.phase==='charge'){const c=b.charge!;if(kind==='chargeTap'){const targets=Array.isArray(value)?value:[value];check(side===c.side&&targets.length>0&&targets.length<=8&&new Set(targets).size===targets.length&&targets.every(i=>Number.isInteger(i)&&Number(i)>=0&&Number(i)<8&&!c.hits.includes(Number(i)))&&now-Math.max(c.lastTap,c.startedAt)>=100*targets.length,'Raak ieder doel één keer.');c.hits.push(...targets as number[]);c.lastTap=now;event(b,side,'tap',targets.length);return;}check(kind==='shield'&&side!==c.side&&c.shield===null&&typeof value==='boolean'&&(!value||b.shields[side]>0),'Kies of je een schild gebruikt.');c.shield=value as boolean;event(b,side,'decision');return;}
 const a=active(b,side),forced=a.hp<=0,f=b.fast[side];check(kind==='switch'||!b.replaceAt.some(Boolean),'Kies eerst je volgende bug.');check(kind==='fast'||kind==='charged'||kind==='switch','Onbekende gevechtsactie.');
 const q:GoBattleInput={index:b.active[side],due:f?.due??now,kind:kind as GoBattleInput['kind'],value:kind==='fast'?null:value as string|number};
 if(f&&f.index===b.active[side]&&f.due>now&&!forced){
  check(validInput(b,side,q,now,Math.min(100,a.energy+FAST[a.go.fast].energy)),'Deze vervolgactie is nu niet mogelijk.');b.queued??=[null,null];const prior=b.queued[side];
  if(prior&&(inputPriority(prior.kind)>inputPriority(q.kind)||prior.kind===q.kind&&prior.value===q.value))return;
  b.queued[side]=q;b.revision++;return;
 }
 check(kind==='switch'&&forced||a.readyAt<=now&&!f,'Je snelle aanval loopt nog.');
 if(kind==='charged')check(validInput(b,side,q,now),'Deze aanval is nog niet opgeladen.');
 if(kind==='switch')check(Number.isInteger(value)&&Number(value)>=0&&Number(value)<b.teams[side].length&&Number(value)!==b.active[side]&&b.teams[side][Number(value)].hp>0&&(forced||b.swapAt[side]<=now),'Je kunt nu niet wisselen.');
 startInput(b,side,q,now);
}


function normalizedObject(value:unknown,keys:string[]){return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key)&&Number.isInteger((value as Record<string,unknown>)[key])&&Number((value as Record<string,unknown>)[key])>=0&&Number((value as Record<string,unknown>)[key])<=1000);}
function aimBonus(value:unknown){if(value===null||value===undefined)return false;check(normalizedObject(value,['x','y']),'Ongeldig richtpunt.');const p=value as GoFastAim;return ((p.x-COMBAT_AIM.x)/COMBAT_AIM.rx)**2+((p.y-COMBAT_AIM.y)/COMBAT_AIM.ry)**2<=1;}
function finish3(b:GoBattle,at:number){
 const alive=b.teams.map(t=>t.some(f=>f.hp>0));
 if(!alive[0]||!alive[1]){b.phase='finished';b.winner=alive[0]===alive[1]?null:alive[0]?0:1;b.charge=null;b.fast=[null,null];b.queued=[null,null];event(b,0,'result');return;}
 for(const side of [0,1] as const)if(active(b,side).hp<=0&&!b.replaceAt[side]){b.fast=[null,null];b.queued=[null,null];b.replaceAt[side]=at+5000;event(b,side,'faint');}
}
function timeout3(b:GoBattle){const score=b.teams.map(team=>{let numerator=0n,denominator=1n;for(const unit of team){const max=BigInt(unit.maxHP);numerator=numerator*max+BigInt(unit.hp)*denominator;denominator*=max;}return {alive:team.filter(f=>f.hp>0).length,numerator,denominator};}),left=score[0].numerator*score[1].denominator,right=score[1].numerator*score[0].denominator;b.phase='finished';b.winner=b.gym||b.raid||b.boss?1:score[0].alive!==score[1].alive?score[0].alive>score[1].alive?0:1:left===right?null:left>right?0:1;b.fast=[null,null];b.queued=[null,null];b.charge=null;event(b,0,'result');}
function start3(b:GoBattle,side:Side,input:GoBattleInput,at:number,aimed=false){
 const a=active(b,side);if(b.dailyChallenge&&side===0&&(input.kind==='fast'||input.kind==='charged'))b.dailyChallenge.turns++;
 if(input.kind==='fast'){const due=at+FAST[a.go.fast].turns*500;b.fast[side]={index:b.active[side],due,...(aimed?{aimed:true}:{})};a.readyAt=due;event(b,side,'fast');return;}
 if(input.kind==='switch'){b.active[side]=Number(input.value);if(a.hp>0)b.swapAt[side]=at+FLOW_SWITCH_MS;b.replaceAt[side]=0;b.fast[side]=null;if(b.queued)b.queued[side]=null;active(b,side).readyAt=Math.max(active(b,side).readyAt,at+300);event(b,side,'switch');return;}
 const move=input.value as Charged;a.energy-=CHARGED[move].energy;b.phase='charge';if(b.queued)b.queued[side]=null;b.charge={side,move,startedAt:at,deadline:at+FLOW3_CHARGE_MS,hits:[],lastTap:0,shield:false,dodged:false};event(b,side,'charge');
}
function aiInput3(b:GoBattle,at:number):GoBattleInput{
 const side=1 as const,a=active(b,side),enemy=active(b,0),step=b.aiStep??0;b.aiStep=step+1;
 // Snapshot-only decisions: the opponent's submitted/queued choice is never inspected.
 const matchup=(unit:GoFighter)=>effectiveness(FAST[unit.go.fast].type,movePool(enemy.species).types)/effectiveness(FAST[enemy.go.fast].type,movePool(unit.species).types);
 if(b.swapAt[side]<=at){const current=matchup(a),best=b.teams[side].map((unit,index)=>({unit,index,score:unit.hp>0?matchup(unit):0})).sort((x,y)=>y.score-x.score||x.index-y.index)[0];if(best.index!==b.active[side]&&best.score>current*1.2)return {index:b.active[side],due:at,kind:'switch',value:best.index};}
 const moves=[...a.go.charged].sort((x,y)=>damage(a,enemy,CHARGED[y].type,CHARGED[y].power)/CHARGED[y].energy-damage(a,enemy,CHARGED[x].type,CHARGED[x].power)/CHARGED[x].energy||a.go.charged.indexOf(x)-a.go.charged.indexOf(y));
 const heavy=[...moves].sort((x,y)=>CHARGED[y].energy-CHARGED[x].energy)[0],saveHeavy=step%3===2&&heavy&&a.energy<CHARGED[heavy].energy;
 const move=saveHeavy?undefined:moves.find(move=>a.energy>=CHARGED[move].energy);
 return {index:b.active[side],due:at,kind:move?'charged':'fast',value:move??null};
}
function nextInputs3(b:GoBattle,at:number){
 if(b.phase!=='fight'||b.replaceAt.some(Boolean))return;
 const due:{side:Side;input:GoBattleInput}[]=[];
 for(const side of [0,1] as const){const input=b.queued?.[side];if(input&&input.due<=at&&!b.fast[side]){b.queued![side]=null;if(validInput(b,side,input,at))due.push({side,input});}}
 if(b.training&&!b.fast[1]&&!b.queued?.[1]&&active(b,1).hp>0&&active(b,1).readyAt<=at&&!due.some(q=>q.side===1))due.push({side:1,input:aiInput3(b,at)});
 const tie=[...b.id].reduce((n,c)=>(n+c.charCodeAt(0))%2,b.serial%2);
 due.sort((x,y)=>inputPriority(y.input.kind)-inputPriority(x.input.kind)||(x.input.kind==='charged'?active(b,y.side).attack-active(b,x.side).attack:0)||((x.side+tie)%2)-((y.side+tie)%2));
 for(const q of due){if((b.phase as GoBattle['phase'])==='fight'&&validInput(b,q.side,q.input,at))start3(b,q.side,q.input,at);else if((b.phase as GoBattle['phase'])==='charge'&&q.input.kind==='charged'&&b.charge?.side!==q.side){b.queued??=[null,null];b.queued[q.side]={...q.input,due:b.charge!.deadline};}}
}
function dodge3(b:GoBattle,side:Side,value:unknown,at:number){
 const c=b.charge;if(!c||side===c.side||c.dodged||b.shields[side]<=0||at<c.deadline-FLOW3_DODGE_MS||at>=c.deadline)return;
 check(normalizedObject(value,['fromX','toX','fromY','toY']),'Ongeldige veeg.');const v=value as GoDodgeTrace;
 const dx=Math.abs(v.toX-v.fromX)*360/1000,dy=Math.abs(v.toY-v.fromY)*640/1000;
 if(dx<40||dx<dy)return;c.dodged=true;c.dodgeAt=at;b.shields[side]--;event(b,side,'dodge');
}
function resolveCharge3(b:GoBattle){
 const c=b.charge!,at=c.deadline,side=(1-c.side) as Side,a=active(b,c.side),d=active(b,side),move=CHARGED[c.move],full=damage(a,d,move.type,move.power),amount=c.dodged?Math.ceil(full*.25):full;
 d.hp=Math.max(0,d.hp-amount);event(b,side,'damage',amount);
 for(const s of [0,1] as const){if(b.fast[s])b.fast[s]!.due+=FLOW3_CHARGE_MS;if(b.queued?.[s]&&b.queued[s]!.due<at)b.queued[s]!.due=at;for(const unit of b.teams[s])if(unit.readyAt>c.startedAt)unit.readyAt+=FLOW3_CHARGE_MS;}
 b.phase='fight';b.charge=null;finish3(b,at);nextInputs3(b,at);
}
function advanceFlow3(b:GoBattle,now:number){
 if(b.phase==='finished')return;b.replaceAt??=[0,0];
 for(let safety=0;safety<1800&&(b.phase as GoBattle['phase'])!=='finished';safety++){
  if(b.phase==='charge'){
   const c=b.charge!,window=c.deadline-FLOW3_DODGE_MS;
   if(b.training&&c.side===0&&!c.dodged&&now>=window&&b.shields[1]>0&&(b.serial%3!==0||damage(active(b,0),active(b,1),CHARGED[c.move].type,CHARGED[c.move].power)>=active(b,1).hp))dodge3(b,1,{fromX:0,toX:1000,fromY:500,toY:500},window);
   if(b.endsAt<c.deadline&&now>=b.endsAt){timeout3(b);return;}if(now<c.deadline)return;resolveCharge3(b);continue;
  }
  const fastDue=Math.min(...b.fast.filter(Boolean).map(f=>f!.due)),replaceDue=Math.min(...b.replaceAt.filter(Boolean)),blocked=b.replaceAt.some(Boolean),queuedDue=blocked?Infinity:Math.min(...(b.queued??[]).filter((q,index)=>q&&!b.fast[index]).map(q=>q!.due)),aiDue=b.training&&!blocked&&!b.fast[1]&&!b.queued?.[1]&&active(b,1).hp>0?Math.max(b.createdAt,active(b,1).readyAt):Infinity;
  const at=Math.min(fastDue,replaceDue,queuedDue,aiDue,b.endsAt);if(at>now)return;
  for(const side of [0,1] as const)if(b.replaceAt[side]&&b.replaceAt[side]<=at){b.active[side]=b.teams[side].findIndex(f=>f.hp>0);b.replaceAt[side]=0;active(b,side).readyAt=Math.max(active(b,side).readyAt,at+300);event(b,side,'replace');}
  const hits:{side:Side;amount:number;energy:number}[]=[];
  for(const side of [0,1] as const){const f=b.fast[side];if(!f||f.due!==at)continue;b.fast[side]=null;const a=active(b,side);if(a.hp<=0||f.index!==b.active[side])continue;const move=FAST[a.go.fast],ordinary=damage(a,active(b,(1-side) as Side),move.type,move.power);hits.push({side,amount:f.aimed?Math.floor(ordinary*1.15):ordinary,energy:move.energy});}
  for(const hit of hits){const defender=active(b,(1-hit.side) as Side);defender.hp=Math.max(0,defender.hp-hit.amount);active(b,hit.side).energy=Math.min(100,active(b,hit.side).energy+hit.energy);event(b,(1-hit.side) as Side,'damage',hit.amount);}
  if(hits.length)finish3(b,at);if((b.phase as string)==='finished')return;if(at>=b.endsAt){timeout3(b);return;}nextInputs3(b,at);
 }
}
function actFlow3(b:GoBattle,side:Side,kind:unknown,value:unknown,now:number,chargeAt:unknown){
 advanceFlow3(b,now);
 if(kind==='dodge'){check(Number.isSafeInteger(chargeAt)&&Number(chargeAt)>0,'Ongeldige aanval.');if(b.phase!=='charge'||b.charge?.startedAt!==chargeAt)return;dodge3(b,side,value,now);return;}
 if(b.phase==='finished')return;
 if(kind==='forfeit'){b.phase='finished';b.winner=(1-side) as Side;b.fast=[null,null];b.queued=[null,null];b.charge=null;event(b,side,'forfeit');return;}
 if(b.phase==='charge')return;
 check(kind==='fast'||kind==='charged'||kind==='switch','Onbekende gevechtsactie.');
 const a=active(b,side),forced=a.hp<=0;if(kind!=='switch'&&b.replaceAt.some(Boolean))return;
 if(kind==='fast'){const aimed=aimBonus(value);if(a.hp<=0||b.fast[side]||a.readyAt>now)return;start3(b,side,{index:b.active[side],due:now,kind:'fast',value:null},now,aimed);return;}
 const q:GoBattleInput={index:b.active[side],due:Math.max(b.fast[side]?.due??now,Math.floor(now/100)*100+100),kind:kind as 'charged'|'switch',value:value as string|number};
 if(kind==='switch'&&forced){check(Number.isInteger(value)&&Number(value)>=0&&Number(value)<b.teams[side].length&&b.teams[side][Number(value)].hp>0,'Kies een levende reserve.');start3(b,side,q,now);return;}
 check(validInput(b,side,q,now),kind==='switch'?'Je kunt nu niet wisselen.':'Deze aanval is nog niet opgeladen.');b.queued??=[null,null];const prior=b.queued[side];if(!prior||inputPriority(q.kind)>=inputPriority(prior.kind)){b.queued[side]=q;b.revision++;}
}
