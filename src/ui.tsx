import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, ImageBackground, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { bugById, itemById } from '../game/catalog';
import type { Stats } from '../game/catalog';
import type { Fighter } from '../game/types';
import type { StyleProp, ViewStyle } from 'react-native';
import { SCENES } from './assets';
import { ArtImage, Icon, ItemArt } from './icons';
import { GAME_ART } from './art';
import type { IconName } from './icons';

export const C = { paper: '#eeeede', white: '#fcf9ec', forest: '#153b2f', moss: '#77934c', ink: '#24372e', muted: '#637568', line: '#d7d5ba', gold: '#b58b37', copper: '#b5694c', pale: '#e5ead8', red: '#b45143' };
export const ui = StyleSheet.create({
  page: { gap: 16, padding: 16, width: '100%', maxWidth: 900, alignSelf: 'center', paddingBottom: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  card: { backgroundColor: C.white, borderWidth: 1, borderBottomWidth: 3, borderColor: C.line, borderRadius: 20, padding: 16, gap: 12 },
  h1: { fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif', fontSize: 33, lineHeight: 40, color: C.forest, fontWeight: '700' },
  h2: { fontSize: 21, color: C.ink, fontWeight: '700' },
  h3: { fontSize: 16, color: C.ink, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, color: C.ink },
  small: { fontSize: 12, lineHeight: 18, color: C.muted },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', color: C.moss },
  muted: { color: C.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  input: { minHeight: 48, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, color: C.ink, backgroundColor: C.white, fontSize: 15 },
});
export function Button({ children, onPress, disabled = false, secondary = false, compact = false, label, icon = 'arrow' }: { children: React.ReactNode; onPress: () => void; disabled?: boolean; secondary?: boolean; compact?: boolean; label?: string; icon?: IconName }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({ pressed }) => ({ minHeight: compact ? 44 : 52, borderRadius: 14, borderWidth: 1, borderBottomWidth: pressed ? 1 : 4, borderColor: disabled ? C.line : secondary ? '#c7d0b3' : '#08281e', paddingHorizontal: compact ? 12 : 18, paddingVertical: compact ? 8 : 11, backgroundColor: disabled ? C.line : secondary ? C.pale : C.forest, opacity: pressed ? .85 : 1, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' })}>
    <Image accessible={false} source={GAME_ART[secondary ? 'frames/secondary' : 'frames/primary']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, width: '100%', height: '100%', opacity: disabled ? .2 : 1, resizeMode: 'stretch' }} />
    <Icon name={icon} size={compact ? 23 : 29} color={disabled ? C.muted : secondary ? C.forest : '#e7ce83'} />
    <Text style={{ color: disabled ? C.muted : secondary ? C.forest : C.white, fontSize: compact ? 13 : 15, fontWeight: '700', textAlign: 'center' }}>{children}</Text>
  </Pressable>;
}
export function Badge({ children, color = C.forest, icon }: { children: React.ReactNode; color?: string; icon?: IconName }) { return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 30, backgroundColor: color + '13', paddingHorizontal: 10, paddingVertical: 6 }}>{icon && <Icon name={icon} size={16} color={color} />}<Text style={{ fontSize: 11, color, fontWeight: '700' }}>{children}</Text></View>; }
export function StatLine({ stats }: { stats: Stats }) {
  return <View style={{ flexDirection: 'row', gap: 5 }}>
    {([['Leven', stats.hp, 'heart', C.red], ['Kracht', stats.power, 'attack', C.copper], ['Pantser', stats.armor, 'shield', '#548492'], ['Tempo', stats.speed, 'speed', C.gold]] as const).map(([key, value, icon, color]) => <View key={key} accessibilityLabel={`${key}: ${value}`} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: color + '0e', borderRadius: 12, borderWidth: 1, borderColor: color + '28', gap: 3 }}><Icon name={icon} color={color} size={24} /><Text style={{ fontSize: 18, fontWeight: '800', color: C.forest }}>{value}</Text><Text style={{ fontSize: 10, color: C.muted }}>{key}</Text></View>)}
  </View>;
}
export function BugImage({ id, size = 96, faded = false }: { id: string; size?: number; faded?: boolean }) { return <View style={{ opacity: faded ? .15 : 1 }}><ArtImage asset={'bugs/' + id} size={size} label={bugById(id).name} /></View>; }
export function GamePanel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) { return <View style={[ui.card, style, { borderWidth: 0, backgroundColor: C.white, overflow: 'hidden' }]}><Image accessible={false} source={GAME_ART['frames/panel']} style={{ ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'stretch', borderRadius: 20 }} />{children}</View>; }
export function Title({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) { return <View style={{ gap: 6 }}><Text style={ui.eyebrow}>{eyebrow}</Text><Text style={ui.h1}>{title}</Text>{description && <Text style={ui.body}>{description}</Text>}</View>; }
export function Disclosure({ title = 'Spelregels & tips', children }: { title?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: 10 }}><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7 }}><Icon name={open ? 'close' : 'info'} color={C.muted} size={18} /><Text style={{ ...ui.small, fontWeight: '700' }}>{title}</Text></Pressable>{open && <View style={{ gap: 8 }}>{children}</View>}</View>;
}
export function Scene({ biomeId, height = 220, children }: { biomeId: string; height?: number; children: React.ReactNode }) {
  return <ImageBackground source={SCENES[biomeId]} imageStyle={{ width: '100%', height: '100%' }} style={{ height, borderRadius: 22, overflow: 'hidden', backgroundColor: C.forest, borderWidth: 1, borderColor: '#8e915d' }}><View style={{ flex: 1, padding: 16, backgroundColor: '#09271922' }}>{children}</View></ImageBackground>;
}
export function ItemBadge({ id, size = 30 }: { id: Fighter['itemId']; size?: number }) { return <View accessibilityLabel={itemById(id).name} style={{ backgroundColor: '#fbf5da', borderRadius: size, borderWidth: 1, borderColor: '#cfb875', width: size + 6, height: size + 6, alignItems: 'center', justifyContent: 'center' }}><ItemArt id={id} size={size} /></View>; }
export function FloatingBug({ id, size, delay = 0 }: { id: string; size: number; delay?: number }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined; let alive = true;
    const start = async (reduced?: boolean) => { animation?.stop(); y.setValue(0); if (reduced ?? await AccessibilityInfo.isReduceMotionEnabled()) return; if (!alive) return; animation = Animated.loop(Animated.sequence([Animated.delay(delay), Animated.timing(y, { toValue: -7, duration: 1900, useNativeDriver: false }), Animated.timing(y, { toValue: 0, duration: 1900, useNativeDriver: false })])); animation.start(); };
    void start(); const event = AccessibilityInfo.addEventListener('reduceMotionChanged', v => void start(v));
    return () => { alive = false; animation?.stop(); event.remove(); };
  }, [id, delay, y]);
  return <Animated.View style={{ transform: [{ translateY: y }] }}><BugImage id={id} size={size} /></Animated.View>;
}
export function PageEnter({ children }: { children: React.ReactNode }) {
  const entry = useRef(new Animated.Value(0)).current;
  useEffect(() => { let alive = true; let motion: Animated.CompositeAnimation | undefined; AccessibilityInfo.isReduceMotionEnabled().then(reduced => { if (!alive) return; if (reduced) entry.setValue(1); else { motion = Animated.timing(entry, { toValue: 1, duration: 260, useNativeDriver: false }); motion.start(); } }); return () => { alive = false; motion?.stop(); }; }, [entry]);
  return <Animated.View style={{ opacity: entry, transform: [{ translateY: entry.interpolate({ inputRange: [0, 1], outputRange: [9, 0] }) }] }}>{children}</Animated.View>;
}
export function RewardBurst() {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => { let alive = true; let motion: Animated.CompositeAnimation | undefined; AccessibilityInfo.isReduceMotionEnabled().then(reduced => { if (!alive || reduced) return; motion = Animated.timing(progress, { toValue: 1, duration: 1600, useNativeDriver: false }); motion.start(); }); return () => { alive = false; motion?.stop(); }; }, [progress]);
  return <View pointerEvents="none" style={{ position: 'absolute', width: 0, height: 0, left: '50%', top: '45%' }}>{Array.from({ length: 10 }, (_, i) => { const angle = i / 10 * Math.PI * 2; return <Animated.View key={i} style={{ position: 'absolute', left: -11, top: -11, opacity: progress.interpolate({ inputRange: [0, .1, .7, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * 128] }) }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * 95 - 18] }) }, { scale: progress.interpolate({ inputRange: [0, .2, 1], outputRange: [.3, 1, .7] }) }] }}><Icon name={i % 2 ? 'spark' : 'nectar'} size={22} color="#ffe4a1" /></Animated.View>; })}</View>;
}
export function FighterTile({ fighter, selected, target, onPress, unavailable = false }: { fighter: Fighter; selected: boolean; target: boolean; onPress: () => void; unavailable?: boolean }) {
  const { width } = useWindowDimensions(); const size = width < 480 ? 68 : Math.min(142, Math.max(68, (Math.min(width, 900) - 80) / 3));
  const bug = bugById(fighter.bugId); const move = useRef(new Animated.Value(0)).current; const scale = useRef(new Animated.Value(1)).current;
  const health = useRef(new Animated.Value(fighter.hp / fighter.stats.hp)).current;
  const prior = useRef({ hp: fighter.hp, acted: fighter.acted }); const [delta, setDelta] = useState(0); const reduced = useRef(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(v => { reduced.current = v; }); const event = AccessibilityInfo.addEventListener('reduceMotionChanged', v => { reduced.current = v; }); return () => event.remove(); }, []);
  useEffect(() => {
    const meter = Animated.timing(health, { toValue: Math.max(0, Math.min(1, fighter.hp / fighter.stats.hp)), duration: reduced.current ? 0 : 430, useNativeDriver: false }); meter.start();
    const difference = fighter.hp - prior.current.hp;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (difference) { setDelta(difference); timer = setTimeout(() => setDelta(0), 1200); if (!reduced.current) Animated.sequence([Animated.timing(scale, { toValue: difference > 0 ? 1.1 : .88, duration: 130, useNativeDriver: false }), Animated.spring(scale, { toValue: 1, useNativeDriver: false })]).start(); }
    if (fighter.acted && !prior.current.acted && !reduced.current) Animated.sequence([Animated.timing(move, { toValue: -18, duration: 140, useNativeDriver: false }), Animated.spring(move, { toValue: 0, useNativeDriver: false })]).start();
    prior.current = { hp: fighter.hp, acted: fighter.acted };
    return () => { if (timer) clearTimeout(timer); meter.stop(); };
  }, [fighter.hp, fighter.acted, fighter.stats.hp, move, scale, health]);
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${bug.short}, ${fighter.hp} van ${fighter.stats.hp} leven, level ${fighter.level}, ${itemById(fighter.itemId).name}${selected ? ', geselecteerd' : ''}`} style={{ flex: 1, alignItems: 'center', padding: 3, borderRadius: 16, backgroundColor: selected ? '#daeab529' : target ? '#ea9c5436' : 'transparent', borderColor: selected ? '#e2d892' : target ? '#f0ae79' : 'transparent', borderWidth: 2, opacity: fighter.hp <= 0 ? .3 : unavailable ? .62 : 1, gap: 3 }}>
    <View style={{ width: '82%', height: 15, position: 'absolute', top: size - 10, backgroundColor: selected ? '#eed79055' : '#12261566', borderRadius: 70, borderWidth: selected || target ? 2 : 0, borderColor: target ? '#f1af6c' : '#e8dc99' }} />
    <Animated.View style={{ transform: [{ translateY: move }, { scale }] }}><BugImage id={bug.id} size={size} /></Animated.View>
    <View style={{ position: 'absolute', top: 1, right: 1 }}>{fighter.itemId !== 'none' && <ItemBadge id={fighter.itemId} size={20} />}</View>
    {delta !== 0 && <Text style={{ position: 'absolute', top: 35, fontSize: 30, fontWeight: '900', color: delta > 0 ? '#d5ffa4' : '#fff0df', textShadowColor: '#3e3020', textShadowRadius: 4 }}>{delta > 0 ? '+' : ''}{delta}</Text>}
    <View style={{ width: '100%', backgroundColor: '#102f26ec', borderRadius: 10, padding: 6, gap: 4 }}>
      <Text numberOfLines={1} style={{ fontSize: 10, color: C.white, fontWeight: '700', textAlign: 'center' }}>{bug.short}</Text>
      <View style={{ height: 6, borderRadius: 10, backgroundColor: '#081e19', overflow: 'hidden' }}><Animated.View style={{ width: health.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), height: 6, backgroundColor: fighter.hp < fighter.stats.hp * .3 ? '#e88966' : '#b9d277' }} /></View>
      <Text style={{ fontSize: 10, color: '#e2e5cc', textAlign: 'center' }}>{fighter.hp}/{fighter.stats.hp} · Lv {fighter.level}{fighter.acted ? ' · klaar' : ''}</Text>
    </View>
  </Pressable>;
}
