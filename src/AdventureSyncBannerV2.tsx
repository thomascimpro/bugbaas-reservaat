import React,{useEffect} from 'react';
import {Pressable,Text,View} from 'react-native';
import {family} from '../game/goV2';
import {weeklyWalkV2} from '../game/weeklyWalkV2';
import type {GameViewV2} from '../game/typesV2';
import {CandyIconV2} from './CandyIconV2';

export type SyncReport={meters:number;catches:number;chests:number;candy:number;buddy?:string;weekMeters:number;nextKm:number|null};
/** What one Adventure Sync added, from the confirmed server state before and after. */
export function syncReport(before:GameViewV2|null,after:GameViewV2|null):SyncReport|null{
 if(!before||!after)return null;const a=before.player,b=after.player,meters=Math.max(0,(b.field?.walk?.meters??0)-(a.field?.walk?.meters??0)),catches=Math.max(0,(b.go?.auto.totals?.caught??0)-(a.go?.auto.totals?.caught??0));
 const wa=weeklyWalkV2(a,before.now),wb=weeklyWalkV2(b,after.now),chests=wb.week===wa.week?Math.max(0,wb.claimed.length-wa.claimed.length):wb.claimed.length;
 const buddy=b.specimens.find(s=>s.id===b.buddy&&s.go)?.species,key=buddy?family(buddy):'',candy=key?Math.max(0,(b.go?.candy[key]??0)-(a.go?.candy[key]??0)):0;
 return {meters,catches,chests,candy,buddy,weekMeters:wb.meters,nextKm:wb.next?.km??null};
}
/** Top banner after every Adventure Sync that brought something: km walked, catches, chests and buddy nectar. */
export function AdventureSyncBannerV2({report,onClose}:{report:SyncReport|null;onClose:()=>void}){
 useEffect(()=>{if(!report)return;const t=setTimeout(onClose,8000);return()=>clearTimeout(t);},[report]);
 if(!report)return null;
 const chip=(text:string,key:string)=><View key={key} style={{paddingHorizontal:8,paddingVertical:3,borderRadius:10,backgroundColor:'#0B2A23CC'}}><Text style={{color:'#FFF3D5',fontWeight:'800',fontSize:13}}>{text}</Text></View>;
 return <Pressable testID="adventure-sync-banner" accessibilityRole="button" accessibilityLabel="Sluit Adventure Sync-melding" onPress={onClose} style={{position:'absolute',left:12,right:12,top:12,zIndex:60,paddingHorizontal:10,paddingVertical:7,borderRadius:16,backgroundColor:'#2F6B3AF2',borderWidth:1,borderColor:'#F2D16E',flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:6,boxShadow:'0px 4px 12px #061F1ACC'}}>
  <Text style={{color:'#FFFDF2',fontWeight:'900',fontSize:14}}>{'👟 +'+(report.meters/1000).toLocaleString('nl-NL',{maximumFractionDigits:1})+' km'}</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:5,alignItems:'center'}}>
   {report.catches>0&&chip('🐞 +'+report.catches+' gevangen','c')}
   {report.chests>0&&chip('🎁 +'+report.chests+' weekkist','w')}
   {report.candy>0&&report.buddy&&<View key="n" style={{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:8,paddingVertical:2,borderRadius:10,backgroundColor:'#0B2A23CC'}}><CandyIconV2 family={family(report.buddy)} size="small"/><Text style={{color:'#FFF3D5',fontWeight:'800',fontSize:13}}>{'+'+report.candy}</Text></View>}
   
  </View>
 </Pressable>;
}
