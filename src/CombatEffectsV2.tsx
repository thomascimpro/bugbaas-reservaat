import React,{useContext,useEffect,useRef,useState} from 'react';
import {Animated,Platform,Text,View} from 'react-native';
import Svg,{Circle,Defs,Line,Path,Polygon,RadialGradient,Stop} from 'react-native-svg';
import type {Fighter,TacticEvent} from '../game/tacticsV2';
import {SpriteView,Ground} from './artV2';
import {combatCue} from './combatFxV2';
import type {CombatCue,EffectKind} from './combatFxV2';
import {font,Glyph,Label,MotionPrefs} from './uiV2';

const COLORS:Record<EffectKind,string>={hit:'#FFE4AC',sting:'#CEED7C',burst:'#FFC969',venom:'#C18CEB',crush:'#F0BD7B',heal:'#9AF0B6',cleanse:'#9DE6F6',shield:'#8DE8DB',fortify:'#A9DCAE',switch:'#D5F1E0'};
const native=Platform.OS!=='web';

function ImpactArt({kind,size}:{kind:EffectKind;size:number}){const color=COLORS[kind],barrier=kind==='shield'||kind==='fortify',recovery=kind==='heal'||kind==='cleanse';return <Svg width={size} height={size} viewBox="0 0 100 100"><Defs><RadialGradient id={'impact-'+kind}><Stop offset="0" stopColor={color} stopOpacity={.36}/><Stop offset=".5" stopColor={color} stopOpacity={.14}/><Stop offset="1" stopColor={color} stopOpacity={0}/></RadialGradient></Defs><Circle cx={50} cy={50} r={48} fill={'url(#impact-'+kind+')'}/>
 {barrier?<><Polygon points="50,9 82,28 82,66 50,86 18,66 18,28" fill={color+'22'} stroke={color} strokeWidth={1.6}/><Polygon points="50,21 71,34 71,60 50,73 29,60 29,34" fill="none" stroke={color} strokeWidth={1}/></>:recovery?<><Circle cx={50} cy={50} r={33} fill={color+'12'} stroke={color} strokeWidth={1}/><Circle cx={50} cy={50} r={24} fill="none" stroke={color} strokeWidth={.7}/>{kind==='heal'?<Path d="M47 38 H53 V47 H62 V53 H53 V62 H47 V53 H38 V47 H47 Z" fill={color+'BB'}/>:<Path d="M29 52 Q50 22 71 49 Q48 76 29 52 M37 45 Q53 59 63 47" fill="none" stroke={color} strokeWidth={3}/>}</>:kind==='venom'?<><Circle cx={42} cy={53} r={19} fill={color+'30'}/><Circle cx={60} cy={43} r={16} fill={color+'26'}/><Circle cx={59} cy={64} r={13} fill={color+'30'}/><Path d="M50 25 Q66 47 50 51 Q34 47 50 25" fill={color+'88'}/></>:kind==='switch'?<Circle cx={50} cy={50} r={30} fill="none" stroke={color} strokeWidth={1}/>:<>
  {kind==='burst'&&<><Circle cx={50} cy={50} r={35} fill={color+'22'} stroke={color} strokeWidth={2}/><Polygon points="50,9 58,37 83,24 65,47 93,56 64,61 76,84 53,68 38,91 39,65 13,71 32,52 12,32 39,38" fill={color+'33'}/></>}
  {kind==='crush'?<><Path d="M29 24 L70 26 L78 58 L52 83 L25 59 Z" stroke={color} fill={color+'22'} strokeWidth={2}/><Path d="M55 25 L44 46 L58 52 L44 78" stroke={color} fill="none" strokeWidth={4}/></>:<><Path d={kind==='sting'?'M18 76 Q42 31 83 21 L47 58 Z':'M21 70 Q42 42 76 28 M32 79 Q53 48 84 37'} fill={kind==='sting'?color+'66':'none'} stroke={color} strokeWidth={kind==='sting'?.8:1.8} strokeLinecap="round"/><Line x1={38} y1={30} x2={63} y2={76} stroke="#FFF8DB" strokeWidth={.9}/></>}
 </>}
 </Svg>;}

export function CombatFighterArt({unit,size=130,events,stamp,side}:{unit:Fighter;size?:number;events:TacticEvent[];stamp:string;side:0|1}){
 const reduced=useContext(MotionPrefs),progress=useRef(new Animated.Value(1)).current,seen=useRef({stamp,id:unit.id}),[presentation,setPresentation]=useState<{cue:CombatCue|null;strike:boolean}|null>(null);
 useEffect(()=>{
  if(seen.current.stamp===stamp&&seen.current.id===unit.id)return;
  const replaced=seen.current.id!==unit.id;seen.current={stamp,id:unit.id};
  const cue=combatCue(events,unit.id)??(replaced?{kind:'switch' as const,damage:0,healing:0,poison:0}:null),strike=!replaced&&events.some(e=>e.kind==='damage'&&e.text!=='Gif'&&e.side!==side);
  if(!cue&&!strike)return;
  progress.stopAnimation();progress.setValue(0);setPresentation({cue,strike});
  const animation=Animated.timing(progress,{toValue:1,duration:reduced?500:760,useNativeDriver:native});animation.start();
  // Feedback expiry is independent of the simulation and never gates a command.
  const timer=setTimeout(()=>setPresentation(null),reduced?550:810);
  return ()=>{clearTimeout(timer);animation.stop();};
 // Polls and settings renders must not restart a confirmed turn.
 },[stamp,unit.id,progress]);
 useEffect(()=>{if(reduced){progress.stopAnimation();setPresentation(null);}},[reduced,progress]);
 const cue=presentation?.cue,color=COLORS[cue?.kind??'hit'],direction=side===0?1:-1,move=!reduced&&presentation?.strike,hit=!reduced&&!!cue?.damage;
 const x=progress.interpolate({inputRange:[0,.16,.33,.52,1],outputRange:move?[0,-direction*size*.03,direction*size*.16,0,0]:hit?[0,-3,3,0,0]:[0,0,0,0,0]}),y=progress.interpolate({inputRange:[0,.16,.33,.52,1],outputRange:move?[0,direction*size*.02,-direction*size*.08,0,0]:[0,0,0,0,0]}),fade=progress.interpolate({inputRange:[0,.13,.6,1],outputRange:[0,1,.9,0]}),grow=progress.interpolate({inputRange:[0,.22,1],outputRange:[.5,1,1.3]}),rise=progress.interpolate({inputRange:[0,1],outputRange:[0,-size*.22]});
 const values=cue?[...(cue.damage?[{text:'−'+cue.damage,color:'#FFF2D3'}]:[]),...(cue.healing?[{text:'+'+cue.healing,color:'#AFF5C3'}]:[]),...(cue.poison?[{text:'−'+cue.poison,color:'#E0B4FF'}]:[])]:[];
 return <View style={{width:size,height:size,alignItems:'center',opacity:unit.health?1:.35}}>
  <Animated.View style={{transform:[{translateX:x},{translateY:y}]}}><Ground size={size}/><SpriteView id={unit.species} shiny={unit.shiny} size={size} animate={!presentation}/></Animated.View>
  {!!cue&&!reduced&&<Animated.View pointerEvents="none" accessibilityLabel={'Effect: '+cue.kind} style={{position:'absolute',left:-size*.05,top:-size*.05,opacity:fade,transform:[{scale:grow}]}}><ImpactArt kind={cue.kind} size={size*1.1}/>{Array.from({length:cue.kind==='burst'?10:6},(_,i)=>{const angle=i*Math.PI*2/(cue.kind==='burst'?10:6),distance=progress.interpolate({inputRange:[0,1],outputRange:[0,Math.cos(angle)*size*.36]}),vertical=progress.interpolate({inputRange:[0,1],outputRange:[0,Math.sin(angle)*size*.36]});return <Animated.View key={i} style={{position:'absolute',left:size*.55-2,top:size*.55-2,width:cue.kind==='venom'?6:3,height:cue.kind==='crush'?9:cue.kind==='venom'?6:3,borderRadius:cue.kind==='crush'?1:8,backgroundColor:color,transform:[{translateX:distance},{translateY:vertical},{rotate:i*47+'deg'}]}}/>;})}</Animated.View>}
  {values.length>0&&<Animated.View pointerEvents="none" accessibilityLabel="Gevechtsfeedback" style={{position:'absolute',right:0,top:4,gap:2,opacity:reduced?1:fade,transform:[{translateY:reduced?0:rise}]}}>{values.map((v,i)=><Text key={i} style={{fontFamily:font,fontSize:size<120?20:25,lineHeight:size<120?24:29,includeFontPadding:false,fontWeight:'800',fontVariant:['tabular-nums'],color:v.color,textShadowColor:'#092E24',textShadowRadius:3}}>{v.text}</Text>)}</Animated.View>}
  {!!unit.poison&&<View accessibilityLabel={'Gif: '+unit.poison+' beurten'} style={{position:'absolute',left:0,bottom:5,flexDirection:'row',alignItems:'center',gap:3,paddingHorizontal:5,paddingVertical:2,borderRadius:10,backgroundColor:'#3B235BEE'}}><Glyph name="venom" size={17}/><Label small color="#F0DCFF">{unit.poison}</Label></View>}
 </View>;
}
