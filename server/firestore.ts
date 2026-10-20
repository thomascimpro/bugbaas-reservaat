import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { Player } from '../game/types';
import type { Documents, Store } from './store';
import { decodeFirestorePayload, encodeFirestorePayload } from './firestoreCodec';

export function cloudApp() {
  const id = process.env.FIREBASE_PROJECT_ID;
  if (!id || id === 'thomascimpro-6266f') throw new Error('Configureer uitsluitend het nieuwe Firebase-project.');
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccount = json ? JSON.parse(json) : null;
  if (serviceAccount && serviceAccount.project_id !== id) throw new Error('De serversleutel hoort niet bij dit nieuwe project.');
  return getApps().find(a => a.name === 'reservaat') ?? initializeApp({ projectId: id, credential: serviceAccount ? cert(serviceAccount) : applicationDefault() }, 'reservaat');
}
export async function cloudUid(token: string) { const decoded = await getAuth(cloudApp()).verifyIdToken(token, true); return decoded.uid; }
export async function cloudIdentity(token: string) { const decoded = await getAuth(cloudApp()).verifyIdToken(token,true);return {uid:decoded.uid,linked:decoded.firebase.sign_in_provider!=='anonymous'}; }
export class FirestoreStore implements Store {
  private db = getFirestore(cloudApp());
  async run<T>(keys: string[], callback: (docs: Documents) => T): Promise<T> {
    return this.db.runTransaction(async tx => {
      const unique = [...new Set(keys)]; const refs = unique.map(k => k.startsWith('v2') ? this.db.collection(k.split(':')[0]).doc(encodeURIComponent(k.slice(k.indexOf(':')+1))) : this.db.collection('gameRecords').doc(encodeURIComponent(k)));
      const snapshots = await tx.getAll(...refs); const docs: Documents = new Map();
      snapshots.forEach((snap, i) => docs.set(unique[i], snap.exists ? decodeFirestorePayload(snap.data()!.payload) : undefined));
      const original = new Map([...docs].map(([key, value]) => [key, JSON.stringify(value)]));
      const result = callback(docs);
      for (let i = 0; i < unique.length; i++) {
        const value = docs.get(unique[i]); if (value !== undefined && JSON.stringify(value) !== original.get(unique[i])) tx.set(refs[i], { kind: unique[i].split(':')[0], payload: encodeFirestorePayload(value) });
      }
      return result;
    });
  }
  async listPlayers(): Promise<Player[]> {
    const snapshot = await this.db.collection('gameRecords').where('kind', '==', 'player').orderBy('payload.arena.rating', 'desc').limit(50).get();
    return snapshot.docs.map(d => decodeFirestorePayload<Player>(d.data().payload));
  }
  async query<T>(kind:string,filters:{field:string;op:'=='|'<='|'>='|'array-contains';value:unknown}[]=[],order?:{field:string;descending?:boolean},limit=50):Promise<T[]>{
    if(!/^v2[A-Za-z]+$/.test(kind))throw new Error('Ongeldige collectie.');
    let q:FirebaseFirestore.Query=this.db.collection(kind);
    for(const f of filters)q=q.where('payload.'+f.field,f.op,f.value);
    if(order)q=q.orderBy('payload.'+order.field,order.descending?'desc':'asc');
    return (await q.limit(Math.min(100,limit)).get()).docs.map(d=>decodeFirestorePayload<T>(d.data().payload));
  }
}
