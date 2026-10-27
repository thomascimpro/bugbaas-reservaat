import React,{useEffect,useRef,useState} from 'react';
import {AppState,Platform,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {readAdventureSync,requestAdventureSyncPermission} from './AdventureSyncV2';
import type {RunV2} from './ShopViewV2';
import {Button,Help,Label,Panel} from './uiV2';
const key=(uid:string)=>'bugbaas-adventure-sync:'+uid;
// Opt-in belongs to the current account on this device. Never reads health data for a new guest.
export function useAdventureSyncV2(uid:string|undefined,run:RunV2){
 const latest=useRef(run);latest.current=run;
 useEffect(()=>{if(!uid||Platform.OS!=='android')return;let alive=true,reading=false;
  async function sync(){if(reading||!alive||AppState.currentState!=='active')return;reading=true;try{if(await AsyncStorage.getItem(key(uid!))!=='on'||!alive)return;const result=await readAdventureSync();if(alive&&result.available&&result.snapshot)await latest.current('adventureSync',{snapshot:result.snapshot});}catch{/* Health access never blocks opening or playing the game. */}finally{reading=false;}}
  void sync();const subscription=AppState.addEventListener('change',state=>{if(state==='active')void sync();});return()=>{alive=false;subscription.remove();};
 },[uid]);
}
export function AdventureSyncControlV2({uid,run,busy}:{uid:string;run:RunV2;busy:boolean}){
 const [enabled,setEnabled]=useState(false),[working,setWorking]=useState(false),[status,setStatus]=useState(''),[meters,setMeters]=useState<number|null>(null);
 useEffect(()=>{let alive=true;void AsyncStorage.getItem(key(uid)).then(value=>{if(alive)setEnabled(value==='on');});return()=>{alive=false;};},[uid]);
 async function sync(){setWorking(true);setStatus('');try{const result=await readAdventureSync();if(!result.available||!result.snapshot){setStatus(result.reason==='permission'?'Geef toegang tot stappen en afstand.':result.reason==='unavailable'?'Installeer of update Health Connect.':'Afstand kon niet worden opgehaald.');return;}setMeters(result.snapshot.meters);if(await run('adventureSync',{snapshot:result.snapshot}))setStatus('Afstand bijgewerkt.');}catch{setStatus('Synchroniseren lukt nu niet.');}finally{setWorking(false);}}
 async function connect(){setWorking(true);setStatus('');try{if(!await requestAdventureSyncPermission()){setStatus('Geen toegang. Je kunt op de kaart blijven wandelen.');return;}await AsyncStorage.setItem(key(uid),'on');setEnabled(true);await sync();}catch{setStatus('Health Connect kon niet openen.');}finally{setWorking(false);}}
 if(Platform.OS!=='android')return <Panel><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Label bold>Adventure Sync</Label><Help title="Adventure Sync" icon="compass" body="De Android-app kan stappen en afstand uit Health Connect ophalen, ook van Google Fit als je die app met Health Connect laat delen. De browser telt wandelen op de geopende GPS-kaart."/></View><Label small>Beschikbaar in de Android-app</Label></Panel>;
 return <Panel><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><View style={{gap:4}}><Label bold>Adventure Sync</Label><Label small>{enabled?'Gekoppeld aan Health Connect':'Stappen en afstand'}</Label></View><Help title="Adventure Sync" icon="compass" body="Eerst koppelen, daarna telt wandelen. Open of synchroniseer de app om afstand op te halen. Laat Google Fit of je andere stappenteller stappen en afstand delen met Health Connect. Handmatige invoer telt niet. Kaartwandelen en Health Connect worden niet dubbel beloond. BugBaas leest alleen stappen en afstand; Health Connect gebruikt hiervoor geen GPS. Met autovangst aan kan de aparte Android-locatiedienst ook op de achtergrond afstand tellen; de blijvende melding laat zien dat die actief is."/></View>{meters!==null&&<Label>{(meters/1000).toLocaleString('nl-NL',{maximumFractionDigits:2})} km vandaag</Label>}{enabled?<><Button small icon="refresh" busy={working} disabled={busy} onPress={()=>void sync()}>Synchroniseren</Button><Button small secondary disabled={busy||working} onPress={()=>{void AsyncStorage.removeItem(key(uid));setEnabled(false);setStatus('');setMeters(null);}}>Uitzetten</Button></>:<Button small icon="compass" busy={working} disabled={busy} onPress={()=>void connect()}>Koppelen</Button>}{!!status&&<Label small>{status}</Label>}</Panel>;
}
