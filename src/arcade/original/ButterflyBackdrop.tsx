import React,{useEffect,useRef} from 'react';
import {AppState,StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';
import type {OriginalButterflyCatchState} from '../../../game/arcade/original/butterflyCatch';
import {gameServerURL} from '../../client';

/** Read-only native renderer. Input, clock, score and replay remain in the host game. */
export function ButterflyBackdrop({state,ticket,reduced,onReady,onError}:{state:OriginalButterflyCatchState;ticket:string;reduced:boolean;onReady:()=>void;onError:()=>void}){
 const web=useRef<WebView>(null),loaded=useRef(false),presented=useRef(false),last=useRef(0),current=useRef({state,reduced}),callbacks=useRef({onReady,onError});current.current={state,reduced};callbacks.current={onReady,onError};
 let origin='',uri='';try{const base=new URL(gameServerURL);if(base.protocol==='https:'&&!base.username&&!base.password){origin=base.origin;uri=origin+'/butterfly-viewer.html?ticket='+encodeURIComponent(ticket);}}catch{}
 const send=()=>{if(!loaded.current)return;const message=JSON.stringify({...current.current,ticket,active:AppState.currentState==='active'});web.current?.injectJavaScript(`window.__bugbaasButterfly?.update(${message});true;`);};
 useEffect(()=>{loaded.current=false;presented.current=false;const timer=setTimeout(()=>{if(!presented.current)callbacks.current.onError();},12000),listener=AppState.addEventListener('change',()=>send());return()=>{clearTimeout(timer);listener.remove();};},[uri]);
 // Simulation mutates the same state object; elapsedMs, not object identity, drives bridge frames.
 useEffect(()=>{const now=Date.now();if(now-last.current>=30){last.current=now;send();}},[state.elapsedMs,reduced]);
 if(!uri)return null;
 return <WebView ref={web} key={uri} pointerEvents="none" source={{uri,headers:{'x-vercel-skip-toolbar':'1'}}} originWhitelist={[origin]} javaScriptEnabled domStorageEnabled={false} geolocationEnabled={false} sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} mixedContentMode="never" setSupportMultipleWindows={false} javaScriptCanOpenWindowsAutomatically={false} scrollEnabled={false} bounces={false} overScrollMode="never" onShouldStartLoadWithRequest={r=>r.url===uri} onMessage={e=>{if(e.nativeEvent.data.length>512)return;try{const m=JSON.parse(e.nativeEvent.data);if(m.ticket!==ticket)return;if(m.kind==='ready'){loaded.current=true;send();if(m.v!==2){presented.current=true;callbacks.current.onReady();}}else if(m.kind==='frame'){presented.current=true;callbacks.current.onReady();}else if(m.kind==='error')callbacks.current.onError();}catch{}}} onError={()=>callbacks.current.onError()} onHttpError={()=>callbacks.current.onError()} onRenderProcessGone={()=>callbacks.current.onError()} onContentProcessDidTerminate={()=>callbacks.current.onError()} style={[StyleSheet.absoluteFillObject,{backgroundColor:'transparent'}]}/>;
}
