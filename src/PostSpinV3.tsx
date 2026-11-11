import React,{useContext,useEffect,useMemo,useRef,useState} from 'react';
import {Animated,Easing,Image,PanResponder,Platform,Text,View} from 'react-native';
import {MotionPrefs} from './uiV2';

// Swipe-to-spin insect post (PoGO photo disc). The medallion is a Blender turntable: 16 frames of one full turn in a
// 4×4 sheet (assets/v2/props/post-spin.webp, built by build_props.py `postspin` + scripts/pack-interact-art.mjs).
// The finger drags the disc; letting go with speed asks the server for the spin (onSpin) while the disc keeps
// turning on its own and settles face-front. The server stays the referee: no loot is decided here.
const SHEET=require('../assets/v2/props/post-spin.webp'),STILL={ready:require('../assets/v2/props/post-ready.webp'),visited:require('../assets/v2/props/post-visited.webp')};
const FRAMES=16,GRID=4,native=Platform.OS!=='web';
const mod=(n:number)=>((Math.round(n)%FRAMES)+FRAMES)%FRAMES;

export function PostSpinV3({size=230,ready,enabled,onSpin}:{size?:number;ready:boolean;enabled:boolean;onSpin:()=>void}){
 const reduced=useContext(MotionPrefs),[frame,setFrame]=useState(0),[moving,setMoving]=useState(false),angle=useRef(0),start=useRef(0),raf=useRef(0),live=useRef({enabled,onSpin,reduced});
 live.current={enabled,onSpin,reduced};
 const show=(a:number)=>{angle.current=a;setFrame(mod(a));};
 const stop=()=>{if(raf.current)cancelAnimationFrame(raf.current);raf.current=0;};
 // Free spin after release: ease out over `ms`, always ending on a whole turn so the emblem faces the player.
 const coast=(turns:number,dir:number,ms:number)=>{stop();const from=angle.current,to=(Math.round(from/FRAMES)+dir*turns)*FRAMES,t0=Date.now();setMoving(true);
  const step=()=>{const k=Math.min(1,(Date.now()-t0)/ms),e=1-Math.pow(1-k,3);show(from+(to-from)*e);if(k<1)raf.current=requestAnimationFrame(step);else{raf.current=0;angle.current=0;setFrame(0);setMoving(false);}};raf.current=requestAnimationFrame(step);};
 useEffect(()=>stop,[]);
 const pan=useMemo(()=>PanResponder.create({
  onStartShouldSetPanResponder:()=>true,
  onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>6&&Math.abs(g.dx)>Math.abs(g.dy),
  onPanResponderTerminationRequest:()=>false,
  onPanResponderGrant:()=>{stop();start.current=angle.current;setMoving(true);},
  onPanResponderMove:(_,g)=>show(start.current+g.dx/(size/8)),
  onPanResponderRelease:(_,g)=>{const flick=Math.abs(g.dx)>28||Math.abs(g.vx)>.3,dir=(g.dx||g.vx)<0?-1:1,{enabled:ok,onSpin:spin,reduced:calm}=live.current;
   if(flick&&ok){spin();if(calm){angle.current=0;setFrame(0);setMoving(false);}else coast(2+Math.min(2,Math.round(Math.abs(g.vx))),dir,1500);}
   else if(Math.abs(g.dx)<6&&ok){spin();if(calm)setMoving(false);else coast(2,1,1300);}  // a tap still works (simple version stays)
   else coast(0,dir,350);},
  onPanResponderTerminate:()=>coast(0,1,250),
 }),[size]);
 const sprite=moving||frame!==0,col=frame%GRID,row=Math.floor(frame/GRID);
 return <View {...pan.panHandlers} testID="post-spin" accessibilityRole="adjustable" accessibilityLabel={ready?'Veeg om de insectenpost te draaien':'Insectenpost laadt op'} style={[{width:size,height:size,alignSelf:'center',overflow:'hidden'},Platform.OS==='web'?({touchAction:'pan-y',cursor:enabled?'grab':'default',userSelect:'none'} as object):null]}>
  {sprite?<Image source={SHEET} accessibilityIgnoresInvertColors resizeMode="stretch" style={{position:'absolute',width:size*GRID,height:size*GRID,left:-col*size,top:-row*size}}/>
   :<Image source={ready?STILL.ready:STILL.visited} accessibilityIgnoresInvertColors resizeMode="contain" style={{width:size,height:size}}/>}
 </View>;
}

/** Loot floats out of the post in bubbles, one after another (PoGO stop items). Re-plays when `at` changes. */
export function LootBubblesV3({at,children}:{at:number;children:React.ReactNode[]}){
 const reduced=useContext(MotionPrefs),items=React.Children.toArray(children),values=useRef<Animated.Value[]>([]).current;
 while(values.length<items.length)values.push(new Animated.Value(reduced?1:0));
 useEffect(()=>{if(reduced){values.forEach(v=>v.setValue(1));return;}values.forEach(v=>v.setValue(0));
  const run=Animated.stagger(110,values.slice(0,items.length).map(v=>Animated.timing(v,{toValue:1,duration:520,easing:Easing.out(Easing.back(1.6)),useNativeDriver:native})));run.start();return()=>run.stop();},[at,items.length,reduced]);
 return <View testID="post-loot" style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:10}}>{items.map((child,i)=><Animated.View key={i} style={{opacity:values[i].interpolate({inputRange:[0,.25,1],outputRange:[0,1,1]}),transform:[{translateY:values[i].interpolate({inputRange:[0,1],outputRange:[-90,0]})},{scale:values[i].interpolate({inputRange:[0,1],outputRange:[.2,1]})}]}}>
  <View style={{width:74,height:74,borderRadius:37,alignItems:'center',justifyContent:'center',backgroundColor:'#DDF3FF1F',borderWidth:1.5,borderColor:'#DDF3FF8C',boxShadow:'inset 0px -6px 12px #BFF3EC33, 0px 4px 10px #00000055'}}>{child}</View>
 </Animated.View>)}</View>;
}

/** Seven-day first-post streak: filled pips up to `day`; `pending` marks today's bonus as still to collect. */
export function PostStreakV3({day,pending}:{day:number;pending:boolean}){
 return <View testID="post-streak" accessibilityLabel={pending?'Dagbonus klaar: dag '+day+' van 7':'Dagbonus gehaald: dag '+day+' van 7'} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:7,paddingHorizontal:12,borderRadius:16,backgroundColor:pending?'#1E6FE833':'#B65CF026',borderWidth:1,borderColor:pending?'#7DB4FF':'#D9A8FF',alignSelf:'center'}}>
  <Text style={{color:'#EAF6F2',fontSize:13,fontWeight:'900'}}>{pending?'Dagbonus':'Dagbonus ✓'}</Text>
  <View style={{flexDirection:'row',gap:4}}>{Array.from({length:7},(_,i)=>{const on=i<(pending?day-1:day),next=pending&&i===day-1;return <View key={i} style={{width:i===6?16:11,height:i===6?16:11,borderRadius:8,alignSelf:'center',backgroundColor:on?'#FFD15C':next?'#7DB4FF':'#FFFFFF22',borderWidth:i===6?1.5:0,borderColor:'#FFD15C'}}/>;})}</View>
  <Text style={{color:'#EAF6F2',fontSize:13,fontWeight:'800'}}>{day}/7</Text>
 </View>;
}
