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
export const BUDDY_KM=1000,BUDDY_DAILY={pet:3,feed:3,walkHearts:10} as const;
export type BuddyDay={day:string;pet:number;feed:number;walk:number;gift?:boolean};
type Holder={buddyDay?:BuddyDay};

export function buddyLevel(hearts:number){let i=0;for(let n=0;n<BUDDY_LEVELS.length;n++)if(hearts>=BUDDY_LEVELS[n].hearts)i=n;const next=BUDDY_LEVELS[i+1];return {level:i,...BUDDY_LEVELS[i],next:next?.hearts??null,progress:next?(hearts-BUDDY_LEVELS[i].hearts)/(next.hearts-BUDDY_LEVELS[i].hearts):1};}
export function buddyToday(p:PlayerV2,now:number):BuddyDay{const g=p.go! as typeof p.go&Holder,day=dayV2(now);if(g.buddyDay?.day!==day)g.buddyDay={day,pet:0,feed:0,walk:0};return g.buddyDay;}
const buddyOf=(p:PlayerV2)=>p.specimens.find(s=>s.id===p.buddy&&s.go) as Specimen|undefined;

/** Every walked km with your buddy: nectar (2 for Beste maatje), ✨ stof from Goed maatje, and a heart (max 10 per day). */
export function creditBuddyWalk(p:PlayerV2,now:number){
 const g=p.go!,b=buddyOf(p),walk=p.field?.walk;if(!b||!walk)return 0;const steps=Math.floor((walk.meters-g.buddyMeters)/BUDDY_KM);if(steps<=0)return 0;
 const lv=buddyLevel(b.hearts??0).level,key=family(b.species),today=buddyToday(p,now),hearts=Math.min(steps,BUDDY_DAILY.walkHearts-today.walk);
 g.candy[key]=(g.candy[key]??0)+steps*(lv>=4?2:1);g.dust+=steps*(lv>=3?100:lv>=1?50:0);g.buddyMeters+=steps*BUDDY_KM;if(hearts>0){b.hearts=(b.hearts??0)+hearts;today.walk+=hearts;}
 return steps;
}
/** Stationary play: pet (3×/day) or feed a forest raspberry (3×/day) for a heart; Geweldig maatje brings a daily gift on the first pet. */
export function playBuddy(p:PlayerV2,kind:unknown,now:number){
 check(kind==='pet'||kind==='feed','Kies aaien of voeren.');const b=buddyOf(p);check(b,'Kies eerst een buddy.');const today=buddyToday(p,now);
 if(kind==='pet'){check(today.pet<BUDDY_DAILY.pet,'Je buddy is vandaag al genoeg geaaid. Morgen weer!');today.pet++;}
 else{check(today.feed<BUDDY_DAILY.feed,'Je buddy heeft vandaag genoeg gegeten.');const bag=p.field?.inventory;check(bag&&bag.fruit>0,'Je hebt geen bosframboos.');bag.fruit--;today.feed++;}
 b.hearts=(b.hearts??0)+1;
 if(kind==='pet'&&!today.gift&&buddyLevel(b.hearts).level>=2){today.gift=true;grantField(p,{basic:5,pollen:1},now);return 'gift' as const;}
 return 'heart' as const;
}
