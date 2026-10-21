import React,{forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import {Glyph} from './uiV2';
import {catchAccuracy,catchPeriod,catchTarget} from '../game/catchTimingV2';
import type {CatchFocus,CatchRhythm} from '../game/catchTimingV2';
import type {Bait} from '../game/fieldV2';
export type CatchTimingHandle={tap:()=>void};
export const CatchTimingV2=forwardRef<CatchTimingHandle,{focus:CatchFocus;bait:Bait|null;now:number;reduced:boolean;complete:(proof:CatchRhythm)=>void}>(function CatchTiming({focus,bait,now,reduced,complete},ref){
 const origin=useRef(performance.now()+focus.at-now),taps=useRef<number[]>([]),done=useRef(false),latest=useRef(complete),[frame,setFrame]=useState({elapsed:-800,index:0}),[scores,setScores]=useState<number[]>([]);latest.current=complete;
 const period=catchPeriod(bait);
 function record(time:number){const index=taps.current.length;if(index>=3||done.current)return;taps.current.push(time);setScores(taps.current.map((t,i)=>catchAccuracy(focus,i,t,bait)));if(taps.current.length===3){done.current=true;latest.current({focus:focus.id,taps:[...taps.current]});}}
 useImperativeHandle(ref,()=>({tap(){const time=Math.round(performance.now()-origin.current),index=taps.current.length;if(time>=index*period&&time<(index+1)*period)record(time);}}));
 useEffect(()=>{let raf=0,last=0,alive=true;const tick=(time:number)=>{if(!alive||done.current)return;raf=requestAnimationFrame(tick);if(document.hidden||time-last<45)return;last=time;const elapsed=Math.round(time-origin.current);while(taps.current.length<3&&elapsed>=(taps.current.length+1)*period)record((taps.current.length+1)*period-1);if(!done.current)setFrame({elapsed,index:taps.current.length});};raf=requestAnimationFrame(tick);return()=>{alive=false;cancelAnimationFrame(raf);};},[focus.id,period]);
 const index=Math.min(frame.index,2),target=catchTarget(focus,index,bait),error=frame.elapsed-target,waiting=frame.elapsed<index*period,green=!waiting&&Math.abs(error)<(bait==='dew'?420:320),radius=reduced?.23:.105+Math.min(1,Math.abs(error)/700)*.26,color=green?'#9CFB99':waiting?'#D4DBC5':error>0?'#F5B181':'#F5D581';
 return <div data-testid="catch-timing" data-round={index} data-elapsed={frame.elapsed} data-target={target} data-ready={green} style={{position:'absolute',inset:0,pointerEvents:'none'}}>
  <div style={{position:'absolute',left:'50%',top:'42%',width:'23%',aspectRatio:1,border:'2px dashed #F9EEC0AA',borderRadius:'50%',transform:'translate(-50%,-50%)'}}/>
  <div data-testid="timing-ring" style={{position:'absolute',left:'50%',top:'42%',width:(radius*200)+'%',aspectRatio:1,border:`4px solid ${color}`,borderRadius:'50%',transform:'translate(-50%,-50%)',boxShadow:green?'0 0 24px #75EE8C88':'none'}}/>
  <div style={{position:'absolute',bottom:'1%',left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center',gap:7}}>
   <div style={{display:'flex',gap:12}}>{[0,1,2].map(i=><div key={i} data-testid={'catch-beat-'+i} data-hit={scores[i]===undefined?'pending':scores[i]>0?'hit':'miss'} style={{width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',background:scores[i]===undefined?'#153E38CC':scores[i]>0?'#386A3B':'#693D32',border:`2px solid ${scores[i]===undefined&&i===frame.index?'#F6D57B':'#D5DEBD66'}`,opacity:i>frame.index?.5:1}}><Glyph name={scores[i]===undefined?'leaf':scores[i]>.72?'star':scores[i]>0?'leaf':'close'} size={28}/></div>)}</div>
   <div aria-live="polite" style={{fontSize:19,fontWeight:800,color,textShadow:'0 2px 8px #09271F'}}>{waiting?'Klaar…':green?'Tik!':error>0?'Volgende ring…':'Wacht op groen'}</div>
  </div>
 </div>;
});
