import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {font} from '../uiV2';
import {ArcadeIcon} from './ArcadeArtV3';

export type MainTabV3='map'|'arcade'|'bugs'|'battle';
export const MAIN_TAB_HEIGHT=72;
const tabs=[{id:'map',label:'Kaart'},{id:'arcade',label:'Arcade'},{id:'bugs',label:'Bugs'},{id:'battle',label:'Strijd'}] as const;

/** The host owns navigation and safe-area; atlas names come from assets/v3/arcade/source.json. */
export function MainTabsV3({active,onChange}:{active:MainTabV3;onChange:(tab:MainTabV3)=>void}){
 return <View testID="main-tabs" accessibilityRole="tablist" style={{height:MAIN_TAB_HEIGHT,flexDirection:'row',backgroundColor:'#071e1bf5',borderTopWidth:1,borderColor:'#bdd0c74d',paddingHorizontal:6,paddingVertical:4}}>{tabs.map(tab=>{const selected=active===tab.id;return <Pressable key={tab.id} testID={'main-tab-'+tab.id} accessibilityRole="tab" accessibilityLabel={tab.label} accessibilityState={{selected}} onPress={()=>onChange(tab.id)} style={({pressed})=>({flex:1,minWidth:48,minHeight:48,borderRadius:16,alignItems:'center',justifyContent:'center',gap:1,backgroundColor:selected?'#32dce719':'transparent',opacity:pressed?.75:1})}><ArcadeIcon name={tab.id} size={32}/><Text style={{fontFamily:font,fontSize:12,fontWeight:selected?'800':'600',color:selected?'#6beff2':'#bdd0c7'}}>{tab.label}</Text><View style={{height:3,width:22,borderRadius:2,backgroundColor:selected?'#32dce7':'transparent'}}/></Pressable>;})}</View>;
}
