import React,{useContext,useEffect,useRef,useState} from 'react';
import {Animated,View} from 'react-native';
import {SpriteView} from './artV2';
import {MotionPrefs} from './uiV2';

/** Acknowledged upgrades only; never delays or changes the upgrade command. */
export function BugUpgradeFxV3({id,species,shiny,cp,size,children}:{id:string;species:string;shiny:boolean;cp:number;size:number;children:React.ReactNode}){
 const reduced=useContext(MotionPrefs),previous=useRef({id,species,cp}),progress=useRef(new Animated.Value(1)).current,[old,setOld]=useState<string|null>(null);
 useEffect(()=>{const before=previous.current;previous.current={id,species,cp};if(before.id!==id||reduced||before.species===species&&before.cp>=cp)return;
  setOld(before.species===species?null:before.species);progress.setValue(0);const animation=Animated.timing(progress,{toValue:1,duration:before.species===species?480:750,useNativeDriver:true});animation.start(({finished})=>{if(finished)setOld(null);});return()=>animation.stop();
 },[id,species,cp,reduced]);
 return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
  <Animated.View style={{opacity:old?progress:1,transform:[{scale:progress.interpolate({inputRange:[0,.4,1],outputRange:[.9,1.08,1]})}]}}>{children}</Animated.View>
  {old&&<Animated.View pointerEvents="none" style={{position:'absolute',opacity:progress.interpolate({inputRange:[0,.7,1],outputRange:[1,0,0]}),transform:[{scale:progress.interpolate({inputRange:[0,1],outputRange:[1,.5]})}]}}><SpriteView id={old} shiny={shiny} size={size}/></Animated.View>}
  <Animated.View pointerEvents="none" style={{position:'absolute',width:size*.85,height:size*.85,borderRadius:size,borderWidth:3,borderColor:'#F2C14E',opacity:progress.interpolate({inputRange:[0,.2,1],outputRange:[0,.85,0]}),transform:[{scale:progress.interpolate({inputRange:[0,1],outputRange:[.45,1.3]})}]}}/>
 </View>;
}
