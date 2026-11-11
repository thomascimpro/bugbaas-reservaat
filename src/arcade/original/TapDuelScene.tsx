import React,{useEffect,useRef} from 'react';
import {Text,View} from 'react-native';
import Svg,{Circle,Ellipse,Line} from 'react-native-svg';
import {originalTapTargets,type OriginalTapDuelState} from '../../../game/arcade/original/tapDuel';
import type {OriginalSceneProps} from '../../../game/arcade/original/types';
import {SpriteView} from '../../artV2';
import {font} from '../../uiV2';
import {ArcadeIcon} from '../ArcadeArtV3';
import {playSound} from '../../audioV2';
import {TAP_PORTRAITS} from './tapPortraits';
import {tapHitFeedback} from './tapFeedback';
import {tapDrawOrder} from './tapDrawOrder';

// Presentation only (GM-01 / P13.1). Positions, hit areas, taps, points, combo and helper timing all come
// from the original state; nothing here changes the simulation. Durations follow sections/animations.md.
const colors={Gewoon:'#A7AEB4',Zeldzaam:'#3A9BEF',Episch:'#B45BEB',Legendarisch:'#F2A33A',Mythisch:'#F06BB0'};
const helperFx={sticky:['fx-extra','poison-impact'],shield:['fx','shield-2'],splash:['fx-extra','water-impact'],zap:['fx-last','dark-impact'],burst:['fx','fire-3']} as const;
const trail={sticky:'#AAE085',shield:'#8CDFEE',splash:'#6FC8FF',zap:'#D5A8FF',burst:'#FFD477'} as const;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
// Art is drawn larger than the simulated hit area (portraits keep an empty margin); the hit area itself is unchanged.
const ART=1.4,SPARKS=Array.from({length:8},(_,i)=>i/8*Math.PI*2+.2);

export function OriginalTapDuelScene({state:s,ticket,scale:k,reducedMotion,onInput}:OriginalSceneProps<OriginalTapDuelState>){
 // Input hits the first overlapping target; draw it last so the bug on top is the bug you hit.
 const targets=tapDrawOrder(originalTapTargets(s,ticket)),now=s.elapsedMs;
 // Cooldown span per helper, remembered from the moment its ready time jumps forward (display only).
 const spans=useRef<{ready:number;span:number}[]>([]);
 ticket.squad.forEach((_,i)=>{const ready=s.helperReadyAt[i]??0,prev=spans.current[i];if(!prev||ready>prev.ready)spans.current[i]={ready,span:Math.max(1,ready-now)};});
 const lastCatch=s.effects.filter(e=>e.kind==='catch').at(-1),comboAge=lastCatch?now-lastCatch.at:1e9,pulse=reducedMotion?1:1+.18*(1-clamp(comboAge/160));
 const sounded=useRef('');useEffect(()=>{const e=s.effects.filter(e=>e.kind==='catch'&&e.helper<0).at(-1);if(!e)return;const key=e.at+':'+e.x+':'+e.y;if(key!==sounded.current){sounded.current=key;playSound('arcadeCatch');}},[now]);
 const taps=useRef<{x:number;y:number;at:number}[]>([]);
 const assist=Math.round((s.assist.hitboxMultiplier-1)*100);
 return <View testID="original-tap-duel" accessibilityLabel="Tikduel: tik bugs tot hun balk leeg is" onStartShouldSetResponder={()=>true} onResponderGrant={e=>{playSound('arcadeTap');taps.current=[...taps.current.slice(-5),{x:e.nativeEvent.locationX/k,y:e.nativeEvent.locationY/k,at:now}];onInput({x:Math.round(e.nativeEvent.locationX/(360*k)*1000),y:Math.round(e.nativeEvent.locationY/(640*k)*1000),action:'down'});}} style={{width:360*k,height:640*k,overflow:'hidden'}}>
  {/* soft ground shadows and rarity glow, one batched layer */}
  <Svg pointerEvents="none" style={{position:'absolute',left:0,top:0}} width={360*k} height={640*k}>
   {targets.map(t=>{const cx=(t.motion.x*3.6+t.size/2)*k,cy=(t.motion.y*6.4+t.size*.86)*k;return <React.Fragment key={t.bugId}><Ellipse cx={cx} cy={cy} rx={t.size*.52*k} ry={t.size*.15*k} fill="#000" opacity={.35}/>{t.rarity!=='Gewoon'&&<Ellipse cx={cx} cy={cy-t.size*.32*k} rx={t.size*.68*k} ry={t.size*.58*k} fill={colors[t.rarity]} opacity={.22}/>}</React.Fragment>;})}
  </Svg>
  {targets.map(t=>{const hit=tapHitFeedback(t,s.effects,now),beat=hit?clamp((now-hit.at)/130):1,pop=hit&&!reducedMotion?1-.2*Math.sin(Math.PI*beat):1,flash=hit?1-beat:0,left=t.required-t.hits;
   return <View key={t.bugId} pointerEvents="none" testID={`original-tap-target-${t.index}`} style={{position:'absolute',left:t.motion.x*3.6*k,top:t.motion.y*6.4*k,width:t.size*k,height:t.size*k,alignItems:'center',justifyContent:'center',transform:[...(reducedMotion?[]:[{rotate:`${t.motion.rotate}deg`}]),{scaleX:2-pop},{scaleY:pop}]}}>
    <SpriteView id={TAP_PORTRAITS.get(t.bugId)??'beetle'} size={t.size*ART*k}/>
    {flash>0&&<View style={{position:'absolute',left:0,top:0,right:0,bottom:0,borderRadius:t.size*k,backgroundColor:'#FFFFFF',opacity:.45*flash}}/>}
    {t.frozen&&<View style={{position:'absolute',left:-2*k,top:-2*k,right:-2*k,bottom:-2*k,borderRadius:t.size*k,borderWidth:2,borderColor:'#A0F8FF',backgroundColor:'#60CCF822'}}/>}
    {/* remaining taps: one segment per tap, in rarity colour (P13 bar above the bug) */}
    <View style={{position:'absolute',top:-(11+t.size*(ART-1)/2)*k,left:t.size*.08*k,right:t.size*.08*k,height:7*k,flexDirection:'row',gap:1.5*k,padding:1,borderRadius:4*k,backgroundColor:'#06191899'}}>{Array.from({length:t.required},(_,i)=><View key={i} style={{flex:1,borderRadius:2*k,backgroundColor:i<left?colors[t.rarity]:'#E0484855'}}/>)}</View>
   </View>;})}
  <Svg pointerEvents="none" style={{position:'absolute',left:0,top:0}} width={360*k} height={640*k}>
   {s.effects.filter(e=>e.helper>=0&&!['hit','catch'].includes(e.kind)&&now-e.at<300).map((e,i)=>{const age=now-e.at,x=360*(e.helper+.5)/ticket.squad.length,c=trail[e.kind as keyof typeof trail]??'#FFD477',o=1-clamp(age/(reducedMotion?120:300));return <React.Fragment key={i}><Line x1={x*k} y1={600*k} x2={e.x*k} y2={e.y*k} stroke={c} strokeWidth={5*k} strokeLinecap="round" opacity={o*.85}/><Line x1={x*k} y1={600*k} x2={e.x*k} y2={e.y*k} stroke="#FFFFFF" strokeWidth={1.6*k} strokeLinecap="round" opacity={o}/>{e.targets.map((p,j)=><Line key={j} x1={e.x*k} y1={e.y*k} x2={p.x*k} y2={p.y*k} stroke={c} strokeWidth={3*k} opacity={o}/>)}</React.Fragment>;})}
   {!reducedMotion&&s.effects.filter(e=>e.kind==='hit'&&now-e.at<180).map((e,i)=>{const age=now-e.at;return <React.Fragment key={'h'+i}><Circle cx={e.x*k} cy={e.y*k} r={(10+age*.2)*k} stroke="#FFF7D6" strokeWidth={3.5*k} fill="none" opacity={1-age/180}/><Circle cx={e.x*k} cy={e.y*k} r={(4+age*.1)*k} fill="#FFFFFF" opacity={.5*(1-clamp(age/90))}/></React.Fragment>;})}
   {taps.current.filter(t=>now-t.at>=0&&now-t.at<200).map((t,i)=><Circle key={'t'+i} cx={t.x*k} cy={t.y*k} r={(7+(reducedMotion?0:(now-t.at)*.09))*k} stroke="#FFFFFF" strokeWidth={2*k} fill="none" opacity={.55*(1-(now-t.at)/200)}/>)}
   {!reducedMotion&&s.effects.filter(e=>e.kind==='catch'&&now-e.at<280).map((e,i)=>{const f=clamp((now-e.at)/280);return SPARKS.map((a,j)=><Line key={'c'+i+'_'+j} x1={(e.x+Math.cos(a)*(16+44*f))*k} y1={(e.y+Math.sin(a)*(16+44*f))*k} x2={(e.x+Math.cos(a)*(28+58*f))*k} y2={(e.y+Math.sin(a)*(28+58*f))*k} stroke={j%2?'#FFF2AB':'#FFFFFF'} strokeWidth={3*k} strokeLinecap="round" opacity={1-f}/>);})}
  </Svg>
  {/* type impact of a helper and the catch burst: atlas frames, short and capped */}
  {s.effects.filter(e=>(e.kind==='catch'&&now-e.at<220)||(e.helper>=0&&!['hit','catch'].includes(e.kind)&&now-e.at<200)).slice(-6).map((e,i)=>{const [atlas,name]=e.kind==='catch'?['fx-extra','bug-impact'] as const:helperFx[e.kind as keyof typeof helperFx]??helperFx.burst,age=now-e.at,size=(e.kind==='catch'?112:62)*k*(reducedMotion?1:.7+.5*clamp(age/180));return <View key={'f'+i} pointerEvents="none" style={{position:'absolute',left:e.x*k-size/2,top:e.y*k-size/2,opacity:1-clamp(age/220)}}><ArcadeIcon atlas={atlas} name={name} size={size}/></View>;})}
  {s.effects.filter(e=>e.kind==='catch'&&now-e.at<560).map((e,i)=>{const age=now-e.at,rise=reducedMotion?0:36*clamp(age/250),grow=reducedMotion?1:1+.35*Math.sin(Math.PI*clamp(age/180));return <Text pointerEvents="none" key={'p'+i} style={{position:'absolute',left:(e.x-45)*k,width:90*k,textAlign:'center',top:(e.y-38-rise)*k,transform:[{scale:grow}],fontFamily:font,fontWeight:'900',color:'#FFF2AB',fontSize:30*k,textShadowColor:'#000C',textShadowRadius:4,opacity:age<250?1:1-(age-250)/310}}>+{e.points}</Text>;})}
  {s.combo>=2&&<View pointerEvents="none" testID="tap-combo" style={{position:'absolute',top:10*k,alignSelf:'center',left:0,right:0,alignItems:'center'}}><View style={{paddingHorizontal:14*k,paddingVertical:4*k,borderRadius:20*k,backgroundColor:'#0E2828D9',borderWidth:1,borderColor:'#F2C14E99',transform:[{scale:pulse}]}}><Text style={{fontFamily:font,fontWeight:'900',fontSize:20*k,color:'#F2C14E'}}>×{s.combo}</Text></View></View>}
  {/* squad: glass circles with a cooldown ring; one support chip in the middle (P13) */}
  <View pointerEvents="none" style={{position:'absolute',left:0,right:0,bottom:10*k,flexDirection:'row',justifyContent:'space-around',alignItems:'flex-end'}}>{ticket.squad.map((b,i)=>{const ready=s.helperReadyAt[i]??0,span=spans.current[i]?.span??1,f=ready>now?1-clamp((ready-now)/span):1,R=31*k,C=2*Math.PI*(R-3*k),on=f>=1;
   return <View key={b.id} accessibilityLabel={on?'Helper klaar':'Helper laadt'} style={{width:2*R,height:2*R,borderRadius:R,backgroundColor:'#0E2828CC',alignItems:'center',justifyContent:'center',boxShadow:on?'0px 0px 16px #1FC3D399':undefined}}>
    <SpriteView id={b.species} shiny={b.shiny} size={50*k}/>
    {/* the helper's main type: it decides how this bug helps (sticky/shield/splash/zap/burst in the simulator) */}
    {!!b.types?.[0]&&<View style={{position:'absolute',right:-4*k,bottom:-4*k,width:24*k,height:24*k,borderRadius:12*k,backgroundColor:'#0E2828',borderWidth:1,borderColor:'#BFF3EC66',alignItems:'center',justifyContent:'center'}}><ArcadeIcon atlas="types" name={b.types[0]} size={18*k}/></View>}
    <Svg style={{position:'absolute',left:0,top:0}} width={2*R} height={2*R}><Circle cx={R} cy={R} r={R-3*k} stroke="#FFFFFF22" strokeWidth={4*k} fill="none"/><Circle cx={R} cy={R} r={R-3*k} stroke={on?'#6BEFF2':'#1FC3D3'} strokeWidth={4*k} fill="none" strokeDasharray={`${C*f} ${C}`} strokeLinecap="round" transform={`rotate(-90 ${R} ${R})`}/></Svg>
   </View>;})}</View>
  {assist>0&&<View pointerEvents="none" style={{position:'absolute',bottom:80*k,alignSelf:'center',left:0,right:0,alignItems:'center'}}><View style={{flexDirection:'row',alignItems:'center',gap:4*k,paddingHorizontal:12*k,paddingVertical:4*k,borderRadius:18*k,backgroundColor:'#0E2828D9',borderWidth:1,borderColor:'#BFF3EC47'}}><ArcadeIcon atlas="types" name="bug" size={18*k}/><Text style={{fontFamily:font,fontWeight:'800',fontSize:14*k,color:'#EAF6F2'}}>+{assist}%</Text></View></View>}
 </View>;
}
