import React from 'react';
import {Text,View} from 'react-native';
import {GRADES,streakBonus} from '../game/fieldV2';
import type {CastResult} from '../game/fieldV2';
import {HELD,family} from '../game/goV2';
import {species} from '../game/catalogV2';
import {CandyIconV2} from './CandyIconV2';
import {familyName} from './resourceGainV2';
import {GoTypes} from './GoTypeV2';
import {RevealV2,ShinyMarkV2} from './WorldEffectsV2';
import {font,Glyph} from './uiV2';
import {PO,PoPill} from './PogoUiV2';

const t=(size:number,color:string=PO.text,weight:'700'|'800'='800')=>({fontFamily:font,fontSize:size,fontWeight:weight,color});
function Chip({children,testID,bg='#FFFFFF1A'}:{children:React.ReactNode;testID?:string;bg?:string}){return <View testID={testID} style={{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:10,paddingVertical:3,borderRadius:12,backgroundColor:bg,borderWidth:1,borderColor:PO.rim}}>{children}</View>;}
function Reward({icon,value,label}:{icon:React.ReactNode;value:number;label:string}){
 return <View accessibilityLabel={label+': +'+value} style={{alignItems:'center',gap:4}}><View style={{width:62,height:62,borderRadius:31,alignItems:'center',justifyContent:'center',backgroundColor:'#00000033',borderWidth:1,borderColor:PO.rim}}>{icon}</View><Text style={[t(17),{fontVariant:['tabular-nums']}]}>+{value}</Text></View>;
}

/** Catch result as a glass card (Codex preview P03-3). Reward values come from the confirmed cast receipt, never from a preview roll. */
export function CatchResultV2({result,demo,newSpecies,onContinue,onCollection}:{result:CastResult;demo:boolean;newSpecies:boolean;onContinue:()=>void;onCollection?:()=>void}){
 const caught=result.outcome==='caught',finished=caught||result.outcome==='fled',fam=family(result.species);
 const title=caught?'Gevangen':result.outcome==='miss'?'Mis':result.outcome==='fled'?'Weggevlogen':'Ontsnapt';
 return <RevealV2><View testID="catch-result" style={{gap:12,padding:16,borderRadius:24,backgroundColor:PO.surface,borderWidth:1,borderColor:PO.rim,boxShadow:'0px 12px 30px #00000066'}}>
  <View accessibilityLiveRegion="polite" style={{alignItems:'center',gap:6}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:8}}>{caught&&<View style={{width:26,height:26,borderRadius:13,borderWidth:2,borderColor:PO.tealText,alignItems:'center',justifyContent:'center'}}><Text style={t(14,PO.tealText)}>✓</Text></View>}<Text style={t(22,caught?PO.tealText:PO.text)}>{title}</Text></View>
   {caught&&<Text style={t(26)}>{species(result.species).name}</Text>}
   <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',alignItems:'center',gap:7}}>
    {caught&&!!result.cp&&<Text style={t(16,PO.muted,'700')}>CP {result.cp}</Text>}
    {caught&&<GoTypes species={result.species} compact/>}
    {result.grade!=='hit'&&result.grade!=='miss'&&<Chip><Text style={t(12,PO.gold)}>{GRADES[result.grade].name}</Text></Chip>}
    {result.curved&&<Chip><Text style={t(12,PO.gold)}>🌀</Text></Chip>}
    {streakBonus(result.streak)>0&&<Chip testID="streak-bonus" bg="#F2A51A26"><Text style={t(12,'#FFD27A')}>{'🔥 '+result.streak+' · +'+streakBonus(result.streak)+' XP'}</Text></Chip>}
    {caught&&result.shiny&&<Chip testID="shiny-catch" bg="#E9E4FF33"><ShinyMarkV2 size={16}/><Text style={t(12,'#F3EEFF')}>Shiny</Text></Chip>}
    {caught&&!demo&&newSpecies&&<Chip testID="new-dex-catch"><Glyph name="book" size={16}/><Text style={t(12,PO.tealText)}>Nieuw</Text></Chip>}
   </View>
  </View>
  {caught&&(demo?<Text style={[t(12,PO.muted,'700'),{textAlign:'center'}]}>Demo · geen beloningen</Text>:<View testID="catch-rewards" style={{gap:8}}>
   <View style={{flexDirection:'row',justifyContent:'space-evenly'}}>
    <Reward icon={<Glyph name="nectar" size={36}/>} value={result.nectar} label="Stof"/>
    <Reward icon={<CandyIconV2 family={fam} size={36}/>} value={result.candy??3} label={familyName(fam)+'-nectar'}/>
    <Reward icon={<Glyph name="profile" size={36}/>} value={result.xp??0} label="XP"/>
   </View>
   {result.held&&<View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6}}><Glyph name={HELD[result.held].icon} size={26}/><Text style={t(13,PO.text,'700')}>+1 {HELD[result.held].name}</Text></View>}
  </View>)}
  <View style={{flexDirection:'row',gap:10}}>
   <View style={{flex:1.4}}><PoPill height={52} icon={caught?'check':'refresh'} label={finished?'Klaar':'Opnieuw'} accessibilityLabel={finished?'Verder':'Opnieuw'} onPress={onContinue}/></View>
   {caught&&!demo&&onCollection&&<View style={{flex:1}}><PoPill height={52} variant="ghost" icon="book" label="Bekijk" accessibilityLabel="Bekijk gevangen bug" onPress={onCollection}/></View>}
  </View>
 </View></RevealV2>;
}
