export const normalizeTrainerName=(name:string)=>name.normalize('NFC').trim();
export function validTrainerName(value:unknown):value is string{return typeof value==='string'&&/^[\p{L}\p{N} _-]{2,18}$/u.test(normalizeTrainerName(value));}
/** A public nickname is separate from private login details and the friend code. */
export function trainerDisplayName(player:{name:string;uid:string;friendCode:string}){const name=normalizeTrainerName(player.name);return !validTrainerName(name)||name===player.uid||name.toUpperCase()===player.friendCode.toUpperCase()?'Trainer':name;}
