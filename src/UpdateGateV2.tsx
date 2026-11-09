import React,{useEffect,useState} from 'react';
import {AppState,Linking,Modal,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {olderVersion} from '../game/versionV2';
import {serverMinClient} from './client';
import {Button,Glyph,Label,Panel,Title} from './uiV2';
import {APP_RELEASES_URL,fetchAppReleaseV2,releaseVersion,type AppReleaseV2} from './appUpdatesV2';

const CACHE='bugbaas-published-release-v1',LATER='bugbaas-update-later-v1:',CHECK_MS=3600000,LATER_MS=86400000;
export function UpdateNoticeV2({version,onDownload,onLater}:{version:string;onDownload:()=>void;onLater:()=>void}){
 return <Panel style={{gap:8}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Glyph name="gift" size={38}/><View style={{flex:1}}><Label bold>Update beschikbaar</Label><Label small>Versie {version}</Label></View></View><View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button small onPress={onDownload}>Download</Button></View><View style={{flex:1}}><Button small secondary onPress={onLater}>Later</Button></View></View></Panel>;
}
/** Blocks play when the server needs a newer app, so old builds cannot misread new game data. */
export function UpdateGateV2({connected,canPrompt=true}:{connected:boolean;canPrompt?:boolean}){
 const [required,setRequired]=useState<string|undefined>(),[latest,setLatest]=useState<AppReleaseV2|null>(null),[dismissed,setDismissed]=useState({version:'',until:0}),[linkError,setLinkError]=useState(false);
 const current=Constants.expoConfig?.version;
 useEffect(()=>{if(connected)setRequired(serverMinClient());},[connected]);
 useEffect(()=>{let alive=true,checking=false,lastCheck=0;
  const apply=async(release:AppReleaseV2)=>{const until=Number(await AsyncStorage.getItem(LATER+release.version).catch(()=>null));if(alive){setLatest(release);setDismissed({version:release.version,until:Number.isFinite(until)?until:0});}};
  const check=async()=>{if(checking||AppState.currentState!=='active')return;checking=true;try{
   const now=Date.now();if(now-lastCheck<CHECK_MS)return;
   try{const cached=JSON.parse(await AsyncStorage.getItem(CACHE)??'null'),version=releaseVersion(cached?.version);if(version&&Number.isFinite(cached.checkedAt)&&cached.checkedAt<=now&&now-cached.checkedAt<CHECK_MS){lastCheck=cached.checkedAt;await apply({version});return;}}catch{}
   lastCheck=now;const release=await fetchAppReleaseV2();if(release&&alive){await apply(release);await AsyncStorage.setItem(CACHE,JSON.stringify({...release,checkedAt:now})).catch(()=>{});}
  }finally{checking=false;}};
  void check();const sub=AppState.addEventListener('change',state=>{if(state==='active')void check();}),timer=setInterval(()=>void check(),CHECK_MS);return()=>{alive=false;sub.remove();clearInterval(timer);};
 },[]);
 const download=()=>{setLinkError(false);void Linking.openURL(APP_RELEASES_URL).catch(()=>setLinkError(true));};
 if(olderVersion(current,required))return <Modal visible transparent animationType="fade" onRequestClose={()=>{}}><View style={{flex:1,backgroundColor:'#071F1AE6',alignItems:'center',justifyContent:'center',padding:22}}><Panel style={{width:'100%',maxWidth:420}}><Title>Update nodig</Title><Label>Deze versie ({current}) kan de nieuwste spelgegevens niet veilig lezen. Installeer versie {required} of nieuwer; je voortgang blijft bewaard.</Label><Button icon="compass" onPress={download}>Download de nieuwe versie</Button>{linkError&&<Label small>Downloadpagina kon niet openen. Probeer opnieuw.</Label>}</Panel></View></Modal>;
 if(!canPrompt||!latest||!olderVersion(current,latest.version)||dismissed.version===latest.version&&dismissed.until>Date.now())return null;
 return <View testID="update-available" accessibilityLiveRegion="polite" style={{position:'absolute',bottom:84,left:12,right:12,zIndex:80,maxWidth:420,alignSelf:'center'}}><UpdateNoticeV2 version={latest.version} onDownload={download} onLater={()=>{const until=Date.now()+LATER_MS;setDismissed({version:latest.version,until});void AsyncStorage.setItem(LATER+latest.version,String(until)).catch(()=>{});}}/>{linkError&&<Label small>Downloadpagina kon niet openen. Probeer opnieuw.</Label>}</View>;
}
