import React from 'react';
import {Image,Pressable,Text,View} from 'react-native';
import type {ImageSourcePropType} from 'react-native';
import {font} from '../uiV2';
const metadata=require('../../assets/v3/arcade/source.json') as {files:{file:string;width?:number;height?:number;regions?:{name:string;rect:number[];anchor:number[]}[]}[]};
const atlases={navigation:require('../../assets/v3/arcade/navigation.webp'),controls:require('../../assets/v3/arcade/controls.webp'),types:require('../../assets/v3/arcade/types.webp'),fx:require('../../assets/v3/arcade/fx.webp'),'fx-extra':require('../../assets/v3/arcade/fx-extra.webp'),'fx-last':require('../../assets/v3/arcade/fx-last.webp')};
export const arcadeImages={arena:require('../../assets/v3/arcade/arena.webp'),trail:require('../../assets/v3/arcade/trail.webp'),logo:require('../../assets/v3/arcade/logo.webp'),dragonfly:require('../../assets/v3/arcade/dragonfly.webp'),beetle:require('../../assets/v3/arcade/stag-beetle.webp')};
export const enemyImages:ImageSourcePropType[]=[require('../../assets/v2/illustrations/aphid.webp'),require('../../assets/v2/illustrations/leafbeetle.webp'),require('../../assets/v3/arcade/stag-beetle.webp'),require('../../assets/v3/arcade/firefly.webp')];
export function ArcadeIcon({atlas='navigation',name,size=32}:{atlas?:keyof typeof atlases;name:string;size?:number}){
 const sheet=metadata.files.find(x=>x.file===atlas+'.webp')!,r=sheet.regions?.find(r=>r.name===name);if(!r)return null;
 const [x,y,w,h]=r.rect,scale=Math.min(size/w,size/h);
 return <View pointerEvents="none" accessible={false} style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}><View style={{width:w*scale,height:h*scale,overflow:'hidden'}}><Image source={atlases[atlas]} resizeMode="stretch" style={{position:'absolute',width:sheet.width!*scale,height:sheet.height!*scale,left:-x*scale,top:-y*scale}}/></View></View>;
}
export function ArcadeButton({label,onPress,disabled=false,icon='play',compact=false}:{label:string;onPress:()=>void;disabled?:boolean;icon?:string;compact?:boolean}){
 return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({pressed})=>({minHeight:compact?48:62,paddingHorizontal:18,paddingVertical:8,borderRadius:compact?18:28,flexDirection:'row',gap:9,alignItems:'center',justifyContent:'center',backgroundColor:compact?'#10372ef5':'#32dce7',borderColor:compact?'#7fa997':'#b2fcff',borderWidth:1,opacity:disabled?.45:pressed?.8:1,boxShadow:compact?undefined:'0px 4px 20px #12dce744'})}><ArcadeIcon atlas="controls" name={icon} size={compact?25:34}/><Text style={{fontFamily:font,fontSize:compact?15:23,fontWeight:'800',color:compact?'#f4f1e6':'#052825'}}>{label}</Text></Pressable>;
}
