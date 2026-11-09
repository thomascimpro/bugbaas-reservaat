import React,{useContext,useEffect,useRef,useState} from 'react';
import {Animated,Easing,Modal,Platform,Pressable,Text,View,useWindowDimensions} from 'react-native';
import {playSound} from './audioV2';
import {MotionPrefs} from './uiV2';

// Short result moment laid over an existing result screen (battle win/lose/draw, gym captured). Purely visual:
// it appears after the server result is already on screen and fades away by itself (~1.9 s, tap = away), leaving
// the normal result panel with its numbers. Reduced motion: nothing is shown.
const native=Platform.OS!=='web';
export type ResultKind='win'|'lose'|'draw'|'capture';
const STYLE:Record<ResultKind,{color:string;sound:'win'|'lose'|'reward'}>={win:{color:'#F2C14E',sound:'win'},capture:{color:'#F2C14E',sound:'win'},draw:{color:'#9DB8B2',sound:'reward'},lose:{color:'#7F93A8',sound:'lose'}};
const CONFETTI_COLORS=['#F2C14E','#1FC3D3','#F0476B','#6BEFF2','#9BE86B','#FFF2C4'];
const BITS=Array.from({length:22},(_,i)=>({x:((i*41)%100)/100,d:(i%6)*.03,c:CONFETTI_COLORS[i%6],s:(i%2?1:-1)*(200+i*25),w:i%3?8:6,h:i%3?14:9}));

export function ResultFxV3({kind,title,subtitle,color,modal=false}:{kind:ResultKind;title:string;subtitle?:string;color?:string;modal?:boolean}){
 const reduced=useContext(MotionPrefs),t=useRef(new Animated.Value(0)).current,[gone,setGone]=useState(reduced),{width,height}=useWindowDimensions();
 const tint=color??STYLE[kind].color,happy=kind==='win'||kind==='capture';
 useEffect(()=>{if(reduced)return;const a=Animated.timing(t,{toValue:1,duration:happy?2100:1700,easing:Easing.linear,useNativeDriver:native});const sound=setTimeout(()=>playSound(STYLE[kind].sound),180);a.start(({finished})=>{if(finished)setGone(true);});return()=>{a.stop();clearTimeout(sound);};},[kind,reduced]);
 if(gone)return null;
 const at=(i:number[],o:number[])=>t.interpolate({inputRange:i,outputRange:o,extrapolate:'clamp'});
 const body=<Pressable testID={'result-fx-'+kind} accessibilityRole="button" accessibilityLabel={title} onPress={()=>setGone(true)} style={{position:'absolute',left:0,top:0,right:0,bottom:0,zIndex:50,alignItems:'center',justifyContent:'center'}}>
  <Animated.View pointerEvents="none" style={{position:'absolute',left:0,top:0,right:0,bottom:0,backgroundColor:happy?'#061A18D9':'#05100FE6',opacity:at([0,.08,.82,1],[0,1,1,0])}}/>
  {happy&&<Animated.View pointerEvents="none" style={{position:'absolute',width:520,height:520,alignItems:'center',justifyContent:'center',opacity:at([.05,.18,.8,1],[0,.75,.6,0]),transform:[{rotate:t.interpolate({inputRange:[0,1],outputRange:['0deg','50deg']})},{scale:at([.05,.25],[.4,1])}]}}>
   {Array.from({length:16},(_,i)=><View key={i} style={{position:'absolute',width:i%2?6:12,height:260,borderRadius:6,backgroundColor:i%2?'#FFF2C4':tint,opacity:i%2?.35:.6,transform:[{rotate:i*22.5+'deg'},{translateY:-130}]}}/>)}
  </Animated.View>}
  {/* Title: a slam with overshoot for a win/capture, a slow heavy drop with a small wobble for a loss. */}
  <Animated.View pointerEvents="none" style={{alignItems:'center',paddingHorizontal:22,paddingVertical:12,borderRadius:22,backgroundColor:'#0E2828',borderWidth:2,borderColor:tint,opacity:at([.06,.14,.82,1],[0,1,1,0]),transform:happy?[{scale:at([.06,.16,.22,.28],[2.6,.9,1.06,1])}]:[{translateY:at([.06,.3],[-height*.25,0])},{rotate:at([.3,.36,.42,.48],[0,-3,2,0]).interpolate({inputRange:[-3,3],outputRange:['-3deg','3deg']})}]}}>
   <Text style={{color:tint,fontSize:40,fontWeight:'900',letterSpacing:1,textShadowColor:'#00000088',textShadowOffset:{width:0,height:3},textShadowRadius:0}}>{title}</Text>
   {!!subtitle&&<Text style={{color:'#EAF6F2',fontSize:15,fontWeight:'800',marginTop:2}}>{subtitle}</Text>}
  </Animated.View>
  {happy&&<Animated.View pointerEvents="none" style={{position:'absolute',left:0,top:0,right:0,bottom:0,backgroundColor:'#FFF7D6',opacity:at([.12,.16,.3],[0,.6,0])}}/>}
  {happy&&BITS.map((c,i)=><Animated.View key={i} pointerEvents="none" style={{position:'absolute',top:-20,left:c.x*width,width:c.w,height:c.h,borderRadius:2,backgroundColor:c.c,opacity:at([.15+c.d,.2+c.d,.85,1],[0,1,1,0]),transform:[{translateY:at([.15+c.d,1],[0,height*.85])},{rotate:t.interpolate({inputRange:[.15,1],outputRange:['0deg',c.s+'deg'],extrapolate:'clamp'})}]}}/>)}
  {/* Loss: a few grey "puff" clouds so it reads as a setback, not a punishment. */}
  {kind==='lose'&&[-1,1].map(s=><Animated.Text key={s} pointerEvents="none" style={{position:'absolute',fontSize:34,opacity:at([.28,.36,.7,.9],[0,.8,.6,0]),transform:[{translateX:at([.28,.9],[s*70,s*120])},{translateY:at([.28,.9],[30,-10])}]}}>💨</Animated.Text>)}
 </Pressable>;
 return modal?<Modal visible transparent animationType="none" onRequestClose={()=>setGone(true)}>{body}</Modal>:body;
}
