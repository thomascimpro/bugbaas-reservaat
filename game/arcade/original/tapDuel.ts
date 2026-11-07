import type {ArcadeTicket} from '../tapDuel';
import {species} from '../../catalogV2';
import {originalSquadPower,type OriginalPort,type OriginalState,type OriginalInput} from './types';
import {originalTapCatalog,type OriginalRarity} from './tapCatalog';

// Source: BugSmashDuelScreen.tsx 190–205,2702–2997,3614–3664,3766–3769;
// bugSmashDuelService.ts 13–16,74–91. Original ranked Tap rules, no campaign bosses.
export const originalTapDurationMs=30_000,originalTapBugCount=56;
export const originalTapsByRarity={Gewoon:2,Zeldzaam:3,Episch:5,Legendarisch:7,Mythisch:9};
export const originalPointsByRarity={Gewoon:1,Zeldzaam:2,Episch:4,Legendarisch:6,Mythisch:9};
type Motion={visible:boolean;progress:number;x:number;y:number;rotate:number};
type HelperKind='burst'|'sticky'|'shield'|'zap'|'splash';
type Assist={speedMultiplier:number;hitboxMultiplier:number;comboGraceMs:number;comboBonusEvery:number;focusEasyHits:number};
export type OriginalTapTarget={index:number;bugId:string;name:string;rarity:OriginalRarity;motion:Motion;size:number;hits:number;required:number;frozen:boolean};
export type OriginalTapEffect={at:number;kind:HelperKind|'hit'|'catch';x:number;y:number;helper:number;points:number;targetId?:string;targets:{x:number;y:number}[]};
export type OriginalTapDuelState=OriginalState&{game:'tap_duel';bugIds:string[];hitCounts:Record<string,number>;caughtBugIds:string[];combo:number;lastCatchAt:number;assist:Assist;frozenTargets:Record<string,{motion:Motion;until:number}>;targetTimeOffsets:Record<string,number>;helperReadyAt:number[];effects:OriginalTapEffect[];helperHits:number;tapHits:number};
const byId=new Map(originalTapCatalog.map(e=>[e.id,e]));
export function originalPickBugIds(seed:number){
 let value=seed%2147483647;if(value<=0)value+=2147483646;
 const random=()=>{value=value*16807%2147483647;return(value-1)/2147483646;};
 return originalTapCatalog.map(({id})=>({id,sort:random()})).sort((a,b)=>a.sort-b.sort).slice(0,originalTapBugCount).map(e=>e.id);
}
export function originalTargetMotion(index:number,seed:number,elapsedMs:number,rarity:OriginalRarity,assist:Pick<Assist,'speedMultiplier'>,spawnSpacingMultiplier=1,duelDurationMs=originalTapDurationMs,targetCount=originalTapBugCount):Motion{
 const lane=(index*37+seed)%82,wave=index%5+2;
 const rarityLifetime=rarity==='Gewoon'?3900:rarity==='Zeldzaam'?5000:rarity==='Episch'?6200:rarity==='Legendarisch'?7400:8600;
 const duration=rarityLifetime*assist.speedMultiplier,lastSpawnAt=Math.max(0,duelDurationMs-650);
 const spawnMultiplier=Math.max(.5,Math.min(1.1,spawnSpacingMultiplier)),spawnProgress=targetCount>1?Math.max(0,Math.min(1,index/(targetCount-1))):0;
 const spawnCurve=spawnMultiplier<1?Math.pow(spawnProgress,1/spawnMultiplier):spawnProgress;
 const spawnSpacing=targetCount>1?lastSpawnAt/(targetCount-1):lastSpawnAt,spawnJitter=Math.min(260,Math.max(0,spawnSpacing*.35));
 const jitter=index>=targetCount-1?0:(seed+index*173)%Math.max(1,Math.round(spawnJitter));
 const spawnStart=Math.min(lastSpawnAt,lastSpawnAt*spawnCurve+jitter),progress=(elapsedMs-spawnStart)/duration;
 if(progress<0||progress>1)return{visible:false,progress,x:0,y:0,rotate:0};
 const direction=index%2===0?1:-1,x=direction===1?-12+progress*114:100-progress*114;
 const crawl=Math.sin(progress*Math.PI*wave+index)*10+Math.sin(progress*Math.PI*7+seed)*2;
 const y=Math.max(4,Math.min(86,lane+crawl)),rotate=direction*(Math.sin(progress*Math.PI*2+index)*15+8);
 return{visible:true,progress,x,y,rotate};
}
export function originalRequiredTaps(rarity:OriginalRarity,assist:Assist,index:number){const focusReduction=index>=0&&index<assist.focusEasyHits?1:0;return Math.max(1,Math.ceil(originalTapsByRarity[rarity]-focusReduction));}
function targetPriority(t:OriginalTapTarget){return originalPointsByRarity[t.rarity]+(t.motion.progress>.72?2:t.motion.progress>.48?1:0);}
export function originalTapTargets(s:OriginalTapDuelState,ticket:ArcadeTicket):OriginalTapTarget[]{
 return s.bugIds.flatMap((bugId,index)=>{
  if(s.caughtBugIds.includes(bugId))return[];const entry=byId.get(bugId)!;
  const freeze=s.frozenTargets[bugId],frozen=!!freeze&&s.elapsedMs<freeze.until;
  const motion=frozen?freeze.motion:originalTargetMotion(index,ticket.seed,s.elapsedMs-(s.targetTimeOffsets[bugId]??0),entry.rarity,s.assist);
  if(!motion.visible)return[];
  const hitboxRarity=entry.rarity==='Mythisch'?1.18:entry.rarity==='Legendarisch'?1.14:entry.rarity==='Episch'?1.1:entry.rarity==='Zeldzaam'?1.05:1;
  return[{index,bugId,name:entry.name,rarity:entry.rarity,motion,size:Math.round(46*.92*s.assist.hitboxMultiplier*hitboxRarity),hits:s.hitCounts[bugId]??0,required:originalRequiredTaps(entry.rarity,s.assist,index),frozen}];
 }).sort((a,b)=>targetPriority(b)-targetPriority(a)).slice(0,10);
}
function hit(s:OriginalTapDuelState,t:OriginalTapTarget,helper=-1){
 if(s.caughtBugIds.includes(t.bugId))return;
 s.hitCounts[t.bugId]=(s.hitCounts[t.bugId]??0)+1;if(helper<0)s.tapHits++;else s.helperHits++;
 const caught=s.hitCounts[t.bugId]>=t.required;let points=0;
 if(caught){s.combo=s.elapsedMs-s.lastCatchAt<=s.assist.comboGraceMs?s.combo+1:1;s.lastCatchAt=s.elapsedMs;s.caughtBugIds.push(t.bugId);points=originalPointsByRarity[t.rarity]+(s.combo>0&&s.combo%Math.max(2,s.assist.comboBonusEvery)===0?1:0);s.score+=points;}
 s.effects.push({at:s.elapsedMs,kind:caught?'catch':'hit',x:t.motion.x*3.6+t.size/2,y:t.motion.y*6.4+t.size/2,helper,points,targetId:t.bugId,targets:[]});
}
const rank=(r:OriginalRarity)=>r==='Mythisch'?4:r==='Legendarisch'?3:r==='Episch'?2:r==='Zeldzaam'?1:0;
const stableHash=(seed:string)=>seed.split('').reduce((hash,char)=>((hash<<5)-hash+char.charCodeAt(0))>>>0,0);
function helperSpec(ticket:ArcadeTicket,index:number){
 const b=ticket.squad[index],tier=species(b.species).tier;
 const rarity:OriginalRarity=tier>=7?'Mythisch':tier>=6?'Legendarisch':tier>=5?'Episch':tier>=3?'Zeldzaam':'Gewoon';
 const kind:HelperKind=b.types.includes('poison')||b.types.includes('grass')?'sticky':b.types.includes('rock')||b.types.includes('steel')?'shield':b.types.includes('water')?'splash':b.types.includes('dark')||b.types.includes('flying')?'zap':'burst';
 const r=rank(rarity),power=originalSquadPower(ticket.squad,ticket.league);
 // Original rarity timers/hits; actual attack shortens recovery by at most 14%.
 const cooldownMs=[9400,7900,6500,5200,4300][r]*(1-.14*power.attack);
 return{kind,rarity,r,cooldownMs,splashRadius:kind==='splash'?16+r*4:0,splashTargets:kind==='splash'&&r>=2?Math.min(3,r-1):0};
}
function freeze(s:OriginalTapDuelState,t:OriginalTapTarget,ms:number){
 const current=s.frozenTargets[t.bugId],until=Math.max(current?.until??0,s.elapsedMs+ms);
 const extraPause=Math.max(0,until-Math.max(current?.until??s.elapsedMs,s.elapsedMs));
 s.targetTimeOffsets[t.bugId]=(s.targetTimeOffsets[t.bugId]??0)+extraPause;s.frozenTargets[t.bugId]={motion:{...t.motion},until};
}
function helpers(s:OriginalTapDuelState,ticket:ArcadeTicket){
 const rendered=originalTapTargets(s,ticket);if(!rendered.length)return;
 ticket.squad.forEach((b,i)=>{
  const spec=helperSpec(ticket,i);
  if(s.helperReadyAt[i]===undefined){s.helperReadyAt[i]=s.elapsedMs+Math.round(spec.cooldownMs*Math.max(.34,.62-i*.12));return;}
  if(s.elapsedMs<s.helperReadyAt[i])return;
  const targets=rendered.filter(t=>!s.caughtBugIds.includes(t.bugId)&&t.motion.progress<=(spec.kind==='shield'?Math.min(.97,.9+spec.r*.018):Math.min(.92,.84+spec.r*.018)));
  const score=(t:OriginalTapTarget)=>originalPointsByRarity[t.rarity]*(spec.kind==='shield'?.5:spec.kind==='zap'?1.1:spec.kind==='burst'?.9:.75)+(t.motion.progress>.75?2:t.motion.progress>.55?1:0)+((s.hitCounts[t.bugId]??0)>=Math.max(1,originalTapsByRarity[t.rarity]-1)?3:0)+(stableHash(`${b.id}:${t.bugId}:${Math.floor(s.elapsedMs/1800)}`)%100)/1000;
  const t=targets.sort((a,b)=>score(b)-score(a))[0];if(!t)return;
  s.helperReadyAt[i]=s.elapsedMs+spec.cooldownMs+i*260;
  const remaining=Math.max(1,t.required-(s.hitCounts[t.bugId]??0)),tr=rank(t.rarity);
  const kindBonus=spec.kind==='sticky'?remaining>3?1:0:spec.kind==='shield'?t.motion.progress>.82?1:0:spec.kind==='zap'?t.rarity!=='Gewoon'?1:0:spec.kind==='splash'?remaining>2?1:0:0;
  const damage=Math.min(remaining,Math.max(1,1+spec.r-Math.floor(tr/2)+(spec.kind==='burst'&&spec.r>=tr+2?1:0)+(spec.kind==='zap'&&spec.r>=3&&tr>0&&tr<=spec.r?1:0)+kindBonus));
  const control=spec.kind==='sticky'?520+[0,220,420,620,820][spec.r]:spec.kind==='shield'&&t.motion.progress>.45?480+[0,220,420,620,820][spec.r]+(t.motion.progress>.78?180:0):0;
  if(control)freeze(s,t,control);
  const splash=targets.filter(a=>a.bugId!==t.bugId&&Math.hypot(a.motion.x-t.motion.x,a.motion.y-t.motion.y)<=spec.splashRadius).slice(0,spec.splashTargets);
  s.effects.push({at:s.elapsedMs,kind:spec.kind,x:t.motion.x*3.6+t.size/2,y:t.motion.y*6.4+t.size/2,helper:i,points:damage,targets:splash.map(a=>({x:a.motion.x*3.6+a.size/2,y:a.motion.y*6.4+a.size/2}))});
  for(let n=0;n<damage;n++)hit(s,t,i);
  splash.forEach(a=>{for(let n=0;n<(spec.r>=3&&rank(a.rarity)<=1?2:1);n++)hit(s,a,i);});
 });
}
export const originalTapDuel:OriginalPort<OriginalTapDuelState>={
 game:'tap_duel',name:'Tikduel',controls:[],durationMs:originalTapDurationMs,help:'Tik bewegende bugs meerdere keren: zeldzame bugs vragen meer tikken. Vang snel achter elkaar voor combo’s. Je squad valt mee aan.',
 create(ticket){const p=originalSquadPower(ticket.squad,ticket.league);return{game:'tap_duel',elapsedMs:0,score:0,finished:false,reason:null,hearts:3,bugIds:originalPickBugIds(ticket.seed),hitCounts:{},caughtBugIds:[],combo:0,lastCatchAt:-1e9,assist:{speedMultiplier:1+.14*p.hp,hitboxMultiplier:1.05+.14*p.defense,comboGraceMs:650,comboBonusEvery:5,focusEasyHits:0},frozenTargets:{},targetTimeOffsets:{},helperReadyAt:[],effects:[],helperHits:0,tapHits:0};},
 step(s,ticket,dt){if(s.finished)return;s.elapsedMs=Math.min(originalTapDurationMs,s.elapsedMs+dt);s.effects=s.effects.filter(e=>s.elapsedMs-e.at<720);if(s.elapsedMs>=originalTapDurationMs){s.finished=true;s.reason='time';return;}helpers(s,ticket);},
 input(s,ticket,input:OriginalInput){if(s.finished||s.elapsedMs>=originalTapDurationMs||input.action&&input.action!=='down')return false;const x=input.x*.36,y=input.y*.64;
  const t=originalTapTargets(s,ticket).find(t=>x>=t.motion.x*3.6&&x<=t.motion.x*3.6+t.size&&y>=t.motion.y*6.4&&y<=t.motion.y*6.4+t.size);if(!t)return false;hit(s,t);return true;},
};
