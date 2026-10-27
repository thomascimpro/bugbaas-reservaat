import {wildShiny} from './shinyV2';
import {rng,species} from './catalogV2';
import type {PlayerV2} from './typesV2';
import type {Fix} from './walkingV2';
import type {Held} from './goV2';
import {catchWild,CATCH_RADIUS,distance,wildSeed} from './walkingV2';
import {checkV2 as check} from './shopV2';
import {judgeCatchRhythm} from './catchTimingV2';
import {netFlickGrade,netSweepGrade,validNetFlick} from './netThrowV2';
import type {CatchFocus} from './catchTimingV2';
import type {HealthProgress} from './adventureSyncV2';

export const NETS={
 basic:{name:'Veldnet',multiplier:1,cell:0,color:'#A5B694',hint:'Standaardnet. Goed mikken en een lokmiddel geven meer vangkans.'},
 blue:{name:'Bosnet',multiplier:1.5,cell:1,color:'#368CDA',hint:'50% hogere vangkans.'},
 silk:{name:'Zijdenet',multiplier:2,cell:2,color:'#9C60D6',hint:'Verdubbelt de vangkans.'},
 royal:{name:'Oerwortelnet',multiplier:100,cell:3,color:'#E7B545',hint:'Een rake vangpoging slaagt altijd. Bij missen blijft dit net bewaard.'},
} as const;
export const BAITS={
 pollen:{name:'Lokbloem',multiplier:1.5,cell:4,color:'#E8C358',hint:'50% hogere vangkans voor je volgende rake vangpoging.'},
 dew:{name:'Dauwdruppel',multiplier:1,cell:5,color:'#66BCD6',hint:'Meer raakruimte voor je net. De bug vlucht niet na deze poging.'},
 fruit:{name:'Bosframboos',multiplier:1,cell:6,color:'#DA7955',hint:'Verdubbelt de soortnectar van deze vangst.'},
 gold:{name:'Gouden lokbloem',multiplier:2.5,cell:7,color:'#EDC45E',hint:'Vangkans ×2,5 voor de volgende rake vangpoging.'},
 silver:{name:'Zilverbes',multiplier:1.8,cell:8,color:'#B5CEDE',hint:'80% hogere vangkans en extra soortnectar: 7, 11 of 23 per evolutiestadium.'},
} as const;
export type Net=keyof typeof NETS;
export type Bait=keyof typeof BAITS;
export type FieldItem=Net|Bait;
export type Grade='miss'|'hit'|'nice'|'great'|'perfect';
export const GRADES={miss:{name:'Mis',bonus:0,multiplier:0},hit:{name:'Raak',bonus:0,multiplier:1},nice:{name:'Raak!',bonus:1,multiplier:1.15},great:{name:'Mooi!',bonus:2,multiplier:1.3},perfect:{name:'Perfect!',bonus:4,multiplier:1.5}} as const;
export type NetPoint={x:number;y:number;t:number};
export type FieldEncounter={focus?:CatchFocus;cp?:number;id:string;spawn:string;createdAt:number;attempt:number;failures:number;bait:Bait|null;shiny:boolean};
export type CastResult={xp?:number;held?:Held;candy?:number;cp?:number;id:string;spawn:string;species:string;attempt:number;outcome:'caught'|'escaped'|'fled'|'miss';grade:Grade;curved:boolean;chance:number;nectar:number;shiny:boolean;at:number};
export type FieldState={healthSync?:HealthProgress;lure?:{id:string;day:string;startedAt:number;expiresAt:number;lastAt:number;lastMeters:number;spawned:number;caught:number;seed?:string};walk?:{gpsMeters?:number;meters:number;dayMeters:number;anchor:Fix|null;at:number};cocoon?:{id:string;km:2|5;startedMeters:number;stage:number;seed?:string}|null;lastHatch?:{id:string;species:string;shiny:boolean;nectar:number;parts:number;at:number};inventory:Record<FieldItem,number>;encounters?:Record<string,FieldEncounter>;encounter:FieldEncounter|null;lastCast:CastResult|null;daily:{day:string;supply:boolean;catches:number;species:string[];skilled:number;claimed:string[];buddyFed?:boolean;buddyWalk?:boolean};total:{catches:number;perfect:number;curved:number};lastNet:Net};
const dayKey=(now:number)=>new Date(now).toISOString().slice(0,10);
export function ensureField(p:PlayerV2,now:number):FieldState{
 p.field??={inventory:{basic:30,blue:8,silk:3,royal:0,pollen:3,dew:2,fruit:2,gold:0,silver:0},encounter:null,lastCast:null,daily:{day:dayKey(now),supply:false,catches:0,species:[],skilled:0,claimed:[]},total:{catches:0,perfect:0,curved:0},lastNet:'basic'};
 for(const id of [...Object.keys(NETS),...Object.keys(BAITS)] as FieldItem[])p.field.inventory[id]??=id==='basic'?30:0;
 if(p.field.daily.day!==dayKey(now)){p.field.daily={day:dayKey(now),supply:false,catches:0,species:[],skilled:0,claimed:[]};if(p.field.walk)p.field.walk.dayMeters=0;}if(p.walking&&p.walking.day!==dayKey(now)){p.walking.day=dayKey(now);p.walking.count=0;}return p.field;
}
export function grantField(p:PlayerV2,items:Partial<Record<FieldItem,number>>,now:number){const bag=ensureField(p,now).inventory;for(const [id,n] of Object.entries(items))bag[id as FieldItem]=Math.min(99999,bag[id as FieldItem]+n!);}
export function claimFieldSupply(p:PlayerV2,now:number){const f=ensureField(p,now);check(!f.daily.supply,'Je dagvoorraad is al opgehaald.');f.daily.supply=true;grantField(p,{blue:5,silk:1,pollen:2,dew:1,fruit:1},now);}
export const FIELD_TASKS=[
 {id:'catch',name:'Vang 3 bugs',goal:3,icon:'leaf',reward:{blue:3,pollen:1}},
 {id:'variety',name:'Vang 2 soorten',goal:2,icon:'book',reward:{silk:1,dew:2}},
 {id:'skill',name:'Maak een mooie vangpoging',goal:1,icon:'star',reward:{silk:1,fruit:1}},
] as const;
export function taskProgress(f:FieldState,id:string){return id==='catch'?f.daily.catches:id==='variety'?f.daily.species.length:f.daily.skilled;}
export function claimFieldTask(p:PlayerV2,id:unknown,now:number){const f=ensureField(p,now),task=FIELD_TASKS.find(t=>t.id===id);check(task&&!f.daily.claimed.includes(task.id)&&taskProgress(f,task.id)>=task.goal,'Deze onderzoekstaak is nog niet klaar of al opgehaald.');grantField(p,task.reward,now);f.daily.claimed.push(task.id);}
export function ringRadius(ms:number,bait:Bait|null){return .24*(1-.8*((ms%(bait==='dew'?2600:1800))/(bait==='dew'?2600:1800)));}
export function judgeNet(raw:unknown,bait:Bait|null):{grade:Grade;curved:boolean;duration:number}{
 const flick=!!raw&&typeof raw==='object'&&!Array.isArray(raw);if(flick)check(Object.keys(raw).every(k=>['kind','points'].includes(k))&&['flick','sweep'].includes((raw as {kind:string}).kind),'Ongeldige networp.');
 const input=flick?(raw as {points?:unknown}).points:raw;check(Array.isArray(input)&&input.length>=2&&input.length<=96,'Ongeldige netzwaai.');const trace=input as NetPoint[];
 for(let i=0;i<trace.length;i++){const p=trace[i];check(p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).every(k=>['x','y','t'].includes(k))&&[p.x,p.y,p.t].every(Number.isFinite)&&p.x>=-.4&&p.x<=1.4&&p.y>=-.4&&p.y<=1.6&&p.t>=0&&p.t<=5000&&(i===0?p.t===0:p.t>trace[i-1].t),'Ongeldige beweging.');}
 const first=trace[0],last=trace.at(-1)!,duration=last.t;check(first.y>=(flick ? .75 : .8)&&Math.abs(first.x-.5)<=(flick ? .35 : .3)&&duration>=(flick?60:120)&&duration<=5000,'Begin bij het net en veeg kort omhoog.');
 let length=0;for(let i=1;i<trace.length;i++){const dist=Math.hypot(trace[i].x-trace[i-1].x,trace[i].y-trace[i-1].y);check(dist<=.2+(trace[i].t-trace[i-1].t)/1000*12,'De zwaai verspringt te snel.');length+=dist;}
 if(flick){check(validNetFlick(trace),'Veeg snel omhoog en laat het net los voordat je de bug raakt.');return (raw as {kind:string}).kind==='sweep'?netSweepGrade(trace,bait):netFlickGrade(trace,bait);}
 const aim=Math.hypot(last.x-.5,last.y-.42),phase=(duration%(bait==='dew'?2600:1800))/(bait==='dew'?2600:1800),inside=aim<=ringRadius(duration,bait),grade:Grade=aim>.24?'miss':!inside?'hit':phase>=.8?'perfect':phase>=.5?'great':'nice';
 const straight=Math.hypot(last.x-first.x,last.y-first.y),curved=grade!=='miss'&&trace.length>=5&&length>straight*1.14&&trace.some(p=>Math.abs(p.x-(first.x+(last.x-first.x)*p.t/duration))>.13);return {grade,curved,duration};
}
const BASE_CHANCE:Record<string,number>={aphid:.78,beetle:.65,ant:.72,weevil:.62,moth:.55,earwig:.7,grasshopper:.52,lacewing:.58,dungbeetle:.65,mantis:.42,butterfly:.5,divingbeetle:.55,waterstrider:.55,hoverfly:.6,leafhopper:.55,cricket:.7,stick:.45,leaf:.45,silverfish:.45,hercules:.3};
export function catchChance(kind:string,net:Net,bait:Bait|null,grade:Grade='hit',curved=false,failures=0){if(grade==='miss')return 0;if(net==='royal'||failures>=4)return 1;const base=BASE_CHANCE[kind]??Math.max(.2,Math.min(.76,.82-.085*species(kind).tier));return Math.min(.97,base*NETS[net].multiplier*(bait?BAITS[bait].multiplier:1)*GRADES[grade].multiplier+(curved?.06:0));}
export function encounterWild(p:PlayerV2,id:unknown,nonce:string,now:number){const f=ensureField(p,now),w=p.walking;check(w&&typeof id==='string'&&w.seed,'Open eerst de kaart.');const s=w.spawns.find(s=>s.id===id);check(s&&s.expiresAt>now&&!w.caught.includes(s.id),'Deze bug is verdwenen.');check(now-w.at<45000&&distance(w.fix,s)<=CATCH_RADIUS,'Vernieuw GPS of loop dichterbij.');f.encounters??={};for(const id of Object.keys(f.encounters))if(!w.spawns.some(s=>s.id===id))delete f.encounters[id];if(f.encounters[s.id]){f.encounter=f.encounters[s.id];return;}f.encounter={id:nonce,spawn:s.id,createdAt:now,attempt:0,failures:0,bait:null,shiny:wildShiny(wildSeed(w,s),s.id)};f.encounters[s.id]=f.encounter;}
export function castNet(p:PlayerV2,raw:Record<string,unknown>,nonce:string,now:number){
 const f=ensureField(p,now),e=f.encounter,w=p.walking;check(e&&w&&w.seed&&e.id===raw.encounter,'Open deze vangst opnieuw.');const s=w.spawns.find(s=>s.id===e.spawn);check(s&&s.expiresAt>now&&!w.caught.includes(s.id),'Deze bug is gevangen of verdwenen.');check(now-w.at<45000&&distance(w.fix,s)<=CATCH_RADIUS,'Vernieuw je GPS of loop dichterbij.');check(!!p.go||w.count<60,'Vandaag zijn alle vangbeloningen opgehaald.');const flick=!!raw.trace&&typeof raw.trace==='object'&&!Array.isArray(raw.trace)&&['flick','sweep'].includes(String((raw.trace as {kind?:unknown}).kind));check(!f.lastCast||now-f.lastCast.at>=(flick?350:900),'Wacht even op je vorige zwaai.');check(typeof raw.net==='string'&&Object.hasOwn(NETS,raw.net),'Kies een net.');check(raw.bait===null||typeof raw.bait==='string'&&Object.hasOwn(BAITS,raw.bait),'Kies een lokmiddel.');const net=raw.net as Net,bait=e.bait??raw.bait as Bait|null;check(!e.bait||raw.bait===null||raw.bait===e.bait,'Het lokmiddel blijft actief tot een rake zwaai.');check(net==='basic'||f.inventory[net]>0,'Dit net is op.');if(!e.bait&&bait)check(f.inventory[bait]>0,'Dit lokmiddel is op.');
 check(!(raw.trace!==undefined&&raw.rhythm!==undefined),'Kies één vangmethode.');const swing=raw.rhythm!==undefined?judgeCatchRhythm(raw.rhythm,e.focus,bait,now):judgeNet(raw.trace,bait);check(swing.duration<=now-e.createdAt+400,'Je zwaai is nog niet klaar.');const chance=catchChance(s.species,net,bait,swing.grade,swing.curved,p.go?0:e.failures),roll=rng(wildSeed(w,s)+':cast:'+s.id+':'+e.attempt)();
 if(net!=='basic'&&(net!=='royal'||swing.grade!=='miss'))f.inventory[net]--;if(!e.bait&&bait){f.inventory[bait]--;e.bait=bait;}f.lastNet=net==='royal'?'basic':net;delete e.focus;e.attempt++;if(swing.grade==='great'||swing.grade==='perfect')f.daily.skilled++;
 let outcome:CastResult['outcome']='miss',nectar=0;
 if(swing.grade!=='miss'){
  if(roll<chance){const prior=p.nectar,first=f.daily.catches===0;catchWild(p,s.id,now,e.shiny);const base=p.nectar-prior,extra=GRADES[swing.grade].bonus+(swing.curved?1:0),multiplier=bait==='fruit'||bait==='silver'?2:1;nectar=(base+extra)*multiplier+(first?5:0);p.nectar+=nectar-base;w.lastCatch!.nectar=nectar;f.daily.catches++;if(!f.daily.species.includes(s.species))f.daily.species.push(s.species);f.total.catches++;if(swing.grade==='perfect')f.total.perfect++;if(swing.curved)f.total.curved++;outcome='caught';if(s.source==='lure'&&f.lure)f.lure.caught++;f.encounter=null;}
  else{e.failures++;const flee=s.source!=='boss'&&(!e.shiny||!!p.go)&&bait!=='dew'&&e.failures>=2&&rng(wildSeed(w,s)+':flee:'+s.id+':'+e.attempt)()<.1;outcome=flee?'fled':'escaped';e.bait=null;if(flee){w.caught.push(s.id);f.encounter=null;}}
 }
 f.encounters??={};if(outcome==='caught'||outcome==='fled')delete f.encounters[s.id];else f.encounters[s.id]=e;f.lastCast={id:nonce,spawn:s.id,species:s.species,attempt:e.attempt,outcome,grade:swing.grade,curved:swing.curved,chance,nectar,shiny:e.shiny,at:now};
}
