import React, { useEffect, useState } from 'react';
import { ImageBackground, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { allyAbility, bugById } from '../game/catalog';
import { nextEnemyPlan } from '../game/engine';
import type { Battle, Fighter } from '../game/types';
import { Badge, BugImage, Button, C, Disclosure, FighterTile, ui, GamePanel } from './ui';
import { SCENES } from './assets';
import { Icon } from './icons';
import type { IconName } from './icons';

export function Encounter({ battle, own, enemies, onAction, busy, canAct = true, arena = false, waiting = '' }: { battle: Battle; own?: Fighter[]; enemies?: Fighter[]; onAction: (actorId: string, move: 'attack' | 'special', targetId: string) => void; busy: boolean; canAct?: boolean; arena?: boolean; waiting?: string }) {
  const compact = useWindowDimensions().width < 480;
  const allies = own ?? battle.allies, opponents = enemies ?? battle.enemies;
  const [actorId, setActor] = useState(allies.find(f => f.hp > 0 && !f.acted)?.id ?? ''), [move, setMove] = useState<'attack' | 'special'>('attack'), [targetId, setTarget] = useState('');
  const actor = allies.find(f => f.id === actorId); const ability = actor ? bugById(actor.bugId).ability : 'strike';
  const friendly = move === 'special' && allyAbility(ability);
  const targets = (friendly ? allies : opponents).filter(f => f.hp > 0);
  useEffect(() => { if (!allies.some(f => f.id === actorId && f.hp > 0 && !f.acted)) { setActor(allies.find(f => f.hp > 0 && !f.acted)?.id ?? ''); setMove('attack'); } }, [battle.turn, allies, actorId]);
  useEffect(() => { if (!targets.some(f => f.id === targetId)) setTarget(targets[0]?.id ?? ''); }, [move, actorId, battle.turn, targetId, targets]);
  const enemy = arena ? null : nextEnemyPlan(battle);
  const specialReady = !!actor && actor.specialReadyRound <= battle.round;
  const ready = canAct && !!actor && actor.hp > 0 && !actor.acted && !!targetId && (move === 'attack' || specialReady);
  const touchOwn = (f: Fighter) => { if (friendly) setTarget(f.id); else if (f.hp > 0 && !f.acted) { setActor(f.id); setMove('attack'); setTarget(''); } };
  const specialIcon: IconName = ['heal', 'teamHeal'].includes(ability) ? 'heart' : ['protect', 'teamArmor'].includes(ability) ? 'shield' : ability === 'slow' ? 'speed' : 'spark';
  return <View style={{ gap: 12 }}>
    <ImageBackground source={SCENES[battle.biomeId]} imageStyle={{ width: '100%', height: '100%' }} style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: C.forest, borderWidth: 2, borderColor: '#a49d69' }}>
      <View style={{ padding: 10, gap: 10, backgroundColor: '#09251a1a' }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#0c2c24eb', borderRadius: 13, padding: 10 }}><Icon name={arena ? 'arena' : 'compass'} color="#e7ce83" size={23} /><View style={{ flex: 1, gap: 2 }}><Text style={{ color: '#e9db9e', fontWeight: '700', fontSize: 11 }}>{arena ? canAct ? 'JOUW BEURT' : 'BEURT TEGENSTANDER' : 'VIJAND PLANT'}</Text><Text style={{ color: C.white, fontSize: 12, lineHeight: 17 }}>{arena ? canAct ? 'Kies een bug, actie en doel' : waiting || 'Je tegenstander is aan zet' : enemy?.label}</Text></View><View style={{ alignItems: 'center', gap: 1 }}><Text style={{ color: '#e4d394', fontWeight: '800', fontSize: 21 }}>{battle.round}</Text><Text style={{ color: '#b4c6a8', fontSize: 9 }}>RONDE</Text></View></View>
        <View style={{ flexDirection: 'row', gap: 3 }}>{opponents.map(f => <FighterTile key={f.id} fighter={f} selected={false} target={!friendly && f.id === targetId} onPress={() => { if (!friendly && f.hp > 0) setTarget(f.id); }} />)}</View>
        <View style={{ alignItems: 'center', height: 32, justifyContent: 'center' }}><View style={{ flexDirection: 'row', gap: 7, alignItems: 'center', paddingHorizontal: 18, paddingVertical: 5, backgroundColor: '#102c24c7', borderRadius: 30 }}><Icon name="arena" size={16} /><Text style={{ color: '#f0dfa2', letterSpacing: 3, fontSize: 10, fontWeight: '800' }}>BUG DUEL</Text></View></View>
        <View style={{ flexDirection: 'row', gap: 3 }}>{allies.map(f => <FighterTile key={f.id} fighter={f} selected={f.id === actorId} target={friendly && f.id === targetId} unavailable={f.acted} onPress={() => touchOwn(f)} />)}</View>
      </View>
    </ImageBackground>
    {actor && <GamePanel style={{ ...ui.card, borderColor: '#a8b195', gap: compact ? 6 : 10, padding: compact ? 12 : 16 }}>
      <View style={ui.row}><BugImage id={actor.bugId} size={compact ? 28 : 42} /><View style={{ flex: 1 }}><Text style={ui.h3}>{bugById(actor.bugId).short}</Text><Text style={ui.small}>Tik op een {friendly ? 'teamgenoot' : 'tegenstander'} als doel</Text></View>{targets.find(f => f.id === targetId) && <BugImage id={targets.find(f => f.id === targetId)!.bugId} size={compact ? 28 : 42} />}</View>
      <View style={{ flexDirection: 'row', gap: 9 }}>{(['attack', 'special'] as const).map(action => <Pressable key={action} accessibilityRole="button" accessibilityState={{ selected: move === action, disabled: action === 'special' && !specialReady }} disabled={action === 'special' && !specialReady} onPress={() => { setMove(action); setTarget(''); }} style={{ flex: 1, minHeight: compact ? 58 : 83, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 15, borderWidth: 2, borderBottomWidth: 4, borderColor: move === action ? '#c7ad65' : C.line, backgroundColor: move === action ? C.forest : C.pale, opacity: action === 'special' && !specialReady ? .5 : 1 }}><Icon name={action === 'attack' ? 'attack' : specialIcon} size={compact ? 24 : 30} color={move === action ? '#e7ce83' : C.forest} /><Text style={{ color: move === action ? C.white : C.forest, fontWeight: '700', fontSize: 12 }}>{action === 'attack' ? 'Aanval' : specialReady ? bugById(actor.bugId).move : `Terug in ronde ${actor.specialReadyRound}`}</Text></Pressable>)}</View>
      <Text style={{ ...ui.small, textAlign: 'center' }}>{move === 'special' ? bugById(actor.bugId).moveText : 'Raak je doel met een gewone aanval.'}</Text>
      <Button icon={move === 'attack' ? 'attack' : specialIcon} disabled={!ready || busy} onPress={() => onAction(actor.id, move, targetId)}>{busy ? 'Actie verwerken…' : canAct ? 'Speel deze actie' : 'Tegenstander aan zet'}</Button>
    </GamePanel>}
    {battle.log.length > 0 && <View style={{ ...ui.row, paddingHorizontal: 5 }}><Icon name="spark" color={C.gold} size={17} /><Text style={{ ...ui.small, flex: 1 }}>{battle.log[battle.log.length - 1]}</Text></View>}
    <Disclosure title="Gevechtslog & uitleg"><Text style={ui.small}>Iedere levende bug handelt één keer per ronde. De gouden rand kiest je bug; de koperen rand markeert het doel.</Text>{battle.log.slice(-8).map((line, i) => <Text key={`${battle.turn}-${i}`} style={ui.small}>{line}</Text>)}</Disclosure>
  </View>;
}
