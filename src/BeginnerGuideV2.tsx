import React,{useEffect,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {PlayerV2} from '../game/typesV2';
import {trainerLevel} from '../game/trainerV2';
import {beginnerSteps} from '../game/beginnerGuideV2';
import type {BeginnerAction,BeginnerStep} from '../game/beginnerGuideV2';
import {font,Glyph} from './uiV2';
import {PO} from './PogoUiV2';

const key=(uid:string)=>'bugbaas-beginner-guide:'+uid,foldKey=(uid:string)=>'bugbaas-beginner-guide-fold:'+uid;
export type BeginnerGuide={step:BeginnerStep;index:number;count:number;fresh:boolean;markSeen:()=>void;act:()=>BeginnerAction};

/** "Wat nu?" for new players: one goal at a time. The card lives in the net menu; `fresh` is true while a new step has not been seen there yet (red badge on the net). */
export function useBeginnerGuideV2(player:PlayerV2):BeginnerGuide|null{
 const [local,setLocal]=useState<string[]|null>(null),[seen,setSeen]=useState<string|null|undefined>(undefined);
 useEffect(()=>{let alive=true;void AsyncStorage.getItem(key(player.uid)).then(raw=>{if(!alive)return;try{setLocal(raw?JSON.parse(raw):[]);}catch{setLocal([]);}}).catch(()=>alive&&setLocal([]));void AsyncStorage.getItem(foldKey(player.uid)).then(raw=>{if(!alive)return;try{const v=raw?JSON.parse(raw):null;setSeen(typeof v?.step==='string'?v.step:null);}catch{setSeen(null);}}).catch(()=>alive&&setSeen(null));return()=>{alive=false;};},[player.uid]);
 const level=trainerLevel(player.go?.trainer?.xp??0),steps=local?beginnerSteps(player,level,local):[],step=steps.find(s=>!s.done);
 if(!local||seen===undefined||!step||level>=8)return null;
 return {step,index:steps.indexOf(step),count:steps.length,fresh:seen!==step.id,
  // Same storage shape as the old foldable card, so a step seen before the redesign stays seen.
  markSeen:()=>{if(seen===step.id)return;setSeen(step.id);void AsyncStorage.setItem(foldKey(player.uid),JSON.stringify({collapsed:true,step:step.id})).catch(()=>{});},
  act:()=>{if(step.markOnAction&&!local.includes(step.id)){const next=[...local,step.id];setLocal(next);void AsyncStorage.setItem(key(player.uid),JSON.stringify(next)).catch(()=>{});}return step.action;}};
}

/** Light quest card at the top of the net menu; tapping it goes straight to the goal. */
export function BeginnerGuideV2({guide,onAction}:{guide:BeginnerGuide;onAction:(action:BeginnerAction)=>void}){
 const {step,index,count}=guide;
 return <Pressable testID="beginner-guide" accessibilityRole="button" accessibilityLabel={'Opdracht '+(index+1)+' van '+count+': '+step.title} onPress={()=>onAction(guide.act())} style={({pressed})=>({flexDirection:'row',alignItems:'center',gap:12,paddingVertical:10,paddingHorizontal:12,borderRadius:22,backgroundColor:PO.bg,borderWidth:2,borderColor:PO.rim,transform:[{scale:pressed?.98:1}]})}>
  <View style={{width:50,height:50,borderRadius:25,alignItems:'center',justifyContent:'center',backgroundColor:PO.surface,boxShadow:'0px 2px 6px #1E3C3222'}}><Glyph name={step.icon} size={38}/></View>
  <View style={{flex:1,gap:1}}>
   <Text style={{fontFamily:font,fontSize:11,fontWeight:'800',letterSpacing:.6,color:PO.tealText}}>OPDRACHT {index+1} VAN {count}</Text>
   <Text style={{fontFamily:font,fontSize:16,fontWeight:'800',color:PO.text}}>{step.title}</Text>
   <Text style={{fontFamily:font,fontSize:12,color:PO.muted}}>{step.hint}</Text>
  </View>
  <Text style={{fontFamily:font,fontSize:26,fontWeight:'700',color:PO.teal}}>›</Text>
 </Pressable>;
}
