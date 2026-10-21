import React,{useEffect,useRef,useState} from 'react';
import {ActivityIndicator,AppState,BackHandler,View} from 'react-native';
import {WebView} from 'react-native-webview';
import * as Location from 'expo-location';
import type {GameViewV2} from '../game/typesV2';
import type {RunV2} from './ShopViewV2';
import type {MapCameraV2} from './mapCameraV2';
import {gameServerURL} from './client';
import {NATIVE_GPS_SHIM,nativeFieldURL,parseNativeFieldRequest} from './nativeFieldProtocolV2';
import {createNativeGPSWatches} from './nativeGPSWatchesV2';
import {useGoBack} from './GoBackV2';
import {Button,Label,V} from './uiV2';

export const browserExploration=false;
type Props={paused?:boolean;view:GameViewV2;run:RunV2;busy:boolean;now:number;open:(name:string,specimenId?:string)=>void;camera?:React.MutableRefObject<MapCameraV2|null>};
export function ExploreV2(props:Props){
 const web=useRef<WebView>(null),latest=useRef(props),alive=useRef(true),ready=useRef(false),active=useRef(AppState.currentState==='active'),sequence=useRef(0),generation=useRef(0),watches=useRef(createNativeGPSWatches()),backPending=useRef(false),[problem,setProblem]=useState(''),[loading,setLoading]=useState(true);latest.current=props;
 let uri='';try{uri=nativeFieldURL(gameServerURL,__DEV__);}catch{}
 const send=(value:Record<string,unknown>)=>{if(alive.current&&ready.current)web.current?.postMessage(JSON.stringify({...value,seq:++sequence.current}));};
 const state=()=>{const p=latest.current;send({kind:'state',view:p.view,busy:p.busy,now:p.now,paused:!!p.paused,camera:p.camera?.current});};
 const stop=()=>{generation.current++;watches.current.stop();};
 const permission=async()=>{const p=await Location.getForegroundPermissionsAsync();send({kind:'permission',state:p.granted?'granted':p.canAskAgain?'prompt':'denied'});return p;};
 const gps=async(action:'get'|'watch'|'clear',id:number)=>{
  if(action==='clear'){watches.current.clear(id);return;}
  if(!active.current){send({kind:'geoError',id,code:2});return;}
  const ownGeneration=generation.current,watch=action==='watch'?watches.current.begin(id):null,current=()=>alive.current&&active.current&&ownGeneration===generation.current&&(!watch||watch.current()),error=(code:number)=>{if(current())send({kind:'geoError',id,code});};
  try{
   let p=await Location.getForegroundPermissionsAsync();if(!current())return;if(!p.granted)p=await Location.requestForegroundPermissionsAsync();if(!current())return;
   send({kind:'permission',state:p.granted?'granted':p.canAskAgain?'prompt':'denied'});if(!p.granted){error(1);return;}
   const servicesEnabled=await Location.hasServicesEnabledAsync();if(!current())return;if(!servicesEnabled){error(2);return;}
   const position=(p:Location.LocationObject)=>{if(!current())return;send({kind:'position',id,position:{coords:{latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy??999},timestamp:p.timestamp}});};
   if(action==='get')position(await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High}));
   else{const subscription=await Location.watchPositionAsync({accuracy:Location.Accuracy.High,timeInterval:5000,distanceInterval:4},position,()=>error(2));watch!.attach(subscription);}
  }catch{error(2);}
 };
 useEffect(()=>{alive.current=true;const listener=AppState.addEventListener('change',status=>{active.current=status==='active';if(!active.current)stop();send({kind:'active',active:active.current});if(active.current)void permission();});return()=>{alive.current=false;ready.current=false;stop();listener.remove();};},[]);
 useEffect(()=>{if(ready.current)state();},[props.view.player.revision,props.busy,props.paused,props.view.player.settings.reducedMotion,props.view.player.settings.largeText]);
 useGoBack(true,()=>{if(!ready.current)return false;backPending.current=true;send({kind:'back'});return true;},50);
 async function message(raw:string){const m=parseNativeFieldRequest(raw);if(!m)return;
  if(m.kind==='ready'){stop();ready.current=true;setLoading(false);setProblem('');state();send({kind:'active',active:active.current});await permission();}
  else if(m.kind==='geo')await gps(m.action,m.id);
  else if(m.kind==='command'){if(!active.current){send({kind:'result',id:m.id,ok:false});return;}const ok=await latest.current.run(m.command,m.params);state();send({kind:'result',id:m.id,ok});}
  else if(m.kind==='navigate'){if(m.camera&&latest.current.camera)latest.current.camera.current=m.camera;latest.current.open(m.name,m.specimenId);}
  else if(m.kind==='backResult'&&backPending.current){backPending.current=false;if(!m.handled)BackHandler.exitApp();}
 }
 if(!uri)return <View style={{flex:1,justifyContent:'center',padding:24}}><Label>De beveiligde kaartverbinding is nog niet ingesteld.</Label></View>;
 // Android also reports history.pushState as load start; only a new frame handshake resets GPS.
 const origin=new URL(uri).origin;
 return <View style={{flex:1,backgroundColor:V.pine}}><WebView ref={web} source={{uri,headers:{'x-vercel-skip-toolbar':'1'}}} originWhitelist={[origin,'about:blank']} javaScriptEnabled domStorageEnabled geolocationEnabled={false} mixedContentMode="never" setSupportMultipleWindows={false} injectedJavaScriptBeforeContentLoaded={NATIVE_GPS_SHIM} injectedJavaScript={NATIVE_GPS_SHIM} onShouldStartLoadWithRequest={request=>request.url==='about:blank'||request.url.startsWith(origin+'/?nativeField=1')} onMessage={e=>void message(e.nativeEvent.data)} onLoadStart={()=>{if(!ready.current)setLoading(true);}} onError={()=>{ready.current=false;stop();setLoading(false);setProblem('De kaart kon niet laden. Controleer je verbinding.');}} style={{flex:1,backgroundColor:V.pine}}/>{loading&&<View pointerEvents="none" style={{position:'absolute',inset:0,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color="#E7D69D"/></View>}{problem&&<View style={{position:'absolute',inset:20,justifyContent:'center',gap:15}}><Label color="white">{problem}</Label><Button onPress={()=>web.current?.reload()}>Opnieuw laden</Button></View>}</View>;
}
