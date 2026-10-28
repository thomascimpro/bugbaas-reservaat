import {WALK_WEIGHTS} from './walkingV2';
import {evolutionStage} from './dexV2';

/** One visible rarity scale for map, catch, collection, Bugdex and cocoons (1 common … 5 very rare). */
export type RarityTier=1|2|3|4|5;
export const RARITY_TIERS:Record<RarityTier,{name:string;color:string}>={
 1:{name:'Gewoon',color:'#B7CAB6'},2:{name:'Ongewoon',color:'#A5CE87'},3:{name:'Zeldzaam',color:'#7FC4E8'},4:{name:'Erg zeldzaam',color:'#C9A2F2'},5:{name:'Zeer zeldzaam',color:'#F2CF6E'},
};
/** From the wild spawn weight (what you actually meet on the map); evolved-only forms use their stage. */
export function bugRarity(id:string):RarityTier{
 const w=WALK_WEIGHTS[id];
 if(w===undefined){const stage=evolutionStage(id);return stage>=3?4:stage===2?3:2;}
 return w>=8?1:w>=2?2:w>=.5?3:w>=.1?4:5;
}
