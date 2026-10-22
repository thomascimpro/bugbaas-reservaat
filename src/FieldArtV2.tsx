import React from 'react';
import {Image,View} from 'react-native';
import {BAITS,NETS} from '../game/fieldV2';
import type {Bait,Net} from '../game/fieldV2';
const atlas=require('../assets/v2/ui/field-items-v1.png');
export function FieldArt({id,size=48}:{id:Net|Bait;size?:number}){const cell=id in NETS?NETS[id as Net].cell:BAITS[id as Bait].cell,x=cell%3,y=Math.floor(cell/3),crop=.02,cellSize=size/(1-crop*2);return <View pointerEvents="none" style={{width:size,height:size,overflow:'hidden',flexShrink:0}}><Image source={atlas} resizeMode="stretch" style={{position:'absolute',width:cellSize*3,height:cellSize*3,left:-(x+crop)*cellSize,top:-(y+crop)*cellSize}}/></View>;}

const activityArt={cocoon:require('../assets/v2/ui/field-cocoon-v1.webp'),incense:require('../assets/v2/ui/field-incense-v1.webp'),buddy:require('../assets/v2/ui/field-buddy-v1.webp')};
export function FieldActivityArt({id,size=48}:{id:keyof typeof activityArt;size?:number}){return <View pointerEvents="none"><Image source={activityArt[id]} resizeMode="contain" style={{width:size,height:size,flexShrink:0}}/></View>;}
