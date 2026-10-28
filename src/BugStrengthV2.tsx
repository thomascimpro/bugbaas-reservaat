import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {bugAdvice} from '../game/bugAdviceV2';
import type {PlayerV2,Specimen} from '../game/typesV2';
import {Help,Label,V} from './uiV2';

/** "Hoe sterk?" card: stars in words, a CP bar towards the maximum (with the power-up preview) and thumbs-up next steps. */
export function BugStrengthV2({player,bug,nextCp,onDetails}:{player:PlayerV2;bug:Specimen;nextCp?:number;onDetails:()=>void}){
 const a=bugAdvice(player,bug),share=Math.min(1,a.cp/a.maxCp),next=Math.min(1,Math.max(a.cp,nextCp??a.cp)/a.maxCp),perfect=a.grade===4;
 return <View testID="bug-strength" style={{gap:9,padding:11,borderRadius:18,backgroundColor:'#143D33',borderWidth:1,borderColor:perfect?'#F2CF6E99':'#66836C66'}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
   <Pressable accessibilityRole="button" accessibilityLabel={'Aanleg: '+a.gradeName+'. Bekijk details'} onPress={onDetails} style={{flexDirection:'row',alignItems:'center',gap:6,minHeight:40}}>
    <Text style={{fontSize:20,letterSpacing:1,color:perfect?'#F2CF6E':'#F6D998'}}>{[0,1,2].map(i=>i<Math.min(3,a.grade)?'★':'☆').join('')}</Text>
    <Label bold>{a.gradeName}</Label>
   </Pressable>
   <View style={{flex:1}}/>
   {a.best&&!a.only&&<View testID="best-of-species" style={{paddingHorizontal:8,paddingVertical:3,borderRadius:10,backgroundColor:'#3E6B3F',borderWidth:1,borderColor:'#A5CE87'}}><Label small bold>👍 Je beste</Label></View>}
   <Help title="Hoe sterk is je bug?" body={'Sterren = aanleg (IV). Die blijft altijd hetzelfde: 3 sterren is super, een gouden rand is perfect.\n\nCP = hoe sterk je bug nu is. De balk laat zien hoe ver hij nog kan groeien. Sterker maken kost stof (voor alle bugs) en nectar (alleen voor deze familie).\n\n👍 = slimme keuze. Geef stof vooral aan je beste bugs.'}/>
  </View>
  <View style={{gap:4}}>
   <View accessibilityRole="progressbar" accessibilityLabel={'CP '+a.cp+' van maximaal '+a.maxCp} accessibilityValue={{min:0,max:a.maxCp,now:a.cp}} aria-valuemin={0} aria-valuemax={a.maxCp} aria-valuenow={a.cp} style={{height:12,borderRadius:7,overflow:'hidden',backgroundColor:'#0D2B25'}}>
    {next>share&&<View testID="cp-bar-next" style={{position:'absolute',left:0,top:0,bottom:0,width:(next*100+'%') as `${number}%`,backgroundColor:'#F6D99866'}}/>}
    <View style={{height:12,width:(Math.max(.03,share)*100+'%') as `${number}%`,borderRadius:7,backgroundColor:perfect?'#F2CF6E':'#8ECC9B'}}/>
   </View>
   <View style={{flexDirection:'row',justifyContent:'space-between'}}><Label small bold>CP {a.cp}{nextCp&&nextCp>a.cp?' → '+nextCp:''}</Label><Label small color={V.muted}>max CP {a.maxCp.toLocaleString('nl-NL')}</Label></View>
  </View>
  {a.tips.map(t=><View key={t.text} style={{flexDirection:'row',gap:7,alignItems:'flex-start'}}><Text style={{fontSize:15}}>{t.good?'👍':'💡'}</Text><View style={{flex:1}}><Label small>{t.text}</Label></View></View>)}
 </View>;
}
