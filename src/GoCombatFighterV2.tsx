import React,{useContext,useEffect,useRef,useState} from 'react';
import {Animated,Platform,Text,View} from 'react-native';
import type {GoBattleView,GoFighter} from '../game/goBattleV2';
import type {Side} from '../game/typesV2';
import {Ground,SpriteView} from './artV2';
import {ImpactArt} from './CombatEffectsV2';
import {font,MotionPrefs} from './uiV2';

export function GoCombatFighterV2({unit,side,battle,size,flip=false}:{unit:GoFighter;side:Side;battle:GoBattleView;size:number;flip?:boolean}){
 const reduced=useContext(MotionPrefs),progress=useRef(new Animated.Value(1)).current,seen=useRef({battle:battle.id,unit:unit.id,serial:battle.serial,charge:battle.charge?.side}),running=useRef<{animation?:Animated.CompositeAnimation;timer?:ReturnType<typeof setTimeout>}>({}),[feedback,setFeedback]=useState<{damage:number;shield:boolean;attack:boolean;charged:boolean}|null>(null);
 useEffect(()=>()=>{running.current.animation?.stop();clearTimeout(running.current.timer);},[]);
 useEffect(()=>{
  const prior=seen.current;seen.current={battle:battle.id,unit:unit.id,serial:battle.serial,charge:battle.charge?.side};
  if(prior.battle!==battle.id||prior.unit!==unit.id){running.current.animation?.stop();clearTimeout(running.current.timer);setFeedback(null);return;}
  const events=battle.events.filter(e=>e.id>prior.serial),hits=events.filter(e=>e.side===side&&(e.kind==='damage'||e.kind==='shield'));
  const damage=hits.reduce((n,e)=>n+e.amount,0),shield=hits.some(e=>e.kind==='shield'),charged=events.some(e=>e.side===side&&e.kind==='charge')||!!damage&&prior.charge===1-side,attack=events.some(e=>e.side===side&&(e.kind==='fast'||e.kind==='charge'));
  if(!damage&&!attack)return;
  running.current.animation?.stop();clearTimeout(running.current.timer);setFeedback({damage,shield,attack,charged});progress.setValue(0);
  const animation=Animated.timing(progress,{toValue:1,duration:reduced?350:650,useNativeDriver:Platform.OS!=='web'});animation.start();
  running.current={animation,timer:setTimeout(()=>setFeedback(null),700)};
 },[battle.id,battle.serial,unit.id,reduced,side,progress]);
 const opacity=progress.interpolate({inputRange:[0,.15,.65,1],outputRange:[0,1,1,0]}),direction=flip?-1:1;
 const dx=progress.interpolate({inputRange:[0,.22,.45,1],outputRange:!reduced&&feedback?.attack?[0,-size*.06*direction,3*direction,0]:!reduced&&feedback?.damage?[0,-6,6,0]:[0,0,0,0]}),dy=progress.interpolate({inputRange:[0,.22,.45,1],outputRange:!reduced&&feedback?.attack?[0,size*.14*direction,-3*direction,0]:[0,0,0,0]}),scale=progress.interpolate({inputRange:[0,.18,.45,1],outputRange:!reduced&&feedback?.charged?[1,1.08,.96,1]:[1,1,1,1]});
 return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center',opacity:unit.hp>0?1:.3}}>
  <Ground size={size}/><Animated.View style={{transform:[{translateX:dx},{translateY:dy},{scale}]}}><SpriteView id={unit.species} shiny={unit.shiny} {...{size,flip}} animate={!feedback}/></Animated.View>
  {!!feedback&&!reduced&&<Animated.View pointerEvents="none" style={{position:'absolute',inset:0,opacity,transform:[{scale:progress.interpolate({inputRange:[0,.25,1],outputRange:[.55,1,1.35]})}]}}><ImpactArt kind={feedback.shield?'shield':feedback.charged?'burst':feedback.attack?'sting':'hit'} size={size}/>{feedback.charged&&Array.from({length:6},(_,i)=><Animated.View key={i} style={{position:'absolute',left:size/2-3,top:size/2-3,width:6,height:6,borderRadius:3,backgroundColor:'#FFDA87',transform:[{translateX:progress.interpolate({inputRange:[0,1],outputRange:[0,Math.cos(i*Math.PI/3)*size*.4]})},{translateY:progress.interpolate({inputRange:[0,1],outputRange:[0,Math.sin(i*Math.PI/3)*size*.4]})}]}}/>)}</Animated.View>}
  {!!feedback?.damage&&<Animated.Text pointerEvents="none" accessibilityLabel={feedback.shield?'Schild gebruikt':feedback.damage+' schade'} style={{position:'absolute',top:0,right:0,fontFamily:font,fontSize:24,fontWeight:'800',paddingHorizontal:8,paddingVertical:2,borderRadius:12,backgroundColor:'#102E29EB',borderWidth:1,borderColor:feedback.shield?'#8FDAD7':'#E5CB815C',color:feedback.shield?'#A4F0ED':'#FFF0BF',textShadowColor:'#123C31',textShadowRadius:3,opacity:reduced?1:opacity,transform:[{translateY:reduced?0:progress.interpolate({inputRange:[0,1],outputRange:[0,-24]})}]}}>{feedback.shield?'Schild':'−'+feedback.damage}</Animated.Text>}
 </View>;
}
