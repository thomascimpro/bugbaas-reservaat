import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { BUGS, ITEMS, biomeById, bugById, itemById } from '../game/catalog';
import type { BiomeId } from '../game/catalog';
import { statsFor } from '../game/engine';
import type { Player, SquadSlot } from '../game/types';
import { Badge, BugImage, C, Disclosure, ItemBadge, Scene, StatLine, ui, GamePanel } from './ui';
import { Icon, ItemArt } from './icons';

export function TeamEditor({ player, squad, onChange, biomeId, equal = false }: { player: Player; squad: SquadSlot[]; onChange: (s: SquadSlot[]) => void; biomeId: BiomeId; equal?: boolean }) {
  const [slot, setSlot] = useState(0), selected = squad[slot];
  const { width } = useWindowDimensions(); const portraitSize = Math.min(116, Math.max(62, (Math.min(width, 900) - 100) / 3));
  const bug = bugById(selected.bugId);
  const available = BUGS.filter(b => equal || player.owned[b.id]);
  function changeBug(id: string) {
    const other = squad.findIndex((s, index) => s.bugId === id && index !== slot);
    const next = squad.map(s => ({ ...s })); if (other >= 0) [next[slot].bugId, next[other].bugId] = [next[other].bugId, next[slot].bugId]; else next[slot].bugId = id; onChange(next);
  }
  function changeItem(id: SquadSlot['itemId']) { const next = squad.map(s => ({ ...s })); for (let i = 0; i < next.length; i++) if (i !== slot && id !== 'none' && next[i].itemId === id) next[i].itemId = 'none'; next[slot].itemId = id; onChange(next); }
  return <View style={{ gap: 16 }}>
    <Scene biomeId={biomeId} height={portraitSize + 118}><View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', flex: 1 }}>{squad.map((s, i) => <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Teamplaats ${i + 1}: ${bugById(s.bugId).short}`} accessibilityState={{ selected: slot === i }} onPress={() => setSlot(i)} style={{ flex: 1, alignItems: 'center', borderRadius: 16, borderWidth: 2, borderColor: i === slot ? '#ead591' : 'transparent', backgroundColor: i === slot ? '#daeab52b' : 'transparent', paddingVertical: 7, gap: 4 }}><View style={{ position: 'absolute', right: 3, top: 3 }}><ItemBadge id={s.itemId} size={20} /></View><BugImage id={s.bugId} size={portraitSize} /><View style={{ backgroundColor: '#11382de8', padding: 7, borderRadius: 9, width: '100%' }}><Text numberOfLines={1} style={{ color: C.white, fontSize: 10, fontWeight: '700', textAlign: 'center' }}>{bugById(s.bugId).short}</Text><Text style={{ color: '#e6d699', fontSize: 10, textAlign: 'center', marginTop: 3 }}>{equal ? 'Lv 3' : `Lv ${player.owned[s.bugId]?.level ?? 1}`} · {i + 1}</Text></View></Pressable>)}</View></Scene>
    <GamePanel style={ui.card}>
      <View style={ui.row}><Text style={ui.h2}>{bug.short}</Text><Badge icon="team">{bug.role}</Badge></View>
      <StatLine stats={statsFor(bug.id, equal ? 3 : player.owned[bug.id]?.level ?? 1, selected.itemId, biomeId, squad)} />
      <Text style={ui.h3}>Uitrusting</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>{ITEMS.map(i => <Pressable key={i.id} accessibilityRole="button" accessibilityLabel={`${i.name} voor ${bug.short}`} accessibilityState={{ selected: selected.itemId === i.id }} onPress={() => changeItem(i.id)} style={{ flex: 1, minHeight: 65, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 2, borderBottomWidth: 4, borderColor: selected.itemId === i.id ? '#bea15a' : C.line, backgroundColor: selected.itemId === i.id ? '#f1e5bd' : '#f4f2e5' }}><ItemArt id={i.id} size={42} />{selected.itemId === i.id && <View style={{ position: 'absolute', bottom: 2, right: 2 }}><Icon name="check" color={C.forest} size={14} /></View>}</Pressable>)}</View>
      <View style={{ gap: 4 }}><Text style={ui.h3}>{itemById(selected.itemId).name}</Text><Text style={ui.small}>{itemById(selected.itemId).text}</Text></View>
      <Disclosure title={`${bug.move} · eigenschap & teambonus`}><Text style={ui.body}>{bug.trait}</Text><Text style={ui.body}>{bug.move}: {bug.moveText}</Text><Text style={ui.small}>Stats inclusief voorwerp, teameigenschappen en {biomeById(biomeId).name}. Een voorwerp is één keer beschikbaar; verplaatsen maakt de andere plek vrij.</Text></Disclosure>
    </GamePanel>
    <Text style={ui.h3}>Kies een bewoner voor plaats {slot + 1}</Text>
    <View style={ui.grid}>{available.map(b => <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`Kies ${b.short}`} onPress={() => changeBug(b.id)} style={{ width: '30%', minWidth: 92, flexGrow: 1, alignItems: 'center', borderWidth: 1, borderColor: b.id === selected.bugId ? C.forest : C.line, borderRadius: 14, padding: 10, backgroundColor: b.id === selected.bugId ? C.pale : C.white }}><BugImage id={b.id} size={72} /><Text style={{ ...ui.small, color: C.ink, textAlign: 'center', fontWeight: '700' }}>{b.short}</Text><Text style={{ ...ui.small, textAlign: 'center' }}>{b.role}</Text></Pressable>)}</View>
  </View>;
}
