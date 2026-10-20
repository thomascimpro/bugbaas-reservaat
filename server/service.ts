import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createMatch, joinMatch, advanceMatch, settleMatch } from '../game/arena';
import { freshPlayer, mutatePlayer, publicPlayer } from '../game/engine';
import { BUGS, BIOMES, ITEMS } from '../game/catalog';
import { GameError } from '../game/types';
import type { Action, Match, Player, SquadSlot } from '../game/types';
import { document, matchKey, playerKey } from './store';
import type { Store, Documents } from './store';

type Session = { uid: string; expiresAt: number };
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
function check(ok: unknown, message: string, status = 400): asserts ok { if (!ok) throw new GameError(message, status); }
function getPlayer(docs: Documents, uid: string, now: number): Player {
  let p = document<Player>(docs, playerKey(uid));
  if (!p) { p = freshPlayer(uid, now); p.name = `Onderzoeker ${uid.slice(-4).toUpperCase()}`; docs.set(playerKey(uid), p); }
  return p;
}
function parseSquad(raw: unknown): SquadSlot[] {
  check(Array.isArray(raw) && raw.length === 3, 'Kies drie bugs.');
  return (raw as unknown[]).map(s => {
    check(s && typeof s === 'object', 'Ongeldig teamlid.'); const record = s as Record<string, unknown>;
    check(Object.keys(record).every(k => ['bugId', 'itemId'].includes(k)), 'Teamleden bevatten onbekende velden.');
    check(typeof record.bugId === 'string' && BUGS.some(b => b.id === record.bugId), 'Onbekende bug.');
    check(typeof record.itemId === 'string' && ITEMS.some(i => i.id === record.itemId), 'Onbekend voorwerp.');
    return { bugId: record.bugId as string, itemId: record.itemId as SquadSlot['itemId'] };
  });
}
export function parseAction(raw: unknown): Action {
  check(raw && typeof raw === 'object' && !Array.isArray(raw), 'Ongeldige actie.');
  const a = raw as Record<string, unknown>;
  const allowed: Record<string, string[]> = { saveSquad: ['squad'], setTarget: ['targetId'], startBattle: ['biomeId'], battleAction: ['battleId', 'actorId', 'move', 'targetId'], startExpedition: ['biomeId', 'targetId'], claimExpedition: ['expeditionId'], upgrade: ['bugId'] };
  check(typeof a.type === 'string' && Object.hasOwn(allowed, a.type), 'Deze spelactie bestaat niet.');
  const fields = allowed[a.type as string]; check(Object.keys(a).every(k => k === 'type' || fields.includes(k)), 'Een spelactie mag geen scores of extra velden bevatten.');
  check(fields.every(f => Object.hasOwn(a, f)), 'Een verplicht actieveld ontbreekt.');
  for (const field of fields) if (field !== 'squad') check(typeof a[field] === 'string' && (a[field] as string).length < 128, 'Ongeldig actieveld.');
  if (a.biomeId) check(BIOMES.some(b => b.id === a.biomeId), 'Onbekend gebied.');
  if (a.type === 'saveSquad') return { type: 'saveSquad', squad: parseSquad(a.squad) };
  return a as Action;
}
export class GameService {
  constructor(public store: Store, public mode: 'local' | 'cloud', public durationMs = 180000, public clock = Date.now) {}
  async localSession() {
    check(this.mode === 'local', 'Lokale ontwikkelsessies zijn uitgeschakeld.', 403);
    const token = randomBytes(32).toString('base64url'), uid = randomUUID(), now = this.clock();
    await this.store.run([`session:${digest(token)}`, playerKey(uid)], docs => {
      docs.set(`session:${digest(token)}`, { uid, expiresAt: now + 14 * 86400000 }); getPlayer(docs, uid, now);
    }); return { token };
  }
  async localUid(token: string) {
    check(token.length >= 32 && token.length <= 512, 'Log opnieuw in.', 401);
    const session = await this.store.run([`session:${digest(token)}`], docs => document<Session>(docs, `session:${digest(token)}`));
    check(session && session.expiresAt > this.clock(), 'Je ontwikkelsessie is verlopen.', 401); return session!.uid;
  }
  async state(uid: string) {
    const now = this.clock(); const player = await this.store.run([playerKey(uid)], docs => publicPlayer(getPlayer(docs, uid, now), now));
    return { player, now, mode: this.mode, expeditionDuration: this.durationMs };
  }
  async action(uid: string, raw: unknown, revision: number) {
    const action = parseAction(raw), now = this.clock(); check(Number.isSafeInteger(revision) && revision >= 0, 'Ongeldige voortgangsversie.');
    await this.store.run([playerKey(uid)], docs => {
      const p = getPlayer(docs, uid, now);
      if (action.type === 'claimExpedition' && p.expedition?.id === action.expeditionId && p.expedition.claimed) return;
      check(p.revision === revision, 'Je voortgang is op een ander scherm veranderd. Vernieuw de weergave.', 409);
      mutatePlayer(p, action, now, this.durationMs);
    }); return this.state(uid);
  }
  async arena(uid: string) {
    const view = await this.state(uid); const code = view.player.arena.activeCode;
    const match = code ? await this.store.run([matchKey(code)], docs => document<Match>(docs, matchKey(code)) ?? null) : null;
    check(!match || match.hostUid === uid || match.guestUid === uid, 'Dit duel is niet toegankelijk.', 403);
    const players = await this.store.listPlayers();
    return { match, leaderboard: players.sort((a, b) => b.arena.rating - a.arena.rating).slice(0, 30).map(p => ({ name: p.name, rating: p.arena.rating, wins: p.arena.wins, losses: p.arena.losses, me: p.uid === uid })) };
  }
  async arenaCreate(uid: string, rawSquad: unknown, format: unknown) {
    check(format === 'ranked' || format === 'power', 'Kies een arenavorm.'); const squad = parseSquad(rawSquad), now = this.clock();
    const code = randomBytes(5).toString('hex').slice(0, 8).toUpperCase();
    await this.store.run([playerKey(uid), matchKey(code)], docs => {
      const p = getPlayer(docs, uid, now); check(!p.arena.activeCode, 'Sluit je huidige duel eerst af.');
      check(!docs.get(matchKey(code)), 'Deze code is al in gebruik. Probeer opnieuw.');
      docs.set(matchKey(code), createMatch(p, squad, format as Match['format'], code, now)); p.arena.activeCode = code; p.revision += 1;
    }); return this.arena(uid);
  }
  async arenaJoin(uid: string, rawCode: unknown, rawSquad: unknown) {
    check(typeof rawCode === 'string' && /^[A-F0-9]{8}$/i.test(rawCode), 'Gebruik de acht tekens van de uitnodigingscode.');
    const code = (rawCode as string).toUpperCase(), squad = parseSquad(rawSquad), now = this.clock();
    const first = await this.store.run([matchKey(code)], docs => document<Match>(docs, matchKey(code)));
    check(first, 'Geen duel gevonden met deze code.');
    await this.store.run([playerKey(uid), playerKey(first!.hostUid), matchKey(code)], docs => {
      const p = getPlayer(docs, uid, now); check(!p.arena.activeCode, 'Sluit je huidige duel eerst af.');
      const m = document<Match>(docs, matchKey(code)); check(m, 'Dit duel bestaat niet meer.'); joinMatch(m!, p, squad, now);
      p.arena.activeCode = code; p.revision += 1;
    }); return this.arena(uid);
  }
  async arenaAction(uid: string, payload: Record<string, unknown>) {
    check(Object.keys(payload).every(k => ['code', 'revision', 'actorId', 'move', 'targetId'].includes(k)), 'Een duelactie bevat onbekende velden.');
    check(typeof payload.code === 'string' && /^[A-F0-9]{8}$/.test(payload.code), 'Ongeldige duelcode.');
    check(Number.isSafeInteger(payload.revision), 'Ongeldige duelversie.');
    check(['actorId', 'move', 'targetId'].every(k => typeof payload[k] === 'string' && (payload[k] as string).length < 128), 'Ongeldige actie.');
    const code = payload.code as string, first = await this.store.run([matchKey(code)], docs => document<Match>(docs, matchKey(code)));
    check(first?.guestUid && [first.hostUid, first.guestUid].includes(uid), 'Je speelt niet mee in dit duel.', 403);
    const now = this.clock();
    await this.store.run([matchKey(code), playerKey(first!.hostUid), playerKey(first!.guestUid!)], docs => {
      const m = document<Match>(docs, matchKey(code))!; check(m.revision === payload.revision, 'Dit duel is veranderd. Vernieuw de weergave.', 409);
      advanceMatch(m, uid, payload.actorId as string, payload.move as 'attack' | 'special', payload.targetId as string, now);
      settleMatch(m, getPlayer(docs, m.hostUid, now), getPlayer(docs, m.guestUid!, now), now);
    }); return this.arena(uid);
  }
  async arenaLeave(uid: string) {
    const state = await this.state(uid), code = state.player.arena.activeCode;
    if (!code) return this.arena(uid);
    const first = await this.store.run([matchKey(code)], docs => document<Match>(docs, matchKey(code)));
    check(first && [first.hostUid, first.guestUid].includes(uid), 'Dit duel is niet van jouw account.', 403);
    const now = this.clock(), keys = [playerKey(first!.hostUid), matchKey(code), ...(first!.guestUid ? [playerKey(first!.guestUid)] : [])];
    await this.store.run(keys, docs => {
      const m = document<Match>(docs, matchKey(code))!; const host = getPlayer(docs, m.hostUid, now), guest = m.guestUid ? getPlayer(docs, m.guestUid, now) : null;
      if (m.status === 'active') { m.winner = uid === m.hostUid ? 'guest' : 'host'; m.status = 'finished'; m.battle.log.push('Een speler geeft op.'); m.revision += 1; if (guest) settleMatch(m, host, guest, now); }
      else if (m.status === 'waiting') { m.status = 'cancelled'; m.revision += 1; }
      const own = uid === m.hostUid ? host : guest!; own.arena.activeCode = null; own.revision += 1;
    }); return this.arena(uid);
  }
}
