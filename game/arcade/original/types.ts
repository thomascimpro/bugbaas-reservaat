import type {ArcadeBug,ArcadeTicket} from '../tapDuel';
import type {ArcadeGameId} from '../games';

/** Original BugBaas mechanics, extracted from the old components for shared replay. */
export type OriginalInput={tick:number;x:number;y:number;action?:'down'|'up'|'move';control?:string};
export type OriginalState={game:ArcadeGameId;elapsedMs:number;score:number;finished:boolean;reason:string|null;hearts:number;[key:string]:unknown};
export type OriginalPort<S extends OriginalState=OriginalState>={
 game:ArcadeGameId;name:string;help:string;durationMs:number;
 controls?:readonly string[];
 create:(ticket:ArcadeTicket)=>S;
 step:(state:S,ticket:ArcadeTicket,dt:number)=>void;
 input:(state:S,ticket:ArcadeTicket,input:OriginalInput)=>boolean;
};
export type OriginalSceneProps<S extends OriginalState=OriginalState>={state:S;ticket:ArcadeTicket;scale:number;reducedMotion:boolean;onInput:(input:Omit<OriginalInput,'tick'>)=>void;onReady?:()=>void};

/** Actual squad stats already include held items. Helpers never multiply the score. */
export function originalSquadPower(squad:ArcadeBug[],league:ArcadeTicket['league']){
 const ref=league==='great'?[160,130,150]:league==='ultra'?[190,160,180]:[230,200,220];
 const ratio=(key:'attack'|'defense'|'hp',index:number)=>Math.min(1,Math.max(0,squad.reduce((n,b)=>n+b[key],0)/(3*ref[index])));
 return {attack:ratio('attack',0),defense:ratio('defense',1),hp:ratio('hp',2),has:(type:string)=>squad.some(b=>b.types.some(t=>t===type))};
}
