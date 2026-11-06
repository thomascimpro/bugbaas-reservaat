import React,{useEffect,useRef,useState} from 'react';
import {Platform,Pressable,Text,View} from 'react-native';
import Svg,{Circle,Ellipse,Line} from 'react-native-svg';
import {Euler,Quaternion,Vector3} from 'three';
import {originalButterflyProjection,originalFlyingBugSpecs,type OriginalButterflyCatchState} from '../../../game/arcade/original/butterflyCatch';
import type {OriginalSceneProps} from '../../../game/arcade/original/types';
import {SpriteView} from '../../artV2';
import {font} from '../../uiV2';
import {createOriginalButterflyWorld} from './ButterflyWorld';
import {ButterflyBackdrop} from './ButterflyBackdrop';

export function OriginalButterflyCatchScene({state:s,ticket,scale:k,reducedMotion,onInput,onReady}:OriginalSceneProps<OriginalButterflyCatchState>){
 const canvas=useRef<HTMLCanvasElement|null>(null),world=useRef<ReturnType<typeof createOriginalButterflyWorld>|null>(null),current=useRef(s);current.current=s;
 const [webGL,setWebGL]=useState(Platform.OS==='web'),[sensor,setSensor]=useState(''),sensorCleanup=useRef<(()=>void)|null>(null),send=useRef(onInput);send.current=onInput;
 useEffect(()=>{
  if(Platform.OS!=='web'||!canvas.current)return;let frame=0,disposed=false;
  const ready=()=>{frame=requestAnimationFrame(()=>{if(!disposed)onReady?.();});};
  frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{if(disposed||!canvas.current)return;
   try{const next=createOriginalButterflyWorld(canvas.current);world.current=next;void next.prepare().then(()=>{if(disposed)return;next.draw(current.current,reducedMotion);ready();}).catch(()=>{if(!disposed){setWebGL(false);ready();}});}catch{setWebGL(false);ready();}
  });});return()=>{disposed=true;cancelAnimationFrame(frame);world.current?.dispose();world.current=null;};
 },[ticket.id]);
 useEffect(()=>{world.current?.draw(s,reducedMotion);});
 useEffect(()=>()=>sensorCleanup.current?.(),[]);
 useEffect(()=>{if(Platform.OS!=='web')return;const key=(e:KeyboardEvent)=>{if(e.code==='Space'&&!e.repeat){e.preventDefault();send.current({x:500,y:500,action:'down',control:'catch'});}else if(e.key.startsWith('Arrow')){e.preventDefault();const c=current.current,yaw=c.yaw+(e.key==='ArrowLeft'?.12:e.key==='ArrowRight'?-.12:0),pitch=c.pitch+(e.key==='ArrowUp'?.07:e.key==='ArrowDown'?-.07:0);send.current({x:Math.round((((yaw+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/(Math.PI*2)*1000),y:Math.round(Math.max(0,Math.min(1000,(pitch/2.64+.5)*1000))),action:'move',control:'look'});}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
 const startSensor=async()=>{
  if(Platform.OS!=='web'||!('DeviceOrientationEvent' in window)){setSensor('Geen sensor beschikbaar · sleep om te kijken');return;}
  try{const eventClass=DeviceOrientationEvent as typeof DeviceOrientationEvent&{requestPermission?:()=>Promise<string>};if(eventClass.requestPermission&&await eventClass.requestPermission()!=='granted'){setSensor('Sensor geweigerd · sleep om te kijken');return;}
   sensorCleanup.current?.();let calibration:Quaternion|null=null,last=0;
   const orientation=(e:DeviceOrientationEvent)=>{if(e.alpha===null||e.beta===null||e.gamma===null||performance.now()-last<80)return;last=performance.now();const rad=Math.PI/180,raw=new Quaternion().setFromEuler(new Euler(e.beta*rad,e.alpha*rad,-e.gamma*rad,'YXZ')).multiply(new Quaternion(-Math.sqrt(.5),0,0,Math.sqrt(.5))).multiply(new Quaternion().setFromAxisAngle(new Vector3(0,0,1),-(window.screen.orientation?.angle??0)*rad));
    if(!calibration)calibration=raw.clone().invert();const angle=new Euler().setFromQuaternion(calibration.clone().multiply(raw),'YXZ');send.current({x:Math.round((angle.y/(Math.PI*2)+.5)*1000),y:Math.round((Math.max(-1.32,Math.min(1.32,angle.x))/2.64+.5)*1000),action:'move',control:'orientation'});
   };window.addEventListener('deviceorientation',orientation,true);sensorCleanup.current=()=>window.removeEventListener('deviceorientation',orientation,true);setSensor('360° actief · tik om opnieuw te richten');
  }catch{setSensor('Sensor niet beschikbaar · sleep om te kijken');}
 };
 const input=(e:any,action:'down'|'move'|'up')=>{const x=e.nativeEvent.locationX,y=e.nativeEvent.locationY;onInput({x:Number.isFinite(x)?Math.round(Math.max(0,Math.min(1000,x/(360*k)*1000))):s.pointer?.x??500,y:Number.isFinite(y)?Math.round(Math.max(0,Math.min(1000,y/(640*k)*1000))):s.pointer?.y??500,action});};
 const ready=s.focusProgress>=.98&&s.aimedQuality>=.28,cooldown=s.swinging||s.elapsedMs<s.captureCooldownUntil;
 const swingProgress=Math.max(0,Math.min(1,(s.elapsedMs-s.swingStartedAt)/880)),swingWave=s.swinging&&!reducedMotion?Math.sin(swingProgress*Math.PI):0,netX=240-50*swingWave,netY=520-165*swingWave,catchAge=s.elapsedMs-s.lastCatchAt;
 const aim=s.aimedBug===null?null:originalButterflyProjection(s,s.bugs[s.aimedBug]);
 return <View testID="original-butterfly-catch" accessibilityLabel="Vlinderjacht: sleep om 360 graden te kijken, volg tot 100 procent en tik voor een netslag" style={{width:360*k,height:640*k,overflow:'hidden',backgroundColor:'#78967c'}}>
  {Platform.OS==='web'&&webGL&&React.createElement('canvas',{ref:canvas,style:{position:'absolute',width:'100%',height:'100%',left:0,top:0,pointerEvents:'none'},'aria-hidden':true})}
  {Platform.OS!=='web'&&<ButterflyBackdrop state={s} ticket={ticket.id} reduced={reducedMotion} onReady={()=>{setWebGL(true);onReady?.();}} onError={()=>{setWebGL(false);onReady?.();}}/>}
  {!webGL&&<View pointerEvents="none" style={{position:'absolute',left:0,top:0,width:'100%',height:'100%'}}>{s.bugs.map(b=>{const p=originalButterflyProjection(s,b),spec=originalFlyingBugSpecs[b.index];if(!p.visible)return null;const size=Math.max(24,Math.min(145,500*spec.scale/p.distance));return <View key={b.index} style={{position:'absolute',left:((p.x*.5+.5)*360-size/2)*k,top:((-p.y*.5+.5)*640-size/2)*k}}><SpriteView id={spec.sprite} size={size*k}/></View>;})}</View>}
  <View testID="original-butterfly-look" onStartShouldSetResponder={()=>true} onMoveShouldSetResponder={()=>true} onResponderTerminationRequest={()=>false} onResponderGrant={e=>input(e,'down')} onResponderMove={e=>input(e,'move')} onResponderRelease={e=>input(e,'up')} onResponderTerminate={e=>input(e,'up')} style={{position:'absolute',left:0,top:0,width:'100%',height:'100%',...(Platform.OS==='web'?{touchAction:'none',userSelect:'none'} as any:{})}}/>
  <Svg pointerEvents="none" width={360*k} height={640*k} style={{position:'absolute',left:0,top:0}}>
   <Circle cx={180*k} cy={320*k} r={360*.23*s.zoneMultiplier*k} fill={ready?'#b0ffdd12':'#18392d0a'} stroke={ready?'#abffd0':s.aimedQuality>=.28?'#fff0b1':'#ffffff99'} strokeWidth={ready?3:1.5} strokeDasharray={ready?undefined:'10 8'}/><Circle cx={180*k} cy={320*k} r={3*k} fill="#fff6d6"/>
   {aim&&aim.visible&&<Circle cx={(aim.x*.5+.5)*360*k} cy={(-aim.y*.5+.5)*640*k} r={27*k} fill="none" stroke={ready?'#81ffc4':'#fff1ae'} strokeWidth={2*k}/>}
   {catchAge>=0&&catchAge<200&&<><Circle testID="butterfly-catch-reaction" cx={180*k} cy={320*k} r={(reducedMotion?52:38+catchAge*.16)*k} fill="none" stroke="#F2C14E" strokeWidth={3*k} opacity={1-catchAge/200}/>{[0,1,2,3].map(i=>{const a=i*Math.PI/2+.4,r=(reducedMotion?56:40+catchAge*.12)*k;return <Circle key={i} cx={180*k+Math.cos(a)*r} cy={320*k+Math.sin(a)*r} r={4*k} fill="#FFF2C3" opacity={1-catchAge/200}/>;})}</>}
   {!webGL&&<><Line x1={292*k} y1={620*k} x2={netX*k} y2={(netY+10)*k} stroke="#b68650" strokeWidth={8*k}/><Ellipse cx={netX*k} cy={netY*k} rx={45*k} ry={26*k} fill="#f4f8e72b" stroke="#e7c98e" strokeWidth={4*k}/></>}
  </Svg>
  <View pointerEvents="none" accessibilityLabel={s.catches+' gevangen, combo '+s.streak} style={{position:'absolute',left:0,right:0,top:10*k,flexDirection:'row',justifyContent:'center',gap:8*k}}><View style={{paddingHorizontal:12*k,paddingVertical:4*k,borderRadius:16*k,backgroundColor:'#0E2828E0',borderWidth:1,borderColor:'#BFF3EC47'}}><Text style={{fontFamily:font,color:'#EAF6F2',fontSize:15*k,fontWeight:'900'}}>🦋 {s.catches}</Text></View>{s.streak>1&&<View style={{paddingHorizontal:12*k,paddingVertical:4*k,borderRadius:16*k,backgroundColor:'#0E2828E0',borderWidth:1,borderColor:'#F2C14E99'}}><Text style={{fontFamily:font,color:'#F2C14E',fontSize:15*k,fontWeight:'900'}}>×{s.streak}</Text></View>}</View>
  {Platform.OS==='web'&&<Pressable onPress={startSensor} accessibilityRole="button" accessibilityLabel="Start 360 graden met bewegingssensor" style={{position:'absolute',right:10*k,top:52*k,paddingHorizontal:10*k,paddingVertical:6*k,borderRadius:16*k,backgroundColor:'#0E2828E0',borderWidth:1,borderColor:'#BFF3EC47'}}><Text style={{color:'#EAF6F2',fontSize:12*k,fontWeight:'800'}}>{sensor||'📱 360°'}</Text></Pressable>}
  <View pointerEvents="box-none" style={{position:'absolute',left:20*k,right:20*k,bottom:16*k,alignItems:'center',gap:6*k}}>
   {s.aimedBug!==null&&<Text pointerEvents="none" style={{color:'#EAF6F2',fontSize:14*k,fontWeight:'800',textShadowColor:'#000A',textShadowRadius:4}}>{originalFlyingBugSpecs[s.aimedBug].name}</Text>}
   <View pointerEvents="none" style={{height:8*k,width:'100%',backgroundColor:'#0E2828CC',borderRadius:8,overflow:'hidden',borderWidth:1,borderColor:'#BFF3EC33'}}><View style={{height:'100%',width:`${s.focusProgress*100}%`,backgroundColor:ready?'#6BEFF2':'#F2C14E'}}/></View>
   <Pressable testID="original-butterfly-catch-button" accessibilityRole="button" accessibilityLabel={ready?'Tik om te vangen':'Volg het insect tot 100 procent'} disabled={cooldown} onPress={()=>onInput({x:500,y:500,action:'down',control:'catch'})} style={{width:'100%',minHeight:56*k,justifyContent:'center',padding:12*k,borderRadius:28*k,borderWidth:1,borderColor:ready?'#B2FCFF':'#BFF3EC47',backgroundColor:ready?'#1FC3D3':'#0E2828E6',opacity:cooldown?.6:1,boxShadow:ready?'0px 4px 20px #12dce766':undefined}}><Text style={{color:ready?'#052825':'#EAF6F2',fontFamily:font,fontWeight:'900',fontSize:20*k,textAlign:'center'}}>{cooldown?'…':ready?'Vang!':'🎯 '+Math.round(s.focusProgress*100)+'%'}</Text></Pressable>

  </View>
 </View>;
}
