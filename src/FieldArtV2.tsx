import React from 'react';
import {Image,View} from 'react-native';
import {BAITS,NETS} from '../game/fieldV2';
import type {Bait,Net} from '../game/fieldV2';
const atlas=require('../assets/v2/ui/field-items-v1.png');
export function FieldArt({id,size=48}:{id:Net|Bait;size?:number}){const cell=id in NETS?NETS[id as Net].cell:BAITS[id as Bait].cell,x=cell%3,y=Math.floor(cell/3);return <View pointerEvents="none" style={{width:size,height:size,overflow:'hidden',flexShrink:0}}><Image source={atlas} resizeMode="stretch" style={{position:'absolute',width:size*3,height:size*3,left:-x*size,top:-y*size}}/></View>;}

const activityArt={cocoon:require('../assets/v2/ui/field-cocoon-v1.webp'),incense:require('../assets/v2/ui/field-incense-v1.webp'),buddy:require('../assets/v2/ui/field-buddy-v1.webp')};
export function FieldActivityArt({id,size=48}:{id:keyof typeof activityArt;size?:number}){return <View pointerEvents="none"><Image source={activityArt[id]} resizeMode="contain" style={{width:size,height:size,flexShrink:0}}/></View>;}
