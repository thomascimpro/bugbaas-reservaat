import {setAudioSettings,stopAudio} from './audioV2';
import React,{useEffect,useRef,useState} from 'react';
import {View} from 'react-native';
import {ExploreV2} from './ExploreV2';
import {GoBackProvider} from './GoBackV2';
import {IconButton,InfoProvider,Label,MotionPrefs,TextScale,V} from './uiV2';
import type {GameViewV2} from '../game/typesV2';
import type {MapCameraV2} from './mapCameraV2';
import type {RunV2} from './ShopViewV2';

const host=()=> (window as unknown as {ReactNativeWebView?:{postMessage:(raw:string)=>void}}).ReactNativeWebView;
export function isNativeField(){return !!host()&&new URLSearchParams(location.search).get('nativeField')==='1';}
export default function BridgeFieldV2(){
  const [error,setError]=useState(''),[state,setState]=useState<{view:GameViewV2;busy:boolean;paused:boolean}|null>(null),[now,setNow]=useState(0),clock=useRef({server:0,received:0}),last=useRef(-1),camera=useRef<MapCameraV2|null>(null),requests=useRef(new Map<string,{resolve:(ok:boolean)=>void;onError?:(message:string)=>void;timer:ReturnType<typeof setTimeout>}>());
 const post=(m:unknown)=>host()?.postMessage(JSON.stringify(m));
  useEffect(()=>{const receive=(e:MessageEvent)=>{try{const m=JSON.parse(e.data);if(Number.isSafeInteger(m.seq)){if(m.seq===last.current)return;last.current=m.seq;}if(m.kind==='state'&&m.view?.player&&Number.isFinite(m.now)){setAudioSettings(m.view.player.settings);setState({view:m.view,busy:!!m.busy,paused:!!m.paused});clock.current={server:m.now,received:performance.now()};setNow(m.now);if(m.camera&&!camera.current)camera.current=m.camera;}else if(m.kind==='active'){if(!m.active)stopAudio();}else if(m.kind==='result'){const r=requests.current.get(m.id);if(r){clearTimeout(r.timer);requests.current.delete(m.id);if(m.ok!==true){const message=typeof m.error==='string'?m.error:'Actie niet verwerkt. Probeer opnieuw.';if(r.onError)r.onError(message);else setError(message);}r.resolve(m.ok===true);}}else if(m.kind==='back'){const key=new KeyboardEvent('keydown',{key:'Escape',cancelable:true});window.dispatchEvent(key);post({kind:'backResult',handled:key.defaultPrevented});}}catch{}};
  window.addEventListener('message',receive);document.addEventListener('message',receive as EventListener);post({kind:'ready'});const tick=setInterval(()=>{if(!document.hidden&&clock.current.server)setNow(clock.current.server+performance.now()-clock.current.received);},500);
  return()=>{clearInterval(tick);window.removeEventListener('message',receive);document.removeEventListener('message',receive as EventListener);for(const r of requests.current.values()){clearTimeout(r.timer);r.resolve(false);}requests.current.clear();};
 },[]);
  const run:RunV2=(command,params={},onError)=>new Promise<boolean>(resolve=>{if(command!=='worldLocate')setError('');const id=crypto.randomUUID(),timer=setTimeout(()=>{requests.current.delete(id);const message='De app antwoordt niet. Probeer deze actie opnieuw.';if(onError)onError(message);else setError(message);resolve(false);},25000);requests.current.set(id,{resolve,timer,onError});post({kind:'command',id,command,params});});
 if(!state)return <View style={{flex:1,backgroundColor:V.pine,alignItems:'center',justifyContent:'center'}}><Label color="white">Laden…</Label></View>;
  return <GoBackProvider onBack={()=>false}><MotionPrefs.Provider value={state.view.player.settings.reducedMotion}><TextScale.Provider value={state.view.player.settings.largeText?1.2:1}><InfoProvider><View style={{flex:1}}><ExploreV2 paused={state.paused} view={state.view} busy={state.busy} now={now} run={run} camera={camera} open={(name,specimenId)=>post({kind:'navigate',name,specimenId,camera:camera.current??undefined})}/>{!!error&&<View accessibilityRole="alert" style={{position:'absolute',top:105,left:14,right:14,padding:10,borderRadius:15,backgroundColor:'#633A30',flexDirection:'row',alignItems:'center',gap:8}}><View style={{flex:1}}><Label small>{error}</Label></View><IconButton name="close" label="Sluit kaartmelding" onPress={()=>setError('')}/></View>}</View></InfoProvider></TextScale.Provider></MotionPrefs.Provider></GoBackProvider>;
}
