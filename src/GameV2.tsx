import {UpdateGateV2} from './UpdateGateV2';
import {ArcadeScreenV3} from './arcade/ArcadeScreenV3';
import {MainTabsV3,type MainTabV3} from './arcade/MainTabsV3';
import {ArcadeIcon} from './arcade/ArcadeArtV3';
import {FieldBagV2} from './FieldBagV2';
import {GoTeamPickerV2} from './GoTeamPickerV2';
import {AwaySummaryV2} from './AwaySummaryV2';
import {AdventureSyncPromptV2} from './AdventureSyncPromptV2';

import {RewardFeedbackV2} from './RewardFeedbackV2';

import type {RewardBatch} from './RewardFeedbackV2';

import {rewardChanges} from './resourceGainV2';

import {GoGymsV2} from './GoGymsV2';

import {CoinShopV2} from './CoinShopV2';

import {useAdventureSyncV2} from './AdventureSyncControlV2';
import {prepareBackgroundAutoCatchV2,finishBackgroundAutoCatchV2,stopBackgroundAutoCatchV2,useBackgroundAutoCatchV2} from './BackgroundAutoCatchV2';



import {GoAccountV2} from './GoAccountV2';

import SettingsV2 from './SettingsV2';

import {GoCocoonsV2} from './GoCocoonsV2';

import {GoTradeV2} from './GoTradeV2';

import {GoJournalV2} from './GoJournalV2';

import {DailyResearchV2,TrainerCardV2,TrainerGoalsV2} from './TrainerV2';
import {TabsV2} from './TabsV2';
import {trainerReward} from '../game/trainerV2';

import {GoBackProvider,GoBackScope,useGoBack} from './GoBackV2';

import type {MapCameraV2} from './mapCameraV2';

import {ExploreV2} from './ExploreV2';

import React,{useEffect,useRef,useState} from 'react';

import {AccessibilityInfo,AppState,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';

import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';

import {StatusBar} from 'expo-status-bar';

import AsyncStorage from '@react-native-async-storage/async-storage';

import type {CommandV2,GameViewV2} from '../game/typesV2';

import {accountUid,commandV2,connectV2,refreshV2,ApiError} from './client';
import {commandFeedbackV2,pollFeedbackV2,quietCommandFailureV2,temporaryFailureV2,type FeedbackToneV2} from './errorFeedbackV2';

import {Scene} from './artV2';

import {OnboardingV2} from './OnboardingV2';
import {LoadingScreenV2} from './LoadingScreenV2';


import {isNewerV2} from './stateV2';

import {GoCollectionV2,GoDexV2,GoBuddyV2} from './GoCollectionV2';

import {GoFriendsV2} from './GoFriendsV2';



import {GoBattleV2} from './GoBattleV2';





import {Button,IconButton,InfoProvider,Label,v,TextScale,MotionPrefs,Wash,font,useInfo} from './uiV2';

import {playSound,setAudioSettings,startMusic,stopAudio,unlockAudio} from './audioV2';

export default function GameV2(){return <SafeAreaProvider><Game/></SafeAreaProvider>;}

type GameTab='Safari'|'Arcade'|'Team'|'Ranked';
const shellTabs:Record<GameTab,MainTabV3>={Safari:'map',Arcade:'arcade',Team:'bugs',Ranked:'battle'};
const gameTabs:Record<MainTabV3,GameTab>={map:'Safari',arcade:'Arcade',bugs:'Team',battle:'Ranked'};

/** Update once on leaving, so timers/back handlers stop, then retain the inactive tree. */
function RetainedContent({active,children}:{active:boolean;children:React.ReactNode}){
 const cached=useRef(children),wasActive=useRef(active);
 if(active||wasActive.current)cached.current=children;
 wasActive.current=active;
 return cached.current;
}

function PageHeader({title,onBack}:{title:string;onBack:()=>void}){return <View style={{height:56,flexShrink:0,paddingHorizontal:8,flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#10352ff0',borderBottomWidth:1,borderBottomColor:'#bdd0c730'}}><Pressable accessibilityRole="button" accessibilityLabel="Terug" onPress={onBack} style={{width:48,height:48,alignItems:'center',justifyContent:'center'}}><ArcadeIcon atlas="controls" name="back" size={30}/></Pressable><Text accessibilityRole="header" style={{fontFamily:font,color:'#f4f1e6',fontSize:22,fontWeight:'800',flex:1}}>{title}</Text></View>;}

function BattleBack({view,run,active}:{view:GameViewV2;run:(type:string,params?:Record<string,unknown>)=>Promise<boolean>;active:boolean}){const info=useInfo();useGoBack(active,()=>{if(view.player.go?.queue){void run('goCancel');return true;}const b=view.goBattle;if(!b||b.phase==='finished')return false;info.show({title:'Gevecht opgeven?',body:'Je tegenstander wint dit duel.',icon:'swords',action:{label:'Geef op',onPress:()=>{void run('goAct',{action:'forfeit',value:null}).then(ok=>{if(ok)info.hide();});}}});return true;},20);return null;}

function Game(){const [rewards,setRewards]=useState<RewardBatch|null>(null);const [view,setView]=useState<GameViewV2|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[tab,setTab]=useState<GameTab>('Safari'),[overlay,rawSetOverlay]=useState(''),[now,setNow]=useState(Date.now()),[pending,setPending]=useState<CommandV2|null>(null),[sysReduce,setSysReduce]=useState(false),[mapFocus,setMapFocus]=useState<'catch'|null>(null),[arcadeFocus,setArcadeFocus]=useState(false);

 const visibleScreen=useRef(tab),lastClock=useRef(0);visibleScreen.current=tab;

 const overlayRef=useRef(''),overlayStack=useRef<string[]>([]),arcadeBack=useRef<(()=>void)|null>(null),errorSource=useRef<'poll'|'command'|null>(null),pollFailures=useRef({count:0,since:0});
 const [errorTone,setErrorTone]=useState<FeedbackToneV2>('error');

 function reportError(message:string,source:'poll'|'command',tone:FeedbackToneV2='error'){if(source==='poll'&&errorSource.current==='command')return;errorSource.current=source;setErrorTone(tone);setError(message);}

 function clearError(){errorSource.current=null;setError('');}
 useEffect(()=>{if(!error||errorTone!=='notice'||pending||errorSource.current==='poll')return;const timer=setTimeout(clearError,5000);return()=>clearTimeout(timer);},[error,errorTone,pending]);
 /** An action whose answer got lost is sent again by itself (same command id, so it never counts twice). */
 const retries=useRef(0),conflict=useRef(false);useEffect(()=>{if(!pending){retries.current=0;return;}if(busy||retries.current>=6)return;const timer=setTimeout(()=>{if(locked.current)return;retries.current++;void perform(pending);},2500*(retries.current+1));return()=>clearTimeout(timer);},[pending,busy]);

 function setOverlay(name:string){let next=name;if(name){if(overlayRef.current&&overlayRef.current!==name)overlayStack.current.push(overlayRef.current);}else next=overlayStack.current.pop()??'';overlayRef.current=next;rawSetOverlay(next);}

 function clearOverlays(){overlayStack.current=[];overlayRef.current='';rawSetOverlay('');}

 const [profileTab,setProfileTab]=useState<'me'|'goals'|'friends'|'cards'>('me');
 const [changingAccount,setChangingAccount]=useState(false);

 const mapCamera=useRef<MapCameraV2|null>(null),[collectionTarget,setCollectionTarget]=useState<string>(),[tradePair,setTradePair]=useState<string>();

 const latest=useRef<GameViewV2|null>(null),locked=useRef(false),background=useRef(false),base=useRef({server:Date.now(),received:performance.now()}),active=useRef(true);

 // A catch reveals its result after the net wiggles; a toast would spoil it and the result card lists the rewards.
 function accept(next:GameViewV2,catchCard=false){const prior=latest.current;pollFailures.current={count:0,since:0};if(errorSource.current==='poll')clearError();if(!isNewerV2(prior,next))return;let rows:ReturnType<typeof rewardChanges>=[];if(!catchCard)try{rows=rewardChanges(prior?.player??null,next.player);}catch{/* A display-only toast must never block an already confirmed server state. */}if(prior?.player.uid!==next.player.uid)setRewards(null);else if(rows.length)setRewards({id:Date.now(),rows,dismissed:[]});latest.current=next;setView(next);base.current={server:next.now,received:performance.now()};setNow(next.now);setAudioSettings(next.player.settings);if(next.player.go?.queue||next.goBattle&&(next.goBattle.phase!=='finished'||next.goBattle.id!==prior?.goBattle?.id)){clearOverlays();setTab('Ranked');}}

 async function boot(){setBusy(true);clearError();try{const connected=await connectV2();accept(connected);const raw=await AsyncStorage.getItem('bugbaas-v2-pending');if(raw){const saved=JSON.parse(raw);if(saved.uid===connected.player.uid&&saved.command&&saved.command.type!=='worldLocate'){setPending(saved.command);reportError('Je vorige actie is bewaard. Controleer die met Opnieuw proberen.','command','notice');}else await AsyncStorage.removeItem('bugbaas-v2-pending');}}catch(e){reportError(e instanceof Error?e.message:'Verbinden is niet gelukt.','poll');}finally{setBusy(false);}}

 useEffect(()=>{void boot();void AccessibilityInfo.isReduceMotionEnabled().then(setSysReduce);const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',setSysReduce),state=AppState.addEventListener('change',s=>{active.current=s==='active';if(s!=='active')stopAudio();else if(latest.current&&!locked.current){const uid=latest.current.player.uid;void finishBackgroundAutoCatchV2(uid).then(caught=>{if(latest.current?.player.uid!==uid)return null;if(caught)accept(caught);return refreshV2();}).then(next=>{if(next&&latest.current?.player.uid===uid)accept(next);}).catch(()=>{});}});const clock=setInterval(()=>{if(!active.current||visibleScreen.current==='Team'&&!overlayRef.current)return;const next=base.current.server+performance.now()-base.current.received,step=latest.current?.goBattle&&latest.current.goBattle.phase!=='finished'?500:1000;if(next-lastClock.current>=step){lastClock.current=next;setNow(next);}},500);return()=>{clearInterval(clock);motion.remove();state.remove();stopAudio();};},[]);

 useEffect(()=>{let cancelled=false,polling=false;const tick=async()=>{if(!active.current||locked.current||polling)return;polling=true;try{const next=await refreshV2();if(!cancelled&&latest.current?.player.uid===next.player.uid)accept(next);}catch(e){if(!cancelled){const f=pollFailures.current;f.since||=Date.now();const feedback=pollFeedbackV2(e,++f.count,Date.now()-f.since);if(feedback)reportError(feedback.message,'poll',feedback.tone);}}finally{polling=false;}};if(!view)return;const timer=setInterval(()=>void tick(),view.goBattle&&view.goBattle.phase!=='finished'?view.goBattle.flow===3&&view.goBattle.phase==='charge'?200:500:view.player.go?.queue||overlay==='trade'?1000:15000);return()=>{cancelled=true;clearInterval(timer);};},[view?.player.uid,view?.goBattle?.id,view?.goBattle?.flow,view?.goBattle?.phase,!!view?.player.go?.queue,overlay==='trade']);

 async function perform(command:CommandV2,onError?:(message:string)=>void){

  if(locked.current)return false;const locating=command.type==='worldLocate';locked.current=true;background.current=locating;

  if(!locating){setBusy(true);reportError('','command');unlockAudio();setPending(command);}

  try{if(!locating)await AsyncStorage.setItem('bugbaas-v2-pending',JSON.stringify({uid:latest.current!.player.uid,command}));accept(await commandV2(command),command.type==='worldCast');if(!locating){setPending(null);await AsyncStorage.removeItem('bugbaas-v2-pending');clearError();if(command.type!=='arcadeSubmit')playSound(command.type==='goAct'?(command.action==='shield'?'shield':'attack'):command.type==='goPower'?'grow':'click');}return true;}

  catch(e){if(!locating){const message=e instanceof Error?e.message:'Actie niet verwerkt.';const quiet=quietCommandFailureV2(e);conflict.current=quiet;if(quiet)clearError();else if(!onError||!(e instanceof ApiError)||e.status===0||e.status>=500)reportError(temporaryFailureV2(e)?'Verbinding herstellen…':message,'command',commandFeedbackV2(e));if(!quiet)onError?.(message);if(e instanceof ApiError&&e.status!==0&&e.status<500){setPending(null);await AsyncStorage.removeItem('bugbaas-v2-pending');}}void refreshV2().then(next=>{if(latest.current?.player.uid===next.player.uid)accept(next);}).catch(()=>{});return false;}

  finally{locked.current=false;background.current=false;if(!locating)setBusy(false);}

 }

 async function run(type:string,params:Record<string,unknown>={},onError?:(message:string)=>void){const fail=(message:string)=>{if(type!=='worldLocate'&&!onError)reportError(message,'command','notice');onError?.(message);return false;};if(latest.current){try{const caught=await finishBackgroundAutoCatchV2(latest.current.player.uid);if(caught)accept(caught);}catch{if(type==='goAuto'&&params.enabled===false)await stopBackgroundAutoCatchV2().catch(()=>{});return fail('De vorige autovangst wacht op verbinding. Probeer opnieuw.');}}if(locked.current&&background.current&&type!=='worldLocate'){for(let i=0;i<160&&locked.current&&background.current;i++)await new Promise(r=>setTimeout(r,50));}if(!latest.current||locked.current){onError?.('Even wachten…');return false;}if(pending){if(type==='worldLocate'&&pending.type==='worldCast'){await perform(pending,onError);return false;}if(type==='worldCast'&&pending.type==='worldCast'||type==='arcadeSubmit'&&pending.type==='arcadeSubmit'&&params.run===pending.run)return perform(pending,onError);if(type==='worldLocate')return false;return fail('Even wachten, je vorige actie wordt nog verstuurd…');}if(type==='goAuto'&&params.enabled===true){const problem=await prepareBackgroundAutoCatchV2();if(problem){return fail(problem);}}if(type==='goAuto'&&params.enabled===false){try{await stopBackgroundAutoCatchV2();}catch{return fail('Autovangst kon niet stoppen. Probeer opnieuw.');}}const current=latest.current;if(!current||locked.current)return false;const newId=()=>globalThis.crypto?.randomUUID?.()??`cmd-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;conflict.current=false;if(await perform({type,...params,commandId:newId(),expectedRevision:current.player.revision},onError))return true;if(!conflict.current)return false;
  // The screen was a moment behind: fetch the newest state and send the same action once more.
  conflict.current=false;try{const next=await refreshV2();if(latest.current?.player.uid===next.player.uid)accept(next);}catch{return false;}const fresh=latest.current;if(!fresh||locked.current)return false;return perform({type,...params,commandId:newId(),expectedRevision:fresh.player.revision},onError);}

 useAdventureSyncV2(view?.player.uid,run,()=>!locked.current&&!pending&&!changingAccount&&(!latest.current?.goBattle||latest.current.goBattle.phase==='finished')&&!latest.current?.player.go?.queue);
 useBackgroundAutoCatchV2(view,message=>reportError(message,'command','notice'),changingAccount,tab==='Safari'&&!overlay);

 useEffect(()=>{startMusic(tab==='Ranked'?'battle':'field');},[tab]);

 async function changeAccount(work:()=>Promise<GameViewV2>,close=true){

  if(background.current){for(let i=0;i<160&&locked.current&&background.current;i++)await new Promise(r=>setTimeout(r,50));}if(locked.current||pending)throw new Error('Rond eerst je vorige spelactie af.');locked.current=true;setBusy(true);clearError();

  try{setChangingAccount(true);await stopBackgroundAutoCatchV2();const next=await work();if(latest.current?.player.uid!==next.player.uid){mapCamera.current=null;setCollectionTarget(undefined);setTradePair(undefined);}accept(next);if(close){clearOverlays();setTab('Safari');}}

  catch(e){await stopBackgroundAutoCatchV2().catch(()=>{});if(accountUid()!==latest.current?.player.uid){latest.current=null;setView(null);clearOverlays();reportError('Verbinding onderbroken. Tik op Probeer opnieuw.','poll');}throw e;}finally{locked.current=false;setBusy(false);setChangingAccount(false);}

 }



 async function backToMap(){const current=latest.current;if(current?.player.go?.queue){await run('goCancel');return;}if(current?.goBattle){if(current.goBattle.phase!=='finished')return;if(!await run('goClose',{battle:current.goBattle.id}))return;}clearOverlays();setTab('Safari');}

 function changeTab(next:GameTab){if(next===tab)return;if(latest.current?.player.go?.queue||latest.current?.goBattle&&latest.current.goBattle.phase!=='finished')return;clearOverlays();setMapFocus(null);setArcadeFocus(false);setTab(next);}

 function open(name:string,specimenId?:string){
  if(name==='map'){void backToMap();return;}
  if(name==='arcade'){changeTab('Arcade');return;}
  if(name==='ranked'){clearOverlays();setTab('Ranked');return;}
  if(name==='team'||name==='teamScore'){const target=latest.current?.player.specimens.find(s=>s.id===specimenId&&s.go)?.id;if(target)setCollectionTarget(target);clearOverlays();setMapFocus(null);setTab('Team');return;}
  if(name==='friends'){setProfileTab('friends');setOverlay('profile');return;}
  if(name==='profile')setProfileTab('me');
  if(name==='trade')setTradePair(specimenId);
  setOverlay(name);
 }

 const dismissReward=(id:string)=>setRewards(old=>old?{...old,dismissed:[...new Set([...old.dismissed,id])]}:old);
 const visitedTabs=useRef({uid:'',tabs:new Set<GameTab>(['Safari'])});
 const playerUid=view?.player.uid??'';if(visitedTabs.current.uid!==playerUid)visitedTabs.current={uid:playerUid,tabs:new Set<GameTab>(['Safari'])};visitedTabs.current.tabs.add(tab);
 const p=view?.player,inGame=!!view?.goBattle&&view.goBattle.phase!=='finished'||!!p?.go?.queue;
 const pageTitle=({gyms:'Gyms',coinShop:'Shop',bugdex:'Bugdex',buddy:'Buddy',friends:'Vrienden',teamPicker:'Team',bag:'Tas',goals:'Doelen',profile:'Profiel',settings:'Instellingen',account:'Je account',cocoons:'Cocons',journal:'Dagboek',trade:'Ruilen'} as Record<string,string>)[overlay]??'';
 const effective=view?{...view,player:{...view.player,settings:{...view.player.settings,reducedMotion:view.player.settings.reducedMotion||sysReduce}}}:null;
 const shellVisible=!!p?.onboarded&&!inGame&&!(tab==='Safari'&&mapFocus==='catch')&&!(tab==='Arcade'&&arcadeFocus),bottomInset=shellVisible?72:0;
 const contentActive=(name:GameTab)=>tab===name&&!overlay;
 const layer=(name:GameTab)=>({pointerEvents:contentActive(name)?'auto' as const:'none' as const,'aria-hidden':!contentActive(name),accessibilityElementsHidden:!contentActive(name),importantForAccessibility:contentActive(name)?'auto' as const:'no-hide-descendants' as const});
 const feedback=(inline=false)=>(error||pending&&!busy)?<View accessibilityRole={errorTone==='error'?'alert':'text'} style={[v.error,{backgroundColor:errorTone==='notice'?'#214C43':'#51382F',borderColor:errorTone==='notice'?'#6E9583':'#AE7760',...(inline?{margin:10}:{position:'absolute' as const,left:12,right:12,top:inGame?8:62,zIndex:30})}]}><Label small color={errorTone==='notice'?'#F0E6C8':'#FFB9A5'}>{error||'Een eerdere actie wacht op controle.'}</Label>{pending?<Button small secondary disabled={busy} onPress={()=>void perform(pending)}>Opnieuw proberen</Button>:<Pressable accessibilityRole="button" accessibilityLabel="Sluit melding" onPress={clearError} style={{minHeight:48,justifyContent:'center'}}><Label small>Sluiten</Label></Pressable>}</View>:null;
 const goals=p?<><DailyResearchV2 player={p} {...{run,busy}}/><TrainerGoalsV2 player={p} status={view?.mode==='local'?'Lokale speler':view?.linked?'Account gekoppeld':'Gastspeler'}/></>:null;

 return <GoBackProvider onBack={()=>{if(overlay){setOverlay('');return true;}if(tab!=='Safari'){void backToMap();return true;}return false;}}><MotionPrefs.Provider value={!!p?.settings.reducedMotion||sysReduce}><TextScale.Provider value={p?.settings.largeText?1.2:1}><InfoProvider>
  <View style={{flex:1,backgroundColor:'#071e1b',alignItems:'center'}}><SafeAreaView style={{flex:1,width:'100%',maxWidth:560,backgroundColor:'#071e1b',overflow:'hidden'}}><View style={{flex:1,minHeight:0,overflow:'hidden',backgroundColor:'#071e1b'}}>
   <StatusBar style="light"/>
   {!view?<LoadingScreenV2 busy={busy} error={error||undefined} onRetry={()=>void boot()}/>:!p!.onboarded?<ScrollView contentContainerStyle={{flexGrow:1,padding:20,paddingTop:36,paddingBottom:36,justifyContent:'center',gap:12}}><Scene index={4}/><Wash from="#12382FB0" to="#12382FF5"/><OnboardingV2 busy={busy} run={run} cloud={view.mode==='cloud'} onAccount={()=>setOverlay('account')}/></ScrollView>:<View key={p!.uid} style={{flex:1}}>
    <View testID="retained-field-map" {...layer('Safari')} style={[StyleSheet.absoluteFillObject,{bottom:bottomInset,opacity:tab==='Safari'?1:0,overflow:'hidden'}]}><RetainedContent active={contentActive('Safari')}><GoBackScope active={contentActive('Safari')}><ExploreV2 key={p!.uid} paused={tab!=='Safari'||!!overlay} bottomInset={0} onFocusChange={setMapFocus} camera={mapCamera} view={effective!} run={run} busy={busy} now={now} open={open}/></GoBackScope></RetainedContent></View>
    {visitedTabs.current.tabs.has('Arcade')&&<View testID="retained-arcade-tab" {...layer('Arcade')} style={[StyleSheet.absoluteFillObject,{bottom:bottomInset,opacity:tab==='Arcade'?1:0,backgroundColor:'#071e1b',overflow:'hidden'}]}><RetainedContent active={contentActive('Arcade')}><GoBackScope active={contentActive('Arcade')}><ArcadeScreenV3 view={effective!} {...{run,busy}} active={contentActive('Arcade')} backRef={arcadeBack} onFocusChange={setArcadeFocus} close={destination=>open(destination??'map')}/></GoBackScope></RetainedContent></View>}
    {visitedTabs.current.tabs.has('Team')&&<View testID="retained-bugs-tab" {...layer('Team')} style={[StyleSheet.absoluteFillObject,{bottom:bottomInset,opacity:tab==='Team'?1:0,backgroundColor:'#071e1b',overflow:'hidden'}]}><RetainedContent active={contentActive('Team')}><GoBackScope active={contentActive('Team')}><GoCollectionV2 view={effective!} {...{run,busy}} active={contentActive('Team')} initialSpecimenId={collectionTarget} onTargetConsumed={()=>setCollectionTarget(undefined)} open={open}/></GoBackScope></RetainedContent></View>}
    {visitedTabs.current.tabs.has('Ranked')&&<View testID="retained-battle-tab" {...layer('Ranked')} style={[StyleSheet.absoluteFillObject,{bottom:bottomInset,opacity:tab==='Ranked'?1:0,backgroundColor:'#071e1b',overflow:'hidden'}]}><RetainedContent active={contentActive('Ranked')}><GoBackScope active={contentActive('Ranked')}><GoBattleV2 view={effective!} {...{run,busy,now,open}} active={contentActive('Ranked')}/></GoBackScope></RetainedContent></View>}
    <BattleBack view={effective!} run={run} active={contentActive('Ranked')&&inGame}/>
   </View>}
   {!overlay&&feedback()}
   {!!overlay&&<View testID="secondary-page" style={[StyleSheet.absoluteFillObject,{bottom:bottomInset,zIndex:24,backgroundColor:'#071e1b'}]}>
    <Scene index={0}/><Wash from="#10352fee" to="#071e1bfa"/>{overlay!=='teamPicker'&&<PageHeader title={pageTitle} onBack={()=>setOverlay('')}/>}
    {p&&view&&overlay==='profile'&&<View style={{paddingHorizontal:12,paddingTop:8}}><TabsV2 testID="profile-tabs" tab={profileTab} setTab={setProfileTab} tabs={[{id:'me',emoji:'🧑',name:'Ik',line:'Jouw trainer en level',badge:Number(trainerReward(p.go?.trainer??{xp:0,claimedLevel:1,catchDay:''}).to>(p.go?.trainer?.claimedLevel??1))},{id:'goals',emoji:'🎯',name:'Doelen',line:'Vangen, lopen en je cijfers'},{id:'friends',emoji:'👫',name:'Vrienden',line:'Cadeaus sturen en openen',badge:view.friends.filter(f=>{const gift=f.gifts[1-f.users.indexOf(p.uid)];return !f.accepted&&f.requestedBy!==p.uid||f.accepted&&!!gift&&!gift.opened;}).length},{id:'cards',emoji:'🃏',name:'Kaarten',line:'Elke dag 1 kaart door te vangen'}]}/></View>}
    {feedback(true)}
    {view&&overlay==='cocoons'?<GoCocoonsV2 embedded view={view} {...{run,busy,now,open}}/>:p&&overlay==='teamPicker'?<GoTeamPickerV2 embedded player={p} {...{run,busy}} onClose={()=>setOverlay('')}/>:<ScrollView key={overlay==='profile'?profileTab:overlay} contentContainerStyle={{padding:16,gap:16,paddingBottom:20}}>
     {view&&overlay==='bag'&&<FieldBagV2 {...{view,run,busy,open}}/>}
     {overlay==='goals'&&goals}
     {view&&overlay==='gyms'&&<GoGymsV2 {...{view,run,busy,now,open}} onBattle={()=>open('ranked')}/>}
     {view&&overlay==='coinShop'&&<CoinShopV2 {...{view,run,busy,open}}/>}
     {view&&overlay==='journal'&&<GoJournalV2 view={view} open={open}/>}
     {view&&overlay==='trade'&&<GoTradeV2 view={view} {...{run,busy,now,open}} pair={tradePair}/>}
     {view&&overlay==='bugdex'&&<GoDexV2 view={view}/>}
     {view&&overlay==='buddy'&&<GoBuddyV2 view={view} {...{run,busy,now}}/>}
     {view&&overlay==='friends'&&<GoFriendsV2 {...{view,run,busy,open}}/>}
     {p&&overlay==='profile'&&<>{profileTab==='friends'||profileTab==='cards'?<GoFriendsV2 view={view!} tab={profileTab} {...{run,busy,open}}/>:profileTab==='goals'?goals:<><TrainerCardV2 player={p} {...{run,busy}}/><View style={[v.row,{justifyContent:'space-around'}]}>{([{icon:'profile',label:'Account',target:'account'},{icon:'heart',label:'Buddy',target:'buddy'},{icon:'research',label:'Dagboek',target:'journal'}] as const).map(x=><View key={x.target} style={{flex:1,alignItems:'center',gap:4}}><IconButton name={x.icon} label={x.target==='buddy'?'Open buddy':x.label} onPress={()=>setOverlay(x.target)}/><Label small>{x.label}</Label></View>)}</View></>}</>}
     {p&&overlay==='settings'&&<SettingsV2 player={p} {...{run,busy,open}}/>}
     {view&&overlay==='account'&&<GoAccountV2 view={view} busy={busy} change={changeAccount}/>}
    </ScrollView>}
   </View>}
   {shellVisible&&<View style={{position:'absolute',left:0,right:0,bottom:0,zIndex:25}}><MainTabsV3 active={shellTabs[tab]} onChange={next=>changeTab(gameTabs[next])}/></View>}
   <RewardFeedbackV2 batch={rewards} visible={!inGame&&!mapFocus&&!arcadeFocus} onDismiss={dismissReward}/>
   <UpdateGateV2 connected={!!view}/><AwaySummaryV2 view={view} visible={!!p?.onboarded&&!overlay&&!inGame&&!mapFocus&&!arcadeFocus} open={open} run={run} busy={busy}/><AdventureSyncPromptV2 uid={p?.uid} onboarded={!!p?.onboarded} visible={!overlay&&!inGame&&!mapFocus&&!arcadeFocus} run={run}/>
  </View></SafeAreaView></View>
 </InfoProvider></TextScale.Provider></MotionPrefs.Provider></GoBackProvider>;
}
