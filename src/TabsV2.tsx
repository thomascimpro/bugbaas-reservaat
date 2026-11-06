import React from 'react';
import {Pressable,View} from 'react-native';
import {Glyph,Label} from './uiV2';
import type {GameIconName} from './gameUiArt';
import {FieldActivityArt,FieldArt} from './FieldArtV2';

export type TabV2<T extends string>={id:T;emoji?:string;icon?:GameIconName;name:string;line?:string;badge?:number};
/** HD game icons with an optional red badge. `line` stays in the type for callers but is no longer shown (minimal text). */
const tabIcons:Record<string,GameIconName>={gear:'itemLeaf',training:'attack',nectar:'itemHoney',me:'profile',goals:'research',friends:'friends',cards:'cards',duel:'swords',cup:'cup',daily:'research',rank:'cup',boss:'shield',machines:'gear',gym:'shield',fight:'swords',list:'compass',make:'power',sound:'sound',screen:'eye',place:'compass',posts:'compass',book:'book',pool:'book',last:'star'};
function TabArt({tab}:{tab:TabV2<string>}){return tab.id==='catch'?<FieldArt id="basic" size={32}/>:tab.id==='raid'||tab.id==='cocoons'?<FieldActivityArt id="cocoon" size={32}/>:<Glyph name={tab.icon??tabIcons[tab.id]??'info'} size={32}/>;}
export function TabsV2<T extends string>({tabs,tab,setTab,testID}:{tabs:TabV2<T>[];tab:T;setTab:(t:T)=>void;testID?:string}){

 return <View style={{gap:5}}><View testID={testID} accessibilityRole="tablist" style={{flexDirection:'row',gap:7}}>{tabs.map(t=>{const on=t.id===tab;return <Pressable key={t.id} testID={(testID??'tab')+'-'+t.id} accessibilityRole="tab" accessibilityState={{selected:on}} accessibilityLabel={t.name+(t.badge?', '+t.badge:'')} onPress={()=>setTab(t.id)} style={{flex:1,minHeight:58,alignItems:'center',justifyContent:'center',borderRadius:16,backgroundColor:on?'#1FC3D32E':'#0F2D2DEB',borderWidth:on?1.5:1,borderColor:on?'#7FE8EF':'#BFF3EC47',boxShadow:on?'0px 0px 12px #1FC3D355':undefined}}><TabArt tab={t}/><Label small bold>{t.name}</Label>{!!t.badge&&<View style={{position:'absolute',top:4,right:6,minWidth:21,height:21,borderRadius:11,paddingHorizontal:5,alignItems:'center',justifyContent:'center',backgroundColor:'#F0476B'}}><Label small bold>{t.badge}</Label></View>}</Pressable>;})}</View>
  </View>;
}
