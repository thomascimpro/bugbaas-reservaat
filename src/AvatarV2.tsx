import React from 'react';
import {Image,Pressable,View} from 'react-native';
import {TRAINER_AVATARS,trainerPalette,type TrainerAvatar} from '../game/avatarV2';
import {Glyph,Label} from './uiV2';

export function TrainerPortrait({avatar='fern',size=180}:{avatar?:TrainerAvatar;size?:number}){
 const c=trainerPalette(avatar);
 const portraits={fern:require('../assets/v2/trainers/fern-ranger-v1.webp'),amber:require('../assets/v2/trainers/amber-ranger-v1.webp'),tidal:require('../assets/v2/trainers/tidal-ranger-v1.webp')};
 return <View accessible accessibilityLabel={'Avonturier · '+c.name} style={{width:size,height:size,flexShrink:0,borderRadius:size*.24,overflow:'hidden',borderWidth:2,borderColor:c.trim+'A0',backgroundColor:'#183D32'}}><Image source={portraits[avatar]??portraits.fern} resizeMode="cover" style={{width:'100%',height:'100%'}}/></View>;
}
export function AvatarChoices({value='fern',onChange,disabled=false}:{value?:TrainerAvatar;onChange:(v:TrainerAvatar)=>void;disabled?:boolean}){
 return <View accessibilityLabel="Kies je outfit" style={{flexDirection:'row',gap:8}}>{TRAINER_AVATARS.map(id=>{const c=trainerPalette(id),selected=id===value;return <Pressable key={id} accessibilityRole="button" accessibilityLabel={'Outfit '+c.name} accessibilityState={{selected,disabled}} disabled={disabled} onPress={()=>onChange(id)} style={{flex:1,minWidth:0,alignItems:'center',paddingVertical:8,gap:4,borderRadius:19,borderWidth:2,borderColor:selected?c.trim:'#72927944',backgroundColor:selected?'#365D45':'#163D33',opacity:disabled?.5:1}}><TrainerPortrait avatar={id} size={62}/><Label small>{c.name}</Label>{selected&&<View style={{position:'absolute',right:4,top:4}}><Glyph name="check" size={20}/></View>}</Pressable>;})}</View>;
}
