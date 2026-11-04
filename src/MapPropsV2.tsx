import React from 'react';
import {Image,View} from 'react-native';
import {SpriteView} from './artV2';
import type {GymTeam} from '../game/gymsV2';

// HD Blender renders of the map props (assets/v2/props/source.json, assets/3d/README.md A1–A3).
const GYM={fern:require('../assets/v2/props/gym-fern.webp'),amber:require('../assets/v2/props/gym-amber.webp'),tidal:require('../assets/v2/props/gym-tidal.webp'),neutral:require('../assets/v2/props/gym-neutral.webp')};
const COCOON={1:require('../assets/v2/props/raid-egg-1.webp'),3:require('../assets/v2/props/raid-egg-3.webp'),4:require('../assets/v2/props/raid-egg-4.webp'),5:require('../assets/v2/props/raid-egg-5.webp')};

/** Raid cocoon in the tier colour (★1 green, ★2–3 blue, ★4 purple, ★5 gold). */
export function RaidCocoonV2({tier,size=58}:{tier:number;size?:number}){
 const art=COCOON[tier>=5?5:tier>=4?4:tier>=2?3:1];
 return <Image source={art} accessibilityIgnoresInvertColors resizeMode="contain" style={{width:size,height:size}}/>;
}

/** Gym tower in the team colour; the first defender stands on the arena platform like in PoGO. */
export function GymTowerV2({team,defender,size=86}:{team:GymTeam|null;defender?:string;size?:number}){
 return <View pointerEvents="none" style={{width:size,height:size,alignItems:'center',justifyContent:'flex-end'}}>
  <Image source={GYM[team??'neutral']} accessibilityIgnoresInvertColors resizeMode="contain" style={{width:size,height:size}}/>
  {defender&&<View style={{position:'absolute',top:-size*.12,alignItems:'center'}}><SpriteView id={defender} size={size*.36} animate/></View>}
 </View>;
}
