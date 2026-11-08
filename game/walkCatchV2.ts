import type {PlayerV2} from './typesV2';
import {dayV2} from './safariV2';

/** Walk catches ("Wandelvangst") while autovangst is on, also with the app in the background or closed.
 * Normal moving: 1 bug per 200 m (5/km). A real workout (sustained brisk walking or running) counts double: 10/km.
 * Bugs are random wild spawns at your spot (same species/rarity/shiny odds as the map), always caught, no net used.
 * Every 10th bug of the day is a jackpot: the rarest bug of that spot. Daily cap keeps it fair. */
export const WALK_CATCH={step:200,workoutPace:1.75,maxPace:7,dailyCap:120,jackpotEvery:10,perCall:5} as const;
export type WalkDayV2={day:string;caught:number;meters:number;workoutMeters:number;credit:number;pace?:number;workout?:boolean};

export function walkDay(p:PlayerV2,now:number):WalkDayV2{
 const a=p.go!.auto,day=dayV2(now);
 if(!a.walk||a.walk.day!==day)a.walk={day,caught:0,meters:0,workoutMeters:0,credit:Math.min(WALK_CATCH.dailyCap*WALK_CATCH.step,Math.max(0,a.walk?.credit??0))};
 return a.walk;
}
/** Add plausible distance (m/s between fixes). Returns how many bugs may be granted now; the rest stays as credit. */
export function creditWalk(w:WalkDayV2,meters:number,speed:number):number{
 if(!(meters>0)||!(speed>0)||speed>WALK_CATCH.maxPace)return 0;
 w.pace=w.pace===undefined?speed:w.pace*.7+speed*.3;w.workout=w.pace>=WALK_CATCH.workoutPace;
 w.meters+=meters;if(w.workout)w.workoutMeters+=meters;
 const left=Math.max(0,WALK_CATCH.dailyCap-w.caught);
 w.credit=Math.min(left*WALK_CATCH.step,w.credit+meters*(w.workout?2:1));
 return pendingWalk(w);
}
/** Credit already earned (for example from Health Connect before a fresh GPS fix) that can be granted now. */
export const pendingWalk=(w:WalkDayV2)=>Math.min(WALK_CATCH.perCall,Math.floor(w.credit/WALK_CATCH.step),Math.max(0,WALK_CATCH.dailyCap-w.caught));
export const isJackpot=(n:number)=>n>0&&n%WALK_CATCH.jackpotEvery===0;

/** One line for the Android notification and the in-game summary: the same numbers in both places. */
export function walkTodayText(p:PlayerV2,now:number){
 const w=p.go?.auto.walk,today=w&&w.day===dayV2(now)?w:null,km=((p.field?.walk?.dayMeters??0)/1000).toLocaleString('nl-NL',{minimumFractionDigits:1,maximumFractionDigits:1});
 return (today?.workout?'🏃 ':'👟 ')+km+' km · 🐞 '+(today?.caught??0);
}
