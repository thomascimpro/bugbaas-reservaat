import React from 'react';
import {Text,View} from 'react-native';
import {species} from '../game/catalogV2';
import {movePool,stats} from '../game/goV2';
import {bugRarity,RARITY_TIERS} from '../game/rarityDisplayV2';
import type {Specimen} from '../game/typesV2';
import {SpriteView} from './artV2';
import {GO_TYPES} from './GoTypeV2';
import {MainTypeEmblemV2} from './TypeEmblemV2';
import {font,Wash} from './uiV2';
import {ShinyMarkV2} from './WorldEffectsV2';

// Collection card (Bugs screen, UX 10 Nov): type-coloured gradient behind the HD portrait,
// CP chip top-left, rarity stars in the rarity colour and the name on one line that shrinks instead of breaking.
export function BugCardV3({bug,width}:{bug:Specimen;width:number}){
 const type=movePool(bug.species).types[0],tint=type?GO_TYPES[type].color:'#1FC3D3',tier=bugRarity(bug.species),rarity=RARITY_TIERS[tier],art=Math.floor(width*.86),name=bug.nickname||species(bug.species).name;
 return <View>
  <View style={{height:Math.floor(width*.96),alignItems:'center',justifyContent:'flex-end',paddingBottom:4,overflow:'hidden'}}>
   <Wash from={tint+'66'} to={tint+'08'}/>
   <SpriteView id={bug.species} shiny={bug.shiny} size={art}/>
   <View style={{position:'absolute',left:5,top:5,flexDirection:'row',alignItems:'baseline',paddingHorizontal:6,paddingVertical:1,borderRadius:9,backgroundColor:'#06181699'}}><Text style={{fontFamily:font,fontSize:9,fontWeight:'800',color:'#BFD6D0'}}>CP </Text><Text style={{fontFamily:font,fontSize:14,fontWeight:'900',color:'#FFFFFF'}}>{stats(bug).cp}</Text></View>
   {bug.shiny&&<View style={{position:'absolute',right:5,top:5}}><ShinyMarkV2 size={18}/></View>}
  </View>
  <View style={{paddingHorizontal:6,paddingTop:4,paddingBottom:6,gap:2,alignItems:'center',backgroundColor:'#0F2D2DF2'}}>
   <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.7} style={{fontFamily:font,fontSize:name.length>16?9.5:name.length>12?10.5:12.5,fontWeight:'800',color:'#EAF6F2',maxWidth:'100%'}}>{name}</Text>
   <View style={{flexDirection:'row',alignItems:'center',gap:4}}><MainTypeEmblemV2 species={bug.species} size={15}/><Text style={{fontFamily:font,fontSize:10,letterSpacing:.5,color:rarity.color,fontWeight:'900'}}>{'★'.repeat(tier)}</Text></View>
  </View>
 </View>;
}
