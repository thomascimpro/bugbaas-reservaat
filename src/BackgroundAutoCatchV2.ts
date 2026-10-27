import {useEffect,useRef} from 'react';
import {Alert,AppState,PermissionsAndroid,Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import {withBackgroundSessionV2} from './client';
import {autoLocationOwnerV2,backgroundAutoTickV2,commandSerialV2} from './backgroundAutoSessionV2';
import type {AutoLocationV2,AutoSessionV2} from './backgroundAutoSessionV2';
import type {GameViewV2} from '../game/typesV2';

const TASK='bugbaas-autocatch-location-v1',KEY='bugbaas-background-autocatch-v1';
const controls=commandSerialV2();let generation=0,lastTickAt=0,foregroundFieldActive=true,running:Promise<void>|null=null,lastView:GameViewV2|null=null;
const newId=()=>globalThis.crypto?.randomUUID?.()??`auto-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
async function readSession():Promise<AutoSessionV2|null>{try{const raw=await AsyncStorage.getItem(KEY);if(!raw)return null;const session=JSON.parse(raw);return typeof session?.uid==='string'&&session.uid?session:null;}catch{return null;}}
async function stopService(uid?:string){const session=await readSession();if(uid&&session&&session.uid!==uid)return;generation++;await AsyncStorage.removeItem(KEY);await running?.catch(()=>{});await AsyncStorage.removeItem(KEY);lastView=null;if(await Location.hasStartedLocationUpdatesAsync(TASK))await Location.stopLocationUpdatesAsync(TASK);}
export async function stopBackgroundAutoCatchV2(uid?:string){if(Platform.OS==='android')await controls(()=>stopService(uid));}
export async function finishBackgroundAutoCatchV2(uid:string):Promise<GameViewV2|null>{
 if(Platform.OS!=='android')return null;await running?.catch(()=>{});const mine=generation,session=await readSession();
 // A response can be lost precisely when Android returns to the foreground. Resolve
 // that exact receipt before a new foreground command chooses its player revision.
 if(session?.uid===uid&&session.pending){const view=await withBackgroundSessionV2(uid,api=>backgroundAutoTickV2(session,[],{...api,current:()=>mine===generation,now:Date.now,newId,save:async next=>{if(mine===generation)await AsyncStorage.setItem(KEY,JSON.stringify(next));}}));if(view&&mine===generation)lastView=view;}
 const view=lastView;lastView=null;return view?.player.uid===uid?view:null;
}

async function receiveLocations(locations:AutoLocationV2[]){
 if(Platform.OS!=='android'||!autoLocationOwnerV2(AppState.currentState==='active',foregroundFieldActive)||running||Date.now()-lastTickAt<10000)return;lastTickAt=Date.now();
 const mine=generation;
 const work=(async()=>{
  const session=await readSession();if(!session||mine!==generation)return;
  // An uncertain foreground action is resolved by the game before any background mutation.
  const foreground=await AsyncStorage.getItem('bugbaas-v2-pending');if(foreground){try{if(JSON.parse(foreground).uid===session.uid)return;}catch{return;}}
  const current=()=>mine===generation&&autoLocationOwnerV2(AppState.currentState==='active',foregroundFieldActive);
  try{
   const view=await withBackgroundSessionV2(session.uid,api=>backgroundAutoTickV2(session,locations,{...api,current,now:Date.now,newId,save:async next=>{if(current())await AsyncStorage.setItem(KEY,JSON.stringify(next));}}));
   if(view&&mine===generation){lastView=view;if(!view.player.go?.auto.enabled)void stopBackgroundAutoCatchV2(session.uid);}
  }catch(error){if((error as {status?:number})?.status===401)void stopBackgroundAutoCatchV2(session.uid);/* Network failures retain the same pending receipt for the next GPS event. */}
 })();running=work;try{await work;}finally{if(running===work)running=null;}
}
if(Platform.OS==='android'&&!TaskManager.isTaskDefined(TASK))TaskManager.defineTask<{locations:Location.LocationObject[]}>(TASK,async({data,error})=>{if(!error&&data?.locations)await receiveLocations(data.locations);});

export async function prepareBackgroundAutoCatchV2():Promise<string>{
 if(Platform.OS!=='android')return '';
 if(AppState.currentState!=='active')return 'Open BugBaas om autovangst aan te zetten.';
 try{
  const permission=await Location.requestForegroundPermissionsAsync();if(!permission.granted)return 'Geef BugBaas toegang tot je locatie voor autovangst.';if(permission.android?.accuracy==='coarse')return 'Zet Precieze locatie aan voor autovangst en afstand.';
  if(!(await Location.getBackgroundPermissionsAsync()).granted){
   const proceed=await new Promise<boolean>(resolve=>Alert.alert('Locatie bij scherm uit','BugBaas gebruikt je locatie voor afstand en autovangst wanneer de app niet zichtbaar is. Kies in het volgende scherm Altijd toestaan. Je ziet een blijvende melding zolang dit actief is.',[{text:'Niet nu',style:'cancel',onPress:()=>resolve(false)},{text:'Toestemming geven',onPress:()=>resolve(true)}],{cancelable:true,onDismiss:()=>resolve(false)}));
   if(!proceed||!(await Location.requestBackgroundPermissionsAsync()).granted)return 'Kies Altijd toestaan bij de locatietoestemming voor afstand en autovangst met scherm uit.';
  }
  if(!await Location.hasServicesEnabledAsync())return 'Zet je locatie aan voor autovangst.';
  if(Number(Platform.Version)>=33&&await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)!==PermissionsAndroid.RESULTS.GRANTED)return 'Sta meldingen toe: autovangst blijft zichtbaar terwijl de app op de achtergrond werkt.';
  return '';
 }catch{return 'Autovangst kon niet starten. Controleer locatie en meldingen.';}
}
async function startService(uid:string){
 if(AppState.currentState!=='active')return;
 const permission=await Location.getForegroundPermissionsAsync();if(!permission.granted)throw new Error('Geef toegang tot je locatie om autovangst te hervatten.');if(permission.android?.accuracy==='coarse')throw new Error('Zet Precieze locatie aan voor autovangst en afstand.');
 if(!(await Location.getBackgroundPermissionsAsync()).granted)throw new Error('Autovangst heeft Altijd toestaan voor locatie nodig. Zet autovangst opnieuw aan om dit te regelen.');
 if(Number(Platform.Version)>=33&&!await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS))throw new Error('Sta meldingen toe om autovangst op de achtergrond te gebruiken.');
 if(!await Location.hasServicesEnabledAsync())throw new Error('Zet je locatie aan om autovangst te hervatten.');
 const prior=await readSession();if(prior&&prior.uid!==uid)await stopService();
 await AsyncStorage.setItem(KEY,JSON.stringify(prior?.uid===uid?prior:{uid}));
 // Re-register on foreground entry, so a previously removed Android service can resume.
 // This runs on lifecycle/toggle changes, never on ordinary game-state renders.
 if(AppState.currentState==='active')await Location.startLocationUpdatesAsync(TASK,{accuracy:Location.Accuracy.High,timeInterval:15000,distanceInterval:12,deferredUpdatesInterval:0,foregroundService:{notificationTitle:'BugBaas · autovangst aan',notificationBody:'Telt afstand, vangt bugs en bezoekt posten terwijl je beweegt.',notificationColor:'#165540',killServiceOnDestroy:false}});
}
export function useBackgroundAutoCatchV2(view:GameViewV2|null,onError:(message:string)=>void,suspended=false,fieldActive=true){
 // Switching tabs changes the GPS owner without stopping/restarting the service.
 // Closing the game UI leaves the opted-in service alive; disable and account changes stop it explicitly.
 foregroundFieldActive=fieldActive;
 const report=useRef(onError);report.current=onError;const uid=view?.player.uid,enabled=!!view?.player.go?.auto.enabled,cloud=view?.mode==='cloud';
 useEffect(()=>{if(Platform.OS!=='android'||!uid)return;if(suspended){void stopBackgroundAutoCatchV2(uid).catch(()=>{});return;}let alive=true;const sync=()=>{if(!enabled||!cloud){void stopBackgroundAutoCatchV2().catch(()=>{});return;}if(AppState.currentState==='active')void controls(()=>startService(uid)).catch(error=>{if(alive)report.current(error instanceof Error?error.message:'Autovangst kon niet hervatten.');});};sync();const listener=AppState.addEventListener('change',state=>{if(state==='active')sync();});return()=>{alive=false;listener.remove();};},[uid,enabled,cloud,suspended]);
}
