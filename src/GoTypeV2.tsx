import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {movePool} from '../game/goV2';
import type {Element} from '../game/goV2';
import {effectiveness} from '../game/goBattleV2';
import {font,Glyph,Help,V,useInfo} from './uiV2';
import type {Glyph as Icon} from './uiV2';

export const GO_TYPES:Record<Element,{name:string;color:string;icon:Icon}>={
 bug:{name:'Insect',color:'#789B38',icon:'team'},flying:{name:'Vliegend',color:'#7D8FBC',icon:'itemWing'},
 poison:{name:'Gif',color:'#9A69A9',icon:'venom'},grass:{name:'Gras',color:'#4E9462',icon:'leaf'},
 ground:{name:'Grond',color:'#A58353',icon:'crush'},rock:{name:'Steen',color:'#988B58',icon:'fortify'},
 steel:{name:'Staal',color:'#708E95',icon:'shield'},dark:{name:'Duister',color:'#626176',icon:'itemMoon'},normal:{name:'Normaal',color:'#939686',icon:'star'},
 fire:{name:'Vuur',color:'#D8753D',icon:'itemSun'},
 water:{name:'Water',color:'#4A92BF',icon:'itemDew'},
};
export function GoTypeBadge({type,compact=false}:{type:Element;compact?:boolean}){
 const t=GO_TYPES[type],info=useInfo();
 const against=(strong:boolean)=>Object.keys(GO_TYPES).filter(k=>strong?effectiveness(type,[k as Element])>1:effectiveness(type,[k as Element])<1).map(k=>GO_TYPES[k as Element].name).join(', ');
 const show=()=>info.show({title:t.name,icon:t.icon,body:'Jouw aanvallen\nSterk tegen: '+(against(true)||'geen')+'.\nZwak tegen: '+(against(false)||'geen')+'.\n\nPas op voor: '+(Object.keys(GO_TYPES).filter(k=>effectiveness(k as Element,[type])>1).map(k=>GO_TYPES[k as Element].name).join(', ')||'geen extra typezwakte')+'.\nDubbele types combineren hun weerstanden. Sterk: ×1,6. Zwak: ×0,625.'});
 return <Pressable accessibilityRole="button" accessibilityLabel={'Type '+t.name} accessibilityHint="Tik of houd vast voor sterke en zwakke types" onPress={e=>{e.stopPropagation();show();}} onLongPress={e=>{e.stopPropagation();show();}} style={{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:3,minHeight:compact?27:34,paddingHorizontal:compact?5:8,paddingVertical:3,borderRadius:14,backgroundColor:t.color+'38',borderWidth:1,borderColor:t.color+'99'}}><Glyph name={t.icon} size={compact?16:20}/>{!compact&&<Text style={{fontFamily:font,fontSize:11,fontWeight:'700',color:V.ink}}>{t.name}</Text>}</Pressable>;
}
export function GoTypes({species,compact=false}:{species:string;compact?:boolean}){return <View style={{flexDirection:'row',flexWrap:'wrap',gap:4}}>{movePool(species).types.map(type=><GoTypeBadge key={type} {...{type,compact}}/>)}</View>;}
export function GoTypeHelp(){return <Help title="Types" body={'Een bug heeft één of twee types. Tik of houd een type-icoon vast voor hulp.\n\n'+Object.entries(GO_TYPES).map(([id,type])=>{const strong=Object.keys(GO_TYPES).filter(k=>effectiveness(id as Element,[k as Element])>1).map(k=>GO_TYPES[k as Element].name);return type.name+' → '+(strong.join(', ')||'geen typebonus');}).join('\n')+'\n\n→ betekent sterk tegen: ×1,6 schade. Dubbele types combineren bonussen en weerstanden. Dezelfde aanval als je eigen type krijgt ×1,2 schade. Aanval, verdediging en schilden bepalen de uiteindelijke schade.'}/>;}
