import React,{useEffect,useRef,useState} from 'react';
import {AppState,Platform,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {readAdventureSync,requestAdventureSyncPermission,adventureBackgroundStatus,adventureSyncStorageKey,adventureSyncPayload} from './AdventureSyncV2';
import type {RunV2} from './ShopViewV2';
import {HEALTH_HISTORY_DAYS} from '../game/adventureSyncV2';
import {Button,Help,Label,Panel} from './uiV2';
const key=adventureSyncStorageKey,healthPayload=adventureSyncPayload;
export const adventureSyncAskKey=(uid:string)=>'bugbaas-adventure-sync-ask:'+uid;
export async function adventureSyncOn(uid:string){return await AsyncStorage.getItem(key(uid))==='on';}
/** One read + server sync. true = synced; otherwise a short Dutch reason. */
export async function syncAdventureNowV2(run:RunV2):Promise<{ok:boolean;status:string;meters?:number}>{const result=await readAdventureSync(Date.now()-HEALTH_HISTORY_DAYS*86400000);if(!result.available||!result.snapshot)return {ok:false,status:result.reason==='permission'?'Geef toegang tot stappen en afstand.':result.reason==='unavailable'?'Installeer of update Health Connect.':'Afstand kon niet worden opgehaald.'};if(await run('adventureSync',{snapshot:healthPayload(result)}))return {ok:true,meters:result.snapshot.meters,status:result.snapshot.steps?result.snapshot.distanceBasis==='steps'?'Afstand geschat uit stappen.':'Afstand bijgewerkt.':'Nog geen stappen ontvangen. Laat je stappenteller delen met Health Connect.'};return {ok:false,meters:result.snapshot.meters,status:'Nog niet bijgewerkt. Probeer opnieuw zodra je vorige actie klaar is.'};}
/** The connect flow (permission, first sync, store 'on'); shared by settings and the first-time prompt. */
export async function connectAdventureSyncV2(uid:string,run:RunV2):Promise<{ok:boolean;status:string;meters?:number}>{try{if(!await requestAdventureSyncPermission())return {ok:false,status:'Geen toegang. Je kunt op de kaart blijven wandelen.'};const result=await syncAdventureNowV2(run);if(result.ok)await AsyncStorage.setItem(key(uid),'on');return result;}catch{return {ok:false,status:'Health Connect kon niet openen.'};}}
// Opt-in belongs to the current account on this device. Never reads health data for a new guest.
export function useAdventureSyncV2(uid:string|undefined,run:RunV2,canSync:()=>boolean=()=>true,onSynced?:(done:boolean)=>void,since?:()=>number){
 const latest=useRef({run,canSync,onSynced,since});latest.current={run,canSync,onSynced,since};
 useEffect(()=>{if(!uid||Platform.OS!=='android')return;let alive=true,reading=false,retry:ReturnType<typeof setTimeout>|undefined;
  const later=()=>{if(alive&&!retry)retry=setTimeout(()=>{retry=undefined;void sync();},2500);};
  let pendingAt=0,waitLimit:ReturnType<typeof setTimeout>|undefined;
  const done=()=>{pendingAt=0;if(waitLimit)clearTimeout(waitLimit);waitLimit=undefined;latest.current.onSynced?.(true);};
  async function sync(){if(reading||!alive||AppState.currentState!=='active')return;reading=true;try{
   if(await AsyncStorage.getItem(key(uid!))!=='on'||!alive){done();return;}
   if(!pendingAt){pendingAt=Date.now();waitLimit=setTimeout(()=>{if(alive)latest.current.onSynced?.(true);},15000);}latest.current.onSynced?.(Date.now()-pendingAt>=15000);
   if(!latest.current.canSync()){later();return;}
   const result=await readAdventureSync(latest.current.since?.()||Date.now()-HEALTH_HISTORY_DAYS*86400000);
   if(!alive||AppState.currentState!=='active')return;
   if(!result.available||!result.snapshot){done();return;}
   if(!latest.current.canSync()||!await latest.current.run('adventureSync',{snapshot:healthPayload(result)}))later();else done();
  }catch{later();}finally{reading=false;if(pendingAt&&Date.now()-pendingAt>=15000)latest.current.onSynced?.(true);}}
  void sync();const subscription=AppState.addEventListener('change',state=>{if(state==='active')void sync();}),timer=setInterval(()=>void sync(),60000);return()=>{alive=false;subscription.remove();clearInterval(timer);if(retry)clearTimeout(retry);if(waitLimit)clearTimeout(waitLimit);};
 },[uid]);
}
export function AdventureSyncControlV2({uid,run,busy}:{uid:string;run:RunV2;busy:boolean}){
 const [enabled,setEnabled]=useState(false),[working,setWorking]=useState(false),[status,setStatus]=useState(''),[meters,setMeters]=useState<number|null>(null),[background,setBackground]=useState({supported:false,granted:false});
 useEffect(()=>{let alive=true;void AsyncStorage.getItem(key(uid)).then(value=>{if(alive)setEnabled(value==='on');});void adventureBackgroundStatus().then(value=>{if(alive)setBackground(value);});return()=>{alive=false;};},[uid]);
 async function sync(){setWorking(true);setStatus('');try{const result=await syncAdventureNowV2(run);if(result.meters!==undefined)setMeters(result.meters);setStatus(result.status);}catch{setStatus('Synchroniseren lukt nu niet.');}finally{setWorking(false);}}
 async function connect(){setWorking(true);setStatus('');try{const result=await connectAdventureSyncV2(uid,run);if(result.meters!==undefined)setMeters(result.meters);setStatus(result.status);if(result.ok)setEnabled(true);setBackground(await adventureBackgroundStatus());}finally{setWorking(false);}}
 if(Platform.OS!=='android')return <Panel><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Label bold>Adventure Sync</Label><Help title="Adventure Sync" icon="compass" body="De Android-app kan stappen en afstand uit Health Connect ophalen, ook van Google Fit als je die app met Health Connect laat delen. De browser telt wandelen op de geopende GPS-kaart."/></View><Label small>Beschikbaar in de Android-app</Label></Panel>;
 return <Panel><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><View style={{gap:4}}><Label bold>Adventure Sync</Label><Label small>{enabled?background.granted?'Live bijwerken · gekoppeld':'Km bij gesloten app · gekoppeld':'Km bij gesloten app'}</Label></View><Help title="Adventure Sync" icon="compass" body="Eerst koppelen, daarna telt wandelen. Met autovangst aan werkt de meldingsbalk tijdens wandelen via GPS bij. Met toestemming voor Health Connect op de achtergrond lezen we daarbij maximaal eenmaal per minuut je stappen en afstand. Je stappenteller kan nieuwe metingen later aanleveren. Zonder achtergrondtoestemming halen we Health Connect bij openen op; GPS blijft op de achtergrond werken zolang Android de locatiedienst laat draaien. Gemeten afstand heeft voorrang; anders schatten we uit stappen. Handmatige invoer telt niet en dezelfde wandeling wordt niet dubbel beloond. Het tijdstip in de melding hoort bij de laatst bevestigde serverstand."/></View>{meters!==null&&<Label>{(meters/1000).toLocaleString('nl-NL',{maximumFractionDigits:2})} km vandaag</Label>}{enabled?<><Button small icon="refresh" busy={working} disabled={busy} onPress={()=>void sync()}>Synchroniseren</Button>{background.supported&&!background.granted&&<Button small secondary icon="compass" disabled={busy||working} onPress={()=>void connect()}>Live bijwerken toestaan</Button>}<Button small secondary disabled={busy||working} onPress={()=>{void AsyncStorage.removeItem(key(uid));void AsyncStorage.setItem(adventureSyncAskKey(uid),JSON.stringify({count:2,at:Date.now()}));setEnabled(false);setStatus('');setMeters(null);}}>Uitzetten</Button></>:<Button small icon="compass" busy={working} disabled={busy} onPress={()=>void connect()}>Koppelen</Button>}{!!status&&<Label small>{status}</Label>}</Panel>;
}
