// Original running layout/render helpers copied from WebRunnerGame.tsx; mechanics
// live in game/arcade/original/webRunner.ts. Source provenance is recorded there.
import React,{useEffect,useMemo,useRef} from 'react';
import {DimensionValue,Image,PanResponder,Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import {SpriteView} from '../../artV2';
import type {OriginalSceneProps} from '../../../game/arcade/original/types';
import type {RunnerEntity,WebRunnerState} from '../../../game/arcade/original/webRunner';
import {classifyWebRunnerGesture} from '../../../game/arcade/original/originalWebRunnerGesture';
const webRunnerTunnelImage=require('../../../assets/v3/original/runner/web-runner-tunnel-v1.jpg');
const shieldEffectImage=require('../../../assets/v3/original/runner/duel_effect_shield_hd.png');
const speedEffectImage=require('../../../assets/v3/original/runner/duel_effect_lightning_hd.png');
const webEffectImage=require('../../../assets/v3/original/runner/duel_effect_goo_hd.png');
const coinPickupImage=require('../../../assets/v3/original/runner/web_coin.png');
const gemPickupImage=require('../../../assets/v3/original/runner/web_gem.png');
const maxHits=3;
export function WebRunnerScene({state:s,ticket,scale,onInput,reducedMotion}:OriginalSceneProps<WebRunnerState>){
 const emit=useRef(onInput);emit.current=onInput;
 const control=(name:string)=>emit.current({x:500,y:500,action:'down',control:name});
 const pan=useMemo(()=>PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,onPanResponderRelease:(_,g)=>{const action=classifyWebRunnerGesture(g.dx,g.dy);if(action!=='none')control(action);}}),[]);
 useEffect(()=>{if(Platform.OS!=='web')return;const key=(e:KeyboardEvent)=>{if(e.repeat)return;const action=e.key==='ArrowLeft'?'left':e.key==='ArrowRight'?'right':['ArrowUp',' '].includes(e.key)?'jump':null;if(action){e.preventDefault();control(action);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
 const jumping=s.elapsedMs<s.jumpUntil,status=s.shield?'Schild':s.elapsedMs<s.magnetUntil?'Magneet':s.elapsedMs<s.boostUntil?'Boost':jumping?'Sprong':`Combo ${s.combo}`,playfieldScale=.82*Math.max(1,Math.min(2,scale));
 const contact=useRef({hearts:s.hearts,shield:s.shield,hitAt:-1e9,breakAt:-1e9});if(s.hearts<contact.current.hearts)contact.current.hitAt=s.elapsedMs;if(contact.current.shield&&!s.shield)contact.current.breakAt=s.elapsedMs;contact.current.hearts=s.hearts;contact.current.shield=s.shield;const hitAge=s.elapsedMs-contact.current.hitAt,breakAge=s.elapsedMs-contact.current.breakAt;
 const bug=ticket.squad[0];
 return <View testID="original-web-runner" style={[styles.game,{width:360*scale,height:640*scale}]}>
  <View style={styles.hud}><View accessibilityLabel={s.hearts+' van 3 levens'} style={styles.chip}><Text style={styles.hudText}>{Array.from({length:maxHits},(_,i)=>i<s.hearts?'❤':'♡').join(' ')}</Text></View><View accessibilityLabel={status} style={[styles.chip,status!==`Combo ${s.combo}`&&styles.chipOn]}><Text style={styles.hudText}>{s.shield?'🛡️':s.elapsedMs<s.magnetUntil?'🧲 '+Math.ceil((s.magnetUntil-s.elapsedMs)/1000)+'s':s.elapsedMs<s.boostUntil?'⚡ '+Math.ceil((s.boostUntil-s.elapsedMs)/1000)+'s':'×'+s.combo}</Text></View></View>
  <View accessibilityLabel="Veeg links/rechts, tik of veeg omhoog om te springen" style={styles.playfield} {...pan.panHandlers}>
   <Image source={webRunnerTunnelImage} resizeMode="cover" style={styles.backgroundArt}/><View style={styles.distanceShade}/>
   {[0,1,2].map(lane=><View key={lane} style={[styles.lane,s.lane===lane&&styles.activeLane]}></View>)}
   {s.entities.map(entity=><RunnerEntityView key={entity.id} entity={entity} scale={playfieldScale}/>)}
   {(hitAge<120||breakAge<180)&&<View pointerEvents="none" testID="runner-contact-effect" style={{position:'absolute',left:laneLeft(s.lane),top:'84%',marginLeft:-46,marginTop:-46,width:92,height:92,borderRadius:46,borderWidth:breakAge<180?4:3,borderColor:breakAge<180?'#8CDFEE':'#F2B6A8',opacity:Math.max(0,1-Math.min(hitAge,breakAge)/(breakAge<180?180:120)),transform:[{scale:reducedMotion?1:1+Math.min(hitAge,breakAge)/300}]}}/>}
   <View style={[styles.jumpArc,jumping&&styles.jumpArcActive,{left:laneLeft(s.lane),transform:[{scale:playfieldScale}]}]}/>
   <View style={[styles.playerShadow,{left:laneLeft(s.lane),opacity:jumping?.34:1,transform:[{scale:jumping?playfieldScale*.62:playfieldScale}]}]}/>
   <View pointerEvents="none" style={[styles.player,jumping&&styles.playerJump,{left:laneLeft(s.lane),transform:[{scale:jumping?playfieldScale*1.12:playfieldScale}]}]}>
    {s.elapsedMs<s.magnetUntil&&<View style={styles.magnetRing}/>}{s.elapsedMs<s.boostUntil&&<View style={styles.boostTrail}/>}
    {s.shield&&<Image resizeMode="contain" source={shieldEffectImage} style={styles.playerEffect}/>}
    <SpriteView id={bug?.species??'midge'} shiny={bug?.shiny} size={88} animate/>
   </View>
  </View>
  <View style={styles.controls}>
   <Pressable accessibilityLabel="Baan naar links" style={styles.controlButton} onPress={()=>control('left')}><Text style={styles.controlText}>◀</Text></Pressable>
   <Pressable accessibilityLabel="Spring over webben" disabled={jumping} style={[styles.controlButton,styles.jumpButton,jumping&&styles.jumpButtonDisabled]} onPress={()=>control('jump')}><Text style={[styles.controlText,styles.jumpText]}>⤒</Text></Pressable>
   <Pressable accessibilityLabel="Baan naar rechts" style={styles.controlButton} onPress={()=>control('right')}><Text style={styles.controlText}>▶</Text></Pressable>
  </View>
 </View>;
}

function LifePips({ current, max }: { current: number; max: number }) {
  return (
    <View style={styles.lifePips}>
      {Array.from({ length: max }).map((_, index) => (
        <View key={index} style={[styles.lifePip, index >= current && styles.lifePipEmpty]} />
      ))}
    </View>
  );
}

function RunnerEntityView({ entity, scale }: { entity: RunnerEntity; scale: number }) {
  const left = laneLeft(entity.lane);
  const top = `${entity.y}%` as DimensionValue;
  if (entity.kind === "web") {
    return <View style={[styles.entity, styles.webEntity, { left, top, transform: [{ scale }] }]}><Image accessibilityIgnoresInvertColors resizeMode="contain" source={webEffectImage} style={styles.webArt} /></View>;
  }
  if (entity.kind === "flyer") {
    return <View style={[styles.entity, styles.flyerEntity, { left, top, transform: [{ rotate: "7deg" }, { scale }] }]}><SpriteView id="wasp_2" size={66} /></View>;
  }
  if (entity.kind === "shield") {
    return <View style={[styles.entity, styles.pickupEntity, { left, top, transform: [{ scale }] }]}><Image accessibilityIgnoresInvertColors resizeMode="contain" source={shieldEffectImage} style={styles.pickupArt} /></View>;
  }
  if (entity.kind === "boost") {
    return <View style={[styles.entity, styles.pickupEntity, { left, top, transform: [{ scale }] }]}><Image accessibilityIgnoresInvertColors resizeMode="contain" source={speedEffectImage} style={styles.pickupArt} /></View>;
  }
  return (
    <View style={[styles.entity, styles.pickupEntity, entity.kind === "magnet" && styles.magnetEntity, { left, top, transform: [{ scale }] }]}>
      <Image accessibilityIgnoresInvertColors resizeMode="contain" source={entity.kind === "magnet" ? gemPickupImage : coinPickupImage} style={styles.pickupArt} />
    </View>
  );
}

function laneLeft(lane: 0 | 1 | 2): DimensionValue {
  return `${16.666 + lane * 33.333}%` as DimensionValue;
}


const styles = StyleSheet.create({
  activeLane: { backgroundColor: "rgba(140,223,238,0.17)", borderColor: "rgba(170,240,250,0.7)" },
  activeLaneLabel: { backgroundColor: "#d7bd57", color: "#102018" },
  backgroundArt: { bottom: 0, left: 0, opacity: 0.95, position: "absolute", right: 0, top: 0 },
  body: { color: "#dfe9df", fontSize: 15, fontWeight: "700", lineHeight: 22, textAlign: "center" },
  closeButton: { alignItems: "center", backgroundColor: "#f9fbf7", borderRadius: 10, height: 44, justifyContent: "center", width: 44 },
  closeText: { color: "#102018", fontSize: 24, fontWeight: "900" },
  controlButton: { alignItems: "center", backgroundColor: "rgba(14,40,40,0.92)", borderColor: "rgba(191,243,236,0.35)", borderWidth: 1, borderRadius: 24, flex: 1, justifyContent: "center", minHeight: 56, overflow: "hidden" },
  controlText: { color: "#EAF6F2", fontSize: 24, fontWeight: "900" },
  jumpText: { color: "#052825" },
  chip: { backgroundColor: "rgba(14,40,40,0.9)", borderColor: "rgba(191,243,236,0.28)", borderRadius: 14, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  chipOn: { borderColor: "#1FC3D3" },
  magnetRing: { borderColor: "#6FC8FF", borderRadius: 999, borderWidth: 2, height: 96, position: "absolute", width: 96 },
  boostTrail: { backgroundColor: "rgba(107,239,242,0.35)", borderRadius: 999, bottom: -30, height: 60, position: "absolute", width: 26 },
  controls: { backgroundColor: "#071d1b", flexDirection: "row", gap: 8, paddingBottom: 12, paddingHorizontal: 12, paddingTop: 10 },
  distanceShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(7,29,18,0.26)" },
  enemyLabel: { backgroundColor: "#ef4444", borderColor: "#f9fbf7", borderRadius: 999, borderWidth: 1, color: "#f9fbf7", fontSize: 8, fontWeight: "900", overflow: "hidden", paddingHorizontal: 5, paddingVertical: 1, position: "absolute", top: -12, zIndex: 2 },
  entity: { alignItems: "center", height: 58, justifyContent: "center", marginLeft: -29, position: "absolute", width: 58, zIndex: 3 },
  flyerEntity: { backgroundColor: "rgba(240,71,107,0.18)", borderColor: "rgba(240,71,107,0.75)", borderRadius: 999, borderWidth: 2, height: 72, marginLeft: -36, transform: [{ rotate: "7deg" }], width: 72 },
  game: { flex: 1, position: "relative" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 8 },
  hud: { alignItems: "center", backgroundColor: "#071d1b", flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 36, paddingBottom: 5, paddingHorizontal: 12, paddingTop: 3 },
  hudText: { color: "#EAF6F2", fontSize: 14, fontWeight: "900" },
  jumpArc: { borderColor: "rgba(215,189,87,0.0)", borderRadius: 999, borderTopWidth: 0, bottom: 42, height: 90, marginLeft: -34, position: "absolute", width: 68, zIndex: 5 },
  jumpArcActive: { borderColor: "rgba(107,239,242,0.75)", borderStyle: "dashed", borderTopWidth: 3 },
  jumpBadge: { backgroundColor: "#102018", borderColor: "#d7bd57", borderRadius: 999, borderWidth: 1, color: "#d7bd57", fontSize: 9, fontWeight: "900", overflow: "hidden", paddingHorizontal: 5, paddingVertical: 1, position: "absolute", top: -13 },
  jumpButton: { backgroundColor: "#1FC3D3", borderColor: "#B2FCFF" },
  jumpButtonDisabled: { backgroundColor: "#0B8EA2", opacity: 0.7 },
  jumpCooldownFill: { backgroundColor: "rgba(16,32,24,0.2)", bottom: 0, left: 0, position: "absolute", top: 0 },
  lane: { alignItems: "center", backgroundColor: "rgba(190,220,255,0.05)", borderColor: "rgba(214,232,255,0.34)", borderLeftWidth: 1.5, borderRightWidth: 1.5, flex: 1, justifyContent: "flex-start", paddingTop: 44 },
  laneLabel: { backgroundColor: "rgba(16,32,24,0.7)", borderRadius: 999, color: "rgba(255,255,255,0.78)", fontSize: 10, fontWeight: "900", overflow: "hidden", paddingHorizontal: 7, paddingVertical: 3 },
  lifePip: { backgroundColor: "#22c55e", borderColor: "#f9fbf7", borderRadius: 999, borderWidth: 1, height: 9, width: 20 },
  lifePipEmpty: { backgroundColor: "rgba(239,68,68,0.45)", borderColor: "rgba(249,251,247,0.45)" },
  lifePips: { flexDirection: "row", gap: 3, position: "absolute", top: -15, zIndex: 9 },
  magnetEntity: { backgroundColor: "rgba(111,200,255,0.16)", borderColor: "rgba(111,200,255,0.6)" },
  meta: { color: "#a9b8ae", fontSize: 12, fontWeight: "800" },
  panel: { alignItems: "center", backgroundColor: "rgba(16,32,24,0.94)", borderColor: "#d7bd57", borderRadius: 10, borderWidth: 1, gap: 14, margin: 16, padding: 18 },
  panelTitle: { color: "#f9fbf7", fontSize: 26, fontWeight: "900", textAlign: "center" },
  readyVisual: { alignItems: "center", borderColor: "rgba(215,189,87,0.72)", borderRadius: 16, borderWidth: 1, height: 150, justifyContent: "center", overflow: "hidden", position: "relative", width: "100%" },
  readyVisualShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(4,18,12,0.28)" },
  readyVisualBug: { alignItems: "center", backgroundColor: "rgba(249,251,247,0.90)", borderColor: "#d7bd57", borderRadius: 48, borderWidth: 3, height: 96, justifyContent: "center", width: 96 },
  pickupArt: { height: 58, width: 58 },
  pickupEntity: { backgroundColor: "rgba(242,193,78,0.14)", borderColor: "rgba(242,193,78,0.45)", borderRadius: 999, borderWidth: 1 },
  player: { alignItems: "center", bottom: 24, height: 74, justifyContent: "center", marginLeft: -37, position: "absolute", width: 74, zIndex: 6 },
  playerEffect: { height: 88, opacity: 0.58, position: "absolute", width: 88 },
  playerJump: { bottom: 118, shadowColor: "#6BEFF2", shadowOffset: { height: 0, width: 0 }, shadowOpacity: 0.75, shadowRadius: 14, transform: [{ scale: 1.12 }] },
  playerShadow: { backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 999, bottom: 18, height: 16, marginLeft: -31, position: "absolute", width: 62, zIndex: 4 },
  playerShadowJump: { opacity: 0.34, transform: [{ scale: 0.62 }] },
  playfield: { flex: 1, flexDirection: "row", gap: 10, overflow: "hidden", padding: 14, paddingBottom: 28 },
  primaryButton: { alignItems: "center", backgroundColor: "#168251", borderRadius: 8, justifyContent: "center", minHeight: 52, paddingHorizontal: 20, width: "100%" },
  primaryText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  score: { color: "#d7bd57", fontSize: 56, fontWeight: "900" },
  secondaryButton: { alignItems: "center", borderColor: "#d7e1d9", borderRadius: 8, borderWidth: 1, justifyContent: "center", minHeight: 48, paddingHorizontal: 20, width: "100%" },
  secondaryText: { color: "#f9fbf7", fontSize: 16, fontWeight: "900" },
  shell: { backgroundColor: "#071d12", flex: 1 },
  squadOverlay: { position: "absolute", right: 10, top: 10, zIndex: 8 },
  title: { color: "#f9fbf7", fontSize: 24, fontWeight: "900" },
  webArt: { height: 70, opacity: 0.9, width: 70 },
  webEntity: { bottom: undefined }
});
