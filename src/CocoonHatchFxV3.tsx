import React,{useContext,useEffect,useRef,useState} from 'react';
import {Animated,Easing,Modal,Platform,Pressable,Text,View,useWindowDimensions} from 'react-native';
import {species} from '../game/catalogV2';
import {RARITY_TIERS,bugRarity} from '../game/rarityDisplayV2';
import {SpriteView} from './artV2';
import {FieldActivityArt} from './FieldArtV2';
import {playSound} from './audioV2';
import {Button,MotionPrefs} from './uiV2';

// Cocoon hatch celebration (PR-01, PoGO-like egg hatch). Plays only after the server confirmed the hatch
// (lastHatch in state); rewards are already booked, the animation shows them. ~3.4 s: the cocoon drops in and
// swings on its thread, wobbles harder in bursts while light cracks through the silk, bursts in a flash with
// leaves and sparkles, then the bug pops out with a bounce, name, rarity and rewards. Tap = skip to the result.
// Reduced motion shows the result directly. One Animated value drives everything, so skip/unmount stop it all.
const native=Platform.OS!=='web';
const DURATION=3400,BURST=.58;
// Swing angles (deg) around the thread: calm, pause, harder, pause, frantic.
const SWING_IN=[.12,.15,.18,.21,.24,.31,.335,.36,.385,.41,.44,.47,.49,.51,.53,.55,.57];
const SWING_OUT=[0,-5,5,-4,0,0,-9,10,-8,0,0,-14,15,-16,17,-12,0];
const CRACKS=[{at:.24,x:.52,y:.58,len:.2,rot:62},{at:.41,x:.6,y:.5,len:.16,rot:-48},{at:.47,x:.55,y:.7,len:.18,rot:-70},{at:.53,x:.48,y:.46,len:.13,rot:35}];
const BITS=Array.from({length:18},(_,i)=>{const a=i/18*Math.PI*2+(i%3)*.17;return {a,d:.65+(i%4)*.14,leaf:i%3!==0,s:i%3?22:16,spin:(i%2?1:-1)*(180+i*25)};});

export type CocoonHatch={id:string;species:string;shiny:boolean;dust?:number;candy?:number};

export function CocoonHatchFxV3({hatch,cp,onClose,onView}:{hatch:CocoonHatch;cp?:number;onClose:()=>void;onView?:()=>void}){
 const reduced=useContext(MotionPrefs),t=useRef(new Animated.Value(reduced?1:0)).current,run=useRef<Animated.CompositeAnimation|null>(null),[done,setDone]=useState(reduced);
 const {height}=useWindowDimensions(),tier=bugRarity(hatch.species),color=hatch.shiny?'#F2C14E':RARITY_TIERS[tier].color,name=species(hatch.species).name,S=200,B=170;
 useEffect(()=>{if(reduced){t.setValue(1);setDone(true);return;}
  t.setValue(0);const animation=Animated.timing(t,{toValue:1,duration:DURATION,easing:Easing.linear,useNativeDriver:native});run.current=animation;
  const timers=[setTimeout(()=>playSound('grow'),DURATION*BURST),setTimeout(()=>playSound(hatch.shiny?'shiny':'reward'),DURATION*.7)];
  animation.start(({finished})=>{if(finished)setDone(true);});return()=>{animation.stop();timers.forEach(clearTimeout);};
 },[hatch.id,reduced]);
 const skip=()=>{if(done)return;run.current?.stop();t.setValue(1);setDone(true);};
 const at=(input:number[],output:number[])=>t.interpolate({inputRange:input,outputRange:output,extrapolate:'clamp'});
 const swing=t.interpolate({inputRange:SWING_IN,outputRange:SWING_OUT.map(d=>d+'deg'),extrapolate:'clamp'});
 return <Modal visible transparent animationType="none" onRequestClose={done?onClose:skip}>
  <Pressable testID="cocoon-hatch-fx" accessibilityRole="button" accessibilityLabel={done?name+' is uitgekomen':'Uitkomen overslaan'} onPress={skip} style={{flex:1,alignItems:'center',justifyContent:'center',paddingBottom:height<700?190:110}}>
   <Animated.View pointerEvents="none" style={{position:'absolute',left:0,top:0,right:0,bottom:0,backgroundColor:'#061A18F2',opacity:at([0,.05],[0,1])}}/>
   {/* Soft halo behind the cocoon/bug; grows as the hatch nears, turns to the rarity colour after the burst. */}
   <Animated.View pointerEvents="none" style={{position:'absolute',opacity:at([0,.12,.55,BURST,.66,1],[0,.5,.9,1,0,0]),transform:[{scale:at([.12,.3,.5,.56,BURST],[.8,.9,.95,1.1,1.25])}]}}><Glow size={S*1.6} color="#BFF3EC"/></Animated.View>
   <Animated.View pointerEvents="none" style={{position:'absolute',opacity:at([.6,.68,1],[0,1,.75]),transform:[{scale:at([.6,.75],[.4,1])}]}}><Glow size={S*1.7} color={color}/></Animated.View>
   {/* Light rays: start leaking just before the burst and keep turning slowly behind the bug. */}
   <Animated.View pointerEvents="none" style={{position:'absolute',width:S*2.2,height:S*2.2,alignItems:'center',justifyContent:'center',opacity:at([.5,BURST,.66,1],[0,.9,.55,.4]),transform:[{rotate:t.interpolate({inputRange:[.5,1],outputRange:['0deg','95deg'],extrapolate:'clamp'})}]}}>
    {Array.from({length:12},(_,i)=><View key={i} style={{position:'absolute',width:i%2?5:8,height:S*1.05,borderRadius:4,backgroundColor:i%2?'#FFF2C4':color,opacity:i%2?.5:.75,transform:[{rotate:i*30+'deg'},{translateY:-S*.5}]}}/>)}
   </Animated.View>
   {/* Cocoon: drops in, swings around its thread (pivot = top) while light cracks through, then pops. */}
   <Animated.View pointerEvents="none" style={{position:'absolute',width:S,height:S,opacity:at([.56,.61],[1,0]),transform:[{translateY:at([0,.08,.1,.12],[-420,14,-4,0])},{scale:at([.54,.6],[1,1.3])},{translateY:-S/2},{rotate:swing},{translateY:S/2}]}}>
    <FieldActivityArt id="cocoon" size={S}/>
    {CRACKS.map((c,i)=><Animated.View key={i} style={{position:'absolute',left:S*c.x-S*c.len/2,top:S*c.y,width:S*c.len,height:3.5,borderRadius:2,backgroundColor:'#FFF7D6',boxShadow:'0px 0px 8px #FFF2C4',opacity:at([c.at,c.at+.015],[0,1]),transform:[{rotate:c.rot+'deg'}]}}/>)}
    <Animated.View style={{position:'absolute',left:S*.36,top:S*.38,width:S*.36,height:S*.46,borderRadius:S,backgroundColor:'#FFF7D6',opacity:at([.3,.55],[0,.45])}}/>
   </Animated.View>
   {/* Burst: leaves and sparkles fly out and fall a little. */}
   {BITS.map((b,i)=><Animated.View key={i} pointerEvents="none" style={{position:'absolute',opacity:at([BURST,BURST+.02,.85,1],[0,1,1,0]),transform:[{translateX:at([BURST,1],[0,Math.cos(b.a)*S*b.d])},{translateY:at([BURST,.8,1],[0,Math.sin(b.a)*S*b.d,Math.sin(b.a)*S*b.d+S*.35])},{rotate:t.interpolate({inputRange:[BURST,1],outputRange:['0deg',b.spin+'deg'],extrapolate:'clamp'})},{scale:at([BURST,.66,1],[.3,1.15,.8])}]}}><Text style={{fontSize:b.s,color:i%2?'#FFF2C4':color}}>{b.leaf?'🍃':'✦'}</Text></Animated.View>)}
   <Animated.View pointerEvents="none" style={{position:'absolute',left:0,top:0,right:0,bottom:0,backgroundColor:'#FFFDF2',opacity:at([.55,BURST,.66],[0,.92,0])}}/>
   {/* The bug pops out with a bounce and lands on a soft shadow. */}
   <Animated.View pointerEvents="none" style={{position:'absolute',width:B*.7,height:B*.16,borderRadius:B,backgroundColor:'#00000055',marginTop:B*.98,opacity:at([.62,.72],[0,1])}}/>
   <Animated.View pointerEvents="none" style={{alignItems:'center',opacity:at([.6,.63],[0,1]),transform:[{translateY:at([.6,.68,.74,.8],[20,-34,6,0])},{scale:at([.6,.68,.74,.8],[.2,1.18,.94,1])}]}}>
    <SpriteView id={hatch.species} shiny={hatch.shiny} size={B} animate/>
   </Animated.View>
   {hatch.shiny&&Array.from({length:8},(_,i)=><Animated.Text key={'s'+i} pointerEvents="none" style={{position:'absolute',fontSize:i%2?16:24,color:'#F2C14E',opacity:at([.7,.76,1],[0,1,.6]),transform:[{translateX:Math.cos(i/8*Math.PI*2)*B*.62},{translateY:Math.sin(i/8*Math.PI*2)*B*.55},{scale:at([.7,.8,.9,1],[.3,1.3,.9,1.1])}]}}>✦</Animated.Text>)}
   {/* Result text and rewards; buttons only after the animation so a fast tap only skips. */}
   <Animated.View style={{position:'absolute',bottom:'14%',left:16,right:16,alignItems:'center',gap:8,opacity:at([.74,.82],[0,1]),transform:[{translateY:at([.74,.82],[24,0])}]}}>
    <Text style={{color:'#9DB8B2',fontSize:15,fontWeight:'800',letterSpacing:1}}>UITGEKOMEN!</Text>
    <Text style={{color:'#EAF6F2',fontSize:30,fontWeight:'900',textAlign:'center'}}>{name}{hatch.shiny?' ✦':''}</Text>
    <View style={{flexDirection:'row',gap:6,alignItems:'center'}}><Text style={{color,fontSize:16,fontWeight:'900'}}>{'★'.repeat(tier)}</Text><Text style={{color:'#EAF6F2',fontSize:14,fontWeight:'800'}}>{hatch.shiny?'Shiny · ':''}{RARITY_TIERS[tier].name}</Text></View>
    <Animated.View style={{flexDirection:'row',gap:10,marginTop:4,opacity:at([.82,.9],[0,1])}}>
     {cp!==undefined&&<Chip>CP {cp}</Chip>}<Chip>+{hatch.dust??100} ✨</Chip><Chip>+{hatch.candy??3} 🍯</Chip>
    </Animated.View>
    {done&&<View style={{flexDirection:'row',gap:10,marginTop:12}}>{onView&&<Button secondary small icon="book" onPress={onView}>Bekijk bug</Button>}<Button small onPress={onClose}>Verder</Button></View>}
   </Animated.View>
  </Pressable>
 </Modal>;
}

/** Soft round glow: stacked translucent discs give a radial falloff without gradients (works on web and native). */
function Glow({size,color}:{size:number;color:string}){return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>{[1,.8,.6,.42,.26].map(f=><View key={f} style={{position:'absolute',width:size*f,height:size*f,borderRadius:size,backgroundColor:color,opacity:.13}}/>)}</View>;}

function Chip({children}:{children:React.ReactNode}){return <View style={{paddingHorizontal:12,paddingVertical:6,borderRadius:14,backgroundColor:'#0E2828',borderWidth:1,borderColor:'#BFF3EC47'}}><Text style={{color:'#EAF6F2',fontSize:14,fontWeight:'800'}}>{children}</Text></View>;}
