// Oerbugs: legendary raid bosses (dex 151-153). Raid-only: never in the wild, lures, routes, cocoons or NPC pools.
// Each Oerbug is its own nectar family without an evolution line. Models: assets/3d/oerbugs/source.json.
export type LegendarySpecies={
 id:string;number:number;model:string;name:string;attack:number;health:number;tier:number;flying:boolean;
 types:readonly ['bug'|'flying'|'poison'|'grass'|'ground'|'rock'|'steel'|'dark'|'normal'|'fire'|'water',...('bug'|'flying'|'poison'|'grass'|'ground'|'rock'|'steel'|'dark'|'normal'|'fire'|'water')[]];
 fast:readonly string[];charged:readonly string[];palette:readonly [string,string,string];text:string;
};
export const LEGENDARY_SPECIES:readonly LegendarySpecies[]=[
 {id:'kristalkoning',number:151,model:'Kristalkoning',name:'Kristalkoning',attack:8,health:13,tier:7,flying:false,types:['rock','steel'],fast:['stone','metal','pebble'],charged:['crush','shell','rock','stream'],palette:['#3A1830','#D4568E','#FFE3B0'],text:'Oerbug: een eeuwenoude kever met een kroon van gloeiende kristallen. Alleen te vinden in een Oerzwerm.'},
 {id:'donderwiek',number:152,model:'Donderwiek',name:'Donderwiek',attack:11,health:10,tier:7,flying:true,types:['flying','dark'],fast:['gust','snap','wing'],charged:['dive','night','air','iron'],palette:['#2A1A0E','#E09A2E','#FFF2C0'],text:'Oerbug: een stormvlinder met bliksem op zijn vleugels. Alleen te vinden in een Oerzwerm.'},
 {id:'lavaklauw',number:153,model:'Lavaklauw',name:'Lavaklauw',attack:12,health:9,tier:7,flying:true,types:['fire','ground'],fast:['ember','mud','spark'],charged:['flare','earth','burst','seed'],palette:['#0F1B33','#2F6FE0','#BFF4FF'],text:'Oerbug: een bidsprinkhaan van lava met zeisen van obsidiaan. Alleen te vinden in een Oerzwerm.'},
];
export const LEGENDARY_BY_ID:Readonly<Record<string,LegendarySpecies>>=Object.fromEntries(LEGENDARY_SPECIES.map(s=>[s.id,s]));
export const isLegendary=(id:string)=>Object.hasOwn(LEGENDARY_BY_ID,id);
/** Base catch chance of an Oerbug before net, bait and throw bonuses (wild bugs: 0.2-0.78). */
export const LEGENDARY_CATCH_CHANCE=.15;
