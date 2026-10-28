import React from 'react';
import {Text,View} from 'react-native';
import {bugRarity,RARITY_TIERS} from '../game/rarityDisplayV2';
import type {RarityTier} from '../game/rarityDisplayV2';

/** Fortnite-style rarity pill: the rarity colour with white stars (1-5); compact shows only the stars. */
export function RarityBadgeV2({species,tier,compact=false}:{species?:string;tier?:RarityTier;compact?:boolean}){
 const t=tier??bugRarity(species!),r=RARITY_TIERS[t];
 return <View accessibilityLabel={'Zeldzaamheid: '+r.name+', '+t+' sterren'} style={{flexDirection:'row',alignItems:'center',gap:4,alignSelf:'center',paddingHorizontal:compact?5:9,paddingVertical:compact?1:3,borderRadius:10,backgroundColor:r.color,borderWidth:1,borderColor:'#FFFFFF66',boxShadow:t>=4?'0px 0px 8px '+r.color:undefined}}>
  <Text style={{fontSize:compact?9:12,fontWeight:'900',color:'#FFFFFF',letterSpacing:compact?0:1,textShadowColor:'#00000066',textShadowRadius:2}}>{'★'.repeat(t)}</Text>
  {!compact&&<Text style={{fontSize:12,fontWeight:'800',color:'#FFFFFF',textShadowColor:'#00000066',textShadowRadius:2}}>{r.name}</Text>}
 </View>;
}
