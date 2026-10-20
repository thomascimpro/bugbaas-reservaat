import React from 'react';
import { Image, View } from 'react-native';
import type { ItemId } from '../game/catalog';
import { GAME_ART } from './art';
import metadata from '../assets/art/meta.json';

export function ArtImage({ asset, size = 28, width = size, height = size, label }: { asset: string; size?: number; width?: number; height?: number; label?: string }) {
  const m = (metadata as Record<string, { width: number; height: number; bounds: number[] }>)[asset];
  const [left, top, right, bottom] = m.bounds;
  const scale = Math.min(width / (right - left), height / (bottom - top));
  return <View accessible={!!label} accessibilityRole={label ? 'image' : undefined} accessibilityLabel={label} style={{ width, height, overflow: 'hidden' }}><Image accessible={false} source={GAME_ART[asset]} resizeMethod="resize" style={{ position: 'absolute', width: m.width * scale, height: m.height * scale, left: (width - (right - left) * scale) / 2 - left * scale, top: (height - (bottom - top) * scale) / 2 - top * scale, resizeMode: 'stretch' }} /></View>;
}

export type IconName = 'meadow' | 'soil' | 'pond' | 'night' | 'team' | 'book' | 'arena' | 'attack' | 'spark' | 'heart' | 'shield' | 'speed' | 'nectar' | 'compass' | 'clock' | 'check' | 'arrow' | 'account' | 'close' | 'info' | 'crown' | 'upgrade' | 'target';
export function Icon({ name, size = 28, color }: { name: IconName; size?: number; color?: string }) {
  return <ArtImage asset={'icons/' + name} size={size} />;
}
export function ItemArt({ id, size = 56 }: { id: ItemId; size?: number }) {
  return <ArtImage asset={'items/' + id} size={size} />;
}
export function GameCrest({ size = 52 }: { size?: number }) {
  return <ArtImage asset="crest" size={size} />;
}
