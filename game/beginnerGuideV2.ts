import type {PlayerV2} from './typesV2';

/** Where a beginner step sends the player. */
export type BeginnerAction='nearby'|'posts'|'team'|'battle'|'bugdex';
export type BeginnerStep={id:string;title:string;hint:string;icon:'leaf'|'team'|'compass'|'swords'|'book';action:BeginnerAction;done:boolean;markOnAction?:boolean};
/** Menu items a new player meets later, so the first minutes stay simple (Pokémon GO also opens gyms at level 5). */
export const UNLOCK_LEVEL={Shop:3,Cocons:3,Strijd:5,Gyms:5,Vrienden:5} as const;
export function unlockLevel(label:string){return (UNLOCK_LEVEL as Record<string,number>)[label]??1;}

/** Teach one thing at a time; progress comes from confirmed server state, or from the player tapping the step for "look here" steps. */
export function beginnerSteps(p:PlayerV2,level:number,localDone:readonly string[]):BeginnerStep[]{
 const caught=p.specimens.filter(s=>s.source==='walking'),kinds=new Set(caught.map(s=>s.species)).size,spun=Object.keys(p.go?.sites?.visits??{}).length>0;
 return [
  {id:'first-catch',title:'Vang je eerste bug',hint:'Tik op een bug bij jou in de buurt.',icon:'leaf',action:'nearby',done:caught.length>0},
  {id:'three-kinds',title:'Vang 3 verschillende bugs',hint:kinds+' van 3 soorten gevangen.',icon:'leaf',action:'nearby',done:kinds>=3},
  {id:'spin-post',title:'Draai aan een post',hint:'Loop naar een post en draai voor netten.',icon:'compass',action:'posts',done:spun},
  {id:'see-bugs',title:'Bekijk je bugs',hint:'Kies je sterkste bug en maak hem sterker.',icon:'team',action:'team',done:localDone.includes('see-bugs'),markOnAction:true},
  {id:'bugdex',title:'Open je Bugdex',hint:'Zie welke bugs je nog kunt vinden.',icon:'book',action:'bugdex',done:localDone.includes('bugdex'),markOnAction:true},
  {id:'first-battle',title:level>=5?'Speel je eerste gevecht':'Haal level 5 voor gevechten',hint:level>=5?'Tik op Strijd en start een duel.':'Je bent nu level '+level+'. Vang bugs om te groeien.',icon:'swords',action:level>=5?'battle':'nearby',done:localDone.includes('first-battle'),markOnAction:level>=5},
 ];
}
