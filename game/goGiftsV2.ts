import {HABITATS,species} from './catalogV2';
import {grantField} from './fieldV2';
import {dayV2} from './safariV2';
import {checkV2 as check} from './shopV2';
import type {FriendPair,PlayerV2,Side,Specimen} from './typesV2';

export const GO_GIFT_REWARD={dust:100,items:{basic:5,pollen:1}} as const;
export const FRIEND_MILESTONES=[1,7,30,90] as const;
const FRIEND_NAMES=['Nieuwe vrienden','Goede vrienden','Grote vrienden','Beste vrienden','Boezemvrienden'];
export function friendshipProgress(points:number){
 const level=FRIEND_MILESTONES.filter(n=>points>=n).length,next=FRIEND_MILESTONES[level]??null,base=level?FRIEND_MILESTONES[level-1]:0;
 return {level,name:FRIEND_NAMES[level],next,remaining:next===null?0:Math.max(0,next-points),progress:next===null?1:Math.max(0,Math.min(1,(points-base)/(next-base)))};
}
export function awardGoCatchCard(p:PlayerV2,bug:Specimen,id:string,now:number){
 const today=dayV2(now);
 if(!bug.go||bug.source!=='walking'||bug.obtainedAt!==now||p.field?.daily.day!==today||p.field.daily.catches!==1||p.giftDay===today)return false;
 // A full bag consumes this day's first-catch opportunity too.
 p.giftDay=today;if(p.cards.length>=10)return false;
 p.cards.push({id:'card-'+id,habitat:species(bug.species).habitat});return true;
}
function friendSide(p:PlayerV2,pair:FriendPair|undefined):Side{
 check(pair&&!pair.removed&&pair.accepted&&pair.users.includes(p.uid)&&pair.users[0]!==pair.users[1],'Deze vriendschap is niet beschikbaar.',403);
 return pair.users.indexOf(p.uid) as Side;
}
export function sendGoGift(p:PlayerV2,pair:FriendPair|undefined,cardId:unknown,id:string,now:number){
 const side=friendSide(p,pair),card=p.cards.find(c=>c.id===cardId);check(card,'Kies een kaart uit je tas.');
 check(Number.isInteger(card.habitat)&&card.habitat>=0&&card.habitat<HABITATS.length,'Deze kaart is niet beschikbaar.');
 const sent=pair!.gifts[side];check(!sent||sent.opened,'Er staat al een ongeopend cadeau klaar.');check(sent?.sentDay!==dayV2(now),'Vandaag al een cadeau gestuurd.');
 pair!.gifts[side]={id,habitat:card.habitat,from:p.uid,sentDay:dayV2(now),opened:false};p.cards=p.cards.filter(c=>c.id!==card.id);
}
export function openGoGift(p:PlayerV2,pair:FriendPair|undefined,now:number){
 const side=friendSide(p,pair),gift=pair!.gifts[(1-side) as Side];
 check(gift&&!gift.opened&&gift.from===pair!.users[1-side]&&gift.from!==p.uid,'Geen ongeopend cadeau.');
 check(p.go,'Open eerst de kaart.');check(Number.isInteger(gift.habitat)&&gift.habitat>=0&&gift.habitat<HABITATS.length,'Deze kaart is niet beschikbaar.');
 gift.opened=true;if(!p.album.includes(gift.habitat))p.album.push(gift.habitat);
 grantField(p,GO_GIFT_REWARD.items,now);p.go.dust+=GO_GIFT_REWARD.dust;
 if(pair!.lastDay!==dayV2(now)){pair!.points++;pair!.lastDay=dayV2(now);}
}
