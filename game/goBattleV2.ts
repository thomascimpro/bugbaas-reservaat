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
export type GoBattle={dailyChallenge?:DailyChallengeBattleMeta;queued?:[GoBattleInput|null,GoBattleInput|null];gym?:GymBattleMeta;echo?:EchoBattleMeta;boss?:BossBattleMeta;raid?:import('./raidsV2').RaidBattleMeta;id:string;revision:number;players:[string,string];names:[string,string];ratings:[number,number];league:League;ranked:boolean;training:boolean;teams:[GoFighter[],GoFighter[]];active:[number,number];shields:[number,number];swapAt:[number,number];replaceAt:[number,number];fast:[{index:number;due:number}|null,{index:number;due:number}|null];phase:'fight'|'charge'|'finished';charge:{side:Side;move:Charged;startedAt:number;deadline:number;hits:number[];lastTap:number;shield:boolean|null}|null;winner:Side|null;settled:boolean;delta:number;rewards?:GoBattleReward[];createdAt:number;endsAt:number;events:{id:number;side:Side;kind:string;amount:number}[];serial:number};
export type GoBattleView=GoBattle&{side:Side};
export type GoBattleReward={item?:Held|null;dust:number;xp:number;fastTMs:number;chargedTMs:number};
export const SWITCH_COOLDOWN=45000;
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
function finishCheck(b:GoBattle,at:number){const alive=b.teams.map(t=>t.some(f=>f.hp>0));if(!alive[0]||!alive[1]){b.phase='finished';b.winner=alive[0]===alive[1]?null:alive[0]?0:1;b.charge=null;b.fast=[null,null];b.queued=[null,null];event(b,0,'result');return;}for(const s of [0,1] as const)if(active(b,s).hp<=0&&!b.replaceAt[s]){b.fast=[null,null];b.queued=[null,null];if(b.training&&s===1)b.active[s]=b.teams[s].findIndex(f=>f.hp>0);else b.replaceAt[s]=at+10000;event(b,s,'faint');}}
function chargeStart(b:GoBattle,side:Side,move:Charged,now:number){const a=active(b,side);a.energy-=CHARGED[move].energy;b.phase='charge';b.queued=[null,null];b.charge={side,move,startedAt:now,deadline:now+6000,hits:[],lastTap:0,shield:b.gym?false:null};event(b,side,'charge');}
function chargeEnd(b:GoBattle,now:number){const c=b.charge!;const a=active(b,c.side),other=(1-c.side) as Side,d=active(b,other),move=CHARGED[c.move],hit=c.shield?1:damage(a,d,move.type,move.power,.25+.75*c.hits.length/8);d.hp=Math.max(0,d.hp-hit);if(c.shield)b.shields[other]--;event(b,other,c.shield?'shield':'damage',hit);const pause=c.deadline-c.startedAt;for(const s of [0,1] as const){if(b.fast[s])b.fast[s]!.due+=pause;for(const f of b.teams[s])if(f.readyAt>c.startedAt)f.readyAt+=pause;}b.phase='fight';b.charge=null;finishCheck(b,now);}
function inputPriority(kind:GoBattleInput['kind']){return kind==='switch'?2:kind==='charged'?1:0;}
function validInput(b:GoBattle,side:Side,q:GoBattleInput,at:number,energy=active(b,side).energy){const a=active(b,side);if(q.index!==b.active[side]||a.hp<=0||b.replaceAt.some(Boolean))return false;if(q.kind==='charged')return typeof q.value==='string'&&a.go.charged.includes(q.value as Charged)&&energy>=CHARGED[q.value as Charged].energy;if(q.kind==='switch')return Number.isInteger(q.value)&&Number(q.value)>=0&&Number(q.value)<b.teams[side].length&&Number(q.value)!==b.active[side]&&b.teams[side][Number(q.value)].hp>0&&b.swapAt[side]<=at;return true;}
function startInput(b:GoBattle,side:Side,q:GoBattleInput,at:number){const a=active(b,side);if(b.dailyChallenge&&side===0&&(q.kind==='fast'||q.kind==='charged'))b.dailyChallenge.turns++;if(q.kind==='fast'){b.fast[side]={index:b.active[side],due:at+FAST[a.go.fast].turns*500};a.readyAt=b.fast[side]!.due;event(b,side,'fast');}else if(q.kind==='charged')chargeStart(b,side,q.value as Charged,at);else{b.active[side]=Number(q.value);if(a.hp>0)b.swapAt[side]=at+SWITCH_COOLDOWN;b.replaceAt[side]=0;if(b.queued)b.queued[side]=null;event(b,side,'switch');}}
function nextInputs(b:GoBattle,at:number){
 if(b.phase!=='fight'||b.replaceAt.some(Boolean))return;
 const inputs:{side:Side;input:GoBattleInput}[]=[];
 for(const side of [0,1] as const){const q=b.queued?.[side];if(q&&q.due<=at&&!b.fast[side]){b.queued![side]=null;if(validInput(b,side,q,at))inputs.push({side,input:q});}}
 if(b.training&&!b.fast[1]&&active(b,1).readyAt<=at&&!inputs.some(q=>q.side===1)){
  const a=active(b,1),target=active(b,0),preferred=b.echo?[...a.go.charged].sort((x,y)=>damage(a,target,CHARGED[y].type,CHARGED[y].power)/CHARGED[y].energy-damage(a,target,CHARGED[x].type,CHARGED[x].power)/CHARGED[x].energy)[0]:undefined;
  const move=preferred?(CHARGED[preferred].energy<=a.energy?preferred:undefined):a.go.charged.find(m=>CHARGED[m].energy<=a.energy);inputs.push({side:1,input:{index:b.active[1],due:at,kind:move?'charged':'fast',value:move??null}});
 }
 // Both trainers' due fast hits have landed. A simultaneous charged choice
 // uses attack, with a server event tie-break, rather than request order.
 const tie=b.serial%2;inputs.sort((a,c)=>inputPriority(c.input.kind)-inputPriority(a.input.kind)||(a.input.kind==='charged'?active(b,c.side).attack-active(b,a.side).attack:0)||((a.side+tie)%2)-((c.side+tie)%2));
 for(const q of inputs)if(b.phase==='fight')startInput(b,q.side,q.input,at);
}
export function advanceGoBattle(b:GoBattle,now:number){
 b.replaceAt??=[0,0];for(const side of [0,1] as const)if(b.replaceAt[side]&&b.replaceAt[side]<=now){b.active[side]=b.teams[side].findIndex(f=>f.hp>0);b.replaceAt[side]=0;event(b,side,'replace');}
 if(b.phase==='finished')return;
 if(b.phase==='charge'){if(b.training&&b.charge!.side===0&&b.charge!.shield===null)b.charge!.shield=b.shields[1]>0&&active(b,1).hp>active(b,1).maxHP*.25;if(b.training&&b.charge!.side===1)b.charge!.hits=Array.from({length:6},(_,i)=>i);if(now>=b.charge!.deadline)chargeEnd(b,now);else return;}
 if((b.phase as string)==='finished')return;
 if(b.replaceAt.some(Boolean))return;
 // Resolve attacks with the same due time together, so request order cannot decide a simultaneous knockout.
 let safety=0;while(b.phase==='fight'&&safety++<600){
  const due=Math.min(...b.fast.filter(Boolean).map(f=>f!.due));if(!Number.isFinite(due)||due>now)break;
  const hits:{side:Side;amount:number;energy:number}[]=[];
  for(const side of [0,1] as const){const f=b.fast[side];if(!f||f.due!==due)continue;b.fast[side]=null;const a=b.teams[side][f.index];if(a.hp<=0||f.index!==b.active[side])continue;const m=FAST[a.go.fast];hits.push({side,amount:damage(a,active(b,(1-side) as Side),m.type,m.power),energy:m.energy});}
  for(const h of hits){const d=active(b,(1-h.side) as Side);d.hp=Math.max(0,d.hp-h.amount);active(b,h.side).energy=Math.min(100,active(b,h.side).energy+h.energy);event(b,(1-h.side) as Side,'damage',h.amount);}
  finishCheck(b,due);if(b.replaceAt.some(Boolean))break;nextInputs(b,due);
 }
 if(b.phase==='fight'&&now>=b.endsAt){const score=b.teams.map(t=>t.filter(f=>f.hp>0).length*1000+t.reduce((n,f)=>n+f.hp/f.maxHP,0));b.phase='finished';b.queued=[null,null];b.winner=b.boss||b.gym||b.raid?1:score[0]===score[1]?null:score[0]>score[1]?0:1;event(b,0,'result');}
 nextInputs(b,now);
}
export function actGoBattle(b:GoBattle,side:Side,kind:unknown,value:unknown,now:number){
 advanceGoBattle(b,now);
 // A due NPC move or another player's poll can open a charge after the tap.
 // Return that fresh phase without spending or replaying the old fight intent.
 if(b.phase==='charge'&&(kind==='fast'||kind==='charged'||kind==='switch'))return;
 check(b.phase!=='finished','Dit gevecht is afgelopen.');
 if(kind==='forfeit'){b.phase='finished';b.winner=(1-side) as Side;b.fast=[null,null];b.queued=[null,null];b.charge=null;event(b,side,'forfeit');return;}
 if(b.phase==='charge'){const c=b.charge!;if(kind==='chargeTap'){check(side===c.side&&Number.isInteger(value)&&Number(value)>=0&&Number(value)<8&&!c.hits.includes(Number(value))&&now-c.lastTap>=100,'Raak ieder doel één keer.');c.hits.push(Number(value));c.lastTap=now;event(b,side,'tap');return;}check(kind==='shield'&&side!==c.side&&c.shield===null&&typeof value==='boolean'&&(!value||b.shields[side]>0),'Kies of je een schild gebruikt.');c.shield=value as boolean;event(b,side,'decision');return;}
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
