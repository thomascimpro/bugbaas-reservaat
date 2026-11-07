import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {bugAdvice} from '../game/bugAdviceV2';
import {GRADE_COLORS} from '../game/rarityDisplayV2';
import type {PlayerV2,Specimen} from '../game/typesV2';
import {font,Glyph} from './uiV2';
import {PO} from './PogoUiV2';
import {InfoDot} from './CollectionPresentationV2';

/** Compact "how strong" strip (light sheet): coloured strength stars, CP bar to max (with power-up preview) and up to two icon tips. */
export function BugStrengthV2({player,bug,nextCp,onDetails}:{player:PlayerV2;bug:Specimen;nextCp?:number;onDetails:()=>void}){
 const a=bugAdvice(player,bug),share=Math.min(1,a.cp/a.maxCp),next=Math.min(1,Math.max(a.cp,nextCp??a.cp)/a.maxCp),color=GRADE_COLORS[a.grade],small={fontFamily:font,fontSize:12,fontWeight:'700' as const,color:PO.text};
 return <View testID="bug-strength" style={{gap:6}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
   <Pressable accessibilityRole="button" accessibilityLabel={'Sterkte: '+a.gradeName+'. Bekijk details'} onPress={onDetails} style={{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:4,borderRadius:14,backgroundColor:color}}>
    <Text style={{fontSize:13,fontWeight:'900',color:'#FFFFFF',textShadowColor:'#00000055',textShadowRadius:2}}>{[0,1,2].map(i=>i<Math.min(3,a.grade)?'★':'☆').join('')}</Text>
    <Text style={{fontFamily:font,fontSize:12,fontWeight:'800',color:'#FFFFFF',textShadowColor:'#00000055',textShadowRadius:2}}>{a.gradeName}</Text>
   </Pressable>
   {a.best&&!a.only&&<View testID="best-of-species" style={{paddingHorizontal:8,paddingVertical:3,borderRadius:12,backgroundColor:'#1FC3D326'}}><View style={{flexDirection:'row',alignItems:'center',gap:3}}><Glyph name="check" size={16}/><Text style={small}>Beste</Text></View></View>}
   <View style={{flex:1}}/>
   <InfoDot title="Hoe sterk?" body={'★ Kleur = sterkte: grijs, groen, blauw, paars, goud.\nBalk = CP nu → maximaal.\nVinkje = slimme keuze.'}/>
  </View>
  <View accessibilityRole="progressbar" accessibilityLabel={'CP '+a.cp+' van maximaal '+a.maxCp} accessibilityValue={{min:0,max:a.maxCp,now:a.cp}} aria-valuemin={0} aria-valuemax={a.maxCp} aria-valuenow={a.cp} style={{height:9,borderRadius:5,overflow:'hidden',backgroundColor:'#FFFFFF1F'}}>
   {next>share&&<View testID="cp-bar-next" style={{position:'absolute',left:0,top:0,bottom:0,width:(next*100+'%') as `${number}%`,backgroundColor:'#F2A51A55'}}/>}
   <View style={{height:9,width:(Math.max(.03,share)*100+'%') as `${number}%`,borderRadius:5,backgroundColor:color}}/>
  </View>
  <View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={small}>CP {a.cp}{nextCp&&nextCp>a.cp?' → '+nextCp:''}</Text><Text style={{...small,fontWeight:'600',color:PO.muted}}>max {a.maxCp.toLocaleString('nl-NL')}</Text></View>
  {a.tips.length>0&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{a.tips.map(t=><View key={t.text} style={{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:9,paddingVertical:4,borderRadius:12,backgroundColor:t.good?'#1FC3D326':'#F2C14E26'}}><Glyph name={t.good?'check':'info'} size={17}/><Text style={{...small,fontWeight:'600'}}>{t.text}</Text></View>)}</View>}
 </View>;
}
