import {FAST,LEAGUES,movePool,stats} from '../goV2';
import type {Element,Fast,League} from '../goV2';
import {effectiveness} from '../goBattleV2';
import {checkV2 as check} from '../shopV2';
import type {PlayerV2} from '../typesV2';

export const ARCADE_RULES='tap-1';
export const TICK_MS=20,DURATION_TICKS=2250,FIELD={width:360,height:640};
export type ArcadeBug={id:string;species:string;shiny:boolean;cp:number;attack:number;defense:number;hp:number;fast:Fast;types:Element[]};
export type ArcadeTap={tick:number;x:number;y:number;action?:'down'|'up'|'move';control?:string};
export type ArcadeTarget={id:number;kind:number;born:number;hp:number;maxHP:number;attack:number;defense:number;types:Element[];points:number;lastShooter:number|null;attacked:boolean};
export type ArcadeEffect={tick:number;kind:'hit'|'defeat'|'hurt';target:number;shooter:number;amount:number;x:number;y:number};
export type TapState={tick:number;score:number;squad:(ArcadeBug&{health:number;ready:number})[];targets:ArcadeTarget[];nextSpawn:number;finished:boolean;effects:ArcadeEffect[];hits:number};
export type ArcadeGameId=import('./games').ArcadeGameId;
export type ArcadeEndReason='time'|'hearts'|'squad_defeated'|'board_clear'|'lower_bound'|'target_score'|'original_end'|'input_limit';
export type ArcadeWeeklyReward={week:string;dust:number;candy:number;family?:string};
export type ArcadeGameProgress={completed:number;medals:number[]};
export type ArcadeScoreView={name:string;score:number;kind:'player'|'personal'|'computer';me:boolean;at?:number};
export type ArcadeProgressView={completed:number;games:Partial<Record<ArcadeGameId,ArcadeGameProgress>>;week:{key:string;days:number;required:number;claimed:boolean};rewarded:number;dailyDust:number;dailyXP:number};
export type ArcadeNext={game:ArcadeGameId;name:string;durationSeconds:number;gesture:string;help:string};
export type ArcadeTicket={id:string;owner:string;game?:ArcadeGameId;mode?:'rotation'|'practice'|'ranked';ranked?:import('./ranked').ArcadeRankedTicket;crew?:import('./crew').CrewEncounter;challenge:string;rules:string;league:League;seed:number;squad:ArcadeBug[];issuedAt:number;expiresAt:number;target:{name:string;score:number;kind:'player'|'personal'|'computer'};status:'started'|'accepted'|'abandoned';receipt?:ArcadeReceipt;audit?:{inputDigest:string;inputCount:number;endReason:ArcadeEndReason;snapshotHash:string}};
export type ArcadeReceipt={runId:string;score:number;dust:number;xp:number;qualified:boolean;won:boolean;personalBest:boolean;game?:ArcadeGameId;practice?:boolean;acceptedAt?:number;ranked?:import('./ranked').ArcadeRankedResult;crew?:import('./crew').CrewReceipt;endReason?:ArcadeEndReason;feedback?:string;medals?:number[];weekly?:ArcadeWeeklyReward};
export type ArcadeProgress={active?:string;day:string;rewarded:number;dailyDust:number;dailyXP:number;first:boolean;best:Record<string,number>;completed:number;last?:ArcadeReceipt;ranked?:import('./ranked').ArcadeRankedProgress;practiceBest?:Partial<Record<ArcadeGameId,number>>;games?:Partial<Record<ArcadeGameId,ArcadeGameProgress>>;nextGame?:ArcadeGameId;rotationIndex?:number;recentGames?:ArcadeGameId[];week?:{key:string;days:string[];claimed:boolean;receipt?:ArcadeWeeklyReward}};
export const TARGETS:readonly {name:string;species:string;hp:number;attack:number;defense:number;types:Element[];points:number}[]=[
 {name:'Bladluis',species:'aphid',hp:40,attack:55,defense:45,types:['grass'],points:10},
 {name:'Bladkever',species:'leafbeetle',hp:70,attack:65,defense:70,types:['grass','bug'],points:20},
 {name:'Pantserkever',species:'beetle',hp:110,attack:75,defense:100,types:['rock','bug'],points:30},
 {name:'Vuurvlieg',species:'firefly_2',hp:60,attack:80,defense:50,types:['fire','bug'],points:20},
];
// Integer hash and triangle paths keep collision positions independent of render FPS/platform.
export function arcadeSeed(text:string){let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return h>>>0;}
export const arcadeChallenge=(league:League,now:number)=>new Date(now).toISOString().slice(0,10)+':'+league+':'+ARCADE_RULES;
export function arcadeSquad(p:PlayerV2,ids:unknown,league:unknown):ArcadeBug[]{
 check(typeof league==='string'&&Object.hasOwn(LEAGUES,league),'Kies een CP-klasse.');
 check(Array.isArray(ids)&&ids.length>=1&&ids.length<=3&&new Set(ids).size===ids.length,'Kies 1 tot 3 verschillende bugs.');
 const squad=ids.map(id=>{const b=p.specimens.find(s=>s.id===id&&s.go);check(b,'Kies een zelfgevangen bug.');check(!p.go?.gyms?.deployed.some(d=>d.specimen===id),'Deze bug verdedigt een gym.');const st=stats(b);check(st.cp<=LEAGUES[league as League].cap,'Deze bug is te sterk voor deze CP-klasse.');return {id:b.id,species:b.species,shiny:b.shiny,cp:st.cp,attack:st.attack,defense:st.defense,hp:st.hp,fast:b.go!.fast,types:movePool(b.species).types};});
 check(new Set(squad.map(s=>s.species)).size===squad.length,'Kies verschillende soorten.');return squad;
}
export function suggestedArcadeSquad(p:PlayerV2){
 const league=p.go?.league??'great',eligible=p.specimens.filter(b=>b.go&&!p.go?.gyms?.deployed.some(d=>d.specimen===b.id)&&stats(b).cp<=LEAGUES[league].cap);
 const preferred=p.go?.team??[],ordered=[...eligible.filter(b=>preferred.includes(b.id)),...eligible.filter(b=>!preferred.includes(b.id)).sort((a,b)=>stats(b).cp-stats(a).cp)];
 return ordered.filter((b,i)=>ordered.findIndex(s=>s.species===b.species)===i).slice(0,3).map(b=>b.id);
}
export function arcadeDamage(a:Pick<ArcadeBug,'attack'|'types'>,d:{defense:number;types:Element[]},type:Element,power:number){return Math.max(1,Math.floor(.5*power*a.attack/d.defense*(a.types.includes(type)?1.2:1)*effectiveness(type,d.types))+1);}
export function targetPosition(seed:number,t:ArcadeTarget,tick:number){
 const h=arcadeSeed(seed+':'+t.id),age=tick-t.born,period=100+h%80,phase=(age+h%period)%period;
 const triangle=Math.floor(4000*phase/period),wave=triangle<=2000?triangle-1000:3000-triangle;
 return {x:85+(h%190)+Math.floor(wave*36/1000),y:115+(Math.floor(h/190)%340)+Math.floor(((age+Math.floor(h/11))%100<50?1:-1)*Math.min(age%50,50-age%50)/3)};
}
function spawn(state:TapState,seed:number,league:League){
 while(state.nextSpawn<24&&state.nextSpawn*90<=state.tick){
  if(state.targets.length>=4){if(state.tick-state.nextSpawn*90<90)break;state.nextSpawn++;continue;}
  const id=state.nextSpawn++,kind=id%4,t=TARGETS[kind],scale=league==='great'?1:league==='ultra'?1.25:1.5;
  state.targets.push({id,kind,born:state.tick,hp:Math.floor(t.hp*scale),maxHP:Math.floor(t.hp*scale),attack:Math.floor(t.attack*scale),defense:Math.floor(t.defense*scale),types:[...t.types],points:t.points,lastShooter:null,attacked:false});
 }
}
export function createTapState(squad:ArcadeBug[],seed:number,league:League):TapState{
 const state:TapState={tick:0,score:0,squad:squad.map(b=>({...b,health:b.hp,ready:0})),targets:[],nextSpawn:0,finished:false,effects:[],hits:0};spawn(state,seed,league);return state;
}
export function stepTap(state:TapState,seed:number,league:League){
 if(state.finished)return;state.tick++;
 for(const target of state.targets){
  if(!target.attacked&&state.tick-target.born>=250){
   const preferred=target.lastShooter===null?null:state.squad[target.lastShooter],shooter=preferred&&preferred.health>0?target.lastShooter!:state.squad.findIndex(b=>b.health>0);
   if(shooter>=0){const bug=state.squad[shooter],amount=arcadeDamage(target,bug,target.types[0],12);bug.health=Math.max(0,bug.health-amount);state.effects.push({tick:state.tick,kind:'hurt',target:target.id,shooter,amount,...targetPosition(seed,target,state.tick)});}target.attacked=true;
  }
 }
 state.targets=state.targets.filter(t=>state.tick-t.born<300&&t.hp>0);
 state.effects=state.effects.filter(e=>state.tick-e.tick<25).slice(-8);
 state.finished=state.tick>=DURATION_TICKS||state.squad.every(b=>b.health<=0);
 if(!state.finished)spawn(state,seed,league);
}
export function tapTarget(state:TapState,seed:number,input:ArcadeTap){
 if(state.finished)return false;
 const target=[...state.targets].reverse().find(t=>{const pos=targetPosition(seed,t,state.tick);return ((input.x*FIELD.width/1000-pos.x)/43)**2+((input.y*FIELD.height/1000-pos.y)/40)**2<=1;});
 if(!target)return false;
 let shooter=-1,best=0;
 state.squad.forEach((b,i)=>{if(b.health<=0||b.ready>state.tick)return;const move=FAST[b.fast],amount=arcadeDamage(b,target,move.type,move.power);if(amount>best){best=amount;shooter=i;}});
 if(shooter<0)return false;
 const bug=state.squad[shooter];bug.ready=state.tick+FAST[bug.fast].turns*20;target.hp=Math.max(0,target.hp-best);target.lastShooter=shooter;state.hits++;
 const defeated=target.hp===0;if(defeated){state.score+=target.points;state.targets=state.targets.filter(t=>t!==target);}
 state.effects.push({tick:state.tick,kind:defeated?'defeat':'hit',target:target.id,shooter,amount:best,...targetPosition(seed,target,state.tick)});return true;
}
export function validateTapInputs(raw:unknown):ArcadeTap[]{
 check(Array.isArray(raw)&&raw.length<=450,'Deze invoer is te groot.');let previous=-5;
 for(const i of raw){check(i&&typeof i==='object'&&!Array.isArray(i)&&Object.keys(i).every(k=>['tick','x','y'].includes(k))&&Number.isInteger(i.tick)&&i.tick>=0&&i.tick<DURATION_TICKS&&i.tick-previous>=5&&Number.isInteger(i.x)&&Number.isInteger(i.y)&&i.x>=0&&i.x<=1000&&i.y>=0&&i.y<=1000,'Ongeldige tikreeks.');previous=i.tick;}
 return raw as ArcadeTap[];
}
export function replayTap(ticket:ArcadeTicket,raw:unknown){
 const inputs=validateTapInputs(raw),state=createTapState(ticket.squad,ticket.seed,ticket.league);let next=0;
 for(;;){
  while(next<inputs.length&&inputs[next].tick===state.tick)tapTarget(state,ticket.seed,inputs[next++]);
  if(state.finished)break;stepTap(state,ticket.seed,ticket.league);
 }
 check(next===inputs.length,'De ronde was al afgelopen.');
 const distinct=new Set(inputs.map(i=>i.x+':'+i.y)).size,span=inputs.length?inputs.at(-1)!.tick-inputs[0].tick:0;
 return {state,qualified:state.tick>=400&&state.score>0&&distinct>=3&&span>=100};
}
