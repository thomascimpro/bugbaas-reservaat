import type {CommandV2,GameViewV2} from '../game/typesV2';
import type {Fix} from '../game/walkingV2';

export type AutoLocationV2={timestamp:number;coords:{latitude:number;longitude:number;accuracy:number|null}};
export type AutoSessionV2={uid:string;pending?:CommandV2};
export type AutoSessionIOV2={
 now:()=>number;newId:()=>string;current:()=>boolean;
 state:()=>Promise<GameViewV2>;command:(command:CommandV2)=>Promise<GameViewV2>;
 save:(session:AutoSessionV2)=>Promise<void>;
};
/** The native map owns foreground GPS; the service owns background and paused-map GPS. */
export const autoLocationOwnerV2=(appActive:boolean,fieldActive:boolean)=>!appActive||!fieldActive;

/** Both normal commands and background location commits use the same native JS queue. */
export function commandSerialV2(){let tail:Promise<unknown>=Promise.resolve();return <T>(work:()=>Promise<T>):Promise<T>=>{const result=tail.then(work,work);tail=result.then(()=>undefined,()=>undefined);return result;};}
export function freshAutoLocationV2(locations:AutoLocationV2[],now:number,after=0):Fix|null{
 const fix=locations.filter(l=>Number.isFinite(l.timestamp)&&l.timestamp>after&&now-l.timestamp<=15000&&l.timestamp-now<=5000&&Number.isFinite(l.coords.latitude)&&Math.abs(l.coords.latitude)<=85&&Number.isFinite(l.coords.longitude)&&Math.abs(l.coords.longitude)<=180&&typeof l.coords.accuracy==='number'&&Number.isFinite(l.coords.accuracy)&&l.coords.accuracy>0&&l.coords.accuracy<=80).sort((a,b)=>b.timestamp-a.timestamp)[0];
 return fix?{lat:fix.coords.latitude,lng:fix.coords.longitude,accuracy:fix.coords.accuracy!,timestamp:fix.timestamp}:null;
}
function knownRejection(error:unknown){const status=(error as {status?:number})?.status;return typeof status==='number'&&status>=400&&status<500&&status!==401;}

/** No rewards are calculated here. Resolve an uncertain receipt before making a new GPS commit. */
export async function backgroundAutoTickV2(session:AutoSessionV2,locations:AutoLocationV2[],io:AutoSessionIOV2):Promise<GameViewV2|null>{
 if(!io.current())return null;let view=await io.state();
 if(!io.current()||view.player.uid!==session.uid)return null;
 if(!view.player.go?.auto.enabled){delete session.pending;await io.save(session);return view;}
 if(session.pending){
  try{view=await io.command(session.pending);}catch(error){if(!knownRejection(error))throw error;view=await io.state();}
  delete session.pending;await io.save(session);
 }
 if(!io.current()||view.player.uid!==session.uid||!view.player.go?.auto.enabled||view.player.go.battle||view.player.go.queue)return view;
 const fix=freshAutoLocationV2(locations,io.now(),view.player.walking?.fix.timestamp??0);if(!fix)return view;
 const command:CommandV2={type:'worldLocate',fix,commandId:io.newId(),expectedRevision:view.player.revision};session.pending=command;await io.save(session);
 if(!io.current())return view;
 try{view=await io.command(command);}catch(error){if(!knownRejection(error))throw error;delete session.pending;await io.save(session);return view;}
 delete session.pending;await io.save(session);return view;
}
