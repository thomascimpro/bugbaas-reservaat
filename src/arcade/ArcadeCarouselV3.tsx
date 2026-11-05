import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ImageBackground,PanResponder,Platform,Pressable,ScrollView,Text,View} from 'react-native';
import type {ImageSourcePropType} from 'react-native';
import {ARCADE_GAMES,type ArcadeGameId} from '../../game/arcade/games';
import {font} from '../uiV2';
import {ArcadeIcon} from './ArcadeArtV3';

export const gameBackdrops:Record<ArcadeGameId,ImageSourcePropType>={
 tap_duel:require('../../assets/v3/arcade/trail.webp'),
 nest_defense:require('../../assets/v3/arcade/nest.webp'),
 web_runner:require('../../assets/v3/original/runner/web-runner-tunnel-v1.jpg'),
 bug_glide:require('../../assets/v3/arcade/canopy.webp'),
 butterfly_catch:require('../../assets/v3/arcade/canopy.webp'),
 bug_tower:require('../../assets/v3/original/tower/bug-tower-background.jpg'),
 bubble_swarm:require('../../assets/v3/original/bubble/bubble-swarm-background.jpg'),
};
const hints:Record<ArcadeGameId,string>={tap_duel:'Tik bugs · maak combo’s',nest_defense:'Bouw torens · bescherm het nest',web_runner:'Wissel baan · spring over webben',bug_glide:'Tik om te vliegen · ontwijk',butterfly_catch:'Volg de bug · zwaai je net',bug_tower:'Vasthouden · loslaten · landen',bubble_swarm:'Richt · maak drie dezelfde'};
export function ArcadeCarouselV3({game,onChange,compact,reduced}:{game:ArcadeGameId;onChange:(id:ArcadeGameId)=>void;compact:boolean;reduced:boolean}){
 const scroll=useRef<ScrollView>(null),[width,setWidth]=useState(0),index=ARCADE_GAMES.findIndex(g=>g.id===game),dragging=useRef(false),webDragging=useRef(false);
 useEffect(()=>{if(width&&!dragging.current)scroll.current?.scrollTo({x:index*width,animated:!reduced});},[index,width,reduced]);
 const move=(by:number)=>onChange(ARCADE_GAMES[(index+by+ARCADE_GAMES.length)%ARCADE_GAMES.length].id);
 const mouseSwipe=useMemo(()=>PanResponder.create({
  onMoveShouldSetPanResponderCapture:(_,g)=>Platform.OS==='web'&&Math.abs(g.dx)>12&&Math.abs(g.dx)>Math.abs(g.dy)*1.5,
  onPanResponderGrant:()=>{dragging.current=true;webDragging.current=true;},
  onPanResponderMove:(_,g)=>scroll.current?.scrollTo({x:Math.max(0,Math.min((ARCADE_GAMES.length-1)*width,index*width-g.dx)),animated:false}),
  onPanResponderRelease:(_,g)=>{dragging.current=false;webDragging.current=false;const next=Math.max(0,Math.min(ARCADE_GAMES.length-1,index+(g.dx<-40?1:g.dx>40?-1:0)));onChange(ARCADE_GAMES[next].id);scroll.current?.scrollTo({x:next*width,animated:!reduced});},
  onPanResponderTerminate:()=>{dragging.current=false;webDragging.current=false;scroll.current?.scrollTo({x:index*width,animated:!reduced});},
  onPanResponderTerminationRequest:()=>false,
 }),[index,width,onChange,reduced]);
 return <View testID="arcade-carousel" {...(Platform.OS==='web'?mouseSwipe.panHandlers:{})} onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={{height:compact?140:260,minWidth:0,...(Platform.OS==='web'?{touchAction:'pan-y'} as any:{})}}>
  {!!width&&<ScrollView ref={scroll} horizontal pagingEnabled bounces={false} showsHorizontalScrollIndicator={false} onScrollBeginDrag={()=>{dragging.current=true;}} onMomentumScrollEnd={e=>{if(webDragging.current||!dragging.current)return;dragging.current=false;onChange(ARCADE_GAMES[Math.max(0,Math.min(ARCADE_GAMES.length-1,Math.round(e.nativeEvent.contentOffset.x/width)))].id);}} scrollEventThrottle={32}>
   {ARCADE_GAMES.map((g,i)=><View key={g.id} testID={'arcade-card-'+g.id} accessibilityElementsHidden={i!==index} importantForAccessibility={i!==index?'no-hide-descendants':'auto'} aria-hidden={i!==index} style={{width,height:compact?140:260,paddingHorizontal:12,...(Platform.OS==='web'?{scrollSnapAlign:'start'} as any:{})}}>
    <ImageBackground source={gameBackdrops[g.id]} resizeMode="cover" imageStyle={{borderRadius:22}} style={{flex:1,borderRadius:22,overflow:'hidden',justifyContent:'flex-end',borderWidth:1,borderColor:'#BFF3EC47'}}>
     <View style={{backgroundColor:'#071E1BE6',paddingHorizontal:30,paddingVertical:8,gap:3}}><Text numberOfLines={1} style={{fontFamily:font,fontSize:compact?22:28,fontWeight:'800',color:'#EAF6F2',textAlign:'center'}}>{g.name}</Text><Text numberOfLines={2} style={{fontFamily:font,fontSize:12,color:'#C1D8D1',textAlign:'center'}}>{hints[g.id]}</Text></View>
    </ImageBackground>
   </View>)}
  </ScrollView>}
  <Pressable accessibilityRole="button" accessibilityLabel="Vorig spel" onPress={()=>move(-1)} style={{position:'absolute',left:18,top:'38%',width:44,height:44,borderRadius:22,backgroundColor:'#0E2828EF',borderWidth:1,borderColor:'#BFF3EC66',alignItems:'center',justifyContent:'center'}}><ArcadeIcon atlas="controls" name="back" size={24}/></Pressable>
  <Pressable accessibilityRole="button" accessibilityLabel="Volgend spel" onPress={()=>move(1)} style={{position:'absolute',right:18,top:'38%',width:44,height:44,borderRadius:22,backgroundColor:'#0E2828EF',borderWidth:1,borderColor:'#BFF3EC66',alignItems:'center',justifyContent:'center',transform:[{rotate:'180deg'}]}}><ArcadeIcon atlas="controls" name="back" size={24}/></Pressable>
  <View pointerEvents="none" accessibilityLabel={(index+1)+' van '+ARCADE_GAMES.length} style={{position:'absolute',alignSelf:'center',top:8,flexDirection:'row',gap:5,padding:7,borderRadius:12,backgroundColor:'#071E1BCC'}}>{ARCADE_GAMES.map((g,i)=><View key={g.id} style={{width:i===index?16:5,height:5,borderRadius:3,backgroundColor:i===index?'#6BEFF2':'#BDD0C766'}}/>)}</View>
 </View>;
}
