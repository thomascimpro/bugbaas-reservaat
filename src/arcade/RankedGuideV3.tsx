import React,{useState} from 'react';
import {Image,Pressable,Text,View} from 'react-native';
import {RANKS} from '../../game/ranksV3';
import type {GameViewV2} from '../../game/typesV2';
import {RankMedalV2} from '../PvpRankV2';
import {MODE_ART} from '../StrijdGuideV3';
import {font} from '../uiV2';

// "Zo werkt Ranked" (UX 9 Nov): picture + three short steps + the rank ladder at a glance, open until a player has
// finished 3 ranked rounds, then a single reopenable line. Only explains the existing rules (game/arcade/ranked.ts,
// game/ranksV3.ts); nothing is locked or changed.
export function RankedGuideV3({view}:{view:GameViewV2}){
 const r=view.player.arcade?.ranked,played=(r?.wins??0)+(r?.losses??0)+(r?.draws??0),[open,setOpen]=useState(played<3);
 const steps=['Ranked kiest één van de zeven games voor je.','Jij en een andere speler (of een bot) spelen dezelfde ronde; de hoogste score wint.','Winnen geeft rangpunten. Elke maand een beloning bij je hoogste rang.'];
 return <View testID="ranked-guide" style={{borderRadius:20,backgroundColor:'#0E2828E8',borderWidth:1,borderColor:'#BFF3EC47',overflow:'hidden'}}>
  <Pressable accessibilityRole="button" accessibilityLabel={open?'Uitleg Ranked inklappen':'Zo werkt Ranked'} accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={{flexDirection:'row',alignItems:'center',gap:10,padding:10}}>
   <Image source={MODE_ART.ranked} style={{width:40,height:40}}/>
   <View style={{flex:1}}><Text style={{fontFamily:font,color:'#EAF6F2',fontSize:15,fontWeight:'900'}}>Zo werkt Ranked</Text>{!open&&<Text style={{fontFamily:font,color:'#9DB8B2',fontSize:12}}>Zelfde spel · hoogste score wint · tik voor uitleg</Text>}</View>
   <Text style={{color:'#6BEFF2',fontSize:16,fontWeight:'900'}}>{open?'−':'+'}</Text>
  </Pressable>
  {open&&<View style={{paddingHorizontal:12,paddingBottom:12,gap:8}}>
   {steps.map((s,i)=><View key={i} style={{flexDirection:'row',gap:10,alignItems:'center'}}><View style={{width:24,height:24,borderRadius:12,backgroundColor:'#1FC3D3',alignItems:'center',justifyContent:'center'}}><Text style={{fontFamily:font,color:'#062020',fontWeight:'900',fontSize:12}}>{i+1}</Text></View><Text style={{flex:1,fontFamily:font,color:'#EAF6F2',fontSize:13,lineHeight:18,fontWeight:'700'}}>{s}</Text></View>)}
   <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:4}}>{RANKS.map((rank,i)=><View key={rank.id} style={{alignItems:'center',width:'12%'}}><RankMedalV2 rank={i} size={30}/><Text numberOfLines={1} style={{fontFamily:font,fontSize:8,color:rank.color,fontWeight:'800'}}>{rank.name}</Text></View>)}</View>
   <Text style={{fontFamily:font,color:'#9DB8B2',fontSize:11}}>Brons → Master. Een rangduel is iets anders dan Strijd: daar vecht je met je bugs.</Text>
  </View>}
 </View>;
}
