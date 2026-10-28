import React,{useEffect,useRef,useState} from 'react';
import {AppState,Modal,Pressable,ScrollView,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {GameViewV2} from '../game/typesV2';
import {awayCursorV2,awaySummaryV2,validAwayCursorV2} from '../game/awaySummaryV2';
import type {AwayCursorV2,AwaySummaryV2 as Report} from '../game/awaySummaryV2';
import {species} from '../game/catalogV2';
import {SpriteView} from './artV2';
import {Button,Counter,Label,Panel,Title,V} from './uiV2';

/** Only a notification: every catch, resource and distance comes from confirmed server state. */
export function AwaySummaryV2({view,visible,open}:{view:GameViewV2|null;visible:boolean;open:(name:string,id?:string)=>void}){
 const current=useRef(view),uid=useRef(''),cursor=useRef<AwayCursorV2|null>(null),returning=useRef(false),ignore=useRef<GameViewV2|null>(null),late=useRef<{cursor:AwayCursorV2;until:number;away:number}|null>(null),[report,setReport]=useState<Report|null>(null);current.current=view;
 const key=(id:string)=>'bugbaas-away-summary-v1:'+id;
 function consider(next:GameViewV2){
  if(uid.current!==next.player.uid||!cursor.current||AppState.currentState!=='active'||next===ignore.current)return;
  const away=next.player.go?.auto.awayCount??0;
  if(returning.current){const found=awaySummaryV2(next.player,cursor.current);returning.current=false;late.current={cursor:cursor.current,until:Date.now()+150000,away};if(found.caught||found.missed||found.spins||found.meters>=100)setReport(found);}
  // Adventure Sync kilometres arrive up to a minute after returning; their catches still belong in this summary.
  else if(late.current&&Date.now()<late.current.until&&away>late.current.away){late.current.away=away;setReport(awaySummaryV2(next.player,late.current.cursor));}
  cursor.current=awayCursorV2(next.player);void AsyncStorage.setItem(key(next.player.uid),JSON.stringify(cursor.current)).catch(()=>{});
 }
 useEffect(()=>{
  const id=view?.player.uid;uid.current=id??'';cursor.current=null;setReport(null);if(!id)return;let alive=true;
  void AsyncStorage.getItem(key(id)).then(raw=>{if(!alive||current.current?.player.uid!==id)return;let saved:unknown;try{saved=raw?JSON.parse(raw):null;}catch{}cursor.current=validAwayCursorV2(saved)?saved:awayCursorV2(current.current.player);returning.current=validAwayCursorV2(saved);ignore.current=null;consider(current.current);}).catch(()=>{if(alive&&current.current?.player.uid===id)cursor.current=awayCursorV2(current.current.player);});
  return()=>{alive=false;};
 },[view?.player.uid]);
 useEffect(()=>{if(view)consider(view);},[view]);
 useEffect(()=>{const listener=AppState.addEventListener('change',state=>{if(state==='active'){returning.current=true;ignore.current=current.current;}else if(current.current?.player.uid===uid.current){cursor.current=awayCursorV2(current.current.player);void AsyncStorage.setItem(key(uid.current),JSON.stringify(cursor.current)).catch(()=>{});}});return()=>listener.remove();},[]);
 const close=()=>setReport(null),show=visible&&!!report;
 return <Modal visible={show} transparent animationType="fade" onRequestClose={close}><View style={{flex:1,backgroundColor:'#061F25BB',justifyContent:'center',alignItems:'center',padding:18}}>{report&&<Panel style={{width:'100%',maxWidth:460,maxHeight:'85%',backgroundColor:'#153F35',gap:15}}><Title>Terug van avontuur</Title><View style={{flexDirection:'row',justifyContent:'space-around',flexWrap:'wrap',gap:12}}><Counter icon="leaf" value={report.caught} label="Gevangen"/><Counter icon="compass" value={(report.meters/1000).toLocaleString('nl-NL',{maximumFractionDigits:2})+' km'} label="Afgelegd"/>{report.dust>0&&<Counter icon="nectar" value={report.dust} label="Stof"/>}{report.xp>0&&<Counter icon="star" value={report.xp} label="XP"/>}</View>{(report.missed>0||report.spins>0)&&<Label small center>{[report.missed?report.missed+' ontsnapt':'',report.spins?report.spins+' posten bezocht':''].filter(Boolean).join(' · ')}</Label>}
   {!!report.bugs.length&&<ScrollView style={{maxHeight:240}} contentContainerStyle={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{report.bugs.map(b=><Pressable key={b.id} accessibilityRole="button" accessibilityLabel={species(b.species!).name+(b.shiny?' shiny':'')} onPress={()=>{close();open('team',b.specimenId);}} style={{width:'30%',alignItems:'center',padding:5,borderRadius:15,backgroundColor:'#244F42'}}><SpriteView id={b.species!} shiny={b.shiny} size={75}/><Label small center>{species(b.species!).name}{b.shiny?' ✦':''}</Label></Pressable>)}</ScrollView>}
   <Button icon="book" onPress={()=>{close();open('team');}}>Bekijk bugs</Button><Button small secondary onPress={close}>Verder</Button></Panel>}</View></Modal>;
}
