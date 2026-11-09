import React,{useContext,useEffect,useRef} from 'react';
import {Animated,Easing,Image,Modal,Platform,Pressable,ScrollView,Text,View,useWindowDimensions} from 'react-native';
import type {ArcadeGameId} from '../../game/arcade/games';
import {ARCADE_GAMES} from '../../game/arcade/games';
import {MotionPrefs,font} from '../uiV2';
import {gameBackdrops} from './ArcadeCarouselV3';

// "Zo speel je" (UX 9 Nov): three illustrated steps per game with a looping gesture animation, the goal and the
// reward rule. Opens automatically before the very first round of a game and from the (i) button; it never changes
// the game, its controls or its scoring (texts follow each game's own help in game/arcade/original/*).
type Gesture='tap'|'combo'|'swipe'|'jump'|'hold'|'release'|'drag'|'look'|'icon';
type Step={g:Gesture;icon?:string;text:string};
export const HOW_TO:Record<ArcadeGameId,{goal:string;steps:[Step,Step,Step]}>={
 tap_duel:{goal:'Zoveel mogelijk punten in 30 seconden',steps:[{g:'tap',text:'Tik op bewegende bugs. Zeldzame bugs vragen meer tikken.'},{g:'combo',text:'Snel achter elkaar raak = combo!'},{g:'icon',icon:'🐜',text:'Je squad tikt mee en helpt je.'}]},
 web_runner:{goal:'Ren zo lang mogelijk door',steps:[{g:'swipe',text:'Veeg links of rechts om van baan te wisselen.'},{g:'jump',text:'Tik of veeg omhoog om te springen.'},{g:'icon',icon:'🍯',text:'Pak nectar, schild, magneet en boost.'}]},
 nest_defense:{goal:'Houd je nest 2,5 minuut veilig',steps:[{g:'tap',text:'Tik langs het pad om torens te bouwen.'},{g:'icon',icon:'🕸️',text:'Tik bugs weg; gebruik spray en web.'},{g:'icon',icon:'🪺',text:'Laat geen bugs bij je nest komen.'}]},
 bug_glide:{goal:'Vlieg zo ver mogelijk',steps:[{g:'tap',text:'Tik links of rechts van je bug om te sturen.'},{g:'jump',text:'Elke tik geeft een duw omhoog.'},{g:'icon',icon:'🐦',text:'Pak nectar en schild; ontwijk vogels, regen en doornen.'}]},
 butterfly_catch:{goal:'Vang zoveel mogelijk in 60 seconden',steps:[{g:'look',text:'Sleep of draai je telefoon om rond te kijken.'},{g:'hold',text:'Houd een insect 1,5 s in de vangzone.'},{g:'tap',text:'Op 100%: tik voor een netslag.'}]},
 bug_tower:{goal:'Spring zo hoog mogelijk',steps:[{g:'hold',text:'Houd links of rechts vast: rennen en sprong opladen.'},{g:'release',text:'Laat los om te springen.'},{g:'tap',text:'Tik na een salto-landing voor nog een salto.'}]},
 bubble_swarm:{goal:'Houd de zwerm tegen',steps:[{g:'drag',text:'Sleep om te richten.'},{g:'release',text:'Laat los om te schieten.'},{g:'icon',icon:'🫧',text:'Drie dezelfde bugs = weg! Bom en ijs helpen.'}]},
};
const native=Platform.OS!=='web';

function GestureBubble({step,delay}:{step:Step;delay:number}){
 const reduced=useContext(MotionPrefs),t=useRef(new Animated.Value(0)).current;
 useEffect(()=>{if(reduced)return;const loop=Animated.loop(Animated.sequence([Animated.delay(delay),Animated.timing(t,{toValue:1,duration:1400,easing:Easing.inOut(Easing.quad),useNativeDriver:native}),Animated.timing(t,{toValue:0,duration:0,useNativeDriver:native})]));loop.start();return()=>loop.stop();},[reduced]);
 const i=(o:number[],r:number[]=[0,.5,1])=>t.interpolate({inputRange:r,outputRange:o});
 const hand=step.g==='icon'?{transform:[{translateY:i([0,-8,0])},{scale:i([1,1.12,1])}]}:step.g==='tap'||step.g==='combo'?{transform:[{scale:i([1,.82,1],[0,.2,.4])}]}:step.g==='swipe'?{transform:[{translateX:i([-16,16,-16])}]}:step.g==='jump'?{transform:[{translateY:i([10,-14,10])}]}:step.g==='hold'?{transform:[{scale:i([1,.9,.9],[0,.15,1])}]}:step.g==='release'?{transform:[{translateY:i([0,0,-18],[0,.5,1])},{scale:i([.9,.9,1.1],[0,.5,1])}]}:step.g==='drag'?{transform:[{translateX:i([-12,12,12],[0,.7,1])},{translateY:i([12,-6,-6],[0,.7,1])}]}:{transform:[{rotate:t.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']})}]};
 return <View style={{width:72,height:72,borderRadius:36,backgroundColor:'#1FC3D31F',borderWidth:1.5,borderColor:'#1FC3D3',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
  {(step.g==='tap'||step.g==='combo')&&<Animated.View style={{position:'absolute',width:44,height:44,borderRadius:22,borderWidth:3,borderColor:'#6BEFF2',opacity:i([0,.9,0],[0,.2,.8]),transform:[{scale:i([.4,1.3],[0,.8])}]}}/>}
  {step.g==='hold'&&<Animated.View style={{position:'absolute',width:58,height:58,borderRadius:29,backgroundColor:'#F2C14E44',transform:[{scale:i([.2,1],[0,1])}]}}/>}
  {step.g==='combo'&&<Animated.Text style={{position:'absolute',top:4,right:6,color:'#F2C14E',fontWeight:'900',fontSize:14,opacity:i([0,1,0],[0,.4,1])}}>×3</Animated.Text>}
  <Animated.Text style={[{fontSize:34},hand]}>{step.g==='icon'?step.icon:step.g==='look'?'🔄':step.g==='swipe'?'👉':'👆'}</Animated.Text>
 </View>;
}

export function HowToPlayV3({game,onClose,onStart}:{game:ArcadeGameId;onClose:()=>void;onStart?:()=>void}){
 const info=HOW_TO[game],def=ARCADE_GAMES.find(g=>g.id===game)!,{height}=useWindowDimensions(),reduced=useContext(MotionPrefs),t=useRef(new Animated.Value(reduced?1:0)).current;
 useEffect(()=>{if(reduced)return;const a=Animated.timing(t,{toValue:1,duration:280,easing:Easing.out(Easing.cubic),useNativeDriver:native});a.start();return()=>a.stop();},[]);
 const minutes=def.durationSeconds>=120?(def.durationSeconds/60).toLocaleString('nl-NL',{maximumFractionDigits:1})+' min':def.durationSeconds+' s';
 return <Modal visible transparent animationType="none" onRequestClose={onClose}>
  <Pressable accessibilityLabel="Sluit uitleg" onPress={onClose} style={{flex:1,backgroundColor:'#020C0BCC',justifyContent:'flex-end'}}>
   <Animated.View style={{maxHeight:height*.92,transform:[{translateY:t.interpolate({inputRange:[0,1],outputRange:[height*.4,0]})}]}}>
    <Pressable testID={'how-to-'+game} onPress={()=>{}} style={{backgroundColor:'#0E2828',borderTopLeftRadius:26,borderTopRightRadius:26,borderWidth:1,borderColor:'#BFF3EC47',overflow:'hidden'}}>
     <ScrollView contentContainerStyle={{paddingBottom:22}}>
      <View style={{height:130}}><Image source={gameBackdrops[game]} resizeMode="cover" style={{width:'100%',height:'100%'}}/><View style={{position:'absolute',left:0,right:0,bottom:0,padding:14,backgroundColor:'#0E2828CC'}}><Text style={{fontFamily:font,color:'#9DB8B2',fontSize:12,fontWeight:'900',letterSpacing:1}}>ZO SPEEL JE</Text><Text style={{fontFamily:font,color:'#EAF6F2',fontSize:26,fontWeight:'900'}}>{def.name}</Text></View></View>
      <View style={{padding:16,gap:12}}>
       <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}><Chip>🎯 {info.goal}</Chip><Chip>⏱ {def.survival?'tot je valt · max '+minutes:minutes}</Chip></View>
       {info.steps.map((s,k)=><View key={k} style={{flexDirection:'row',alignItems:'center',gap:12}}><Text style={{fontFamily:font,color:'#6BEFF2',fontSize:22,fontWeight:'900',width:18}}>{k+1}</Text><GestureBubble step={s} delay={k*300}/><Text style={{flex:1,fontFamily:font,color:'#EAF6F2',fontSize:15,lineHeight:20,fontWeight:'700'}}>{s.text}</Text></View>)}
       <Text style={{fontFamily:font,color:'#F2C14E',fontSize:13,fontWeight:'800'}}>🎁 De eerste 3 rondes per dag geven stof en XP. Daarna speel je voor je record en medailles.</Text>
       <View style={{flexDirection:'row',gap:10,marginTop:4}}>
        <Pressable accessibilityRole="button" onPress={onClose} style={{flex:1,minHeight:50,borderRadius:18,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#BFF3EC66'}}><Text style={{fontFamily:font,color:'#EAF6F2',fontWeight:'800',fontSize:16}}>{onStart?'Later':'Sluiten'}</Text></Pressable>
        {onStart&&<Pressable testID="how-to-start" accessibilityRole="button" onPress={onStart} style={{flex:1.4,minHeight:50,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:'#32DCE7'}}><Text style={{fontFamily:font,color:'#052825',fontWeight:'900',fontSize:17}}>▶ Start!</Text></Pressable>}
       </View>
      </View>
     </ScrollView>
    </Pressable>
   </Animated.View>
  </Pressable>
 </Modal>;
}
function Chip({children}:{children:React.ReactNode}){return <View style={{paddingHorizontal:10,paddingVertical:5,borderRadius:12,backgroundColor:'#FFFFFF10'}}><Text style={{fontFamily:font,color:'#EAF6F2',fontSize:12,fontWeight:'800'}}>{children}</Text></View>;}
