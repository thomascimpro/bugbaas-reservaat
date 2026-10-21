import {CHARGED,FAST,LEAGUES,movePool,stats,teamGo} from './goV2';
import type {Charged,Element,GoBug,League} from './goV2';
import type {PlayerV2,Side,Specimen} from './typesV2';
import type {EchoBattleMeta} from './echoArenaV2';
import type {BossBattleMeta} from './goBossV2';
import type {Held} from './goV2';
import {checkV2 as check} from './shopV2';
export type GoFighter={id:string;species:string;shiny:boolean;go:GoBug;cp:number;attack:number;defense:number;maxHP:number;hp:number;energy:number;readyAt:number};
export type GoBattle={echo?:EchoBattleMeta;boss?:BossBattleMeta;id:string;revision:number;players:[string,string];names:[string,string];ratings:[number,number];league:League;ranked:boolean;training:boolean;teams:[GoFighter[],GoFighter[]];active:[number,number];shields:[number,number];swapAt:[number,number];replaceAt:[number,number];fast:[{index:number;due:number}|null,{index:number;due:number}|null];phase:'fight'|'charge'|'finished';charge:{side:Side;move:Charged;startedAt:number;deadline:number;hits:number[];lastTap:number;shield:boolean|null}|null;winner:Side|null;settled:boolean;delta:number;rewards?:GoBattleReward[];createdAt:number;endsAt:number;events:{id:number;side:Side;kind:string;amount:number}[];serial:number};
export type GoBattleView=GoBattle&{side:Side};
export type GoBattleReward={item?:Held|null;dust:number;xp:number;fastTMs:number;chargedTMs:number};
export const SWITCH_COOLDOWN=45000;
const chart:Partial<Record<Element,{strong:Element[];weak:Element[]}>>={
 bug:{strong:['grass','dark'],weak:['flying','poison','steel','fire']},
 flying:{strong:['bug','grass'],weak:['rock','steel']},
 poison:{strong:['grass'],weak:['poison','ground','rock','steel']},
 grass:{strong:['ground','rock','water'],weak:['grass','poison','flying','bug','steel','fire']},
 ground:{strong:['poison','rock','steel','fire'],weak:['grass','bug','flying']},
 rock:{strong:['bug','flying','fire'],weak:['ground','steel']},
 steel:{strong:['rock'],weak:['steel','fire','water']},
 dark:{strong:[],weak:['dark']},
 fire:{strong:['bug','grass','steel'],weak:['fire','rock','water']},
 water:{strong:['fire','ground','rock'],weak:['grass','water']},
};
export function effectiveness(type:Element,defender:Element[]){return defender.reduce((n,t)=>n*(type==='ground'&&t==='flying'||type==='poison'&&t==='steel'?.390625:chart[type]?.strong.includes(t)?1.6:chart[type]?.weak.includes(t)?.625:1),1);}
export function damage(a:GoFighter,d:GoFighter,type:Element,power:number,quality=1){return Math.max(1,Math.floor(.5*power*a.attack/d.defense*(movePool(a.species).types.includes(type)?1.2:1)*effectiveness(type,movePool(d.species).types)*1.3*quality)+1);}
export function fighterGo(s:Specimen):GoFighter{const st=stats(s);return {id:s.id,species:s.species,shiny:s.shiny,go:structuredClone(s.go!),cp:st.cp,attack:st.attack,defense:st.defense,maxHP:st.hp,hp:st.hp,energy:0,readyAt:0};}
export function makeGoBattle(a:PlayerV2,b:PlayerV2,id:string,now:number,ranked:boolean,training=false):GoBattle{
 teamGo(a,a.go!.team,a.go!.league);teamGo(b,b.go!.team,a.go!.league,training);
 return {id,revision:0,players:[a.uid,b.uid],names:[a.name,b.name],ratings:[a.go!.rating,b.go!.rating],league:a.go!.league,ranked,training,teams:[a.go!.team.map(id=>fighterGo(a.specimens.find(s=>s.id===id)!)),b.go!.team.map(id=>fighterGo(b.specimens.find(s=>s.id===id)!))],active:[0,0],shields:[2,2],swapAt:[0,0],replaceAt:[0,0],fast:[null,null],phase:'fight',charge:null,winner:null,settled:false,delta:0,createdAt:now,endsAt:now+270000,events:[],serial:0};
}
const active=(b:GoBattle,s:Side)=>b.teams[s][b.active[s]];
function event(b:GoBattle,side:Side,kind:string,amount=0){b.events.push({id:++b.serial,side,kind,amount});b.events=b.events.slice(-12);b.revision++;}
function finishCheck(b:GoBattle,at:number){const alive=b.teams.map(t=>t.some(f=>f.hp>0));if(!alive[0]||!alive[1]){b.phase='finished';b.winner=alive[0]===alive[1]?null:alive[0]?0:1;b.charge=null;b.fast=[null,null];event(b,0,'result');return;}for(const s of [0,1] as const)if(active(b,s).hp<=0&&!b.replaceAt[s]){b.fast=[null,null];if(b.training&&s===1)b.active[s]=b.teams[s].findIndex(f=>f.hp>0);else b.replaceAt[s]=at+10000;event(b,s,'faint');}}
function chargeStart(b:GoBattle,side:Side,move:Charged,now:number){const a=active(b,side);a.energy-=CHARGED[move].energy;b.phase='charge';b.charge={side,move,startedAt:now,deadline:now+6000,hits:[],lastTap:0,shield:null};event(b,side,'charge');}
function chargeEnd(b:GoBattle,now:number){const c=b.charge!;const a=active(b,c.side),other=(1-c.side) as Side,d=active(b,other),move=CHARGED[c.move],hit=c.shield?1:damage(a,d,move.type,move.power,.25+.75*c.hits.length/8);d.hp=Math.max(0,d.hp-hit);if(c.shield)b.shields[other]--;event(b,other,c.shield?'shield':'damage',hit);const pause=c.deadline-c.startedAt;for(const s of [0,1] as const){if(b.fast[s])b.fast[s]!.due+=pause;for(const f of b.teams[s])if(f.readyAt>c.startedAt)f.readyAt+=pause;}b.phase='fight';b.charge=null;finishCheck(b,now);}
function npc(b:GoBattle,at:number){if(!b.training||b.phase!=='fight'||b.replaceAt.some(Boolean))return;const s:Side=1,a=active(b,s);if(b.fast[s]||a.readyAt>at)return;const target=active(b,0),preferred=b.echo?[...a.go.charged].sort((x,y)=>damage(a,target,CHARGED[y].type,CHARGED[y].power)/CHARGED[y].energy-damage(a,target,CHARGED[x].type,CHARGED[x].power)/CHARGED[x].energy)[0]:undefined;
 const m=preferred?(CHARGED[preferred].energy<=a.energy?preferred:undefined):a.go.charged.find(m=>CHARGED[m].energy<=a.energy);if(m){chargeStart(b,s,m,at);return;}b.fast[s]={index:b.active[s],due:at+FAST[a.go.fast].turns*500};a.readyAt=b.fast[s]!.due;}
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
  finishCheck(b,due);if(b.replaceAt.some(Boolean))break;npc(b,due);
 }
 if(b.phase==='fight'&&now>=b.endsAt){const score=b.teams.map(t=>t.filter(f=>f.hp>0).length*1000+t.reduce((n,f)=>n+f.hp/f.maxHP,0));b.phase='finished';b.winner=score[0]===score[1]?null:score[0]>score[1]?0:1;event(b,0,'result');}
 npc(b,now);
}
export function actGoBattle(b:GoBattle,side:Side,kind:unknown,value:unknown,now:number){
 advanceGoBattle(b,now);check(b.phase!=='finished','Dit gevecht is afgelopen.');
 if(kind==='forfeit'){b.phase='finished';b.winner=(1-side) as Side;b.fast=[null,null];b.charge=null;event(b,side,'forfeit');return;}
 if(b.phase==='charge'){const c=b.charge!;if(kind==='chargeTap'){check(side===c.side&&Number.isInteger(value)&&Number(value)>=0&&Number(value)<8&&!c.hits.includes(Number(value))&&now-c.lastTap>=100,'Raak ieder doel één keer.');c.hits.push(Number(value));c.lastTap=now;event(b,side,'tap');return;}check(kind==='shield'&&side!==c.side&&c.shield===null&&typeof value==='boolean'&&(!value||b.shields[side]>0),'Kies of je een schild gebruikt.');c.shield=value as boolean;event(b,side,'decision');return;}
 const a=active(b,side),forced=a.hp<=0;check(kind==='switch'||!b.replaceAt.some(Boolean),'Kies eerst je volgende bug.');check(kind==='switch'&&forced||a.readyAt<=now&&!b.fast[side],'Je snelle aanval loopt nog.');
 if(kind==='fast'){b.fast[side]={index:b.active[side],due:now+FAST[a.go.fast].turns*500};a.readyAt=b.fast[side]!.due;event(b,side,'fast');}
 else if(kind==='charged'){check(typeof value==='string'&&a.go.charged.includes(value as Charged)&&a.energy>=CHARGED[value as Charged].energy,'Deze aanval is nog niet opgeladen.');chargeStart(b,side,value as Charged,now);}
 else if(kind==='switch'){check(Number.isInteger(value)&&Number(value)>=0&&Number(value)<3&&Number(value)!==b.active[side]&&b.teams[side][Number(value)].hp>0&&(forced||b.swapAt[side]<=now),'Je kunt nu niet wisselen.');b.active[side]=Number(value);if(!forced)b.swapAt[side]=now+SWITCH_COOLDOWN;b.replaceAt[side]=0;event(b,side,'switch');}
 else check(false,'Onbekende gevechtsactie.');
}
