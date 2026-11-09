import type {AdventureSyncResult} from './AdventureSyncV2';
export const adventureSyncStorageKey=(uid:string)=>'bugbaas-adventure-sync:'+uid;
export const adventureSyncPayload=(result:AdventureSyncResult)=>result.snapshots?.length&&result.snapshot?{source:'health-connect' as const,capturedAt:result.snapshot.capturedAt,days:result.snapshots}:result.snapshot;
