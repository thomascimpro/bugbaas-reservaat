import React,{useEffect,useRef,useState} from 'react';
import {PanResponder,Pressable,Text,View} from 'react-native';
import type {Element} from '../game/goV2';
import {CHARGE_BEAT as BEAT,CHARGE_DIRS as DIRS,CHARGE_GAMES,CHARGE_H as H,CHARGE_W as W,rhythmHit,swarmPosition,swipeMatches} from '../game/chargeGamesV2';
import {GO_TYPES} from './GoTypeV2';
import {font,Glyph,Label} from './uiV2';

export function ChargeGameV2({type,hits,ended,reduced,onHit}:{type:Element;hits:number;ended:boolean;reduced:boolean;onHit:()=>void}){
 const game=CHARGE_GAMES[type],color=GO_TYPES[type].color,start=useRef(Date.now()),[t,setT]=useState(0),[done,setDone]=useState<number[]>([]),[flash,setFlash]=useState(''),hit=useRef(onHit);hit.current=onHit;
 const dir=useRef(Math.floor(Math.random()*4)),[dirState,setDir]=useState(dir.current),lastBeat=useRef(-1),rub=useRef({x:0,sign:0,travel:0});
 useEffect(()=>{if(reduced)return;let frame=0,alive=true;const loop=()=>{if(!alive)return;setT(Date.now()-start.current);frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);return()=>{alive=false;cancelAnimationFrame(frame);};},[reduced]);
 useEffect(()=>{if(!flash)return;const id=setTimeout(()=>setFlash(''),380);return()=>clearTimeout(id);},[flash]);
 const score=(label='Raak!')=>{if(ended||hits>=8)return;hit.current();setFlash(label);};
 const pan=useRef(PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,
  onPanResponderGrant:e=>{rub.current={x:e.nativeEvent.locationX,sign:0,travel:0};},
  onPanResponderMove:(_,g)=>{if(CHARGE_GAMES[type].kind!=='rub')return;const r=rub.current,x=g.dx,step=x-r.x,sign=Math.sign(step);if(!sign)return;if(sign===r.sign||!r.sign){r.travel+=Math.abs(step);r.sign=sign;}else{if(r.travel>=34)scoreRef.current('Vonk!');r.travel=Math.abs(step);r.sign=sign;}r.x=x;},
  onPanResponderRelease:(_,g)=>{const kind=CHARGE_GAMES[type].kind;if(kind==='swipe'){if(swipeMatches(g.dx,g.dy,dir.current)){scoreRef.current('Raak!');dir.current=(dir.current+1+Math.floor(Math.random()*3))%4;setDir(dir.current);}else if(Math.hypot(g.dx,g.dy)>=36)setFlash('Andere kant!');}
   else if(kind==='rhythm'&&Math.hypot(g.dx,g.dy)<20){const elapsed=Date.now()-start.current,beat=Math.round(elapsed/BEAT);if(beat===lastBeat.current)return;if(rhythmHit(elapsed)){lastBeat.current=beat;scoreRef.current('Perfect!');}else setFlash('Te vroeg');}},
 })).current;
 const scoreRef=useRef(score);scoreRef.current=score;
 if(reduced)return null;
 const ring=1.9-.9*((t%BEAT)/BEAT);
 return <View style={{alignItems:'center',gap:6}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Glyph name={GO_TYPES[type].icon} size={24}/><Text style={{fontFamily:font,fontSize:18,fontWeight:'900',color:'#FFF1CD'}}>{game.title}</Text></View>
  <Label small color="#F7E9BF">{game.hint}</Label>
  <View testID={'charge-game-'+game.kind} {...(game.kind==='swarm'?{}:pan.panHandlers)} style={{width:W,height:H,borderRadius:22,overflow:'hidden',backgroundColor:color+'2E',borderWidth:2,borderColor:color+'AA'}}>
   {game.kind==='swarm'&&Array.from({length:8},(_,i)=>{const p=swarmPosition(game.motion!,i,t);if(done.includes(i)||!p.visible)return null;return <Pressable key={i} accessibilityRole="button" accessibilityLabel={'Energiedoel '+(i+1)} onPress={()=>{if(done.includes(i))return;setDone(d=>[...d,i]);score();}} hitSlop={8} style={{position:'absolute',left:p.x-24,top:p.y-24,width:48,height:48,borderRadius:24,alignItems:'center',justifyContent:'center',backgroundColor:color+'99',borderWidth:2,borderColor:'#FFF1CD'}}><Glyph name={GO_TYPES[type].icon} size={30}/></Pressable>;})}
   {game.kind==='rub'&&<View pointerEvents="none" style={{flex:1,alignItems:'center',justifyContent:'center'}}><View style={{width:60+hits*14,height:60+hits*14,borderRadius:999,backgroundColor:color,opacity:.25+hits*.08,boxShadow:'0px 0px '+(10+hits*6)+'px '+color}}/><Text style={{position:'absolute',fontFamily:font,fontSize:34,color:'#FFF1CD'}}>⇆</Text></View>}
   {game.kind==='rhythm'&&<View pointerEvents="none" style={{flex:1,alignItems:'center',justifyContent:'center'}}><View style={{position:'absolute',width:80,height:80,borderRadius:40,borderWidth:5,borderColor:'#FFF1CD'}}/><View style={{position:'absolute',width:80*ring,height:80*ring,borderRadius:40*ring,borderWidth:3,borderColor:color}}/><Glyph name={GO_TYPES[type].icon} size={40}/></View>}
   {game.kind==='swipe'&&<View pointerEvents="none" style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text testID="charge-swipe-arrow" style={{fontFamily:font,fontSize:96,fontWeight:'900',color:'#FFF1CD',textShadowColor:color,textShadowRadius:16}}>{DIRS[dirState].arrow}</Text></View>}
   {!!flash&&<View pointerEvents="none" style={{position:'absolute',top:8,left:0,right:0,alignItems:'center'}}><Text style={{fontFamily:font,fontSize:20,fontWeight:'900',color:'#FFF1CD',textShadowColor:'#061A16',textShadowRadius:6}}>{flash}</Text></View>}
  </View>
  <View style={{flexDirection:'row',gap:5}}>{Array.from({length:8},(_,i)=><View key={i} style={{width:14,height:14,borderRadius:7,borderWidth:2,borderColor:'#FFF1CD',backgroundColor:i<hits?color:'transparent'}}/>)}</View>
 </View>;
}
