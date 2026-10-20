import {rng,SPECIES,species} from './catalogV2';
export const SHINY_ODDS=64;

export const RARITIES={
 common:{name:'Gewoon',color:'#707780',wash:'#E8EAED',stage:1},
 uncommon:{name:'Ongewoon',color:'#2F7D25',wash:'#E1F3D8',stage:1},
 rare:{name:'Zeldzaam',color:'#2374CF',wash:'#DFEDFF',stage:8},
 mythic:{name:'Mythisch',color:'#A47C00',wash:'#FFF1B8',stage:18},
} as const;
export type Rarity=keyof typeof RARITIES;
export const rarityFor=(id:string):Rarity=>species(id).tier>=7?'mythic':species(id).tier===6?'rare':species(id).tier>=4?'uncommon':'common';
export function lootChances(stage:number,hours=2):Record<Rarity,number>{
 if(stage<8)return {common:hours===8?70:80,uncommon:hours===8?30:20,rare:0,mythic:0};
 if(stage<18)return {common:hours===8?45:55,uncommon:35,rare:hours===8?20:10,mythic:0};
 return {common:hours===8?30:40,uncommon:35,rare:hours===8?30:22,mythic:hours===8?5:3};
}
export function speciesChance(id:string,stage:number,habitat?:number,hours=2){
 const kind=species(id);if(habitat!==undefined&&kind.habitat!==habitat)return 0;
 const rarity=rarityFor(id),pool=SPECIES.filter(s=>rarityFor(s.id)===rarity&&(habitat===undefined||s.habitat===habitat));
 return lootChances(stage,hours)[rarity]/pool.length;
}
export function rollFind(seed:string,stage:number,habitat?:number,hours=2){
 const random=rng(seed),odds=lootChances(stage,hours);let roll=random()*100,rarity:Rarity='common';
 for(const r of Object.keys(RARITIES) as Rarity[]){roll-=odds[r];if(roll<0){rarity=r;break;}}
 const pool=SPECIES.filter(s=>rarityFor(s.id)===rarity&&(habitat===undefined||s.habitat===habitat));
 return {species:pool[Math.floor(random()*pool.length)].id,shiny:random()<1/SHINY_ODDS};
}
export const duplicateNectar=(id:string)=>({common:2,uncommon:4,rare:8,mythic:20}[rarityFor(id)]);
export const fieldPhase=(stage:number)=>stage<8?'Begin · gebied 1–7':stage<18?'Opbouw · gebied 8–17':'Endgame · gebied 18–30';
export const winMaterials=(stage:number)=>stage<8?{nectar:15,parts:3}:stage<18?{nectar:30,parts:5}:{nectar:50,parts:8};
export function expeditionMaterials(stage:number,hours:number){const base=stage<8?{nectar:8,parts:2}:stage<18?{nectar:16,parts:4}:{nectar:25,parts:6};return {nectar:base.nectar*(hours===8?3:1),parts:base.parts*(hours===8?3:1)};}
export const gearUnlockStage=(grade:number)=>grade===1?5:grade===2?15:31;
export const ROLE_GUIDE={
 burst:{use:'Ruimt verzwakte vijanden op.',combo:'Doorbraak + Honinghart; lok eerst schilden uit met Prik.'},
 guardian:{use:'Vangt zware klappen op en koopt tijd.',combo:'Verschansen + Bladschild; wissel in tegen een geladen vijand.'},
 venom:{use:'Breekt taaie teams met gif door hun pantser heen.',combo:'Gifbeet + Gifdoorn; pas op voor Zuiveren.'},
 healer:{use:'Houdt zichzelf gezond en verwijdert gif.',combo:'Herstel + Zuiveren + Honinghart; kwetsbaar voor zware aanvallen.'},
 tempo:{use:'Laadt snel vaardigheden en zet schilden onder druk.',combo:'Prik + Doorbraak + Windveer; minder leven, dus plan je wissel.'},
 breaker:{use:'Breekt pantser voordat de zware aanval komt.',combo:'Pantserbreker + Doorbraak; profiteert van gebroken pantser.'},
} as const;
