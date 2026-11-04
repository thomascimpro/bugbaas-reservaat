import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {Label,V} from './uiV2';

export type TabV2<T extends string>={id:T;emoji:string;name:string;line?:string;badge?:number};
/** Big emoji tabs (max. 4) with an optional red badge. `line` stays in the type for callers but is no longer shown (minimal text). */
export function TabsV2<T extends string>({tabs,tab,setTab,testID}:{tabs:TabV2<T>[];tab:T;setTab:(t:T)=>void;testID?:string}){

 return <View style={{gap:5}}><View testID={testID} accessibilityRole="tablist" style={{flexDirection:'row',gap:7}}>{tabs.map(t=>{const on=t.id===tab;return <Pressable key={t.id} testID={(testID??'tab')+'-'+t.id} accessibilityRole="tab" accessibilityState={{selected:on}} accessibilityLabel={t.name+(t.badge?', '+t.badge:'')} onPress={()=>setTab(t.id)} style={{flex:1,minHeight:58,alignItems:'center',justifyContent:'center',borderRadius:16,backgroundColor:on?'#1FC3D32E':'#0F2D2DEB',borderWidth:on?1.5:1,borderColor:on?'#7FE8EF':'#BFF3EC47',boxShadow:on?'0px 0px 12px #1FC3D355':undefined}}><Text style={{fontSize:25,lineHeight:30}}>{t.emoji}</Text><Label small bold>{t.name}</Label>{!!t.badge&&<View style={{position:'absolute',top:4,right:6,minWidth:21,height:21,borderRadius:11,paddingHorizontal:5,alignItems:'center',justifyContent:'center',backgroundColor:'#F0476B'}}><Label small bold>{t.badge}</Label></View>}</Pressable>;})}</View>
  </View>;
}
