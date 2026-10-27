import type {CommandV2} from '../game/typesV2';

/** A lost cast reply retries its receipt, never starts another catch attempt. */
export async function retryCatchCommandV2<T>(command:CommandV2,send:(sameCommand:CommandV2,retry:boolean)=>Promise<T>):Promise<T>{
 try{return await send(command,false);}catch(error){const status=(error as {status?:number})?.status;if(command.type!=='worldCast'||typeof status!=='number'||status!==0&&(status<500||status>=600))throw error;return send(command,true);}
}
