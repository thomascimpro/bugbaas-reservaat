import React,{useContext,useEffect,useRef,useState} from 'react';
import {Animated,Easing,Platform,Pressable,Text,View} from 'react-native';
import {SpriteView} from './artV2';
import {MotionPrefs} from './uiV2';
import {playSound} from './audioV2';

// Acknowledged upgrades only; never delays or changes the upgrade command. The view only reacts to the
// confirmed species/CP in state. Evolution (P04-3, PoGO-like): the old form turns into a white silhouette that
// alternates faster and faster with the new silhouette, a light burst with rays, then the new form with
// sparkles. 1.8 s, tap to skip, static with reduced motion. Power-up: ring, pop and rising sparkles.
const native=Platform.OS!=='web';
const white=(Platform.OS==='web'?{filter:'brightness(0) invert(1) drop-shadow(0 0 10px #FFF7D6)'}:{filter:[{brightness:0},{invert:1}]}) as object;
// Alternation points (speeding up) of the silhouette swap, as fractions of the timeline.
const SWAP=[.08,.18,.27,.35,.41,.46,.5,.535,.565,.59];
const SPARKS=Array.from({length:12},(_,i)=>({a:i/12*Math.PI*2+(i%2?.2:0),d:.55+(i%3)*.12,s:i%3?14:20}));

export function BugUpgradeFxV3({id,species,shiny,cp,size,children}:{id:string;species:string;shiny:boolean;cp:number;size:number;children:React.ReactNode}){
 const reduced=useContext(MotionPrefs),previous=useRef({id,species,cp}),t=useRef(new Animated.Value(1)).current,run=useRef<Animated.CompositeAnimation|null>(null);
 const [fx,setFx]=useState<{kind:'evolve'|'power';old:string}|null>(null);
 useEffect(()=>{const before=previous.current;previous.current={id,species,cp};if(before.id!==id||reduced||before.species===species&&before.cp>=cp)return;
  const evolve=before.species!==species;setFx({kind:evolve?'evolve':'power',old:before.species});t.setValue(0);
  const animation=Animated.timing(t,{toValue:1,duration:evolve?1800:700,easing:Easing.linear,useNativeDriver:native});run.current=animation;
  const sound=evolve?setTimeout(()=>playSound('grow'),1800*.6):null;
  animation.start(({finished})=>{if(finished)setFx(null);});return()=>{animation.stop();if(sound)clearTimeout(sound);};
 },[id,species,cp,reduced]);
 const skip=()=>{run.current?.stop();t.setValue(1);setFx(null);};
 const ev=fx?.kind==='evolve',pw=fx?.kind==='power';
 // Evolution timeline layers, all driven by one value so a skip or unmount ends everything at once.
 const oldWhite=t.interpolate({inputRange:[0,.06,...SWAP,.62],outputRange:[0,1,...SWAP.map((_,i)=>i%2?1:0),0],extrapolate:'clamp'});
 const newWhite=t.interpolate({inputRange:[0,.06,...SWAP,.62,.7],outputRange:[0,0,...SWAP.map((_,i)=>i%2?0:1),1,0],extrapolate:'clamp'});
 const breathe=t.interpolate({inputRange:[0,.3,.6,.66,.78,1],outputRange:[1,1.04,.94,1.18,1,1]});
 // One stable tree: the real detail art (children, possibly 3D) keeps its slot so it never remounts.
 return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
  {ev&&<Animated.View pointerEvents="none" style={{position:'absolute',width:size*.7,height:size*.7,borderRadius:size,backgroundColor:'#FFF7D6',boxShadow:'0px 0px 60px #FFF7D6',opacity:t.interpolate({inputRange:[0,.1,.55,.64,.85],outputRange:[0,.25,.45,.95,0],extrapolate:'clamp'}),transform:[{scale:t.interpolate({inputRange:[0,.6,.66,.85],outputRange:[.6,.9,1.6,1.9],extrapolate:'clamp'})}]}}/>}
  {ev&&<Animated.View pointerEvents="none" style={{position:'absolute',width:size*1.5,height:size*1.5,alignItems:'center',justifyContent:'center',opacity:t.interpolate({inputRange:[0,.55,.64,.9],outputRange:[0,0,.85,0],extrapolate:'clamp'}),transform:[{rotate:t.interpolate({inputRange:[0,1],outputRange:['0deg','70deg']})}]}}>{Array.from({length:8},(_,i)=><View key={i} style={{position:'absolute',width:4,height:size*.75,borderRadius:2,backgroundColor:'#FFF2C4',opacity:i%2?.55:.9,transform:[{rotate:i*22.5+'deg'},{translateY:-size*.12}]}}/>)}</Animated.View>}
  {ev&&<Animated.View pointerEvents="none" style={{position:'absolute',opacity:t.interpolate({inputRange:[0,.07],outputRange:[1,0],extrapolate:'clamp'})}}><SpriteView id={fx!.old} shiny={shiny} size={size}/></Animated.View>}
  {ev&&<Animated.View pointerEvents="none" style={{position:'absolute',opacity:oldWhite,transform:[{scale:breathe}]}}><View style={white}><SpriteView id={fx!.old} size={size}/></View></Animated.View>}
  {ev&&<Animated.View pointerEvents="none" style={{position:'absolute',opacity:newWhite,transform:[{scale:breathe}]}}><View style={white}><SpriteView id={species} size={size}/></View></Animated.View>}
  <Animated.View style={{width:size,height:size,alignItems:'center',justifyContent:'center',opacity:ev?t.interpolate({inputRange:[0,.62,.7,1],outputRange:[0,0,1,1]}):1,transform:[{scale:ev?t.interpolate({inputRange:[0,.62,.74,1],outputRange:[.85,.85,1.1,1]}):pw?t.interpolate({inputRange:[0,.35,1],outputRange:[.92,1.08,1]}):1}]}}>{children}</Animated.View>
  {pw&&<Animated.View pointerEvents="none" style={{position:'absolute',width:size*.85,height:size*.85,borderRadius:size,borderWidth:3,borderColor:'#F2C14E',opacity:t.interpolate({inputRange:[0,.2,1],outputRange:[0,.85,0]}),transform:[{scale:t.interpolate({inputRange:[0,1],outputRange:[.45,1.3]})}]}}/>}
  {pw&&SPARKS.slice(0,6).map((p,i)=><Animated.Text key={'p'+i} pointerEvents="none" style={{position:'absolute',fontSize:p.s,color:'#F2C14E',left:size/2+Math.cos(p.a)*size*.28-p.s/2,top:size*.55,opacity:t.interpolate({inputRange:[0,.15,1],outputRange:[0,1,0]}),transform:[{translateY:t.interpolate({inputRange:[0,1],outputRange:[0,-size*(.35+p.d*.3)]})}]}}>✦</Animated.Text>)}
  {ev&&SPARKS.map((p,i)=><Animated.View key={'e'+i} pointerEvents="none" style={{position:'absolute',left:size/2-p.s/2,top:size/2-p.s/2,opacity:t.interpolate({inputRange:[0,.64,.72,1],outputRange:[0,0,1,0],extrapolate:'clamp'}),transform:[{translateX:t.interpolate({inputRange:[0,.64,1],outputRange:[0,0,Math.cos(p.a)*size*p.d],extrapolate:'clamp'})},{translateY:t.interpolate({inputRange:[0,.64,1],outputRange:[0,0,Math.sin(p.a)*size*p.d],extrapolate:'clamp'})},{scale:t.interpolate({inputRange:[0,.64,.75,1],outputRange:[.4,.4,1.2,.6],extrapolate:'clamp'})}]}}><Text style={{fontSize:p.s,color:i%3?'#FFF2C4':'#6BEFF2'}}>✦</Text></Animated.View>)}
  {ev&&<Pressable testID="evolution-fx" accessibilityRole="button" accessibilityLabel="Evolutie overslaan" onPress={skip} style={{position:'absolute',left:0,top:0,width:size,height:size}}/>}
 </View>;
}
