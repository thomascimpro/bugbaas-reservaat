import React,{useEffect,useRef,useState} from 'react';
import {AppState,Modal,Pressable,Text,useWindowDimensions,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {GameViewV2} from '../game/typesV2';
import {awayCursorV2,awaySummaryV2,validAwayCursorV2} from '../game/awaySummaryV2';
import type {AwayCursorV2,AwaySummaryV2 as Report} from '../game/awaySummaryV2';
import {species} from '../game/catalogV2';
import {movePool} from '../game/goV2';
import {SpriteView} from './artV2';
import {GO_TYPES} from './GoTypeV2';
import {Button,font,Glyph,Label,Panel,V} from './uiV2';
import type {PlayerV2} from '../game/typesV2';
const weekTiers=(p:PlayerV2)=>awayCursorV2(p).tiers??0,healthAt=(p:PlayerV2)=>p.field?.healthSync?.at??0;

/** Only a notification: every catch, resource and distance comes from confirmed server state. */
export function AwaySummaryV2({view,visible,open}:{view:GameViewV2|null;visible:boolean;open:(name:string,id?:string)=>void}){
 const current=useRef(view),uid=useRef(''),cursor=useRef<AwayCursorV2|null>(null),returning=useRef(false),ignore=useRef<GameViewV2|null>(null),late=useRef<{cursor:AwayCursorV2;until:number;away:number;tiers:number;health:number;meters:number}|null>(null),[report,setReport]=useState<Report|null>(null);current.current=view;
 const key=(id:string)=>'bugbaas-away-summary-v1:'+id;
 function consider(next:GameViewV2){
  if(uid.current!==next.player.uid||!cursor.current||AppState.currentState!=='active'||next===ignore.current)return;
  const away=next.player.go?.auto.awayCount??0;
  if(returning.current){const found=awaySummaryV2(next.player,cursor.current);returning.current=false;const show=!!(found.caught||found.missed||found.spins||found.meters>=100||found.reached.length);late.current={cursor:cursor.current,until:Date.now()+150000,away,tiers:weekTiers(next.player),health:healthAt(next.player),meters:show?found.meters:0};if(show)setReport(found);}
  // Adventure Sync kilometres arrive up to a minute after returning; their catches, distance and weekly chests still belong in this summary.
  else if(late.current&&Date.now()<late.current.until){const l=late.current,found=awaySummaryV2(next.player,l.cursor),tiers=weekTiers(next.player),health=healthAt(next.player);if(away>l.away||tiers>l.tiers||health>l.health&&found.meters>=l.meters+100){l.away=away;l.tiers=tiers;l.health=health;l.meters=found.meters;setReport(found);}}
  cursor.current=awayCursorV2(next.player);void AsyncStorage.setItem(key(next.player.uid),JSON.stringify(cursor.current)).catch(()=>{});
 }
 useEffect(()=>{
  const id=view?.player.uid;uid.current=id??'';cursor.current=null;setReport(null);if(!id)return;let alive=true;
  void AsyncStorage.getItem(key(id)).then(raw=>{if(!alive||current.current?.player.uid!==id)return;let saved:unknown;try{saved=raw?JSON.parse(raw):null;}catch{}cursor.current=validAwayCursorV2(saved)?saved:awayCursorV2(current.current.player);returning.current=validAwayCursorV2(saved);ignore.current=null;consider(current.current);}).catch(()=>{if(alive&&current.current?.player.uid===id)cursor.current=awayCursorV2(current.current.player);});
  return()=>{alive=false;};
 },[view?.player.uid]);
 useEffect(()=>{if(view)consider(view);},[view]);
 useEffect(()=>{const listener=AppState.addEventListener('change',state=>{if(state==='active'){returning.current=true;ignore.current=current.current;}else if(current.current?.player.uid===uid.current){cursor.current=awayCursorV2(current.current.player);void AsyncStorage.setItem(key(uid.current),JSON.stringify(cursor.current)).catch(()=>{});}});return()=>listener.remove();},[]);
 const {height}=useWindowDimensions(),[page,setPage]=useState(0),perPage=height<600?4:8,pages=Math.max(1,Math.ceil((report?.bugs.length??0)/perPage)),shownPage=Math.min(page,pages-1);
 useEffect(()=>setPage(0),[report?.bugs[0]?.id]);
 const close=()=>setReport(null),show=visible&&!!report;
 return <Modal visible={show} transparent animationType="fade" onRequestClose={close}><View style={{flex:1,backgroundColor:'#061F25BB',justifyContent:'center',alignItems:'center',padding:16}}>{report&&<Panel style={{width:'100%',maxWidth:340,maxHeight:'92%',backgroundColor:'#153F35',gap:8,padding:12}}><Label bold center>Terwijl je weg was</Label><View style={{flexDirection:'row',justifyContent:'center',gap:24}}><View accessibilityLabel={'Afgelegd: '+report.meters+' meter'} style={{flexDirection:'row',alignItems:'center',gap:4}}><Glyph name="compass" size={23}/><Label bold>{(report.meters/1000).toLocaleString('nl-NL',{maximumFractionDigits:2})+' km'}</Label></View><View accessibilityLabel={'Gevangen: '+report.caught} style={{flexDirection:'row',alignItems:'center',gap:4}}><SpriteView id="ant" size={23}/><Label bold>{report.caught}</Label></View></View>
   {!!report.bugs.length&&<View testID="away-caught-bugs" style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:6}}>{report.bugs.slice(shownPage*perPage,(shownPage+1)*perPage).map(b=>{const name=species(b.species!).name,types=movePool(b.species!).types,color=GO_TYPES[types[0]].color,cp=b.cp===undefined?'CP —':'CP '+b.cp;return <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={name+' · '+cp+' · '+types.map(t=>GO_TYPES[t].name).join(' / ')+(b.shiny?' · shiny':'')} accessibilityHint="Open deze bug" onPress={()=>{close();open('team',b.specimenId);}} style={{width:'23%',flexGrow:1,maxWidth:'24%',alignItems:'center',paddingVertical:4,paddingHorizontal:1,borderRadius:12,borderWidth:1,borderColor:color,backgroundColor:color+'38'}}><View><SpriteView id={b.species!} shiny={b.shiny} size={42}/>{b.shiny&&<View style={{position:'absolute',right:0,top:0}}><Label small bold color="#FFE18B">✦</Label></View>}</View><Text style={{fontFamily:font,fontSize:11,fontWeight:'700',color:V.ink,fontVariant:['tabular-nums']}}>{cp}</Text></Pressable>;})}</View>}
   {pages>1&&<View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:16}}><Pressable accessibilityRole="button" accessibilityLabel="Vorige bugs" disabled={shownPage===0} onPress={()=>setPage(shownPage-1)} style={{minWidth:40,minHeight:32,alignItems:'center',justifyContent:'center',opacity:shownPage?1:.3}}><Label bold>‹</Label></Pressable><Label small>{shownPage+1} / {pages}</Label><Pressable accessibilityRole="button" accessibilityLabel="Volgende bugs" disabled={shownPage===pages-1} onPress={()=>setPage(shownPage+1)} style={{minWidth:40,minHeight:32,alignItems:'center',justifyContent:'center',opacity:shownPage<pages-1?1:.3}}><Label bold>›</Label></Pressable></View>}
   {(report.dust>0||report.xp>0||report.reached.length>0)&&<View style={{flexDirection:'row',justifyContent:'center',gap:14}}>{report.dust>0&&<View accessibilityLabel={'Stof: '+report.dust} style={{flexDirection:'row',alignItems:'center',gap:3}}><Glyph name="nectar" size={18}/><Label small>+{report.dust}</Label></View>}{report.xp>0&&<View accessibilityLabel={'XP: '+report.xp} style={{flexDirection:'row',alignItems:'center',gap:3}}><Glyph name="star" size={18}/><Label small>+{report.xp}</Label></View>}{report.reached.length>0&&<View accessibilityLabel={'Weekkisten: '+report.reached.length} style={{flexDirection:'row',alignItems:'center',gap:3}}><Glyph name="gift" size={18}/><Label small>+{report.reached.length}</Label></View>}</View>}
   <View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button small secondary icon="book" onPress={()=>{close();open('team');}}>Bugs</Button></View><View style={{flex:1}}><Button small onPress={close}>Verder</Button></View></View></Panel>}</View></Modal>;
}
