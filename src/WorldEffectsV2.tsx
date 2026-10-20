import React,{useContext,useEffect,useId,useRef,useState} from 'react';
import {Animated,AppState,Easing,Image,Platform,StyleSheet,View} from 'react-native';
import Svg,{Circle,Defs,LinearGradient,Path,RadialGradient,Rect,Stop} from 'react-native-svg';
import {font,Glyph,MotionPrefs} from './uiV2';

const native=Platform.OS!=='web';
const camp=require('../assets/v2/worlds/expedition-camp-v1.png');
const loot=require('../assets/v2/worlds/woodland-loot-v1.png');

// Backgrounding the app and the existing reduced-motion preference stop decorative loops.
export function useActiveMotion(enabled=true){
 const reduced=useContext(MotionPrefs),[active,setActive]=useState(true);
 useEffect(()=>{
  if(!enabled)return;
  if(Platform.OS==='web'&&typeof document!=='undefined'){
   const update=()=>setActive(!document.hidden);update();
   document.addEventListener('visibilitychange',update);
   return()=>document.removeEventListener('visibilitychange',update);
  }
  setActive(AppState.currentState==='active');
  const listener=AppState.addEventListener('change',state=>setActive(state==='active'));
  return()=>listener.remove();
 },[enabled]);
 return enabled&&!reduced&&active;
}

// Scattered, rising white glints: no halo or orbit around a shiny bug.
export function ShinySparklesV2({size}:{size:number}){
 const active=useActiveMotion(),time=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  time.setValue(0);if(!active)return;
  const loop=Animated.loop(Animated.timing(time,{toValue:1,duration:4800,easing:Easing.linear,useNativeDriver:native,isInteraction:false}));
  loop.start();return()=>loop.stop();
 },[active,time]);
 const points=[[.28,.43,.15],[.64,.32,.18],[.51,.68,.12],[.75,.58,.13],[.36,.74,.1],[.48,.23,.13],[.2,.63,.09],[.79,.34,.09]];
 return <View pointerEvents="none" testID="shiny-sparkles" style={StyleSheet.absoluteFill}>
  {points.slice(0,size<100?3:8).map(([x,y,scale],i)=>{
   const start=.02+i*.075,peak=start+.14,end=start+.29,edge=Math.max(8,size*scale);
   const pulse=time.interpolate({inputRange:[0,start,peak,end,1],outputRange:[.1,.1,1,.1,.1]});
   return <Animated.View key={i} testID="shiny-glint" style={{position:'absolute',left:size*x-edge/2,top:size*y-edge/2,width:edge,height:edge,opacity:active?pulse:.88,transform:[{scale:active?pulse:1},{translateY:active?time.interpolate({inputRange:[0,1],outputRange:[size*.06,-size*.09]}):0},{rotate:i%2?'10deg':'-7deg'}]}}><ShinyMarkV2 size={edge} single/></Animated.View>;
  })}
 </View>;
}
export function ShinyMarkV2({size=24,single=false}:{size?:number;single?:boolean}){
 return <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityLabel="Shiny"><Path d={single?'M20 1 L24 15 L39 20 L24 25 L20 39 L16 25 L1 20 L16 15 Z':'M14 8 L17 18 L27 21 L17 24 L14 34 L11 24 L1 21 L11 18 Z M30 1 L32 8 L39 10 L32 12 L30 19 L28 12 L21 10 L28 8 Z M32 25 L33.5 30.5 L39 32 L33.5 33.5 L32 39 L30.5 33.5 L25 32 L30.5 30.5 Z'} fill="#FBFEFF" stroke="#9CBCEA" strokeWidth={.7}/></Svg>;
}
export function ShinyBackdropV2(){
 const id='shiny-field'+useId().replace(/:/g,''),active=useActiveMotion(),reveal=useRef(new Animated.Value(1)).current;
 useEffect(()=>{if(!active){reveal.setValue(1);return;}reveal.setValue(.2);const animation=Animated.timing(reveal,{toValue:1,duration:850,easing:Easing.out(Easing.cubic),useNativeDriver:native,isInteraction:false});animation.start();return()=>animation.stop();},[active,reveal]);
 return <Animated.View pointerEvents="none" testID="shiny-backdrop" style={[StyleSheet.absoluteFill,{opacity:reveal}]}><Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice"><Defs><LinearGradient id={id} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#344F83"/><Stop offset=".36" stopColor="#717EB2"/><Stop offset=".68" stopColor="#A18FBF"/><Stop offset="1" stopColor="#486B8E"/></LinearGradient><LinearGradient id={id+'veil'} x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#F4F3FF" stopOpacity={0}/><Stop offset=".5" stopColor="#EFFBFF" stopOpacity={.3}/><Stop offset="1" stopColor="#F4F3FF" stopOpacity={0}/></LinearGradient></Defs><Rect width={400} height={800} fill={`url(#${id})`}/><Path d="M-120 800 L220 0 L370 0 L20 800 Z M150 800 L390 100 L470 100 L260 800 Z" fill={`url(#${id}veil)`}/>{Array.from({length:35},(_,i)=><Circle key={i} cx={(i*137+27)%400} cy={(i*193+31)%800} r={i%7===0?2.5:1} fill="#F5F5FF" opacity={.25+(i%3)*.17}/>)}</Svg></Animated.View>;
}

export function AmbientV2({night=false}:{night?:boolean}){
 const active=useActiveMotion(),time=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  time.setValue(0);if(!active)return;
  const loop=Animated.loop(Animated.timing(time,{toValue:1,duration:6800,easing:Easing.linear,useNativeDriver:native}));
  loop.start();return()=>loop.stop();
 },[active,time]);
 if(!active)return null;
 return <View pointerEvents="none" testID="world-particles" style={[StyleSheet.absoluteFill,{overflow:'hidden'}]}>{Array.from({length:9},(_,i)=>{
  const phase=(i%3)*.15,leaf=i===2||i===7;
  return <Animated.View key={i} testID={i===0?'pollen-motion':undefined} style={{position:'absolute',left:(7+i*11)+'%' as `${number}%`,top:(23+(i*19)%68)+'%' as `${number}%`,width:leaf?11:4,height:leaf?5:4,borderTopLeftRadius:leaf?8:4,borderBottomRightRadius:leaf?8:4,borderTopRightRadius:4,borderBottomLeftRadius:4,backgroundColor:leaf?'#C3D99B':night?'#C8F8B5':'#FFE4A0',opacity:time.interpolate({inputRange:[0,.2+phase,.55+phase,1],outputRange:[0,leaf?.55:.8,.45,0]}),transform:[{translateY:time.interpolate({inputRange:[0,1],outputRange:[12,-42-i*2]})},{translateX:time.interpolate({inputRange:[0,.5,1],outputRange:[0,i%2?14:-14,0]})},{rotate:time.interpolate({inputRange:[0,1],outputRange:[i*39+'deg',i*39+(leaf?100:0)+'deg']})}]}}/>;
 })}</View>;
}

export function RevealV2({children,delay=0}:{children:React.ReactNode;delay?:number}){
 const active=useActiveMotion(),progress=useRef(new Animated.Value(1)).current;
 useEffect(()=>{
  if(!active){progress.setValue(1);return;}
  progress.setValue(0);
  const animation=Animated.timing(progress,{toValue:1,duration:520,delay,easing:Easing.out(Easing.cubic),useNativeDriver:native});
  animation.start();return()=>animation.stop();
 },[active,delay,progress]);
 return <Animated.View testID="reward-reveal" style={{opacity:progress.interpolate({inputRange:[0,1],outputRange:[.25,1]}),transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[18,0]})},{scale:progress.interpolate({inputRange:[0,1],outputRange:[.92,1]})}]}}>{children}</Animated.View>;
}

export function RewardHaloV2({size=250}:{size?:number}){
 const id='reward'+useId().replace(/:/g,''),active=useActiveMotion(),turn=useRef(new Animated.Value(0)).current;
 useEffect(()=>{
  turn.setValue(0);if(!active)return;
  const loop=Animated.loop(Animated.timing(turn,{toValue:1,duration:24000,easing:Easing.linear,useNativeDriver:native}));
  loop.start();return()=>loop.stop();
 },[active,turn]);
 return <Animated.View pointerEvents="none" style={{position:'absolute',width:size,height:size,transform:[{rotate:turn.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']})}]}}><Svg width={size} height={size} viewBox="0 0 100 100"><Defs><RadialGradient id={id}><Stop offset="0" stopColor="#FFF3AE" stopOpacity={.65}/><Stop offset=".45" stopColor="#E2C475" stopOpacity={.22}/><Stop offset="1" stopColor="#E2C475" stopOpacity={0}/></RadialGradient></Defs><Circle cx={50} cy={50} r={49} fill={`url(#${id})`}/>{Array.from({length:10},(_,i)=><Path key={i} d="M48 46 L44 6 L56 6 L52 46 Z" fill="#FFECB4" opacity={.13} rotation={i*36} origin="50,50"/>)}<Circle cx={50} cy={50} r={39} fill="none" stroke="#F3DF9A" strokeOpacity={.35} strokeWidth={.4}/></Svg></Animated.View>;
}

export function FeatureArtV2({kind,width=150,height=120}:{kind:'camp'|'loot';width?:number;height?:number}){
 return <Image accessibilityIgnoresInvertColors source={kind==='camp'?camp:loot} resizeMode="contain" style={{width,height}}/>;
}

export function UpgradeBurstV2({level,enabled=true}:{level:number;enabled?:boolean}){
 const active=useActiveMotion(enabled),previous=useRef(level),progress=useRef(new Animated.Value(1)).current,[visible,setVisible]=useState(false);
 useEffect(()=>{
  const upgraded=level>previous.current;previous.current=level;
  if(!upgraded||!active)return;
  progress.setValue(0);setVisible(true);
  const animation=Animated.timing(progress,{toValue:1,duration:1800,easing:Easing.out(Easing.cubic),useNativeDriver:native,isInteraction:false});
  animation.start();const timer=setTimeout(()=>setVisible(false),1850);
  return()=>{clearTimeout(timer);animation.stop();};
 },[level,active,progress]);
 useEffect(()=>{if(!active)setVisible(false);},[active]);
 if(!visible)return null;
 const fade=progress.interpolate({inputRange:[0,.1,.7,1],outputRange:[0,1,.85,0]});
 return <View pointerEvents="none" testID="team-upgrade-feedback" accessibilityLabel={'Teamlevel '+level+' bereikt'} style={[StyleSheet.absoluteFill,{alignItems:'center',justifyContent:'center'}]}><Animated.View style={{position:'absolute',opacity:fade,transform:[{scale:progress.interpolate({inputRange:[0,1],outputRange:[.45,1.25]})}]}}><Svg width={170} height={170} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={40} fill="#EED78D" fillOpacity={.18} stroke="#F7DE8E" strokeWidth={1.2}/><Circle cx={50} cy={50} r={33} fill="none" stroke="#FFF1B6" strokeWidth={.5}/></Svg></Animated.View>{Array.from({length:8},(_,i)=>{const angle=i*Math.PI/4;return <Animated.View key={i} style={{position:'absolute',width:5,height:5,borderRadius:4,backgroundColor:'#FFECB1',opacity:fade,transform:[{translateX:progress.interpolate({inputRange:[0,1],outputRange:[0,Math.cos(angle)*92]})},{translateY:progress.interpolate({inputRange:[0,1],outputRange:[0,Math.sin(angle)*65-15]})}]}}/>;})}<Animated.View style={{position:'absolute',top:9,flexDirection:'row',alignItems:'center',gap:5,paddingVertical:4,paddingHorizontal:11,borderRadius:16,backgroundColor:'#173F32EE',borderWidth:1,borderColor:'#E7C66D',opacity:fade,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[12,0]})}]}}><Glyph name="power" size={23}/><Animated.Text style={{fontFamily:font,fontSize:13,fontWeight:'800',color:'#FFF1BD'}}>Level {level}</Animated.Text></Animated.View></View>;
}
