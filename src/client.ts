import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, signInAnonymously, signInWithEmailAndPassword, linkWithCredential, EmailAuthProvider } from 'firebase/auth';
import type { Persistence } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';
import type { Action, ArenaView, GameView, Match, SquadSlot } from '../game/types';
import type { CommandV2, GameViewV2 } from '../game/typesV2';

const app = getApps()[0] ?? initializeApp(firebaseConfig);
let auth: ReturnType<typeof getAuth>;
if (Platform.OS === 'web') auth = getAuth(app);
else {
  const { getReactNativePersistence } = require('firebase/auth') as { getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence };
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}
const base = Platform.OS === 'web' ? '' : process.env.EXPO_PUBLIC_GAME_API_URL ?? 'http://10.0.2.2:8086';
export const gameServerURL=base;
let localToken = ''; let mode: 'local' | 'cloud' = 'local';
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
async function token() { return mode === 'local' ? localToken : auth.currentUser?.getIdToken() ?? ''; }
async function request<T>(path: string, body?: unknown, anonymous = false): Promise<T> {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${base}/api/game/${path}`, { method: body === undefined ? 'GET' : 'POST', signal: controller.signal,
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(anonymous ? {} : { Authorization: `Bearer ${await token()}` }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json(); if (!response.ok) throw new ApiError(data.error ?? 'Deze actie is niet gelukt.', response.status); return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('Verbinding onderbroken. Vernieuw om je opgeslagen voortgang te zien.', 0);
  } finally { clearTimeout(timeout); }
}
export async function connectGame(): Promise<GameView> {
  const info = await request<{ mode: 'local' | 'cloud' }>('info', undefined, true); mode = info.mode;
  if (mode === 'local') {
    localToken = await AsyncStorage.getItem('bugbaas-reservaat-local-token') ?? '';
    if (!localToken) { localToken = (await request<{ token: string }>('session', {}, true)).token; await AsyncStorage.setItem('bugbaas-reservaat-local-token', localToken); }
    try { return await refreshGame(); } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401) throw e;
      localToken = (await request<{ token: string }>('session', {}, true)).token; await AsyncStorage.setItem('bugbaas-reservaat-local-token', localToken); return refreshGame();
    }
  }
  await auth.authStateReady(); if (!auth.currentUser) await signInAnonymously(auth); return refreshGame();
}
export const refreshGame = () => request<GameView>('state');
export const sendAction = (action: Action, revision: number) => request<GameView>('action', { action, revision });
export const refreshArena = () => request<ArenaView>('arena');
export const createArena = (squad: SquadSlot[], format: Match['format']) => request<ArenaView>('arena/create', { squad, format });
export const joinArena = (code: string, squad: SquadSlot[]) => request<ArenaView>('arena/join', { code: code.trim().toUpperCase(), squad });
export const actArena = (m: Match, actorId: string, move: 'attack' | 'special', targetId: string) => request<ArenaView>('arena/action', { code: m.code, revision: m.revision, actorId, move, targetId });
export const leaveArena = () => request<ArenaView>('arena/leave', {});
export const accountEmail = () => auth.currentUser?.email ?? null;
export async function accountLogin(email: string, password: string, link: boolean) {
  if (mode !== 'cloud') throw new ApiError('Accountkoppeling hoort bij de cloudversie. Deze sessie bewaart lokaal.', 400);
  if (link && auth.currentUser?.isAnonymous) await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email.trim(), password));
  else await signInWithEmailAndPassword(auth, email.trim(), password);
  return refreshGame();
}
export async function connectV2(){
 const info=await request<{mode:'local'|'cloud'}>('info',undefined,true);mode=info.mode;
 if(mode==='local'){localToken=await AsyncStorage.getItem('bugbaas-reservaat-local-token')??'';if(!localToken){localToken=(await request<{token:string}>('session',{},true)).token;await AsyncStorage.setItem('bugbaas-reservaat-local-token',localToken);}try{return await refreshV2();}catch(e){if(!(e instanceof ApiError)||e.status!==401)throw e;localToken=(await request<{token:string}>('session',{},true)).token;await AsyncStorage.setItem('bugbaas-reservaat-local-token',localToken);return refreshV2();}}
 await auth.authStateReady();if(!auth.currentUser)await signInAnonymously(auth);return refreshV2();
}
export const refreshV2=()=>request<GameViewV2>('v2/state');
export const commandV2=(command:CommandV2)=>request<GameViewV2>('v2/command',command);
export const loginV2=async(email:string,password:string,link:boolean)=>{if(mode!=='cloud')throw new ApiError('Accountkoppeling hoort bij de cloudversie.',400);if(link&&auth.currentUser?.isAnonymous)await linkWithCredential(auth.currentUser,EmailAuthProvider.credential(email.trim(),password));else await signInWithEmailAndPassword(auth,email.trim(),password);return refreshV2();};
