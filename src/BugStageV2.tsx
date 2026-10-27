import React,{useContext,useEffect,useRef,useState} from 'react';
import {AppState,StyleSheet,View} from 'react-native';
import {WebView} from 'react-native-webview';
import {SpriteView} from './artV2';
import {MotionPrefs} from './uiV2';
import {gameServerURL} from './client';

export default function BugStageV2({id,shiny=false,onReady}:{id:string;shiny?:boolean;onReady?:()=>void}){
 const reduced=useContext(MotionPrefs),web=useRef<WebView>(null),readyCallback=useRef(onReady),current=useRef(''),notified=useRef(''),loaded=useRef(false),[ready,setReady]=useState(false),[failed,setFailed]=useState(false);readyCallback.current=onReady;
 let origin='',uri='';try{const base=new URL(gameServerURL);if(base.protocol==='https:'&&!base.username&&!base.password&&/^[a-z0-9_]+$/.test(id)){origin=base.origin;uri=origin+'/bug-viewer.html?'+new URLSearchParams({id,shiny:shiny?'1':'0',motion:reduced?'0':'1'});}}catch{}
 current.current=uri;
 useEffect(()=>{loaded.current=false;setReady(false);setFailed(false);if(!uri)return;const timer=setTimeout(()=>{if(!loaded.current)setFailed(true);},12000),listener=AppState.addEventListener('change',state=>web.current?.injectJavaScript(`window.__bugbaasViewer?.setActive(${state==='active'});true;`));return()=>{clearTimeout(timer);listener.remove();};},[uri]);
 return <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
  {!!uri&&!failed&&<WebView key={uri} ref={web} source={{uri,headers:{'x-vercel-skip-toolbar':'1'}}} originWhitelist={[origin]} javaScriptEnabled domStorageEnabled={false} geolocationEnabled={false} sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} mixedContentMode="never" setSupportMultipleWindows={false} javaScriptCanOpenWindowsAutomatically={false} scrollEnabled={false} bounces={false} overScrollMode="never" onShouldStartLoadWithRequest={request=>request.url===uri} onMessage={event=>{if(current.current!==uri||event.nativeEvent.data.length>1024)return;try{const message=JSON.parse(event.nativeEvent.data);if(message.id!==id||message.shiny!==shiny)return;if(message.kind==='error'){setFailed(true);return;}if(message.kind!=='ready')return;loaded.current=true;setReady(true);web.current?.injectJavaScript(`window.__bugbaasViewer?.setActive(${AppState.currentState==='active'});true;`);if(notified.current!==uri){notified.current=uri;readyCallback.current?.();}}catch{}}} onError={()=>setFailed(true)} onHttpError={()=>setFailed(true)} onRenderProcessGone={()=>setFailed(true)} onContentProcessDidTerminate={()=>setFailed(true)} style={{flex:1,backgroundColor:'transparent',opacity:ready?1:0}}/>}
  {(!ready||failed||!uri)&&<View style={{position:'absolute',inset:0,alignItems:'center',justifyContent:'center'}}><SpriteView id={id} shiny={shiny} size={190} animate={!reduced}/></View>}
 </View>;
}
