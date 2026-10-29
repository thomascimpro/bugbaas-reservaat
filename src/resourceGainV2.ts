import type {PlayerV2} from '../game/typesV2';
import {BAITS,NETS} from '../game/fieldV2';
import {HELD} from '../game/goV2';
import {species} from '../game/catalogV2';
import {candyFamily,DEX_SPECIES,evolutionLine} from '../game/dexV2';
/** Nectar is keyed by family; some families (spider, scorpion, snail…) are not species ids themselves. */
/** First stage of the family's line: the bug drawn on its nectar drop. */
export function familyBase(family:string){const member=DEX_SPECIES.find(s=>candyFamily(s.id)===family)?.id;return member?evolutionLine(member)[0]:family;}
export function familyName(family:string){try{return species(familyBase(family)).name;}catch{return family;}}
/** Every nectar family once, sorted: the index spreads colours with the golden angle so neighbours never look alike. */
export const NECTAR_FAMILIES=[...new Set(DEX_SPECIES.map(s=>candyFamily(s.id)))].sort();
const hsl=(h:number,s:number,l:number)=>{s/=100;l/=100;const k=(n:number)=>(n+h/30)%12,a=s*Math.min(l,1-l),f=(n:number)=>Math.round(255*(l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1)))).toString(16).padStart(2,'0');return '#'+f(0)+f(8)+f(4);};
/** Deterministic two-tone nectar colours per family (bright, Fortnite-like); unknown ids hash to a stable hue. */
export function familyColors(family:string):{main:string;stripe:string;dark:string}{const i=NECTAR_FAMILIES.indexOf(family),n=i>=0?i:Array.from(family).reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7),h=(n*137.508)%360,h2=(h+120+(n*47)%100)%360;return {main:hsl(h,88,55),stripe:hsl(h2,92,68),dark:hsl(h,70,24)};}
export type RewardRow={id:string;name:string;count:number;art:'field'|'glyph'|'bug'|'cocoon'|'candy'|'xl';icon:string};
/** Display only positive changes in accepted server state, never client-predicted rewards. */
export function rewardChanges(before:PlayerV2|null,after:PlayerV2):RewardRow[]{
 if(!before||before.uid!==after.uid||!before.onboarded||!after.go||!before.go)return [];
 const rows:RewardRow[]=[],add=(id:string,name:string,count:number,art:RewardRow['art'],icon:string)=>{if(Number.isFinite(count)&&count>0)rows.push({id,name,count,art,icon});},a=after.go,b=before.go;
 for(const [id,item] of Object.entries({...NETS,...BAITS}))add('field:'+id,item.name,(after.field?.inventory[id as keyof NonNullable<PlayerV2['field']>['inventory']]??0)-(before.field?.inventory[id as keyof NonNullable<PlayerV2['field']>['inventory']]??0),'field',id);
 add('dust','✨ Stof',a.dust-b.dust,'glyph','nectar');add('coins','Coins',(a.gyms?.coins??0)-(b.gyms?.coins??0),'glyph','coin');add('xp','XP',(a.trainer?.xp??0)-(b.trainer?.xp??0),'glyph','star');
 for(const [id,count] of Object.entries(a.candy))add('candy:'+id,familyName(id)+'-nectar',count-(b.candy[id]??0),'candy',id);
 for(const [id,count] of Object.entries(a.xl))add('xl:'+id,familyName(id)+' XL-nectar',count-(b.xl[id]??0),'xl',id);
 for(const [id,item] of Object.entries(HELD))add('held:'+id,item.name,a.items[id as keyof typeof HELD]-(b.items[id as keyof typeof HELD]??0),'glyph',item.icon);
 add('fastTM','Snelle TM',a.fastTMs-b.fastTMs,'glyph','attack');add('chargedTM','Opgeladen TM',a.chargedTMs-b.chargedTMs,'glyph','attack');
 for(const km of [2,5])add('cocoon:'+km,km+' km cocon',a.cocoons?.items.filter(c=>c.km===km&&!b.cocoons?.items.some(old=>old.id===c.id)).length??0,'cocoon','cocoon');
 add('incubator','Broedmachine',a.cocoons?.incubators?.filter(i=>!b.cocoons?.incubators?.some(old=>old.id===i.id)).length??0,'cocoon','cocoon');
 add('cards','Cadeaukaart',after.cards.filter(c=>!before.cards.some(old=>old.id===c.id)).length,'glyph','gift');
 return rows;
}
