import React,{useEffect} from 'react';
import {Pressable,Text,View} from 'react-native';
import {family} from '../game/goV2';
import {weeklyWalkV2} from '../game/weeklyWalkV2';
import type {GameViewV2} from '../game/typesV2';
import {Glyph} from './uiV2';
import {SpriteView} from './artV2';

export type SyncReport={meters:number;catches:number;chests:number;candy:number;buddy?:string;weekMeters:number;nextKm:number|null};
/** What one Adventure Sync added, from the confirmed server state before and after. */
export function syncReport(before:GameViewV2|null,after:GameViewV2|null):SyncReport|null{
 if(!before||!after)return null;const a=before.player,b=after.player,meters=Math.max(0,(b.field?.walk?.meters??0)-(a.field?.walk?.meters??0)),catches=Math.max(0,(b.go?.auto.totals?.caught??0)-(a.go?.auto.totals?.caught??0));
 const wa=weeklyWalkV2(a,before.now),wb=weeklyWalkV2(b,after.now),chests=wb.week===wa.week?Math.max(0,wb.claimed.length-wa.claimed.length):wb.claimed.length;
 const buddy=b.specimens.find(s=>s.id===b.buddy&&s.go)?.species,key=buddy?family(buddy):'',candy=key?Math.max(0,(b.go?.candy[key]??0)-(a.go?.candy[key]??0)):0;
 return {meters,catches,chests,candy,buddy,weekMeters:wb.meters,nextKm:wb.next?.km??null};
}
/** Compact distance/catch receipt; the return screen and inventory hold the full rewards. */
export function AdventureSyncBannerV2({report,onClose}:{report:SyncReport|null;onClose:()=>void}){
 useEffect(()=>{if(!report)return;const t=setTimeout(onClose,8000);return()=>clearTimeout(t);},[report]);
 if(!report)return null;
 return <Pressable testID="adventure-sync-banner" accessibilityRole="button" accessibilityLabel={'Adventure Sync: '+(report.meters/1000).toLocaleString('nl-NL',{maximumFractionDigits:1})+' km, '+report.catches+' bugs. Tik om te sluiten.'} onPress={onClose} style={{position:'absolute',alignSelf:'center',top:10,zIndex:60,paddingHorizontal:10,paddingVertical:4,borderRadius:18,backgroundColor:'#214F3CF2',borderWidth:1,borderColor:'#8BAE7D',flexDirection:'row',alignItems:'center',gap:12}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:4}}><Glyph name="compass" size={20}/><Text style={{color:'#FFFDF2',fontWeight:'800',fontSize:12}}>{(report.meters/1000).toLocaleString('nl-NL',{maximumFractionDigits:1})+' km'}</Text></View>
  <View style={{flexDirection:'row',alignItems:'center',gap:4}}><SpriteView id="ant" size={20}/><Text style={{color:'#FFFDF2',fontWeight:'800',fontSize:12}}>{report.catches}</Text></View>
 </Pressable>;
}
