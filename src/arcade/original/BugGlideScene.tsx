// Original sky layout, bee sprite and entity helpers from BugGlideGame.tsx.
import React,{useEffect,useRef,useState} from 'react';
import {DimensionValue,Image,Platform,Pressable,StyleSheet,Text,View} from 'react-native';
import {SpriteView} from '../../artV2';
import type {OriginalSceneProps} from '../../../game/arcade/original/types';
import type {BugGlideState,GlideEntity as Entity} from '../../../game/arcade/original/bugGlide';
type BeeDirection='down'|'right'|'up';
const beeSpriteSheet=require('../../../assets/v3/original/glide/Bumble Bee Sprite Sheet.png');
const shieldEffectImage=require('../../../assets/v3/original/glide/duel_effect_shield_hd.png');
const windEffectImage=require('../../../assets/v3/original/glide/duel_effect_lightning_hd.png');
const nectarImage=require('../../../assets/v3/original/glide/glide_nectar.png');
const pollenImage=require('../../../assets/v3/original/glide/glide_pollen.png');
const rainImage=require('../../../assets/v3/original/glide/glide_rain.png');
const thornImage=require('../../../assets/v3/original/glide/glide_thorn.png');
const canopyImage=require('../../../assets/v3/arcade/canopy.webp');
const leftControlStripWidth=32;
export function BugGlideScene({state:s,scale,onInput,reducedMotion}:OriginalSceneProps<BugGlideState>){
 const [box,setBox]=useState({width:360,height:600}),emit=useRef(onInput),current=useRef(s);emit.current=onInput;current.current=s;
 useEffect(()=>{if(Platform.OS!=='web')return;const key=(e:KeyboardEvent)=>{if(e.repeat||!['ArrowLeft','ArrowRight','ArrowUp',' '].includes(e.key))return;e.preventDefault();emit.current({x:e.key==='ArrowLeft'?100:e.key==='ArrowRight'?900:Math.round(current.current.x*10),y:500,action:'down'});};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
 const reactions=useRef({pickups:s.pickups,hits:s.hits,pickupAt:-1e9,hitAt:-1e9});if(s.pickups>reactions.current.pickups)reactions.current.pickupAt=s.elapsedMs;if(s.hits>reactions.current.hits)reactions.current.hitAt=s.elapsedMs;reactions.current.pickups=s.pickups;reactions.current.hits=s.hits;const pickupAge=s.elapsedMs-reactions.current.pickupAt,hitAge=s.elapsedMs-reactions.current.hitAt,flapAge=s.elapsedMs-(s.tapPulses.at(-1)?.at??-1e9),flap=reducedMotion?1:1+.12*Math.sin(Math.PI*Math.min(1,flapAge/140));
 const shield=s.elapsedMs<s.shieldUntil,tailwind=s.elapsedMs<s.windUntil,gameScale=.86*Math.max(.85,Math.min(1.5,scale)),beeFrame=reducedMotion?0:Math.floor(s.elapsedMs/100)%4,beeDirection:BeeDirection=s.vy<-.45?'up':s.vy>1.25?'down':'right';
 return <View testID="original-bug-glide" style={[styles.game,{width:360*scale,height:640*scale}]}>
  <View style={styles.hud}><HudChip active={shield} icon={shield?'🛡':'♥'} label={shield?'':`${s.hearts}`}/><HudChip active={tailwind} icon={tailwind?'↯':'🔥'} label={tailwind?'':`×${s.streak}`}/></View>
  <View style={styles.sky} onLayout={e=>setBox(e.nativeEvent.layout)}>
   <View style={styles.glideBackdrop}><Image source={canopyImage} resizeMode="cover" style={StyleSheet.absoluteFillObject}/><View style={styles.moonGlow}/><View style={styles.windTrailOne}/><View style={styles.windTrailTwo}/><View style={styles.windTrailThree}/><View style={styles.leafOne}/><View style={styles.leafTwo}/><View style={styles.leafThree}/><View style={styles.pollenCloudOne}/><View style={styles.pollenCloudTwo}/><View style={styles.pollenCloudThree}/></View>
   <View pointerEvents="none" style={[styles.previewZone,{left:'72%'}]}/><View pointerEvents="none" style={styles.leftControlStrip}><View style={styles.leftControlStripGrip}/></View><View pointerEvents="none" style={[styles.flightZoneLine,{left:'72%'}]}/><View style={styles.skyShade}/>
   {s.entities.map(entity=><EntityView key={entity.id} entity={entity} scale={gameScale}/>)}
   {!reducedMotion&&s.tapPulses.map((pulse,i)=><View key={pulse.at+':'+i} pointerEvents="none" style={[styles.tapPulse,{left:`${pulse.x}%`,top:`${pulse.y}%`}]}/>)}
   <View pointerEvents="none" style={[styles.player,{left:`${s.x}%`,top:`${s.y}%`,transform:[{scale:gameScale},{rotate:`${reducedMotion?0:Math.max(-14,Math.min(14,s.vx*6))}deg`},{scaleY:flap}]}]}><LifePips current={s.hearts} max={3+s.assist.extraHeart}/><BeeSprite direction={beeDirection} frame={beeFrame}/>{shield&&<Image resizeMode="contain" source={shieldEffectImage} style={styles.playerShield}/>}</View>
   {(pickupAge<250||hitAge<120)&&<View pointerEvents="none" testID="glide-pickup-reaction" style={{position:'absolute',left:`${s.x}%`,top:`${s.y}%`,width:78,height:78,marginLeft:-18,marginTop:-18,borderRadius:39,borderWidth:3,borderColor:hitAge<120?'#F2B6A8':'#F2C14E',opacity:Math.max(0,1-Math.min(pickupAge,hitAge)/(hitAge<120?120:250)),transform:[{scale:reducedMotion?gameScale:gameScale*(1+Math.min(pickupAge,hitAge)/280)}]}}/>}
   <Pressable testID="bug-glide-sky-control" accessibilityLabel="Tik links of rechts van je bug om te sturen" style={styles.skyTouchLayer} onPress={e=>onInput({x:Math.round(Math.max(0,Math.min(1000,e.nativeEvent.locationX/box.width*1000))),y:Math.round(Math.max(0,Math.min(1000,e.nativeEvent.locationY/box.height*1000))),action:'down'})}/>
  </View>
 </View>;
}

function BeeSprite({ direction, frame }: { direction: BeeDirection; frame: number }) {
  const row = direction === "up" ? 2 : direction === "down" ? 3 : 0;
  return (
    <View style={styles.beeSpriteFrame}>
      <View style={{width:64,height:64,transform:[{scale:1.8}]}}><Image accessibilityIgnoresInvertColors source={beeSpriteSheet} style={[styles.beeSpriteSheet, { left: -frame * 64, top: -row * 64 }]} /></View>
    </View>
  );
}

function HudChip({ active = false, icon, label }: { active?: boolean; icon: string; label: string }) {
  return (
    <View style={[styles.hudChip, active && styles.hudChipActive]}>
      <Text style={styles.hudIcon}>{icon}</Text>
      <Text style={styles.hudText}>{label}</Text>
    </View>
  );
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


function EntityView({ entity, scale }: { entity: Entity; scale: number }) {
  const position = { left: `${entity.x}%` as DimensionValue, top: `${entity.y}%` as DimensionValue, transform: [{ scale }] };
  if (entity.kind === "bird") return <View style={[styles.entity, styles.hazard, position]}><SpriteView id="hornet" size={48} /></View>;
  if (entity.kind === "thorn") return <View style={[styles.entity, styles.thorn, position]}><Image accessibilityIgnoresInvertColors resizeMode="contain" source={thornImage} style={styles.objectImage} /></View>;
  if (entity.kind === "rain") return <View style={[styles.entity, styles.rain, position]}><Image accessibilityIgnoresInvertColors resizeMode="contain" source={rainImage} style={styles.objectImage} /></View>;
  if (entity.kind === "heart") return <View style={[styles.entity, styles.pickup, position]}><Text style={styles.heartPickup}>+</Text></View>;
  if (entity.kind === "shield") return <View style={[styles.entity, styles.pickup, position]}><Image accessibilityIgnoresInvertColors resizeMode="contain" source={shieldEffectImage} style={styles.objectImage} /></View>;
  if (entity.kind === "wind") return <View style={[styles.entity, styles.pickup, position]}><Image accessibilityIgnoresInvertColors resizeMode="contain" source={windEffectImage} style={styles.objectImage} /></View>;
  return <View style={[styles.entity, styles.pickup, position]}><Image accessibilityIgnoresInvertColors resizeMode="contain" source={entity.kind === "nectar" ? nectarImage : pollenImage} style={styles.objectImage} /></View>;
}


const styles = StyleSheet.create({
  glideBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0b2a1c", overflow: "hidden" },
  beeSpriteFrame: { height: 64, overflow: "hidden", width: 64 },
  beeSpriteSheet: { height: 256, position: "absolute", width: 256 },
  body: { color: "#dfe9df", fontSize: 15, fontWeight: "700", lineHeight: 22, textAlign: "center" },
  closeButton: { alignItems: "center", backgroundColor: "#f9fbf7", borderRadius: 10, height: 44, justifyContent: "center", width: 44 },
  closeText: { color: "#102018", fontSize: 24, fontWeight: "900" },
  entity: { alignItems: "center", height: 56, justifyContent: "center", marginLeft: -28, marginTop: -28, position: "absolute", width: 56, zIndex: 4 },
  game: { flex: 1, position: "relative" },
  leafOne: { backgroundColor: "#1f7a3f", borderRadius: 999, height: 120, left: -38, opacity: 0.55, position: "absolute", top: 82, transform: [{ rotate: "34deg" }], width: 54 },
  leafThree: { backgroundColor: "#5f8f2f", borderRadius: 999, bottom: 46, height: 150, opacity: 0.42, position: "absolute", right: -36, transform: [{ rotate: "-28deg" }], width: 62 },
  leafTwo: { backgroundColor: "#2f9e44", borderRadius: 999, height: 92, opacity: 0.36, position: "absolute", right: 28, top: 176, transform: [{ rotate: "-42deg" }], width: 42 },
  leftControlStrip: { alignItems: "center", backgroundColor: "rgba(14,40,40,0.78)", borderRightColor: "rgba(191,243,236,0.35)", borderRightWidth: 2, bottom: 0, justifyContent: "center", left: 0, position: "absolute", top: 0, width: leftControlStripWidth, zIndex: 12 },
  leftControlStripGrip: { backgroundColor: "rgba(249,251,247,0.7)", borderRadius: 999, height: 58, width: 4 },
  lifePip: { backgroundColor: "#22c55e", borderColor: "#f9fbf7", borderRadius: 999, borderWidth: 1, height: 9, width: 20 },
  lifePipEmpty: { backgroundColor: "rgba(239,68,68,0.45)", borderColor: "rgba(249,251,247,0.45)" },
  lifePips: { flexDirection: "row", gap: 3, position: "absolute", top: -14, zIndex: 9 },
  moonGlow: { backgroundColor: "rgba(255,244,191,0.42)", borderRadius: 999, height: 96, opacity: 0.8, position: "absolute", right: 36, top: 34, width: 96 },
  pollenCloudOne: { backgroundColor: "rgba(245,159,0,0.42)", borderRadius: 999, height: 18, left: 80, position: "absolute", top: 86, width: 18 },
  pollenCloudThree: { backgroundColor: "rgba(245,159,0,0.32)", borderRadius: 999, bottom: 134, height: 15, position: "absolute", right: 96, width: 15 },
  pollenCloudTwo: { backgroundColor: "rgba(255,244,191,0.36)", borderRadius: 999, height: 12, left: 168, position: "absolute", top: 190, width: 12 },
  hazard: { backgroundColor: "rgba(239,68,68,0.18)", borderColor: "#ef4444", borderRadius: 14, borderWidth: 3 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 8 },
  heartPickup: { color: "#f9fbf7", fontSize: 40, fontWeight: "900", lineHeight: 44 },
  hud: { alignItems: "center", backgroundColor: "#071d1b", flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 34, paddingBottom: 5, paddingHorizontal: 12, paddingTop: 4 },
  hudChip: { alignItems: "center", backgroundColor: "rgba(14,40,40,0.9)", borderColor: "rgba(191,243,236,0.28)", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 4, justifyContent: "center", minHeight: 28, minWidth: 64, paddingHorizontal: 10 },
  hudChipActive: { backgroundColor: "rgba(31,195,211,0.22)", borderColor: "#1FC3D3" },
  hudIcon: { color: "#f9fbf7", fontSize: 12, fontWeight: "900" },
  hudText: { color: "#EAF6F2", fontSize: 14, fontWeight: "900" },
  legendBad: { backgroundColor: "rgba(239,68,68,0.16)", borderColor: "rgba(239,68,68,0.72)" },
  legendGood: { backgroundColor: "rgba(34,197,94,0.14)", borderColor: "rgba(34,197,94,0.62)" },
  legendGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", width: "100%" },
  legendIcon: { color: "#f9fbf7", fontSize: 16, fontWeight: "900" },
  legendItem: { alignItems: "center", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 5, minHeight: 32, paddingHorizontal: 10 },
  legendLabel: { color: "#f9fbf7", fontSize: 12, fontWeight: "900" },
  meta: { color: "#a9b8ae", fontSize: 12, fontWeight: "800" },
  objectImage: { height: 52, width: 52 },
  panel: { alignItems: "center", backgroundColor: "rgba(16,32,24,0.94)", borderColor: "#d7bd57", borderRadius: 10, borderWidth: 1, gap: 14, margin: 16, padding: 18 },
  panelTitle: { color: "#f9fbf7", fontSize: 26, fontWeight: "900", textAlign: "center" },
  pickup: { backgroundColor: "rgba(34,197,94,0.18)", borderColor: "#22c55e", borderRadius: 999, borderWidth: 3 },
  player: { alignItems: "center", backgroundColor: "rgba(5,32,29,0.45)", borderRadius: 39, height: 78, justifyContent: "center", marginLeft: -39, marginTop: -39, position: "absolute", width: 78, zIndex: 6 },
  playerShield: { height: 92, opacity: 0.72, position: "absolute", width: 92, zIndex: 10 },
  primaryButton: { alignItems: "center", backgroundColor: "#168251", borderRadius: 8, justifyContent: "center", minHeight: 52, paddingHorizontal: 20, width: "100%" },
  primaryText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  previewLabel: { color: "rgba(249,251,247,0.58)", fontSize: 10, fontWeight: "900", letterSpacing: 1, position: "absolute", textTransform: "uppercase", top: 50, zIndex: 2 },
  previewZone: { backgroundColor: "rgba(255,255,255,0.05)", borderLeftColor: "rgba(255,255,255,0.18)", borderLeftWidth: 1, bottom: 0, position: "absolute", right: 0, top: 0, zIndex: 1 },
  flightZoneLine: { backgroundColor: "rgba(249,251,247,0.28)", bottom: 0, position: "absolute", top: 0, width: 2, zIndex: 2 },
  rain: { backgroundColor: "rgba(239,68,68,0.18)", borderColor: "#ef4444", borderRadius: 14, borderWidth: 3 },
  score: { color: "#d7bd57", fontSize: 56, fontWeight: "900" },
  secondaryButton: { alignItems: "center", borderColor: "#d7e1d9", borderRadius: 8, borderWidth: 1, justifyContent: "center", minHeight: 48, paddingHorizontal: 20, width: "100%" },
  secondaryText: { color: "#f9fbf7", fontSize: 16, fontWeight: "900" },
  shell: { backgroundColor: "#071d12", flex: 1 },
  sky: { flex: 1, overflow: "hidden" },
  skyTouchLayer: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  skyShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(3,12,18,0.10)" },
  squadOverlay: { position: "absolute", right: 10, top: 10, zIndex: 8 },
  tapPulse: { backgroundColor: "rgba(215,189,87,0.28)", borderColor: "rgba(249,251,247,0.75)", borderRadius: 999, borderWidth: 2, height: 44, marginLeft: -22, marginTop: -22, position: "absolute", width: 44, zIndex: 3 },
  thorn: { backgroundColor: "rgba(239,68,68,0.18)", borderColor: "#ef4444", borderRadius: 14, borderWidth: 3 },
  title: { color: "#f9fbf7", fontSize: 24, fontWeight: "900" },
  windTrailOne: { backgroundColor: "rgba(120,210,255,0.18)", borderRadius: 999, height: 4, left: -40, position: "absolute", top: 128, transform: [{ rotate: "-12deg" }], width: 340 },
  windTrailThree: { backgroundColor: "rgba(249,251,247,0.12)", borderRadius: 999, bottom: 104, height: 3, left: 18, position: "absolute", transform: [{ rotate: "-18deg" }], width: 280 },
  windTrailTwo: { backgroundColor: "rgba(156,54,181,0.16)", borderRadius: 999, height: 5, left: 44, position: "absolute", top: 238, transform: [{ rotate: "-16deg" }], width: 360 }
});
