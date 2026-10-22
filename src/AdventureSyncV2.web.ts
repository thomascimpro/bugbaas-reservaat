export type {AdventureSyncSnapshot,AdventureSyncResult} from './AdventureSyncV2';
export async function readAdventureSync(){return {available:false as const,reason:'unsupported' as const};}
export async function requestAdventureSyncPermission(){return false;}
