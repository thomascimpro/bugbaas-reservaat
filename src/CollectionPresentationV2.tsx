import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {species} from '../game/catalogV2';
import {candyFamily,dexNumber,usesSharedEvolutionModel,EVOLUTIONS,evolutionLine} from '../game/dexV2';
import {CandyIconV2} from './CandyIconV2';
import {SpriteView} from './artV2';
import {font,Glyph,useInfo} from './uiV2';
import {PO,PoCircle} from './PogoUiV2';

/** Small white round ⓘ for the light bug-detail sheets (replaces the dark Help button there). */
export function InfoDot({title,body}:{title:string;body:string}){const info=useInfo();return <PoCircle size={38} label={'Info: '+title} onPress={()=>info.show({title,body,icon:'info'})}><Glyph name="info" size={26}/></PoCircle>;}

export function CollectionEvolutionV2({id,shiny,onEvolve}:{id:string;shiny:boolean;onEvolve?:()=>void}){
 const line=evolutionLine(id),elite=line.some(usesSharedEvolutionModel);
 return <View testID="collection-evolution-route" style={{gap:9}}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{fontFamily:font,fontSize:11,fontWeight:'700',letterSpacing:.8,color:PO.muted}}>EVOLUTIEROUTE</Text><InfoDot title="Evolutieroute" body={elite?'Elite is een sterkere afwerking van dezelfde diersoort, met dezelfde anatomie. De route bewaart je IV, shiny, level en item.':'Deze spel-evoluties gebruiken verschillende insectmodellen. Dit is geen biologische levenscyclus. IV, shiny, level, item en je tweede aanvalslot blijven behouden.'}/></View>
  <View style={{flexDirection:'row',alignItems:'flex-start',gap:6}}>{line.map((stage,i)=>{
   const current=stage===id,cost=i>0?EVOLUTIONS[line[i-1]]?.candy:undefined;
   return <View key={stage} style={{flex:1,minWidth:0,alignItems:'center',gap:4}}>
    <View style={{width:'100%',height:90,alignItems:'center',justifyContent:'center',borderRadius:20,borderWidth:2,borderColor:current?PO.teal:'transparent',backgroundColor:current?'#1FC3D326':PO.bg}}><SpriteView id={stage} shiny={shiny} size={line.length>2?76:85}/>{current&&<View style={{position:'absolute',right:4,top:4}}><Glyph name="check" size={17}/></View>}</View>
    <Text numberOfLines={2} style={{fontFamily:font,fontSize:12,lineHeight:15,color:PO.text,fontWeight:current?'800':'600',textAlign:'center',minHeight:30}}>{usesSharedEvolutionModel(stage)?'Elite':species(stage).name}</Text>
    {cost!==undefined?<Pressable accessibilityRole="button" accessibilityLabel={cost+' nectar voor '+species(stage).name} onPress={onEvolve} disabled={!onEvolve||EVOLUTIONS[id]?.to!==stage} style={{minHeight:30,flexDirection:'row',alignItems:'center',gap:3,paddingHorizontal:8,borderRadius:15,backgroundColor:'#F2C14E26'}}><CandyIconV2 family={candyFamily(id)} size={17}/><Text style={{fontFamily:font,fontSize:12,color:'#9A6A12',fontWeight:'800'}}>{cost}</Text></Pressable>:<Text style={{fontFamily:font,fontSize:11,lineHeight:30,color:PO.muted}}>#{String(dexNumber(stage)).padStart(3,'0')}</Text>}
   </View>;
  })}</View>
  {elite&&<Text style={{fontFamily:font,fontSize:11,lineHeight:15,color:PO.muted,textAlign:'center'}}>Elite · dezelfde diersoort, sterkere afwerking</Text>}
 </View>;
}

export function CollectionStatsV2({values,onPress}:{values:{label:string;value:number;max:number;color:string}[];onPress:()=>void}){
 return <Pressable accessibilityRole="button" accessibilityLabel="Stats en IV bekijken" onPress={onPress} style={{flexDirection:'row',gap:8}}>{values.map(stat=><View key={stat.label} style={{flex:1,minWidth:0,gap:5,padding:10,borderRadius:16,backgroundColor:PO.bg}}><Text numberOfLines={1} style={{fontFamily:font,fontSize:11,fontWeight:'600',color:PO.muted}}>{stat.label}</Text><Text style={{fontFamily:font,fontSize:18,fontWeight:'800',color:PO.text}}>{stat.value.toLocaleString('nl-NL',{maximumFractionDigits:1})}</Text><View accessibilityRole="progressbar" accessibilityLabel={stat.label+' ten opzichte van level 50'} accessibilityValue={{min:0,max:stat.max,now:stat.value}} aria-valuemin={0} aria-valuemax={stat.max} aria-valuenow={stat.value} style={{height:5,borderRadius:3,backgroundColor:'#FFFFFF1F',overflow:'hidden'}}><View style={{height:5,width:`${Math.min(100,100*stat.value/stat.max)}%`,backgroundColor:stat.color}}/></View></View>)}</Pressable>;
}
