import type {PlayerV2} from './typesV2';
import type {FieldItem} from './fieldV2';
import {ensureGyms} from './gymsV2';
import {addCocoonIncubator} from './goCocoonsV2';
import {checkV2 as check} from './shopV2';

export const COIN_OFFERS=[
 {id:'field-nets',name:'Veldnetten',item:'basic',count:20,coins:80},
 {id:'forest-nets',name:'Bosnetten',item:'blue',count:20,coins:120},
 {id:'silk-nets',name:'Zijdenetten',item:'silk',count:10,coins:150},
 {id:'pollen',name:'Bloesempollen',item:'pollen',count:10,coins:60},
 {id:'fruit',name:'Dennenfruit',item:'fruit',count:10,coins:60},
 {id:'dew',name:'Dauwdruppels',item:'dew',count:10,coins:60},
 {id:'fast-tm',name:'Snelle TM',item:'fastTM',count:1,coins:100},
 {id:'charged-tm',name:'Opgeladen TM',item:'chargedTM',count:1,coins:100},
 {id:'incubator',name:'Broedmachine',item:'incubator',count:1,coins:150},
] as const;
export function buyCoinOffer(p:PlayerV2,id:unknown,now:number){
 const offer=COIN_OFFERS.find(o=>o.id===id);check(offer,'Kies een bestaand shopartikel.');const progress=ensureGyms(p,now);check(progress.coins>=offer.coins,'Niet genoeg coins. Verdedig een gym om coins te verdienen.');
 if(offer.item==='incubator')addCocoonIncubator(p,3);else if(offer.item==='fastTM')p.go!.fastTMs+=offer.count;else if(offer.item==='chargedTM')p.go!.chargedTMs+=offer.count;else{const item=offer.item as FieldItem;check(p.field!.inventory[item]+offer.count<=99999,'Je tas zit vol voor dit voorwerp.');p.field!.inventory[item]+=offer.count;}
 progress.coins-=offer.coins;progress.lastPurchase={offer:offer.id,at:now};
}
