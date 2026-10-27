import type {GameViewV2} from '../game/typesV2';
export async function prepareBackgroundAutoCatchV2(){return '';}
export async function stopBackgroundAutoCatchV2(_uid?:string){}
export async function finishBackgroundAutoCatchV2(_uid:string):Promise<GameViewV2|null>{return null;}
export function useBackgroundAutoCatchV2(_view:GameViewV2|null,_onError:(message:string)=>void,_suspended=false,_fieldActive=true){}
