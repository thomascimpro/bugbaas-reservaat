import React,{useEffect,useRef,useState} from 'react';
import {Image,Text,View,StyleSheet,Platform} from 'react-native';
import Svg,{Line,Circle,Ellipse,Rect,Path} from 'react-native-svg';
import type {ArcadeTap,ArcadeTicket} from '../../game/arcade/tapDuel';
import {targetPosition,FIELD,TICK_MS,TARGETS} from '../../game/arcade/tapDuel';
import {ARCADE_GAMES,createArcadeState,stepArcadeState,applyArcadeInput,catchBugPosition,bubbleCellPosition} from '../../game/arcade/games';
import type {ArcadeState,BubbleType} from '../../game/arcade/games';
import {FAST} from '../../game/goV2';
import {GO_TYPES} from '../GoTypeV2';
import {SpriteView} from '../artV2';
import {font,V} from '../uiV2';
import {playSound} from '../audioV2';
import {ArcadeIcon,enemyImages} from './ArcadeArtV3';
import {isOriginalRules} from '../../game/arcade/original';
import {OriginalArcadeFieldV3} from './original/OriginalArcadeFieldV3';

const fx=(type:string,frame:number)=>type==='fire'?['fx','fire-'+(frame+1)]:type==='grass'?['fx','leaf-'+(frame+1)]:type==='flying'?['fx','air-'+(frame+1)]:[['water','bug','poison','normal'].includes(type)?'fx-extra':'fx-last',type+'-'+['anticipation','strike','impact','fade'][frame]];
export type ArcadeFieldProps={ticket:ArcadeTicket;onComplete:(inputs:ArcadeTap[],state:ArcadeState)=>void;onHUD:(state:Pick<ArcadeState,'tick'|'score'|'durationTicks'>)=>void;reducedMotion?:boolean};
export const ArcadeFieldV3=React.memo(function ArcadeFieldV3(props:ArcadeFieldProps){return isOriginalRules(props.ticket)?<OriginalArcadeFieldV3 key={props.ticket.id} {...props}/>:<LegacyArcadeFieldV3 key={props.ticket.id} {...props}/>;});
function LegacyArcadeFieldV3({ticket,onComplete,onHUD,reducedMotion=false}:ArcadeFieldProps){
 const [initial]=useState(()=>createArcadeState(ticket)),sim=useRef(initial),inputs=useRef<ArcadeTap[]>([]),[,draw]=useState(0),[box,setBox]=useState({width:360,height:640});
 const complete=useRef(onComplete),hud=useRef(onHUD);complete.current=onComplete;hud.current=onHUD;
 const origin=useRef(performance.now()),lastDraw=useRef(0),lastHud=useRef(-10),done=useRef(false),lastInput=useRef(-5),lastMove=useRef(-5),gesture=useRef<{x:number;y:number}|null>(null),bytes=useRef(2);
 useEffect(()=>{
  let frame=0,disposed=false;
  const render=(at:number)=>{if(disposed||done.current)return;const state=sim.current,targetTick=Math.min(state.durationTicks,Math.floor((at-origin.current)/TICK_MS));while(state.tick<targetTick&&!state.finished)stepArcadeState(state,ticket);
   if(state.tick-lastHud.current>=5||state.finished){lastHud.current=state.tick;hud.current({tick:state.tick,score:state.score,durationTicks:state.durationTicks});}
   if(at-lastDraw.current>=1000/30||state.finished){lastDraw.current=at;draw(n=>n+1);}
   if(state.finished){done.current=true;complete.current(inputs.current,{...state,squad:state.squad.map(b=>({...b}))});return;}frame=requestAnimationFrame(render);
  };frame=requestAnimationFrame(render);return()=>{disposed=true;cancelAnimationFrame(frame);};
 },[ticket.id]);
 const scale=Math.min(box.width/FIELD.width,box.height/FIELD.height),left=(box.width-FIELD.width*scale)/2,top=(box.height-FIELD.height*scale)/2,state=sim.current;
 const touch=(x:number,y:number,action:'down'|'move'|'up'='down',logical=false)=>{if(done.current)return;const tick=Math.min(state.durationTicks,Math.floor((performance.now()-origin.current)/TICK_MS));while(state.tick<tick&&!state.finished)stepArcadeState(state,ticket);if(state.finished||state.tick>=state.durationTicks)return;
  if(state.game==='tap_duel'&&(action!=='down'||state.tick-lastInput.current<5))return;
  if(action==='move'&&state.tick-lastMove.current<3)return;
  const rawX=logical?x:(x-left)/scale/FIELD.width*1000,rawY=logical?y:(y-top)/scale/FIELD.height*1000;
  if(action==='down'&&(rawX<0||rawX>1000||rawY<0||rawY>1000))return;
  const input:ArcadeTap={tick:state.tick,x:Math.round(Math.max(0,Math.min(1000,rawX))),y:Math.round(Math.max(0,Math.min(1000,rawY))),...(state.game==='tap_duel'?{}:{action})};
  if(state.game==='web_runner'&&action!=='down'||state.game==='nest_defense'&&action!=='down'||state.game==='bug_glide'&&action==='move'||state.game==='butterfly_catch'&&action==='up')return;
  const same=inputs.current.filter(i=>i.tick===state.tick).length;if(same>=3||inputs.current.length>=(state.game==='tap_duel'?450:1200))return;
  const size=JSON.stringify(input).length+1;if(bytes.current+size>65000)return;
  lastInput.current=state.tick;if(action==='move')lastMove.current=state.tick;inputs.current.push(input);bytes.current+=size;const before=state.score,hit=applyArcadeInput(state,ticket,input);if(hit&&(state.game==='tap_duel'||state.game==='nest_defense'||state.game==='bubble_swarm'))playSound(state.score>before?'reward':'hit');draw(n=>n+1);
 };
 useEffect(()=>{if(Platform.OS!=='web')return;const keys=new Set<string>();const down=(e:KeyboardEvent)=>{if(e.repeat||!['ArrowLeft','ArrowRight',' ','ArrowUp'].includes(e.key))return;e.preventDefault();keys.add(e.key);if(state.game==='web_runner'||state.game==='bug_tower')touch(e.key==='ArrowLeft'?200:800,500,'down',true);else if(state.game==='bug_glide')touch(500,500,'down',true);};const up=(e:KeyboardEvent)=>{if(!keys.has(e.key))return;keys.delete(e.key);if(state.game==='bug_tower'||state.game==='bug_glide')touch(500,500,'up',true);};window.addEventListener('keydown',down);window.addEventListener('keyup',up);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);};},[ticket.id]);
 return <View testID="arcade-playfield" accessibilityLabel={ARCADE_GAMES.find(g=>g.id===state.game)!.help} onLayout={e=>setBox(e.nativeEvent.layout)} onStartShouldSetResponder={()=>true} onMoveShouldSetResponder={()=>true} onResponderTerminationRequest={()=>false} onResponderGrant={e=>{const {locationX:x,locationY:y}=e.nativeEvent;gesture.current={x,y};if(state.game!=='web_runner')touch(x,y,'down');}} onResponderMove={e=>{const {locationX:x,locationY:y}=e.nativeEvent;if(state.game==='web_runner'){const start=gesture.current;if(start&&Math.abs(x-start.x)>=24*scale){touch(x<start.x?200:800,500,'down',true);gesture.current={x,y};}}else if(['butterfly_catch','bubble_swarm','bug_tower'].includes(state.game))touch(x,y,'move');}} onResponderRelease={e=>{gesture.current=null;touch(e.nativeEvent.locationX,e.nativeEvent.locationY,'up');}} onResponderTerminate={()=>{gesture.current=null;touch(500,500,'up',true);}} style={{flex:1,overflow:'hidden',...(Platform.OS==='web'?{touchAction:'none',userSelect:'none'} as any:{})}}>
  <View pointerEvents="none" style={{position:'absolute',left,top,width:360*scale,height:640*scale}}>
   {state.game!=='tap_duel'&&<ArcadeScene state={state} ticket={ticket} scale={scale} reducedMotion={reducedMotion}/>}
   {state.game==='tap_duel'&&state.targets.map(t=>{const p=targetPosition(ticket.seed,t,state.tick),warning=state.tick-t.born>=200&&!t.attacked;return <View key={t.id} style={{position:'absolute',left:(p.x-49)*scale,top:(p.y-56)*scale,width:98*scale,height:112*scale,alignItems:'center'}}>
    {warning&&<View style={{position:'absolute',width:92*scale,height:92*scale,top:9*scale,borderRadius:60*scale,borderWidth:2,borderColor:'#ffca62',backgroundColor:'#e49a2922'}}/>}
    <View style={{width:67*scale,height:5*scale,borderRadius:3,backgroundColor:'#061c20',borderWidth:1,borderColor:warning?'#ffd269':'#7ecabb',overflow:'hidden'}}><View style={{width:`${t.hp/t.maxHP*100}%`,height:'100%',backgroundColor:t.hp/t.maxHP<.3?'#ffb16c':'#9cea9b'}}/></View>
    <Image source={enemyImages[t.kind]} resizeMode="contain" style={{width:96*scale,height:95*scale,marginTop:2*scale}}/>
    {warning&&<Text style={{position:'absolute',right:1,top:6,color:'#ffe2a3',fontSize:24*scale,fontWeight:'900'}}>!</Text>}
    <View style={{flexDirection:'row',position:'absolute',bottom:2*scale}}>{TARGETS[t.kind].types.map(type=><ArcadeIcon key={type} atlas="types" name={type} size={18*scale}/>)}</View>
   </View>;})}
   {state.effects.map((e,i)=>{const p=e,shooterX=FIELD.width*(e.shooter+.5)/state.squad.length,age=state.tick-e.tick,color=e.kind==='hurt'?'#f7aa7b':GO_TYPES[FAST[state.squad[e.shooter].fast].type].color,phase=Math.min(3,Math.floor(age/6)),effect=fx(e.kind==='hurt'?TARGETS[e.target%4].types[0]:FAST[state.squad[e.shooter].fast].type,phase);return <React.Fragment key={e.tick+':'+i}>
    {!reducedMotion&&age<10&&e.kind!=='hurt'&&<Svg style={StyleSheet.absoluteFill} width={360*scale} height={640*scale}><Line x1={shooterX*scale} y1={580*scale} x2={p.x*scale} y2={p.y*scale} stroke={color} strokeWidth={6*scale} strokeOpacity={.65}/><Line x1={shooterX*scale} y1={580*scale} x2={p.x*scale} y2={p.y*scale} stroke="#e7ffff" strokeWidth={2*scale}/><Circle cx={p.x*scale} cy={p.y*scale} r={(8+age*2)*scale} fill="none" stroke="#baffee" strokeWidth={2*scale} opacity={1-age/10}/></Svg>}
    {!reducedMotion&&<View style={{position:'absolute',left:(p.x-48)*scale,top:(p.y-45)*scale,opacity:1-age/25}}><ArcadeIcon atlas={effect[0] as 'fx'} name={effect[1]} size={96*scale}/></View>}
    <Text style={{position:'absolute',left:(p.x-15)*scale,top:(p.y-30-(reducedMotion?0:age*1.6))*scale,fontFamily:font,fontSize:(e.kind==='defeat'?27:21)*scale,fontWeight:'900',color:e.kind==='defeat'?'#fff0aa':'#f3ffff',textShadowColor:'#071f1b',textShadowRadius:3,opacity:1-age/25}}>{e.kind==='defeat'?(state.game==='nest_defense'?'Raak!':'+'+TARGETS[e.target%4].points):'−'+e.amount}</Text>
   </React.Fragment>;})}
   {state.game==='tap_duel'&&<View style={{position:'absolute',left:0,right:0,bottom:0,flexDirection:'row',justifyContent:'space-around',alignItems:'flex-end'}}>{state.squad.map((b,i)=>{const ready=Math.min(1,Math.max(0,1-(b.ready-state.tick)/(FAST[b.fast].turns*20))),pulse=state.effects.some(e=>e.shooter===i&&e.kind!=='hurt'&&state.tick-e.tick<6);return <View key={b.id} style={{width:105*scale,alignItems:'center',opacity:b.health>0?1:.3,transform:[{scale:!reducedMotion&&pulse?1.06:1}]}}><SpriteView id={b.species} shiny={b.shiny} size={102*scale}/><View style={{width:82*scale,height:6*scale,backgroundColor:'#071e1b',borderRadius:5,borderWidth:1,borderColor:'#9acdb6',overflow:'hidden'}}><View style={{width:`${b.health/b.hp*100}%`,height:'100%',backgroundColor:'#9be4a2'}}/></View><View style={{width:82*scale,height:3*scale,backgroundColor:'#0c2526',marginTop:3}}><View style={{width:`${ready*100}%`,height:'100%',backgroundColor:'#57e5f1'}}/></View></View>;})}</View>}
  </View>
 </View>;
}

const nectarImage=require('../../assets/art/icons/nectar.png');
const butterflyImage=require('../../assets/v2/illustrations/butterfly.webp');
const waspImage=require('../../assets/v2/illustrations/wasp_2.webp');
const bubbleColors:Record<BubbleType,string>={grass:'#8acc77',fire:'#f4a35f',water:'#68c5de'};
function ArcadeScene({state:s,ticket,scale:k,reducedMotion}:{state:ArcadeState;ticket:ArcadeTicket;scale:number;reducedMotion:boolean}){
 const place=(x:number,y:number,width:number,height=width)=>({position:'absolute' as const,left:(x-width/2)*k,top:(y-height/2)*k,width:width*k,height:height*k});
 const leader=s.squad[0];
 const hero=(x:number,y:number,size=62,dim=false)=><View style={{...place(x,y,size),opacity:dim?.55:1}}><SpriteView id={leader.species} shiny={leader.shiny} size={size*k} animate={!reducedMotion}/></View>;
 const nectar=(id:string|number,x:number,y:number)=><Image key={id} source={nectarImage} style={place(x,y,23)} resizeMode="contain"/>;
 const bubble=(id:string|number,type:BubbleType,x:number,y:number,size=36)=><View key={id} style={{...place(x,y,size),borderRadius:100,backgroundColor:bubbleColors[type],borderWidth:2,borderColor:'#edffde',alignItems:'center',justifyContent:'center',boxShadow:'0px 2px 6px #061c2055'}}><ArcadeIcon atlas="types" name={type} size={size*.72*k}/></View>;
 return <>
  {s.game!=='bubble_swarm'&&<View style={{position:'absolute',left:14*k,top:12*k,paddingHorizontal:10*k,paddingVertical:5*k,borderRadius:16*k,backgroundColor:'#0b302be8'}}><Text accessibilityLabel={`${s.hearts} harten over`} style={{fontFamily:font,fontSize:20*k,color:'#f9b8a0',letterSpacing:4*k}}>{'♥'.repeat(s.hearts)}<Text style={{color:'#597766'}}>{'♡'.repeat(3-s.hearts)}</Text></Text></View>}
  {s.runner&&<>
   <Svg width={360*k} height={640*k} viewBox="0 0 360 640"><Line x1="120" y1="70" x2="120" y2="610" stroke="#b7dec14d" strokeWidth="2" strokeDasharray="7 12"/><Line x1="240" y1="70" x2="240" y2="610" stroke="#b7dec14d" strokeWidth="2" strokeDasharray="7 12"/>{s.runner.things.filter(o=>o.kind==='web').map(o=><React.Fragment key={o.id}><Circle cx={60+o.lane*120} cy={o.y} r="25" fill="#d0e4cb19" stroke="#e5f1d9" strokeWidth="2"/>{[0,1,2].map(i=><Ellipse key={i} cx={60+o.lane*120} cy={o.y} rx={25-i*7} ry="25" fill="none" stroke="#d4e6d5" strokeWidth="1"/>)}<Line x1={35+o.lane*120} y1={o.y} x2={85+o.lane*120} y2={o.y} stroke="#e5f1d9"/></React.Fragment>)}</Svg>
   {s.runner.things.filter(o=>o.kind==='nectar').map(o=>nectar(o.id,60+o.lane*120,o.y))}
   {hero(60+s.runner.lane*120,520,72,s.tick<s.runner.invulnerable)}
   <Text style={{position:'absolute',bottom:18*k,left:0,right:0,textAlign:'center',color:V.ink,fontFamily:font,fontWeight:'700',fontSize:17*k}}>‹  Veeg naar een vrije baan  ›</Text>
  </>}
  {s.nest&&<>
   <Svg width={360*k} height={640*k} viewBox="0 0 360 640">{[120,240].map(x=><Line key={x} x1={x} y1="70" x2={x} y2="540" stroke="#b7dec14d" strokeWidth="2" strokeDasharray="7 12"/>)}<Ellipse cx="180" cy="553" rx="160" ry="34" fill="#694c29" stroke="#bead76" strokeWidth="5"/><Path d="M 35 550 Q 180 610 325 550 M 45 560 Q 180 603 315 560 M 55 540 Q 180 580 305 540" fill="none" stroke="#d7c493" strokeWidth="3"/>{s.nest.shots.map(p=><Circle key={p.id} cx={60+p.lane*120} cy={p.y} r="6" fill={GO_TYPES[FAST[s.squad[p.shooter].fast].type].color} stroke="#f4ffe9" strokeWidth="2"/>)}</Svg>
   {s.nest.enemies.map(e=><View key={e.id} style={place(60+e.lane*120,e.y,76,86)}><Image source={enemyImages[e.kind]} resizeMode="contain" style={{width:76*k,height:76*k}}/><View style={{width:58*k,height:5*k,marginLeft:9*k,backgroundColor:'#061c20',borderRadius:3,overflow:'hidden'}}><View style={{width:`${e.hp/e.maxHP*100}%`,height:'100%',backgroundColor:V.mint}}/></View></View>)}
   {s.squad.map((b,i)=><View key={b.id} style={{...place(60+i*120,594,78),opacity:b.ready>s.tick?.68:1}}><SpriteView id={b.species} shiny={b.shiny} size={78*k} animate={!reducedMotion}/><View style={{height:3*k,width:`${Math.max(0,Math.min(1,1-(b.ready-s.tick)/(FAST[b.fast].turns*20)))*100}%`,backgroundColor:'#57e5f1'}}/></View>)}
  </>}
  {s.glide&&<>
   <Svg width={360*k} height={640*k} viewBox="0 0 360 640">{s.glide.gates.map(g=><React.Fragment key={g.id}><Rect x={g.x-18} y="0" width="36" height={Math.max(0,g.center-(190+s.helpers.gateExtra)/2)} rx="16" fill="#589860" stroke="#bbdf9c" strokeWidth="3"/><Rect x={g.x-18} y={g.center+(190+s.helpers.gateExtra)/2} width="36" height={640-g.center-(190+s.helpers.gateExtra)/2} rx="16" fill="#589860" stroke="#bbdf9c" strokeWidth="3"/></React.Fragment>)}</Svg>
   {s.glide.gates.filter(g=>g.nectar).map(g=>nectar(g.id,g.x,g.center))}{hero(90,s.glide.y,72,s.tick<s.glide.invulnerable)}
   <Text style={{position:'absolute',bottom:14*k,left:0,right:0,textAlign:'center',fontFamily:font,color:V.ink,fontSize:16*k}}>{s.glide.held?'↑ Vasthouden: stijgen':'↓ Loslaten: dalen'}</Text>
  </>}
  {s.catch&&<>
   {s.catch.bugs.map(b=>{const p=catchBugPosition(b,s.tick),near=b.kind==='wasp'&&Math.hypot(p.x-s.catch!.x,p.y-s.catch!.y)<80+(s.helpers.poisonWarning?8:0);return <View key={b.id} style={place(p.x,p.y,b.kind==='wasp'?55:64)}>{(near||b.shiny&&b.kind==='butterfly')&&<View style={{position:'absolute',inset:1,borderRadius:40,borderWidth:2,borderColor:near?'#ffbc69':'#f7eeb2',backgroundColor:near?'#efae5722':'#ffffdd15'}}/>}<Image source={b.kind==='wasp'?waspImage:butterflyImage} resizeMode="contain" style={{width:'100%',height:'100%'}}/>{near&&<Text style={{position:'absolute',right:0,top:0,color:'#ffe7b3',fontSize:24*k,fontWeight:'900'}}>!</Text>}</View>;})}
   <Svg width={360*k} height={640*k} viewBox="0 0 360 640"><Line x1={s.catch.x+20} y1={s.catch.y+18} x2={s.catch.x+49} y2={s.catch.y+69} stroke="#c4b285" strokeWidth="9" strokeLinecap="round"/><Ellipse cx={s.catch.x} cy={s.catch.y} rx={32*(1+s.helpers.netPct/100)} ry={24*(1+s.helpers.netPct/100)} fill="#e0fff522" stroke="#f4f0da" strokeWidth="4"/>{[-12,0,12].map(y=><Line key={y} x1={s.catch!.x-25} y1={s.catch!.y+y} x2={s.catch!.x+25} y2={s.catch!.y+y} stroke="#f4f0da88" strokeWidth="1"/>)}</Svg>
   <Text style={{position:'absolute',bottom:12*k,left:0,right:0,textAlign:'center',fontFamily:font,color:V.ink,fontSize:16*k}}>Sleep je net · vlinder +10 · wesp −♥</Text>
  </>}
  {s.tower&&<>
   <Svg width={360*k} height={640*k} viewBox="0 0 360 640">{s.tower.leaves.filter(l=>l.y-s.tower!.camera>-30&&l.y-s.tower!.camera<680).map(l=>{const y=l.y-s.tower!.camera,w=110*(1+s.helpers.platformPct/100);return <React.Fragment key={l.floor}><Path d={`M ${l.x-w/2} ${y+6} Q ${l.x-15} ${y-20} ${l.x+w/2} ${y} Q ${l.x+15} ${y+25} ${l.x-w/2} ${y+6}`} fill={l.floor<=s.tower!.maxFloor?'#719c5b':'#91c574'} stroke="#d0e9ab" strokeWidth="2"/><Line x1={l.x-w/2+10} y1={y+5} x2={l.x+w/2-8} y2={y+2} stroke="#d1e9a88c" strokeWidth="2"/></React.Fragment>;})}</Svg>
   {s.tower.leaves.filter(l=>l.nectar&&!s.tower!.pickups.includes(l.floor)).map(l=>nectar(l.floor,l.x,l.y-s.tower!.camera-24))}{hero(s.tower.x,s.tower.y-s.tower.camera,58)}
   <View style={{position:'absolute',bottom:10*k,left:0,right:0,flexDirection:'row',justifyContent:'space-between',paddingHorizontal:20*k}}><Text style={{fontFamily:font,color:V.ink,fontSize:24*k}}>‹ Houd links</Text><Text style={{fontFamily:font,color:V.ink,fontSize:24*k}}>rechts ›</Text></View>
   <Text style={{position:'absolute',right:15*k,top:20*k,color:V.ink,fontFamily:font,fontSize:16*k}}>Blad {s.tower.maxFloor}</Text>
  </>}
  {s.bubble&&<>
   <Svg width={360*k} height={640*k} viewBox="0 0 360 640"><Line x1="12" y1="470" x2="348" y2="470" stroke="#efb18b" strokeWidth="2" strokeDasharray="8 7"/>{!s.bubble.shot&&<Line x1="180" y1="570" x2={180+Math.cos(s.bubble.aim*Math.PI/180)*Math.min(160,s.helpers.aimLength+(ticket.squad.some(q=>q.types.includes(s.bubble!.current))?10:0))} y2={570-Math.sin(s.bubble.aim*Math.PI/180)*Math.min(160,s.helpers.aimLength+(ticket.squad.some(q=>q.types.includes(s.bubble!.current))?10:0))} stroke="#efffd8" strokeWidth="3" strokeDasharray="5 5"/>}<Ellipse cx="180" cy="592" rx="41" ry="14" fill="#557444" stroke="#aeca8c" strokeWidth="3"/></Svg>
   {s.bubble.cells.map(c=>{const p=bubbleCellPosition(c,s.bubble!.offset);return bubble(c.id,c.type,p.x,p.y);})}
   {s.bubble.shot?bubble('shot',s.bubble.shot.type,s.bubble.shot.x,s.bubble.shot.y):bubble('current',s.bubble.current,180,570)}
   {bubble('next',s.bubble.next,270,576,29)}{s.helpers.secondPreview&&bubble('second',s.bubble.second,309,580,24)}
   <Text style={{position:'absolute',left:245*k,top:602*k,fontFamily:font,fontSize:12*k,color:V.ink}}>Daarna</Text>
   <Text style={{position:'absolute',left:16*k,top:487*k,fontFamily:font,fontSize:13*k,color:V.muted}}>Leeg het bord · {5-s.bubble.misses} tot zakken</Text>
  </>}
 </>;
}
