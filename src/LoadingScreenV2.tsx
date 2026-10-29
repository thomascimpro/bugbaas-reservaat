import React,{useContext,useEffect,useMemo,useRef,useState} from 'react';
import {Animated,Easing,Text,View,useWindowDimensions} from 'react-native';
import {Scene,SpriteView} from './artV2';
import {BrandMark} from './gameUiArt';
import {Button,MotionPrefs,Wash} from './uiV2';

const TIPS=['🗺️ Kaart klaarzetten…','🐞 Bugs wakker maken…','🥚 Cocons warm houden…','🎁 Cadeaus inpakken…','🕸️ Netten knopen…','✨ Stof verzamelen…'];
const FLYERS=['butterfly','firefly_1','bee','dragonfly_1','asianladybeetle'] as const;
const native=false;
/** Animated start screen: slow-zooming HD scene, glowing fireflies, bugs flying past, a bouncing logo and playful loading tips. Still with reduced motion. */
export function LoadingScreenV2({busy,error,onRetry}:{busy:boolean;error?:string;onRetry:()=>void}){
 const reduced=useContext(MotionPrefs),{width,height}=useWindowDimensions(),[tip,setTip]=useState(0);
 const zoom=useRef(new Animated.Value(0)).current,logo=useRef(new Animated.Value(reduced?1:0)).current,float=useRef(new Animated.Value(0)).current,bar=useRef(new Animated.Value(0)).current;
 const flies=useMemo(()=>Array.from({length:16},(_,i)=>({x:(i*61%100)/100,size:4+i%4*2,delay:i*420,duration:5200+i%5*900,value:new Animated.Value(0)})),[]);
 const bugs=useMemo(()=>FLYERS.map((id,i)=>({id,y:.12+i*.15,delay:i*2300,duration:9000+i*1300,flip:i%2===1,value:new Animated.Value(0)})),[]);
 useEffect(()=>{if(reduced)return;const loops=[
  Animated.loop(Animated.sequence([Animated.timing(zoom,{toValue:1,duration:14000,easing:Easing.inOut(Easing.sin),useNativeDriver:native}),Animated.timing(zoom,{toValue:0,duration:14000,easing:Easing.inOut(Easing.sin),useNativeDriver:native})])),
  Animated.loop(Animated.sequence([Animated.timing(float,{toValue:1,duration:1800,easing:Easing.inOut(Easing.sin),useNativeDriver:native}),Animated.timing(float,{toValue:0,duration:1800,easing:Easing.inOut(Easing.sin),useNativeDriver:native})])),
  Animated.loop(Animated.timing(bar,{toValue:1,duration:1400,easing:Easing.inOut(Easing.quad),useNativeDriver:native})),
  ...flies.map(f=>Animated.loop(Animated.sequence([Animated.delay(f.delay%3000),Animated.timing(f.value,{toValue:1,duration:f.duration,easing:Easing.linear,useNativeDriver:native}),Animated.timing(f.value,{toValue:0,duration:0,useNativeDriver:native})]))),
  ...bugs.map(b=>Animated.loop(Animated.sequence([Animated.delay(b.delay),Animated.timing(b.value,{toValue:1,duration:b.duration,easing:Easing.inOut(Easing.quad),useNativeDriver:native}),Animated.timing(b.value,{toValue:0,duration:0,useNativeDriver:native}),Animated.delay(4000)])))];
  Animated.spring(logo,{toValue:1,friction:4,tension:40,useNativeDriver:native}).start();loops.forEach(l=>l.start());
  const timer=setInterval(()=>setTip(t=>(t+1)%TIPS.length),1800);return()=>{loops.forEach(l=>l.stop());clearInterval(timer);};
 },[reduced]);
 const scale=zoom.interpolate({inputRange:[0,1],outputRange:[1.04,1.14]}),logoScale=logo.interpolate({inputRange:[0,1],outputRange:[.5,1]}),logoY=float.interpolate({inputRange:[0,1],outputRange:[0,-8]}),barX=bar.interpolate({inputRange:[0,1],outputRange:[-120,260]});
 return <View testID="loading-screen" style={{flex:1,overflow:'hidden',backgroundColor:'#0E2C25'}}>
  <Animated.View style={{position:'absolute',inset:0,transform:[{scale}]}}><Scene index={0}/></Animated.View>
  <Wash from="#0B2A2300" to="#0B2A23E6"/>
  {!reduced&&flies.map((f,i)=><Animated.View key={i} pointerEvents="none" style={{position:'absolute',left:f.x*width,top:0,width:f.size,height:f.size,borderRadius:f.size,backgroundColor:'#FFE58A',shadowColor:'#FFE58A',shadowOpacity:1,shadowRadius:8,boxShadow:'0px 0px '+(f.size*2)+'px #FFE58A',opacity:f.value.interpolate({inputRange:[0,.15,.85,1],outputRange:[0,1,1,0]}),transform:[{translateY:f.value.interpolate({inputRange:[0,1],outputRange:[height*.95,height*.2]})},{translateX:f.value.interpolate({inputRange:[0,.25,.5,.75,1],outputRange:[0,14,-10,12,0]})}]}}/>)}
  {!reduced&&bugs.map(b=><Animated.View key={b.id} pointerEvents="none" style={{position:'absolute',top:b.y*height,left:0,transform:[{translateX:b.value.interpolate({inputRange:[0,1],outputRange:b.flip?[width+60,-90]:[-90,width+60]})},{translateY:b.value.interpolate({inputRange:[0,.25,.5,.75,1],outputRange:[0,-22,6,-16,0]})},{scaleX:b.flip?-1:1}],opacity:b.value.interpolate({inputRange:[0,.05,.95,1],outputRange:[0,.9,.9,0]})}}><SpriteView id={b.id} size={58}/></Animated.View>)}
  <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:24,gap:26}}>
   <Animated.View style={{transform:[{scale:logoScale},{translateY:logoY}]}}><BrandMark width={Math.min(320,width-60)}/></Animated.View>
   {error?<View style={{alignItems:'center',gap:12,padding:16,borderRadius:22,backgroundColor:'#0B2A23CC',borderWidth:1,borderColor:'#F2D16E66'}}><Text style={{fontSize:40}}>🐛💤</Text><Text style={{color:'#FFF3D5',fontSize:16,fontWeight:'700',textAlign:'center'}}>{error}</Text>{!busy&&<Button onPress={onRetry}>Probeer opnieuw</Button>}</View>:
   <View style={{alignItems:'center',gap:12,width:260}}>
    <View accessibilityRole="progressbar" accessibilityLabel="Laden" style={{width:260,height:12,borderRadius:7,overflow:'hidden',backgroundColor:'#0B2A23AA',borderWidth:1,borderColor:'#F2D16E88'}}><Animated.View style={{position:'absolute',top:0,bottom:0,width:120,borderRadius:7,backgroundColor:'#8ECC6B',boxShadow:'0px 0px 10px #B8F08A',transform:[{translateX:reduced?70:barX}]}}/></View>
    <Text testID="loading-tip" style={{color:'#FFF3D5',fontSize:16,fontWeight:'700',textShadowColor:'#000A',textShadowRadius:4}}>{TIPS[tip]}</Text>
   </View>}
  </View>
 </View>;
}
