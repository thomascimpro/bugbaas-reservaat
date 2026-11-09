/** Shared presentation/economy, while Arcade and squad combat keep independent scores. */
export const RANKS=[
 {id:'bronze',name:'Brons',emoji:'🥉',color:'#C98A4B',min:1000},
 {id:'silver',name:'Zilver',emoji:'🥈',color:'#C9D3DA',min:1150},
 {id:'gold',name:'Goud',emoji:'🥇',color:'#F2C94C',min:1300},
 {id:'platinum',name:'Platina',emoji:'💎',color:'#7FE0E6',min:1450},
 {id:'diamond',name:'Diamant',emoji:'💎',color:'#69AFFF',min:1600},
 {id:'elite',name:'Elite',emoji:'✦',color:'#C49AFF',min:1750},
 {id:'champion',name:'Kampioen',emoji:'👑',color:'#F29974',min:1900},
 {id:'master',name:'Master',emoji:'✦',color:'#FFF0B8',min:2050},
] as const;
export type RankIndex=0|1|2|3|4|5|6|7;
export const rankOf=(points:number):RankIndex=>{let index=0;for(let i=0;i<RANKS.length;i++)if(points>=RANKS[i].min)index=i;return index as RankIndex;};
export function rankStep(points:number){const rank=rankOf(points),r=RANKS[rank],step=rank===7?0:Math.min(2,Math.max(0,Math.floor((points-r.min)/50))),next=rank===7?null:r.min+(step+1)*50;return {rank,step,name:r.name+(rank===7?'':' '+['I','II','III'][step]),next,progress:next===null?1:Math.max(0,Math.min(1,(points-(next-50))/50))};}
export const seasonKey=(now:number)=>new Date(now).toISOString().slice(0,7);
export const softReset=(points:number)=>Math.max(1000,Math.min(1600,1000+Math.floor((points-1000)/2)));
export const SEASON_REWARDS=[
 {dust:500,nets:5,tms:0,cocoon:false,held:false,bug:false},
 {dust:1000,nets:8,tms:1,cocoon:false,held:false,bug:false},
 {dust:2000,nets:12,tms:1,cocoon:true,held:false,bug:false},
 {dust:3000,nets:15,tms:2,cocoon:true,held:true,bug:false},
 {dust:4500,nets:20,tms:2,cocoon:true,held:true,bug:false},
 {dust:6000,nets:25,tms:3,cocoon:true,held:true,bug:false},
 {dust:8000,nets:30,tms:3,cocoon:true,held:true,bug:false},
 {dust:10000,nets:40,tms:4,cocoon:true,held:true,bug:false},
] as const;
