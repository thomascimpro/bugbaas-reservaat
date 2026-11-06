import React,{useEffect,useRef,useState} from 'react';
import {netScoopGrade,validNetScoop,NET_SCOOP_SETTLE_MS} from '../game/netThrowV2';
import type {NetFlickTrace} from '../game/netThrowV2';
import type {NetMotion} from '../game/netMotionV2';
import type {Bait,Grade,Net,NetPoint} from '../game/fieldV2';
import {playSound} from './audioV2';
import {FieldArt} from './FieldArtV2';
type Pixel={x:number;y:number};
type Props={surface:React.RefObject<HTMLDivElement|null>;target:React.RefObject<HTMLDivElement|null>;anchor:React.RefObject<HTMLButtonElement|null>;net:Net;bait:Bait|null;color?:string;motion?:NetMotion;seed?:string;clock?:()=>number;enabled:boolean;reduced:boolean;onThrow:(trace:NetFlickTrace)=>void;onDragging:(active:boolean)=>void};
type Stroke={id:number;at:number;start:number;originY:number;targetY:number;rect:DOMRect;points:NetPoint[];pixels:Pixel[]};
/** One visible netsweep; the server judges the same stroke against the moving bug. */
export function NetThrowV2(props:Props){
 const latest=useRef(props);latest.current=props;const drag=useRef<Stroke|null>(null),frame=useRef(0);
 const [trail,setTrail]=useState<Pixel[]>([]),[hand,setHand]=useState<Pixel|null>(null),[guidance,setGuidance]=useState(''),[contact,setContact]=useState<{grade:Grade;dodged:boolean;at:Pixel}|null>(null);
 useEffect(()=>{if(!guidance)return;const t=setTimeout(()=>setGuidance(''),1800);return()=>clearTimeout(t);},[guidance]);
 useEffect(()=>{if(!contact)return;const t=setTimeout(()=>{setContact(null);setTrail([]);},NET_SCOOP_SETTLE_MS+200);return()=>clearTimeout(t);},[contact]);
 useEffect(()=>{
  const surface=props.surface.current;if(!surface)return;
  const point=(e:PointerEvent,d:Stroke)=>({x:Math.max(-.4,Math.min(1.4,(e.clientX-d.rect.left)/d.rect.width)),y:Math.max(-.4,Math.min(1.6,1+(e.clientY-d.originY)*.58/Math.max(60,d.originY-d.targetY))),t:Math.round(performance.now()-d.at)});
  const pixel=(e:PointerEvent,d:Stroke)=>({x:e.clientX-d.rect.left,y:e.clientY-d.rect.top});
  const cancel=()=>{const d=drag.current;drag.current=null;if(d&&surface.hasPointerCapture(d.id))surface.releasePointerCapture(d.id);cancelAnimationFrame(frame.current);setHand(null);setTrail([]);latest.current.onDragging(false);};
  const start=(e:PointerEvent)=>{
   if(!latest.current.enabled||e.button!==0||drag.current)return;const element=e.target as Element;if(element.closest('button,[role="button"],input,a')&&!element.closest('[data-testid="net-handle"]'))return;
   const a=latest.current.anchor.current?.getBoundingClientRect(),target=latest.current.target.current?.getBoundingClientRect();if(!a||!target)return;
   const d:Stroke={id:e.pointerId,at:performance.now(),start:Math.max(0,Math.round(latest.current.clock?.()??0)),originY:a.y+a.height/2,targetY:target.y+target.height*.42,rect:surface.getBoundingClientRect(),points:[],pixels:[]},p=point(e,d);
   if(p.y<0||p.y>1.3||p.x<-.1||p.x>1.1)return;d.points=[{...p,t:0}];d.pixels=[pixel(e,d)];drag.current=d;surface.setPointerCapture(e.pointerId);setContact(null);setGuidance('');setTrail(d.pixels.slice());setHand(d.pixels[0]);latest.current.onDragging(true);e.preventDefault();
  };
  const move=(e:PointerEvent)=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;const p=point(e,d);if(p.t-d.points.at(-1)!.t>=8){if(d.points.length>=95)d.points.splice(1,1);d.points.push(p);d.pixels.push(pixel(e,d));if(d.pixels.length>96)d.pixels.shift();}cancelAnimationFrame(frame.current);frame.current=requestAnimationFrame(()=>{setHand(pixel(e,d));setTrail(d.pixels.slice());});e.preventDefault();};
  const end=(e:PointerEvent)=>{
   const d=drag.current;if(!d||d.id!==e.pointerId)return;const p=point(e,d);p.t=Math.max(p.t,d.points.at(-1)!.t+1);d.points.push(p);d.pixels.push(pixel(e,d));cancel();
   if(!validNetScoop(d.points)){setTrail([]);setGuidance(p.t>1100?'Maak één korte netslag.':p.t<130?'Iets rustiger zwaaien.':'Veeg in één beweging door de bug.');return;}
   const {motion,bait,seed}=latest.current,judged=netScoopGrade(d.points,bait,motion,seed??'',d.start),at={x:judged.at.x*d.rect.width,y:d.originY+(judged.at.y-1)*(d.originY-d.targetY)/.58-d.rect.top};playSound('attack');setTrail(d.pixels.slice());setContact({grade:judged.grade,dodged:judged.dodged,at});latest.current.onThrow({kind:'scoop',points:d.points,...(motion?{start:d.start}:{})});e.preventDefault();
  };
  const visibility=()=>{if(document.hidden){cancel();setTrail([]);}};
  surface.addEventListener('pointerdown',start,true);surface.addEventListener('pointermove',move,true);surface.addEventListener('pointerup',end,true);surface.addEventListener('pointercancel',cancel,true);document.addEventListener('visibilitychange',visibility);
  return()=>{surface.removeEventListener('pointerdown',start,true);surface.removeEventListener('pointermove',move,true);surface.removeEventListener('pointerup',end,true);surface.removeEventListener('pointercancel',cancel,true);document.removeEventListener('visibilitychange',visibility);cancelAnimationFrame(frame.current);};
 },[props.surface,props.target,props.anchor]);
 const previous=trail.at(-2),angle=hand&&previous?Math.atan2(hand.y-previous.y,hand.x-previous.x)*180/Math.PI+45:-20;
 return <div data-testid="net-throw" data-ready={props.enabled} data-dragging={!!hand} data-mechanic="scoop" style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:2,overflow:'hidden'}}>
  <style>{'@keyframes bb-scoop-pop{from{opacity:0;transform:scale(.65)}70%{opacity:1;transform:scale(1.12)}to{opacity:1;transform:scale(1)}}@keyframes bb-scoop-close{from{opacity:1;transform:scale(1.1) rotate(-12deg)}to{opacity:.4;transform:scale(.78) rotate(12deg)}}'}</style>
  {trail.length>1&&<svg width="100%" height="100%" style={{position:'absolute',inset:0,opacity:contact?.55:.9}}><polyline data-testid="net-sweep-trail" points={trail.map(p=>p.x+','+p.y).join(' ')} fill="none" stroke="#E3C686" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" opacity=".18"/><polyline points={trail.map(p=>p.x+','+p.y).join(' ')} fill="none" stroke="#FFF0BD" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
  {hand&&<div data-testid="sweeping-net" style={{position:'absolute',left:hand.x-49,top:hand.y-49,width:98,height:98,transform:`rotate(${angle}deg)`,filter:'drop-shadow(0 4px 9px #092B27)'}}><FieldArt id={props.net} size={98}/></div>}
  {contact&&<><div data-testid="net-contact" style={{position:'absolute',left:contact.at.x-50,top:contact.at.y-50,animation:props.reduced?undefined:`bb-scoop-close ${NET_SCOOP_SETTLE_MS}ms ease-out both`}}><FieldArt id={props.net} size={100}/></div><div data-testid="throw-grade" role="status" style={{position:'absolute',top:Math.max(120,contact.at.y-100),left:12,right:12,textAlign:'center',font:'900 30px system-ui',color:contact.grade==='miss'?'#FFC4B2':'#FFE6A0',textShadow:'0 3px 10px #092B27',animation:props.reduced?undefined:'bb-scoop-pop 220ms ease-out both'}}>{contact.dodged?'Ontweken!':({miss:'Mis',hit:'Raak',nice:'Raak! ×1,15',great:'Mooi! ×1,3',perfect:'Perfect! ×1,5'} as const)[contact.grade]}</div></>}
  {!!guidance&&<div data-testid="net-guidance" role="status" style={{position:'absolute',left:20,right:20,bottom:128,textAlign:'center',font:'700 15px system-ui',color:'#FFF0CA',textShadow:'0 2px 8px #092B27'}}>{guidance}</div>}
 </div>;
}
