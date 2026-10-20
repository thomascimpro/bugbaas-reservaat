import { ITEMS, SPECIES, item, rng, species } from './catalogV2';
import { unit } from './battleV2';
import type { Shop, Unit } from './typesV2';
import { GameError } from './types';
export const tierFor=(round:number)=>Math.min(6,Math.floor((round+1)/2));
export function checkV2(ok:unknown,message:string,status=400):asserts ok{if(!ok)throw new GameError(message,status);}
export function shopTriggers(shop:Shop,actor:Unit,when:string,seed:string){const a=species(actor.species).ability;if(a.trigger!==when)return;actor.used??={};if((actor.used[when]??0)>=(a.limit??99))return;actor.used[when]=(actor.used[when]??0)+1;
 if(a.effect==='gold'){shop.gold+=(a.amount??1)*actor.level;return;}if(a.target==='shop'){shop.bonusAttack+=(a.attack??0)*actor.level;shop.bonusHealth+=(a.health??0)*actor.level;for(const o of shop.offers)if(o.species){o.attack=(o.attack??species(o.species).attack)+(a.attack??0)*actor.level;o.health=(o.health??species(o.species).health)+(a.health??0)*actor.level;}return;}
 const pos=shop.team.indexOf(actor),friends=shop.team.filter(u=>u.id!==actor.id);let targets=a.target==='self'?[actor]:a.target==='ahead'?shop.team.slice(pos+1,pos+2):a.target==='behind'?shop.team.slice(Math.max(0,pos-1),pos):friends;
 if(a.target==='randomFriend'){const random=rng(seed);targets=[...friends].sort((a,b)=>a.id.localeCompare(b.id));const result:Unit[]=[];while(targets.length&&result.length<(a.count??1))result.push(targets.splice(Math.floor(random()*targets.length),1)[0]);targets=result;}
 for(const u of targets){u.attack=Math.min(50,u.attack+(a.attack??0)*actor.level);u.health=Math.min(50,u.health+(a.health??0)*actor.level);}
}
export function refill(shop:Shop,round:number,seed:string){const random=rng(seed),tier=tierFor(round),pool=SPECIES.filter(s=>s.tier<=tier),foods=ITEMS.filter(i=>i.tier<=tier);const frozen=shop.offers.filter(o=>o.frozen);shop.offers=[...frozen];const bugCount=round<3?3:round<5?4:5;let n=0;while(shop.offers.filter(o=>o.species).length<bugCount){const s=pool[Math.floor(random()*pool.length)];shop.offers.push({id:`${seed}-b${n++}`,species:s.id,frozen:false,attack:s.attack+shop.bonusAttack,health:s.health+shop.bonusHealth});}n=0;while(shop.offers.filter(o=>o.item).length<2){const i=foods[Math.floor(random()*foods.length)];shop.offers.push({id:`${seed}-i${n++}`,item:i.id,frozen:false});}}
export function freshShop(round:number,seed:string):Shop{const shop:Shop={gold:10,offers:[],team:[],ready:false,missed:0,rolls:0,bonusAttack:0,bonusHealth:0};refill(shop,round,seed);return shop;}
export function shopAction(shop:Shop,round:number,action:string,data:Record<string,unknown>,seed:string){checkV2(!shop.ready,'Je team staat al klaar.');
 if(action==='roll'){checkV2(shop.gold>=1,'Niet genoeg munten.');shop.gold--;shop.rolls++;for(const u of shop.team)shopTriggers(shop,u,'roll',seed+u.id);refill(shop,round,seed);return;}
 if(action==='freeze'){const o=shop.offers.find(o=>o.id===data.offer);checkV2(o,'Dit aanbod is niet meer beschikbaar.');o.frozen=!o.frozen;return;}
 if(action==='reorder'){checkV2(Array.isArray(data.order)&&data.order.length===shop.team.length&&new Set(data.order).size===shop.team.length,'Ongeldige volgorde.');const order=data.order as string[];checkV2(order.every(id=>shop.team.some(u=>u.id===id)),'Dit team is niet van jou.');shop.team=order.map(id=>shop.team.find(u=>u.id===id)!);return;}
 if(action==='sell'){const i=shop.team.findIndex(u=>u.id===data.unit);checkV2(i>=0,'Kies een eigen bug.');const u=shop.team[i];shopTriggers(shop,u,'sell',seed);shop.gold+=u.level;shop.team.splice(i,1);return;}
 if(action==='merge'){const from=shop.team.find(u=>u.id===data.unit),to=shop.team.find(u=>u.id===data.target);checkV2(from&&to&&from.id!==to.id&&from.species===to.species&&to.level<3,'Combineer twee gelijke bugs.');shop.team=shop.team.filter(u=>u.id!==from.id);merge(shop,to,from,seed);return;}
 if(action==='buy'){const offer=shop.offers.find(o=>o.id===data.offer);checkV2(offer,'Dit aanbod is niet meer beschikbaar.');const price=offer.species?3:item(offer.item!)!.price;checkV2(shop.gold>=price,'Niet genoeg munten.');const target=shop.team.find(u=>u.id===data.target);
  if(offer.species){checkV2(shop.team.length<5||(target?.species===offer.species&&target.level<3),'Je team is vol. Combineer of verkoop een bug.');const u=unit(seed,offer.species);u.attack=offer.attack!;u.health=offer.health!;if(target?.species===u.species&&target.level<3)merge(shop,target,u,seed);else {shop.team.push(u);shopTriggers(shop,u,'buy',seed);}}
  else {checkV2(target,'Kies eerst een bug voor dit voorwerp.');const food=item(offer.item!)!;if(food.held)target.item=food.id;else {target.attack=Math.min(50,target.attack+(food.attack??0));target.health=Math.min(50,target.health+(food.health??0));shopTriggers(shop,target,'food',seed);}}
  shop.gold-=price;shop.offers=shop.offers.filter(o=>o.id!==offer.id);return;
 }throw new GameError('Onbekende winkelactie.');
}
function merge(shop:Shop,target:Unit,other:Unit,seed:string){const old=target.level;target.attack=Math.min(50,Math.max(target.attack,other.attack)+1);target.health=Math.min(50,Math.max(target.health,other.health)+1);target.xp=Math.min(5,target.xp+other.xp+1);target.level=target.xp>=5?3:target.xp>=2?2:1;if(target.level>old)shopTriggers(shop,target,'level',seed);}
export function finishShop(shop:Shop,seed:string){for(const u of [...shop.team])shopTriggers(shop,u,'end',seed+u.id);shop.ready=true;}
export function nextShop(shop:Shop,round:number,seed:string){shop.gold=10;shop.ready=false;shop.rolls=0;for(const u of shop.team)u.used={};refill(shop,round,seed);}
