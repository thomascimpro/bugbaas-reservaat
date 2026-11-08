import React,{useEffect,useRef,useState} from 'react';
import {netStrikeGrade,validNetStrike,NET_STRIKE_CONTACT_MS,NET_STRIKE_RECOVER_MS} from '../game/netStrikeV2';
import type {NetFlickTrace} from '../game/netThrowV2';
import type {NetMotion} from '../game/netMotionV2';
import type {Bait,Grade,Net,NetPoint} from '../game/fieldV2';
import {playSound} from './audioV2';
import {FieldArt} from './FieldArtV2';
type Pixel={x:number;y:number};
type Props={surface:React.RefObject<HTMLDivElement|null>;target:React.RefObject<HTMLDivElement|null>;anchor:React.RefObject<HTMLButtonElement|null>;net:Net;bait:Bait|null;color?:string;motion?:NetMotion;seed?:string;clock?:()=>number;enabled:boolean;reduced:boolean;onThrow:(trace:NetFlickTrace)=>void;onDragging:(active:boolean)=>void};
type Stroke={id:number;at:number;start:number;originY:number;targetY:number;offset:number;rect:DOMRect;points:NetPoint[]};
/** Aim with an open net. Release commits one strike; only its contact frame can catch. */
export function NetThrowV2(props:Props){
 const latest=useRef(props);latest.current=props;const drag=useRef<Stroke|null>(null),frame=useRef(0),cue=useRef<HTMLDivElement>(null);
 const [hand,setHand]=useState<Pixel|null>(null),[guidance,setGuidance]=useState(''),[contact,setContact]=useState<{grade:Grade;dodged:boolean;at:Pixel}|null>(null);
 useEffect(()=>{if(!guidance)return;const t=setTimeout(()=>setGuidance(''),1800);return()=>clearTimeout(t);},[guidance]);
 useEffect(()=>{if(!contact)return;const t=setTimeout(()=>{setContact(null);},NET_STRIKE_CONTACT_MS+NET_STRIKE_RECOVER_MS+200);return()=>clearTimeout(t);},[contact]);
 useEffect(()=>{if(!hand)return;let raf=0;const tick=()=>{const d=drag.current,p=d?.points.at(-1),q=latest.current;if(d&&p&&cue.current){const elapsed=Math.round(performance.now()-d.at),judged=netStrikeGrade([{...p,t:elapsed}],q.bait,q.motion,q.seed??'',d.start);cue.current.dataset.strikeReady=elapsed>=60&&elapsed<=5000&&judged.grade==='perfect'?'1':'0';}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[!!hand]);
 useEffect(()=>{
  const surface=props.surface.current;if(!surface)return;
  const point=(e:PointerEvent,d:Stroke)=>({x:Math.max(-.4,Math.min(1.4,(e.clientX-d.rect.left)/d.rect.width)),y:Math.max(-.4,Math.min(1.6,1+(e.clientY-d.offset-d.originY)*.58/Math.max(60,d.originY-d.targetY))),t:Math.round(performance.now()-d.at)});
  const pixel=(e:PointerEvent,d:Stroke)=>({x:e.clientX-d.rect.left,y:e.clientY-d.rect.top-d.offset});
  const cancel=()=>{const d=drag.current;drag.current=null;if(d&&surface.hasPointerCapture(d.id))surface.releasePointerCapture(d.id);cancelAnimationFrame(frame.current);setHand(null);latest.current.onDragging(false);};
  const start=(e:PointerEvent)=>{
   if(!latest.current.enabled||e.button!==0||drag.current)return;const element=e.target as Element;if(element.closest('button,[role="button"],input,a')&&!element.closest('[data-testid="net-handle"]'))return;
   const a=latest.current.anchor.current?.getBoundingClientRect(),target=latest.current.target.current?.getBoundingClientRect();if(!a||!target)return;
   const d:Stroke={id:e.pointerId,at:performance.now(),start:Math.max(0,Math.round(latest.current.clock?.()??0)),originY:a.y+a.height/2,targetY:target.y+target.height*.42,offset:Math.min(56,Math.max(28,surface.clientHeight*.055)),rect:surface.getBoundingClientRect(),points:[]},p=point(e,d);
   if(p.y<0||p.y>1.3||p.x<-.1||p.x>1.1)return;d.points=[{...p,t:0}];drag.current=d;surface.setPointerCapture(e.pointerId);setContact(null);setGuidance('');setHand(pixel(e,d));latest.current.onDragging(true);e.preventDefault();
  };
  const move=(e:PointerEvent)=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;const p=point(e,d);if(p.t-d.points.at(-1)!.t>=8){if(d.points.length>=95)d.points.splice(1,1);d.points.push(p);}cancelAnimationFrame(frame.current);frame.current=requestAnimationFrame(()=>{setHand(pixel(e,d));});e.preventDefault();};
  const end=(e:PointerEvent)=>{
   const d=drag.current;if(!d||d.id!==e.pointerId)return;const p=point(e,d);p.t=Math.max(p.t,d.points.at(-1)!.t+1);d.points.push(p);cancel();
   if(!validNetStrike(d.points)){setGuidance(p.t>5000?'Richt kort en laat los.':'Houd even vast om je net te richten.');return;}
   const {motion,bait,seed}=latest.current,judged=netStrikeGrade(d.points,bait,motion,seed??'',d.start),at={x:judged.at.x*d.rect.width,y:d.originY+(judged.at.y-1)*(d.originY-d.targetY)/.58-d.rect.top};playSound('attack');setContact({grade:judged.grade,dodged:judged.dodged,at});latest.current.onThrow({kind:'strike',points:d.points,start:d.start});e.preventDefault();
  };
  const visibility=()=>{if(document.hidden){cancel();}};
  surface.addEventListener('pointerdown',start,true);surface.addEventListener('pointermove',move,true);surface.addEventListener('pointerup',end,true);surface.addEventListener('pointercancel',cancel,true);document.addEventListener('visibilitychange',visibility);
  return()=>{surface.removeEventListener('pointerdown',start,true);surface.removeEventListener('pointermove',move,true);surface.removeEventListener('pointerup',end,true);surface.removeEventListener('pointercancel',cancel,true);document.removeEventListener('visibilitychange',visibility);cancelAnimationFrame(frame.current);};
 },[props.surface,props.target,props.anchor]);
 const size=Math.min(230,Math.max(150,(props.surface.current?.clientWidth??360)*.62));
 const netAt=(at:Pixel,aim=false)=><div style={{position:'absolute',left:at.x-size*.69,top:at.y-size*.25,width:size,height:size,opacity:aim?.62:1,transformOrigin:'69% 25%',filter:'drop-shadow(0 4px 9px #092B27)',animation:aim||props.reduced?undefined:`bb-net-strike ${NET_STRIKE_CONTACT_MS}ms ease-out both`}}><FieldArt id={props.net} size={size}/></div>;
 return <div ref={cue} data-testid="net-throw" data-ready={props.enabled} data-dragging={!!hand} data-mechanic="strike" style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:2,overflow:'hidden'}}>
  <style>{'@keyframes bb-strike-grade{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@keyframes bb-net-strike{from{transform:translate(18px,48px) rotate(38deg)}to{transform:translate(0,0) rotate(0)}}[data-strike-ready="1"] .bb-strike-rim{border-color:#FFE58C!important;box-shadow:0 0 22px #FFD35E, inset 0 0 12px #FFD35E66!important}[data-strike-ready="1"] .bb-strike-dot{background:#FFE58C!important}'}</style>
  {hand&&<>{netAt(hand,true)}<div className="bb-strike-rim" data-testid="net-aim" style={{position:'absolute',left:hand.x-29,top:hand.y-24,width:58,height:48,border:'2px solid '+(props.color??'#E3C686'),borderRadius:'50%',boxShadow:'0 2px 8px #092B27',transform:'rotate(25deg)'}}/><div className="bb-strike-dot" style={{position:'absolute',left:hand.x-3,top:hand.y-3,width:6,height:6,borderRadius:'50%',background:'#FFF6DC'}}/></>}
  {contact&&<>{netAt(contact.at)}<div data-testid="throw-grade" role="status" style={{position:'absolute',top:Math.max(120,contact.at.y-100),left:12,right:12,textAlign:'center',font:'900 30px system-ui',color:contact.grade==='miss'?'#FFC4B2':'#FFE6A0',textShadow:'0 3px 10px #092B27',animation:`bb-strike-grade ${props.reduced?0:180}ms ease-out ${NET_STRIKE_CONTACT_MS}ms both`}}>{contact.dodged?'Te vroeg!':({miss:'Mis',hit:'Raak',nice:'Raak! ×1,15',great:'Mooi! ×1,3',perfect:'Perfect! ×1,5'} as const)[contact.grade]}</div></>}
  {!!guidance&&<div data-testid="net-guidance" role="status" style={{position:'absolute',left:20,right:20,bottom:128,textAlign:'center',font:'700 15px system-ui',color:'#FFF0CA',textShadow:'0 2px 8px #092B27'}}>{guidance}</div>}
 </div>;
}
