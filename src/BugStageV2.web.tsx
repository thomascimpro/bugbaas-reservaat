import {WALK_MODELS} from '../game/walkingV2';
import React,{useContext,useEffect,useRef,useState} from 'react';
import {View} from 'react-native';
import {encounterStage} from './WalkingSceneV2';
import {SpriteView} from './artV2';
import {MotionPrefs} from './uiV2';
import {species} from '../game/catalogV2';
export default function BugStageV2({id,shiny=false}:{id:string;shiny?:boolean}){const host=useRef<HTMLDivElement>(null),reduced=useContext(MotionPrefs),[fallback,setFallback]=useState(false);useEffect(()=>{setFallback(false);if(!WALK_MODELS[id]){setFallback(true);return;}if(!host.current)return;try{return encounterStage(host.current,id,reduced,()=>{},()=>setFallback(true),shiny);}catch{setFallback(true);}},[id,reduced,shiny]);return <View pointerEvents="none" style={{position:'absolute',inset:0}}><div ref={host} aria-label={'3D '+species(id).name} style={{position:'absolute',inset:0}}/>{fallback&&<View style={{flex:1,alignItems:'center',justifyContent:'center'}}><SpriteView id={id} shiny={shiny} size={190}/></View>}</View>;}
