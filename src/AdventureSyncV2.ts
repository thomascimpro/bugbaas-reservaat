import {NativeModules,Platform} from 'react-native';

export type AdventureSyncSnapshot=import('../game/adventureSyncV2').HealthSnapshot;
export type AdventureSyncResult={available:boolean;reason?:'unsupported'|'unavailable'|'permission'|'error';snapshot?:AdventureSyncSnapshot;snapshots?:AdventureSyncSnapshot[]};
type AdventureNative={readSnapshot:()=>Promise<AdventureSyncResult>;readSnapshots?:(since:number)=>Promise<AdventureSyncResult>;backgroundReadStatus?:()=>Promise<{supported:boolean;granted:boolean}>;requestPermissions:()=>Promise<boolean>};
const native=():AdventureNative|undefined=>Platform.OS==='android'?NativeModules.BugBaasAdventureSync:undefined;
export {adventureSyncStorageKey,adventureSyncPayload} from './adventureSyncPayloadV2';
export async function adventureBackgroundStatus(){try{return await native()?.backgroundReadStatus?.()??{supported:false,granted:false};}catch{return {supported:false,granted:false};}}
export async function readAdventureSync(since=0):Promise<AdventureSyncResult>{
 const bridge=native();if(!bridge)return {available:false,reason:'unsupported'};
 try{return bridge.readSnapshots?await bridge.readSnapshots(since):await bridge.readSnapshot();}catch{return {available:false,reason:'error'};}
}
/** Resolves only after the Android permission screen returns, including cancellation. */
export async function requestAdventureSyncPermission():Promise<boolean>{
 const bridge=native();if(!bridge)return false;
 try{return await bridge.requestPermissions();}catch{return false;}
}
