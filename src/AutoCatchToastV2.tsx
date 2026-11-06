import React,{useContext,useEffect,useRef,useState} from 'react';
import {Animated,Easing,Platform,Text,View} from 'react-native';
import type {PlayerV2} from '../game/typesV2';
import {species} from '../game/catalogV2';
import {bugRarity,RARITY_TIERS} from '../game/rarityDisplayV2';
import {isJackpot} from '../game/walkCatchV2';
import {SpriteView} from './artV2';
import {MotionPrefs,font} from './uiV2';
import {PO} from './PogoUiV2';

/** Visible Wandelvangst while the map is open: each confirmed walk catch pops up, slides and fades. Display only (server counter). */
export function AutoCatchToastV2({player}:{player:PlayerV2}){
 const reduced=useContext(MotionPrefs),caught=player.go?.auto.walk?.caught??0,seen=useRef(caught),[shown,setShown]=useState<{ids:string[];count:number;jackpot:boolean;key:number}|null>(null),anim=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  const gained=caught-seen.current;seen.current=caught;if(gained<=0)return;
  const ids=player.specimens.filter(s=>s.autoCaught&&s.source==='walking').slice(-Math.min(gained,3)).map(s=>s.id);
  setShown({ids,count:gained,jackpot:Array.from({length:gained},(_,i)=>caught-i).some(isJackpot),key:Date.now()});
 },[caught]);
 useEffect(()=>{
  if(!shown)return;anim.setValue(0);const native=Platform.OS!=='web';
  const run=Animated.sequence([Animated.timing(anim,{toValue:1,duration:reduced?1:320,easing:Easing.out(Easing.back(1.6)),useNativeDriver:native}),Animated.delay(reduced?2200:1900),Animated.timing(anim,{toValue:2,duration:reduced?1:420,easing:Easing.in(Easing.cubic),useNativeDriver:native})]);
  run.start(({finished})=>{if(finished)setShown(null);});return()=>run.stop();
 },[shown?.key]);
 if(!shown)return null;
 const bugs=shown.ids.map(id=>player.specimens.find(s=>s.id===id)).filter(Boolean) as PlayerV2['specimens'];
 const top=bugs.at(-1),color=top?RARITY_TIERS[bugRarity(top.species)].color:PO.teal;
 return <Animated.View testID="auto-catch-toast" pointerEvents="none" accessibilityLiveRegion="polite" accessibilityLabel={'Autovangst: '+shown.count+' bugs. '+bugs.map(b=>species(b.species).name).join(', ')}
  style={{position:'absolute',alignSelf:'center',bottom:250,zIndex:40,flexDirection:'row',alignItems:'center',gap:8,paddingLeft:6,paddingRight:14,paddingVertical:6,borderRadius:30,backgroundColor:PO.surface,borderWidth:1.5,borderColor:shown.jackpot?PO.gold:color+'CC',boxShadow:'0px 0px 18px '+(shown.jackpot?PO.gold:color)+'66',
   opacity:anim.interpolate({inputRange:[0,.4,1,1.6,2],outputRange:[0,1,1,1,0]}),transform:[{translateY:anim.interpolate({inputRange:[0,1,2],outputRange:[28,0,-36]})},{scale:anim.interpolate({inputRange:[0,1,2],outputRange:[.7,1,.92]})}]}}>
  <View style={{flexDirection:'row'}}>{bugs.map((b,i)=><View key={b.id} style={{width:44,height:44,borderRadius:22,marginLeft:i?-14:0,alignItems:'center',justifyContent:'center',backgroundColor:RARITY_TIERS[bugRarity(b.species)].color+'40',borderWidth:1,borderColor:PO.rim}}><SpriteView id={b.species} shiny={b.shiny} size={40} animate/></View>)}</View>
  <View><Text style={{fontFamily:font,fontSize:16,fontWeight:'800',color:shown.jackpot?PO.gold:PO.text}}>{(shown.jackpot?'✨ Jackpot · ':'')+'+'+shown.count+' 🐞'}</Text>{top&&<Text numberOfLines={1} style={{fontFamily:font,fontSize:12,fontWeight:'700',color:PO.muted,maxWidth:160}}>{species(top.species).name}</Text>}</View>
 </Animated.View>;
}
