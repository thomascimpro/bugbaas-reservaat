import React,{useState} from 'react';
import {Image,Pressable,Text,View} from 'react-native';
import {MEDAL_TIERS,medalStates} from '../game/medalsV3';
import type {MedalId,MedalState} from '../game/medalsV3';
import type {PlayerV2} from '../game/typesV2';
import {Label,Panel,font} from './uiV2';

// Medal case (profile → Doelen): one HD medal per category in the reached tier (brons → platina), a progress bar to
// the next tier and a tap-open row with all four tiers. Display only: medals give no rewards (game/medalsV3.ts).
const ART:Record<MedalId,readonly [number,number,number,number]>={
 jager:[require("../assets/v2/medals/medal-jager-brons.webp"),require("../assets/v2/medals/medal-jager-zilver.webp"),require("../assets/v2/medals/medal-jager-goud.webp"),require("../assets/v2/medals/medal-jager-platina.webp")],
 wandelaar:[require("../assets/v2/medals/medal-wandelaar-brons.webp"),require("../assets/v2/medals/medal-wandelaar-zilver.webp"),require("../assets/v2/medals/medal-wandelaar-goud.webp"),require("../assets/v2/medals/medal-wandelaar-platina.webp")],
 verzamelaar:[require("../assets/v2/medals/medal-verzamelaar-brons.webp"),require("../assets/v2/medals/medal-verzamelaar-zilver.webp"),require("../assets/v2/medals/medal-verzamelaar-goud.webp"),require("../assets/v2/medals/medal-verzamelaar-platina.webp")],
 broeder:[require("../assets/v2/medals/medal-broeder-brons.webp"),require("../assets/v2/medals/medal-broeder-zilver.webp"),require("../assets/v2/medals/medal-broeder-goud.webp"),require("../assets/v2/medals/medal-broeder-platina.webp")],
 strijder:[require("../assets/v2/medals/medal-strijder-brons.webp"),require("../assets/v2/medals/medal-strijder-zilver.webp"),require("../assets/v2/medals/medal-strijder-goud.webp"),require("../assets/v2/medals/medal-strijder-platina.webp")],
 scherpschutter:[require("../assets/v2/medals/medal-scherpschutter-brons.webp"),require("../assets/v2/medals/medal-scherpschutter-zilver.webp"),require("../assets/v2/medals/medal-scherpschutter-goud.webp"),require("../assets/v2/medals/medal-scherpschutter-platina.webp")],
 shinyjager:[require("../assets/v2/medals/medal-shinyjager-brons.webp"),require("../assets/v2/medals/medal-shinyjager-zilver.webp"),require("../assets/v2/medals/medal-shinyjager-goud.webp"),require("../assets/v2/medals/medal-shinyjager-platina.webp")],
 arcade:[require("../assets/v2/medals/medal-arcade-brons.webp"),require("../assets/v2/medals/medal-arcade-zilver.webp"),require("../assets/v2/medals/medal-arcade-goud.webp"),require("../assets/v2/medals/medal-arcade-platina.webp")]};
const TIER_NAMES=['Brons','Zilver','Goud','Platina'],TIER_COLORS=['#D08A4E','#C9D2DA','#F2C14E','#9FE3FF'];
const fmt=(n:number)=>n.toLocaleString('nl-NL',{maximumFractionDigits:1});

export function MedalCaseV3({player}:{player:PlayerV2}){
 const states=medalStates(player),[open,setOpen]=useState<MedalId|null>(null),earned=states.reduce((s,m)=>s+m.tier,0),chosen=states.find(m=>m.def.id===open);
 return <Panel style={{gap:10}}>
  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Label bold>🏅 Medailles</Label><Label small>{earned} / {states.length*4}</Label></View>
  <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:10}}>{states.map(m=><MedalTile key={m.def.id} m={m} active={open===m.def.id} onPress={()=>setOpen(open===m.def.id?null:m.def.id)}/>)}</View>
  {chosen&&<View testID="medal-detail" style={{gap:8,padding:10,borderRadius:16,backgroundColor:'#0A2020',borderWidth:1,borderColor:'#BFF3EC47'}}>
   <Label bold>{chosen.def.name} · {chosen.def.what}</Label>
   <View style={{flexDirection:'row',justifyContent:'space-between'}}>{MEDAL_TIERS.map((t,i)=><View key={t} style={{alignItems:'center',width:'24%',opacity:chosen.tier>i?1:.35}}><Image source={ART[chosen.def.id][i]} style={{width:54,height:54}} accessibilityIgnoresInvertColors/><Text style={{fontFamily:font,color:TIER_COLORS[i],fontSize:11,fontWeight:'900'}}>{TIER_NAMES[i]}</Text><Text style={{fontFamily:font,color:'#EAF6F2',fontSize:11}}>{fmt(chosen.def.goals[i])} {chosen.def.unit}</Text></View>)}</View>
   <Label small>{chosen.next===null?'Alles behaald, topper!':'Nog '+fmt(chosen.next-chosen.value)+' '+chosen.def.unit+' tot '+TIER_NAMES[chosen.tier]+'.'}</Label>
  </View>}
 </Panel>;
}

function MedalTile({m,active,onPress}:{m:MedalState;active:boolean;onPress:()=>void}){
 const shown=Math.max(0,m.tier-1),color=m.tier?TIER_COLORS[m.tier-1]:'#5E7A74';
 return <Pressable testID={'medal-'+m.def.id} accessibilityRole="button" accessibilityLabel={m.def.name+': '+(m.tier?TIER_NAMES[m.tier-1]:'nog geen medaille')+', '+fmt(m.value)+' '+m.def.unit} onPress={onPress} style={{width:'24%',alignItems:'center',gap:3,paddingVertical:6,borderRadius:14,backgroundColor:active?'#1FC3D326':'transparent'}}>
  <View style={{width:62,height:62,alignItems:'center',justifyContent:'center'}}>
   {m.tier>0&&<View style={{position:'absolute',width:50,height:50,borderRadius:25,backgroundColor:color,opacity:.22}}/>}
   <Image source={ART[m.def.id][shown]} style={{width:62,height:62,opacity:m.tier?1:.28}} accessibilityIgnoresInvertColors/>
  </View>
  <Text numberOfLines={1} style={{fontFamily:font,color:'#EAF6F2',fontSize:11,fontWeight:'800'}}>{m.def.name}</Text>
  <View style={{width:'84%',height:5,borderRadius:3,backgroundColor:'#FFFFFF1F',overflow:'hidden'}}><View style={{width:(m.progress*100+'%') as `${number}%`,height:5,backgroundColor:m.next===null?'#9FE3FF':color}}/></View>
  <Text style={{fontFamily:font,color:'#9DB8B2',fontSize:10}}>{m.next===null?fmt(m.value):fmt(m.value)+' / '+fmt(m.next)}</Text>
 </Pressable>;
}
