import React,{useEffect,useRef} from 'react';
import {Pressable,View} from 'react-native';
import {Glyph,Label,useInfo} from './uiV2';
import type {Glyph as GlyphName} from './uiV2';
import {FieldArt,FieldActivityArt} from './FieldArtV2';
import type {Net,Bait} from '../game/fieldV2';
import type {RewardRow} from './resourceGainV2';
import {RewardHost} from './RewardHostV2';
import {CandyIconV2} from './CandyIconV2';
export type RewardBatch={id:number;rows:RewardRow[];dismissed:string[]};
function Art({row,size=36}:{row:RewardRow;size?:number}){return row.art==='candy'||row.art==='xl'?<CandyIconV2 family={row.icon} size={size} xl={row.art==='xl'}/>:row.art==='field'?<FieldArt id={row.icon as Net|Bait} size={size}/>:row.art==='cocoon'?<FieldActivityArt id="cocoon" size={size}/>:<Glyph name={row.icon as GlyphName} size={size}/>;}
export function RewardFeedbackV2({batch,visible=true,onDismiss}:{batch:RewardBatch|null;visible?:boolean;onDismiss:(id:string)=>void}){
 const info=useInfo(),dismiss=useRef(onDismiss);dismiss.current=onDismiss;
 useEffect(()=>{if(!batch||!visible)return;const timer=setTimeout(()=>batch.rows.forEach(row=>dismiss.current(row.id)),3200);return()=>clearTimeout(timer);},[batch?.id,visible]);
 if(!visible||!batch?.rows.length||batch.rows.every(row=>batch.dismissed.includes(row.id)))return null;
 const summary=()=>{info.show({title:'Ontvangen',body:batch.rows.map(r=>'+'+r.count.toLocaleString('nl-NL')+' '+r.name).join('\n'),icon:'gift'});batch.rows.forEach(row=>onDismiss(row.id));};
 return <RewardHost><Pressable pointerEvents="auto" accessibilityRole="button" accessibilityLabel="Bekijk beloningen" onPress={summary} style={{minHeight:46,paddingHorizontal:12,paddingVertical:6,borderRadius:15,backgroundColor:'#173F35F5',borderWidth:1,borderColor:'#7EAA83',flexDirection:'row',flexWrap:'wrap',justifyContent:'center',alignItems:'center',gap:9}}><Label small bold>Beloning</Label>{batch.rows.slice(0,2).map(row=><View key={row.id} accessibilityLabel={row.name+': +'+row.count} style={{flexDirection:'row',flexShrink:0,alignItems:'center',gap:3}}><Art row={row} size={23}/><Label small bold>+{row.count.toLocaleString('nl-NL')}</Label></View>)}{batch.rows.length>2&&<Label small>+{batch.rows.length-2}</Label>}</Pressable></RewardHost>;
}
