import React from 'react';
import {Image,View} from 'react-native';
import type {ArcadeGameId} from '../../game/arcade/games';
import {SpriteView} from '../artV2';
const bubbles=[require('../../assets/v3/original/bubble/bug-bubble-bee.png'),require('../../assets/v3/original/bubble/bug-bubble-beetle.png'),require('../../assets/v3/original/bubble/bug-bubble-dragonfly.png')];
/** Uses the game's real sprites, so the card previews the activity rather than an unrelated landscape. */
export const ArcadePreviewV3=React.memo(function ArcadePreviewV3({game,compact}:{game:ArcadeGameId;compact:boolean}){
 const size=compact?30:64;
 if(!['tap_duel','bubble_swarm','web_runner','butterfly_catch'].includes(game))return null;
 return <View pointerEvents="none" accessible={false} style={{position:'absolute',left:48,right:48,top:compact?27:34,bottom:compact?50:72,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
  {game==='bubble_swarm'?<View style={{gap:0,alignItems:'center'}}>{[0,1].map(row=><View key={row} style={{flexDirection:'row',marginLeft:row*size*.4}}>{[0,1,2,3,4].map((n)=><Image key={n} source={bubbles[(n+row)%3]} resizeMode="contain" style={{width:size*.8,height:size*.8}}/>)}</View>)}</View>:game==='web_runner'?<View style={{width:'100%',height:'100%',flexDirection:'row',justifyContent:'space-around',alignItems:'flex-end'}}>{['ant','beetle','moth'].map((id,i)=><View key={id} style={{width:'30%',height:'100%',borderLeftWidth:1,borderRightWidth:1,borderColor:'#BFF3EC55',backgroundColor:i===1?'#1FC3D329':'#071E1B55',alignItems:'center',justifyContent:i===1?'flex-end':'center',borderRadius:14}}><SpriteView id={id} size={size}/></View>)}</View>:<View style={{flexDirection:'row',gap:compact?2:10,alignItems:'center'}}>{(game==='butterfly_catch'?['butterfly','moth','lacewing']:['beetle','hercules','mantis']).map((id,i)=><View key={id} style={{marginTop:i===1?-8:12,alignItems:'center',padding:3,borderRadius:60,backgroundColor:'#071E1B44',borderWidth:1,borderColor:i===1?'#F2C14E99':'#BFF3EC44'}}><SpriteView id={id} size={size}/>{game==='tap_duel'&&<View style={{position:'absolute',top:1,left:8,right:8,height:4,borderRadius:3,backgroundColor:i===1?'#F2C14E':'#6BEFF2'}}/>}</View>)}</View>}
 </View>;
});
