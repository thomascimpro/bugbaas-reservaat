import {WALK_WEIGHTS} from './walkingV2';
import {evolutionStage} from './dexV2';

/** One visible rarity scale for map, catch, collection, Bugdex and cocoons (1 common … 5 very rare). */
export type RarityTier=1|2|3|4|5;
export const RARITY_TIERS:Record<RarityTier,{name:string;color:string}>={
 // Fortnite-style colours kids already know: grey, green, blue, purple, gold.
 1:{name:'Gewoon',color:'#A7AEB4'},2:{name:'Ongewoon',color:'#5CC23A'},3:{name:'Zeldzaam',color:'#3A9BEF'},4:{name:'Episch',color:'#B45BEB'},5:{name:'Legendarisch',color:'#F2A33A'},
};
/** From the wild spawn weight (what you actually meet on the map); evolved-only forms use their stage. */
export function bugRarity(id:string):RarityTier{
 const w=WALK_WEIGHTS[id];
 if(w===undefined){const stage=evolutionStage(id);return stage>=3?4:stage===2?3:2;}
 return w>=8?1:w>=2?2:w>=.5?3:w>=.1?4:5;
}
/** Strength (IV appraisal 0-4) in the same five colours: Zwak grey … Perfect gold. */
export const GRADE_COLORS=['#A7AEB4','#5CC23A','#3A9BEF','#B45BEB','#F2A33A'] as const;
