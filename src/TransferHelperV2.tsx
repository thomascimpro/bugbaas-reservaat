import React,{useContext,useEffect,useState} from 'react';
import {Modal,Pressable,ScrollView,Text,View} from 'react-native';
import type {GameViewV2} from '../game/typesV2';
import {DEFAULT_TRANSFER_OPTIONS,TRANSFER_BATCH,transferNectarV2,transferSelectionV2} from '../game/transferSelectionV2';
import type {TransferOptionsV2} from '../game/transferSelectionV2';
import {GRADE_COLORS,RARITY_TIERS} from '../game/rarityDisplayV2';
import type {RunV2} from './ShopViewV2';
import {SpriteView} from './artV2';
import {CandyIconV2} from './CandyIconV2';
import {familyName} from './resourceGainV2';
import {useGoBack} from './GoBackV2';
import {Button,Glyph,IconButton,Label,MotionPrefs,Title,V} from './uiV2';

/** Aniimo-style cleanup: a few big switches, a live preview, then the protected server batch transfer (max 50 per call). */
export function TransferHelperV2({view,run,busy,onClose}:{view:GameViewV2;run:RunV2;busy:boolean;onClose:()=>void}){
 const p=view.player,reduced=useContext(MotionPrefs),[o,setO]=useState<TransferOptionsV2>(DEFAULT_TRANSFER_OPTIONS),[sure,setSure]=useState(false);
 const all=transferSelectionV2(p,o),batch=all.slice(0,TRANSFER_BATCH),nectar=transferNectarV2(batch),key=batch.map(b=>b.id).join();
 useEffect(()=>setSure(false),[key]);
 useGoBack(true,()=>{onClose();return true;});
 const toggle=(label:string,on:boolean,art:React.ReactNode,flip:()=>void,extra?:React.ReactNode)=><Pressable key={label} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{checked:on}} onPress={flip} style={{minHeight:58,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:12,paddingVertical:8,borderRadius:18,backgroundColor:on?'#2F5F48':'#183E34',borderWidth:2,borderColor:on?'#C6D78E':'#52755A'}}><View style={{width:30,height:30,borderRadius:9,borderWidth:2,borderColor:on?'#C6D78E':'#86A08A',backgroundColor:on?'#C6D78E':'transparent',alignItems:'center',justifyContent:'center'}}>{on&&<Text style={{fontSize:19,fontWeight:'900',color:'#173E32'}}>✓</Text>}</View><View style={{width:34,alignItems:'center'}}>{art}</View><View style={{flex:1}}><Label bold>{label}</Label></View>{extra}</Pressable>;
 const confirm=()=>{if(!sure){setSure(true);return;}void run('goTransferMany',{ids:batch.map(b=>b.id)}).then(()=>setSure(false));};
 return <Modal visible transparent animationType={reduced?'none':'slide'} onRequestClose={onClose}><View style={{flex:1,backgroundColor:'#092C29A8',alignItems:'center',justifyContent:'flex-end'}}><View testID="transfer-helper" style={{width:'100%',maxWidth:560,maxHeight:'92%',backgroundColor:V.paper,borderTopLeftRadius:30,borderTopRightRadius:30,padding:17,gap:10}}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Title>Opruimen</Title><IconButton name="close" label="Sluit opruimen" onPress={onClose}/></View>
  <ScrollView contentContainerStyle={{gap:9,paddingBottom:6}}>
   {toggle('Houd beste per soort',o.keepBest>0,<Text style={{fontSize:24}}>👍</Text>,()=>setO({...o,keepBest:o.keepBest>0?0:1}),o.keepBest>0&&<View style={{flexDirection:'row',gap:4}}>{([1,2] as const).map(n=><Pressable key={n} accessibilityRole="button" accessibilityLabel={'Houd '+n+' per soort'} accessibilityState={{selected:o.keepBest===n}} onPress={()=>setO({...o,keepBest:n})} style={{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center',backgroundColor:o.keepBest===n?'#C6D78E':'#214F45',borderWidth:1,borderColor:'#C6D78E'}}><Label bold color={o.keepBest===n?'#173E32':V.ink}>{n}</Label></Pressable>)}</View>)}
   {toggle('Houd ★★★★+ zeldzaam',o.keepRare,<Text style={{fontSize:13,fontWeight:'900',color:RARITY_TIERS[4].color}}>★★★★</Text>,()=>setO({...o,keepRare:!o.keepRare}))}
   {toggle('Houd Super/Perfect',o.keepGood,<View style={{width:30,height:30,borderRadius:15,backgroundColor:GRADE_COLORS[4],borderWidth:3,borderColor:GRADE_COLORS[3]}}/>,()=>setO({...o,keepGood:!o.keepGood}))}
   {toggle('Houd met 2 aanvallen',o.keepTwoMoves,<Glyph name="attack" size={28}/>,()=>setO({...o,keepTwoMoves:!o.keepTwoMoves}))}
   <View accessibilityLabel="Altijd veilig: shiny, favoriet, buddy, team en gym" style={{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:12,paddingVertical:8,borderRadius:18,backgroundColor:'#102F2A'}}><Glyph name="lock" size={24}/><Label small bold>Altijd veilig</Label><View style={{flex:1,flexDirection:'row',justifyContent:'flex-end',alignItems:'center',gap:7}}><Text style={{fontSize:18,color:'#F6D86B'}}>✦</Text><Glyph name="star" size={20}/><Glyph name="heart" size={20}/><Glyph name="swords" size={20}/><Glyph name="shield" size={20}/></View></View>
   <View testID="transfer-preview" style={{gap:8,padding:12,borderRadius:20,backgroundColor:'#214B40',borderWidth:1,borderColor:'#52755A'}}>
    <View style={{flexDirection:'row',alignItems:'baseline',justifyContent:'center',gap:6}}><Text style={{fontSize:30,fontWeight:'900',color:V.ink}}>{batch.length}</Text><Label bold>{batch.length===1?'bug gaat':'bugs gaan'}</Label></View>
    {all.length>TRANSFER_BATCH&&<Label small center color="#F1D184">50 per keer · nog {all.length-TRANSFER_BATCH} daarna</Label>}
    {batch.length>0?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:4}}>{batch.map(b=><View key={b.id} style={{width:44,height:44,borderRadius:12,backgroundColor:'#183E34',alignItems:'center',justifyContent:'center'}}><SpriteView id={b.species} size={40}/></View>)}</ScrollView>:<View style={{alignItems:'center',gap:4}}><Text style={{fontSize:34}}>👍</Text><Label small center>Alles blijft</Label></View>}
    {nectar.length>0&&<View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:8}}>{nectar.slice(0,8).map(([fam,n])=><View key={fam} accessibilityLabel={'+'+n+' '+familyName(fam)+'-nectar'} style={{flexDirection:'row',alignItems:'center',gap:3,paddingHorizontal:7,paddingVertical:2,borderRadius:12,backgroundColor:'#1E4A36'}}><CandyIconV2 family={fam} size={26}/><Label small bold>+{n}</Label></View>)}{nectar.length>8&&<Label small bold>+{nectar.slice(8).reduce((a,[,n])=>a+n,0)}</Label>}</View>}
   </View>
  </ScrollView>
  <Button icon={sure?'check':'leaf'} disabled={busy||batch.length===0} accessibilityLabel={sure?'Bevestig: laat '+batch.length+' bugs vrij':'Laat '+batch.length+' bugs vrij'} onPress={confirm}>{sure?'Zeker? Laat '+batch.length+' vrij':'Laat '+batch.length+' vrij'}</Button>
  {sure&&<Label small center color="#F0BC85">Vrijlaten is definitief</Label>}
 </View></View></Modal>;
}
