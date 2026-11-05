import {dayV2} from './safariV2';
import {family} from './goV2';
import {grantField} from './fieldV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2,Specimen} from './typesV2';

/** Buddy friendship like PoGO: hearts from walking, petting and snacks; each level adds a perk. */
export const BUDDY_LEVELS=[
 {hearts:0,name:'Nieuw maatje',emoji:'🤝',perk:'1 nectar per km'},
 {hearts:10,name:'Goed maatje',emoji:'💚',perk:'+50 ✨ stof per km'},
 {hearts:30,name:'Geweldig maatje',emoji:'💙',perk:'Elke dag een cadeautje bij het aaien'},
 {hearts:70,name:'Super maatje',emoji:'💜',perk:'+100 ✨ stof per km'},
 {hearts:150,name:'Beste maatje',emoji:'👑',perk:'2 nectar per km'},
] as const;
export const BUDDY_KM=1000,BUDDY_FEED_MS=3*60*60*1000,BUDDY_DAILY={pet:1,feed:3,walkHearts:10,play:1} as const;
export type BuddyDay={day:string;pet:number;feed:number;walk:number;play?:number;lastFeedAt?:number;gift?:boolean};
type Holder={buddyDay?:BuddyDay};

export function buddyLevel(hearts:number){let i=0;for(let n=0;n<BUDDY_LEVELS.length;n++)if(hearts>=BUDDY_LEVELS[n].hearts)i=n;const next=BUDDY_LEVELS[i+1];return {level:i,...BUDDY_LEVELS[i],next:next?.hearts??null,progress:next?(hearts-BUDDY_LEVELS[i].hearts)/(next.hearts-BUDDY_LEVELS[i].hearts):1};}
export function buddyToday(p:PlayerV2,now:number):BuddyDay{const g=p.go! as typeof p.go&Holder,day=dayV2(now);if(g.buddyDay?.day!==day)g.buddyDay={day,pet:0,feed:0,walk:0,play:0,...(g.buddyDay?.lastFeedAt!==undefined?{lastFeedAt:g.buddyDay.lastFeedAt}:{})};return g.buddyDay;}
/** Pure UI snapshot; rendering must never reset the player's counters. */
export function buddyActivities(p:PlayerV2,now:number){const saved=(p.go as Holder|undefined)?.buddyDay,day=saved?.day===dayV2(now)?saved:undefined;return {pet:day?.pet??0,feed:day?.feed??0,walk:day?.walk??0,play:day?.play??0,feedWaitMs:Math.max(0,(saved?.lastFeedAt??-Infinity)+BUDDY_FEED_MS-now)};}
const buddyOf=(p:PlayerV2)=>p.specimens.find(s=>s.id===p.buddy&&s.go) as Specimen|undefined;

/** Every walked km with your buddy: nectar (2 for Beste maatje), ✨ stof from Goed maatje, and a heart (max 10 per day). */
export function creditBuddyWalk(p:PlayerV2,now:number){
 const g=p.go!,b=buddyOf(p),walk=p.field?.walk;if(!b||!walk)return 0;const steps=Math.floor((walk.meters-g.buddyMeters)/BUDDY_KM);if(steps<=0)return 0;
 const lv=buddyLevel(b.hearts??0).level,key=family(b.species),today=buddyToday(p,now),hearts=Math.min(steps,BUDDY_DAILY.walkHearts-today.walk);
 g.candy[key]=(g.candy[key]??0)+steps*(lv>=4?2:1);g.dust+=steps*(lv>=3?100:lv>=1?50:0);g.buddyMeters+=steps*BUDDY_KM;if(hearts>0){b.hearts=(b.hearts??0)+hearts;today.walk+=hearts;}
 return steps;
}
/** One pet heart/day; food costs a real berry and has a server-enforced hunger interval. */
export function playBuddy(p:PlayerV2,kind:unknown,now:number){
 check(kind==='pet'||kind==='feed','Kies aaien of voeren.');const b=buddyOf(p);check(b,'Kies eerst een buddy.');const today=buddyToday(p,now);
 if(kind==='pet'){check(today.pet<BUDDY_DAILY.pet,'Je buddy is vandaag al genoeg geaaid. Morgen weer!');today.pet++;}
 else{check(today.feed<BUDDY_DAILY.feed,'Je buddy heeft vandaag genoeg gegeten.');check(today.lastFeedAt===undefined||now-today.lastFeedAt>=BUDDY_FEED_MS,'Je buddy heeft nog geen honger.');const bag=p.field?.inventory;check(bag&&bag.fruit>0,'Je hebt geen bosframboos.');bag.fruit--;today.feed++;today.lastFeedAt=now;}
 b.hearts=(b.hearts??0)+1;
 if(kind==='pet'&&!today.gift&&buddyLevel(b.hearts).level>=2){today.gift=true;grantField(p,{basic:5,pollen:1},now);return 'gift' as const;}
 return 'heart' as const;
}
/** Called only after a qualified game or completed battle, using its frozen squad. */
export function creditBuddyPlay(p:PlayerV2,ids:readonly string[],now:number){const b=buddyOf(p);if(!b||!ids.includes(b.id))return false;const today=buddyToday(p,now);if((today.play??0)>=BUDDY_DAILY.play)return false;today.play=(today.play??0)+1;b.hearts=(b.hearts??0)+1;return true;}
