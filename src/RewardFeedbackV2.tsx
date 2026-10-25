import React,{useContext,useEffect,useRef} from 'react';
import {Animated,Easing,Platform,Pressable,View} from 'react-native';
import {Glyph,Label,MotionPrefs,useInfo} from './uiV2';
import type {Glyph as GlyphName} from './uiV2';
import {FieldArt,FieldActivityArt} from './FieldArtV2';
import type {Net,Bait} from '../game/fieldV2';
import type {RewardRow} from './resourceGainV2';
import {RewardHost} from './RewardHostV2';
export type RewardBatch={id:number;rows:RewardRow[];dismissed:string[]};
function Art({row,size=36}:{row:RewardRow;size?:number}){return row.art==='field'?<FieldArt id={row.icon as Net|Bait} size={size}/>:row.art==='cocoon'?<FieldActivityArt id="cocoon" size={size}/>:<Glyph name={row.icon as GlyphName} size={size}/>;}
function Bubble({row,index,onDismiss}:{row:RewardRow;index:number;onDismiss:()=>void}){
 const reduced=useContext(MotionPrefs),progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{progress.setValue(0);const animation=Animated.timing(progress,{toValue:1,duration:reduced?5400:6500,delay:index*100,easing:Easing.linear,useNativeDriver:Platform.OS!=='web',isInteraction:false});animation.start(({finished})=>{if(finished)onDismiss();});return()=>animation.stop();},[progress,reduced,row.id]);
 return <Animated.View style={{position:'absolute',top:42+index*72,right:7,opacity:progress.interpolate({inputRange:[0,.85,1],outputRange:[1,1,0]}),transform:[{translateY:reduced?0:progress.interpolate({inputRange:[0,1],outputRange:[55,-25]})}]}}><Pressable accessibilityRole="button" accessibilityLabel={'Verzamel '+row.count+' '+row.name} onPress={onDismiss} onLongPress={()=>{}} style={{width:64,height:64,borderRadius:32,alignItems:'center',justifyContent:'center',backgroundColor:'#194A3CEB',borderWidth:1.5,borderColor:'#DBCC93',boxShadow:'0px 3px 12px #06271D55'}}><Art row={row}/><View style={{position:'absolute',bottom:-3,right:-3,borderRadius:12,paddingHorizontal:6,backgroundColor:'#E7D29A'}}><Label small bold color="#15382B">+{row.count}</Label></View></Pressable></Animated.View>;
}
export function RewardFeedbackV2({batch,visible=true,onDismiss}:{batch:RewardBatch|null;visible?:boolean;onDismiss:(id:string)=>void}){
 const info=useInfo();if(!visible||!batch?.rows.length)return null;
 const summary=()=>info.show({title:'Ontvangen',body:batch.rows.map(r=>'+'+r.count.toLocaleString('nl-NL')+' '+r.name).join('\n'),icon:'gift'});
 return <RewardHost><View pointerEvents="box-none" style={{flex:1}}><Pressable accessibilityRole="button" accessibilityLabel="Bekijk beloningen" onPress={summary} style={{alignSelf:'flex-end',borderRadius:17,paddingHorizontal:9,paddingVertical:5,backgroundColor:'#143D32EC',borderWidth:1,borderColor:'#C8BC87',flexDirection:'row',alignItems:'center',gap:4}}><Glyph name="gift" size={20}/><Label small bold>{batch.rows.length}</Label></Pressable>{batch.rows.filter(r=>!batch.dismissed.includes(r.id)).slice(0,3).map((row,index)=><Bubble key={batch.id+':'+row.id} {...{row,index}} onDismiss={()=>onDismiss(row.id)}/>)}</View></RewardHost>;
}
