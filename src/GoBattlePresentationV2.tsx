import React from 'react';
import {Pressable,Text,View} from 'react-native';
import type {GoBattleView,GoFighter} from '../game/goBattleV2';
import {FAST} from '../game/goV2';
import {species} from '../game/catalogV2';
import {font,Glyph} from './uiV2';
import {GoTypes,GO_TYPES} from './GoTypeV2';
import {GoCombatFighterV2} from './GoCombatFighterV2';

export function BattleHealthV2({unit}:{unit:GoFighter}){
 const ratio=Math.max(0,Math.min(1,unit.hp/unit.maxHP));
 return <View accessibilityLabel={unit.hp+' van '+unit.maxHP+' HP'} style={{width:'100%',gap:3}}><View style={{height:8,borderRadius:5,overflow:'hidden',backgroundColor:'#051D1BE6',borderWidth:1,borderColor:'#EBF6DE66'}}><View style={{height:'100%',width:(ratio*100+'%') as '100%',backgroundColor:ratio>.5?'#A5E4A0':ratio>.2?'#F3CD73':'#F29783'}}/></View><Text style={{fontFamily:font,color:'#E7F3DD',fontSize:10,fontWeight:'700',textAlign:'right',fontVariant:['tabular-nums']}}>{unit.hp} / {unit.maxHP} HP</Text></View>;
}
function FighterHUD({unit,enemy=false}:{unit:GoFighter;enemy?:boolean}){
 return <View pointerEvents="box-none" style={{width:'72%',maxWidth:310,alignSelf:enemy?'flex-end':'flex-start',paddingHorizontal:12,paddingTop:7,paddingBottom:5,gap:3,borderRadius:16,borderWidth:1,borderColor:'#D8EDCA55',backgroundColor:'#0C302BEF'}}><View style={{flexDirection:'row',alignItems:'center',gap:6}}><Text numberOfLines={1} style={{flex:1,fontFamily:font,fontSize:12,fontWeight:'800',color:'#FFF4DA'}}>{species(unit.species).name}</Text><Text style={{fontFamily:font,fontSize:11,fontWeight:'800',color:'#E9D698'}}>{unit.cp} CP</Text></View><View style={{flexDirection:'row',gap:7,alignItems:'center'}}><View style={{flex:1}}><BattleHealthV2 unit={unit}/></View><GoTypes species={unit.species} compact/></View></View>;
}
export function GoBattleStageV2({battle:b,size,canTap,cooldown,queued,onFast,onInfo}:{battle:GoBattleView;size:number;canTap:boolean;cooldown:number;queued?:string|null;onFast:()=>void;onInfo:()=>void}){
 const side=b.side,other=(1-side) as 0|1,a=b.teams[side][b.active[side]],enemy=b.teams[other][b.active[other]],fast=FAST[a.go.fast],type=GO_TYPES[fast.type];
 return <View style={{flex:1,minHeight:150,borderRadius:22,overflow:'hidden',borderWidth:1,borderColor:'#C3D6AD66',backgroundColor:'#153E3524'}}>
  <Pressable testID="battle-fast" accessibilityRole="button" accessibilityLabel={'Snelle aanval '+fast.name+' · tik op het gevechtsveld'} accessibilityHint="Houd vast voor aanvalsinformatie" disabled={!canTap} onPress={onFast} onLongPress={onInfo} style={{position:'absolute',inset:0}}>
   <View pointerEvents="none" style={{position:'absolute',width:'132%',height:'55%',left:'-16%',top:'39%',borderRadius:999,borderWidth:2,borderColor:'#D5D8A42B',backgroundColor:'#AFC19A0D',transform:[{rotate:'-9deg'}]}}/>
   <View pointerEvents="none" style={{position:'absolute',width:'65%',height:'25%',left:'17%',top:'54%',borderRadius:999,borderWidth:1,borderColor:'#D5D8A42B'}}/>
   <View pointerEvents="none" style={{position:'absolute',right:'12%',top:'18%'}}><GoCombatFighterV2 unit={enemy} side={other} battle={b} size={size}/></View>
   <View pointerEvents="none" style={{position:'absolute',left:'5%',bottom:101}}><GoCombatFighterV2 unit={a} side={side} battle={b} size={size*1.2} flip/></View>
   <View pointerEvents="none" style={{position:'absolute',right:12,top:84,flexDirection:'row',gap:4}}>{b.teams[other].map((u,i)=><View key={u.id} style={{width:9,height:9,borderRadius:5,borderWidth:1,borderColor:'#F5E3AA',backgroundColor:u.hp>0?i===b.active[other]?'#F5D88D':'#A9D7AE':'#183B35',opacity:u.hp>0?1:.4}}/>)}</View>
  </Pressable>
  <View pointerEvents="box-none" style={{position:'absolute',inset:8,justifyContent:'space-between'}}><FighterHUD unit={enemy} enemy/><View pointerEvents="box-none" style={{gap:6}}><FighterHUD unit={a}/><View pointerEvents="none" style={{alignSelf:'center',flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:9,paddingVertical:3,borderRadius:12,backgroundColor:'#0B2B25E8'}}><Glyph name={type.icon} size={16}/><Text style={{fontFamily:font,fontSize:10,fontWeight:'800',color:'#F7EDCF'}}>{a.hp<=0?'Kies een reserve':b.replaceAt[other]?'Tegenstander wisselt':queued?'Volgende tik klaar':cooldown>0?fast.name:'Tik om aan te vallen'}</Text></View></View></View>
  <View pointerEvents="none" style={{position:'absolute',left:0,bottom:0,height:3,width:(Math.max(0,1-cooldown/(fast.turns*500))*100+'%') as '100%',backgroundColor:queued?'#EFCC7B':type.color,opacity:cooldown>0||queued?1:.35}}/>
 </View>;
}
