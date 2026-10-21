import type {PlayerV2} from './typesV2';

// Published numbers are explicit and append-only; model-map ordering cannot renumber a dex.
export const DEX_VERSION=1;
export const DEX_SPECIES=[
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
] as const;
export const dexNumber=(id:string)=>DEX_SPECIES.find(s=>s.id===id)?.number;
export function dexStatus(p:PlayerV2,id:string){const caught=!!p.go?.dex?.includes(id);return {seen:caught||!!p.go?.entries&&Object.hasOwn(p.go.entries,id),caught,shiny:caught&&p.shinies.includes(id)};}
export const EVOLUTIONS:Record<string,{to:string;candy:number}>={caterpillar:{to:'moth',candy:50},beetlegrub:{to:'hercules',candy:50}};
// Keep the published adults' currency keys so existing nectar and XL stay usable.
export function candyFamily(id:string){if(id==='beetlegrub')return 'hercules';return id==='moth'?'caterpillar':id;}
