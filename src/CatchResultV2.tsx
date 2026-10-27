import React from 'react';
import {Text,View} from 'react-native';
import {GRADES} from '../game/fieldV2';
import type {CastResult} from '../game/fieldV2';
import {HELD} from '../game/goV2';
import {RevealV2,ShinyMarkV2} from './WorldEffectsV2';
import {Button,font,Glyph,Label,V} from './uiV2';

// Reward values come from the confirmed cast receipt, never from a preview roll.
export function CatchResultV2({result,demo,newSpecies,onContinue,onCollection}:{result:CastResult;demo:boolean;newSpecies:boolean;onContinue:()=>void;onCollection?:()=>void}){
 const caught=result.outcome==='caught',finished=caught||result.outcome==='fled';
 return <RevealV2><View style={{gap:10}}>
  <View accessibilityLiveRegion="polite" style={{alignItems:'center',gap:6}}>
   <Text style={{fontFamily:font,fontWeight:'800',fontSize:30,letterSpacing:-.3,color:caught?'#F8DE95':'#F2E9D1',textShadowColor:'#061914B3',textShadowOffset:{width:0,height:2},textShadowRadius:6}}>{caught?'Gevangen!':result.outcome==='miss'?'Mis':result.outcome==='fled'?'Weggevlogen':'Ontsnapt!'}</Text>
   <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:7}}>
    {result.grade!=='hit'&&result.grade!=='miss'&&<View style={{paddingHorizontal:10,paddingVertical:3,borderRadius:12,backgroundColor:'#1B4F40'}}><Label small bold color="#F8DE95">{GRADES[result.grade].name}</Label></View>}
    {result.curved&&<View style={{paddingHorizontal:10,paddingVertical:3,borderRadius:12,backgroundColor:'#1B4F40'}}><Label small color="#F8DE95">Boogzwaai</Label></View>}
    {caught&&result.shiny&&<View testID="shiny-catch" style={{paddingHorizontal:10,paddingVertical:3,borderRadius:12,backgroundColor:'#E9E4FF',borderWidth:1,borderColor:'#FFFFFF',flexDirection:'row',alignItems:'center',gap:4,boxShadow:'0px 0px 12px #FFF6D6AA'}}><ShinyMarkV2 size={18}/><Label small bold color="#3B3A6B">Shiny!</Label></View>}
    {caught&&!demo&&newSpecies&&<View testID="new-dex-catch" style={{paddingHorizontal:10,paddingVertical:3,borderRadius:12,backgroundColor:'#F2D78C',flexDirection:'row',alignItems:'center',gap:4}}><Glyph name="book" size={19}/><Label small bold>Nieuwe soort</Label></View>}
   </View>
  </View>
  {caught&&(demo?<Label small center color="#F1E5C9">Demo · geen beloningen</Label>:<View testID="catch-rewards" style={{padding:12,borderRadius:23,backgroundColor:'#214B40F2',gap:9,borderWidth:1,borderColor:'#F2DCAB',boxShadow:'0px 10px 28px #06191466'}}>
   {!!result.cp&&<Label bold center>CP {result.cp}</Label>}
   <View style={{flexDirection:'row',justifyContent:'space-around',gap:6}}>
    {([{icon:'nectar',value:result.nectar,label:'Stof'},{icon:'profile',value:result.xp??0,label:'XP'},{icon:'leaf',value:result.candy??3,label:'Nectar'}] as const).map(reward=><View key={reward.icon} accessibilityLabel={reward.label+': +'+reward.value} style={{flex:1,minWidth:0,alignItems:'center',gap:2}}><Glyph name={reward.icon} size={35}/><Text style={{fontFamily:font,fontSize:20,fontWeight:'800',fontVariant:['tabular-nums'],color:V.ink}}>+{reward.value}</Text><Label small center>{reward.label}</Label></View>)}
   </View>
   {result.held&&<View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,borderTopWidth:1,borderColor:'#D7CDAE',paddingTop:6}}><Glyph name={HELD[result.held].icon} size={28}/><Label small bold>+1 {HELD[result.held].name}</Label></View>}
  </View>)}
  <View style={{flexDirection:'row',gap:8}}>{caught&&!demo&&onCollection&&<View style={{flex:1}}><Button small secondary icon="book" accessibilityLabel="Bekijk gevangen bug" onPress={onCollection}>Bekijk bug</Button></View>}<View style={{flex:1}}><Button small icon={caught?'check':'refresh'} onPress={onContinue}>{finished?'Verder':'Opnieuw'}</Button></View></View>
 </View></RevealV2>;
}
