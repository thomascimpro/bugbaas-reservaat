import React,{useId} from 'react';
import {Pressable,StyleSheet,Text,View,type StyleProp,type ViewStyle} from 'react-native';
import Svg,{Defs,LinearGradient,Rect,Stop} from 'react-native-svg';
import {font,Glyph} from './uiV2';
import type {GameIconName} from './gameUiArt';

/** Glass look of Codex' preview boards (../bugbaas-creatorpakket-20261102/previews, docs/PLAN_NAAR_PREVIEWS.md): HD scene,
 * dark teal glass panels with a thin light rim, one cyan pill per screen, light text. The `teal*` names stay for existing callers;
 * they are the cyan accent now. `surface` = glass panel, `white` = text/icons on a pill. */
export const PO={teal:'#1FC3D3',tealLight:'#6BEFF2',tealDark:'#0B8EA2',tealText:'#7FE8EF',text:'#EAF6F2',muted:'#9DB8B2',line:'#FFFFFF1F',bg:'#0B2224',surface:'#0F2D2DEB',rim:'#BFF3EC47',white:'#FFFFFF',raid:'#F0476B',raidLight:'#FF8A7A',raidDark:'#C02F52',gold:'#F2C14E'};
const shadow='0px 4px 14px #00000066';

/** The one big action of a screen. `raid` = red, `ghost` = glass with a cyan rim for a second choice. */
export function PoPill({label,icon,onPress,variant='teal',disabled=false,height=58,right,testID,accessibilityLabel}:{label:string;icon?:GameIconName;onPress:()=>void;variant?:'teal'|'raid'|'ghost';disabled?:boolean;height?:number;right?:React.ReactNode;testID?:string;accessibilityLabel?:string}){
 const id='po'+useId().replace(/:/g,''),ghost=variant==='ghost',[a,b,edge]=variant==='raid'?[PO.raidLight,PO.raid,PO.raidDark]:[PO.tealLight,PO.teal,PO.tealDark];
 return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel??label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>({height,borderRadius:height/2,overflow:'hidden',justifyContent:'center',backgroundColor:ghost?PO.surface:b,borderWidth:ghost?1.5:0,borderColor:PO.tealText+'99',borderBottomWidth:ghost?1.5:4,borderBottomColor:ghost?PO.tealText+'99':edge,opacity:disabled?.45:1,transform:[{translateY:pressed?2:0}],boxShadow:ghost?undefined:'0px 0px 18px '+b+'66'})}>
  {!ghost&&<Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none"><Defs><LinearGradient id={id} x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor={a}/><Stop offset="1" stopColor={b}/></LinearGradient></Defs><Rect width="100%" height="100%" fill={`url(#${id})`}/></Svg>}
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:right?'space-between':'center',gap:10,paddingLeft:right?22:14,paddingRight:right?8:14}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:8,flexShrink:1}}>{icon&&<Glyph name={icon} size={height*.5}/>}<Text numberOfLines={1} style={{fontFamily:font,fontSize:height>=62?21:18,fontWeight:'800',letterSpacing:.6,color:ghost?PO.tealText:PO.white,textShadowColor:ghost?undefined:'#063B4566',textShadowOffset:{width:0,height:1},textShadowRadius:2}}>{label}</Text></View>
   {right&&<View style={{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#00000026',borderRadius:20,paddingHorizontal:10,paddingVertical:5}}>{right}</View>}
  </View>
 </Pressable>;
}

/** Round glass button with a thin light rim (map controls, close, small menu choices). `ring` adds a coloured ring. */
export function PoCircle({size=48,onPress,label,children,ring,style,testID}:{size?:number;onPress?:()=>void;label:string;children:React.ReactNode;ring?:string;style?:StyleProp<ViewStyle>;testID?:string}){
 const base:ViewStyle={width:size,height:size,borderRadius:size/2,backgroundColor:PO.surface,borderWidth:1,borderColor:PO.rim,alignItems:'center',justifyContent:'center',overflow:'hidden',boxShadow:(ring?'0px 0px 0px 2.5px '+ring+', 0px 0px 14px '+ring+'55, ':'')+shadow};
 return onPress?<Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({pressed})=>[base,style,pressed&&{transform:[{scale:.93}]}]}>{children}</Pressable>:<View testID={testID} accessibilityLabel={label} style={[base,style]}>{children}</View>;
}

/** Round icon + short name under it (e.g. Beker / Dag / Rang). */
export function PoChoice({icon,label,onPress,badge,size=70,testID}:{icon:GameIconName;label:string;onPress:()=>void;badge?:number;size?:number;testID?:string}){
 return <View style={{alignItems:'center',gap:6}}><PoCircle testID={testID} size={size} label={label} onPress={onPress}><Glyph name={icon} size={size*.68}/></PoCircle>{!!badge&&<View pointerEvents="none" style={{position:'absolute',right:-2,top:-2,minWidth:22,height:22,borderRadius:11,paddingHorizontal:5,backgroundColor:PO.raid,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:PO.bg}}><Text style={{fontFamily:font,color:PO.white,fontSize:11,fontWeight:'800'}}>{badge}</Text></View>}<Text style={{fontFamily:font,fontSize:13,fontWeight:'700',color:PO.text}}>{label}</Text></View>;
}

/** Glass sheet with rounded top that sits over a big HD picture. */
export function PoSheet({children,style}:{children:React.ReactNode;style?:StyleProp<ViewStyle>}){
 return <View style={[{backgroundColor:'#0F2D2D',borderTopLeftRadius:26,borderTopRightRadius:26,borderWidth:1,borderBottomWidth:0,borderColor:PO.rim,paddingHorizontal:22,paddingTop:22,gap:14,boxShadow:'0px -6px 24px #00000055'},style]}>{children}</View>;
}

/** Centered ✕ with a cyan ring. */
export function PoClose({onPress,label='Sluiten'}:{onPress:()=>void;label?:string}){
 return <PoCircle size={56} label={label} onPress={onPress} ring={PO.teal}><Text style={{fontFamily:font,fontSize:24,fontWeight:'700',color:PO.tealText}}>✕</Text></PoCircle>;
}

/** Thin HP / progress bar. */
export function PoBar({value,max,width='100%',color=PO.teal}:{value:number;max:number;width?:number|`${number}%`;color?:string}){
 return <View style={{width,height:9,borderRadius:5,backgroundColor:'#FFFFFF1F',overflow:'hidden'}}><View style={{width:`${Math.max(0,Math.min(100,max>0?value/max*100:0))}%`,height:'100%',borderRadius:5,backgroundColor:color}}/></View>;
}

export const poText={title:{fontFamily:font,fontSize:28,fontWeight:'700' as const,color:PO.text},big:{fontFamily:font,fontSize:20,fontWeight:'700' as const,color:PO.text},label:{fontFamily:font,fontSize:11,fontWeight:'600' as const,letterSpacing:.8,color:PO.muted},onPhoto:{fontFamily:font,color:PO.white,textShadowColor:'#0008',textShadowOffset:{width:0,height:2},textShadowRadius:8}};
