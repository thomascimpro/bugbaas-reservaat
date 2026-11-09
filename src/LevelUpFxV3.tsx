import React,{useContext,useEffect,useRef,useState} from 'react';
import {Animated,Easing,Modal,Platform,Pressable,Text,View,useWindowDimensions} from 'react-native';
import type {TrainerAvatar} from '../game/avatarV2';
import {TrainerPortrait} from './AvatarV2';
import {FieldArt} from './FieldArtV2';
import {playSound} from './audioV2';
import {Button,Glyph,MotionPrefs} from './uiV2';

// Trainer level-up celebration (PoGO-like). Only shown after the server accepted the level-reward claim, so the
// numbers on screen are the booked rewards. ~2.8 s: golden rays, the trainer rises, LEVEL n slams in with a
// shake and flash, confetti falls, reward chips pop in one by one. Tap = skip; reduced motion = result directly.
const native=Platform.OS!=='web';
const DURATION=2800,SLAM=.36;
const CONFETTI_COLORS=['#F2C14E','#1FC3D3','#F0476B','#6BEFF2','#9BE86B','#FFF2C4'];
const CONFETTI=Array.from({length:26},(_,i)=>({x:((i*37)%100)/100,delay:(i%7)*.035,w:i%3?8:6,h:i%3?14:9,color:CONFETTI_COLORS[i%CONFETTI_COLORS.length],sway:(i%2?1:-1)*(14+(i%5)*6),spin:(i%2?1:-1)*(240+i*30)}));

export type LevelUp={level:number;from:number;dust:number;nets:number;tm:number};

export function LevelUpFxV3({levelUp,avatar,outfit,legacy,onClose}:{levelUp:LevelUp;avatar?:TrainerAvatar;outfit?:string;legacy?:boolean;onClose:()=>void}){
 const reduced=useContext(MotionPrefs),t=useRef(new Animated.Value(reduced?1:0)).current,run=useRef<Animated.CompositeAnimation|null>(null),[done,setDone]=useState(reduced),{width,height}=useWindowDimensions();
 useEffect(()=>{if(reduced){t.setValue(1);setDone(true);return;}
  t.setValue(0);const animation=Animated.timing(t,{toValue:1,duration:DURATION,easing:Easing.linear,useNativeDriver:native});run.current=animation;
  const timers=[setTimeout(()=>playSound('win'),DURATION*SLAM),setTimeout(()=>playSound('reward'),DURATION*.6)];
  animation.start(({finished})=>{if(finished)setDone(true);});return()=>{animation.stop();timers.forEach(clearTimeout);};
 },[levelUp.level,reduced]);
 const skip=()=>{if(done)return;run.current?.stop();t.setValue(1);setDone(true);};
 const at=(input:number[],output:number[])=>t.interpolate({inputRange:input,outputRange:output,extrapolate:'clamp'});
 const short=height<700,P=short?130:170,gained=levelUp.level-levelUp.from;
 const chips:[React.ReactNode,string][]=[[<Glyph key="d" name="nectar" size={24}/>,'+'+levelUp.dust+' ✨'],[<FieldArt key="n" id="basic" size={26}/>,'+'+levelUp.nets+' netten'],...(levelUp.tm?[[<Glyph key="t" name="attack" size={24}/>,'+'+levelUp.tm+' TM'] as [React.ReactNode,string]]:[])];
 return <Modal visible transparent animationType="none" onRequestClose={done?onClose:skip}>
  <Pressable testID="level-up-fx" accessibilityRole="button" accessibilityLabel={done?'Level '+levelUp.level+' bereikt':'Level-up overslaan'} onPress={skip} style={{flex:1,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
   <Animated.View pointerEvents="none" style={{position:'absolute',left:0,top:0,right:0,bottom:0,backgroundColor:'#061A18F2',opacity:at([0,.06],[0,1])}}/>
   {/* Golden rays turning slowly behind the trainer. */}
   <Animated.View pointerEvents="none" style={{position:'absolute',top:height*.18,width:P*3.2,height:P*3.2,alignItems:'center',justifyContent:'center',opacity:at([.05,.2,1],[0,.8,.55]),transform:[{rotate:t.interpolate({inputRange:[0,1],outputRange:['0deg','60deg']})},{scale:at([.05,.3],[.5,1])}]}}>
    {Array.from({length:16},(_,i)=><View key={i} style={{position:'absolute',width:i%2?6:12,height:P*1.6,borderRadius:6,backgroundColor:i%2?'#FFF2C4':'#F2C14E',opacity:i%2?.35:.55,transform:[{rotate:i*22.5+'deg'},{translateY:-P*.8}]}}/>)}
   </Animated.View>
   {/* Trainer rises in. */}
   <Animated.View pointerEvents="none" style={{position:'absolute',top:height*.18+P*1.6-P*.55,opacity:at([.08,.2],[0,1]),transform:[{translateY:at([.08,.26,.32],[90,-8,0])}]}}>
    <TrainerPortrait legacy={legacy} avatar={avatar} outfit={outfit} size={P*1.1}/>
   </Animated.View>
   {/* LEVEL n slams in with a shake. */}
   <Animated.View pointerEvents="none" style={{position:'absolute',top:height*(short?.06:.1),alignItems:'center',opacity:at([SLAM-.06,SLAM-.02],[0,1]),transform:[{translateX:at([SLAM,SLAM+.02,SLAM+.04,SLAM+.06,SLAM+.08,SLAM+.1],[0,-9,8,-5,3,0])},{scale:at([SLAM-.06,SLAM,SLAM+.05,SLAM+.1],[3,.88,1.08,1])}]}}>
    <Text style={{color:'#FFF2C4',fontSize:20,fontWeight:'900',letterSpacing:6}}>LEVEL</Text>
    <Text style={{color:'#F2C14E',fontSize:short?72:92,lineHeight:short?78:100,fontWeight:'900',textShadowColor:'#7A4E0A',textShadowOffset:{width:0,height:4},textShadowRadius:0}}>{levelUp.level}</Text>
    {gained>1&&<Text style={{color:'#EAF6F2',fontSize:14,fontWeight:'800'}}>+{gained} levels</Text>}
   </Animated.View>
   <Animated.View pointerEvents="none" style={{position:'absolute',left:0,top:0,right:0,bottom:0,backgroundColor:'#FFF7D6',opacity:at([SLAM-.01,SLAM+.02,SLAM+.12],[0,.75,0])}}/>
   {/* Confetti falls once over the whole screen. */}
   {CONFETTI.map((c,i)=><Animated.View key={i} pointerEvents="none" style={{position:'absolute',top:-20,left:c.x*width,width:c.w,height:c.h,borderRadius:2,backgroundColor:c.color,opacity:at([SLAM+c.delay,SLAM+c.delay+.03,.9,1],[0,1,1,0]),transform:[{translateY:at([SLAM+c.delay,1],[0,height*(.75+(i%4)*.08)])},{translateX:at([SLAM+c.delay,.6,.8,1],[0,c.sway,-c.sway*.6,c.sway*.4])},{rotate:t.interpolate({inputRange:[SLAM,1],outputRange:['0deg',c.spin+'deg'],extrapolate:'clamp'})}]}}/>)}
   {/* Rewards, one by one; the button only appears after the animation so a quick tap only skips. */}
   <View style={{position:'absolute',bottom:short?'6%':'10%',left:16,right:16,alignItems:'center',gap:10}}>
    <Animated.Text style={{color:'#EAF6F2',fontSize:22,fontWeight:'900',opacity:at([.5,.56],[0,1])}}>Nieuw level bereikt!</Animated.Text>
    <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:8}}>
     {chips.map(([icon,label],i)=><Animated.View key={label} style={{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:12,paddingVertical:6,borderRadius:14,backgroundColor:'#0E2828',borderWidth:1,borderColor:'#F2C14E66',opacity:at([.56+i*.07,.6+i*.07],[0,1]),transform:[{scale:at([.56+i*.07,.62+i*.07,.66+i*.07],[.4,1.15,1])}]}}>{icon}<Text style={{color:'#EAF6F2',fontSize:14,fontWeight:'800'}}>{label}</Text></Animated.View>)}
    </View>
    {done&&<Button small onPress={onClose}>Verder</Button>}
   </View>
  </Pressable>
 </Modal>;
}
