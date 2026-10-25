import React from 'react';
import {Image,View} from 'react-native';
import Svg,{Defs,LinearGradient,Stop,Rect} from 'react-native-svg';
import {fitArt} from './uiGeometryV2';
const main=require('../assets/v2/ui/ui-main.webp'),tools=require('../assets/v2/ui/ui-tools.webp'),actions=require('../assets/v2/ui/ui-actions.webp');
const MAIN=['compass','team','swords','nectar','book','profile','friends','gear','heart','shield','leaf','star','cup','clock','gift','coin'] as const;
const TOOLS=['back','next','refresh','freeze','close','sound','eye','info','bag','level','power','research','settings','lock','check','expedition'] as const;
const ACTIONS=['attack','sting','burst','venom','crush','heal','cleanse','fortify','itemLeaf','itemThorn','itemHoney','itemWing','itemDew','itemBark','itemMoon','itemSun'] as const;
export type GameIconName=typeof MAIN[number]|typeof TOOLS[number]|typeof ACTIONS[number];
export const SKILL_ART={sting:'sting',burst:'burst',venom:'venom',crush:'crush',heal:'heal',cleanse:'cleanse',fortify:'fortify'} as const;
export const GEAR_ART={leaf:'itemLeaf',thorn:'itemThorn',honey:'itemHoney',wing:'itemWing',dew:'itemDew',bark:'itemBark',moon:'itemMoon',sun:'itemSun'} as const;
export function GameIcon({name,size=32}:{name:GameIconName;size?:number}){const key=MAIN.includes(name as typeof MAIN[number])?'ui-main':TOOLS.includes(name as typeof TOOLS[number])?'ui-tools':'ui-actions',source=key==='ui-main'?main:key==='ui-tools'?tools:actions,m=metadata[key],frame=m.frames[name],fit=fitArt(frame,size);return <View pointerEvents="none" accessible={false} style={{width:size,height:size,flexShrink:0}}><View style={{position:'absolute',left:fit.left,top:fit.top,width:fit.width,height:fit.height,overflow:'hidden'}}><Image source={source} accessibilityIgnoresInvertColors style={{position:'absolute',width:m.width*fit.scale,height:m.height*fit.scale,left:-frame.x*fit.scale,top:-frame.y*fit.scale}} resizeMode="stretch"/></View></View>;}
const metadata=require('../assets/v2/ui/metadata.json');
export function ButtonPlate({secondary=false,small=false}:{secondary?:boolean;small?:boolean}){const id=secondary?'bb-secondary':'bb-primary';return <View pointerEvents="none" accessible={false} testID="button-art" style={{position:'absolute',inset:0}}><Svg width="100%" height="100%"><Defs><LinearGradient id={id} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={secondary?'#62804F':'#16816A'}/><Stop offset="1" stopColor={secondary?'#345940':'#07513F'}/></LinearGradient></Defs><Rect x={1} y={1} width="99.5%" height="97%" rx={small?21:26} fill={`url(#${id})`} stroke={secondary?'#A6BA83':'#9ECBA3'} strokeWidth={1.5}/><Rect x={5} y={4} width="97%" height="1" rx={1} fill="#EDF4B5" opacity={.25}/></Svg></View>;}
export function BrandMark({width=120}:{width?:number}){return <Image accessibilityLabel="BugBaas" source={require('../assets/v2/ui/wordmark.webp')} resizeMode="contain" style={{width:'100%',maxWidth:width,height:width/2.9}}/>;}
