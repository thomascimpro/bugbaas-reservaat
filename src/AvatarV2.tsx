import React from 'react';
import {Image,Pressable,View} from 'react-native';
import {OUTFITS,TRAINER_AVATARS,trainerPalette,type OutfitId,type TrainerAvatar} from '../game/avatarV2';
import {Glyph,Label} from './uiV2';

// Mini Characters portraits are rendered from the map models by scripts/render-trainer-portraits.mjs.
const PORTRAITS:Record<TrainerAvatar,number>={fern:require('../assets/v2/trainers/fern-ranger-v1.webp'),amber:require('../assets/v2/trainers/amber-ranger-v1.webp'),tidal:require('../assets/v2/trainers/tidal-ranger-v1.webp'),
 female_a:require('../assets/v2/trainers/mini-female-a-v1.webp'),female_b:require('../assets/v2/trainers/mini-female-b-v1.webp'),female_c:require('../assets/v2/trainers/mini-female-c-v1.webp'),female_d:require('../assets/v2/trainers/mini-female-d-v1.webp'),female_e:require('../assets/v2/trainers/mini-female-e-v1.webp'),female_f:require('../assets/v2/trainers/mini-female-f-v1.webp'),
 male_a:require('../assets/v2/trainers/mini-male-a-v1.webp'),male_b:require('../assets/v2/trainers/mini-male-b-v1.webp'),male_c:require('../assets/v2/trainers/mini-male-c-v1.webp'),male_d:require('../assets/v2/trainers/mini-male-d-v1.webp'),male_e:require('../assets/v2/trainers/mini-male-e-v1.webp'),male_f:require('../assets/v2/trainers/mini-male-f-v1.webp')};
export function TrainerPortrait({avatar='fern',outfit,size=180}:{avatar?:TrainerAvatar;outfit?:string;size?:number}){
 const c=trainerPalette(avatar,outfit),portraits=PORTRAITS;
 return <View accessible accessibilityLabel={'Avonturier · '+c.name} style={{width:size,height:size,flexShrink:0,borderRadius:size*.24,overflow:'hidden',borderWidth:2,borderColor:c.trim+'A0',backgroundColor:'#183D32'}}><Image source={portraits[avatar]??portraits.fern} resizeMode="cover" style={{width:'100%',height:'100%'}}/></View>;
}
export function AvatarChoices({value='fern',outfit,onChange,disabled=false}:{value?:TrainerAvatar;outfit?:string;onChange:(v:TrainerAvatar)=>void;disabled?:boolean}){
 // Compact 5-column grid (3 rows for 15 avatars): picture first, short name under it.
 return <View accessibilityLabel="Kies je ranger" style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:6}}>{TRAINER_AVATARS.map(id=>{const c=trainerPalette(id),selected=id===value;return <Pressable key={id} testID={'avatar-'+id} accessibilityRole="button" accessibilityLabel={'Avonturier '+c.name} accessibilityState={{selected,disabled}} disabled={disabled} onPress={()=>onChange(id)} style={{width:'19%',minWidth:0,alignItems:'center',paddingVertical:4,gap:2,borderRadius:14,borderWidth:2,borderColor:selected?c.trim:'#72927944',backgroundColor:selected?'#365D45':'#163D33',opacity:disabled?.5:1}}><TrainerPortrait avatar={id} outfit={outfit} size={46}/><Label small>{c.name}</Label>{selected&&<View style={{position:'absolute',right:1,top:1}}><Glyph name="check" size={16}/></View>}</Pressable>;})}</View>;
}
/** Six outfit colours as round swatches; the colour also dresses the 3D ranger on the map. */
export function OutfitChoices({value,onChange,disabled=false}:{value?:string;onChange:(v:OutfitId)=>void;disabled?:boolean}){
 return <View accessibilityLabel="Kies je kleur" style={{flexDirection:'row',justifyContent:'center',flexWrap:'wrap',gap:10}}>{(Object.keys(OUTFITS) as OutfitId[]).map(id=>{const o=OUTFITS[id],selected=id===value;return <Pressable key={id} testID={'outfit-'+id} accessibilityRole="button" accessibilityLabel={'Kleur '+o.name} accessibilityState={{selected,disabled}} disabled={disabled} onPress={()=>onChange(id)} style={{width:44,height:44,borderRadius:22,backgroundColor:o.jacket,borderWidth:selected?4:2,borderColor:selected?'#FFF3D5':o.trim,alignItems:'center',justifyContent:'center',transform:[{scale:selected?1.1:1}]}}>{selected&&<Glyph name="check" size={18}/>}</Pressable>;})}</View>;
}
