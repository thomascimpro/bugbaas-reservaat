import React,{useEffect,useState} from 'react';
import {Pressable,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {PlayerV2} from '../game/typesV2';
import {trainerLevel} from '../game/trainerV2';
import {beginnerSteps} from '../game/beginnerGuideV2';
import type {BeginnerAction} from '../game/beginnerGuideV2';
import {Glyph,Label} from './uiV2';

const key=(uid:string)=>'bugbaas-beginner-guide:'+uid;
/** "Wat nu?" card for new players: one clear goal at a time, with a button that goes straight there. */
export function BeginnerGuideV2({player,onAction}:{player:PlayerV2;onAction:(action:BeginnerAction)=>void}){
 const [local,setLocal]=useState<string[]|null>(null);
 useEffect(()=>{let alive=true;void AsyncStorage.getItem(key(player.uid)).then(raw=>{if(!alive)return;try{setLocal(raw?JSON.parse(raw):[]);}catch{setLocal([]);}}).catch(()=>alive&&setLocal([]));return()=>{alive=false;};},[player.uid]);
 if(!local)return null;
 const level=trainerLevel(player.go?.trainer?.xp??0),steps=beginnerSteps(player,level,local),step=steps.find(s=>!s.done);
 if(!step||level>=8)return null;
 const index=steps.indexOf(step);
 const act=()=>{if(step.markOnAction&&!local.includes(step.id)){const next=[...local,step.id];setLocal(next);void AsyncStorage.setItem(key(player.uid),JSON.stringify(next)).catch(()=>{});}onAction(step.action);};
 return <Pressable testID="beginner-guide" accessibilityRole="button" accessibilityLabel={'Opdracht '+(index+1)+' van '+steps.length+': '+step.title} onPress={act} style={({pressed})=>({flexDirection:'row',alignItems:'center',gap:10,paddingVertical:9,paddingHorizontal:12,borderRadius:20,backgroundColor:'#173F35F2',borderWidth:2,borderColor:'#F2D16E',boxShadow:'0px 6px 18px #06191466',transform:[{scale:pressed?.97:1}]})}>
  <View style={{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:'#F2D16E33'}}><Glyph name={step.icon} size={34}/></View>
  <View style={{flex:1,gap:2}}>
   <Label small bold color="#F2D16E">Opdracht {index+1} van {steps.length}</Label>
   <Label bold>{step.title}</Label>
   <Label small color="#DDE8D3">{step.hint}</Label>
  </View>
  <Glyph name="compass" size={26}/>
 </Pressable>;
}
