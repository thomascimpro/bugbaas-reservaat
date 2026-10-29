import React,{useId} from 'react';
import {Text,View} from 'react-native';
import Svg,{Defs,Ellipse,LinearGradient,Path,Stop} from 'react-native-svg';
import {SpriteView} from './artV2';
import {familyBase,familyColors,familyName} from './resourceGainV2';

const SIZES={small:24,large:56} as const;
/** Family nectar (candy): a two-tone drop in the family's own colours with its base bug on it. XL adds a small tag. */
export function CandyIconV2({family,size='small',xl=false}:{family:string;size?:'small'|'large'|number;xl?:boolean}){
 const px=typeof size==='number'?size:SIZES[size],c=familyColors(family),id='nectar'+useId().replace(/:/g,''),bug=familyBase(family);
 return <View accessibilityLabel={familyName(family)+(xl?' XL-nectar':'-nectar')} style={{width:px,height:px,alignItems:'center',justifyContent:'center'}}>
  <Svg width={px} height={px} viewBox="0 0 100 100"><Defs><LinearGradient id={id} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={c.main}/><Stop offset=".52" stopColor={c.main}/><Stop offset=".52" stopColor={c.stripe}/><Stop offset="1" stopColor={c.stripe}/></LinearGradient></Defs><Path d="M50 4 C62 24 86 44 86 64 A36 34 0 0 1 14 64 C14 44 38 24 50 4 Z" fill={`url(#${id})`} stroke={c.dark} strokeWidth={5}/><Ellipse cx="34" cy="48" rx="7" ry="12" fill="#FFFFFF" opacity={.55} transform="rotate(-24 34 48)"/></Svg>
  <View pointerEvents="none" style={{position:'absolute',left:px*.25,top:px*.4,width:px*.5,height:px*.5,borderRadius:px*.25,backgroundColor:'#FFFFFFC0',alignItems:'center',justifyContent:'center',overflow:'hidden'}}><SpriteView id={bug} size={px*.5}/></View>
  {xl&&<View pointerEvents="none" style={{position:'absolute',right:-px*.12,top:-px*.06,paddingHorizontal:Math.max(2,px*.06),borderRadius:px*.2,backgroundColor:'#F2A33A',borderWidth:1,borderColor:'#FFF5D8'}}><Text style={{fontSize:Math.max(8,px*.28),lineHeight:Math.max(10,px*.34),fontWeight:'900',color:'#2A1A05'}}>XL</Text></View>}
 </View>;
}
