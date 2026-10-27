import React,{useState} from 'react';
import {Pressable,View} from 'react-native';
import BugStageV2 from './BugStageV2';
import {SpriteView} from './artV2';
import {Label} from './uiV2';

// Mount the 3D canvas only on demand; scrolling a collection stays image-only.
export function CollectionArtV2({id,shiny=false,visible=true,size=220}:{id:string;shiny?:boolean;visible?:boolean;size?:number}){
 const [mode,setMode]=useState<'2D'|'3D'>('2D');
 return <View style={{width:'100%',height:'100%',alignItems:'center',justifyContent:'center'}}>
  {mode==='3D'&&visible?<View style={{position:'absolute',inset:0}}><BugStageV2 id={id} shiny={shiny}/></View>:<SpriteView id={id} shiny={shiny} silhouette={!visible} size={size} animate={visible}/>}
  {visible&&<View style={{position:'absolute',bottom:3,right:3,flexDirection:'row',padding:3,gap:2,borderRadius:20,backgroundColor:'#10382FED',borderWidth:1,borderColor:'#98B79C66'}}>{(['2D','3D'] as const).map(value=><Pressable key={value} accessibilityRole="button" accessibilityLabel={'Bekijk '+value} accessibilityState={{selected:mode===value}} onPress={()=>setMode(value)} style={{minWidth:45,minHeight:38,paddingHorizontal:10,alignItems:'center',justifyContent:'center',borderRadius:17,backgroundColor:mode===value?'#527D59':'transparent'}}><Label small bold>{value}</Label></Pressable>)}</View>}
 </View>;
}
