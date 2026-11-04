import type {ArcadeTap,ArcadeTicket} from '../game/arcade/tapDuel';
import {applyArcadeInput,createArcadeState,stepArcadeState} from '../game/arcade/games';
import {originalTapTargets,type OriginalTapDuelState} from '../game/arcade/original/tapDuel';
import {nestPointOnPath,type OriginalNestState} from '../game/arcade/original/nestDefense';

/** Test player: screen coordinates and public controls only; never mutates simulation state. */
export function playOriginalTap(ticket:ArcadeTicket,scoreLimit=Infinity){
 const state=createArcadeState(ticket),inputs:ArcadeTap[]=[];
 while(!state.finished){
  if(state.tick%5===0){
   const target=originalTapTargets(state.original as OriginalTapDuelState,ticket).filter(t=>t.motion.x*3.6+t.size>0&&t.motion.x*3.6<360).sort((a,b)=>(a.required-a.hits)-(b.required-b.hits)||a.index-b.index)[0];
   if(target){const input:ArcadeTap={tick:state.tick,x:state.score<scoreLimit?Math.round(Math.max(0,Math.min(360,target.motion.x*3.6+target.size/2))/360*1000):0,y:state.score<scoreLimit?Math.round(Math.max(0,Math.min(640,target.motion.y*6.4+target.size/2))/640*1000):0};inputs.push(input);applyArcadeInput(state,ticket,input);}
  }
  stepArcadeState(state,ticket);
 }
 return {state,inputs};
}

export function playOriginalNest(ticket:ArcadeTicket){
 const state=createArcadeState(ticket),inputs:ArcadeTap[]=[];
 const press=(control:string,x=500,y=500)=>{const input:ArcadeTap={tick:state.tick,control,x,y,action:'down'};inputs.push(input);applyArcadeInput(state,ticket,input);};
 while(!state.finished){
  const nest=state.original as OriginalNestState;
  if(state.tick<5)press('tower_slot',100+state.tick*200);
  else if(state.tick%50===0){
   // Build/upgrade through the same five buttons as the original scene.
   const slot=Math.floor(state.tick/50)%5;press('tower_slot',100+slot*200);
   if(nest.enemies.length){const enemy=[...nest.enemies].sort((a,b)=>b.progress-a.progress)[0],p=nestPointOnPath(enemy.progress);press('field',Math.round(Math.max(0,Math.min(1000,p.x*10))),Math.round(Math.max(0,Math.min(1000,p.y*10))));}
   if(state.tick%100===0)press('spray');
  }else if(state.tick%100===25)press('sticky');
  stepArcadeState(state,ticket);
 }
 return {state,inputs};
}
