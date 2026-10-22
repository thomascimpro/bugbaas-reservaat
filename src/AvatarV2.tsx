import React from 'react';
import {Pressable,View} from 'react-native';
import Svg,{Circle,Defs,Ellipse,LinearGradient,Path,Rect,Stop} from 'react-native-svg';
import {TRAINER_AVATARS,trainerPalette,type TrainerAvatar} from '../game/avatarV2';
import {Glyph,Label} from './uiV2';

export function TrainerPortrait({avatar='fern',size=180}:{avatar?:TrainerAvatar;size?:number}){
 const c=trainerPalette(avatar);
 return <View accessible accessibilityLabel={'Avonturier · '+c.name} style={{width:size,height:size,flexShrink:0}}><Svg width="100%" height="100%" viewBox="0 0 200 200">
  <Defs><LinearGradient id="rangerGround" x1="0" y1="0" x2="1" y2="1"><Stop stopColor="#54784D" stopOpacity={.45}/><Stop offset="1" stopColor="#163D34" stopOpacity={0}/></LinearGradient></Defs>
  <Circle cx="100" cy="100" r="91" fill="url(#rangerGround)"/><Circle cx="100" cy="100" r="88" fill="none" stroke={c.trim} strokeOpacity={.22}/><Ellipse cx="100" cy="181" rx="43" ry="7" fill="#091F19" opacity={.6}/>
  <Rect x="65" y="86" width="70" height="58" rx="17" fill={c.pack} stroke="#16352B" strokeWidth="3"/>
  <Path d="M82 129 L80 168 Q82 175 93 171 L101 139 L108 172 Q120 176 123 168 L119 128Z" fill="#253D38"/>
  <Path d="M80 165 Q72 175 80 180 H94 L94 169 M109 169 L109 180 H125 Q133 175 121 165" fill="#182B29" stroke="#A0B39C" strokeWidth="2"/>
  <Path d="M76 91 Q65 99 59 130 Q60 140 67 138 L82 110 M124 91 Q136 98 142 130 Q142 140 134 138 L118 110" fill={c.jacket} stroke="#233D32" strokeWidth="3"/>
  <Circle cx="65" cy="138" r="6" fill="#D4AD88"/><Circle cx="136" cy="138" r="6" fill="#D4AD88"/>
  <Path d="M86 82 Q100 77 114 82 L125 126 Q119 140 78 133 L76 98Z" fill={c.jacket} stroke="#234536" strokeWidth="3"/>
  <Path d="M94 84 L100 96 L107 84 M100 98 L100 131 M80 115 L121 115" stroke={c.trim} strokeWidth="3" fill="none"/>
  <Path d="M85 103 L92 103 L92 111 L85 111Z" fill={c.cap}/><Circle cx="116" cy="104" r="4" fill="#F4D584"/>
  <Rect x="93" y="73" width="15" height="15" rx="5" fill="#C89D79"/>
  <Ellipse cx="100" cy="61" rx="23" ry="27" fill="#DDB68E" stroke="#2E4939" strokeWidth="2"/>
  <Path d="M77 58 Q76 33 100 34 Q126 35 123 57 L114 49 L87 51 L83 65Z" fill="#453C31"/>
  <Path d="M72 48 Q75 26 100 27 Q125 27 128 48Z" fill={c.cap} stroke="#244536" strokeWidth="3"/>
  <Path d="M71 48 Q103 40 132 48 L136 54 Q98 49 74 58Z" fill={c.jacket} stroke="#244536" strokeWidth="3"/>
  <Circle cx="92" cy="64" r="2" fill="#2E3B31"/><Circle cx="108" cy="64" r="2" fill="#2E3B31"/><Path d="M95 76 Q100 79 105 75" stroke="#85694E" strokeWidth="2" fill="none" strokeLinecap="round"/>
 </Svg></View>;
}
export function AvatarChoices({value='fern',onChange,disabled=false}:{value?:TrainerAvatar;onChange:(v:TrainerAvatar)=>void;disabled?:boolean}){
 return <View accessibilityLabel="Kies je outfit" style={{flexDirection:'row',gap:8}}>{TRAINER_AVATARS.map(id=>{const c=trainerPalette(id),selected=id===value;return <Pressable key={id} accessibilityRole="button" accessibilityLabel={'Outfit '+c.name} accessibilityState={{selected,disabled}} disabled={disabled} onPress={()=>onChange(id)} style={{flex:1,minWidth:0,alignItems:'center',paddingVertical:8,gap:4,borderRadius:19,borderWidth:2,borderColor:selected?c.trim:'#72927944',backgroundColor:selected?'#365D45':'#163D33',opacity:disabled?.5:1}}><TrainerPortrait avatar={id} size={62}/><Label small>{c.name}</Label>{selected&&<View style={{position:'absolute',right:4,top:4}}><Glyph name="check" size={20}/></View>}</Pressable>;})}</View>;
}
