import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {Label,V} from './uiV2';

export type TabV2<T extends string>={id:T;emoji:string;name:string;line?:string;badge?:number};
/** Big emoji tabs (max. 4) with an optional red badge and one short line under them that says what the open tab is for. */
export function TabsV2<T extends string>({tabs,tab,setTab,testID}:{tabs:TabV2<T>[];tab:T;setTab:(t:T)=>void;testID?:string}){
 const open=tabs.find(t=>t.id===tab);
 return <View style={{gap:5}}><View testID={testID} accessibilityRole="tablist" style={{flexDirection:'row',gap:7}}>{tabs.map(t=>{const on=t.id===tab;return <Pressable key={t.id} testID={(testID??'tab')+'-'+t.id} accessibilityRole="tab" accessibilityState={{selected:on}} accessibilityLabel={t.name+(t.badge?', '+t.badge:'')} onPress={()=>setTab(t.id)} style={{flex:1,minHeight:62,alignItems:'center',justifyContent:'center',borderRadius:20,backgroundColor:on?'#3D6446':'#1B4A3F',borderWidth:2,borderColor:on?'#ECD289':'#FFFFFF22'}}><Text style={{fontSize:25,lineHeight:30}}>{t.emoji}</Text><Label small bold>{t.name}</Label>{!!t.badge&&<View style={{position:'absolute',top:4,right:6,minWidth:21,height:21,borderRadius:11,paddingHorizontal:5,alignItems:'center',justifyContent:'center',backgroundColor:'#D7645F'}}><Label small bold>{t.badge}</Label></View>}</Pressable>;})}</View>
  {!!open?.line&&<Label small center color={V.muted}>{open.line}</Label>}</View>;
}
