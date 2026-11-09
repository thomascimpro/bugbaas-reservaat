export type {AdventureSyncSnapshot,AdventureSyncResult} from './AdventureSyncV2';
export {adventureSyncStorageKey,adventureSyncPayload} from './adventureSyncPayloadV2';
export async function adventureBackgroundStatus(){return {supported:false,granted:false};}
export async function readAdventureSync(_since=0){return {available:false as const,reason:'unsupported' as const};}
export async function requestAdventureSyncPermission(){return false;}
