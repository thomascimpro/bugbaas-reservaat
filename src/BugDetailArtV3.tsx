import React from 'react';
import {Image,StyleSheet,View} from 'react-native';
import Svg,{Circle,Path} from 'react-native-svg';
import {movePool} from '../game/goV2';
import type {Specimen} from '../game/typesV2';

// Bug detail art (UX 10 Nov, PoGO-like): the photo behind a bug shows where it belongs (habitat by main type or how
// it was obtained) and turns to night when it was caught in the evening; a thin CP arc shows its level progress.
const ART={
 water:require('../assets/v2/habitats/habitat-water.webp'),lucht:require('../assets/v2/habitats/habitat-lucht.webp'),
 grond:require('../assets/v2/habitats/habitat-grond.webp'),weide:require('../assets/v2/habitats/habitat-weide.webp'),
 donker:require('../assets/v2/habitats/habitat-donker.webp'),vuur:require('../assets/v2/habitats/habitat-vuur.webp'),
 arena:require('../assets/v3/arcade/arena.webp'),
} as const;
// Habitat photos: assets/v2/habitats (source.json). New ones only need an entry here and a rule in bugHabitat.
type Habitat=keyof typeof ART;
export function bugHabitat(s:Specimen):Habitat{
 if(s.source==='raid'||s.catchLocation?.boss)return 'arena';
 const t=movePool(s.species).types;
 if(t.includes('water'))return 'water';
 if(t.includes('fire'))return 'vuur';
 if(t.some(x=>x==='dark'||x==='poison'))return 'donker';
 if(t.includes('flying'))return 'lucht';
 if(t.some(x=>x==='ground'||x==='rock'||x==='steel'))return 'grond';
 return 'weide';
}
/** Local hour of the catch: 20:00–06:00 counts as night. */
export const caughtAtNight=(s:Specimen)=>{const h=new Date(s.obtainedAt).getHours();return h>=20||h<6;};

export function DetailBackdropV3({specimen}:{specimen:Specimen}){
 const night=caughtAtNight(specimen);
 return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
  <Image source={ART[bugHabitat(specimen)]} resizeMode="cover" style={{width:'100%',height:'100%'}}/>
  {night&&<View style={[StyleSheet.absoluteFill,{backgroundColor:'#0A1838',opacity:.45}]}/>}
  {/* Soft bottom fade so the sheet joins the photo calmly. */}
  <View style={{position:'absolute',left:0,right:0,bottom:0,height:'35%',backgroundColor:'#0B1F1C',opacity:.25}}/>
 </View>;
}

/** PoGO-style CP arc: thin white half circle over the bug, a dot at the current level (1–50). */
export function CpArcV3({level,width,top}:{level:number;width:number;top:number}){
 const r=width/2-10,cx=width/2,cy=r+10,f=Math.max(0,Math.min(1,(level-1)/49)),a=Math.PI*(1-f),dx=cx+Math.cos(a)*r,dy=cy-Math.sin(a)*r;
 const arc=(from:number,to:number)=>`M ${cx+Math.cos(from)*r} ${cy-Math.sin(from)*r} A ${r} ${r} 0 0 1 ${cx+Math.cos(to)*r} ${cy-Math.sin(to)*r}`;
 return <View pointerEvents="none" style={{position:'absolute',left:'50%',marginLeft:-width/2,top,width,height:cy+6}}>
  <Svg width={width} height={cy+6}>
   <Path d={arc(Math.PI,0)} stroke="#FFFFFF" strokeOpacity={.35} strokeWidth={3} fill="none" strokeLinecap="round"/>
   {f>0&&<Path d={arc(Math.PI,a)} stroke="#FFFFFF" strokeOpacity={.95} strokeWidth={3.5} fill="none" strokeLinecap="round"/>}
   <Circle cx={dx} cy={dy} r={7} fill="#FFFFFF"/><Circle cx={dx} cy={dy} r={3.5} fill="#7FB8A8"/>
  </Svg>
 </View>;
}
