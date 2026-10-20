import type {PlayerV2} from './typesV2';
import {checkV2 as check} from './shopV2';
import {ensureTrainer,grantXP} from './trainerV2';
export const GO_DAILY=[
 {id:'catch',name:'Vang 3 bugs',goal:3,icon:'leaf',dust:100,xp:300,items:{blue:3,pollen:1}},
 {id:'walk',name:'Loop 500 m',goal:500,icon:'compass',dust:150,xp:300,items:{basic:5}},
 {id:'skill',name:'Maak een mooie zwaai',goal:1,icon:'star',dust:200,xp:300,items:{silk:1,fruit:1}},
] as const;
export const GO_BREAKTHROUGH={dust:500,nets:10,lures:2,fastTMs:1} as const;
export function dailyProgress(p:PlayerV2,id:string){return id==='catch'?p.field!.daily.catches:id==='walk'?p.field!.walk?.dayMeters??0:p.field!.daily.skilled;}
export function claimGoDaily(p:PlayerV2,id:unknown){const task=GO_DAILY.find(t=>t.id===id),f=p.field!;check(task&&!f.daily.claimed.includes(task.id)&&dailyProgress(p,task.id)>=task.goal,'Dit onderzoek is nog niet voltooid of al opgehaald.');const first=f.daily.claimed.length===0;for(const [key,amount] of Object.entries(task.items))f.inventory[key as keyof typeof f.inventory]+=amount;f.daily.claimed.push(task.id);p.go!.dust+=task.dust;grantXP(p,task.xp);
 if(first){const t=ensureTrainer(p),book=t.research??={stamps:0,lastDay:'',breakthroughs:0};
  // ensureField supplies the server day; missed days never clear earned stamps.
  if(book.lastDay<f.daily.day){book.lastDay=f.daily.day;book.stamps++;if(book.stamps%7===0){book.breakthroughs++;p.go!.dust+=GO_BREAKTHROUGH.dust;f.inventory.basic+=GO_BREAKTHROUGH.nets;f.inventory.pollen+=GO_BREAKTHROUGH.lures;p.go!.fastTMs+=GO_BREAKTHROUGH.fastTMs;}}
 }
}
