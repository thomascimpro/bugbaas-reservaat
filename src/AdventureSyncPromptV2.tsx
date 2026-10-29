import React,{useEffect,useState} from 'react';
import {Modal,Platform,Text,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {adventureSyncAskKey,adventureSyncOn,connectAdventureSyncV2} from './AdventureSyncControlV2';
import type {RunV2} from './ShopViewV2';
import {Button,Label,Panel} from './uiV2';
const ASK_AGAIN=3*86400000,MAX_LATER=2;
type Ask={count:number;at:number};
const parse=(raw:string|null):Ask=>{try{const a=raw?JSON.parse(raw):null;if(a&&Number.isSafeInteger(a.count)&&Number.isFinite(a.at))return a;}catch{}return {count:0,at:0};};
/** One friendly Android question after onboarding: count steps while the app is closed. 'Later' asks again after 3 days, at most twice. */
export function AdventureSyncPromptV2({uid,onboarded,visible,run}:{uid:string|undefined;onboarded:boolean;visible:boolean;run:RunV2}){
 const [ask,setAsk]=useState(false),[working,setWorking]=useState(false),[status,setStatus]=useState('');
 useEffect(()=>{setAsk(false);setStatus('');if(Platform.OS!=='android'||!uid||!onboarded)return;let alive=true;
  // A short pause so the question never lands on top of the last onboarding step.
  const timer=setTimeout(()=>{void (async()=>{try{if(await adventureSyncOn(uid))return;const a=parse(await AsyncStorage.getItem(adventureSyncAskKey(uid)));if(alive&&a.count<MAX_LATER&&(a.count===0||Date.now()-a.at>=ASK_AGAIN))setAsk(true);}catch{}})();},4000);
  return()=>{alive=false;clearTimeout(timer);};
 },[uid,onboarded]);
 if(!uid||!ask)return null;
 async function later(){setAsk(false);const a=parse(await AsyncStorage.getItem(adventureSyncAskKey(uid!)).catch(()=>null));await AsyncStorage.setItem(adventureSyncAskKey(uid!),JSON.stringify({count:a.count+1,at:Date.now()})).catch(()=>{});}
 async function yes(){setWorking(true);setStatus('');try{const result=await connectAdventureSyncV2(uid!,run);if(result.ok)setAsk(false);else setStatus(result.status);}finally{setWorking(false);}}
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={()=>void later()}><View style={{flex:1,backgroundColor:'#061F25BB',justifyContent:'center',alignItems:'center',padding:18}}><Panel style={{width:'100%',maxWidth:420,backgroundColor:'#153F35',gap:14,alignItems:'center'}}>
  <Text accessibilityElementsHidden importantForAccessibility="no" style={{fontSize:72,lineHeight:86}}>👟🐛</Text>
  <Label bold center>👟 Stappen tellen als de app dicht is?</Label>
  <Label small center>Lopen = bugs, cocons en weekkisten 🎁</Label>
  <View style={{alignSelf:'stretch',gap:8}}><Button icon="compass" busy={working} onPress={()=>void yes()} accessibilityLabel="Ja, stappen tellen">Ja!</Button><Button small secondary disabled={working} onPress={()=>void later()}>Later</Button></View>
  {!!status&&<Label small center>{status}</Label>}
 </Panel></View></Modal>;
}
