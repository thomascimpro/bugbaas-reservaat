import {effectiveness} from './goBattleV2';
import {CHARGED,FAST,movePool,stats} from './goV2';
import type {Specimen} from './typesV2';
import type {Bait,Net} from './fieldV2';

/** How well one owned bug matches up against an opponent species, from its actual moves and types. */
export function matchup(bug:Specimen,opponent:string){
 const enemy=movePool(opponent).types,own=movePool(bug.species).types,moves=[FAST[bug.go!.fast],...bug.go!.charged.map(m=>CHARGED[m])].filter(Boolean);
 const offense=Math.max(1,...moves.map(m=>effectiveness(m.type,enemy))),defense=Math.max(...enemy.map(t=>effectiveness(t,own)));
 return {offense,defense,recommended:offense>1&&defense<=1,strong:offense>1};
}
/** Best counters first: type advantage, then not being weak to the opponent, then CP; one bug per species (team rule). */
export function recommendTeam(bugs:readonly Specimen[],opponent:string,size=3){
 return bugs.filter(b=>b.go).map(b=>({b,m:matchup(b,opponent),cp:stats(b).cp})).sort((x,y)=>Number(y.m.recommended)-Number(x.m.recommended)||y.m.offense-x.m.offense||x.m.defense-y.m.defense||y.cp-x.cp).filter((x,i,all)=>all.findIndex(y=>y.b.species===x.b.species)===i).slice(0,size).map(x=>x.b.id);
}

/** Catch advice: save good nets for rare or hard bugs, use nectar bait on easy ones. Only suggests what is in the bag. */
export function recommendNet(inventory:Partial<Record<string,number>>,tier:number,chance:number):Net{
 const has=(n:Net)=>(inventory[n]??0)>0;
 if(tier>=5&&has('royal'))return 'royal';
 if(tier>=4||chance<.3)return has('silk')?'silk':has('blue')?'blue':'basic';
 return 'basic';
}
export function recommendBait(inventory:Partial<Record<string,number>>,tier:number,chance:number):Bait|null{
 const first=(...ids:Bait[])=>ids.find(id=>(inventory[id]??0)>0)??null;
 if(tier>=4||chance<.3)return first('gold','silver','pollen');
 if(tier===3)return first('pollen','silver');
 return first('fruit');
}
