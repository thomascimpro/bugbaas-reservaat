import type {GymProgress} from './gymsV2';
import type {DailyChallengeProgress} from './dailyChallengeV2';
import {ensureTrainer,catchXP,grantXP} from './trainerV2';
import {FIELD_FAMILY_SPECIES} from './fieldFamiliesV2';
import {EXPANDED_BY_ID,ULTIMATE_BASES} from './dexExpansionV2';
import {EVOLUTIONS,candyFamily,baseSpeciesId,ELITE_FORMS,evolutionLine,evolutionStage} from './dexV2';
import type {EchoProgress} from './echoArenaV2';
import type {GoCocoonsProgress} from './goCocoonsV2';
import type {BossProgress} from './goBossV2';
import type {GoTradeProgress} from './goTradeV2';
import type {GoJournalEntry} from './goJournalV2';
import type {TrainerProgress} from './trainerV2';
import type {SiteProgress} from './worldSitesV2';
import {rng,species} from './catalogV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2,Specimen} from './typesV2';
import type {Fix} from './walkingV2';
export type Element='bug'|'flying'|'poison'|'grass'|'ground'|'rock'|'steel'|'dark'|'normal'|'fire'|'water';
export type League='great'|'ultra'|'master';
export const LEAGUES={great:{name:'Great League',cap:1500},ultra:{name:'Ultra League',cap:2500},master:{name:'Master League',cap:Infinity}};
export const HELD={
 leaf:{name:'Dauwblad',icon:'itemLeaf',attack:1,defense:1,hp:1.05,hint:'+5% HP'},
 thorn:{name:'Doorn',icon:'itemThorn',attack:1.03,defense:1,hp:1,hint:'+3% aanval'},
 bark:{name:'Schors',icon:'itemBark',attack:1,defense:1.05,hp:1,hint:'+5% verdediging'},
 wing:{name:'Windveer',icon:'itemWing',attack:1.01,defense:1.01,hp:1.01,hint:'+1% op alle stats'},
 honey:{name:'Honinghart',icon:'itemHoney',attack:1.02,defense:1,hp:1.02,hint:'+2% aanval en HP'},
 dew:{name:'Dauwkristal',icon:'itemDew',attack:1,defense:1.03,hp:1.03,hint:'+3% verdediging en HP'},
 moon:{name:'Maanzaad',icon:'itemMoon',attack:1.06,defense:1,hp:.94,hint:'+6% aanval · −6% HP'},
 sun:{name:'Zonnekern',icon:'itemSun',attack:1,defense:.95,hp:1.10,hint:'+10% HP · −5% verdediging'},
} as const;
export type Held=keyof typeof HELD;
export const FAST={
 water:{name:'Waterslag',type:'water',power:3,energy:3,turns:1},
 bite:{name:'Insectenbeet',type:'bug',power:3,energy:3,turns:1},
 fury:{name:'Snijslag',type:'bug',power:2,energy:4,turns:1},
 wing:{name:'Vleugelslag',type:'flying',power:5,energy:8,turns:2},
 poison:{name:'Gifprik',type:'poison',power:3,energy:9,turns:2},
 mud:{name:'Modderslag',type:'ground',power:5,energy:8,turns:2},
 leaf:{name:'Bladsnede',type:'grass',power:9,energy:4,turns:2},
} as const;
export const CHARGED={
 stream:{name:'Stroomstoot',type:'water',power:55,energy:35},
 flare:{name:'Zonnegloed',type:'fire',power:90,energy:55},
 cut:{name:'Kruissnede',type:'bug',power:55,energy:35},
 buzz:{name:'Zoemgolf',type:'bug',power:100,energy:60},
 air:{name:'Luchtstoot',type:'flying',power:55,energy:40},
 venom:{name:'Gifbom',type:'poison',power:80,energy:50},
 rock:{name:'Steenslag',type:'rock',power:75,energy:45},
 seed:{name:'Zaadbom',type:'grass',power:60,energy:40},
 earth:{name:'Aardstoot',type:'ground',power:90,energy:55},
 iron:{name:'IJzerkop',type:'steel',power:70,energy:50},
 dark:{name:'Nachtbeet',type:'dark',power:70,energy:45},
} as const;
export type Fast=keyof typeof FAST;
export type Charged=keyof typeof CHARGED;
export type GoBug={traded?:{id:string;at:number;from:string};level:number;iv:[number,number,number];fast:Fast;charged:Charged[];item:Held|null};
export type GoProfile={
 dailyChallenge?:DailyChallengeProgress;
 gyms?:GymProgress;
 journal?:GoJournalEntry[];trades?:GoTradeProgress;
 echo?:EchoProgress;cocoons?:GoCocoonsProgress;bosses?:BossProgress;
 sites?:SiteProgress;trainer?:TrainerProgress;
 entries?:Record<string,{seenAt:number|null;caughtAt:number|null;shinyAt:number|null}>;dexVersion?:1;
 ratedDay?:string;ratedCount?:number;dex?:string[];version:1;dust:number;candy:Record<string,number>;xl:Record<string,number>;items:Record<Held,number>;fastTMs:number;chargedTMs:number;
 team:string[];league:League;rating:number;wins:number;losses:number;history:{id:string;opponent:string;result:string;delta:number;at:number}[];
 battle:string|null;queue:{league:League;at:number;until:number}|null;
 auto:{enabled:boolean;lastAt:number;attempted:string[];last?:{species:string;caught:boolean;at:number};totals?:{caught:number;missed:number;dust:number;xp:number;spins?:number};status:'off'|'waiting'|'moving'|'too-fast'|'gps'|'empty';moving:number};
 motion?:{fix:Fix;at:number};buddyMeters:number;
};
export function eligible(s:Specimen){return !!s.go||['walking','cocoon','metamorphosis'].includes(s.source);}
export const family=candyFamily;
export function movePool(id:string):{types:Element[];fast:Fast[];charged:Charged[]}{
 const role=EXPANDED_BY_ID[id]?.moveRole;
 if(role==='spider')return {types:['bug','poison'],fast:['fury','poison'],charged:['cut','venom','dark']};
 if(role==='armabee')return {types:['bug','steel'],fast:['bite','fury'],charged:['iron','buzz','cut']};
 if(role==='scorpion')return {types:['bug','poison'],fast:['poison','mud'],charged:['venom','earth','dark']};
 if(role==='centipede')return {types:['bug','dark'],fast:['bite','poison'],charged:['dark','venom','cut']};
 if(role==='wasp')return {types:['bug','flying'],fast:['wing','poison'],charged:['air','venom','cut']};
 if(role==='dragonfly')return {types:['bug','flying'],fast:['wing','fury'],charged:['air','buzz','stream']};
 if(role==='firefly')return {types:['bug','fire'],fast:['bite','fury'],charged:['flare','buzz','seed']};
 if(role==='cicada')return {types:['bug','flying'],fast:['wing','bite'],charged:['buzz','air','rock']};
 if(role==='mosquito')return {types:['bug','poison'],fast:['poison','fury'],charged:['venom','stream','cut']};
 if(role==='snail')return {types:['bug','rock'],fast:['mud','bite'],charged:['rock','earth','stream']};
 id=baseSpeciesId(id);
 const fieldFamily=FIELD_FAMILY_SPECIES.find(s=>s.id===id)?.family;
 if(fieldFamily==='lesserstag'||fieldFamily==='manticora')return {types:['bug','dark'],fast:['bite','fury'],charged:['cut','dark','rock']};
 if(fieldFamily==='minotaurbeetle'||fieldFamily==='eyedclickbeetle'||fieldFamily==='sacredscarab')return {types:['bug','ground'],fast:['mud','bite'],charged:['earth','rock','iron']};
 if(fieldFamily==='rosechafer'||fieldFamily==='asianladybeetle')return {types:['bug','steel'],fast:['bite','mud'],charged:['iron','rock','earth']};
 if(fieldFamily==='acornweevil'||fieldFamily==='leafbeetle')return {types:['bug','grass'],fast:['leaf','fury'],charged:['seed','cut','rock']};
 if(fieldFamily==='cardinalbeetle')return {types:['bug','poison'],fast:['poison','bite'],charged:['venom','cut','dark']};
 if(id==='beetlegrub')return {types:['bug'],fast:['bite','fury'],charged:['cut','earth','rock']};
 if(id==='giantwaterbug'||id==='waterstrider')return {types:['bug','water'],fast:['water','bite'],charged:['stream','cut','earth']};
 if(id==='moth')return {types:['bug','flying'],fast:['wing','fury'],charged:['air','buzz','cut','flare']};
 if(/moth|fly|butterfly|lacewing|bee(?!tle)|wasp|hornet|luna|morpho|peacock/.test(id))return {types:['bug','flying'],fast:['wing','fury'],charged:['air','buzz','cut']};
 if(/mantis|leaf|aphid|stick|weevil|caterpillar|silkworm/.test(id))return {types:['bug','grass'],fast:['fury','leaf'],charged:['cut','seed','buzz']};
 if(id==='antlion')return {types:['bug','ground'],fast:['mud','bite'],charged:['earth','rock','cut']};
 if(id==='cockroach')return {types:['bug','dark'],fast:['bite','fury'],charged:['dark','cut','buzz']};
 if(id==='termite')return {types:['bug','ground'],fast:['mud','fury'],charged:['earth','cut','rock']};
 if(/earwig|scorpion|centipede|silverfish/.test(id))return {types:['bug','poison'],fast:['poison','bite'],charged:['venom','dark','cut']};
 if(/beetle|stag|rhino|hercules|scarab|goliath|shieldbug/.test(id))return {types:['bug','steel'],fast:['bite','mud'],charged:['iron','rock','earth']};
 return {types:['bug'],fast:['bite','fury'],charged:['cut','rock','buzz']};
}
export function rollGoBug(kind:string,seed:string):GoBug{const random=rng(seed),pool=movePool(kind);return {level:1+Math.floor(random()*20),iv:[Math.floor(random()*16),Math.floor(random()*16),Math.floor(random()*16)],fast:pool.fast[Math.floor(random()*pool.fast.length)],charged:[pool.charged[Math.floor(random()*pool.charged.length)]],item:null};}
export function ensureGo(p:PlayerV2,now:number){
 if(!p.go){p.go={version:1,dust:0,candy:{},xl:{},items:{leaf:0,thorn:0,bark:0,wing:0,honey:0,dew:0,moon:0,sun:0},fastTMs:0,chargedTMs:0,team:[],league:'great',rating:1000,wins:0,losses:0,history:[],battle:null,queue:null,auto:{enabled:false,lastAt:0,attempted:[],status:'off',moving:0},buddyMeters:0};p.revision++;}
 const g=p.go;for(const key of Object.keys(HELD) as Held[])g.items[key]??=0;ensureTrainer(p);g.dex??=[];g.entries??={};g.dexVersion=1;for(const id of g.dex)g.entries[id]??={seenAt:null,caughtAt:null,shinyAt:null};for(const s of p.specimens.filter(eligible)){g.entries[s.species]??={seenAt:s.obtainedAt,caughtAt:s.obtainedAt,shinyAt:s.shiny?s.obtainedAt:null};if(!g.dex.includes(s.species))g.dex.push(s.species);}for(const s of p.specimens.filter(eligible))if(!s.go){if(!g.dex.includes(s.species))g.dex.push(s.species);s.go=rollGoBug(s.species,p.uid+':existing:'+s.id);g.candy[family(s.species)]=(g.candy[family(s.species)]??0)+3;g.dust+=100;p.revision++;}
 if(!p.specimens.some(s=>s.id===p.buddy&&eligible(s)))p.buddy=p.specimens.find(eligible)?.id??'';
 if(p.field&&p.field.inventory.basic===undefined)p.field.inventory.basic=30;
 return g;
}
const CPM=[.094,.16639787,.21573247,.25572005,.29024988,.3210876,.34921268,.37523559,.39956728,.4225,.44310755,.46279839,.48168495,.49985844,.51739395,.53435433,.55079269,.56675452,.58227891,.5974,.61215729,.62656713,.64065295,.65443563,.667934,.68116492,.69414365,.70688421,.71939909,.7317,.73776948,.74378943,.74976104,.75568551,.76156384,.76739717,.7731865,.77893275,.78463697,.7903,.7953,.8003,.8053,.8103,.8153,.8203,.8253,.8303,.8353,.8403];
export function stats(s:Specimen,override?:GoBug){const b=override??s.go!;const meta=species(s.species),lo=CPM[Math.floor(b.level)-1],hi=CPM[Math.min(49,Math.ceil(b.level)-1)],c=b.level%1?Math.sqrt((lo*lo+hi*hi)/2):lo,item=b.item?HELD[b.item]:{attack:1,defense:1,hp:1},attack=(140+meta.attack*12+b.iv[0])*c*item.attack,defense=(130+meta.health*10+b.iv[1])*c*item.defense,hp=Math.max(10,Math.floor((140+meta.health*18+b.iv[2])*c*item.hp)),cp=Math.max(10,Math.floor(attack*Math.sqrt(defense)*Math.sqrt((140+meta.health*18+b.iv[2])*c*item.hp)/10));return {attack,defense,hp,cp};}
export function powerCost(level:number,steps=1){
 if(!Number.isInteger(steps)||steps<1||steps>10||!Number.isFinite(level)||level<1||!Number.isInteger(level*2)||level+steps*.5>50)return null;
 const total={dust:0,candy:0,xl:0};for(let i=0;i<steps;i++){const at=level+i*.5;total.dust+=[200,400,600,800,1000,1300,1600,1900,2200,2500,3000,3500,4000,4500,5000,6000,7000,8000,9000,10000,11000,12000,13000,14000,15000][Math.min(24,Math.floor((at-1)/2))];if(at<40)total.candy+=at<11?1:at<21?2:at<26?3:at<31?4:at<33?6:at<35?8:at<37?10:at<39?12:15;else total.xl+=[10,10,12,12,15,15,17,17,20,20][Math.floor(at)-40];}return total;
}
export function appraisal(s:Specimen){const total=s.go!.iv.reduce((a,b)=>a+b,0);return total===45?4:total>=37?3:total>=30?2:total>=23?1:0;}
export function availableGo(p:PlayerV2,id:unknown){check(!p.go?.gyms?.deployed.some(d=>d.specimen===id),'Deze bug verdedigt een gym en komt terug na een nederlaag of na 12 uur.');}
export function ownedGo(p:PlayerV2,id:unknown){const s=p.specimens.find(s=>s.id===id&&s.go);check(s,'Kies een zelfgevangen bug.');return s;}
export function renameGo(p:PlayerV2,id:unknown,raw:unknown){const s=ownedGo(p,id);check(typeof raw==='string','Kies een geldige bijnaam.');const name=(raw as string).trim().normalize('NFC');check(name.length<=18&&(!name||/^[\p{L}\p{N} _'’\-]+$/u.test(name)),'Gebruik maximaal 18 letters of cijfers.');if(name)s.nickname=name;else delete s.nickname;}
export function powerUp(p:PlayerV2,id:unknown,steps:unknown=1){availableGo(p,id);check(typeof steps==='number'&&Number.isInteger(steps)&&steps>=1&&steps<=10,'Kies 1 tot 10 power-ups.');const s=ownedGo(p,id),g=p.go!,cost=powerCost(s.go!.level,steps),key=family(s.species);check(cost,'Deze power-ups passen niet binnen level 50.');check(g.dust>=cost.dust&&(g.candy[key]??0)>=cost.candy&&(g.xl[key]??0)>=cost.xl,'Niet genoeg nectarstof, soortnectar of XL.');g.dust-=cost.dust;g.candy[key]=(g.candy[key]??0)-cost.candy;if(cost.xl)g.xl[key]-=cost.xl;s.go!.level+=steps*.5;}
export function secondCost(kind:string){const tier=species(evolutionLine(kind)[0]).tier;return tier<=2?{dust:10000,candy:25}:tier<=4?{dust:50000,candy:50}:tier<=6?{dust:75000,candy:75}:{dust:100000,candy:100};}
export function secondAttack(p:PlayerV2,id:unknown,seed:string){availableGo(p,id);const s=ownedGo(p,id),g=p.go!,key=family(s.species),cost=secondCost(s.species);check(s.go!.charged.length===1&&g.dust>=cost.dust&&(g.candy[key]??0)>=cost.candy,'Niet genoeg nectarstof of soortnectar voor de tweede aanval.');const pool=movePool(s.species).charged.filter(m=>!s.go!.charged.includes(m));s.go!.charged.push(pool[Math.floor(rng(seed)()*pool.length)]);g.dust-=cost.dust;g.candy[key]-=cost.candy;}
export function teachMove(p:PlayerV2,id:unknown,slot:unknown,seed:string){availableGo(p,id);const s=ownedGo(p,id),g=p.go!,pool=movePool(s.species);if(slot==='fast'){check(g.fastTMs>0,'Je hebt een snelle TM nodig.');const options=pool.fast.filter(m=>m!==s.go!.fast);s.go!.fast=options[Math.floor(rng(seed)()*options.length)];g.fastTMs--;}else{check((slot===0||slot===1)&&slot<s.go!.charged.length&&g.chargedTMs>0,'Kies een bestaande aanval en gebruik een opgeladen TM.');const options=pool.charged.filter(m=>!s.go!.charged.includes(m));check(options.length,'Geen andere aanval beschikbaar.');s.go!.charged[slot as number]=options[Math.floor(rng(seed)()*options.length)];g.chargedTMs--;}}
export function equipGo(p:PlayerV2,id:unknown,item:unknown){availableGo(p,id);const s=ownedGo(p,id);check(item===null||typeof item==='string'&&Object.hasOwn(HELD,item),'Kies een held item.');if(item)check((p.go!.items[item as Held]??0)>p.specimens.filter(o=>o.id!==s.id&&o.go?.item===item).length,'Dit item is al uitgerust of nog niet gevonden.');s.go!.item=item as Held|null;}
export function teamIssue(p:PlayerV2,raw:unknown,league:unknown,npc=false):string|null{
 if(typeof league!=='string'||!Object.hasOwn(LEAGUES,league)||!Array.isArray(raw)||raw.length!==3||new Set(raw).size!==3)return 'Kies drie verschillende eigen exemplaren en een league.';
 if(!npc&&league==='ultra'&&p.specimens.filter(s=>s.go&&stats(s).cp>1500).length<3)return 'Ultra League vraagt drie bugs boven 1500 CP.';
 if(!npc&&league==='master'&&p.specimens.filter(s=>s.go&&stats(s).cp>2500).length<3)return 'Master League vraagt drie bugs boven 2500 CP.';
 const team=raw.map(id=>p.specimens.find(s=>s.id===id&&s.go));if(team.some(s=>!s))return 'Kies een zelfgevangen bug.';
 if(team.some(s=>p.go?.gyms?.deployed.some(d=>d.specimen===s!.id)))return 'Een bug verdedigt een gym. Kies een andere bug.';
 if(new Set(team.map(s=>s!.species)).size!==3)return 'Kies drie verschillende soorten.';
 if(team.some(s=>stats(s!).cp>LEAGUES[league as League].cap))return 'Een bug zit boven de CP-limiet.';
 return null;
}
export function teamGo(p:PlayerV2,raw:unknown,league:unknown,npc=false){const issue=teamIssue(p,raw,league,npc);check(!issue,issue??'Ongeldig team.');p.go!.team=[...(raw as string[])];p.go!.league=league as League;}
export function transferGo(p:PlayerV2,id:unknown){availableGo(p,id);const s=ownedGo(p,id);check(!s.favorite&&!s.shiny&&s.id!==p.buddy&&!p.go!.team.includes(s.id),'Favorieten, shinies, buddy en teambugs zijn beschermd.');p.go!.candy[family(s.species)]=(p.go!.candy[family(s.species)]??0)+1;p.specimens=p.specimens.filter(o=>o.id!==s.id);}
export function transferManyGo(p:PlayerV2,ids:unknown){check(Array.isArray(ids)&&ids.length>0&&ids.length<=50&&new Set(ids).size===ids.length,'Kies 1 tot 50 verschillende bugs.');const specimens=ids.map(id=>{availableGo(p,id);return ownedGo(p,id);});check(specimens.every(s=>!s.favorite&&!s.shiny&&s.id!==p.buddy&&!p.go!.team.includes(s.id)),'Favorieten, shinies, buddy en teambugs zijn beschermd.');for(const s of specimens)transferGo(p,s.id);}
export function markGoSeen(p:PlayerV2,kind:string,now:number){const g=p.go!;g.entries??={};g.entries[kind]??={seenAt:now,caughtAt:null,shinyAt:null};}
export function evolveGo(p:PlayerV2,id:unknown,seed:string,now=Date.now()){
 availableGo(p,id);
 const s=ownedGo(p,id),g=p.go!,key=family(s.species),evo=EVOLUTIONS[s.species];
 check(evo&&(g.candy[key]??0)>=evo.candy,'Deze evolutie vraagt voldoende soortnectar.');
 g.candy[key]-=evo.candy-1;s.species=evo.to;
 if(!ELITE_FORMS[s.species]&&!ULTIMATE_BASES[s.species]){const slots=s.go!.charged.length,moves=rollGoBug(s.species,seed);s.go={...s.go!,fast:moves.fast,charged:slots>1?[...new Set([...moves.charged,...movePool(s.species).charged])].slice(0,2):moves.charged};}
 if(!g.dex!.includes(s.species))g.dex!.push(s.species);if(!p.discovered.includes(s.species))p.discovered.push(s.species);if(s.shiny&&!p.shinies.includes(s.species))p.shinies.push(s.species);
 markGoSeen(p,s.species,now);g.entries![s.species].caughtAt??=now;if(s.shiny)g.entries![s.species].shinyAt??=now;
}
export function awardGoCatch(p:PlayerV2,s:Specimen,seed:string,bait:string|null=null,grade?:string,curved=false){const g=p.go!,key=family(s.species),newKind=!g.dex!.includes(s.species);if(s.source==='cocoon')grantXP(p,100+(newKind?500:0));else catchXP(p,newKind,s.obtainedAt,grade,curved);s.go=rollGoBug(s.species,seed);const reward=s.source==='cocoon'?{dust:100,candy:3}:goCatchRewards(s.species,bait);g.dust+=reward.dust;g.candy[key]=(g.candy[key]??0)+reward.candy;const random=rng(seed+':extra');let held:Held|null=null;if(s.go.level>=15&&random()<.1)g.xl[key]=(g.xl[key]??0)+1;if(random()<.04){const items=Object.keys(HELD) as Held[];held=items[Math.floor(random()*items.length)];g.items[held]++;}if(!g.dex!.includes(s.species))g.dex!.push(s.species);markGoSeen(p,s.species,s.obtainedAt);g.entries![s.species].caughtAt??=s.obtainedAt;if(s.shiny)g.entries![s.species].shinyAt??=s.obtainedAt;if(!p.buddy)p.buddy=s.id;return held;}

export function goCatchRewards(kind:string,bait:string|null=null){const stage=evolutionStage(kind),candy=[3,5,10][stage-1];return {dust:[100,300,500][stage-1],candy:bait==='fruit'?candy*2:bait==='silver'?Math.floor(candy*7/3):candy};}
export function buddyDistance(kind:string){const tier=species(evolutionLine(kind)[0]).tier;return tier<=2?1000:tier<=5?3000:5000;}
