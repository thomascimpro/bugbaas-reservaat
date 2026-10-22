import {NativeModules,Platform} from 'react-native';

export type AdventureSyncSnapshot={dayUTC:string;capturedAt:number;steps:number;meters:number;source:'health-connect'};
export type AdventureSyncResult={available:boolean;reason?:'unsupported'|'unavailable'|'permission'|'error';snapshot?:AdventureSyncSnapshot};
type AdventureNative={readSnapshot:()=>Promise<AdventureSyncResult>;requestPermissions:()=>Promise<boolean>};
const native=():AdventureNative|undefined=>Platform.OS==='android'?NativeModules.BugBaasAdventureSync:undefined;
export async function readAdventureSync():Promise<AdventureSyncResult>{
 const bridge=native();if(!bridge)return {available:false,reason:'unsupported'};
 try{return await bridge.readSnapshot();}catch{return {available:false,reason:'error'};}
}
/** Resolves only after the Android permission screen returns, including cancellation. */
export async function requestAdventureSyncPermission():Promise<boolean>{
 const bridge=native();if(!bridge)return false;
 try{return await bridge.requestPermissions();}catch{return false;}
}
