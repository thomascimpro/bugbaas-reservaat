import {WILD_SHINY_ODDS} from './shinyV2';

export type GameEventV2={id:string;emoji:string;name:string;line:string;shinyOdds:number;endsAt:number};
/** Fixed weekly event (UTC): every Saturday and Sunday is Glimmerweekend with four times the wild shiny chance. No server state, so every player sees the same event. */
export function activeEvent(now:number):GameEventV2|null{
 const d=new Date(now),day=d.getUTCDay();if(day!==6&&day!==0)return null;
 const monday=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+(day===6?2:1));
 return {id:'glimmer-'+new Date(monday-2*86400000).toISOString().slice(0,10),emoji:'✨',name:'Glimmerweekend',line:'Shiny 4× vaker',shinyOdds:WILD_SHINY_ODDS/4,endsAt:monday};
}
/** Wild shiny odds right now (1 in n). */
export const wildShinyOdds=(now:number)=>activeEvent(now)?.shinyOdds??WILD_SHINY_ODDS;
