import {grantField} from './fieldV2';
import {rng,SPECIES,species} from './catalogV2';
import {encounterFor,masteryStars} from './encountersV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2} from './typesV2';
import {duplicateNectar,expeditionMaterials,rollFind,winMaterials} from './progressionV2';
import {ALL_GEARS,awardEquipment,freshGear,GEARS,rollEquipment} from './equipmentV2';
import type {Gear} from './equipmentV2';
export {GEARS,gearCost,gearText} from './equipmentV2';
export type {Gear} from './equipmentV2';
export {SHINY_ODDS} from './progressionV2';

export const TACTIC_RULE='bugbaas-tactics-4';
export const MAX_ROUNDS=24;
export const turnLimit=(r:Pick<TacticRun,'mode'|'rule'>)=>r.mode==='boss'&&!['bugbaas-tactics-1','bugbaas-tactics-2','bugbaas-tactics-3'].includes(r.rule)?32:MAX_ROUNDS;
export const SCORE_ATTEMPTS=3;
export const SKILLS={
 sting:{name:'Prik',cost:30,text:'Een goedkope aanval om schilden uit te lokken.'},
 burst:{name:'Doorbraak',cost:60,text:'Een zware klap. Bewaar voldoende energie.'},
 venom:{name:'Gifbeet',cost:40,text:'Een kleine klap en drie beurten gif.'},
 crush:{name:'Pantserbreker',cost:40,text:'Aanval die pantser drie beurten verzwakt.'},
 heal:{name:'Herstel',cost:40,text:'Herstel een kwart van je maximale leven.'},
 cleanse:{name:'Zuiveren',cost:30,text:'Verwijder gif en pantserbreuk; herstel een beetje leven.'},
 fortify:{name:'Verschansen',cost:30,text:'Verminder directe schade deze en de volgende beurt.'},
} as const;
export type Skill=keyof typeof SKILLS;
export type Role='burst'|'guardian'|'venom'|'healer'|'tempo'|'breaker';
export const ROLES:Record<Role,{name:string;health:number;attack:number;armor:number;passive:string;skills:Skill[]}>={
 burst:{name:'Aanvaller',health:88,attack:17,armor:3,passive:'15% meer schade tegen een vijand onder 35% leven.',skills:['sting','burst','crush','fortify']},
 guardian:{name:'Beschermer',health:115,attack:12,armor:6,passive:'Teamschild blokkeert 90% directe schade in plaats van 80%.',skills:['sting','fortify','crush','cleanse']},
 venom:{name:'Gifjager',health:94,attack:13,armor:4,passive:'Gif houdt één beurt langer aan.',skills:['sting','venom','cleanse','burst']},
 healer:{name:'Verzorger',health:102,attack:12,armor:4,passive:'Herstelvaardigheden genezen 20% meer.',skills:['sting','heal','cleanse','fortify']},
 tempo:{name:'Verkenner',health:89,attack:14,armor:3,passive:'Een basisaanval levert 5 extra energie op.',skills:['sting','burst','venom','cleanse']},
 breaker:{name:'Breker',health:99,attack:15,armor:3,passive:'15% meer schade tegen gebroken pantser.',skills:['sting','crush','burst','fortify']},
};
export function roleFor(id:string):Role {
 if(id==='ambermantis')return 'breaker';
 if(/hercules|rhino|goliath|scarab|elephant|pillbug|millipede/.test(id))return 'guardian';
 if(/emperor|robberfly/.test(id))return 'burst';
 if(/morpho|luna|cometmoth/.test(id))return 'healer';
 if(/spider|scorpion|centipede|mosquito|tick|aphid/.test(id))return 'venom';
 if(/beetle|stag|shield|woodlouse|cockroach/.test(id))return 'guardian';
 if(/ladybug|bee|butterfly|lacewing|firefly/.test(id))return 'healer';
 if(/dragonfly|wasp|mantis|hornet/.test(id))return 'burst';
 if(/ant|earwig|cricket|grasshopper/.test(id))return 'breaker';
 return 'tempo';
}
export function profileFor(id:string){
 const base=ROLES[roleFor(id)],index=SPECIES.findIndex(s=>s.id===id),shape=index<5?0:index%3;
 const trait=shape===1?'Fel':shape===2?'Taai':'Gebalanceerd',attack=base.attack+(shape===1?1:shape===2?-1:0),health=base.health+(shape===1?-8:shape===2?8:0);
 const special:Record<string,Skill[]>={ambermantis:['sting','crush','burst','cleanse'],crystalstag:['sting','fortify','crush','venom'],glasswing:['sting','burst','cleanse','fortify'],cometmoth:['sting','heal','venom','cleanse']};
 return {...base,attack,health,trait,skills:special[id]??base.skills};
}
export type Loadout={specimen:string;skills:[Skill,Skill];gear:Gear};
export type RankedLoadout={species:string;skills:[Skill,Skill];gear:Gear};
export type Fighter={id:string;species:string;role:Role;level:number;health:number;maxHealth:number;attack:number;armor:number;energy:number;skills:[Skill,Skill];gear:Gear;grade:number;mastery?:Partial<Record<Skill,number>>;wardUsed?:boolean;shiny?:boolean;poison:number;poisonDamage:number;broken:number;fortified:number};
export type TacticAction={kind:'basic'|'skill'|'shield'|'switch';skill?:Skill;target?:number};
export type TacticEvent={side:0|1;target:string;kind:'damage'|'heal'|'energy'|'shield'|'switch'|'poison'|'break';amount:number;text:string};
export type TacticRun={id:string;rule:string;mode:'boss'|'score';day:string;attempt:number;stage:number;seed?:string;lootSeed?:string;round:number;phase:'fight'|'won'|'lost';teams:[Fighter[],Fighter[]];active:[number,number];shields:[number,number];swapReady:[number,number];intent?:TacticAction;events:TacticEvent[];score:number;reward:{nectar:number;parts:number;species?:string;shiny?:boolean;duplicate?:boolean;gear?:Gear;gearDuplicate?:boolean;salvage?:number;stars?:number;firstClear?:boolean}|null};
export type Expedition={id:string;habitat:number;startedAt:number;readyAt:number;hours:2|8;stage?:number;seed?:string};
export type Adventure={areaStars?:Record<string,number>;level:number;parts:number;gear:Record<Gear,number>;gearOwned?:Gear[];mastery?:Partial<Record<Skill,number>>;rankedBuild?:RankedLoadout[];wingGift?:boolean;lastGear?:{gear:Gear;duplicate:boolean;parts:number;at:number};build:Loadout[];stage:number;run:TacticRun|null;expedition:Expedition|null;stamps:number;researchChests:number;daily:{day:string;rule?:string;fights:number;expeditions:number;rewardClaimed:boolean;scoreUsed:number;scores:number[]};lastFind:string|null};
export type ChallengeDay={day:string;rule:string;seed:string};
export type ChallengeScore={uid:string;name:string;day:string;rule:string;score:number;scores:number[];attempts:number;updatedAt:number};
export const challengeDayKey=(day:string)=>'v2ChallengeDays:'+day+'-'+TACTIC_RULE;
export const challengeScoreKey=(day:string,uid:string,rule=TACTIC_RULE)=>'v2ChallengeScores:'+day+'-'+rule+'-'+uid;
export const utcDay=(now:number)=>new Date(now).toISOString().slice(0,10);
export const trainingCost=(level:number)=>level>=30?0:level<10?(level+1)*20:level<20?220+(level-10)*30:550+(level-20)*50;
export const skillUnlock=(id:string,skill:Skill)=>{const index=profileFor(id).skills.indexOf(skill);return index<0?99:index<2?1:index===2?5:12;};
export const skillRank=(u:Fighter,skill:Skill)=>u.mastery?.[skill]??1;
export function skillText(skill:Skill,rank=1){return skill==='heal'?'Herstel '+(25+2*(rank-1))+'% van je maximale leven.':skill==='cleanse'?'Verwijder gif en pantserbreuk; herstel '+(10+2*(rank-1))+'% leven.':skill==='fortify'?'Verminder directe schade '+(35+3*(rank-1))+'% deze en de volgende beurt.':skill==='venom'?'Een kleine klap en drie beurten gif. Gifkracht '+(100+10*(rank-1))+'%.':skill==='burst'?'Zware klap: '+(280+20*(rank-1))+'% aanval vóór pantser.':skill==='crush'?'Klap: '+(145+10*(rank-1))+'% aanval; verzwak pantser drie beurten.':'Snelle klap: '+(140+10*(rank-1))+'% aanval. Goed om schilden uit te lokken.';}
export const skillEnergy=(u:Fighter,skill:Skill)=>Math.max(10,SKILLS[skill].cost-(u.gear==='moon'?1+2*u.grade:0));
export const masteryCost=(rank:number)=>rank===1?{level:10,nectar:60,parts:10}:rank===2?{level:20,nectar:160,parts:25}:null;
export function trainSkill(p:PlayerV2,raw:unknown){check(typeof raw==='string'&&Object.hasOwn(SKILLS,raw),'Kies een vaardigheid.');const skill=raw as Skill,a=p.adventure!,cost=masteryCost(a.mastery?.[skill]??1);check(cost,'Maximum bereikt.');check(a.level>=cost.level,'Teamlevel '+cost.level+' nodig.');check(p.nectar>=cost.nectar&&a.parts>=cost.parts,'Niet genoeg materialen.');check(p.specimens.some(s=>skillUnlock(s.species,skill)<=a.level),'Leer deze vaardigheid eerst.');p.nectar-=cost.nectar;a.parts-=cost.parts;a.mastery??={};a.mastery[skill]=(a.mastery[skill]??1)+1;}
export const basicEnergy=(u:Fighter)=>20+(u.role==='tempo'?5:0)+(u.gear==='wing'?8+u.grade*2:0);
export function defaultLoadout(specimen:string,id:string):Loadout {const r=roleFor(id),skills=profileFor(id).skills;return {specimen,skills:[skills[0],skills[1]],gear:r==='venom'?'thorn':r==='guardian'?'leaf':r==='tempo'?'wing':'honey'};}
export function ensureAdventure(p:PlayerV2,now:number):Adventure {
 const day=utcDay(now);
 if(!p.adventure){const starters=['dragonfly','beetle','ladybug'].map(id=>p.specimens.find(s=>s.species===id)).filter((s):s is PlayerV2['specimens'][number]=>!!s);const initial=starters.length===3?starters:p.specimens.filter((s,i,all)=>all.findIndex(o=>o.species===s.species)===i).slice(0,3);p.adventure={areaStars:{},level:1,parts:0,gear:freshGear(),gearOwned:['leaf','honey'],mastery:{},build:initial.map(s=>defaultLoadout(s.id,s.species)),stage:1,run:null,expedition:null,stamps:0,researchChests:0,daily:{day,rule:TACTIC_RULE,fights:0,expeditions:0,rewardClaimed:false,scoreUsed:0,scores:[]},lastFind:null};p.nectar+=5;p.revision++;}
 const a=p.adventure;
 if(!a.gearOwned){a.gearOwned=['leaf','honey','thorn','wing'];p.revision++;}
 if(ALL_GEARS.some(g=>a.gear[g]===undefined)){a.gear={...freshGear(),...a.gear};p.revision++;}
 a.mastery??={};
 if(!a.rankedBuild){a.rankedBuild=a.build.map(b=>({species:p.specimens.find(s=>s.id===b.specimen)!.species,skills:[...b.skills],gear:b.gear}));p.revision++;}
 if(a.daily.day!==day){a.daily={day,rule:TACTIC_RULE,fights:0,expeditions:0,rewardClaimed:false,scoreUsed:0,scores:[]};p.nectar+=5;p.revision++;}
 if(a.daily.rule!==TACTIC_RULE){a.daily.rule=TACTIC_RULE;a.daily.scoreUsed=0;a.daily.scores=[];p.revision++;}
 for(const b of a.build){const s=p.specimens.find(s=>s.id===b.specimen);if(s&&b.skills.some(skill=>skillUnlock(s.species,skill)>a.level)){const allowed=profileFor(s.species).skills.filter(skill=>skillUnlock(s.species,skill)<=a.level);b.skills=[...new Set([...b.skills.filter(skill=>allowed.includes(skill)),...allowed])].slice(0,2) as [Skill,Skill];p.revision++;}}
 return a;
}
export function saveBuild(p:PlayerV2,raw:unknown){const a=p.adventure!;check(!a.run,'Rond eerst je gevecht af.');check(Array.isArray(raw)&&raw.length===3,'Kies drie bugs.');const chosen=new Set<string>();const build:Loadout[]=raw.map(value=>{
 check(value&&typeof value==='object'&&!Array.isArray(value),'Ongeldige build.');const b=value as Loadout;check(Object.keys(b).every(k=>['specimen','skills','gear'].includes(k)),'Een build mag geen eigen stats bevatten.');
 const s=p.specimens.find(s=>s.id===b.specimen);check(s&&!chosen.has(s.species),'Kies drie verschillende eigen soorten.');chosen.add(s.species);check(Object.hasOwn(GEARS,b.gear)&&a.gearOwned!.includes(b.gear),'Vind of maak dit item eerst.');
 check(Array.isArray(b.skills)&&b.skills.length===2&&new Set(b.skills).size===2&&b.skills.every(v=>skillUnlock(s.species,v)<=a.level),'Kies twee verschillende vaardigheden van deze bug.');return {specimen:s.id,skills:[...b.skills] as [Skill,Skill],gear:b.gear};
 });a.build=build;
}
export function saveRankedBuild(p:PlayerV2,raw:unknown){const a=p.adventure!;check(!a.run,'Rond eerst je gevecht af.');check(Array.isArray(raw)&&raw.length===3,'Kies drie bugs.');const chosen=new Set<string>();a.rankedBuild=raw.map(value=>{check(value&&typeof value==='object'&&!Array.isArray(value),'Ongeldige build.');const b=value as RankedLoadout;check(Object.keys(b).every(k=>['species','skills','gear'].includes(k)),'Geen eigen stats.');check(SPECIES.some(s=>s.id===b.species)&&!chosen.has(b.species),'Kies drie verschillende soorten.');chosen.add(b.species);check(Object.hasOwn(GEARS,b.gear),'Kies uitrusting.');check(Array.isArray(b.skills)&&b.skills.length===2&&new Set(b.skills).size===2&&b.skills.every(s=>profileFor(b.species).skills.includes(s)),'Kies twee passende vaardigheden.');return {species:b.species,skills:[...b.skills] as [Skill,Skill],gear:b.gear};});}
export function fighter(id:string,kind:string,level:number,skills:[Skill,Skill],gear:Gear,grade:number):Fighter {
 const role=roleFor(kind),base=profileFor(kind),scale=1+(level-1)*.055;
 const maxHealth=Math.round(base.health*scale*(gear==='honey'?1+.10*grade:gear==='wing'||gear==='sun'?.90:gear==='moon'?.95:1));
 return {id,species:kind,role,level,health:maxHealth,maxHealth,attack:Math.round(base.attack*scale*(gear==='dew'?.95:1)),armor:Math.round(base.armor*scale)+(gear==='leaf'?2*grade:0),energy:0,skills:[...skills],gear,grade,poison:0,poisonDamage:0,broken:0,fortified:0};
}
export function builtTeam(p:PlayerV2,normalized=false):Fighter[]{const a=p.adventure!;if(normalized){const choices=a.rankedBuild??a.build.map(b=>({species:p.specimens.find(s=>s.id===b.specimen)!.species,skills:b.skills,gear:b.gear}));return choices.map((b,i)=>({...fighter('score-'+i,b.species,10,b.skills,b.gear,1),shiny:p.shinies.includes(b.species)}));}return a.build.map(b=>{const s=p.specimens.find(s=>s.id===b.specimen);check(s,'Je build bevat een ontbrekend exemplaar.');return {...fighter(s.id,s.species,a.level,b.skills,b.gear,a.gear[b.gear]),mastery:{...a.mastery},shiny:s.shiny};});}
export function enemyTeam(seed:string,level:number):Fighter[]{const random=rng(seed),pool=SPECIES.filter(s=>s.tier<=(level<8?5:level<18?6:7)).map(s=>s.id),taken:string[]=[];return [0,1,2].map(i=>{const options=pool.filter(s=>!taken.includes(s)&&!taken.some(t=>roleFor(t)===roleFor(s))),id=options[Math.floor(random()*options.length)];taken.push(id);const load=defaultLoadout('enemy-'+i,id);return fighter('enemy-'+i,id,level,load.skills,load.gear,1);});}
export function startTactic(p:PlayerV2,mode:'boss'|'score',id:string,now:number,seed:string,selectedStage:unknown=undefined){const a=p.adventure!;const stage=selectedStage===undefined?a.stage:selectedStage;check(mode==='boss'?Number.isInteger(stage)&&Number(stage)>=1&&Number(stage)<=a.stage:selectedStage===undefined,'Kies een vrijgespeeld gebied.');check(!a.run,'Je hebt al een actief gevecht.');check(mode==='boss'||mode==='score','Kies een geldige spelvorm.');if(mode==='score')check(a.daily.scoreUsed<SCORE_ATTEMPTS,'Je drie scorepogingen van vandaag zijn gespeeld.');const attempt=mode==='score'?a.daily.scoreUsed++:0;
 const fightSeed=mode==='score'?seed+':'+attempt:seed+':stage-'+stage;
 a.run={id,rule:TACTIC_RULE,mode,day:utcDay(now),attempt,stage:Number(stage),seed:fightSeed,round:1,phase:'fight',teams:[builtTeam(p,mode==='score'),mode==='score'?enemyTeam(fightSeed,10):encounterFor(Number(stage)).team.map((kind,i)=>{const load=defaultLoadout('enemy-'+i,kind);return fighter('enemy-'+i,kind,Number(stage),load.skills,load.gear,1);})],active:[0,0],shields:[2,2],swapReady:[1,1],events:[],score:0,reward:null};
 if(mode==='boss'&&stage===1)for(const u of a.run.teams[1]){u.health=u.maxHealth=Math.round(u.maxHealth*.55);u.attack=Math.round(u.attack*.7);}
 a.run.intent=enemyAction(a.run);
}
export function legalActions(r:TacticRun,side:0|1):TacticAction[]{const u=r.teams[side][r.active[side]],actions:TacticAction[]=[{kind:'basic'}];for(const skill of u.skills)if(u.energy>=skillEnergy(u,skill))actions.push({kind:'skill',skill});if(r.shields[side]>0)actions.push({kind:'shield'});if(r.round>=r.swapReady[side])for(let target=0;target<3;target++)if(target!==r.active[side]&&r.teams[side][target].health>0)actions.push({kind:'switch',target});return actions;}
export function validateAction(r:TacticRun,raw:unknown):TacticAction {check(raw&&typeof raw==='object'&&!Array.isArray(raw),'Kies een gevechtsactie.');const a=raw as TacticAction;check(Object.keys(a).every(k=>['kind','skill','target'].includes(k)),'Een actie mag geen eigen schade of score bevatten.');const found=legalActions(r,0).find(v=>v.kind===a.kind&&v.skill===a.skill&&v.target===a.target);check(found,'Deze actie is nu niet beschikbaar.');return found;}
// The opponent commits from the previous state, before the submitted action is applied.
export function enemyAction(r:TacticRun):TacticAction {const u=r.teams[1][r.active[1]],enemy=r.teams[0][r.active[0]],actions=legalActions(r,1),find=(s:Skill)=>actions.find(a=>a.skill===s),random=rng((r.seed??'')+':ai:'+r.round);
 if((u.poison||u.broken)&&find('cleanse'))return find('cleanse')!;
 if(u.health<u.maxHealth*.55&&find('heal'))return find('heal')!;
 if(!u.fortified&&enemy.energy>=40&&find('fortify'))return find('fortify')!;
 if(enemy.energy>=60&&r.shields[1]&&random()<.55)return {kind:'shield'};
 if(!enemy.poison&&find('venom'))return find('venom')!;
 if(!enemy.broken&&enemy.armor>=5&&find('crush'))return find('crush')!;
 if(find('burst')&&(r.shields[0]===0||random()<.6))return find('burst')!;
 if(find('sting')&&(enemy.health<enemy.maxHealth*.3||enemy.energy>=60))return find('sting')!;
 if(u.health<u.maxHealth*.3&&r.round>=r.swapReady[1]){const next=actions.filter(a=>a.kind==='switch').sort((a,b)=>r.teams[1][b.target!].health-r.teams[1][a.target!].health)[0];if(next&&r.teams[1][next.target!].health>u.health*1.5)return next;}
 return {kind:'basic'};
}
export function resolveTurn(r:TacticRun,raw:unknown){check((r.rule===TACTIC_RULE||r.rule==='bugbaas-tactics-3'||r.rule==='bugbaas-tactics-2'||r.rule==='bugbaas-tactics-1')&&r.phase==='fight','Dit gevecht is afgelopen of gebruikt oude regels.');check(r.seed,'De server mist dit gevecht.',503);const chosen=validateAction(r,raw),opponent=r.intent??enemyAction(r),actions:[TacticAction,TacticAction]=[chosen,opponent];check(legalActions(r,1).some(a=>a.kind===opponent.kind&&a.skill===opponent.skill&&a.target===opponent.target),'De vijandelijke actie is niet beschikbaar.',503);r.events=[];
 const emit=(side:0|1,u:Fighter,kind:TacticEvent['kind'],amount:number,text:string)=>r.events.push({side,target:u.id,kind,amount,text});
 for(const side of [0,1] as const){const a=actions[side];if(a.kind==='switch'){r.active[side]=a.target!;r.swapReady[side]=r.round+3;emit(side,r.teams[side][a.target!],'switch',0,'Gewisseld');}}
 const active:[Fighter,Fighter]=[r.teams[0][r.active[0]],r.teams[1][r.active[1]]],guard:[number,number]=[0,0];
 for(const side of [0,1] as const){const a=actions[side],u=active[side];if(a.kind==='shield'){r.shields[side]--;guard[side]=u.role==='guardian'?.90:.80;emit(side,u,'shield',0,'Schild');}if(a.kind==='skill')u.energy-=skillEnergy(u,a.skill!);
  if(a.kind==='skill'&&a.skill==='fortify'){u.fortified=2;emit(side,u,'shield',0,'Verschansen');}
  if(a.kind==='skill'&&(a.skill==='heal'||a.skill==='cleanse')){if(a.skill==='cleanse'){u.poison=0;u.poisonDamage=0;u.broken=0;}const old=u.health;u.health=Math.min(u.maxHealth,u.health+Math.round(u.maxHealth*(a.skill==='heal'?.25+.02*(skillRank(u,'heal')-1):.1+.02*(skillRank(u,'cleanse')-1))*(u.role==='healer'?1.2:1)*(u.gear==='dew'?1+(25+10*u.grade)/100:1)));emit(side,u,'heal',u.health-old,a.skill==='heal'?'Herstel':'Gezuiverd');}
 }
 const damage:[number,number]=[0,0];
 for(const side of [0,1] as const){const a=actions[side],u=active[side],targetSide=(1-side) as 0|1,t=active[targetSide];if(a.kind==='switch'||a.kind==='shield'||a.kind==='skill'&&['heal','cleanse','fortify'].includes(a.skill!))continue;
  const rank=a.kind==='skill'?skillRank(u,a.skill!):1;let power=a.kind==='basic'?1:a.skill==='burst'?2.8+.2*(rank-1):a.skill==='sting'?1.4+.1*(rank-1):a.skill==='crush'?1.45+.1*(rank-1):.6;
  if(u.role==='burst'&&t.health<t.maxHealth*.35)power*=1.15;if(u.role==='breaker'&&t.broken)power*=1.15;
  const ward=a.kind==='skill'&&t.gear==='bark'&&!t.wardUsed?(25+10*t.grade)/100:0;if(ward)t.wardUsed=true;const armor=t.armor*(t.broken?.4:1),boost=a.kind==='skill'&&u.gear==='sun'?1+(4+4*u.grade)/100:1,amount=Math.max(1,Math.round(Math.max(1,u.attack*power-armor)*(1-guard[targetSide])*(t.fortified?1-(.35+.03*(skillRank(t,'fortify')-1)):1)*(1-ward)*boost));damage[targetSide]+=amount;emit(targetSide,t,'damage',amount,a.kind==='basic'?'Aanval':SKILLS[a.skill!].name);
  if(a.kind==='basic'){const old=u.energy;u.energy=Math.min(100,u.energy+basicEnergy(u));emit(side,u,'energy',u.energy-old,'Energie');}
  if(a.kind==='skill'&&a.skill==='venom'&&guard[targetSide]===0){t.poison=3+(u.role==='venom'?1:0);t.poisonDamage=Math.round(u.attack*.35*(1+.1*(rank-1))*(u.gear==='thorn'?1+.25*u.grade:1));emit(targetSide,t,'poison',t.poison,'Gif');}
  if(a.kind==='skill'&&a.skill==='crush'&&guard[targetSide]===0){t.broken=3;emit(targetSide,t,'break',0,'Pantser gebroken');}
 }
 for(const side of [0,1] as const){active[side].health=Math.max(0,active[side].health-damage[side]);for(const u of r.teams[side]){if(u.health>0&&u.poison){const n=Math.min(u.health,u.poisonDamage);u.health-=n;u.poison--;emit(side,u,'damage',n,'Gif');}if(u.broken)u.broken--;if(u.fortified)u.fortified--;}}
 for(const side of [0,1] as const)if(active[side].health<=0){const next=r.teams[side].findIndex(u=>u.health>0);if(next>=0){r.active[side]=next;r.swapReady[side]=r.round+1;}}
 const alive=r.teams.map(team=>team.some(u=>u.health>0));if(!alive[0]||!alive[1]||r.round>=turnLimit(r)){r.phase=alive[0]&&!alive[1]?'won':'lost';r.score=tacticScore(r);}else r.round++;
 if(r.phase==='fight'&&r.rule===TACTIC_RULE)r.intent=enemyAction(r);else delete r.intent;
}
// Reuse the same deterministic combat calculation for a read-only UI forecast.
// It never changes the real fight and cannot award loot or submit a result.
export function previewAction(r:TacticRun,action:TacticAction){
 if(!r.intent||r.phase!=='fight')return null;
 const copy=JSON.parse(JSON.stringify(r)) as TacticRun;copy.seed='preview-only';
 try{resolveTurn(copy,action);}catch{return null;}
 return {damage:copy.events.filter(e=>e.side===1&&e.kind==='damage').reduce((n,e)=>n+e.amount,0),incoming:copy.events.filter(e=>e.side===0&&e.kind==='damage').reduce((n,e)=>n+e.amount,0),healing:copy.events.filter(e=>e.side===0&&e.kind==='heal').reduce((n,e)=>n+e.amount,0),won:copy.phase==='won'};
}
export function tacticScore(r:TacticRun){const dealt=r.teams[1].reduce((sum,u)=>sum+u.maxHealth-u.health,0),alive=r.teams[0].filter(u=>u.health>0).length;return Math.round(dealt)+(r.phase==='won'?10000+alive*100+Math.max(0,MAX_ROUNDS-r.round)*15:0);}
export function finishTactic(p:PlayerV2,now:number):ChallengeScore|null {const a=p.adventure!,r=a.run;check(r&&r.phase!=='fight'&&!r.reward,'Dit resultaat is nog niet beschikbaar of al verwerkt.');const won=r.phase==='won',firstClear=won&&r.mode==='boss'&&!(a.areaStars?.[r.stage]),stars=masteryStars(won,r.round,r.teams[0].filter(u=>u.health>0).length),base=winMaterials(r.mode==='score'?1:r.stage),bonus=a.daily.fights<3?5:0,nectar=(won?base.nectar:r.round>=5?4:0)+bonus,parts=won?base.parts:0;r.reward={nectar,parts};p.nectar+=nectar;a.parts+=parts;a.daily.fights++;
 if(won&&r.mode==='boss'){a.areaStars??={};a.areaStars[r.stage]=Math.max(a.areaStars[r.stage]??0,stars);r.reward.stars=stars;r.reward.firstClear=firstClear;if(r.stage===30&&!p.medals.includes('oerboom'))p.medals.push('oerboom');}
 if(won){const buddy=p.specimens.find(s=>s.id===p.buddy);if(buddy&&a.build.some(b=>b.specimen===buddy.id)&&p.buddyToday<3){buddy.hearts++;p.buddyToday++;}if(p.giftDay!==utcDay(now)){p.giftDay=utcDay(now);if(p.cards.length<10)p.cards.push({id:'card-'+r.id,habitat:(r.stage-1)%4});}}
 if(won&&r.mode==='boss'){if(r.stage===a.stage)a.stage=Math.min(30,a.stage+1);const found=rollFind((r.lootSeed??r.seed!)+':find:'+r.id,r.stage),duplicate=awardFind(p,'fight-'+r.id,found.species,now,found.shiny),extra=duplicate?duplicateNectar(found.species):0;p.nectar+=extra;r.reward={nectar:nectar+extra,parts,species:found.species,shiny:found.shiny,duplicate,stars,firstClear};}
 if(won&&r.mode==='boss'){const bossItem=firstClear?encounterFor(r.stage).item:null;const gear=bossItem??(r.stage===1&&!a.wingGift&&!a.gearOwned!.includes('wing')?'wing':rollEquipment((r.lootSeed??r.seed!)+':equipment:'+r.id,r.stage));if(r.stage===1)a.wingGift=true;if(gear){const found=awardEquipment(p,gear,now);r.reward.gear=gear;r.reward.gearDuplicate=found.duplicate;r.reward.salvage=found.parts;r.reward.parts+=found.parts;}}
 if(r.mode==='score'){if(a.daily.day===r.day&&a.daily.rule===r.rule){const scores=a.daily.scores;while(scores.length<=r.attempt)scores.push(0);scores[r.attempt]=r.score;}return {uid:p.uid,name:p.name,day:r.day,rule:r.rule,score:r.score,scores:[],attempts:r.attempt+1,updatedAt:now};}return null;
}
export function awardFind(p:PlayerV2,id:string,kind:string,now:number,shiny:boolean){check(!p.specimens.some(s=>s.id===id),'Deze vondst is al opgehaald.',409);const duplicate=p.discovered.includes(kind);p.specimens.push({id,species:kind,level:1,shiny,favorite:false,obtainedAt:now,source:'adventure',hearts:0,item:null});if(!duplicate)p.discovered.push(kind);if(shiny&&!p.shinies.includes(kind))p.shinies.push(kind);p.adventure!.lastFind=kind;return duplicate;}
export function startExpedition(p:PlayerV2,habitat:unknown,hours:unknown,id:string,seed:string,now:number){const a=p.adventure!;check(!a.expedition,'Haal eerst je vorige expeditie op.');check(Number.isInteger(habitat)&&Number(habitat)>=0&&Number(habitat)<4,'Kies een gebied.');check(hours===2||hours===8,'Kies twee of acht uur.');a.expedition={id,habitat:Number(habitat),hours,stage:a.stage,startedAt:now,readyAt:now+hours*3600000,seed};}
export function claimExpedition(p:PlayerV2,now:number){const a=p.adventure!,e=a.expedition;check(e&&e.seed&&e.readyAt<=now,'Je verkenner is nog onderweg.');const stage=e.stage??a.stage,found=rollFind(e.seed,stage,e.habitat,e.hours),duplicate=awardFind(p,'expedition-'+e.id,found.species,now,found.shiny),materials=expeditionMaterials(stage,e.hours);p.nectar+=materials.nectar+(duplicate?duplicateNectar(found.species):0);a.parts+=materials.parts;const gear=rollEquipment(e.seed+':equipment',stage,e.hours);if(gear)awardEquipment(p,gear,now);a.daily.expeditions++;a.expedition=null;}
export function claimResearch(p:PlayerV2){const a=p.adventure!;check((a.daily.fights>=1||(p.field?.daily.catches??0)>=3)&&!a.daily.rewardClaimed,'Vang drie bugs of speel een gevecht voor je dagstempel, of je hebt hem al.');a.daily.rewardClaimed=true;a.stamps++;p.nectar+=5;if(a.stamps%7===0){a.researchChests++;p.nectar+=40;a.parts+=10;grantField(p,{silk:3,gold:1,silver:1},Date.parse(a.daily.day+'T12:00:00Z'));}if(a.stamps%28===0)grantField(p,{royal:1},Date.parse(a.daily.day+'T12:00:00Z'));}
