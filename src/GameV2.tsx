import {AwaySummaryV2} from './AwaySummaryV2';

import {RewardFeedbackV2} from './RewardFeedbackV2';

import type {RewardBatch} from './RewardFeedbackV2';

import {rewardChanges} from './resourceGainV2';

import {GoGymsV2} from './GoGymsV2';

import {CoinShopV2} from './CoinShopV2';

import {useAdventureSyncV2} from './AdventureSyncControlV2';
import {prepareBackgroundAutoCatchV2,finishBackgroundAutoCatchV2,stopBackgroundAutoCatchV2,useBackgroundAutoCatchV2} from './BackgroundAutoCatchV2';

import {AvatarChoices,TrainerPortrait} from './AvatarV2';

import type {TrainerAvatar} from '../game/avatarV2';

import {GoAccountV2} from './GoAccountV2';

import SettingsV2 from './SettingsV2';

import {GoCocoonsV2} from './GoCocoonsV2';

import {GoTradeV2} from './GoTradeV2';

import {GoJournalV2} from './GoJournalV2';

import {TrainerCardV2} from './TrainerV2';

import {GoBackProvider} from './GoBackV2';

import type {MapCameraV2} from './mapCameraV2';

import {ExploreV2} from './ExploreV2';

import React,{useEffect,useRef,useState} from 'react';

import {AccessibilityInfo,ActivityIndicator,AppState,Modal,Pressable,ScrollView,StyleSheet,Switch,Text,TextInput,View} from 'react-native';

import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';

import {StatusBar} from 'expo-status-bar';

import AsyncStorage from '@react-native-async-storage/async-storage';

import type {CommandV2,GameViewV2} from '../game/typesV2';

import {accountUid,commandV2,connectV2,refreshV2,ApiError} from './client';

import {Scene,SpriteView,Ground} from './artV2';

import {BrandMark} from './gameUiArt';

import {isNewerV2} from './stateV2';

import {GoCollectionV2,GoDexV2,GoBuddyV2} from './GoCollectionV2';

import {GoFriendsV2} from './GoFriendsV2';



import {GoBattleV2} from './GoBattleV2';





import {Button,Counter,Glyph,IconButton,InfoProvider,Label,Panel,Title,V,v,TextScale,MotionPrefs,Wash,font} from './uiV2';

import {playSound,setAudioSettings,startMusic,stopAudio,unlockAudio} from './audioV2';

export default function GameV2(){return <SafeAreaProvider><Game/></SafeAreaProvider>;}

function Game(){const [rewards,setRewards]=useState<RewardBatch|null>(null);const [view,setView]=useState<GameViewV2|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[tab,setTab]=useState<'Safari'|'Team'|'Ranked'>('Safari'),[overlay,rawSetOverlay]=useState(''),[now,setNow]=useState(Date.now()),[name,setName]=useState(''),[avatar,setAvatar]=useState<TrainerAvatar>('fern'),[pending,setPending]=useState<CommandV2|null>(null),[sysReduce,setSysReduce]=useState(false);

 const visibleScreen=useRef(tab),lastClock=useRef(0);visibleScreen.current=tab;

 const overlayRef=useRef(''),overlayStack=useRef<string[]>([]),errorSource=useRef<'poll'|'command'|null>(null);

 function reportError(message:string,source:'poll'|'command'){if(source==='poll'&&errorSource.current==='command')return;errorSource.current=source;setError(message);}

 function clearError(){errorSource.current=null;setError('');}

 function setOverlay(name:string){let next=name;if(name){if(overlayRef.current&&overlayRef.current!==name)overlayStack.current.push(overlayRef.current);}else next=overlayStack.current.pop()??'';overlayRef.current=next;rawSetOverlay(next);}

 function clearOverlays(){overlayStack.current=[];overlayRef.current='';rawSetOverlay('');}

 const [profileTab,setProfileTab]=useState<'me'|'friends'>('me'),[collectionDetail,setCollectionDetail]=useState(false);
 const [changingAccount,setChangingAccount]=useState(false);

 const mapCamera=useRef<MapCameraV2|null>(null),[collectionTarget,setCollectionTarget]=useState<string>(),[tradePair,setTradePair]=useState<string>();

 const latest=useRef<GameViewV2|null>(null),locked=useRef(false),background=useRef(false),base=useRef({server:Date.now(),received:performance.now()}),active=useRef(true);

 function accept(next:GameViewV2){const prior=latest.current;if(!isNewerV2(prior,next))return;if(errorSource.current==='poll')clearError();const rows=rewardChanges(prior?.player??null,next.player);if(prior?.player.uid!==next.player.uid)setRewards(null);else if(rows.length)setRewards({id:Date.now(),rows,dismissed:[]});latest.current=next;setView(next);base.current={server:next.now,received:performance.now()};setNow(next.now);setAudioSettings(next.player.settings);if(next.goBattle||next.player.go?.queue)setTab('Ranked');}

 async function boot(){setBusy(true);clearError();try{const connected=await connectV2();accept(connected);const raw=await AsyncStorage.getItem('bugbaas-v2-pending');if(raw){const saved=JSON.parse(raw);if(saved.uid===connected.player.uid&&saved.command&&saved.command.type!=='worldLocate'){setPending(saved.command);reportError('Een eerdere actie wacht op controle. Probeer die veilig opnieuw.','command');}else await AsyncStorage.removeItem('bugbaas-v2-pending');}}catch(e){reportError(e instanceof Error?e.message:'Verbinden is niet gelukt.','poll');}finally{setBusy(false);}}

 useEffect(()=>{void boot();void AccessibilityInfo.isReduceMotionEnabled().then(setSysReduce);const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',setSysReduce),state=AppState.addEventListener('change',s=>{active.current=s==='active';if(s!=='active')stopAudio();else if(latest.current&&!locked.current){const uid=latest.current.player.uid;void finishBackgroundAutoCatchV2(uid).then(caught=>{if(latest.current?.player.uid!==uid)return null;if(caught)accept(caught);return refreshV2();}).then(next=>{if(next&&latest.current?.player.uid===uid)accept(next);}).catch(()=>{});}});const clock=setInterval(()=>{if(!active.current||visibleScreen.current==='Team'&&!overlayRef.current)return;const next=base.current.server+performance.now()-base.current.received,step=latest.current?.goBattle&&latest.current.goBattle.phase!=='finished'?500:1000;if(next-lastClock.current>=step){lastClock.current=next;setNow(next);}},500);return()=>{clearInterval(clock);motion.remove();state.remove();stopAudio();};},[]);

 useEffect(()=>{let cancelled=false,polling=false;const tick=async()=>{if(!active.current||locked.current||polling)return;polling=true;try{const next=await refreshV2();if(!cancelled&&latest.current?.player.uid===next.player.uid)accept(next);}catch(e){if(!cancelled)reportError(e instanceof Error?e.message:'Verbinding onderbroken.','poll');}finally{polling=false;}};if(!view)return;const timer=setInterval(()=>void tick(),view.goBattle&&view.goBattle.phase!=='finished'?500:view.player.go?.queue||overlay==='trade'?1000:15000);return()=>{cancelled=true;clearInterval(timer);};},[view?.player.uid,view?.goBattle?.id,view?.goBattle?.phase,!!view?.player.go?.queue,overlay==='trade']);

 async function perform(command:CommandV2){

  if(locked.current)return false;const locating=command.type==='worldLocate';locked.current=true;background.current=locating;

  if(!locating){setBusy(true);reportError('','command');unlockAudio();setPending(command);}

  try{if(!locating)await AsyncStorage.setItem('bugbaas-v2-pending',JSON.stringify({uid:latest.current!.player.uid,command}));accept(await commandV2(command));if(!locating){setPending(null);await AsyncStorage.removeItem('bugbaas-v2-pending');clearError();playSound(command.type==='goAct'?(command.action==='shield'?'shield':'attack'):command.type==='goPower'?'grow':'click');}return true;}

  catch(e){if(!locating){reportError(e instanceof Error?e.message:'Actie niet verwerkt.','command');if(e instanceof ApiError&&e.status!==0&&e.status<500){setPending(null);await AsyncStorage.removeItem('bugbaas-v2-pending');}}void refreshV2().then(next=>{if(latest.current?.player.uid===next.player.uid)accept(next);}).catch(()=>{});return false;}

  finally{locked.current=false;background.current=false;if(!locating)setBusy(false);}

 }

 async function run(type:string,params:Record<string,unknown>={}){if(latest.current){try{const caught=await finishBackgroundAutoCatchV2(latest.current.player.uid);if(caught)accept(caught);}catch{if(type==='goAuto'&&params.enabled===false)await stopBackgroundAutoCatchV2().catch(()=>{});reportError('De vorige autovangst wacht op verbinding. Probeer opnieuw.','command');return false;}}if(locked.current&&background.current&&type!=='worldLocate'){for(let i=0;i<160&&locked.current&&background.current;i++)await new Promise(r=>setTimeout(r,50));}if(!latest.current||locked.current)return false;if(pending){reportError('Controleer eerst de vorige actie met Opnieuw proberen.','command');return false;}if(type==='goAuto'&&params.enabled===true){const problem=await prepareBackgroundAutoCatchV2();if(problem){reportError(problem,'command');return false;}}if(type==='goAuto'&&params.enabled===false){try{await stopBackgroundAutoCatchV2();}catch{reportError('Autovangst kon niet stoppen. Probeer opnieuw.','command');return false;}}const current=latest.current;if(!current||locked.current)return false;const id=globalThis.crypto?.randomUUID?.()??`cmd-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;return perform({type,...params,commandId:id,expectedRevision:current.player.revision});}

 useAdventureSyncV2(view?.player.uid,run,()=>!locked.current&&!pending&&!changingAccount&&(!latest.current?.goBattle||latest.current.goBattle.phase==='finished')&&!latest.current?.player.go?.queue);
 useBackgroundAutoCatchV2(view,message=>reportError(message,'command'),changingAccount,tab==='Safari'&&!overlay);

 useEffect(()=>{startMusic(tab==='Ranked'?'battle':'field');},[tab]);

 async function changeAccount(work:()=>Promise<GameViewV2>,close=true){

  if(background.current){for(let i=0;i<160&&locked.current&&background.current;i++)await new Promise(r=>setTimeout(r,50));}if(locked.current||pending)throw new Error('Rond eerst je vorige spelactie af.');locked.current=true;setBusy(true);clearError();

  try{setChangingAccount(true);await stopBackgroundAutoCatchV2();const next=await work();if(latest.current?.player.uid!==next.player.uid){mapCamera.current=null;setCollectionTarget(undefined);setTradePair(undefined);}accept(next);if(close){clearOverlays();setTab('Safari');}}

  catch(e){await stopBackgroundAutoCatchV2().catch(()=>{});if(accountUid()!==latest.current?.player.uid){latest.current=null;setView(null);clearOverlays();reportError('Verbinding onderbroken. Tik op Probeer opnieuw.','poll');}throw e;}finally{locked.current=false;setBusy(false);setChangingAccount(false);}

 }



 async function backToMap(){if(latest.current?.goBattle&&!await run('goClose'))return;clearOverlays();setTab('Safari');}

 function open(name:string,specimenId?:string){if(name==='friends'){setProfileTab('friends');setOverlay('profile');return;}if(name==='profile')setProfileTab('me');if(name==='trade'){setTradePair(specimenId);setTab('Safari');setOverlay('trade');return;}if(name==='map'){void backToMap();return;}if(name==='ranked'){clearOverlays();setTab('Ranked');return;}if(name==='team'||name==='teamScore'){setCollectionTarget(latest.current?.player.specimens.find(s=>s.id===specimenId&&s.go)?.id);clearOverlays();setTab('Team');}else setOverlay(name);}

 const dismissReward=(id:string)=>setRewards(old=>old?{...old,dismissed:[...new Set([...old.dismissed,id])]}:old);

 const p=view?.player,m=view?.match,inGame=!!view?.goBattle&&view.goBattle.phase!=='finished'||!!p?.go?.queue,modalTitle=({gyms:'Gyms',coinShop:'Shop',bugdex:'Bugdex',buddy:'Buddy',friends:'Vrienden',team:'Mijn team',profile:'Profiel',settings:'Instellingen',account:'Je account',cocoons:'Cocons',journal:'Dagboek',trade:'Ruilen'} as Record<string,string>)[overlay]??'';

 const effective=view?{...view,player:{...view.player,settings:{...view.player.settings,reducedMotion:view.player.settings.reducedMotion||sysReduce}}}:null;

 return <GoBackProvider onBack={()=>{if(overlay){setOverlay('');return true;}if(tab!=='Safari'){void backToMap();return true;}return false;}}><MotionPrefs.Provider value={!!p?.settings.reducedMotion||sysReduce}><TextScale.Provider value={p?.settings.largeText?1.2:1}><InfoProvider><View style={{flex:1,backgroundColor:'#142F32',alignItems:'center'}}><SafeAreaView style={{flex:1,width:'100%',maxWidth:560,backgroundColor:'#113F36',overflow:'hidden'}}><View style={{flex:1,backgroundColor:V.paper}}><StatusBar style="light"/>{!view?<View style={{flex:1,justifyContent:'center',padding:25,gap:20}}><Scene index={0}/><Panel><BrandMark width={240}/>{busy&&<ActivityIndicator color={V.pine}/>}<Label>{error||'Laden…'}</Label>{!busy&&<Button onPress={()=>void boot()}>Probeer opnieuw</Button>}</Panel></View>:<>{!inGame&&tab==='Ranked'&&<View style={{position:'absolute',left:0,right:0,top:0,zIndex:20,backgroundColor:'#113F36',borderBottomWidth:1,borderBottomColor:'#D7E6C52A',flexDirection:'row',paddingHorizontal:12,paddingVertical:10,gap:6,alignItems:'center'}}><View style={{flex:1,minWidth:0,flexShrink:1}}><BrandMark width={110}/></View><View style={{backgroundColor:'#214B40',paddingHorizontal:8,height:38,borderRadius:19,justifyContent:'center'}}><Counter icon="nectar" value={p!.go?.dust??0} label="Nectarstof" hint="Algemene grondstof voor power-ups en een tweede opgeladen aanval. Elke bug gebruikt daarnaast eigen soortnectar."/></View><IconButton name="book" label="Open Bugdex" onPress={()=>setOverlay('bugdex')}/><IconButton name="profile" label="Open profiel" onPress={()=>setOverlay('profile')}/></View>}{error&&<View accessibilityRole="alert" style={[v.error,{position:'absolute',left:12,right:12,top:inGame?8:66,zIndex:30,boxShadow:'0px 8px 24px #061F1ACC'}]}><Label small color="#FFB9A5">{error}</Label>{pending&&<Button small secondary disabled={busy} onPress={()=>void perform(pending)}>Opnieuw proberen</Button>}<Pressable accessibilityRole="button" accessibilityLabel="Sluit melding" onPress={()=>{if(pending)setError('');else clearError();}}><Label small>Sluiten</Label></Pressable></View>}{!p!.onboarded?<ScrollView contentContainerStyle={{flexGrow:1,padding:20,paddingTop:36,paddingBottom:36,justifyContent:'center',gap:12}}><Scene index={4}/><Wash from='#12382FB0' to='#12382FF5'/><View style={{alignItems:'center',gap:4}}><BrandMark width={220}/><TrainerPortrait avatar={avatar} size={190}/></View><Panel><AvatarChoices value={avatar} onChange={setAvatar} disabled={busy}/><TextInput accessibilityLabel="Spelnaam" placeholder="Jouw spelnaam" placeholderTextColor="#B7CAB6" selectionColor="#A5CE87" maxLength={18} value={name} onChangeText={setName} style={v.input}/><Button disabled={busy||name.trim().length<2} onPress={()=>void run('profile',{name:name.trim(),avatar})}>Begin avontuur</Button>{view.mode==='cloud'&&<Button small secondary disabled={busy} onPress={()=>setOverlay('account')}>Ik heb al een account</Button>}</Panel></ScrollView>:<View style={{flex:1,paddingBottom:!inGame&&tab!=='Safari'&&!(tab==='Team'&&collectionDetail)?74:0}}><View testID="retained-field-map" pointerEvents={tab==='Safari'&&!overlay?'auto':'none'} accessibilityElementsHidden={tab!=='Safari'||!!overlay} importantForAccessibility={tab==='Safari'&&!overlay?'auto':'no-hide-descendants'} style={[StyleSheet.absoluteFillObject,{opacity:tab==='Safari'?1:0}]}><ExploreV2 key={p!.uid} paused={tab!=='Safari'||!!overlay} camera={mapCamera} view={effective!} run={run} busy={busy} now={now} open={open}/></View>{tab==='Team'?<GoCollectionV2 view={effective!} run={run} busy={busy} initialSpecimenId={collectionTarget} open={open} onSelectionChange={setCollectionDetail}/>:tab==='Ranked'?<GoBattleV2 view={effective!} run={run} busy={busy} now={now} open={open}/>:null}</View>}{!inGame&&p!.onboarded&&tab!=='Safari'&&!(tab==='Team'&&collectionDetail)&&<View pointerEvents="box-none" style={{position:'absolute',left:0,right:0,bottom:0,height:74,alignItems:'center',justifyContent:'center',backgroundColor:V.paper,borderTopWidth:1,borderTopColor:'#829B7544',zIndex:22}}><IconButton name="close" label="Terug naar kaart" onPress={()=>void backToMap()}/></View>}</>}

 <RewardFeedbackV2 batch={rewards} visible={!overlay} onDismiss={dismissReward}/>

 <AwaySummaryV2 view={view} visible={!!p?.onboarded&&!overlay&&!inGame&&!busy} open={open}/>

 <Modal visible={!!overlay} animationType={p?.settings.reducedMotion?'none':'slide'} onRequestClose={()=>setOverlay('')}><SafeAreaView style={{flex:1,backgroundColor:V.paper,alignItems:'center'}}><View style={{flex:1,width:'100%',maxWidth:560,overflow:'hidden'}}><Scene index={0}/><Wash from='#163F35EE' to='#12382FFA'/><View style={[v.row,{paddingHorizontal:21,paddingVertical:17,justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#FFFFFF90'}]}><Title>{modalTitle}</Title></View>{p&&overlay==='profile'&&<View style={{flexDirection:'row',gap:8,paddingHorizontal:16,paddingVertical:10}}><View style={{flex:1}}><Button small secondary={profileTab!=='me'} onPress={()=>setProfileTab('me')}>Ik</Button></View><View style={{flex:1}}><Button small secondary={profileTab!=='friends'} onPress={()=>setProfileTab('friends')}>Vrienden</Button></View></View>}{error&&<View style={[v.error,{margin:10}]}><Label color="#FFB9A5" small>{error}</Label>{pending&&<Button small onPress={()=>void perform(pending)}>Opnieuw proberen</Button>}</View>}{view&&overlay==='cocoons'?<GoCocoonsV2 embedded view={view} {...{run,busy,now,open}}/>:<ScrollView key={overlay==='profile'?profileTab:overlay} contentContainerStyle={{padding:16,gap:16,paddingBottom:96}}>{view&&overlay==='gyms'&&<GoGymsV2 {...{view,run,busy,now,open}} onBattle={()=>open('ranked')}/>} {view&&overlay==='coinShop'&&<CoinShopV2 {...{view,run,busy,open}}/>} {view&&overlay==='journal'&&<GoJournalV2 view={view} open={open}/>} {view&&overlay==='trade'&&<GoTradeV2 view={view} run={run} busy={busy} now={now} open={open} pair={tradePair}/>} {view&&overlay==='team'&&<GoCollectionV2 view={view} run={run} busy={busy}/>} {view&&overlay==='bugdex'&&<GoDexV2 view={view}/>} {view&&overlay==='buddy'&&<GoBuddyV2 view={view} run={run} busy={busy}/>} {view&&overlay==='friends'&&<GoFriendsV2 view={view} run={run} busy={busy} open={open}/>} {p&&overlay==='profile'&&<>{profileTab==='friends'?<GoFriendsV2 view={view!} {...{run,busy,open}}/>:<><TrainerCardV2 player={p} {...{run,busy}}/><Panel><Label small>{view?.mode==='local'?'Lokale speler':view?.linked?'Account gekoppeld':'Gastspeler'} · {p.friendCode}</Label><View style={[v.row,{justifyContent:'space-around'}]}><Counter icon="book" value={p.go?.dex?.length??0} label="Bugdex" hint="Soorten die je op de kaart hebt gevangen."/><Counter icon="swords" value={p.go?.rating??1000} label="PvP-rating"/><Counter icon="cup" value={p.go?.wins??0} label="Overwinningen"/></View>{p.field&&<View style={[v.row,{justifyContent:'space-around'}]}><Counter icon="leaf" value={p.field.total.catches} label="Bugs gevangen" hint="Je echte kaartvangsten. Demo telt niet mee."/><Counter icon="star" value={p.field.total.perfect} label="Perfecte vangsten" hint="Maak een korte, goed gerichte netzwaai voor een perfecte worp."/><Counter icon="compass" value={((p.field.walk?.meters??0)/1000).toLocaleString('nl-NL',{maximumFractionDigits:2})+' km'} label="Gelopen afstand" hint="GPS en gekoppelde Health Connect-wandelingen."/></View>}<View style={[v.row,{justifyContent:'space-around'}]}>{([{icon:'profile',label:'Account',target:'account'},{icon:'friends',label:'Vrienden',target:'friends'},{icon:'heart',label:'Buddy',target:'buddy'},{icon:'research',label:'Dagboek',target:'journal'}] as const).map(x=><View key={x.target} style={{flex:1,alignItems:'center',gap:4}}><IconButton name={x.icon} label={x.target==='buddy'?'Open buddy':x.label} onPress={()=>x.target==='friends'?setProfileTab('friends'):setOverlay(x.target)}/><Label small>{x.label}</Label></View>)}</View></Panel></>}</>}{p&&overlay==='settings'&&<SettingsV2 player={p} {...{run,busy,open}}/>}{view&&overlay==='account'&&<GoAccountV2 view={view} busy={busy} change={changeAccount}/>}</ScrollView>}<View pointerEvents="box-none" style={{height:74,flexShrink:0,alignItems:'center',justifyContent:'center',backgroundColor:V.paper,borderTopWidth:1,borderTopColor:'#829B7544',zIndex:24}}><IconButton name="close" label="Sluit venster" onPress={()=>setOverlay('')}/></View><RewardFeedbackV2 batch={rewards} visible={!!overlay} onDismiss={dismissReward}/></View></SafeAreaView></Modal></View></SafeAreaView></View></InfoProvider></TextScale.Provider></MotionPrefs.Provider></GoBackProvider>;

}
