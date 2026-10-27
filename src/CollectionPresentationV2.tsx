import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {species} from '../game/catalogV2';
import {dexNumber,usesSharedEvolutionModel,EVOLUTIONS,evolutionLine} from '../game/dexV2';
import {SpriteView} from './artV2';
import {Glyph,Help,Label,V} from './uiV2';

export function CollectionEvolutionV2({id,shiny,onEvolve}:{id:string;shiny:boolean;onEvolve?:()=>void}){
 const line=evolutionLine(id),elite=line.some(usesSharedEvolutionModel);
 return <View testID="collection-evolution-route" style={{gap:9,paddingVertical:12,borderTopWidth:1,borderColor:'#769D8A38'}}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Label small bold>EVOLUTIEROUTE</Label><Help title="Evolutieroute" body={elite?'Elite is een sterkere afwerking van dezelfde diersoort, met dezelfde anatomie. De route bewaart je IV, shiny, level en item.':'Deze spel-evoluties gebruiken verschillende insectmodellen. Dit is geen biologische levenscyclus. IV, shiny, level, item en je tweede aanvalslot blijven behouden.'}/></View>
  <View style={{flexDirection:'row',alignItems:'flex-start',gap:5}}>{line.map((stage,i)=>{
   const current=stage===id,cost=i>0?EVOLUTIONS[line[i-1]]?.candy:undefined;
   return <View key={stage} style={{flex:1,minWidth:0,alignItems:'center',gap:5}}>
    <View style={{width:'100%',height:90,alignItems:'center',justifyContent:'center',borderRadius:18,borderWidth:1,borderColor:current?'#BBDC9D':'#73968738',backgroundColor:current?'#34594A':'#153D33'}}><SpriteView id={stage} shiny={shiny} size={line.length>2?76:85}/>{current&&<View style={{position:'absolute',right:4,top:4}}><Glyph name="check" size={17}/></View>}</View>
    <Text numberOfLines={2} style={{fontSize:11,lineHeight:15,color:V.ink,fontWeight:current?'700':'400',textAlign:'center',minHeight:30}}>{usesSharedEvolutionModel(stage)?'Elite':species(stage).name}</Text>
    <Text style={{fontSize:10,color:current?'#D7E9C8':V.muted}}>{current?'Jouw bug':usesSharedEvolutionModel(stage)?'Zelfde soort':'Stadium '+(i+1)}</Text>
    {cost!==undefined?<Pressable accessibilityRole="button" accessibilityLabel={cost+' nectar voor '+species(stage).name} onPress={onEvolve} disabled={!onEvolve||EVOLUTIONS[id]?.to!==stage} style={{minHeight:32,flexDirection:'row',alignItems:'center',gap:3,paddingHorizontal:6,borderRadius:12,backgroundColor:'#244C3F'}}><Glyph name="leaf" size={17}/><Text style={{fontSize:11,color:'#E8DBAC',fontWeight:'700'}}>{cost}</Text></Pressable>:<Text style={{fontSize:10,lineHeight:32,color:V.muted}}>#{String(dexNumber(stage)).padStart(3,'0')}</Text>}
   </View>;
  })}</View>
  {elite&&<Text style={{fontSize:10,lineHeight:15,color:V.muted}}>Elite · dezelfde diersoort, sterkere afwerking</Text>}
 </View>;
}

export function CollectionStatsV2({values,onPress}:{values:{label:string;value:number;max:number;color:string}[];onPress:()=>void}){
 return <Pressable accessibilityRole="button" accessibilityLabel="Stats en IV bekijken" onPress={onPress} style={{flexDirection:'row',gap:8}}>{values.map(stat=><View key={stat.label} style={{flex:1,minWidth:0,gap:5,padding:9,borderRadius:14,backgroundColor:'#143D33'}}><Text style={{fontSize:11,color:V.muted}}>{stat.label}</Text><Text style={{fontSize:18,fontWeight:'700',color:V.ink}}>{stat.value.toLocaleString('nl-NL',{maximumFractionDigits:1})}</Text><View accessibilityRole="progressbar" accessibilityLabel={stat.label+' ten opzichte van level 50'} accessibilityValue={{min:0,max:stat.max,now:stat.value}} aria-valuemin={0} aria-valuemax={stat.max} aria-valuenow={stat.value} style={{height:4,borderRadius:3,backgroundColor:'#0D2B25',overflow:'hidden'}}><View style={{height:4,width:`${Math.min(100,100*stat.value/stat.max)}%`,backgroundColor:stat.color}}/></View></View>)}</Pressable>;
}
