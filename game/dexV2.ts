import type {PlayerV2} from './typesV2';
import {FIELD_FAMILY_SPECIES} from './fieldFamiliesV2';
import {EXPANDED_SPECIES,EXPANDED_BY_ID,ULTIMATE_BASES} from './dexExpansionV2';
import {EVOLUTION_ASSETS} from './evolutionAssetsV2';

// Published numbers are explicit and append-only; model-map ordering cannot renumber a dex.
export const DEX_VERSION=1;
export const BASE_DEX_SPECIES=[
 {number:1,id:'beetle'},
 {number:2,id:'ant'},
 {number:3,id:'aphid'},
 {number:4,id:'weevil'},
 {number:5,id:'moth'},
 {number:6,id:'earwig'},
 {number:7,id:'grasshopper'},
 {number:8,id:'lacewing'},
 {number:9,id:'dungbeetle'},
 {number:10,id:'mantis'},
 {number:11,id:'butterfly'},
 {number:12,id:'divingbeetle'},
 {number:13,id:'waterstrider'},
 {number:14,id:'hoverfly'},
 {number:15,id:'leafhopper'},
 {number:16,id:'cricket'},
 {number:17,id:'stick'},
 {number:18,id:'leaf'},
 {number:19,id:'silverfish'},
 {number:20,id:'hercules'},
 {number:21,id:'caterpillar'},
 {number:22,id:'antlion'},
 {number:23,id:'cockroach'},
 {number:24,id:'cranefly'},
 {number:25,id:'flea'},
 {number:26,id:'giantwaterbug'},
 {number:27,id:'mayfly'},
 {number:28,id:'termite'},
 {number:29,id:'tigerbeetle'},
 {number:30,id:'tortoisebeetle'},
 {number:31,id:'beetlegrub'},
 {number:32,id:'bee'},
] as const;
// Published form IDs also bind existing owned stats and currency; keep them stable.
export const ELITE_FORMS:Record<string,string>=Object.fromEntries(BASE_DEX_SPECIES.filter(s=>!['caterpillar','beetlegrub'].includes(s.id)).map(s=>[s.id+'_elite',s.id]));
export const EVOLUTION_APPEARANCES:Readonly<Record<string,{model:string;name:string}>>={
 ...EVOLUTION_ASSETS,
 ant_elite:{model:'GardenAntAdult',name:'Zwarte tuinmier'},
 mantis_elite:{model:'EmeraldMantisAdult',name:'Grote bidsprinkhaan'},
 butterfly_elite:{model:'MonarchButterflyAdult',name:'Monarchvlinder'},
};
export const usesSharedEvolutionModel=(id:string)=>!!ELITE_FORMS[id]&&!EVOLUTION_APPEARANCES[id];
export const baseSpeciesId=(id:string)=>ELITE_FORMS[id]??ULTIMATE_BASES[id]??id;
export const DEX_SPECIES=[...BASE_DEX_SPECIES,...Object.keys(ELITE_FORMS).map((id,i)=>({number:33+i,id})),...FIELD_FAMILY_SPECIES.map((s,i)=>({number:63+i,id:s.id})),...EXPANDED_SPECIES.map(({number,id})=>({number,id}))];
export const dexNumber=(id:string)=>DEX_SPECIES.find(s=>s.id===id)?.number;
export function dexStatus(p:PlayerV2,id:string){const caught=!!p.go?.dex?.includes(id);return {seen:caught||!!p.go?.entries&&Object.hasOwn(p.go.entries,id),caught,shiny:caught&&p.shinies.includes(id)};}
export const EVOLUTIONS:Record<string,{to:string;candy:number}>={caterpillar:{to:'moth',candy:50},beetlegrub:{to:'hercules',candy:50},...Object.fromEntries(Object.entries(ELITE_FORMS).map(([to,from])=>[from,{to,candy:100}])),...Object.fromEntries(FIELD_FAMILY_SPECIES.filter(s=>s.to).map(s=>[s.id,{to:s.to!,candy:s.candy}])),...Object.fromEntries(EXPANDED_SPECIES.filter(s=>s.evolveFrom).map(s=>[s.evolveFrom!,{to:s.id,candy:s.evolveCost!}]))};
export function evolutionLine(id:string){const line=[id];let previous=Object.keys(EVOLUTIONS).find(key=>EVOLUTIONS[key].to===id);while(previous){line.unshift(previous);previous=Object.keys(EVOLUTIONS).find(key=>EVOLUTIONS[key].to===previous);}let next=EVOLUTIONS[id]?.to;while(next){line.push(next);next=EVOLUTIONS[next]?.to;}return line;}
// Keep the published adults' currency keys so existing nectar and XL stay usable.
export function candyFamily(id:string){const added=EXPANDED_BY_ID[id];if(added)return added.family;id=baseSpeciesId(id);const family=FIELD_FAMILY_SPECIES.find(s=>s.id===id);if(family)return family.family;if(id==='beetlegrub')return 'hercules';return id==='moth'?'caterpillar':id;}
