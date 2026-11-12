import React from 'react';
import {Pressable,View} from 'react-native';
import {Glyph,Label,useInfo} from './uiV2';
import type {Glyph as GlyphName} from './uiV2';
import {FieldArt,FieldActivityArt} from './FieldArtV2';
import type {Net,Bait} from '../game/fieldV2';
import type {RewardRow} from './resourceGainV2';
import {RewardHost} from './RewardHostV2';
import {CandyIconV2} from './CandyIconV2';
export type {RewardBatch} from './rewardBatchV2';
import type {RewardBatch} from './rewardBatchV2';
function Art({row,size=36}:{row:RewardRow;size?:number}){return row.art==='candy'||row.art==='xl'?<CandyIconV2 family={row.icon} size={size} xl={row.art==='xl'}/>:row.art==='field'?<FieldArt id={row.icon as Net|Bait} size={size}/>:row.art==='cocoon'?<FieldActivityArt id="cocoon" size={size}/>:<Glyph name={row.icon as GlyphName} size={size}/>;}
export function RewardFeedbackV2({batch,visible=true,onDismiss}:{batch:RewardBatch|null;visible?:boolean;onDismiss:(id:string)=>void}){
 const info=useInfo();
 if(!visible||!batch?.rows.length||batch.rows.every(row=>batch.dismissed.includes(row.id)))return null;
 const pending=batch.rows.filter(row=>!batch.dismissed.includes(row.id));
 const summary=()=>{info.show({title:'Ontvangen',body:pending.map(r=>'+'+r.count.toLocaleString('nl-NL')+' '+r.name).join('\n'),icon:'gift'});batch.rows.forEach(row=>onDismiss(row.id));};
 return <RewardHost><Pressable pointerEvents="auto" accessibilityRole="button" accessibilityLabel="Bekijk beloningen" onPress={summary} style={{minHeight:46,paddingHorizontal:12,paddingVertical:6,borderRadius:15,backgroundColor:'#173F35F5',borderWidth:1,borderColor:'#7EAA83',flexDirection:'row',flexWrap:'wrap',justifyContent:'center',alignItems:'center',gap:9}}><Label small bold>Beloning</Label>{pending.slice(0,2).map(row=><View key={row.id} accessibilityLabel={row.name+': +'+row.count} style={{flexDirection:'row',flexShrink:0,alignItems:'center',gap:3}}><Art row={row} size={23}/><Label small bold>+{row.count.toLocaleString('nl-NL')}</Label></View>)}{pending.length>2&&<Label small>+{pending.length-2}</Label>}</Pressable></RewardHost>;
}
