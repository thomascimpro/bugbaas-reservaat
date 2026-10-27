import {TrainerPortrait} from './AvatarV2';

import {DailyResearchV2} from './TrainerV2';

import {FieldBagV2} from './FieldBagV2';

import {trainerLevel} from '../game/trainerV2';

import {GO_DAILY,dailyProgress} from '../game/dailyResearchV2';

import {PostArtV2,WorldSitesSheetV2} from './WorldSitesV2';

import type {FieldTarget} from './WorldSitesV2';

import {useGoBack} from './GoBackV2';

import React,{useContext,useEffect,useState} from 'react';

import {Modal,Pressable,ScrollView,View} from 'react-native';

import Svg,{Circle} from 'react-native-svg';

import {buddyDistance} from '../game/goV2';

import {cocoonWalked,cocoonActive} from '../game/goCocoonsV2';

import {BAITS,NETS} from '../game/fieldV2';

import type {Bait,Net} from '../game/fieldV2';

import type {GameViewV2} from '../game/typesV2';

import type {Fix,WildBug} from '../game/walkingV2';

import {CATCH_RADIUS,distance} from '../game/walkingV2';

import {species} from '../game/catalogV2';

import type {RunV2} from './ShopViewV2';

import {SpriteView} from './artV2';

import {FieldArt,FieldActivityArt} from './FieldArtV2';

import {Button,Counter,Glyph,Help,IconButton,Label,MotionPrefs,Panel,Title,useInfo,V} from './uiV2';

function FieldBadgeV2({count}:{count:number}){return count>0?<View pointerEvents="none" accessibilityLabel={count+' klaar'} style={{position:'absolute',right:-2,top:-3,minWidth:22,height:22,paddingHorizontal:4,borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:'#F1D184',borderWidth:1.5,borderColor:'#F9F4D9'}}><Label small bold color="#173E32">{count}</Label></View>:null;}

type Sheet='menu'|'bag'|'research'|'nearby'|'lure'|'auto'|'post'|'routes'|null;

export function FieldHomeV2({view,run,busy,gpsReady,spawns,fix,open,onSelect,now,onGPS,postSelection,onTarget,mapVisible=true,onSheetVisible}:{onSheetVisible?:(visible:boolean)=>void;mapVisible?:boolean;postSelection?:{id:string;nonce:number};onTarget?:(target:FieldTarget)=>void;view:GameViewV2;run:RunV2;busy:boolean;gpsReady:boolean;spawns:WildBug[];fix:Fix;open:(name:string)=>void;onSelect:(s:WildBug)=>void;now:number;onGPS:()=>void}){

 const nativeAuto=typeof window!=='undefined'&&!!(window as unknown as {ReactNativeWebView?:unknown}).ReactNativeWebView;

 const [sheet,setSheet]=useState<Sheet>(null),[postId,setPostId]=useState(''),[nearbyKind,setNearbyKind]=useState<'bugs'|'posts'>('bugs'),reduced=useContext(MotionPrefs),info=useInfo(),p=view.player,f=p.field!,g=p.go!,buddy=p.specimens.find(s=>s.id===p.buddy&&s.go),nearby=[...spawns].sort((x,y)=>distance(fix,x)-distance(fix,y)),lure=f.lure,activeLure=!!lure&&lure.expiresAt>now,lureUsed=lure?.day===f.daily.day,seconds=Math.max(0,Math.ceil(((lure?.expiresAt??now)-now)/1000)),clock=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'),auto=g.auto;

 useEffect(()=>{onSheetVisible?.(!!sheet);return()=>onSheetVisible?.(false);},[!!sheet,onSheetVisible]);

 useEffect(()=>{if(postSelection){setPostId(postSelection.id);setSheet('post');}},[postSelection?.nonce]);

 useGoBack(!!sheet,()=>{setSheet(null);return true;},20);

 const navigate=(name:string)=>{setSheet(null);open(name);};

 useEffect(()=>{if(nativeAuto||!auto.enabled||!gpsReady||typeof navigator==='undefined')return;let lock:{release:()=>Promise<void>}|undefined,removed=false;const request=async()=>{try{const api=(navigator as unknown as {wakeLock?:{request:(t:string)=>Promise<{release:()=>Promise<void>}>}}).wakeLock;if(api&&document.visibilityState==='visible'){const next=await api.request('screen');if(removed)await next.release();else lock=next;}}catch{}};void request();const visible=()=>{if(!document.hidden)void request();};document.addEventListener('visibilitychange',visible);return()=>{removed=true;document.removeEventListener('visibilitychange',visible);void lock?.release().catch(()=>{});};},[auto.enabled,gpsReady]);

 const cocoonsReady=g.cocoons?.items.filter(item=>cocoonActive(p,item.id)&&cocoonWalked(p,item.id)>=item.km*1000).length??0;

 const researchReady=GO_DAILY.filter(t=>dailyProgress(p,t.id)>=t.goal&&!f.daily.claimed.includes(t.id)).length,giftsReady=view.friends.filter(friend=>friend.accepted&&friend.gifts[1-friend.users.indexOf(p.uid)]&&!friend.gifts[1-friend.users.indexOf(p.uid)]?.opened).length;

 const tradesReady=(view.goTrades??[]).filter(t=>t.status==='offering'&&t.expiresAt>now&&view.friends.some(f=>f.id===t.pair&&f.accepted)&&!t.accepted[t.users.indexOf(p.uid)]).length;

 const buddyRequired=buddy?buddyDistance(buddy.species):1000,buddyProgress=Math.max(0,(f.walk?.meters??0)-g.buddyMeters)%buddyRequired,buddyCircumference=2*Math.PI*18.5;

 const circle={width:48,height:48,borderRadius:19,backgroundColor:'#193F35EF',alignItems:'center' as const,justifyContent:'center' as const,borderWidth:1,borderColor:'#7C9564'};

 return <>

  {(mapVisible||auto.enabled)&&<View style={{position:'absolute',left:14,top:84,gap:11}}>{mapVisible&&(!lureUsed||activeLure)&&<Pressable accessibilityRole="button" accessibilityLabel="Wandellokker" onPress={()=>setSheet('lure')} style={{...circle,height:activeLure?73:58,width:60}}><FieldActivityArt id="incense" size={49}/>{activeLure&&<Label small bold>{clock}</Label>}</Pressable>}<Pressable accessibilityRole="button" accessibilityLabel="Autovangst" onPress={()=>setSheet('auto')} style={{...circle,width:60,height:70,borderColor:auto.enabled?'#289B82':'#7C9564',backgroundColor:auto.enabled?'#346850EF':'#193F35EF'}}><FieldArt id="basic" size={42}/><Label small bold>{auto.enabled?auto.status==='too-fast'?'Te snel':auto.status==='gps'?'GPS':auto.status==='empty'?'Op':'Auto aan':'Auto uit'}</Label></Pressable>{auto.last&&now-auto.last.at<10000&&<View style={{...circle,width:60,height:63}}><SpriteView id={auto.last.species} size={37}/><Glyph name={auto.last.caught?'check':'close'} size={19}/></View>}</View>}

  <View style={{position:'absolute',right:14,bottom:108}}><IconButton name="research" label="Open veldonderzoek" onPress={()=>setSheet('research')}/><FieldBadgeV2 count={researchReady}/></View>

  <View pointerEvents="box-none" style={{position:'absolute',left:14,right:14,bottom:20,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end'}}><View style={{width:80,height:78}}><Pressable accessibilityRole="button" accessibilityLabel="Open profiel" onPress={()=>open('profile')} style={{...circle,width:63,height:63,borderRadius:32}}><TrainerPortrait avatar={p.avatar} size={57}/><View style={{position:'absolute',left:-3,bottom:-3,minWidth:25,height:22,paddingHorizontal:5,borderRadius:11,backgroundColor:V.pine,borderWidth:1,borderColor:'#FFF0C7',alignItems:'center',justifyContent:'center'}}><Label small bold color="#FFF5D8">{trainerLevel(g.trainer?.xp??0)}</Label></View>{g.trainer&&trainerLevel(g.trainer.xp)>g.trainer.claimedLevel&&<View style={{position:'absolute',right:-2,top:-3}}><Glyph name="gift" size={23}/></View>}</Pressable><Pressable accessibilityRole="button" accessibilityLabel="Open buddy" onLongPress={()=>info.show({title:"Buddyafstand",body:buddy?(buddyProgress/1000).toLocaleString("nl-NL",{maximumFractionDigits:2})+" / "+buddyRequired/1000+" km voor 1 soortnectar.":"Kies een buddy om soortnectar te verdienen.",icon:"heart"})} onPress={()=>open('buddy')} style={{...circle,position:'absolute',right:0,bottom:0,width:40,height:40,borderRadius:20}}>{buddy?<SpriteView id={buddy.species} shiny={buddy.shiny} size={37}/>:<Glyph name="heart" size={27}/>}<View pointerEvents="none" style={{position:"absolute",inset:0}}><Svg width={40} height={40} viewBox="0 0 40 40"><Circle cx={20} cy={20} r={18.5} fill="none" stroke="#D8DDBF" strokeWidth={2}/>{buddy&&<Circle cx={20} cy={20} r={18.5} fill="none" stroke="#289B82" strokeWidth={2} strokeLinecap="round" strokeDasharray={[buddyCircumference,buddyCircumference]} strokeDashoffset={buddyCircumference*(1-buddyProgress/buddyRequired)} rotation={-90} origin="20, 20"/>}</Svg></View></Pressable></View><Pressable accessibilityRole="button" accessibilityLabel="Open veldmenu" onPress={()=>setSheet('menu')} style={{...circle,width:77,height:77,borderRadius:39,borderWidth:3}}><FieldArt id="basic" size={65}/></Pressable><Pressable accessibilityRole="button" accessibilityLabel="In de buurt" onPress={()=>setSheet('nearby')} style={{...circle,width:95,height:58,flexDirection:'row'}}>{nearby.slice(0,2).map(s=><View key={s.id} style={{opacity:g.dex?.includes(s.species)?1:.45}}><SpriteView id={s.species} size={39}/></View>)}{!nearby.length&&<><Glyph name={gpsReady?"leaf":"compass"} size={23}/><Label small>{gpsReady?"Geen bugs":"GPS uit"}</Label></>}</Pressable></View>

  <Modal visible={!!sheet} transparent animationType={reduced?'none':'slide'} onRequestClose={()=>setSheet(null)}><View style={{flex:1,backgroundColor:'#092C29A8',alignItems:'center',justifyContent:'flex-end'}}><View style={{width:'100%',maxWidth:560,maxHeight:'89%',backgroundColor:V.paper,borderTopLeftRadius:30,borderTopRightRadius:30,padding:17,gap:14,...(sheet==='menu'?{maxHeight:'94%',paddingTop:72,boxShadow:'0px -8px 30px #06191466'}:{})}}>{sheet!=='menu'&&<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Title>{({menu:'Veldmenu',bag:'Veldtas',research:'Onderzoek',nearby:'In de buurt',lure:'Wandellokker',auto:'Autovangst',post:'Veldpost',routes:'Routes'} as Record<string,string>)[sheet??'']}</Title><IconButton name="close" label="Sluit veldscherm" onPress={()=>setSheet(null)}/></View>}{sheet==='menu'&&<View style={{position:'absolute',right:17,top:20,zIndex:4}}><Pressable accessibilityRole="button" accessibilityLabel="Instellingen" onPress={()=>navigate('settings')} style={{minHeight:44,flexDirection:'row',alignItems:'center',gap:8}}><Label small bold>INSTELLINGEN</Label><Glyph name="settings" size={32}/></Pressable></View>}<ScrollView contentContainerStyle={{gap:13,paddingBottom:20,...(sheet==='menu'?{flexGrow:1,justifyContent:'flex-end'}:{})}}>

   {sheet==='menu'&&<View testID="field-main-menu" style={{gap:18,paddingTop:4}}>



    <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:10}}>{([{icon:'swords',label:'Strijd',go:()=>navigate('ranked'),count:0},{icon:'book',label:'Bugdex',go:()=>navigate('bugdex'),count:0},{icon:'coin',label:'Shop',go:()=>navigate('coinShop'),count:0},{icon:'team',label:'Bugs',go:()=>navigate('team'),count:0},{icon:'bag',label:'Veldtas',go:()=>setSheet('bag'),count:!f.daily.supply?1:0},{icon:'shield',label:'Gyms',go:()=>navigate('gyms'),count:0}] as const).map(item=><Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={item.go} style={({pressed})=>({width:'31%',maxWidth:150,minHeight:108,paddingVertical:12,alignItems:'center',justifyContent:'center',gap:6,borderRadius:22,backgroundColor:'#24503F',borderWidth:1,borderColor:'#8DAE9055',borderTopColor:'#D6E6C066',boxShadow:'0px 6px 16px #0619144D',transform:[{scale:pressed?.96:1}]})}><Glyph name={item.icon} size={58}/><Label small bold>{item.label}</Label><FieldBadgeV2 count={item.count}/></Pressable>)}</View>

    <View style={{flexDirection:'row',justifyContent:'center',flexWrap:'wrap',gap:8}}>{([{icon:'clock',label:'Cocons',go:()=>navigate('cocoons'),count:cocoonsReady},{icon:'friends',label:'Vrienden',go:()=>navigate('friends'),count:giftsReady+tradesReady},...((p.walking?.routes?.length||g.sites?.run)?[{icon:'compass' as const,label:'Routes',go:()=>setSheet('routes'),count:0}]:[])] as const).map(item=><Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={item.go} style={{minHeight:44,flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,borderRadius:20,backgroundColor:'#244E40'}}><Glyph name={item.icon} size={23}/><Label small>{item.label}</Label><FieldBadgeV2 count={item.count}/></Pressable>)}</View>

   </View>}



   {sheet==='bag'&&<FieldBagV2 {...{view,run,busy}} open={navigate}/>}

   {sheet==='research'&&<DailyResearchV2 player={p} {...{run,busy}}/>}

   {sheet==='lure'&&<><View style={{alignItems:'center',gap:12}}><FieldActivityArt id="incense" size={180}/><Label bold>{activeLure?clock:lureUsed?'Morgen weer':'15 minuten'}</Label>{activeLure&&<Counter icon="leaf" value={lure?.caught??0} label="Gevangen"/>}</View>{!gpsReady?<Button icon="compass" onPress={()=>{setSheet(null);onGPS();}}>GPS aan</Button>:<Button icon="compass" disabled={busy||activeLure||lureUsed} onPress={()=>void run('fieldLure').then(ok=>{if(ok)setSheet(null);})}>{activeLure?'Actief':lureUsed?'Vandaag gebruikt':'Start wandeling'}</Button>}<Help title="Wandellokker" body="Elke dag gratis 15 minuten. Loop met de GPS-kaart open: na minimaal 25 goedgekeurde meters en 30 seconden verschijnt een extra bug, tot maximaal 20. De timer loopt door na sluiten."/></>}

   {sheet==='auto'&&<><View style={{alignItems:'center',gap:9}}><FieldArt id="basic" size={150}/><Label bold>{auto.enabled?'Aan':'Uit'}</Label><View style={{flexDirection:'row',gap:25}}><Counter icon="leaf" value={f.inventory.basic} label="Standaardnetten"/><Counter icon="compass" value="2,5–25" label="km/u"/></View></View><Button icon={auto.enabled?'close':'check'} disabled={busy} onPress={()=>{if(!gpsReady&&!auto.enabled){setSheet(null);onGPS();}else void run('goAuto',{enabled:!auto.enabled});}}>{auto.enabled?'Uitzetten':!gpsReady?'GPS aan':'Aanzetten'}</Button><Help title="Autovangst" body={(nativeAuto?"Android: zet autovangst aan terwijl BugBaas open is. Met locatie en meldingen toegestaan blijft de locatiedienst werken als je naar een andere app gaat of het scherm uitzet. De blijvende melding laat zien dat afstand en autovangst actief zijn. Stop via Uitzetten in BugBaas. Geforceerd afsluiten en batterijbeperkingen kunnen de dienst stoppen. ":"Browser: houd de GPS-kaart open. Een gesloten tab of vergrendeld scherm wordt niet ondersteund. De game houdt waar mogelijk het scherm wakker. ")+"Beweeg op circa 2,5–25 km/u. Na twee nauwkeurige bewegingsmetingen probeert de autocatcher maximaal iedere 30 seconden één bug: één standaardnet, één poging, zonder lokmiddel of mikbonus. Bij mislukken vlucht de bug. De autovanger heeft 25% minder vangkans en bezoekt ook posten in de buurt voor nieuwe netten. Actief mikken met lokmiddelen geeft meer kansen. Stilstand, slecht GPS en rijden op hogere snelheid geven geen vangsten. GPS alleen kan een langzaam rijdende auto niet betrouwbaar onderscheiden van een fiets."}/></>}

   {sheet==='nearby'&&<><View style={{flexDirection:'row',gap:8}}><Button small secondary={nearbyKind!=='bugs'} onPress={()=>setNearbyKind('bugs')}>Bugs</Button><Button small secondary={nearbyKind!=='posts'} onPress={()=>setNearbyKind('posts')}>Posten</Button>{(p.walking?.routes?.length||g.sites?.run)&&<Button small secondary onPress={()=>setSheet('routes')}>Routes</Button>}</View>{nearbyKind==='posts'?<View style={{gap:8}}>{[...(p.walking?.posts??[])].sort((a,b)=>distance(fix,a)-distance(fix,b)).map(post=><Pressable key={post.id} accessibilityRole="button" accessibilityLabel={'Open post '+post.name} onPress={()=>{setPostId(post.id);setSheet('post');}} style={{padding:10,borderRadius:18,backgroundColor:'#214B40',flexDirection:'row',gap:10,alignItems:'center'}}><PostArtV2 size={65} available={now-(g.sites?.visits[post.id]??0)>=300000}/><View style={{flex:1}}><Label bold>{post.name}</Label><Label small>{Math.round(distance(fix,post))} m</Label></View><Glyph name={now-(g.sites?.visits[post.id]??0)<300000?"clock":"gift"} size={28}/></Pressable>)}{!p.walking?.posts?.length&&<Label>{p.walking?.siteSource==='unavailable'?'Locatiepunten laden tijdelijk niet.':'Geen geschikte insectenposten gevonden.'}</Label>}</View>:<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{!nearby.length&&<View style={{flexDirection:"row",alignItems:"center",gap:8,padding:10}}><Glyph name={gpsReady?"leaf":"compass"} size={25}/><Label small>{gpsReady?"Geen bugs in de buurt. Wandel rustig verder.":"Zet GPS aan om bugs in de buurt te zien."}</Label></View>}{nearby.map(s=><Pressable key={s.id} accessibilityRole="button" accessibilityLabel={'Volg '+species(s.species).name} onPress={()=>{if(distance(fix,s)<=CATCH_RADIUS){setSheet(null);onSelect(s);}else{setSheet(null);onTarget?.({...s,name:species(s.species).name,spawnId:s.id});}}} style={{width:'30%',flexGrow:1,padding:8,borderRadius:20,backgroundColor:'#214B40',alignItems:'center',gap:5}}><SpriteView id={s.species} silhouette={!g.dex?.includes(s.species)} size={75}/><Label small>{Math.round(distance(fix,s))} m</Label></Pressable>)}</View>}</>}

   {(sheet==='post'||sheet==='routes')&&<WorldSitesSheetV2 kind={sheet} postId={postId} {...{view,run,busy,gpsReady,fix,now}} onTarget={target=>{setSheet(null);onTarget?.(target);}}/>}

  </ScrollView>{sheet==='menu'&&<View style={{alignItems:'center',paddingBottom:20}}><IconButton name="close" label="Sluit veldscherm" onPress={()=>setSheet(null)}/></View>}</View></View></Modal>

 </>;

}
