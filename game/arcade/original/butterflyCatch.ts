import {CatmullRomCurve3,Euler,PerspectiveCamera,Quaternion,Vector3} from 'three';
import type {ArcadeTicket} from '../tapDuel';
import {originalSquadPower,type OriginalPort,type OriginalState,type OriginalInput} from './types';

// Working WEB original: public/butterfly-catch-3d/prototype.js.
// The experimental butterflyCatchGameModel.ts is intentionally not the source.
// Extracted: createFlightCurve 793–812, updateButterflies/updateAimState 1002–1171,
// swing/attemptCatch 1411–1593, camera/pointer 1711–1724/1793–1842.
export const originalFlyingBugSpecs=[
 {kind:'butterfly',name:'Koninginnenpage',base:'#f6b93b',speed:.038,scale:.35,points:2,sprite:'butterfly'},
 {kind:'dragonfly',name:'Smaragdlibel',base:'#43bfa8',speed:.066,scale:.3,points:3,sprite:'dragonfly'},
 {kind:'bee',name:'Aardhommel',base:'#e4ae38',speed:.028,scale:.31,points:1,sprite:'bee'},
 {kind:'moth',name:'Atlasmot',base:'#bc714c',speed:.022,scale:.4,points:1,sprite:'atlasmoth'},
 {kind:'beetle',name:'Gouden tor',base:'#3aa36d',speed:.045,scale:.3,points:2,sprite:'scarab'},
 {kind:'butterfly',name:'Blauwe morpho',base:'#1f8de4',speed:.061,scale:.36,points:3,sprite:'morpho'},
 {kind:'dragonfly',name:'Keizerlibel',base:'#55aee2',speed:.068,scale:.33,points:3,sprite:'emperor'},
 {kind:'bee',name:'Honingbij',base:'#d4932c',speed:.03,scale:.28,points:1,sprite:'bee'},
 {kind:'moth',name:'Maanmot',base:'#a5d398',speed:.024,scale:.42,points:1,sprite:'luna'},
 {kind:'beetle',name:'Juweelkever',base:'#3a9e9a',speed:.047,scale:.29,points:2,sprite:'jewelbeetle'},
 {kind:'butterfly',name:'Atalanta',base:'#d95f32',speed:.041,scale:.34,points:2,sprite:'butterfly_elite'},
 {kind:'dragonfly',name:'Bandheidelibel',base:'#d44a35',speed:.065,scale:.31,points:3,sprite:'damselfly'},
] as const;
type Point=[number,number,number];
export type OriginalFlyingBug={index:number;points:Point[];speed:number;phase:number;flapOffset:number;bankOffset:number;dodgeSide:number;dodgeUntil:number;caughtUntil:number;captureAt:number};
export type OriginalButterflyCatchState=OriginalState&{game:'butterfly_catch';bugs:OriginalFlyingBug[];rng:number;yaw:number;pitch:number;cameraQ:[number,number,number,number];aimedBug:number|null;aimedQuality:number;focusProgress:number;holdActive:boolean;holdStartedAt:number;lockedFocusBug:number|null;captureCooldownUntil:number;swinging:boolean;swingStartedAt:number;swingTarget:number|null;swingFocusQuality:number;catchAttempted:boolean;catches:number;misses:number;streak:number;bestStreak:number;message:string;lastPoints:number;lastCatchAt:number;pointer:{x:number;y:number;startX:number;startY:number;moved:boolean}|null;zoneMultiplier:number};
const clamp=(n:number,a=0,b=1)=>Math.max(a,Math.min(b,n));
function smoothstep(n:number){const c=clamp(n);return c*c*(3-2*c);}
function random(s:{rng:number}){let value=s.rng+=0x6D2B79F5;value=Math.imul(value^value>>>15,value|1);value^=value+Math.imul(value^value>>>7,value|61);return((value^value>>>14)>>>0)/4294967296;}
function flightPoints(index:number,s:{rng:number}):Point[]{
 const range=(a:number,b:number)=>a+(b-a)*random(s),points:Point[]=[],pointCount=12;
 const nearRadius=.82+index%4*.18,farRadius=6.2+index%6*.8,angularOffset=index/12*Math.PI*2+range(-.4,.4);
 for(let pointIndex=0;pointIndex<pointCount;pointIndex++){
  const angle=angularOffset+pointIndex/pointCount*Math.PI*2,approachWave=(Math.sin(pointIndex/pointCount*Math.PI*2+index*.73)+1)*.5;
  const radius=(nearRadius+(farRadius-nearRadius)*smoothstep(approachWave))*range(.9,1.1);
  points.push([Math.cos(angle)*radius,range(1.05,2.65)+approachWave*range(.3,1.5)+Math.sin(angle*2+index)*.28,Math.sin(angle)*radius]);
 }return points;
}
const curveCache=new WeakMap<Point[],CatmullRomCurve3>();
function curve(b:OriginalFlyingBug){let c=curveCache.get(b.points);if(!c){c=new CatmullRomCurve3(b.points.map(p=>new Vector3(...p)),true,'catmullrom',.55);curveCache.set(b.points,c);}return c;}
export function originalButterflyWorldPosition(s:OriginalButterflyCatchState,b:OriginalFlyingBug){
 const elapsed=s.elapsedMs/1000,spec=originalFlyingBugSpecs[b.index],progress=(elapsed*b.speed+b.phase)%1;
 const p=curve(b).getPointAt(progress);
 if(spec.kind==='bee'){p.x+=Math.sin(elapsed*3.8+b.flapOffset)*.12;p.y+=Math.sin(elapsed*5.1+b.bankOffset)*.09;}
 else if(spec.kind==='dragonfly')p.y+=Math.sin(elapsed*2.3+b.bankOffset)*.055;
 else if(spec.kind==='moth')p.y+=Math.sin(elapsed*1.25+b.flapOffset)*.16;
 else if(spec.kind==='beetle')p.y+=Math.sin(elapsed*2.6+b.bankOffset)*.075;
 if(s.elapsedMs<b.dodgeUntil){const dodgeProgress=1-(b.dodgeUntil-s.elapsedMs)/780,dodgeArc=Math.sin(clamp(dodgeProgress)*Math.PI);p.x+=b.dodgeSide*dodgeArc*1.15;p.y+=dodgeArc*.58;}
 return p;
}
export function originalButterflyCamera(s:OriginalButterflyCatchState){const c=new PerspectiveCamera(62,360/640,.08,90);c.position.set(0,1.78,0);c.rotation.order='YXZ';c.quaternion.fromArray(s.cameraQ);c.updateMatrixWorld();return c;}
export function originalButterflyProjection(s:OriginalButterflyCatchState,b:OriginalFlyingBug){
 const camera=originalButterflyCamera(s),p=originalButterflyWorldPosition(s,b),distance=camera.position.distanceTo(p),projected=p.clone().project(camera);
 return{x:projected.x,y:projected.y,z:projected.z,distance,visible:projected.z>=-1&&projected.z<=1&&b.caughtUntil<=s.elapsedMs,screenDistance:Math.hypot(projected.x*180,projected.y*320)};
}
function updateAimState(s:OriginalButterflyCatchState,nextBug:number|null,quality:number,delta:number){
 if(s.holdActive&&s.lockedFocusBug===null&&nextBug!==null)s.lockedFocusBug=nextBug;
 if(s.aimedBug!==nextBug){s.focusProgress*=.28;s.aimedBug=nextBug;}
 s.aimedQuality=quality;
 if(s.aimedBug!==null&&quality>=.28)s.focusProgress=Math.min(1,s.focusProgress+delta/1.5);
 else s.focusProgress=Math.max(0,s.focusProgress-delta*.65);
}
function updateButterflies(s:OriginalButterflyCatchState,delta:number){
 let nextBug:number|null=null,nextQuality=0;
 for(const b of s.bugs){
  if(b.caughtUntil>0&&s.elapsedMs>=b.caughtUntil){b.caughtUntil=0;b.captureAt=-1;b.phase=random(s);}
  if(b.caughtUntil>s.elapsedMs||s.swinging||s.elapsedMs<s.captureCooldownUntil)continue;
  if(s.holdActive&&s.lockedFocusBug!==null&&s.lockedFocusBug!==b.index)continue;
  const p=originalButterflyProjection(s,b);if(!p.visible)continue;
  const radius=360*.23*s.zoneMultiplier*(s.holdActive&&s.lockedFocusBug===b.index?1.25:1);
  if(p.screenDistance>radius)continue;
  const quality=1-smoothstep(p.screenDistance/radius);if(quality<=nextQuality)continue;nextBug=b.index;nextQuality=quality;
 }updateAimState(s,nextBug,nextQuality,delta);
}
function registerMiss(s:OriginalButterflyCatchState,target:number|null,message:string){s.misses++;s.streak=0;s.message=message;if(target!==null){const b=s.bugs[target];b.dodgeSide*=-1;b.dodgeUntil=s.elapsedMs+780;}}
function swingNet(s:OriginalButterflyCatchState,target:number|null,quality:number){
 if(s.finished||s.swinging||s.elapsedMs<s.captureCooldownUntil)return false;
 s.swinging=true;s.swingStartedAt=s.elapsedMs;s.catchAttempted=false;s.swingTarget=target;s.swingFocusQuality=quality;s.captureCooldownUntil=s.elapsedMs+980;
 s.message=quality>=.98?'Netslag!':'Te vroeg · vul de vangmeter eerst tot 100%';return true;
}
function attemptCatch(s:OriginalButterflyCatchState){
 s.catchAttempted=true;const index=s.swingTarget,b=index===null?null:s.bugs[index];
 if(!b||b.caughtUntil>s.elapsedMs||s.swingFocusQuality<.98){registerMiss(s,index,s.swingFocusQuality<.98?'Nog geen 100% · houd de bug langer in de vangzone':'Het insect ontweek het net');return;}
 const p=originalButterflyProjection(s,b);
 if(p.screenDistance>360*.23*1.18*s.zoneMultiplier){registerMiss(s,index,'Net ernaast · blijf het insect volgen');return;}
 b.captureAt=s.elapsedMs;b.caughtUntil=s.elapsedMs+620+2100;s.catches++;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak);
 const spec=originalFlyingBugSpecs[b.index],perfect=s.swingFocusQuality>=.98;
 const timingMultiplier=perfect?1.5:.78+s.swingFocusQuality*.46;
 const points=Math.round(spec.points*timingMultiplier)+Math.min(125,Math.max(0,s.streak-1)*25);
 s.score+=points;s.lastPoints=points;s.lastCatchAt=s.elapsedMs;s.message=`PERFECT · ${spec.name} +${points} · combo x${s.streak}`;
}
function input(s:OriginalButterflyCatchState,_ticket:ArcadeTicket,i:OriginalInput){
 if(s.finished)return false;
 const action=i.action??'down';
 if(i.control==='look'||i.control==='orientation'){s.yaw=(i.x/1000-.5)*Math.PI*2;s.pitch=(i.y/1000-.5)*2.64;return true;}
 if(i.control==='catch')return action==='down'?swingNet(s,s.aimedBug,s.focusProgress):false;
 if(i.control==='hold'){
  if(action==='down'){if(s.swinging||s.elapsedMs<s.captureCooldownUntil)return false;s.holdActive=true;s.holdStartedAt=s.elapsedMs;s.lockedFocusBug=s.aimedBug;return true;}
  if(action==='up'&&s.holdActive){s.holdActive=false;const held=s.elapsedMs-s.holdStartedAt,target=s.lockedFocusBug??s.aimedBug,quality=s.focusProgress;s.lockedFocusBug=null;s.focusProgress=0;return swingNet(s,held<120?null:target,held<120?0:quality);}return false;
 }
 if(action==='down'){s.pointer={x:i.x,y:i.y,startX:i.x,startY:i.y,moved:false};return true;}
 const pointer=s.pointer;if(!pointer)return false;
 if(action==='move'){
  const dx=(i.x-pointer.x)*.36,dy=(i.y-pointer.y)*.64;
  if(Math.hypot((i.x-pointer.startX)*.36,(i.y-pointer.startY)*.64)>7)pointer.moved=true;
  pointer.x=i.x;pointer.y=i.y;s.yaw-=dx*.0048;s.pitch=clamp(s.pitch-dy*.0042,-1.32,1.32);return true;
 }
 if(action==='up'){s.pointer=null;return pointer.moved?true:swingNet(s,s.aimedBug,s.focusProgress);}return false;
}
export const originalButterflyCatch:OriginalPort<OriginalButterflyCatchState>={
 game:'butterfly_catch',name:'Vlinderjacht',controls:['look','catch','hold','orientation'],durationMs:60_000,help:'Kijk 360° rond door te slepen of je telefoon te draaien. Volg een insect 1,5 seconde in de vangzone tot 100%, tik dan voor een netslag.',
 create(ticket){
  const seed={rng:ticket.seed},bugs=originalFlyingBugSpecs.map((spec,index)=>({index,points:flightPoints(index,seed),speed:spec.speed*(.9+random(seed)*.2),phase:(index/12+random(seed)*.12)%1,flapOffset:random(seed)*Math.PI*2,bankOffset:random(seed)*Math.PI*2,dodgeSide:index%2===0?1:-1,dodgeUntil:0,caughtUntil:0,captureAt:-1}));
  const power=originalSquadPower(ticket.squad,ticket.league);
  return{game:'butterfly_catch',elapsedMs:0,score:0,finished:false,reason:null,hearts:3,bugs,rng:seed.rng,yaw:0,pitch:0,cameraQ:[0,0,0,1],aimedBug:null,aimedQuality:0,focusProgress:0,holdActive:false,holdStartedAt:0,lockedFocusBug:null,captureCooldownUntil:0,swinging:false,swingStartedAt:0,swingTarget:null,swingFocusQuality:0,catchAttempted:false,catches:0,misses:0,streak:0,bestStreak:0,message:'Sleep om te kijken · volg tot 100% · tik om te vangen',lastPoints:0,lastCatchAt:-1000,pointer:null,zoneMultiplier:1+.14*(power.defense+power.hp)/2};
 },
 step(s,_ticket,dt){
  if(s.finished)return;s.elapsedMs=Math.min(60_000,s.elapsedMs+dt);if(s.elapsedMs>=60_000){s.finished=true;s.reason='time';return;}
  const delta=dt/1000,target=new Quaternion().setFromEuler(new Euler(s.pitch,s.yaw,0,'YXZ'));
  const q=new Quaternion().fromArray(s.cameraQ).slerp(target,1-Math.exp(-delta*10.5));s.cameraQ=q.toArray() as [number,number,number,number];
  updateButterflies(s,delta);
  if(s.swinging){const progress=clamp((s.elapsedMs-s.swingStartedAt)/880);if(progress>=.48&&!s.catchAttempted)attemptCatch(s);if(progress>=1){s.swinging=false;s.swingTarget=null;}}
 },input,
};
