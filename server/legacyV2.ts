import {applicationDefault,cert,getApps,initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {createHash} from 'node:crypto';
import {LEGACY_CUTOFF,legacyReward,type LegacyReward} from '../game/legacyV2';
import {GameError} from '../game/types';

export type AccountIdentity={uid:string;linked:boolean;email?:string;emailVerified?:boolean;googleId?:string};
export type LegacyAccount={uid:string;email?:string;emailVerified:boolean;disabled:boolean;createdAt:number;googleId?:string;profile:Record<string,unknown>};
export type LegacyLookup=(identity:AccountIdentity)=>Promise<{configured:boolean;offer:LegacyReward|null}>;

/** Matching email alone never proves ownership of an unverified account. */
export function eligibleLegacy(identity:AccountIdentity,old:LegacyAccount):LegacyReward|null{
 if(!identity.linked||!identity.emailVerified||!old.emailVerified||old.disabled||old.profile.active===false||old.profile.testAccount===true||!Number.isFinite(old.createdAt)||old.createdAt>=LEGACY_CUTOFF)return null;
 if(!identity.email||identity.email.toLowerCase()!==old.email?.toLowerCase())return null;
 if(old.googleId&&identity.googleId!==old.googleId)return null;
 const key=createHash('sha256').update('bugbaas-legacy-1:'+old.uid).digest('hex');
 return legacyReward(key,old.createdAt,old.profile);
}

/** A separate old-project credential; these calls only READ auth and users/{uid}. */
export const readLegacy:LegacyLookup=async identity=>{
 const raw=process.env.FIREBASE_LEGACY_SERVICE_ACCOUNT_JSON;
 if(!raw&&process.env.FIREBASE_LEGACY_READ_ENABLED!=='1')return {configured:false,offer:null};
 if(!identity.linked||!identity.emailVerified||!identity.email)return {configured:true,offer:null};
 try{
  const credential=raw?JSON.parse(raw):null;if(credential&&credential.project_id!=='thomascimpro-6266f')throw new Error('wrong legacy project');
  const app=getApps().find(a=>a.name==='bugbaas-legacy-read')??initializeApp({projectId:'thomascimpro-6266f',credential:credential?cert(credential):applicationDefault()},'bugbaas-legacy-read');
  let old;try{old=await getAuth(app).getUserByEmail(identity.email);}catch(e){if((e as {code?:string}).code==='auth/user-not-found')return {configured:true,offer:null};throw e;}
  const snapshot=await getFirestore(app).collection('users').doc(old.uid).get();
  if(!snapshot.exists)return {configured:true,offer:null};
  return {configured:true,offer:eligibleLegacy(identity,{uid:old.uid,email:old.email,emailVerified:old.emailVerified,disabled:old.disabled,createdAt:Date.parse(old.metadata.creationTime),googleId:old.providerData.find(p=>p.providerId==='google.com')?.uid,profile:snapshot.data()!})};
 }catch{throw new GameError('Legacy-beloningen zijn tijdelijk niet bereikbaar. Je oude en nieuwe voortgang blijven bewaard.',503);}
};
