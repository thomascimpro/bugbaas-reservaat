import React,{useEffect,useRef} from 'react';
import {Animated,Easing,Image,Platform,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import Svg,{Circle,Line,Path} from 'react-native-svg';
import {Asset} from 'expo-asset';
import {ARCADE_GAMES,type ArcadeGameId} from '../../game/arcade/games';
import {SpriteView} from '../artV2';
import {bugPortraits} from '../bugPortraitsV2';
import {bugIllustrations} from '../bugIllustrationsV2';
import {portraitThumbs} from '../portraitThumbsV2';
import {font,Glyph} from '../uiV2';
import type {GameIconName} from '../gameUiArt';
import {FieldArt} from '../FieldArtV2';
import {arcadeImages} from './ArcadeArtV3';
import {gameBackdrops} from './ArcadeCarouselV3';

const art:Record<ArcadeGameId,{bugs:string[];color:string;icon:GameIconName;hint:string}>={
 tap_duel:{bugs:['dungbeetle','hercules','mantis'],color:'#E8CB80',icon:'attack',hint:'Tik bugs · maak combo’s'},
 web_runner:{bugs:['ant','mantis','lacewing'],color:'#8FDDEB',icon:'expedition',hint:'Veeg van baan · tik om te springen'},
 nest_defense:{bugs:['ant','dungbeetle','hercules'],color:'#B4D990',icon:'shield',hint:'Bouw torens · bescherm je nest'},
 bug_glide:{bugs:['butterfly','bee','lacewing'],color:'#F3D483',icon:'itemWing',hint:'Tik links of rechts · blijf vliegen'},
 butterfly_catch:{bugs:['butterfly_elite','butterfly','lacewing'],color:'#B0DAD1',icon:'leaf',hint:'Volg de bug · tik om te vangen'},
 bug_tower:{bugs:['dungbeetle','ant','hercules'],color:'#A9CBEF',icon:'level',hint:'Houd vast · laat los om te springen'},
 bubble_swarm:{bugs:['bee','dungbeetle','lacewing'],color:'#B4C6EC',icon:'burst',hint:'Richt en laat los · maak drie gelijke'},
};
const essentials:Partial<Record<ArcadeGameId,number[]>>={
 web_runner:[require('../../assets/v3/original/runner/web_coin.png'),require('../../assets/v3/original/runner/web_gem.png'),require('../../assets/v3/original/runner/duel_effect_goo_hd.png')],
 bug_glide:[require('../../assets/v3/original/glide/Bumble Bee Sprite Sheet.png'),require('../../assets/v3/original/glide/glide_nectar.png'),require('../../assets/v3/original/glide/glide_thorn.png')],
 bug_tower:[require('../../assets/v3/original/tower/bug-tower-beetle.webp')],
 bubble_swarm:[require('../../assets/v3/original/bubble/bug-bubble-bee.png'),require('../../assets/v3/original/bubble/bug-bubble-beetle.png'),require('../../assets/v3/original/bubble/bug-bubble-dragonfly.png')],
};
/** Only this game's scene and portraits; no full seven-game download before every start. */
export async function warmArcadeGame(game:ArcadeGameId,onProgress:(n:number)=>void=()=>{}){
 const portraits=art[game].bugs.map(id=>bugIllustrations[id]?.thumb??portraitThumbs[id]?.[0]??bugPortraits[id]?.[0]);
 const sources=[...new Set([gameBackdrops[game],arcadeImages.logo,...portraits,...(essentials[game]??[])].filter(Boolean))];let done=0;onProgress(0);
 await Promise.all(sources.map(source=>Asset.loadAsync(source as number).then(()=>{onProgress(++done/sources.length);})));onProgress(1);
}

/** A designed game splash, not a spinner over a half-empty lobby. Progress is real asset progress. */
export function ArcadeLoadingV3({game,count,progress,reduced=false,scene=false}:{game?:ArcadeGameId;count?:number;progress?:number;reduced?:boolean;scene?:boolean}){
 const compact=useWindowDimensions().height<700,visual=art[game??'tap_duel'],bob=useRef(new Animated.Value(0)).current;
 useEffect(()=>{if(reduced)return;const loop=Animated.loop(Animated.sequence([Animated.timing(bob,{toValue:1,duration:1100,easing:Easing.inOut(Easing.sin),useNativeDriver:Platform.OS!=='web'}),Animated.timing(bob,{toValue:0,duration:1100,easing:Easing.inOut(Easing.sin),useNativeDriver:Platform.OS!=='web'})]));loop.start();return()=>loop.stop();},[reduced,bob]);
 const size=compact?104:150,pct=progress===undefined?undefined:Math.round(Math.max(0,Math.min(1,progress))*100);
 return <View testID="arcade-loading" accessibilityLabel={(game?ARCADE_GAMES.find(g=>g.id===game)?.name:'Willekeurig duel')+' klaarzetten'} style={{flex:1,minHeight:0,alignItems:'center',justifyContent:'center',padding:compact?14:24,gap:compact?12:18}}>
  {scene&&<View pointerEvents="none" style={StyleSheet.absoluteFillObject}><Image source={gameBackdrops[game??'butterfly_catch']} resizeMode="cover" style={{width:'100%',height:'100%'}}/><View style={[StyleSheet.absoluteFillObject,{backgroundColor:'#071E1B88'}]}/></View>}
  <Image source={arcadeImages.logo} resizeMode="contain" accessible={false} style={{width:compact?125:168,height:compact?36:46}}/>
  <Animated.View pointerEvents="none" style={{width:280,height:compact?140:200,alignItems:'center',justifyContent:'center',transform:[{translateY:bob.interpolate({inputRange:[0,1],outputRange:[0,-6]})}]}}>
   <Svg width="280" height={compact?140:200} viewBox="0 0 280 200" style={StyleSheet.absoluteFillObject}><Circle cx="140" cy="105" r="82" fill="#0E2828BB" stroke={visual.color+'66'} strokeWidth="1"/><Circle cx="140" cy="105" r="69" fill="none" stroke={visual.color+'33'} strokeDasharray="3 9"/>{game==='web_runner'?[-1,0,1].map(i=><Line key={i} x1={140+i*44} x2={140+i*70} y1="30" y2="190" stroke={visual.color} opacity=".4"/>):game==='nest_defense'?<Path d="M20 160 L80 160 L80 70 L190 70 L190 145 L260 145" fill="none" stroke={visual.color} strokeWidth="12" opacity=".25"/>:game==='bug_tower'?<Path d="M40 170 H150 M120 115 H240 M30 60 H150" fill="none" stroke={visual.color} strokeWidth="5" opacity=".6"/>:null}</Svg>
   <View style={{position:'absolute',left:6,bottom:10,transform:[{rotate:'-15deg'}]}}><SpriteView id={visual.bugs[0]} size={size*.7}/></View>
   <View style={{position:'absolute',right:6,top:12,transform:[{rotate:'12deg'}]}}><SpriteView id={visual.bugs[2]} size={size*.65}/></View>
   <SpriteView id={visual.bugs[1]} size={size}/>
  </Animated.View>
  <Text numberOfLines={1} style={{fontFamily:font,fontSize:compact?28:35,fontWeight:'800',color:'#FFF4D5',textAlign:'center',textShadowColor:'#001C18',textShadowRadius:8}}>{game?ARCADE_GAMES.find(g=>g.id===game)?.name:'Willekeurig duel'}</Text>
  <View style={{paddingHorizontal:22,paddingVertical:10,borderRadius:24,backgroundColor:'#082824E8',borderWidth:1,borderColor:visual.color+'66',alignItems:'center',gap:5}}>{game==='butterfly_catch'?<FieldArt id="basic" size={32}/>:<Glyph name={visual.icon} size={32}/>}<Text style={{fontFamily:font,fontSize:compact?13:15,fontWeight:'600',color:'#EAF6F2',textAlign:'center'}}>{visual.hint}</Text></View>
  <View style={{height:compact?50:72,alignItems:'center',justifyContent:'center',width:'80%',maxWidth:250}}>{count!==undefined?<Text testID="arcade-ready-count" accessibilityLiveRegion="polite" style={{fontFamily:font,fontSize:compact?40:54,fontWeight:'800',color:visual.color}}>{Math.max(1,count)}</Text>:<><View accessibilityRole="progressbar" accessibilityLabel={pct===undefined?'Ronde klaarzetten':'Spelbeelden laden'} {...(pct===undefined?{}:{accessibilityValue:{min:0,max:100,now:pct}})} style={{height:6,width:'100%',borderRadius:4,overflow:'hidden',backgroundColor:'#BFF3EC33'}}><Animated.View style={{height:6,borderRadius:4,backgroundColor:visual.color,...(pct===undefined?{width:'35%',transform:[{translateX:bob.interpolate({inputRange:[0,1],outputRange:[0,140]})}]}:{width:`${pct}%` as `${number}%`})}}/></View><Text style={{fontFamily:font,fontSize:12,color:'#D3E6DE',marginTop:10}}>{scene?'Wereld klaarzetten':pct===100?'Bijna klaar':pct===undefined?'Ronde klaarzetten':'Spelbeelden laden'}</Text></>}</View>
 </View>;
}
