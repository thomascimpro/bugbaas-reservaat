import React from 'react';
import {Image} from 'react-native';
import {movePool} from '../game/goV2';
import type {Element} from '../game/goV2';

// 3D type medallions (Blender, assets/v2/types/source.json): same colour as GO_TYPES, readable at 20 px.
const ART:Record<Element,number>={
 bug:require('../assets/v2/types/bug.webp'),flying:require('../assets/v2/types/flying.webp'),poison:require('../assets/v2/types/poison.webp'),
 grass:require('../assets/v2/types/grass.webp'),ground:require('../assets/v2/types/ground.webp'),rock:require('../assets/v2/types/rock.webp'),
 steel:require('../assets/v2/types/steel.webp'),dark:require('../assets/v2/types/dark.webp'),normal:require('../assets/v2/types/normal.webp'),
 fire:require('../assets/v2/types/fire.webp'),water:require('../assets/v2/types/water.webp'),
};

export function TypeEmblemV2({type,size=24}:{type:Element;size?:number}){
 return <Image source={ART[type]} accessibilityIgnoresInvertColors resizeMode="contain" style={{width:size,height:size}}/>;
}

/** First (main) type of a species as a medallion, like the type icon on PoGO/preview P04 cards. */
export function MainTypeEmblemV2({species,size=24}:{species:string;size?:number}){
 const type=movePool(species).types[0];
 return type?<TypeEmblemV2 type={type} size={size}/>:null;
}
