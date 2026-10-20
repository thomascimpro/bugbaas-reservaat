import {rng} from './catalogV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2} from './typesV2';
import {gearUnlockStage} from './progressionV2';
import {zoneName} from './worldV2';

export const GEARS={
 leaf:{name:'Bladschild',icon:'shield',art:'itemLeaf',rarity:'common',stage:1,craft:8},
 honey:{name:'Honinghart',icon:'heart',art:'itemHoney',rarity:'common',stage:1,craft:8},
 thorn:{name:'Gifdoorn',icon:'leaf',art:'itemThorn',rarity:'uncommon',stage:1,craft:20},
 wing:{name:'Windveer',icon:'compass',art:'itemWing',rarity:'uncommon',stage:1,craft:20},
 dew:{name:'Dauwparel',icon:'heart',art:'itemDew',rarity:'rare',stage:8,craft:60},
 bark:{name:'Schorszegel',icon:'shield',art:'itemBark',rarity:'rare',stage:8,craft:60},
 moon:{name:'Maanlens',icon:'star',art:'itemMoon',rarity:'mythic',stage:18,craft:160},
 sun:{name:'Zonnekern',icon:'nectar',art:'itemSun',rarity:'mythic',stage:18,craft:160},
} as const;
export type Gear=keyof typeof GEARS;
export const ALL_GEARS=Object.keys(GEARS) as Gear[];
export const freshGear=()=>Object.fromEntries(ALL_GEARS.map(g=>[g,1])) as Record<Gear,number>;
export const salvageParts=(gear:Gear)=>({common:2,uncommon:3,rare:6,mythic:12}[GEARS[gear].rarity]);
export const gearCost=(grade:number)=>grade===1?10:grade===2?30:0;
export function gearText(g:Gear,grade:number){return g==='leaf'?'+'+2*grade+' pantser.':g==='thorn'?'Gifschade +'+25*grade+'%.':g==='honey'?'Leven +'+10*grade+'%.':g==='wing'?'+'+(8+2*grade)+' energie per aanval; 10% minder leven.':g==='dew'?'Genezing +'+(25+10*grade)+'%; 5% minder aanval.':g==='bark'?'Eerste schadelijke vaardigheid doet '+(25+10*grade)+'% minder directe schade.':g==='moon'?'Vaardigheden kosten '+(1+2*grade)+' minder energie; 5% minder leven.':'Directe vaardigheidsschade +'+(4+4*grade)+'%; 10% minder leven.';}
export function equipmentWeights(stage:number){return stage<8?{common:60,uncommon:40,rare:0,mythic:0}:stage<18?{common:40,uncommon:35,rare:25,mythic:0}:{common:30,uncommon:30,rare:30,mythic:10};}
export const equipmentRollChance=(hours=0)=>hours===8?.5:hours===2?.25:.125;
export function equipmentChance(g:Gear,stage:number,hours=0){if(stage<GEARS[g].stage)return 0;const rarity=GEARS[g].rarity,count=ALL_GEARS.filter(k=>GEARS[k].rarity===rarity).length;return equipmentRollChance(hours)*equipmentWeights(stage)[rarity]/count;}
export function rollEquipment(seed:string,stage:number,hours=0):Gear|null{const random=rng(seed);if(random()>=equipmentRollChance(hours))return null;const weights=equipmentWeights(stage);let value=random()*100;for(const key of ['common','uncommon','rare','mythic'] as const){value-=weights[key];if(value<0){const pool=ALL_GEARS.filter(g=>GEARS[g].rarity===key);return pool[Math.floor(random()*pool.length)];}}return null;}
export function awardEquipment(p:PlayerV2,gear:Gear,now:number){const a=p.adventure!,duplicate=a.gearOwned!.includes(gear),parts=duplicate?salvageParts(gear):0;if(!duplicate)a.gearOwned!.push(gear);a.parts+=parts;const found={gear,duplicate,parts,at:now};a.lastGear=found;return found;}
export function craftEquipment(p:PlayerV2,raw:unknown,now:number){check(typeof raw==='string'&&Object.hasOwn(GEARS,raw),'Kies uitrusting.');const gear=raw as Gear,a=p.adventure!;check(!a.gearOwned!.includes(gear),'Dit item heb je al.');check(a.stage>=GEARS[gear].stage,'Te maken vanaf '+zoneName(GEARS[gear].stage)+'.');check(a.parts>=GEARS[gear].craft,'Niet genoeg onderdelen.');a.parts-=GEARS[gear].craft;return awardEquipment(p,gear,now);}
export function upgradeEquipment(p:PlayerV2,raw:unknown){check(typeof raw==='string'&&Object.hasOwn(GEARS,raw),'Kies uitrusting.');const gear=raw as Gear,a=p.adventure!,cost=gearCost(a.gear[gear]);check(a.gearOwned!.includes(gear),'Vind of maak dit item eerst.');check(cost>0,'Maximum bereikt.');check(a.stage>=gearUnlockStage(a.gear[gear]),'Verbeter vanaf '+zoneName(gearUnlockStage(a.gear[gear]))+'.');check(a.parts>=cost,'Niet genoeg onderdelen.');a.parts-=cost;a.gear[gear]++;}
