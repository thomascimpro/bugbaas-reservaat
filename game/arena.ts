import { BUGS, allyAbility, bugById } from './catalog';
import { effectiveStat, fighter, performMove, validateSquad } from './engine';
import { GameError } from './types';
import type { Match, Player, SquadSlot } from './types';

function check(condition: unknown, message: string): asserts condition { if (!condition) throw new GameError(message); }
export function arenaTeam(p: Player, squad: SquadSlot[], format: Match['format']) {
  if (format === 'ranked') validateSquad({ ...p, owned: Object.fromEntries(BUGS.map(b => [b.id, { level: 3, copies: 1 }])) }, squad);
  else validateSquad(p, squad);
  return squad.map((s, i) => fighter(s, format === 'ranked' ? 3 : p.owned[s.bugId].level, 'meadow', squad, 'ally', i));
}
export function createMatch(p: Player, squad: SquadSlot[], format: Match['format'], code: string, now: number): Match {
  check(format === 'ranked' || format === 'power', 'Kies een geldige arenavorm.');
  const allies = arenaTeam(p, squad, format);
  return { code, hostUid: p.uid, guestUid: null, hostName: p.name, guestName: null, format,
    status: 'waiting', currentSide: 'host', revision: 0, createdAt: now, updatedAt: now,
    winner: null, settled: false, ratingChange: 0, rated: false,
    battle: { id: code, biomeId: 'meadow', targetId: 'butterfly', turn: 0, round: 1, allies, enemies: [], status: 'active', log: ['De arena is klaar. Deel de uitnodigingscode met een vriend.'], createdAt: now, outcome: null } };
}
export function joinMatch(m: Match, p: Player, squad: SquadSlot[], now: number) {
  check(m.status === 'waiting' && !m.guestUid, 'Dit duel heeft al twee spelers of is gesloten.');
  check(m.hostUid !== p.uid, 'Je kunt niet tegen je eigen account spelen.');
  check(now - m.createdAt < 86400000, 'Deze uitnodiging is verlopen.');
  m.guestUid = p.uid; m.guestName = p.name;
  m.battle.enemies = arenaTeam(p, squad, m.format).map((f, i) => ({ ...f, id: `enemy-${i}` }));
  m.status = 'active'; m.updatedAt = now; m.revision += 1;
  const hostTempo = m.battle.allies.reduce((sum, f) => sum + f.stats.speed, 0);
  const guestTempo = m.battle.enemies.reduce((sum, f) => sum + f.stats.speed, 0);
  m.currentSide = hostTempo === guestTempo ? (m.code.charCodeAt(0) % 2 ? 'host' : 'guest') : hostTempo > guestTempo ? 'host' : 'guest';
  m.battle.log = [`${m.hostName} en ${m.guestName} spelen ${m.format === 'ranked' ? 'met gelijke levels (3)' : 'met eigen levels'}.`, `Het team met het meeste tempo begint; bij gelijk tempo bepaalt de vaste duelcode de volgorde.`];
}
export function advanceMatch(m: Match, uid: string, actorId: string, move: 'attack' | 'special', targetId: string, now: number) {
  check(m.status === 'active', 'Dit duel is niet actief.');
  const side = uid === m.hostUid ? 'host' : uid === m.guestUid ? 'guest' : null;
  check(side, 'Je speelt niet mee in dit duel.'); check(side === m.currentSide, 'Je tegenstander is aan zet.');
  const own = side === 'host' ? m.battle.allies : m.battle.enemies;
  const other = side === 'host' ? m.battle.enemies : m.battle.allies;
  const actor = own.find(f => f.id === actorId); check(actor && actor.hp > 0 && !actor.acted, 'Kies een beschikbare bug van je eigen team.');
  check(move === 'attack' || move === 'special', 'Onbekende duelactie.');
  check(move !== 'special' || actor.specialReadyRound <= m.battle.round, 'Deze actie herstelt nog.');
  const ally = move === 'special' && allyAbility(bugById(actor.bugId).ability);
  const target = (ally ? own : other).find(f => f.id === targetId); check(target && target.hp > 0, 'Kies een geldig doel voor deze actie.');
  const originalAllies = m.battle.allies, originalEnemies = m.battle.enemies;
  m.battle.allies = own; m.battle.enemies = other;
  if (move === 'special' && bugById(actor.bugId).ability === 'protect') target.coverTurn = m.battle.turn + 1;
  performMove(m.battle, actor, move, target);
  if (move === 'special' && bugById(actor.bugId).ability === 'protect') target.coverTurn = m.battle.turn + 1;
  m.battle.allies = originalAllies; m.battle.enemies = originalEnemies;
  actor.acted = true; m.battle.turn += 1; m.revision += 1; m.updatedAt = now;
  const hostAlive = m.battle.allies.filter(f => f.hp > 0), guestAlive = m.battle.enemies.filter(f => f.hp > 0);
  if (!hostAlive.length || !guestAlive.length || m.battle.turn >= 72) {
    m.winner = m.battle.turn >= 72 ? 'draw' : hostAlive.length ? 'host' : 'guest'; m.status = 'finished';
    m.battle.log.push(m.winner === 'draw' ? 'Gelijkspel na de maximale rondeduur.' : `${m.winner === 'host' ? m.hostName : m.guestName} wint de ontmoeting.`);
  } else {
    if ([...hostAlive, ...guestAlive].every(f => f.acted)) {
      m.battle.round += 1; for (const f of [...hostAlive, ...guestAlive]) f.acted = false;
      const hostSpeed = hostAlive.reduce((sum, f) => sum + effectiveStat(f, 'speed', m.battle.round), 0);
      const guestSpeed = guestAlive.reduce((sum, f) => sum + effectiveStat(f, 'speed', m.battle.round), 0);
      m.currentSide = hostSpeed === guestSpeed ? (m.battle.round % 2 ? 'host' : 'guest') : hostSpeed > guestSpeed ? 'host' : 'guest';
      m.battle.log.push(`Ronde ${m.battle.round}: nieuwe teamacties beschikbaar.`);
    } else {
      const opposite = side === 'host' ? 'guest' : 'host';
      const oppositeReady = (opposite === 'host' ? hostAlive : guestAlive).some(f => !f.acted);
      m.currentSide = oppositeReady ? opposite : side;
    }
  }
  m.battle.log = m.battle.log.slice(-60);
}
export function settleMatch(m: Match, host: Player, guest: Player, now: number) {
  if (m.status !== 'finished' || m.settled) return;
  const day = new Date(now).toISOString().slice(0, 10);
  m.rated = m.format === 'ranked' && m.winner !== 'draw' && host.arena.ratedDays[guest.uid] !== day && guest.arena.ratedDays[host.uid] !== day;
  if (m.rated) {
    const expectedHost = 1 / (1 + 10 ** ((guest.arena.rating - host.arena.rating) / 400));
    const change = Math.round(32 * ((m.winner === 'host' ? 1 : 0) - expectedHost));
    host.arena.rating = Math.max(0, host.arena.rating + change); guest.arena.rating = Math.max(0, guest.arena.rating - change);
    m.ratingChange = change;
    host.arena.ratedDays = { ...Object.fromEntries(Object.entries(host.arena.ratedDays).filter(([, d]) => d === day)), [guest.uid]: day };
    guest.arena.ratedDays = { ...Object.fromEntries(Object.entries(guest.arena.ratedDays).filter(([, d]) => d === day)), [host.uid]: day };
    if (m.winner === 'host') { host.arena.wins += 1; guest.arena.losses += 1; } else { guest.arena.wins += 1; host.arena.losses += 1; }
  }
  m.settled = true; host.revision += 1; guest.revision += 1;
}
