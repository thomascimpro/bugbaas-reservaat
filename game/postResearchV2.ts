import {rng} from './catalogV2';
import {grantField} from './fieldV2';
import {grantXP} from './trainerV2';
import {stampResearch} from './dailyResearchV2';
import {checkV2 as check} from './shopV2';
import type {PlayerV2} from './typesV2';
import type {FieldItem} from './fieldV2';

type Metric='catch'|'skill'|'perfect'|'curve'|'walk'|'posts';
type Template={name:string;metric:Metric;goal:number;icon:'leaf'|'star'|'burst'|'compass';dust:number;xp:number;items:Partial<Record<FieldItem,number>>};
export const POST_RESEARCH:readonly Template[]=[
 {name:'Vang 3 bugs',metric:'catch',goal:3,icon:'leaf',dust:150,xp:200,items:{blue:3}},
 {name:'Vang 5 bugs',metric:'catch',goal:5,icon:'leaf',dust:250,xp:300,items:{silk:2}},
 {name:'Maak een mooie zwaai',metric:'skill',goal:1,icon:'star',dust:150,xp:200,items:{pollen:2}},
 {name:'Maak een perfecte zwaai',metric:'perfect',goal:1,icon:'star',dust:250,xp:300,items:{silver:1}},
 {name:'Raak met 2 boogworpen',metric:'curve',goal:2,icon:'burst',dust:250,xp:300,items:{gold:1}},
 {name:'Leg 500 m af',metric:'walk',goal:500,icon:'compass',dust:200,xp:200,items:{blue:3}},
 {name:'Bezoek 2 verschillende posten',metric:'posts',goal:2,icon:'compass',dust:150,xp:200,items:{fruit:2}},
];
export type PostTask={id:string;post:string;template:number;at:number;baseline:number};
export type PostResearch={day:string;issued:string[];tasks:PostTask[]};
export function ensurePostResearch(p:PlayerV2){const day=p.field!.daily.day;if(p.go!.research?.day!==day)p.go!.research={day,issued:[],tasks:[]};return p.go!.research!;}
function metric(p:PlayerV2,kind:Metric,at=0){const f=p.field!;return kind==='catch'?f.total.catches:kind==='skill'?f.daily.skilled:kind==='perfect'?f.total.perfect:kind==='curve'?f.total.curved:kind==='walk'?f.walk?.meters??0:Object.values(p.go!.sites?.visits??{}).filter(t=>t>=at).length;}
export function postTaskProgress(p:PlayerV2,task:PostTask){const t=POST_RESEARCH[task.template];return t?Math.min(t.goal,Math.max(0,metric(p,t.metric,task.at)-task.baseline)):0;}
export function awardPostResearch(p:PlayerV2,post:string,now:number){
 const g=ensurePostResearch(p);if(g.tasks.length>=3||g.issued.includes(post))return null;
 const template=Math.floor(rng('post-research:'+g.day+':'+post)()*POST_RESEARCH.length),t=POST_RESEARCH[template],task:PostTask={id:g.day+':'+post,post,template,at:now+1,baseline:t.metric==='posts'?0:metric(p,t.metric)};
 g.issued.push(post);g.tasks.push(task);return task;
}
export function finishPostResearch(p:PlayerV2,id:unknown,discard:unknown,now:number){
 const g=ensurePostResearch(p),task=g.tasks.find(t=>t.id===id);check(task&&typeof discard==='boolean','Kies een onderzoek.');
 if(!discard){const t=POST_RESEARCH[task.template];check(postTaskProgress(p,task)>=t.goal,'Dit onderzoek is nog niet klaar.');grantField(p,t.items,now);p.go!.dust+=t.dust;grantXP(p,t.xp);stampResearch(p);}
 g.tasks=g.tasks.filter(t=>t.id!==task.id);
}
