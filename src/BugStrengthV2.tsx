import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {bugAdvice} from '../game/bugAdviceV2';
import {GRADE_COLORS} from '../game/rarityDisplayV2';
import type {PlayerV2,Specimen} from '../game/typesV2';
import {Help,Label,V} from './uiV2';

/** Compact "how strong" strip: coloured strength stars, CP bar to max (with power-up preview) and up to two icon tips. */
export function BugStrengthV2({player,bug,nextCp,onDetails}:{player:PlayerV2;bug:Specimen;nextCp?:number;onDetails:()=>void}){
 const a=bugAdvice(player,bug),share=Math.min(1,a.cp/a.maxCp),next=Math.min(1,Math.max(a.cp,nextCp??a.cp)/a.maxCp),color=GRADE_COLORS[a.grade];
 return <View testID="bug-strength" style={{gap:6}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
   <Pressable accessibilityRole="button" accessibilityLabel={'Sterkte: '+a.gradeName+'. Bekijk details'} onPress={onDetails} style={{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:9,paddingVertical:3,borderRadius:12,backgroundColor:color,borderWidth:1,borderColor:'#FFFFFF66'}}>
    <Text style={{fontSize:13,fontWeight:'900',color:'#FFFFFF',textShadowColor:'#00000066',textShadowRadius:2}}>{[0,1,2].map(i=>i<Math.min(3,a.grade)?'★':'☆').join('')}</Text>
    <Text style={{fontSize:12,fontWeight:'800',color:'#FFFFFF',textShadowColor:'#00000066',textShadowRadius:2}}>{a.gradeName}</Text>
   </Pressable>
   {a.best&&!a.only&&<View testID="best-of-species" style={{paddingHorizontal:7,paddingVertical:2,borderRadius:10,backgroundColor:'#3E6B3F',borderWidth:1,borderColor:'#A5CE87'}}><Label small bold>👍 Beste</Label></View>}
   <View style={{flex:1}}/>
   <Help title="Hoe sterk?" body={'★ Kleur = sterkte: grijs, groen, blauw, paars, goud.\nBalk = CP nu → maximaal.\n👍 = slimme keuze.'}/>
  </View>
  <View accessibilityRole="progressbar" accessibilityLabel={'CP '+a.cp+' van maximaal '+a.maxCp} accessibilityValue={{min:0,max:a.maxCp,now:a.cp}} aria-valuemin={0} aria-valuemax={a.maxCp} aria-valuenow={a.cp} style={{height:10,borderRadius:6,overflow:'hidden',backgroundColor:'#0D2B25'}}>
   {next>share&&<View testID="cp-bar-next" style={{position:'absolute',left:0,top:0,bottom:0,width:(next*100+'%') as `${number}%`,backgroundColor:'#F6D99866'}}/>}
   <View style={{height:10,width:(Math.max(.03,share)*100+'%') as `${number}%`,borderRadius:6,backgroundColor:color}}/>
  </View>
  <View style={{flexDirection:'row',justifyContent:'space-between'}}><Label small bold>CP {a.cp}{nextCp&&nextCp>a.cp?' → '+nextCp:''}</Label><Label small color={V.muted}>max {a.maxCp.toLocaleString('nl-NL')}</Label></View>
  {a.tips.length>0&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{a.tips.map(t=><View key={t.text} style={{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:8,paddingVertical:3,borderRadius:12,backgroundColor:t.good?'#2F5B3A':'#4A3A22'}}><Text style={{fontSize:13}}>{t.good?'👍':'💡'}</Text><Label small>{t.text}</Label></View>)}</View>}
 </View>;
}
