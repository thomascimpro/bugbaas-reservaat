import {activeEvent} from '../game/eventsV2';
import {TrainerPortrait} from './AvatarV2';
import {DailyResearchV2} from './TrainerV2';
import {FieldBagV2} from './FieldBagV2';
import {BeginnerGuideV2,useBeginnerGuideV2} from './BeginnerGuideV2';
import {unlockLevel} from '../game/beginnerGuideV2';
import {trainerLevel} from '../game/trainerV2';
import {GO_DAILY,dailyProgress} from '../game/dailyResearchV2';
import {PostArtV2,WorldSitesSheetV2} from './WorldSitesV2';
import {RoutesSheetV2} from './RoutesV2';
import type {FieldTarget} from './WorldSitesV2';
import {useGoBack} from './GoBackV2';
import React,{useContext,useEffect,useState} from 'react';
import {Modal,Pressable,ScrollView,Text,View} from 'react-native';
import {cocoonWalked,cocoonActive} from '../game/goCocoonsV2';
import type {GameViewV2} from '../game/typesV2';
import type {FieldEnvironment} from '../game/habitatsV2';
import type {Fix,WildBug} from '../game/walkingV2';
import {CATCH_RADIUS,distance} from '../game/walkingV2';
import {species} from '../game/catalogV2';
import {bugRarity,RARITY_TIERS} from '../game/rarityDisplayV2';
import type {RunV2} from './ShopViewV2';
import {SpriteView} from './artV2';
import {FieldArt,FieldActivityArt} from './FieldArtV2';
import {environmentInfo} from './EnvironmentV2';
import {font,Glyph,IconButton,MotionPrefs,Title,useInfo,V} from './uiV2';
import type {GameIconName} from './gameUiArt';
import {PO,PoChoice,PoCircle,PoClose,PoPill,PoSheet,poText} from './PogoUiV2';
import {AutoCatchToastV2} from './AutoCatchToastV2';
import {GYM_TEAMS} from '../game/gymsV2';
import {walkTodayText} from '../game/walkCatchV2';

/** Camera actions of the 3D map, offered in the net menu (the map itself only keeps pinch/scroll zoom). */
export type MapControlsV2={tilted:()=>boolean;toggleTilt:()=>void;zoom:(by:number)=>void};

type Sheet='options'|'menu'|'still'|'bag'|'research'|'nearby'|'lure'|'auto'|'post'|'routes'|null;
const LIGHT:Sheet[]=['options','menu','nearby','still','lure','auto'];

function FieldSheetHost({menu,visible,inset,reduced,onClose,children}:{menu:boolean;visible:boolean;inset:number;reduced:boolean;onClose:()=>void;children:React.ReactNode}){
 return menu?<View style={{position:'absolute',inset:0,bottom:inset,zIndex:40}}>{children}</View>:<Modal visible={visible} transparent animationType={reduced?'none':'slide'} onRequestClose={onClose}>{children}</Modal>;
}

function RedBadge({count}:{count:number}){return count>0?<View pointerEvents="none" accessibilityLabel={count+' klaar'} style={{position:'absolute',right:-3,top:-3,minWidth:22,height:22,borderRadius:11,paddingHorizontal:5,backgroundColor:PO.raid,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:PO.white}}><Text style={{fontFamily:font,color:PO.white,fontSize:11,fontWeight:'800'}}>{count}</Text></View>:null;}

/** PoChoice look (white circle + short grey name), but with its own accessibility label and optional painted art instead of a Glyph. */
function MenuChoice({label,name,icon,art,badge=0,lockedAt=0,onPress,testID}:{label:string;name:string;icon?:GameIconName;art?:React.ReactNode;badge?:number;lockedAt?:number;onPress:()=>void;testID?:string}){
 const size=58;
 return <View style={{width:'33.333%',alignItems:'center',gap:5,paddingVertical:5}}>
  <View style={{width:size,height:size}}><PoCircle testID={testID} size={size} label={lockedAt?label+' (vanaf level '+lockedAt+')':label} onPress={onPress}><View style={{opacity:lockedAt?.35:1}}>{art??(icon&&<Glyph name={icon} size={size*.68}/>)}</View></PoCircle>
   {lockedAt?<View pointerEvents="none" style={{position:'absolute',right:-10,top:-6,flexDirection:'row',alignItems:'center',gap:1,height:22,paddingHorizontal:5,borderRadius:11,backgroundColor:PO.surface,boxShadow:'0px 1px 4px #1E3C3233'}}><Glyph name="lock" size={14}/><Text style={{fontFamily:font,fontSize:10,fontWeight:'800',color:PO.muted}}>{lockedAt}</Text></View>:<RedBadge count={badge}/>}</View>
  <Text numberOfLines={1} style={{fontFamily:font,fontSize:12,fontWeight:'700',color:lockedAt?PO.muted:PO.text}}>{name}</Text>
 </View>;
}
const Caption=({children}:{children:string})=><Text style={[poText.label,{marginTop:4,marginLeft:4}]}>{children}</Text>;
const Grid=({children}:{children:React.ReactNode})=><View style={{flexDirection:'row',flexWrap:'wrap'}}>{children}</View>;
const Line=({children,bold}:{children:React.ReactNode;bold?:boolean})=><Text style={{fontFamily:font,fontSize:bold?20:13,fontWeight:bold?'800':'500',color:bold?PO.text:PO.muted,textAlign:'center',lineHeight:bold?26:18}}>{children}</Text>;

export function FieldHomeV2({view,run,busy,gpsReady,spawns,fix,open,onSelect,now,onGPS,postSelection,onPostShown,onTarget,mapVisible=true,onSheetVisible,mapControls,environment,bottomInset=0,onGym}:{onGym?:(id:string)=>void;bottomInset?:0|72;mapControls?:React.MutableRefObject<MapControlsV2|null>;environment?:FieldEnvironment;onSheetVisible?:(visible:boolean)=>void;mapVisible?:boolean;postSelection?:{id:string;nonce:number;shown?:boolean};onPostShown?:(nonce:number)=>void;onTarget?:(target:FieldTarget)=>void;view:GameViewV2;run:RunV2;busy:boolean;gpsReady:boolean;spawns:WildBug[];fix:Fix;open:(name:string)=>void;onSelect:(s:WildBug)=>void;now:number;onGPS:()=>void}){

 const nativeAuto=typeof window!=='undefined'&&!!(window as unknown as {ReactNativeWebView?:unknown}).ReactNativeWebView;

 const [sheet,setSheet]=useState<Sheet>(null),[postId,setPostId]=useState(''),[nearbyKind,setNearbyKind]=useState<'bugs'|'posts'|'gyms'>('bugs'),[eventSeen,setEventSeen]=useState(''),reduced=useContext(MotionPrefs),info=useInfo(),p=view.player,f=p.field!,g=p.go!,buddy=p.specimens.find(s=>s.id===p.buddy&&s.go),nearby=[...spawns].sort((x,y)=>distance(fix,x)-distance(fix,y)),lure=f.lure,activeLure=!!lure&&lure.expiresAt>now,lureUsed=lure?.day===f.daily.day,seconds=Math.max(0,Math.ceil(((lure?.expiresAt??now)-now)/1000)),clock=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'),auto=g.auto,guide=useBeginnerGuideV2(p);

 useEffect(()=>{onSheetVisible?.(!!sheet);return()=>onSheetVisible?.(false);},[!!sheet,onSheetVisible]);

 // Open a tapped post once; after a screen closes the field remounts and must not reopen it.
 useEffect(()=>{if(postSelection&&!postSelection.shown){setPostId(postSelection.id);setSheet('post');onPostShown?.(postSelection.nonce);}},[postSelection?.nonce]);

 useGoBack(!!sheet,()=>{setSheet(null);return true;},20);

 const navigate=(name:string)=>{setSheet(null);open(name);};

 useEffect(()=>{if(nativeAuto||!auto.enabled||!gpsReady||typeof navigator==='undefined')return;let lock:{release:()=>Promise<void>}|undefined,removed=false;const request=async()=>{try{const api=(navigator as unknown as {wakeLock?:{request:(t:string)=>Promise<{release:()=>Promise<void>}>}}).wakeLock;if(api&&document.visibilityState==='visible'){const next=await api.request('screen');if(removed)await next.release();else lock=next;}}catch{}};void request();const visible=()=>{if(!document.hidden)void request();};document.addEventListener('visibilitychange',visible);return()=>{removed=true;document.removeEventListener('visibilitychange',visible);void lock?.release().catch(()=>{});};},[auto.enabled,gpsReady]);

 const cocoonsReady=g.cocoons?.items.filter(item=>cocoonActive(p,item.id)&&cocoonWalked(p,item.id)>=item.km*1000).length??0;

 const event=activeEvent(now),researchReady=GO_DAILY.filter(t=>dailyProgress(p,t.id)>=t.goal&&!f.daily.claimed.includes(t.id)).length,giftsReady=view.friends.filter(friend=>friend.accepted&&friend.gifts[1-friend.users.indexOf(p.uid)]&&!friend.gifts[1-friend.users.indexOf(p.uid)]?.opened).length;

 const tradesReady=(view.goTrades??[]).filter(t=>t.status==='offering'&&t.expiresAt>now&&view.friends.some(f=>f.id===t.pair&&f.accepted)&&!t.accepted[t.users.indexOf(p.uid)]).length;

 const level=trainerLevel(g.trainer?.xp??0),lockedAt=(label:string)=>{const need=unlockLevel(label);return level<need?need:0;},locked=(label:string,go:()=>void)=>lockedAt(label)?()=>info.show({title:label,icon:'lock',body:'Dit speel je vrij op level '+unlockLevel(label)+'. Vang bugs en draai posten om sneller te groeien.'}):go;

 const raidReady=(view.raidInvites?.filter(i=>i.endsAt>now).length??0)+(view.raidLobby&&view.raidLobby.status!=='lobby'&&view.raidLobby.status!=='fighting'?1:0),routeReady=g.sites?.run?.status==='ready'||g.sites?.recording?.status==='ready'?1:0,eventNew=event&&eventSeen!==event.name?1:0;

 const PLAY=[{label:'Mijn team',icon:'team',go:()=>navigate('teamPicker'),count:0},{label:'Tas',icon:'bag',go:()=>navigate('bag'),count:!f.daily.supply?1:0},{label:'Bugdex',icon:'book',go:()=>navigate('bugdex'),count:0},{label:'Cocons',icon:'clock',go:()=>navigate('cocoons'),count:cocoonsReady},{label:'Buddy',icon:'heart',go:()=>navigate('buddy'),count:0},{label:'Gyms',icon:'shield',go:()=>navigate('gyms'),count:raidReady},{label:'Vrienden',icon:'friends',go:()=>navigate('friends'),count:giftsReady+tradesReady},{label:'Doelen',icon:'research',go:()=>navigate('goals'),count:researchReady},{label:'Instellingen',icon:'settings',go:()=>navigate('settings'),count:0}] as const;

 // Everything that used to sit on the map; the net shows one red count for all of it.
 const ready=PLAY.reduce((sum,item)=>sum+(lockedAt(item.label)?0:item.count),0)+(lockedAt('Routes')?0:routeReady)+(guide?.fresh?1:0)+eventNew;

 const openMenu=()=>{setSheet('menu');guide?.markSeen();if(event)setEventSeen(event.name);};


 const weather=environment?environmentInfo(environment):{title:'Weer',icon:'compass' as const,body:'Het weer en het leefgebied verschijnen zodra je GPS nauwkeurig is.'};

 return <>

  {!sheet&&<>
  {mapVisible&&auto.enabled&&<AutoCatchToastV2 player={p}/>}
  {mapVisible&&auto.enabled&&<View pointerEvents="box-none" style={{position:'absolute',right:16,top:138,alignItems:'center',gap:4}}><PoCircle size={50} label="Autovangst" onPress={()=>setSheet('auto')} ring={PO.teal}>{auto.last&&now-auto.last.at<10000?<SpriteView id={auto.last.species} size={40}/>:<FieldArt id="basic" size={38}/>}</PoCircle><View pointerEvents="none" style={{paddingHorizontal:7,paddingVertical:1,borderRadius:9,backgroundColor:PO.surface}}><Text style={{fontFamily:font,fontSize:10,fontWeight:'800',color:PO.tealText}}>{auto.status==='too-fast'?'Te snel':auto.status==='gps'?'GPS':auto.status==='empty'?'Op':auto.last&&now-auto.last.at<10000?(auto.last.caught?'Raak!':'Weg'):'Auto'}</Text></View></View>}

  <View pointerEvents="box-none" style={{position:'absolute',right:16,top:78}}><PoCircle size={48} label="Kaartopties" onPress={()=>setSheet('options')}><Glyph name="settings" size={28}/></PoCircle></View>
  {/* Zoom below the GPS status row; the host already reserves space for navigation. */}
  <View pointerEvents="box-none" style={{position:'absolute',left:16,top:78,gap:10}}>
   <PoCircle size={44} label="Zoom in" onPress={()=>mapControls?.current?.zoom(1)}><Text style={{fontFamily:font,fontSize:24,fontWeight:'700',color:PO.text}}>+</Text></PoCircle>
   <PoCircle size={44} label="Zoom uit" onPress={()=>mapControls?.current?.zoom(-1)}><Text style={{fontFamily:font,fontSize:24,fontWeight:'700',color:PO.text}}>−</Text></PoCircle>
  </View>
  <View pointerEvents="box-none" style={{position:'absolute',left:16,right:16,bottom:22+bottomInset,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end'}}>
   <View style={{width:72,height:72,justifyContent:'flex-end'}}>
    <PoCircle size={68} label="Open profiel" onPress={()=>open('profile')}><TrainerPortrait legacy={!!p.legacy} avatar={p.avatar} outfit={p.outfit} size={62}/></PoCircle>
    <View pointerEvents="none" style={{position:'absolute',left:-2,bottom:-2,minWidth:24,height:24,paddingHorizontal:5,borderRadius:12,backgroundColor:PO.teal,borderWidth:2,borderColor:PO.white,alignItems:'center',justifyContent:'center'}}><Text style={{fontFamily:font,fontSize:11,fontWeight:'800',color:PO.white}}>{level}</Text></View>
    {g.trainer&&level>g.trainer.claimedLevel&&<RedBadge count={1}/>}
   </View>
   <View style={{width:100,height:100,borderRadius:50,alignItems:'center',justifyContent:'center',backgroundColor:'#BDEBDD80',marginBottom:-6}}>
    <PoCircle size={88} label="Open veldmenu" onPress={openMenu} ring="#A8E2D2"><FieldArt id="basic" size={70}/></PoCircle>
    <RedBadge count={ready}/>
   </View>
   <PoCircle size={68} label="In de buurt" onPress={()=>setSheet('nearby')}>{nearby.length?<View style={{opacity:g.dex?.includes(nearby[0].species)?1:.5}}><SpriteView id={nearby[0].species} size={54}/></View>:<Glyph name={gpsReady?'leaf':'compass'} size={40}/>}</PoCircle>
  </View>

  </>}
  <FieldSheetHost menu={sheet==='menu'} visible={!!sheet} inset={bottomInset} reduced={reduced} onClose={()=>setSheet(null)}><View style={{flex:1,backgroundColor:LIGHT.includes(sheet)?'#0E2B2459':'#092C29A8',alignItems:'center',justifyContent:'flex-end'}}>

  {LIGHT.includes(sheet)?<PoSheet style={{width:'100%',maxWidth:560,maxHeight:sheet==='menu'?'85%':'92%',paddingHorizontal:14,paddingTop:16,paddingBottom:16,gap:10}}>{sheet==='menu'&&<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:48}}><Title>Bugbaas</Title><IconButton name="close" label="Sluit menu" onPress={()=>setSheet(null)}/></View>}<ScrollView style={{flexShrink:1}} contentContainerStyle={{gap:10,paddingBottom:4}}>

   {sheet==='menu'&&<View testID="field-main-menu" style={{gap:6}}>
    {guide&&<BeginnerGuideV2 guide={guide} onAction={action=>{if(action==='nearby'||action==='posts'){setNearbyKind(action==='posts'?'posts':'bugs');setSheet('nearby');}else navigate(action==='team'?'team':action==='battle'?'ranked':'bugdex');}}/>}
    <Grid>{PLAY.map(item=><MenuChoice key={item.label} label={item.label} name={item.label} icon={item.icon} badge={item.count} lockedAt={lockedAt(item.label)} onPress={locked(item.label,item.go)}/>)}</Grid>
   </View>}

   {sheet==='options'&&<><Text style={[poText.big,{textAlign:'center'}]}>Kaart</Text><Grid>
    <MenuChoice label="Routes" name="Routes" icon="compass" badge={routeReady} lockedAt={lockedAt('Routes')} onPress={locked('Routes',()=>setSheet('routes'))}/>
    <MenuChoice label="Wandellokker" name={activeLure?clock:'Lokker'} art={<FieldActivityArt id="incense" size={44}/>} onPress={()=>setSheet('lure')}/>
    <MenuChoice label="Autovangst" name={auto.enabled?'Auto aan':'Auto uit'} art={<FieldArt id="basic" size={40}/>} onPress={()=>setSheet('auto')}/>
    <MenuChoice label="Bioom en weer" name="Weer" icon={environment?.weather.isDay===false?'itemMoon':'itemSun'} onPress={()=>info.show(weather)}/>
    <MenuChoice label="Wat zie ik op de kaart?" name="Uitleg" icon="info" onPress={()=>info.show({title:'Jouw kaart',icon:'compass',body:'Tik een bug om te vangen. Draai een post voor netten. Versla gyms voor munten of een raid voor een zeldzame bug. Veeg om te draaien; knijp of tik +/− om te zoomen.'})}/>
    {event&&<MenuChoice label={event.name} name="Event" icon="star" badge={eventNew} onPress={()=>info.show({title:event.name,icon:'star',body:event.line+' · shiny 1 op '+event.shinyOdds})}/>}
   </Grid></>}

   {sheet==='nearby'&&<>
    <Text style={[poText.big,{textAlign:'center'}]}>In de buurt</Text>
    <View style={{flexDirection:'row',alignSelf:'center',gap:4,padding:4,borderRadius:22,backgroundColor:PO.bg}}>{([['bugs','Bugs'],['posts','Posten'],['gyms','Gyms']] as const).map(([id,name])=><Pressable key={id} accessibilityRole="button" accessibilityLabel={name} accessibilityState={{selected:nearbyKind===id}} onPress={()=>setNearbyKind(id)} style={{minWidth:74,height:44,borderRadius:19,alignItems:'center',justifyContent:'center',backgroundColor:nearbyKind===id?PO.teal:'transparent'}}><Text style={{fontFamily:font,fontSize:14,fontWeight:'800',color:nearbyKind===id?PO.white:PO.muted}}>{name}</Text></Pressable>)}{(p.walking?.routes?.length||g.sites?.run)&&<Pressable accessibilityRole="button" accessibilityLabel="Routes" onPress={()=>setSheet('routes')} style={{minWidth:44,height:44,borderRadius:19,alignItems:'center',justifyContent:'center'}}><Text style={{fontFamily:font,fontSize:14,fontWeight:'800',color:PO.muted}}>↗</Text></Pressable>}</View>
    {nearbyKind==='gyms'?<View testID="nearby-gyms" style={{gap:8}}>{[...(view.goGyms??[])].sort((a,b)=>distance(fix,a)-distance(fix,b)).map(gym=>{const meters=distance(fix,gym),color=gym.team?GYM_TEAMS[gym.team].color:PO.muted,raid=view.raids?.find(r=>(r.site.id==='gym-'+gym.postId||r.site.id===gym.id)&&r.endsAt>now);return <Pressable key={gym.id} accessibilityRole="button" accessibilityLabel={'Open gym '+gym.name} onPress={()=>{setSheet(null);if(onGym)onGym(gym.id);else open('gyms');}} style={{padding:10,minHeight:76,borderRadius:20,backgroundColor:PO.bg,flexDirection:'row',gap:12,alignItems:'center',borderWidth:1,borderColor:color+'77'}}><PoCircle size={52} label="Gym" ring={color}><Glyph name="shield" size={34}/></PoCircle><View style={{flex:1,gap:3}}><Text numberOfLines={1} style={{fontFamily:font,fontSize:15,fontWeight:'800',color:PO.text}}>{gym.name}</Text><Text style={{fontFamily:font,fontSize:12,color:PO.muted}}>{meters<1000?Math.round(meters)+' m':(meters/1000).toLocaleString('nl-NL',{maximumFractionDigits:1})+' km'} · {gym.defenders.length}/6{raid?' · Raid':''}</Text></View><Glyph name={raid?'star':'next'} size={24}/></Pressable>;})}{!view.goGyms?.length&&<Line>Geen gyms in de buurt gevonden.</Line>}</View>:nearbyKind==='posts'?<View style={{gap:8}}>{[...(p.walking?.posts??[])].sort((a,b)=>distance(fix,a)-distance(fix,b)).map(post=>{const cooling=now-(g.sites?.visits[post.id]??0)<300000;return <Pressable key={post.id} accessibilityRole="button" accessibilityLabel={'Open post '+post.name} onPress={()=>{setPostId(post.id);setSheet('post');}} style={{padding:8,borderRadius:20,backgroundColor:PO.bg,flexDirection:'row',gap:10,alignItems:'center'}}><PoCircle size={54} label={post.name}><PostArtV2 size={46} available={!cooling}/></PoCircle><View style={{flex:1}}><Text numberOfLines={1} style={{fontFamily:font,fontSize:15,fontWeight:'800',color:PO.text}}>{post.name}</Text><Text style={{fontFamily:font,fontSize:12,color:PO.muted}}>{Math.round(distance(fix,post))} m</Text></View><Glyph name={cooling?'clock':'gift'} size={28}/></Pressable>;})}{!p.walking?.posts?.length&&<Line>{p.walking?.siteSource==='unavailable'?'Locatiepunten laden tijdelijk niet.':'Geen geschikte insectenposten gevonden.'}</Line>}</View>
    :<View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center'}}>{!nearby.length&&<View style={{alignItems:'center',gap:8,padding:12}}><Glyph name={gpsReady?'leaf':'compass'} size={40}/><Line>{gpsReady?'Geen bugs in de buurt. Wandel rustig verder.':'Zet GPS aan om bugs in de buurt te zien.'}</Line></View>}{nearby.map(s=>{const tier=RARITY_TIERS[bugRarity(s.species)];return <Pressable key={s.id} accessibilityRole="button" accessibilityLabel={'Volg '+species(s.species).name} onPress={()=>{setSheet(null);if(distance(fix,s)<=CATCH_RADIUS)onSelect(s);else onTarget?.({...s,name:species(s.species).name,spawnId:s.id});}} style={({pressed})=>({width:'33.3%',alignItems:'center',gap:4,paddingVertical:6,transform:[{scale:pressed?.95:1}]})}><View accessibilityLabel={'Zeldzaamheid: '+tier.name} style={{width:80,height:80,borderRadius:40,borderWidth:4,borderColor:tier.color,alignItems:'center',justifyContent:'center',backgroundColor:PO.surface,boxShadow:'0px 3px 10px #1E3C3226'+(bugRarity(s.species)>=4?', 0px 0px 10px '+tier.color:'')}}><SpriteView id={s.species} silhouette={!g.dex?.includes(s.species)} size={62}/>{s.weather&&!s.boss&&<View accessibilityLabel="Weerbonus" style={{position:'absolute',right:-5,top:-5,width:24,height:24,borderRadius:12,backgroundColor:PO.surface,borderWidth:2,borderColor:PO.white,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:13}}>🌀</Text></View>}</View><Text style={{fontFamily:font,fontSize:12,fontWeight:'700',color:PO.text}}>{Math.round(distance(fix,s))} m</Text></Pressable>;})}</View>}
   </>}

   {sheet==='still'&&<View testID="still-sheet" style={{gap:12}}><Text style={[poText.big,{textAlign:'center'}]}>🛋️ Zonder lopen</Text><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-around',rowGap:14}}>{([['shield','Raid op afstand','gyms',0],['shield','Gym op afstand','gyms',0],['swords','Vechten','ranked',0],['heart','Buddy aaien','buddy',0],['gift','Cadeaus','friends',giftsReady],['power','Bugs sterker','team',0]] as const).map(([icon,label,go,count])=><View key={label} style={{width:'33%',alignItems:'center'}}><PoChoice icon={label==='Raid op afstand'?'star':icon} label={label} badge={count} size={64} onPress={()=>navigate(go)}/></View>)}</View></View>}

   {sheet==='lure'&&<View style={{alignItems:'center',gap:10}}><Text style={poText.big}>Wandellokker</Text><FieldActivityArt id="incense" size={150}/><Line bold>{activeLure?clock:lureUsed?'Morgen weer':'15 minuten'}</Line>{activeLure&&<Line>{(lure?.caught??0)+' gevangen'}</Line>}<View style={{alignSelf:'stretch'}}>{!gpsReady?<PoPill icon="compass" label="GPS aan" onPress={()=>{setSheet(null);onGPS();}}/>:<PoPill icon="compass" disabled={busy||activeLure||lureUsed} label={activeLure?'Actief':lureUsed?'Vandaag gebruikt':'Start wandeling'} onPress={()=>void run('fieldLure').then(ok=>{if(ok)setSheet(null);})}/>}</View><Line>Elke dag gratis 15 minuten. Loop met de kaart open: na minimaal 25 goedgekeurde meters en 30 seconden verschijnt een extra bug, tot maximaal 20. De timer loopt door na sluiten.</Line></View>}

   {sheet==='auto'&&<View style={{alignItems:'center',gap:10}}><Text style={poText.big}>Autovangst</Text><FieldArt id="basic" size={120}/><Line bold>{auto.enabled?'Aan':'Uit'}</Line><Line bold>{walkTodayText(p,now)}</Line><Line>{'👟 5 per km · 🏃 10 per km'}</Line><View style={{alignSelf:'stretch'}}><PoPill icon={auto.enabled?'close':'check'} disabled={busy} label={auto.enabled?'Uitzetten':!gpsReady?'GPS aan':'Aanzetten'} onPress={()=>{if(!gpsReady&&!auto.enabled){setSheet(null);onGPS();}else void run('goAuto',{enabled:!auto.enabled});}}/></View><Line>{nativeAuto?'Scherm uit: blijft lopen met locatietoestemming.':'Houd deze browserkaart open.'}</Line><Pressable accessibilityRole="button" accessibilityLabel="Uitleg autovangst" onPress={()=>info.show({title:'Autovangst',icon:'compass',body:(nativeAuto?'Android: achtergrondlocatie en meldingen aan. Geforceerd afsluiten of batterijbeperking kan de dienst stoppen. Loopbeloning: 5 bugs per km, of 10 per km bij een workout, tot 120 per dag. Adventure Sync wordt na terugkomst gecontroleerd; dezelfde afstand telt niet dubbel. ':'Een gesloten browsertab telt geen GPS-afstand. ' )+'Elke poging kost 1 standaardnet en heeft 25% minder vangkans dan actief vangen zonder bonus. Alleen onderweg, circa 2,5–25 km/u. Stilstand, slecht GPS en hogere snelheid geven geen vangsten.'})} style={{minHeight:48,justifyContent:'center',alignItems:'center'}}><Text style={{fontFamily:font,color:PO.tealText,fontWeight:'800'}}>ⓘ</Text></Pressable></View>}

  </ScrollView>{sheet!=='menu'&&<View style={{alignItems:'center'}}><PoClose label="Sluit veldscherm" onPress={()=>setSheet(null)}/></View>}</PoSheet>

  :<View style={{width:'100%',maxWidth:560,maxHeight:'89%',backgroundColor:V.paper,borderTopLeftRadius:30,borderTopRightRadius:30,padding:17,gap:14}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Title>{({bag:'Veldtas',research:'Onderzoek',post:'Veldpost',routes:'Routes'} as Record<string,string>)[sheet??'']}</Title><IconButton name="close" label="Sluit veldscherm" onPress={()=>setSheet(null)}/></View><ScrollView contentContainerStyle={{gap:13,paddingBottom:20}}>
   {sheet==='bag'&&<FieldBagV2 {...{view,run,busy}} open={navigate}/>}
   {sheet==='research'&&<DailyResearchV2 player={p} {...{run,busy}}/>}
   {sheet==='post'&&<WorldSitesSheetV2 onGPS={()=>{setSheet(null);onGPS();}} kind={sheet} postId={postId} {...{view,run,busy,gpsReady,fix,now}} onTarget={target=>{setSheet(null);onTarget?.(target);}}/>}{sheet==='routes'&&<RoutesSheetV2 {...{view,run,busy,gpsReady,fix,now}} onTarget={target=>{setSheet(null);onTarget?.(target);}}/>}
  </ScrollView></View>}

  </View></FieldSheetHost>

 </>;

}
