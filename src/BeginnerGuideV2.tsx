import React,{useEffect,useState} from 'react';
import {Pressable,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {PlayerV2} from '../game/typesV2';
import {trainerLevel} from '../game/trainerV2';
import {beginnerSteps,guidePeeks,GUIDE_PEEK_MS} from '../game/beginnerGuideV2';
import type {BeginnerAction} from '../game/beginnerGuideV2';
import {Glyph,Label} from './uiV2';

const key=(uid:string)=>'bugbaas-beginner-guide:'+uid,foldKey=(uid:string)=>'bugbaas-beginner-guide-fold:'+uid;
type Fold={collapsed:boolean;step:string|null};
/** "Wat nu?" card for new players: one clear goal at a time, with a button that goes straight there. Folds into a small 📋 button so it never hides bugs. */
export function BeginnerGuideV2({player,onAction}:{player:PlayerV2;onAction:(action:BeginnerAction)=>void}){
 const [local,setLocal]=useState<string[]|null>(null),[fold,setFold]=useState<Fold|null>(null),[peek,setPeek]=useState(false);
 useEffect(()=>{let alive=true;void AsyncStorage.getItem(key(player.uid)).then(raw=>{if(!alive)return;try{setLocal(raw?JSON.parse(raw):[]);}catch{setLocal([]);}}).catch(()=>alive&&setLocal([]));void AsyncStorage.getItem(foldKey(player.uid)).then(raw=>{if(!alive)return;try{const v=raw?JSON.parse(raw):null;setFold({collapsed:v?.collapsed===true,step:typeof v?.step==='string'?v.step:null});}catch{setFold({collapsed:false,step:null});}}).catch(()=>alive&&setFold({collapsed:false,step:null}));return()=>{alive=false;};},[player.uid]);
 const level=trainerLevel(player.go?.trainer?.xp??0),steps=local?beginnerSteps(player,level,local):[],step=steps.find(s=>!s.done),stepId=step?.id??null;
 const save=(next:Fold)=>{setFold(next);void AsyncStorage.setItem(foldKey(player.uid),JSON.stringify(next)).catch(()=>{});};
 // A new step briefly opens a folded card, then it folds back by itself.
 useEffect(()=>{if(!fold||!stepId||fold.step===stepId)return;const show=guidePeeks(fold.collapsed,fold.step,stepId);save({...fold,step:stepId});if(show)setPeek(true);},[stepId,fold?.step]);
 useEffect(()=>{if(!peek)return;const t=setTimeout(()=>setPeek(false),GUIDE_PEEK_MS);return()=>clearTimeout(t);},[peek]);
 if(!local||!fold||!step||level>=8)return null;
 const index=steps.indexOf(step),collapsed=fold.collapsed&&!peek;
 const act=()=>{if(step.markOnAction&&!local.includes(step.id)){const next=[...local,step.id];setLocal(next);void AsyncStorage.setItem(key(player.uid),JSON.stringify(next)).catch(()=>{});}onAction(step.action);};
 if(collapsed)return <Pressable testID="beginner-guide-open" accessibilityRole="button" accessibilityLabel={'Open opdracht '+(index+1)+' van '+steps.length+': '+step.title} onPress={()=>save({...fold,collapsed:false})} style={({pressed})=>({alignSelf:'flex-start',width:56,height:56,borderRadius:28,alignItems:'center',justifyContent:'center',backgroundColor:'#173F35F2',borderWidth:2,borderColor:'#F2D16E',boxShadow:'0px 4px 12px #06191466',transform:[{scale:pressed?.94:1}]})}>
  <Label bold>📋</Label><Label small bold color="#F2D16E">{index+1}/{steps.length}</Label>
 </Pressable>;
 return <Pressable testID="beginner-guide" accessibilityRole="button" accessibilityLabel={'Opdracht '+(index+1)+' van '+steps.length+': '+step.title} onPress={act} style={({pressed})=>({flexDirection:'row',alignItems:'center',gap:10,paddingVertical:9,paddingHorizontal:12,borderRadius:20,backgroundColor:'#173F35F2',borderWidth:2,borderColor:'#F2D16E',boxShadow:'0px 6px 18px #06191466',transform:[{scale:pressed?.97:1}]})}>
  <View style={{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:'#F2D16E33'}}><Glyph name={step.icon} size={34}/></View>
  <View style={{flex:1,gap:2}}>
   <Label small bold color="#F2D16E">Opdracht {index+1} van {steps.length}</Label>
   <Label bold>{step.title}</Label>
   <Label small color="#DDE8D3">{step.hint}</Label>
  </View>
  <Glyph name="compass" size={26}/>
  <Pressable testID="beginner-guide-fold" accessibilityRole="button" accessibilityLabel="Opdracht inklappen" hitSlop={8} onPress={e=>{e.stopPropagation();setPeek(false);save({...fold,collapsed:true});}} style={{position:'absolute',right:-8,top:-10,width:30,height:30,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:'#0E2B24',borderWidth:2,borderColor:'#F2D16E'}}><Label small bold color="#F2D16E">▼</Label></Pressable>
 </Pressable>;
}
