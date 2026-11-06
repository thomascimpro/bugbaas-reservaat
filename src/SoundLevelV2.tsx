import React,{useEffect,useRef,useState} from 'react';
import {Platform,View} from 'react-native';
import {Label} from './uiV2';

/** Preview locally while dragging; save once on release, never a server call per pixel. */
export function SoundLevelV2({label,value,disabled,onSave}:{label:string;value:number;disabled:boolean;onSave:(value:number)=>void}){
 const [level,setLevel]=useState(value),width=useRef(1),dragging=useRef(false),current=useRef(value);current.current=level;
 useEffect(()=>{if(!dragging.current)setLevel(value);},[value]);
 const change=(n:number)=>{const next=Math.round(Math.max(0,Math.min(1,n))*20)/20;current.current=next;setLevel(next);return next;};
 const save=()=>{dragging.current=false;if(current.current!==value)onSave(current.current);};
 return <View style={{gap:4}}><View style={{flexDirection:'row',justifyContent:'space-between'}}><Label small>{label}</Label><Label small>{Math.round(level*100)}%</Label></View>
  {Platform.OS==='web'?<input type="range" aria-label={label} min={0} max={100} step={5} value={Math.round(level*100)} disabled={disabled} onPointerDown={()=>{dragging.current=true;}} onChange={e=>change(Number(e.target.value)/100)} onPointerUp={save} onPointerCancel={save} onKeyUp={save} onBlur={()=>{if(dragging.current)save();}} style={{width:'100%',height:44,margin:0,accentColor:'#1FC3D3',cursor:disabled?'default':'pointer'}}/>:
  <View accessibilityRole="adjustable" accessibilityLabel={label} accessibilityState={{disabled}} accessibilityValue={{min:0,max:100,now:Math.round(level*100)}} accessibilityActions={[{name:'increment'},{name:'decrement'}]} onAccessibilityAction={e=>{if(!disabled){change(level+(e.nativeEvent.actionName==='increment'?.05:-.05));save();}}} onLayout={e=>{width.current=Math.max(1,e.nativeEvent.layout.width);}} onStartShouldSetResponder={()=>!disabled} onMoveShouldSetResponder={()=>!disabled} onResponderGrant={e=>{dragging.current=true;change(e.nativeEvent.locationX/width.current);}} onResponderMove={e=>change(e.nativeEvent.locationX/width.current)} onResponderRelease={save} onResponderTerminate={save} style={{height:44,justifyContent:'center',opacity:disabled?.5:1}}><View pointerEvents="none" style={{height:7,borderRadius:5,backgroundColor:'#173D3D'}}><View style={{height:7,width:`${level*100}%`,borderRadius:5,backgroundColor:'#1FC3D3'}}/></View><View pointerEvents="none" style={{position:'absolute',left:`${level*100}%`,marginLeft:-10,width:20,height:20,borderRadius:10,backgroundColor:'#EAF6F2',borderWidth:2,borderColor:'#1FC3D3'}}/></View>}
 </View>;
}
