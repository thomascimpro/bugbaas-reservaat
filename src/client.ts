import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, signInAnonymously, signInWithEmailAndPassword, linkWithCredential, EmailAuthProvider, signOut, sendPasswordResetEmail, sendEmailVerification, reload } from 'firebase/auth';
import type { Persistence } from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';
import type { Action, ArenaView, GameView, Match, SquadSlot } from '../game/types';
import type { CommandV2, GameViewV2 } from '../game/typesV2';
import {googleSignInAvailable,signInGoogle} from './GoogleSignInV2';
import {commandSerialV2} from './backgroundAutoSessionV2';
import {retryCatchCommandV2} from './catchCommandRetryV2';
export {googleSignInAvailable};

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
const serializeCommands=commandSerialV2();
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
async function token() { return mode === 'local' ? localToken : auth.currentUser?.getIdToken() ?? ''; }
async function ownBackgroundToken(uid:string){await auth.authStateReady();const user=auth.currentUser;if(!user||user.uid!==uid)throw new ApiError('Autovangst is gestopt omdat het account is gewijzigd.',401);let value:string;try{value=await user.getIdToken();}catch(error){if(['auth/user-token-expired','auth/invalid-user-token','auth/user-disabled','auth/user-not-found'].includes((error as {code?:string})?.code??''))throw new ApiError('Log opnieuw in om autovangst te hervatten.',401);throw error;}if(auth.currentUser?.uid!==uid)throw new ApiError('Autovangst is gestopt omdat het account is gewijzigd.',401);return value;}
async function request<T>(path: string, body?: unknown, anonymous = false,backgroundUid?:string,timeoutMs?:number): Promise<T> {
  const controller = new AbortController(); let timeout:ReturnType<typeof setTimeout>;
  const deadline=new Promise<never>((_,reject)=>{timeout=setTimeout(()=>{controller.abort();reject(new ApiError('Verbinding vertraagd. Probeer de opgeslagen actie opnieuw.',0));},timeoutMs??(backgroundUid||path==='v2/command'&&['worldLocate','worldEncounter','worldCast'].includes((body as {type:string})?.type)?8000:20000));});
  try {
    return await Promise.race([deadline,(async()=>{
    const response = await fetch(`${base}/api/game/${path}`, { method: body === undefined ? 'GET' : 'POST', signal: controller.signal,
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(anonymous ? {} : { Authorization: `Bearer ${backgroundUid?await ownBackgroundToken(backgroundUid):await token()}` }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json(); if (!response.ok) throw new ApiError(data.error ?? 'Deze actie is niet gelukt.', response.status); return data as T;
    })()]);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError('Verbinding onderbroken. Vernieuw om je opgeslagen voortgang te zien.', 0);
  } finally { clearTimeout(timeout!); }
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
export const accountUid=()=>auth.currentUser?.uid??null;
export const accountEmail = () => auth.currentUser?.email ?? null;
export const accountDetails = () => ({email:auth.currentUser?.email??null,guest:auth.currentUser?.isAnonymous??true,verified:auth.currentUser?.emailVerified??false,providers:auth.currentUser?.providerData.map(p=>p.providerId)??[]});
export async function googleLoginV2(link=true){if(mode!=='cloud')throw new ApiError('Open de online versie voor Google-inloggen.',400);await signInGoogle(auth,link);return refreshV2();}
export async function logoutV2(){if(mode!=='cloud'||!auth.currentUser||auth.currentUser.isAnonymous)throw new ApiError('Koppel eerst je gastvoortgang aan een e-mailadres.',400);await signOut(auth);await signInAnonymously(auth);return refreshV2();}
export async function resetAccountPassword(email:string){if(mode!=='cloud')throw new ApiError('Open de online versie voor je account.',400);await sendPasswordResetEmail(auth,email.trim());}
export async function verifyAccountEmail(){const user=auth.currentUser;if(!user?.email||user.isAnonymous)throw new ApiError('Koppel eerst je e-mailadres.',400);await sendEmailVerification(user);}
export async function refreshAccountV2(){if(auth.currentUser){await reload(auth.currentUser);await auth.currentUser.getIdToken(true);}return refreshV2();}
export async function accountLogin(email: string, password: string, link: boolean) {
  if (mode !== 'cloud') throw new ApiError('Accountkoppeling hoort bij de cloudversie. Deze sessie bewaart lokaal.', 400);
  if (link && auth.currentUser?.isAnonymous) await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email.trim(), password));
  else await signInWithEmailAndPassword(auth, email.trim(), password);
  return refreshGame();
}
let requiredClient:string|undefined;
/** Minimum app version announced by the server during the last connect, if any. */
export const serverMinClient=()=>requiredClient;
export async function connectV2(){
 const info=await request<{mode:'local'|'cloud';minClient?:string}>('info',undefined,true);mode=info.mode;requiredClient=info.minClient;
 if(mode==='local'){localToken=await AsyncStorage.getItem('bugbaas-reservaat-local-token')??'';if(!localToken){localToken=(await request<{token:string}>('session',{},true)).token;await AsyncStorage.setItem('bugbaas-reservaat-local-token',localToken);}try{return await refreshV2();}catch(e){if(!(e instanceof ApiError)||e.status!==401)throw e;localToken=(await request<{token:string}>('session',{},true)).token;await AsyncStorage.setItem('bugbaas-reservaat-local-token',localToken);return refreshV2();}}
 await auth.authStateReady();if(!auth.currentUser)await signInAnonymously(auth);return refreshV2();
}
export const refreshV2=()=>request<GameViewV2>('v2/state');
export const commandV2=(command:CommandV2)=>serializeCommands(()=>retryCatchCommandV2(command,(same,retry)=>request<GameViewV2>('v2/command',same,false,undefined,retry?6000:undefined)));
/** Headless GPS may reuse only this device's existing account, never create another guest. */
export function withBackgroundSessionV2<T>(uid:string,work:(api:{state:()=>Promise<GameViewV2>;command:(command:CommandV2)=>Promise<GameViewV2>})=>Promise<T>){
 return serializeCommands(async()=>{if(Platform.OS!=='android'||!base.startsWith('https://'))throw new ApiError('Achtergrondautovangst werkt in de online Android-app.',400);await ownBackgroundToken(uid);return work({state:()=>request<GameViewV2>('v2/state',undefined,false,uid),command:command=>{if(command.type!=='worldLocate')throw new ApiError('Alleen GPS-metingen zijn toegestaan voor achtergrondautovangst.',400);return request<GameViewV2>('v2/command',command,false,uid);}});});
}
export const loginV2=async(email:string,password:string,link:boolean)=>{if(mode!=='cloud')throw new ApiError('Accountkoppeling hoort bij de cloudversie.',400);if(link&&auth.currentUser?.isAnonymous)await linkWithCredential(auth.currentUser,EmailAuthProvider.credential(email.trim(),password));else await signInWithEmailAndPassword(auth,email.trim(),password);return refreshV2();};
