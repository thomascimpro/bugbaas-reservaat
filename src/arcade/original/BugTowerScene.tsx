// Original tower layout, sprite crops and platform/pickup render helpers.
import React,{useEffect,useRef} from 'react';
import {DimensionValue,Image,ImageBackground,Platform as RNPlatform,Pressable,StyleSheet,Text,View} from 'react-native';
import type {OriginalSceneProps} from '../../../game/arcade/original/types';
import type {BugTowerState,TowerPickup,TowerPlatform as Platform} from '../../../game/arcade/original/bugTower';
import {towerZone,towerCharge,towerChainProgress,towerAnimationFrame} from '../../../game/arcade/original/bugTower';
const towerBackground=require('../../../assets/v3/original/tower/bug-tower-background.jpg');
const towerJungleBackground=require('../../../assets/v3/original/tower/bug-tower-jungle.jpg');
const towerForgeBackground=require('../../../assets/v3/original/tower/bug-tower-forge.jpg');
const towerSkyBackground=require('../../../assets/v3/original/tower/bug-tower-sky.jpg');
const towerVoidBackground=require('../../../assets/v3/original/tower/bug-tower-void.jpg');
const towerBackgrounds=[towerBackground,towerJungleBackground,towerForgeBackground,towerSkyBackground,towerVoidBackground];
const beetleSpriteSheet=require('../../../assets/v3/original/tower/bug-tower-beetle.webp');
const webHoldStyle=RNPlatform.OS==='web'?({touchAction:'none',userSelect:'none',WebkitTouchCallout:'none',WebkitUserSelect:'none'} as any):undefined;
export function BugTowerScene({state:s,scale,onInput,reducedMotion}:OriginalSceneProps<BugTowerState>){
 const emit=useRef(onInput),held=useRef<-1|0|1>(0);emit.current=onInput;
 const begin=(direction:-1|1)=>{held.current=direction;emit.current({x:direction===-1?250:750,y:500,action:'down',control:direction===-1?'left':'right'});};
 const release=()=>{const direction=held.current;if(!direction)return;held.current=0;emit.current({x:direction===-1?250:750,y:500,action:'up',control:direction===-1?'left':'right'});};
 useEffect(()=>{if(RNPlatform.OS!=='web')return;const key=(e:KeyboardEvent)=>{if(e.repeat||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();begin(e.key==='ArrowLeft'?-1:1);},up=(e:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight'].includes(e.key))release();};document.addEventListener('pointerup',release,true);window.addEventListener('blur',release);window.addEventListener('keydown',key);window.addEventListener('keyup',up);return()=>{document.removeEventListener('pointerup',release,true);window.removeEventListener('blur',release);window.removeEventListener('keydown',key);window.removeEventListener('keyup',up);};},[]);
 const reaction=useRef({grounded:s.player.grounded,launchAt:-1e9,landAt:-1e9});if(reaction.current.grounded&&!s.player.grounded&&s.player.vy<0)reaction.current.launchAt=s.elapsedMs;if(!reaction.current.grounded&&s.player.grounded)reaction.current.landAt=s.elapsedMs;reaction.current.grounded=s.player.grounded;const landAge=s.elapsedMs-reaction.current.landAt,launchAge=s.elapsedMs-reaction.current.launchAt,squash=reducedMotion?0:landAge<120?.18*Math.sin(Math.PI*landAge/120):launchAge<100?-.14*Math.sin(Math.PI*launchAge/100):0;
 const charge=towerCharge(s),chain=s.chainUntil>s.elapsedMs,rocket=s.rocketUntil>s.elapsedMs;
 return <View testID="original-bug-tower" style={[styles.game,{width:360*scale,height:640*scale}]}>
  <View style={styles.hud}><View accessibilityLabel={'Etage '+s.floor} style={styles.hudChip}><Text style={styles.hudText}>🍃 {s.floor}</Text></View><View accessibilityLabel={s.combo>0?'Combo '+s.combo:towerZone(s.floor)} style={[styles.hudChip,s.combo>0&&styles.hudChipActive]}><Text style={styles.hudText}>{s.combo>0?`×${s.combo}`:towerZone(s.floor)}</Text></View></View>
  <View style={styles.playfield}><ImageBackground resizeMode="cover" source={towerBackgrounds[Math.floor(s.floor/100)%towerBackgrounds.length]} style={styles.background}>
   <View style={styles.backgroundShade}/>
   {s.elapsedMs<12000&&<View pointerEvents="none" style={styles.chainTutorial}><Text style={styles.chainTutorialText}>Land → tik → salto</Text></View>}
   {s.platforms.map(platform=><TowerPlatform key={platform.id} platform={platform}/>)}{s.pickups.map(pickup=><TowerPickupView key={pickup.id} pickup={pickup}/>)}
   <View style={[styles.controlLayer,webHoldStyle]}>
    <Pressable accessibilityLabel="Ren links en laat los om te springen" testID="bug-tower-left-control" style={[styles.controlHalf,webHoldStyle,s.manualDirection===-1&&styles.controlHalfActive]} unstable_pressDelay={0} onPressIn={()=>begin(-1)} onPressOut={RNPlatform.OS==='web'?undefined:release}><Text style={styles.controlArrow}>‹</Text></Pressable>
    <Pressable accessibilityLabel="Ren rechts en laat los om te springen" testID="bug-tower-right-control" style={[styles.controlHalf,webHoldStyle,s.manualDirection===1&&styles.controlHalfActive]} unstable_pressDelay={0} onPressIn={()=>begin(1)} onPressOut={RNPlatform.OS==='web'?undefined:release}><Text style={styles.controlArrow}>›</Text></Pressable>
   </View>
   {chain&&<View pointerEvents="none" style={[styles.chainPrompt,percentPosition(s.player.x,s.player.y)]}><View style={styles.chainRing}/><Text style={styles.chainText}>TIK!</Text></View>}
   {chain&&<View pointerEvents="none" testID="bug-tower-chain-window" style={styles.chainTiming}><Text style={styles.chainTimingText}>TIK NU → EXTRA FLIP</Text><View style={styles.chainTimingTrack}><View style={[styles.chainTimingFill,{width:`${towerChainProgress(s)*100}%`}]}/></View></View>}
   <View pointerEvents="none" style={[styles.player,percentPosition(s.player.x,s.player.y),{transform:[{rotate:`${reducedMotion?0:s.player.spinAngle}deg`},{scaleX:1+squash},{scaleY:1-squash}]}]}><BugTowerSprite frame={towerAnimationFrame(s)}/>{rocket&&<View style={styles.rocketFlame}/>}</View>
   {landAge<120&&<View pointerEvents="none" testID="tower-landing-effect" style={{position:'absolute',...percentPosition(s.player.x,s.player.y+5),width:50,height:10,marginLeft:-25,borderRadius:25,borderWidth:2,borderColor:'#BFF3EC',opacity:1-landAge/120,transform:[{scaleX:reducedMotion?1:1+landAge/100}]}}/>}
   <View pointerEvents="none" style={styles.controls}><View style={styles.chargeMeter}><Text style={styles.chargeLabel}>{s.springReady?'MEGA SPRONG KLAAR':s.player.spinning?'SALTO!':charge>=58?'SALTO KLAAR':'SPRONGKRACHT'}</Text><View style={styles.chargeTrack}><View style={[styles.chargeFill,{width:`${charge}%`}]}/></View><Text style={styles.chargeValue}>{charge}%</Text></View></View>
  </ImageBackground></View>
 </View>;
}
function percentPosition(x:number,y:number){return {left:`${x}%` as DimensionValue,top:`${y}%` as DimensionValue};}

function TowerPlatform({ platform }: { platform: Platform }) {
  const zone = Math.floor(platform.floor / 100) % towerBackgrounds.length;
  return (
    <View style={[styles.platform, zone === 1 && styles.platformJungle, zone === 2 && styles.platformForge, zone === 3 && styles.platformSky, zone === 4 && styles.platformVoid, {
      left: `${platform.x}%` as DimensionValue,
      top: `${platform.y}%` as DimensionValue,
      width: `${platform.width}%` as DimensionValue
    }]}>
      <View style={styles.platformShine} />
      <Text numberOfLines={1} style={styles.floorNumber}>#{platform.floor}</Text>
    </View>
  );
}

function TowerPickupView({ pickup }: { pickup: TowerPickup }) {
  return (
    <View pointerEvents="none" style={[styles.pickup, percentPosition(pickup.x, pickup.y)]}>
      {pickup.kind === "coin" && <View style={styles.coin}><View style={styles.coinInset} /></View>}
      {pickup.kind === "rocket" && <View style={styles.rocketPickup}><Text style={styles.rocketPickupText}>▲</Text></View>}
      {pickup.kind === "spring" && <View style={styles.springPickup}><Text style={styles.springPickupText}>MEGA</Text></View>}
    </View>
  );
}

function BugTowerSprite({ frame, large = false }: { frame: number; large?: boolean }) {
  const column = frame % 3;
  const row = Math.floor(frame / 3);
  const size = large ? 126 : 64;
  const sheetSize = size * 3;
  const cellHeight = sheetSize / 2;
  const cropOffset = large ? 20 : 10;
  return (
    <View style={[styles.spriteFrame, { height: large ? 142 : 72, width: size }]}>
      <Image
        accessibilityIgnoresInvertColors
        source={beetleSpriteSheet}
        style={{
          height: sheetSize,
          left: -column * size,
          position: "absolute",
          top: -row * cellHeight - cropOffset,
          width: sheetSize
        }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  background: { flex: 1, overflow: "hidden" },
  backgroundShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(3,8,28,0.14)" },
  body: { color: "#dce9ff", fontSize: 15, fontWeight: "700", lineHeight: 22, textAlign: "center" },
  closeButton: { alignItems: "center", backgroundColor: "#f8fbff", borderRadius: 10, height: 44, justifyContent: "center", width: 44 },
  closeText: { color: "#0b1638", fontSize: 24, fontWeight: "900" },
  chargeFill: { backgroundColor: "#facc15", borderRadius: 999, height: "100%" },
  chargeLabel: { color: "#f8fbff", fontSize: 9, fontWeight: "900" },
  chargeMeter: { alignItems: "center", backgroundColor: "rgba(7,17,50,0.78)", borderRadius: 12, gap: 3, paddingHorizontal: 8, paddingVertical: 7, width: 104 },
  chargeTrack: { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 999, height: 7, overflow: "hidden", width: "100%" },
  chargeValue: { color: "#bae6fd", fontSize: 10, fontWeight: "900" },
  chainPrompt: { alignItems: "center", height: 86, justifyContent: "center", marginLeft: -43, marginTop: -43, position: "absolute", width: 86, zIndex: 10 },
  chainRing: { borderColor: "#facc15", borderRadius: 999, borderWidth: 3, height: 66, position: "absolute", width: 66 },
  chainTiming: { alignSelf: "center", backgroundColor: "rgba(5,46,22,0.94)", borderColor: "#4ade80", borderRadius: 12, borderWidth: 2, bottom: 104, gap: 5, paddingHorizontal: 12, paddingVertical: 8, position: "absolute", width: 210, zIndex: 12 },
  chainTimingFill: { backgroundColor: "#4ade80", borderRadius: 999, height: "100%" },
  chainTimingText: { color: "#dcfce7", fontSize: 11, fontWeight: "900", textAlign: "center" },
  chainTimingTrack: { backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 999, height: 8, overflow: "hidden" },
  chainTutorial: { alignItems: "center", alignSelf: "center", backgroundColor: "rgba(14,40,40,0.88)", borderColor: "rgba(242,193,78,0.6)", borderRadius: 16, borderWidth: 1, gap: 2, paddingHorizontal: 12, paddingVertical: 6, position: "absolute", top: 44, zIndex: 10 },
  chainTutorialText: { color: "#fff7b2", fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },
  chainTutorialTitle: { color: "#f8fbff", fontSize: 9, fontWeight: "900" },
  chainText: { color: "#fff7b2", fontSize: 12, fontWeight: "900" },
  coin: { alignItems: "center", backgroundColor: "#facc15", borderColor: "#fff7ae", borderRadius: 999, borderWidth: 2, height: 18, justifyContent: "center", width: 18 },
  coinInset: { borderColor: "#b45309", borderRadius: 999, borderWidth: 2, height: 8, width: 8 },
  controlArrow: { color: "rgba(255,255,255,0.7)", fontSize: 48, fontWeight: "900", lineHeight: 50 },
  controlHalf: { alignItems: "center", flex: 1, justifyContent: "flex-end", paddingBottom: 18 },
  controlHalfActive: { backgroundColor: "rgba(31,195,211,0.16)" },
  controlLayer: { ...StyleSheet.absoluteFillObject, flexDirection: "row", zIndex: 6 },
  controlSideLabel: { color: "rgba(220,233,255,0.75)", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  controlHint: { alignSelf: "center", backgroundColor: "rgba(4,12,38,0.72)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, position: "absolute", top: 8, zIndex: 8 },
  controlHintText: { color: "#dce9ff", fontSize: 11, fontWeight: "900" },
  controls: { alignItems: "center", bottom: 14, left: "50%", marginLeft: -52, position: "absolute", zIndex: 12 },
  difficultyChip: { backgroundColor: "rgba(103,65,217,0.28)", borderColor: "rgba(167,139,250,0.8)", borderRadius: 999, borderWidth: 1, color: "#ede9fe", fontSize: 11, fontWeight: "900", paddingHorizontal: 9, paddingVertical: 6 },
  difficultyRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  game: { flex: 1 },
  header: { alignItems: "center", backgroundColor: "#071330", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 8 },
  hud: { alignItems: "center", backgroundColor: "#071d1b", flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 40, paddingHorizontal: 10, paddingVertical: 5 },
  hudChip: { alignItems: "center", backgroundColor: "rgba(14,40,40,0.9)", borderColor: "rgba(191,243,236,0.28)", borderRadius: 999, borderWidth: 1, justifyContent: "center", minHeight: 28, minWidth: 64, paddingHorizontal: 10 },
  hudChipActive: { backgroundColor: "rgba(242,193,78,0.18)", borderColor: "#F2C14E" },
  hudText: { color: "#EAF6F2", fontSize: 14, fontWeight: "900" },
  floorNumber: { backgroundColor: "rgba(5,13,36,0.86)", borderColor: "rgba(255,255,255,0.5)", borderRadius: 5, borderWidth: 1, color: "#fff", fontSize: 9, fontWeight: "900", paddingHorizontal: 4, paddingVertical: 1, position: "absolute", right: 4, top: -18 },
  meta: { color: "#9fb4dd", fontSize: 12, fontWeight: "800" },
  panel: { alignItems: "center", alignSelf: "center", backgroundColor: "rgba(7,19,48,0.94)", borderColor: "#5dd9ff", borderRadius: 16, borderWidth: 1, gap: 14, margin: 16, maxWidth: 520, padding: 20 },
  panelTitle: { color: "#f8fbff", fontSize: 26, fontWeight: "900", textAlign: "center" },
  platform: { backgroundColor: "#4bc7ed", borderBottomColor: "#163e85", borderBottomWidth: 6, borderColor: "#d9f8ff", borderRadius: 8, borderTopWidth: 2, height: 12, position: "absolute", zIndex: 4 },
  platformForge: { backgroundColor: "#f97316", borderBottomColor: "#7c2d12", borderColor: "#ffedd5" },
  platformJungle: { backgroundColor: "#22c55e", borderBottomColor: "#14532d", borderColor: "#dcfce7" },
  platformShine: { backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 999, height: 2, left: 5, position: "absolute", right: 5, top: 2 },
  platformSky: { backgroundColor: "#38bdf8", borderBottomColor: "#075985", borderColor: "#f0f9ff" },
  platformVoid: { backgroundColor: "#ec4899", borderBottomColor: "#701a75", borderColor: "#fce7f3" },
  pickup: { alignItems: "center", height: 30, justifyContent: "center", marginLeft: -15, marginTop: -15, position: "absolute", width: 30, zIndex: 8 },
  player: { alignItems: "center", height: 72, justifyContent: "center", marginLeft: -32, marginTop: -36, position: "absolute", width: 64, zIndex: 7 },
  playfield: { flex: 1 },
  primaryButton: { alignItems: "center", backgroundColor: "#168b65", borderRadius: 10, justifyContent: "center", minHeight: 52, paddingHorizontal: 20, width: "100%" },
  primaryText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  readyBackground: { flex: 1, justifyContent: "center" },
  readyShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,7,24,0.35)" },
  score: { color: "#facc15", fontSize: 58, fontWeight: "900" },
  secondaryButton: { alignItems: "center", borderColor: "#dce9ff", borderRadius: 10, borderWidth: 1, justifyContent: "center", minHeight: 48, paddingHorizontal: 20, width: "100%" },
  secondaryText: { color: "#f8fbff", fontSize: 16, fontWeight: "900" },
  rocketFlame: { backgroundColor: "#facc15", borderColor: "#fb923c", borderRadius: 999, borderWidth: 2, bottom: -14, height: 22, position: "absolute", width: 12 },
  rocketPickup: { alignItems: "center", backgroundColor: "#f97316", borderColor: "#ffedd5", borderRadius: 8, borderWidth: 2, height: 24, justifyContent: "center", width: 20 },
  rocketPickupText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  shell: { backgroundColor: "#050d24", flex: 1 },
  springPickup: { alignItems: "center", backgroundColor: "#22c55e", borderColor: "#dcfce7", borderRadius: 999, borderWidth: 2, height: 30, justifyContent: "center", width: 42 },
  springPickupText: { color: "#fff", fontSize: 8, fontWeight: "900", letterSpacing: 0.4, lineHeight: 10 },
  spriteFrame: { overflow: "hidden" },
  squadOverlay: { position: "absolute", right: 8, top: 42, zIndex: 9 },
  title: { color: "#f8fbff", fontSize: 24, fontWeight: "900" }
});
