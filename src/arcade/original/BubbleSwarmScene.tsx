/** Original BubbleSwarmGame field (GM-03 / P15.1). Presentation only: board, flight, specials and pressure come from the state. */
import React,{useMemo,useRef} from 'react';
import {Image,Text,View} from 'react-native';
import Svg,{Line,Polyline} from 'react-native-svg';
import type {OriginalSceneProps} from '../../../game/arcade/original/types';
import {bubbleGridPoint,bubbleMissLimit,bubblePathPosition,bubblePreviewPath} from '../../../game/arcade/original/bubbleSwarm';
import type {BubbleKind,OriginalBubbleState} from '../../../game/arcade/original/bubbleSwarm';
import {font} from '../../uiV2';
const background=require('../../../assets/v3/original/bubble/bubble-swarm-background.jpg'),launcher=require('../../../assets/v3/arcade/dragonfly.webp');
const images:Record<BubbleKind,number>={bee:require('../../../assets/v3/original/bubble/bug-bubble-bee.png'),beetle:require('../../../assets/v3/original/bubble/bug-bubble-beetle.png'),dragonfly:require('../../../assets/v3/original/bubble/bug-bubble-dragonfly.png'),firefly:require('../../../assets/v3/original/bubble/bug-bubble-firefly.png'),ladybug:require('../../../assets/v3/original/bubble/bug-bubble-ladybug.png'),moth:require('../../../assets/v3/original/bubble/bug-bubble-moth.png')};
const G={glass:'#0E2828E0',rim:'#BFF3EC47',text:'#EAF6F2',ice:'#9BE7FF',warn:'#F0476B'};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
type Ghost={id:string;kind:BubbleKind;x:number;y:number;at:number;fall:boolean};

export function BubbleSwarmScene({state:s,scale:k,reducedMotion,onInput}:OriginalSceneProps<OriginalBubbleState>){
 const width=360*k,height=600*k,size=width*.124,p=s.projectile,at=p?bubblePathPosition(p.path,Math.min(1,(s.elapsedMs-p.startedAt)/p.durationMs)):null,preview=useMemo(()=>p?[]:bubblePreviewPath(s),[s.board,s.gridPhase,s.aim.x,s.aim.y,!!p]),frozen=s.freezeUntil>s.elapsedMs;
 // Removed bubbles keep their real old board position for a short pop (same kind as the shot, 180 ms) or fall (250 ms). Display only.
 const memo=useRef<{source?:OriginalBubbleState['board'];phase?:0|1;board:Map<string,{kind:BubbleKind;x:number;y:number}>;ghosts:Ghost[];shot:BubbleKind|null;level:number;levelAt:number}>({board:new Map(),ghosts:[],shot:null,level:s.level,levelAt:-1e9});
 const m=memo.current,now=s.elapsedMs;
 if(p)m.shot=p.shot.bubbleKind;
 if(s.level!==m.level){m.level=s.level;m.levelAt=now;m.board.clear();}
 if(m.source!==s.board||m.phase!==s.gridPhase){const ids=new Set(s.board.map(b=>b.id));
 for(const [id,b] of m.board)if(!ids.has(id))m.ghosts.push({id,...b,at:now,fall:b.kind!==m.shot});
 m.board=new Map(s.board.map(b=>{const pos=bubbleGridPoint(b.row,b.col,s.gridPhase);return [b.id,{kind:b.kind,x:pos.x,y:pos.y}];}));m.source=s.board;m.phase=s.gridPhase;}
 m.ghosts=m.ghosts.filter(g=>now-g.at<(g.fall?250:180)&&now>=g.at).slice(-(reducedMotion?0:24));
 const reveal=reducedMotion?1:clamp((now-m.levelAt)/250),limit=bubbleMissLimit(s.elapsedMs),missesLeft=Math.max(0,limit-s.misses),pressure=Math.max(0,Math.ceil((s.nextPressureAt-s.elapsedMs)/1000)),danger=s.board.some(b=>bubbleGridPoint(b.row,b.col,s.gridPhase).y>70);
 const bubble=(key:string,kind:BubbleKind,x:number,y:number,diameter=size,power?:'bomb'|'freeze',extra?:object)=><View pointerEvents="none" key={key} style={{position:'absolute',left:x/100*width-diameter/2,top:y/100*height-diameter/2,width:diameter,height:diameter,...extra}}><Image source={images[kind]} style={{width:diameter,height:diameter}} resizeMode="contain"/>{power&&<View style={{position:'absolute',right:-3*k,top:-3*k,width:20*k,height:20*k,borderRadius:10*k,borderColor:'#fff',borderWidth:1.5*k,backgroundColor:power==='bomb'?'#2A1A1A':'#0B4A63',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:11*k}}>{power==='bomb'?'💣':'❄'}</Text></View>}</View>;
 const boardArt=useMemo(()=>s.board.map(b=>{const pos=bubbleGridPoint(b.row,b.col,s.gridPhase);return bubble(b.id,b.kind,pos.x,pos.y,size,b.power);}),[s.board,s.gridPhase,size,k]);
 const send=(e:{nativeEvent:{locationX:number;locationY:number}},action:'down'|'move'|'up')=>onInput({control:'field',action,x:Math.max(0,Math.min(1000,Math.round(e.nativeEvent.locationX/width*1000))),y:Math.max(0,Math.min(1000,Math.round(e.nativeEvent.locationY/height*1000)))});
 const chip=(key:string,label:string,body:string,color=G.text)=><View key={key} accessibilityLabel={label} style={{paddingHorizontal:10*k,paddingVertical:3*k,borderRadius:14*k,backgroundColor:G.glass,borderWidth:1,borderColor:color===G.text?G.rim:color+'99'}}><Text style={{fontFamily:font,fontSize:13*k,fontWeight:'800',color}}>{body}</Text></View>;
 return <View testID="original-bubble-scene" style={{width,height:640*k,backgroundColor:'#06152b'}}>
  <View style={{height:40*k,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8*k,backgroundColor:'#071d1b'}}>
   {chip('lv','Level '+s.level,'Lv '+s.level)}
   {chip('miss',missesLeft+' missers over','🎯 '+missesLeft,missesLeft<=1?G.warn:G.text)}
   {frozen?chip('ice','IJs nog '+Math.ceil((s.freezeUntil-s.elapsedMs)/1000)+' seconden','❄ '+Math.ceil((s.freezeUntil-s.elapsedMs)/1000)+'s',G.ice):chip('push','Nieuwe rij over '+pressure+' seconden','⬇ '+pressure+'s',pressure<=3?G.warn:G.text)}
   {s.combo>1&&chip('combo','Combo '+s.combo,'×'+s.combo,'#F2C14E')}
  </View>
  <View accessibilityLabel="Sleep om te richten en laat los om te schieten" onStartShouldSetResponder={()=>true} onMoveShouldSetResponder={()=>true} onResponderGrant={e=>send(e,'down')} onResponderMove={e=>send(e,'move')} onResponderRelease={e=>send(e,'up')} style={{width,height,overflow:'hidden'}}>
   <View pointerEvents="none" style={{position:'absolute',inset:0}}><Image source={background} style={{width,height}} resizeMode="cover"/><View style={{position:'absolute',inset:0,backgroundColor:'#02140F33'}}/></View>
   {/* pressure line: a fixed shape cue, stronger when the swarm is close; never flashing */}
   <Svg pointerEvents="none" width={width} height={height} style={{position:'absolute',inset:0}}><Line x1={6*k} x2={width-6*k} y1={height*.82} y2={height*.82} stroke={G.warn} strokeOpacity={danger?.9:.45} strokeWidth={(danger?3:2)*k} strokeDasharray={`${10*k},${6*k}`}/></Svg>
   {danger&&<Text pointerEvents="none" style={{position:'absolute',right:8*k,top:height*.82-20*k,fontSize:14*k}}>⚠️</Text>}
   {frozen&&<View pointerEvents="none" style={{position:'absolute',left:3*k,right:3*k,top:3*k,height:height*.8,borderRadius:18*k,borderWidth:2.5*k,borderColor:G.ice,backgroundColor:'#9BE7FF14'}}/>}
   {!p&&<Svg pointerEvents="none" width={width} height={height} style={{position:'absolute',inset:0}}><Polyline points={preview.map(q=>`${q.x/100*width},${q.y/100*height}`).join(' ')} fill="none" stroke="#E8FFF4" strokeWidth={(2.5+s.help.guidePct/100)*k} strokeLinecap="round" strokeDasharray={`${.1*k},${11*k}`} opacity={.75+s.help.guidePct/100}/></Svg>}
   <View pointerEvents="none" style={{position:'absolute',inset:0,opacity:reveal,transform:[{translateY:(1-reveal)*-14*k}]}}>{boardArt}</View>
   {m.ghosts.map(g=>{const f=clamp((now-g.at)/(g.fall?250:180));return bubble('g'+g.id,g.kind,g.x,g.y+(g.fall?f*f*18:0),size*(g.fall?1:1+.35*f),undefined,{opacity:1-f});})}
   {at&&p&&bubble('projectile',p.shot.bubbleKind,at.x,at.y)}
   {s.impact&&<View pointerEvents="none" style={{position:'absolute',left:s.impact.x/100*width-20*k,top:s.impact.y/100*height-20*k,width:40*k,height:40*k,borderRadius:20*k,borderColor:'#FFF7D6',borderWidth:2.5*k,backgroundColor:'#F2C14E33'}}/>}
   {/* launcher (P15.1): dragonfly under the current shot; next shot in a small glass ring */}
   <View pointerEvents="none" style={{position:'absolute',left:width*.5-70*k,top:height*.86,width:140*k,height:110*k}}><Image source={launcher} resizeMode="contain" style={{width:140*k,height:110*k,transform:[{rotate:'-90deg'}],opacity:.95}}/></View>
   {!p&&bubble('current',s.currentShot.bubbleKind,50,91,size*1.3)}
   <View pointerEvents="none" accessibilityLabel="Volgende bubbel" style={{position:'absolute',left:width*.8-size*.55,top:height*.92-size*.55,width:size*1.1,height:size*1.1,borderRadius:size,backgroundColor:G.glass,borderWidth:1,borderColor:G.rim}}/>
   {bubble('next',s.nextShot.bubbleKind,80,92,size*.75)}
  </View>
 </View>;
}
