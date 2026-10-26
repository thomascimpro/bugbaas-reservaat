import React,{useContext,useEffect,useRef,useState} from 'react';
import {Animated,Platform,View} from 'react-native';
import {effectiveness} from '../game/goBattleV2';
import type {GoBattleView,GoFighter} from '../game/goBattleV2';
import {CHARGED,FAST,movePool} from '../game/goV2';
import type {Side} from '../game/typesV2';
import {Ground,SpriteView} from './artV2';
import {ImpactArt} from './CombatEffectsV2';
import {GO_TYPES} from './GoTypeV2';
import {font,MotionPrefs} from './uiV2';

export function GoCombatFighterV2({unit,side,battle,size,flip=false}:{unit:GoFighter;side:Side;battle:GoBattleView;size:number;flip?:boolean}){
 const reduced=useContext(MotionPrefs),progress=useRef(new Animated.Value(1)).current,seen=useRef({battle:battle.id,unit:unit.id,serial:battle.serial,charge:battle.charge}),running=useRef<{animation?:Animated.CompositeAnimation;timer?:ReturnType<typeof setTimeout>}>({}),[feedback,setFeedback]=useState<{damage:number;shield:boolean;attack:boolean;charged:boolean;switched:boolean;color:string;matchup:number}|null>(null);
 useEffect(()=>()=>{running.current.animation?.stop();clearTimeout(running.current.timer);},[]);
 useEffect(()=>{
  const prior=seen.current;seen.current={battle:battle.id,unit:unit.id,serial:battle.serial,charge:battle.charge};
  if(prior.battle!==battle.id){running.current.animation?.stop();clearTimeout(running.current.timer);setFeedback(null);return;}
  const events=battle.events.filter(e=>e.id>prior.serial),switched=prior.unit!==unit.id,hits=switched?[]:events.filter(e=>e.side===side&&(e.kind==='damage'||e.kind==='shield'));
  const damage=hits.reduce((n,e)=>n+e.amount,0),shield=hits.some(e=>e.kind==='shield'),charged=events.some(e=>e.side===side&&e.kind==='charge')||!!damage&&prior.charge?.side===1-side,attack=!switched&&events.some(e=>e.side===side&&(e.kind==='fast'||e.kind==='charge'));
  if(!damage&&!attack&&!switched)return;
  const opponent=battle.teams[1-side][battle.active[1-side]],incoming=prior.charge?.side===1-side?CHARGED[prior.charge.move]:FAST[opponent.go.fast],outgoing=battle.charge?.side===side?CHARGED[battle.charge.move]:FAST[unit.go.fast],type=GO_TYPES[(damage?incoming:outgoing).type];
  running.current.animation?.stop();clearTimeout(running.current.timer);setFeedback({damage,shield,attack,charged,switched,color:type.color,matchup:damage?effectiveness(incoming.type,movePool(unit.species).types):1});progress.setValue(0);
  const animation=Animated.timing(progress,{toValue:1,duration:reduced?850:780,useNativeDriver:Platform.OS!=='web'});animation.start();
  running.current={animation,timer:setTimeout(()=>setFeedback(null),reduced?900:830)};
 },[battle.id,battle.serial,unit.id,reduced,side,progress]);
 const opacity=progress.interpolate({inputRange:[0,.12,.75,1],outputRange:[0,1,1,0]}),direction=flip?1:-1;
 const dx=progress.interpolate({inputRange:[0,.16,.36,.58,1],outputRange:!reduced&&feedback?.attack?[0,-size*.05*direction,size*.21*direction,0,0]:!reduced&&feedback?.damage?[0,-7,7,-3,0]:[0,0,0,0,0]}),dy=progress.interpolate({inputRange:[0,.16,.36,.58,1],outputRange:!reduced&&feedback?.attack?[0,size*.03*direction,-size*.15*direction,0,0]:[0,0,0,0,0]}),scale=progress.interpolate({inputRange:[0,.18,.45,1],outputRange:!reduced&&feedback?.switched?[.6,1.06,1,1]:!reduced&&feedback?.charged?[1,1.12,.96,1]:[1,1,1,1]});
 return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center',opacity:unit.hp>0?1:.3}}>
  <Ground size={size}/><Animated.View style={{transform:[{translateX:dx},{translateY:dy},{scale}]}}><SpriteView id={unit.species} shiny={unit.shiny} {...{size,flip}} animate={!feedback}/></Animated.View>
  {!!feedback&&!reduced&&<Animated.View pointerEvents="none" style={{position:'absolute',inset:0,opacity,transform:[{scale:progress.interpolate({inputRange:[0,.25,1],outputRange:[.55,1,1.35]})}]}}>{(feedback.damage>0||feedback.switched)&&<ImpactArt kind={feedback.switched?'switch':feedback.shield?'shield':feedback.charged?'burst':'hit'} size={size}/>}<View style={{position:'absolute',left:size*.15,top:size*.15,width:size*.7,height:size*.7,borderRadius:size,borderWidth:feedback.shield?3:2,borderColor:feedback.shield?'#9CE7EC':feedback.color,opacity:.65}}/>{Array.from({length:feedback.charged?8:4},(_,i)=><Animated.View key={i} style={{position:'absolute',left:size/2-3,top:size/2-3,width:feedback.charged?7:4,height:feedback.charged?7:4,borderRadius:4,backgroundColor:feedback.color,transform:[{translateX:progress.interpolate({inputRange:[0,1],outputRange:[0,Math.cos(i*Math.PI*2/(feedback.charged?8:4))*size*.42]})},{translateY:progress.interpolate({inputRange:[0,1],outputRange:[0,Math.sin(i*Math.PI*2/(feedback.charged?8:4))*size*.42]})}]}}/>)}</Animated.View>}
  {!!feedback&&(feedback.damage>0||feedback.switched)&&<Animated.View pointerEvents="none" accessibilityLiveRegion="polite" accessibilityLabel={feedback.switched?'Bug gewisseld':feedback.shield?'Schild gebruikt':feedback.damage+' schade'} style={{position:'absolute',top:0,right:0,alignItems:'center',paddingHorizontal:8,paddingVertical:3,borderRadius:12,backgroundColor:'#102E29F5',borderWidth:1,borderColor:feedback.shield?'#8FDAD7':feedback.color,opacity:reduced?1:opacity,transform:[{translateY:reduced?0:progress.interpolate({inputRange:[0,1],outputRange:[0,-15]})}]}}><Animated.Text style={{fontFamily:font,fontSize:feedback.switched?13:24,fontWeight:'800',color:feedback.shield?'#A4F0ED':'#FFF0BF'}}>{feedback.switched?'In het veld':feedback.shield?'Schild':'−'+feedback.damage}</Animated.Text>{!feedback.switched&&!feedback.shield&&feedback.matchup!==1&&<Animated.Text style={{fontFamily:font,fontSize:10,fontWeight:'800',color:feedback.matchup>1?'#F9D88D':'#C1D9DC'}}>{feedback.matchup>1?'Sterke treffer':'Weinig effect'}</Animated.Text>}</Animated.View>}
 </View>;
}
