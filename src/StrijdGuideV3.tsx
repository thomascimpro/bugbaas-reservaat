import React,{useContext,useEffect,useRef,useState} from 'react';
import {Animated,Easing,Image,Platform,Pressable,Text,View} from 'react-native';
import type {PlayerV2} from '../game/typesV2';
import {MotionPrefs,font} from './uiV2';

// "Zo werkt Strijd" (UX 9 Nov): one illustrated row per play mode with what it is and what it gives, in the order a
// new player should try them. Nothing is removed or locked: every row only opens the existing mode. Open by default
// for players with fewer than 5 battles, then a single line that can be reopened (progressive disclosure).
export const MODE_ART={
 duel:require('../assets/v2/modes/mode-duel.webp'),cup:require('../assets/v2/modes/mode-beker.webp'),daily:require('../assets/v2/modes/mode-dag.webp'),
 live:require('../assets/v2/modes/mode-live.webp'),rank:require('../assets/v2/medals/medal-strijder-goud.webp'),
 arcade:require('../assets/v2/modes/mode-arcade.webp'),ranked:require('../assets/v2/modes/mode-wedstrijd.webp'),
} as const;
export type StrijdMode='duel'|'daily'|'cup'|'rank'|'live';
const ROWS:{id:StrijdMode;title:string;what:string;get:string}[]=[
 {id:'duel',title:'Duel',what:'Jouw 3 bugs tegen een ander team. Tik om aan te vallen, veeg om te ontwijken.',get:'Duelpunten + 5 dagbeloningen'},
 {id:'daily',title:'Dag',what:'Elke dag één uitdaging met vaste bugs, plus de Dagbaas.',get:'Score, stof en XP'},
 {id:'cup',title:'Beker',what:'Weekbeker: alleen bugs van het weektype en onder de CP-grens.',get:'3 sterren = beker-beloning'},
 {id:'rank',title:'Rang',what:'Winnen laat je rang stijgen: Brons, Zilver, Goud en hoger.',get:'Seizoensbeloning'},
 {id:'live',title:'Live',what:'Vecht live tegen een vriend of een speler met een code.',get:'Voor de eer'},
];
const native=Platform.OS!=='web';

export function StrijdGuideV3({player,onOpen}:{player:PlayerV2;onOpen:(mode:StrijdMode)=>void}){
 const battles=(player.go?.wins??0)+(player.go?.losses??0),[open,setOpen]=useState(battles<5),reduced=useContext(MotionPrefs),t=useRef(new Animated.Value(open?1:0)).current;
 useEffect(()=>{const a=Animated.timing(t,{toValue:open?1:0,duration:reduced?0:260,easing:Easing.out(Easing.cubic),useNativeDriver:native});a.start();return()=>a.stop();},[open,reduced]);
 return <View testID="strijd-guide" style={{borderRadius:20,backgroundColor:'#0E2828',borderWidth:1,borderColor:'#BFF3EC47',overflow:'hidden'}}>
  <Pressable accessibilityRole="button" accessibilityLabel={open?'Uitleg Strijd inklappen':'Zo werkt Strijd'} accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={{flexDirection:'row',alignItems:'center',gap:10,padding:12}}>
   <View style={{flexDirection:'row'}}>{(['duel','daily','cup'] as const).map((m,i)=><Image key={m} source={MODE_ART[m]} style={{width:30,height:30,marginLeft:i?-8:0}} accessibilityIgnoresInvertColors/>)}</View>
   <View style={{flex:1}}><Text style={{fontFamily:font,color:'#EAF6F2',fontSize:15,fontWeight:'900'}}>Zo werkt Strijd</Text>{!open&&<Text style={{fontFamily:font,color:'#9DB8B2',fontSize:12}}>5 manieren om te vechten · tik voor uitleg</Text>}</View>
   <Animated.Text style={{color:'#6BEFF2',fontSize:18,fontWeight:'900',transform:[{rotate:t.interpolate({inputRange:[0,1],outputRange:['0deg','180deg']})}]}}>⌄</Animated.Text>
  </Pressable>
  {open&&<View style={{paddingHorizontal:10,paddingBottom:10,gap:8}}>{ROWS.map((r,i)=><GuideRow key={r.id} row={r} index={i} first={i===0&&battles<5} reduced={reduced} onPress={()=>{setOpen(false);onOpen(r.id);}}/>)}</View>}
 </View>;
}

function GuideRow({row,index,first,reduced,onPress}:{row:typeof ROWS[number];index:number;first:boolean;reduced:boolean;onPress:()=>void}){
 const t=useRef(new Animated.Value(reduced?1:0)).current;
 useEffect(()=>{if(reduced)return;const a=Animated.timing(t,{toValue:1,duration:320,delay:index*70,easing:Easing.out(Easing.cubic),useNativeDriver:native});a.start();return()=>a.stop();},[]);
 return <Animated.View style={{opacity:t,transform:[{translateY:t.interpolate({inputRange:[0,1],outputRange:[12,0]})}]}}>
  <Pressable testID={'strijd-guide-'+row.id} accessibilityRole="button" accessibilityLabel={row.title+': '+row.what+' '+row.get} onPress={onPress} style={{flexDirection:'row',alignItems:'center',gap:10,padding:8,borderRadius:16,backgroundColor:first?'#1FC3D31F':'#FFFFFF08',borderWidth:1,borderColor:first?'#1FC3D3':'transparent'}}>
   <View style={{width:24,height:24,borderRadius:12,backgroundColor:first?'#1FC3D3':'#FFFFFF1A',alignItems:'center',justifyContent:'center'}}><Text style={{fontFamily:font,color:first?'#062020':'#EAF6F2',fontWeight:'900',fontSize:12}}>{index+1}</Text></View>
   <Image source={MODE_ART[row.id]} style={{width:56,height:56}} accessibilityIgnoresInvertColors/>
   <View style={{flex:1,gap:2}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Text style={{fontFamily:font,color:'#EAF6F2',fontSize:15,fontWeight:'900'}}>{row.title}</Text>{first&&<Text style={{fontFamily:font,color:'#062020',backgroundColor:'#6BEFF2',fontSize:10,fontWeight:'900',paddingHorizontal:6,borderRadius:8,overflow:'hidden'}}>BEGIN HIER</Text>}</View>
    <Text style={{fontFamily:font,color:'#C9DDD8',fontSize:12,lineHeight:16}}>{row.what}</Text>
    <Text style={{fontFamily:font,color:'#F2C14E',fontSize:11,fontWeight:'800'}}>🎁 {row.get}</Text>
   </View>
  </Pressable>
 </Animated.View>;
}
