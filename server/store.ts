import type { Player } from '../game/types';
export type Documents = Map<string, unknown>;
export interface Store {
  run<T>(keys: string[], callback: (docs: Documents) => T): Promise<T>;
  listPlayers(): Promise<Player[]>;
  query?<T>(kind: string, filters?: { field: string; op: '==' | '<=' | '>=' | 'array-contains'; value: unknown }[], order?: { field: string; descending?: boolean }, limit?: number): Promise<T[]>;
}
export const playerKey = (uid: string) => `player:${uid}`;
export const matchKey = (code: string) => `match:${code}`;
export function document<T>(docs: Documents, key: string): T | undefined { return docs.get(key) as T | undefined; }
