import type {PlayerV2} from '../game/typesV2';
import {BAITS,NETS} from '../game/fieldV2';
import {HELD} from '../game/goV2';
import {species} from '../game/catalogV2';
import {candyFamily,DEX_SPECIES,evolutionLine} from '../game/dexV2';
/** Nectar is keyed by family; some families (spider, scorpion, snail…) are not species ids themselves. */
export function familyName(family:string){const member=DEX_SPECIES.find(s=>candyFamily(s.id)===family)?.id;try{return species(member?evolutionLine(member)[0]:family).name;}catch{return family;}}
export type RewardRow={id:string;name:string;count:number;art:'field'|'glyph'|'bug'|'cocoon';icon:string};
/** Display only positive changes in accepted server state, never client-predicted rewards. */
export function rewardChanges(before:PlayerV2|null,after:PlayerV2):RewardRow[]{
 if(!before||before.uid!==after.uid||!before.onboarded||!after.go||!before.go)return [];
 const rows:RewardRow[]=[],add=(id:string,name:string,count:number,art:RewardRow['art'],icon:string)=>{if(Number.isFinite(count)&&count>0)rows.push({id,name,count,art,icon});},a=after.go,b=before.go;
 for(const [id,item] of Object.entries({...NETS,...BAITS}))add('field:'+id,item.name,(after.field?.inventory[id as keyof NonNullable<PlayerV2['field']>['inventory']]??0)-(before.field?.inventory[id as keyof NonNullable<PlayerV2['field']>['inventory']]??0),'field',id);
 add('dust','Nectarstof',a.dust-b.dust,'glyph','nectar');add('coins','Coins',(a.gyms?.coins??0)-(b.gyms?.coins??0),'glyph','coin');add('xp','XP',(a.trainer?.xp??0)-(b.trainer?.xp??0),'glyph','star');
 for(const [id,count] of Object.entries(a.candy))add('candy:'+id,familyName(id)+' · soortnectar',count-(b.candy[id]??0),'glyph','nectar');
 for(const [id,count] of Object.entries(a.xl))add('xl:'+id,familyName(id)+' · XL-nectar',count-(b.xl[id]??0),'glyph','nectar');
 for(const [id,item] of Object.entries(HELD))add('held:'+id,item.name,a.items[id as keyof typeof HELD]-(b.items[id as keyof typeof HELD]??0),'glyph',item.icon);
 add('fastTM','Snelle TM',a.fastTMs-b.fastTMs,'glyph','attack');add('chargedTM','Opgeladen TM',a.chargedTMs-b.chargedTMs,'glyph','attack');
 for(const km of [2,5])add('cocoon:'+km,km+' km cocon',a.cocoons?.items.filter(c=>c.km===km&&!b.cocoons?.items.some(old=>old.id===c.id)).length??0,'cocoon','cocoon');
 add('incubator','Broedmachine',a.cocoons?.incubators?.filter(i=>!b.cocoons?.incubators?.some(old=>old.id===i.id)).length??0,'cocoon','cocoon');
 add('cards','Cadeaukaart',after.cards.filter(c=>!before.cards.some(old=>old.id===c.id)).length,'glyph','gift');
 return rows;
}
