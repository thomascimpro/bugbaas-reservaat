import React from 'react';
import {View} from 'react-native';
import {bugRarity,RARITY_TIERS} from '../game/rarityDisplayV2';
import type {RarityTier} from '../game/rarityDisplayV2';
import {Label} from './uiV2';

/** Small rarity pill: coloured dots (1-5) plus the name, readable without knowing the game. */
export function RarityBadgeV2({species,tier,compact=false}:{species?:string;tier?:RarityTier;compact?:boolean}){
 const t=tier??bugRarity(species!),r=RARITY_TIERS[t];
 return <View accessibilityLabel={'Zeldzaamheid: '+r.name} style={{flexDirection:'row',alignItems:'center',gap:4,alignSelf:'center',paddingHorizontal:compact?5:8,paddingVertical:compact?1:3,borderRadius:10,backgroundColor:'#0E2B24CC',borderWidth:1,borderColor:r.color+'99'}}>
  <View style={{flexDirection:'row',gap:2}}>{Array.from({length:t},(_,i)=><View key={i} style={{width:compact?5:7,height:compact?5:7,borderRadius:4,backgroundColor:r.color}}/>)}</View>
  {!compact&&<Label small bold color={r.color}>{r.name}</Label>}
 </View>;
}
