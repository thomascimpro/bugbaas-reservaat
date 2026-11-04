import React,{useContext,useEffect,useRef,useState} from 'react';
import {AppState,Modal,Pressable,Text,useWindowDimensions,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {GameViewV2} from '../game/typesV2';
import {awayCursorV2,awaySummaryV2,validAwayCursorV2} from '../game/awaySummaryV2';
import type {AwayCursorV2,AwaySummaryV2 as Report} from '../game/awaySummaryV2';
import {species} from '../game/catalogV2';
import {walkTodayText} from '../game/walkCatchV2';
import {movePool} from '../game/goV2';
import {SpriteView} from './artV2';
import {GO_TYPES} from './GoTypeV2';
import {font,Glyph,MotionPrefs} from './uiV2';
import {PO,PoPill} from './PogoUiV2';
import {CandyIconV2} from './CandyIconV2';
import {bugRarity,RARITY_TIERS} from '../game/rarityDisplayV2';
import {DEFAULT_TRANSFER_OPTIONS,TRANSFER_BATCH,transferNectarV2,transferSelectionV2} from '../game/transferSelectionV2';
import type {RunV2} from './ShopViewV2';
import type {PlayerV2} from '../game/typesV2';
const weekTiers=(p:PlayerV2)=>awayCursorV2(p).tiers??0,healthAt=(p:PlayerV2)=>p.field?.healthSync?.at??0;

/** Only a notification: every catch, resource and distance comes from confirmed server state. */
/** run/busy are optional: without them the cleanup button stays hidden (GameV2 passes them once wired). */
export function AwaySummaryV2({view,visible,open,run,busy=false}:{view:GameViewV2|null;visible:boolean;open:(name:string,id?:string)=>void;run?:RunV2;busy?:boolean}){
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
 const {height}=useWindowDimensions(),reduced=useContext(MotionPrefs),[page,setPage]=useState(0),[sure,setSure]=useState(false),[sent,setSent]=useState(0),perPage=height<700?6:9,pages=Math.max(1,Math.ceil((report?.bugs.length??0)/perPage)),shownPage=Math.min(page,pages-1);
 useEffect(()=>{setPage(0);setSure(false);setSent(0);},[report?.bugs[0]?.id]);
 const close=()=>setReport(null),show=visible&&!!report,player=view?.player;
 // Weak = what the cleanup helper would send with its default (safe) options, limited to the bugs caught while away.
 const caught=player&&report?report.bugs.map(b=>player.specimens.find(s=>s.id===b.specimenId)).filter((s):s is NonNullable<typeof s>=>!!s):[];
 const weak=player?transferSelectionV2(player,DEFAULT_TRANSFER_OPTIONS,caught).slice(0,TRANSFER_BATCH):[],weakIds=new Set(weak.map(s=>s.id)),nectar=transferNectarV2(weak);
 const discard=()=>{if(!run||busy||!weak.length)return;if(!sure){setSure(true);return;}void run('goTransferMany',{ids:weak.map(s=>s.id)}).then(ok=>{setSure(false);if(ok)setSent(weak.length);});};
 const bugs=report?report.bugs.slice(shownPage*perPage,(shownPage+1)*perPage):[];
 return <Modal visible={show} transparent animationType={reduced?'none':'fade'} onRequestClose={close}><View style={{flex:1,backgroundColor:'#041416CC',justifyContent:'center',alignItems:'center',padding:16,paddingTop:height<700?56:84}}>{report&&<View testID="away-summary" style={{width:'100%',maxWidth:360,maxHeight:'100%',gap:10,padding:14,borderRadius:28,backgroundColor:'#0E2828',borderWidth:1.5,borderColor:PO.rim,boxShadow:'0px 10px 40px #00000099'}}>
   <View style={{alignItems:'center',gap:2}}><Text testID="walk-today" style={{fontFamily:font,fontSize:22,fontWeight:'900',color:PO.text,textAlign:'center'}}>{view?walkTodayText(view.player,view.now):''}</Text>
    <View style={{flexDirection:'row',gap:14}}><Text accessibilityLabel={'Afgelegd: '+report.meters+' meter'} style={{fontFamily:font,fontSize:13,fontWeight:'700',color:PO.muted}}>{'+'+(report.meters/1000).toLocaleString('nl-NL',{maximumFractionDigits:2})+' km'}</Text><Text accessibilityLabel={'Gevangen: '+report.caught} style={{fontFamily:font,fontSize:13,fontWeight:'700',color:PO.muted}}>{'+'+report.caught+' 🐞'}</Text></View></View>
   {!!bugs.length&&<View testID="away-caught-bugs" style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:6}}>{bugs.map(b=>{const s=player?.specimens.find(x=>x.id===b.specimenId),gone=!s,tier=bugRarity(b.species!),color=RARITY_TIERS[tier].color,name=species(b.species!).name,types=movePool(b.species!).types,cp=b.cp===undefined?'CP —':'CP '+b.cp,isWeak=!!s&&weakIds.has(s.id)&&!sent;
    return <Pressable key={b.id} disabled={gone} accessibilityRole="button" accessibilityLabel={name+' · '+cp+' · '+RARITY_TIERS[tier].name+' · '+types.map(t=>GO_TYPES[t].name).join(' / ')+(b.shiny?' · shiny':'')+(isWeak?' · zwak':'')} accessibilityHint="Open deze bug" onPress={()=>{close();open('team',b.specimenId);}}
     style={{width:'31%',maxWidth:104,aspectRatio:.86,alignItems:'center',justifyContent:'center',borderRadius:16,overflow:'hidden',borderWidth:b.shiny?2:1.5,borderColor:b.shiny?PO.gold:color,backgroundColor:color+'55',backgroundImage:'radial-gradient(circle at 50% 38%, '+color+'CC 0%, '+color+'55 55%, #0E2828 100%)',opacity:gone||isWeak&&sure?.45:1} as never}>
     <SpriteView id={b.species!} shiny={b.shiny} size={62}/>
     <Text style={{fontFamily:font,fontSize:12,fontWeight:'800',color:PO.white,fontVariant:['tabular-nums'],textShadowColor:'#000A',textShadowRadius:3}}>{gone?'♻':cp}</Text>
     <View style={{position:'absolute',left:6,top:5,flexDirection:'row'}}>{Array.from({length:tier},(_,i)=><Text key={i} style={{fontSize:8,color:PO.white,textShadowColor:'#0008',textShadowRadius:2}}>★</Text>)}</View>
     {b.shiny&&<Text style={{position:'absolute',right:6,top:3,fontSize:13,color:PO.gold}}>✦</Text>}
     {isWeak&&<View style={{position:'absolute',right:4,bottom:4,width:18,height:18,borderRadius:9,backgroundColor:'#0E2828CC',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:10}}>♻</Text></View>}
    </Pressable>;})}</View>}
   {pages>1&&<View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:16}}><Pressable accessibilityRole="button" accessibilityLabel="Vorige bugs" disabled={shownPage===0} onPress={()=>setPage(shownPage-1)} style={{minWidth:44,minHeight:36,alignItems:'center',justifyContent:'center',opacity:shownPage?1:.3}}><Text style={{fontSize:22,color:PO.text}}>‹</Text></Pressable><Text style={{fontFamily:font,fontSize:13,color:PO.muted}}>{shownPage+1} / {pages}</Text><Pressable accessibilityRole="button" accessibilityLabel="Volgende bugs" disabled={shownPage===pages-1} onPress={()=>setPage(shownPage+1)} style={{minWidth:44,minHeight:36,alignItems:'center',justifyContent:'center',opacity:shownPage<pages-1?1:.3}}><Text style={{fontSize:22,color:PO.text}}>›</Text></Pressable></View>}
   {(report.dust>0||report.xp>0||report.reached.length>0)&&<View style={{flexDirection:'row',justifyContent:'center',gap:14}}>{report.dust>0&&<View accessibilityLabel={'Stof: '+report.dust} style={{flexDirection:'row',alignItems:'center',gap:3}}><Glyph name="nectar" size={18}/><Text style={{fontFamily:font,fontSize:13,fontWeight:'700',color:PO.text}}>+{report.dust}</Text></View>}{report.xp>0&&<View accessibilityLabel={'XP: '+report.xp} style={{flexDirection:'row',alignItems:'center',gap:3}}><Glyph name="star" size={18}/><Text style={{fontFamily:font,fontSize:13,fontWeight:'700',color:PO.text}}>+{report.xp}</Text></View>}{report.reached.length>0&&<View accessibilityLabel={'Weekkisten: '+report.reached.length} style={{flexDirection:'row',alignItems:'center',gap:3}}><Glyph name="gift" size={18}/><Text style={{fontFamily:font,fontSize:13,fontWeight:'700',color:PO.text}}>+{report.reached.length}</Text></View>}</View>}
   {!!run&&weak.length>0&&!sent&&<PoPill testID="away-discard" variant={sure?'raid':'ghost'} height={50} disabled={busy} accessibilityLabel={sure?'Bevestig: '+weak.length+' zwakke bugs wegsturen':weak.length+' zwakke bugs wegsturen voor nectar'} label={(sure?'Zeker? ♻ ':'♻ ')+weak.length+' weg'} onPress={discard}
    right={<View style={{flexDirection:'row',alignItems:'center',gap:2}}>{nectar.slice(0,2).map(([f,n])=><View key={f} style={{flexDirection:'row',alignItems:'center'}}><CandyIconV2 family={f} size={18}/><Text style={{fontFamily:font,fontSize:12,fontWeight:'800',color:PO.text}}>+{n}</Text></View>)}</View>}/>}
   {sent>0&&<Text testID="away-discarded" style={{fontFamily:font,fontSize:13,fontWeight:'800',color:PO.tealText,textAlign:'center'}}>♻ {sent} weg · nectar binnen</Text>}
   <PoPill testID="away-continue" label="Verder" height={52} onPress={close}/></View>}</View></Modal>;
}
