/** A display-only reminder: never a credential and never authorizes an account. */
export type RememberedAccountV2={uid:string;name:string;email:string|null;progress:boolean};
export const ACCOUNT_MEMORY_KEY='bugbaas-v2-last-account';
export function readAccountMemoryV2(raw:string|null):RememberedAccountV2|null{
 try{const p=raw?JSON.parse(raw):null;return p&&typeof p.uid==='string'&&!!p.uid&&typeof p.name==='string'&&typeof p.progress==='boolean'&&(p.email===null||typeof p.email==='string')?p:null;}catch{return null;}
}
export const needsAccountRecoveryV2=(saved:RememberedAccountV2|null,uid:string|null)=>!!saved&&(saved.progress||!!saved.email)&&saved.uid!==uid;
export class AccountRecoveryErrorV2 extends Error{constructor(public account:RememberedAccountV2){super('Log opnieuw in om je opgeslagen avontuur te openen.');}}
