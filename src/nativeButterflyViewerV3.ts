import {createOriginalButterflyWorld} from './arcade/original/ButterflyWorld';
import type {OriginalButterflyCatchState} from '../game/arcade/original/butterflyCatch';
const ticket=new URLSearchParams(location.search).get('ticket')??'',canvas=document.querySelector('canvas')!;
const host=window as typeof window&{ReactNativeWebView?:{postMessage:(s:string)=>void};__bugbaasButterfly?:{update:(m:{ticket:string;state:OriginalButterflyCatchState;reduced:boolean;active:boolean})=>void}};
let firstFrame=false,disposed=false;
let world:ReturnType<typeof createOriginalButterflyWorld>|undefined;
const report=(kind:string)=>host.ReactNativeWebView?.postMessage(JSON.stringify({kind,ticket,v:2}));
async function prepare(){try{world=createOriginalButterflyWorld(canvas);await world.prepare();if(disposed)return;host.__bugbaasButterfly={update(m){if(m.ticket!==ticket||!m.active||document.hidden)return;try{world?.draw(m.state,m.reduced);if(!firstFrame){firstFrame=true;requestAnimationFrame(()=>report('frame'));}}catch{report('error');}}};report('ready');}catch{if(!disposed)report('error');}}
void prepare();
canvas.addEventListener('webglcontextlost',()=>report('error'));
window.addEventListener('pagehide',()=>{disposed=true;world?.dispose();world=undefined;delete host.__bugbaasButterfly;},{once:true});
