import type {MapCameraV2} from './mapCameraV2';

const fieldCommands=new Set(['postResearch','goBoss','gymTeam','gymDefend','gymAttack','coinBuy','worldLocate','worldEncounter','worldFocus','worldCast','fieldSupply','fieldTask','fieldLure','goAuto','poiSpin','routeStart','routePause','routeResume','routeFinish','routeCancel']);
const destinations=new Set(['gyms','coinShop','map','team','ranked','bugdex','profile','buddy','friends','cocoons','settings','account']);
export type NativeFieldRequest={kind:'ready'}|{kind:'command';id:string;command:string;params:Record<string,unknown>}|{kind:'navigate';name:string;specimenId?:string;camera?:MapCameraV2}|{kind:'geo';action:'get'|'watch'|'clear';id:number}|{kind:'backResult';handled:boolean};
export function parseNativeFieldRequest(raw:string):NativeFieldRequest|null{
 if(raw.length>16384)return null;try{const m=JSON.parse(raw);if(!m||typeof m!=='object'||Array.isArray(m))return null;
  if(m.kind==='ready'&&Object.keys(m).length===1)return m;
  if(m.kind==='command'&&Object.keys(m).every(k=>['kind','id','command','params'].includes(k))&&typeof m.id==='string'&&/^[\w-]{1,80}$/.test(m.id)&&fieldCommands.has(m.command)&&m.params&&typeof m.params==='object'&&!Array.isArray(m.params)&&!['type','commandId','expectedRevision'].some(k=>Object.hasOwn(m.params,k)))return m;
  if(m.kind==='navigate'&&Object.keys(m).every(k=>['kind','name','camera','specimenId'].includes(k))&&destinations.has(m.name)){
   if(Object.hasOwn(m,'specimenId')&&(m.name!=='team'||typeof m.specimenId!=='string'||!/^[\w-]{1,160}$/.test(m.specimenId)))return null;
   if(m.camera){const c=m.camera;if(!Array.isArray(c.center)||c.center.length!==2||!c.center.every(Number.isFinite)||Math.abs(c.center[0])>180||Math.abs(c.center[1])>85||![c.zoom,c.pitch,c.bearing].every(Number.isFinite)||c.zoom<16.5||c.zoom>20||c.pitch<0||c.pitch>85||Math.abs(c.bearing)>360)return null;}return m;
  }
  if(m.kind==='geo'&&Object.keys(m).every(k=>['kind','action','id'].includes(k))&&['get','watch','clear'].includes(m.action)&&Number.isSafeInteger(m.id)&&m.id>0&&m.id<1e9)return m;
  if(m.kind==='backResult'&&Object.keys(m).length===2&&typeof m.handled==='boolean')return m;
 }catch{}return null;
}
export function nativeFieldURL(base:string,development=false){const u=new URL(base);if(u.protocol!=='https:'&&!(development&&u.protocol==='http:'&&['10.0.2.2','127.0.0.1','localhost'].includes(u.hostname)))throw new Error('Een beveiligde spelserver is vereist.');return new URL('/?nativeField=1',u).href;}

// The frame receives display state and RPC replies, never the native account token.
export const NATIVE_GPS_SHIM=String.raw`(function(){
 if(window.__bugbaasNativeGPS)return;let next=1,active=true,last=-1;const callbacks=new Map(),permission=new EventTarget();permission.state='prompt';
 const post=m=>window.ReactNativeWebView.postMessage(JSON.stringify(m));
 const geo=(action,ok,fail,opts)=>{const id=next++,entry={ok,fail,watch:action==='watch'};callbacks.set(id,entry);if(!entry.watch)entry.timer=setTimeout(()=>{if(callbacks.delete(id))fail&&fail({code:3,message:'GPS timeout'});},Math.min(20000,opts&&opts.timeout||15000));post({kind:'geo',action,id});return id;};
 Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(ok,fail,opts)=>{geo('get',ok,fail,opts);},watchPosition:(ok,fail,opts)=>geo('watch',ok,fail,opts),clearWatch:id=>{callbacks.delete(id);post({kind:'geo',action:'clear',id});}}});
 const original=navigator.permissions&&navigator.permissions.query.bind(navigator.permissions),query=opts=>opts.name==='geolocation'?Promise.resolve(permission):original?original(opts):Promise.reject(new Error('Unsupported permission'));
 if(navigator.permissions)navigator.permissions.query=query;else Object.defineProperty(navigator,'permissions',{value:{query}});
 Object.defineProperty(document,'hidden',{configurable:true,get:()=>!active});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>active?'visible':'hidden'});
 const receive=m=>{if(m.kind==='permission'){if(permission.state!==m.state){permission.state=m.state;permission.dispatchEvent(new Event('change'));}}else if(m.kind==='active'){active=m.active;document.dispatchEvent(new Event('visibilitychange'));}else if(m.kind==='position'||m.kind==='geoError'){const c=callbacks.get(m.id);if(c){if(!c.watch){callbacks.delete(m.id);clearTimeout(c.timer);}if(m.kind==='position')c.ok(m.position);else if(c.fail)c.fail({code:m.code,message:'GPS niet beschikbaar'});}}};
 window.__bugbaasNativeGPS={receive};
 const message=e=>{try{const m=JSON.parse(e.data);if(Number.isSafeInteger(m.seq)){if(m.seq===last)return;last=m.seq;}receive(m);}catch{}};window.addEventListener('message',message);document.addEventListener('message',message);
})();true;`;
