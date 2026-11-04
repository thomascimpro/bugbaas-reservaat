import React,{useEffect,useRef,useState} from 'react';
import {Platform,View} from 'react-native';
import {applyArcadeInput,ARCADE_GAMES,createArcadeState,stepArcadeState} from '../../../game/arcade/games';
import type {ArcadeGameId} from '../../../game/arcade/games';
import {FIELD,TICK_MS} from '../../../game/arcade/tapDuel';
import type {ArcadeTap} from '../../../game/arcade/tapDuel';
import {originalPort} from '../../../game/arcade/original';
import type {OriginalInput,OriginalSceneProps} from '../../../game/arcade/original/types';
import type {ArcadeFieldProps} from '../ArcadeFieldV3';
import {OriginalTapDuelScene} from './TapDuelScene';
import {NestDefenseScene} from './NestDefenseScene';
import {WebRunnerScene} from './WebRunnerScene';
import {BugGlideScene} from './BugGlideScene';
import {OriginalButterflyCatchScene} from './ButterflyCatchScene';
import {BugTowerScene} from './BugTowerScene';
import {BubbleSwarmScene} from './BubbleSwarmScene';

// Every scene receives only the state created by its matching registered port.
const scenes={tap_duel:OriginalTapDuelScene,nest_defense:NestDefenseScene,web_runner:WebRunnerScene,bug_glide:BugGlideScene,butterfly_catch:OriginalButterflyCatchScene,bug_tower:BugTowerScene,bubble_swarm:BubbleSwarmScene} as unknown as Record<ArcadeGameId,React.ComponentType<OriginalSceneProps>>;
type PendingInput=Omit<OriginalInput,'tick'>;

/** Owns timing and replay input; each original scene owns its full gesture surface. */
export function OriginalArcadeFieldV3({ticket,onComplete,onHUD,reducedMotion=false}:ArcadeFieldProps){
 const [runtime]=useState(()=>({state:createArcadeState(ticket),origin:performance.now(),inputs:[] as ArcadeTap[],queue:[] as PendingInput[],trailingMove:null as PendingInput|null,lastMoveTick:-4,lastDraw:-Infinity,lastHUD:-5,sameTick:-1,sameCount:0,done:false}));
 const [,draw]=useState(0),[box,setBox]=useState({width:360,height:640}),callbacks=useRef({onComplete,onHUD});callbacks.current={onComplete,onHUD};
 const state=runtime.state,port=originalPort(ticket);
 const complete=()=>{if(runtime.done||!state.finished)return;runtime.done=true;runtime.queue=[];runtime.trailingMove=null;callbacks.current.onHUD({tick:state.tick,score:state.score,durationTicks:state.durationTicks});draw(n=>n+1);callbacks.current.onComplete(runtime.inputs.slice(),state);};
 const record=()=>{
  if(runtime.sameTick!==state.tick){runtime.sameTick=state.tick;runtime.sameCount=0;}
  while(runtime.queue.length&&runtime.sameCount<3&&!state.finished){
   const event=runtime.queue.shift()!,input:ArcadeTap={tick:state.tick,x:event.x,y:event.y,...(event.action&&event.action!=='down'?{action:event.action}:{}),...(event.control&&event.control!=='field'?{control:event.control}:{})};
   runtime.sameCount++;runtime.inputs.push(input);applyArcadeInput(state,ticket,input);
  }
 };
 const flushMove=()=>{if(runtime.trailingMove&&state.tick-runtime.lastMoveTick>=4){runtime.queue.push(runtime.trailingMove);runtime.trailingMove=null;runtime.lastMoveTick=state.tick;}};
 const advance=(now:number)=>{
  const target=Math.min(state.durationTicks,Math.max(state.tick,Math.floor((now-runtime.origin)/TICK_MS)));
  flushMove();record();
  while(state.tick<target&&!state.finished){stepArcadeState(state,ticket);flushMove();record();}
 };
 const input=(raw:PendingInput)=>{
  if(runtime.done||!Number.isFinite(raw.x)||!Number.isFinite(raw.y)||raw.control&&!port.controls?.includes(raw.control))return;
  advance(performance.now());if(state.finished){complete();return;}
  const event:PendingInput={x:Math.max(0,Math.min(1000,Math.round(raw.x))),y:Math.max(0,Math.min(1000,Math.round(raw.y))),action:raw.action??'down',...(raw.control?{control:raw.control}:{})};
  if(event.action==='move'){
   // Coalesce pointer/sensor noise, retaining the latest aim rather than recording
   // render-rate-dependent streams. Releases flush the last aim before the up.
   runtime.trailingMove=event;flushMove();
  }else{
   if(runtime.trailingMove){runtime.queue.push(runtime.trailingMove);runtime.trailingMove=null;runtime.lastMoveTick=state.tick;}
   runtime.queue.push(event);
  }
  // Extra events in one 20ms tick stay ordered until the next tick; never lose a
  // release when a press, drag and another control arrive in the same frame.
  record();if(state.finished)complete();
 };
 useEffect(()=>{
  // Child scene setup (including the 3D forest) completes before the clock starts.
  runtime.origin=performance.now();
  let frame=0,disposed=false;
  const render=(now:number)=>{
   if(disposed||runtime.done)return;advance(now);
   if(state.finished){complete();return;}
   if(state.tick-runtime.lastHUD>=5){runtime.lastHUD=state.tick;callbacks.current.onHUD({tick:state.tick,score:state.score,durationTicks:state.durationTicks});}
   if(now-runtime.lastDraw>=1000/30){runtime.lastDraw=now;draw(n=>n+1);}
   frame=requestAnimationFrame(render);
  };
  frame=requestAnimationFrame(render);return()=>{disposed=true;cancelAnimationFrame(frame);};
 },[ticket.id]);
 const scale=Math.max(.01,Math.min(box.width/FIELD.width,box.height/FIELD.height)),left=(box.width-FIELD.width*scale)/2,top=(box.height-FIELD.height*scale)/2,Scene=scenes[state.game];
 return <View testID="arcade-playfield" accessibilityLabel={ARCADE_GAMES.find(g=>g.id===state.game)?.help} onLayout={e=>{const {width,height}=e.nativeEvent.layout;if(width>0&&height>0)setBox({width,height});}} style={{flex:1,minHeight:0,minWidth:0,overflow:'hidden',...(Platform.OS==='web'?{touchAction:'none',userSelect:'none'} as any:{})}}>
  <View style={{position:'absolute',left,top,width:FIELD.width*scale,height:FIELD.height*scale,overflow:'hidden'}}><Scene state={state.original!} ticket={ticket} scale={scale} reducedMotion={reducedMotion} onInput={input}/></View>
 </View>;
}
