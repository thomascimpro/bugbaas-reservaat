import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshPlayer, makeBattle, mutatePlayer, statsFor, advanceBattle } from '../game/engine';
import { createMatch, joinMatch, advanceMatch, settleMatch } from '../game/arena';
import { GameService, parseAction } from '../server/service';
import { SqliteStore } from '../server/sqlite';
import { playerKey } from '../server/store';

const NOW = Date.UTC(2026, 9, 12, 12);
test('items and habitats produce real, different stats', () => {
  const p = freshPlayer('a', NOW), base = statsFor('dragonfly', 1, 'none', 'meadow', p.squad);
  const pond = statsFor('dragonfly', 1, 'wing', 'pond', p.squad);
  assert.equal(pond.speed - base.speed, 18); assert.equal(pond.hp, base.hp - 12);
  const armored = statsFor('beetle', 1, 'leaf', 'soil', p.squad);
  assert.ok(armored.armor > statsFor('beetle', 1, 'none', 'meadow', p.squad).armor);
});
test('the server rejects invented scores and invalid squad fields', () => {
  assert.throws(() => parseAction({ type: 'upgrade', bugId: 'ladybug', nectar: 99999 }));
  assert.throws(() => parseAction({ type: 'saveSquad', squad: [{ bugId: 'ladybug', itemId: 'none', level: 99 }, { bugId: 'ant', itemId: 'none' }, { bugId: 'beetle', itemId: 'none' }] }));
});
test('no duplicate bug, unavailable species or duplicated held item', () => {
  const p = freshPlayer('a', NOW);
  assert.throws(() => mutatePlayer(p, { type: 'saveSquad', squad: [{ bugId: 'ladybug', itemId: 'none' }, { bugId: 'ladybug', itemId: 'none' }, { bugId: 'ant', itemId: 'none' }] }, NOW));
  assert.throws(() => mutatePlayer(p, { type: 'saveSquad', squad: [{ bugId: 'mantis', itemId: 'none' }, { bugId: 'ant', itemId: 'none' }, { bugId: 'beetle', itemId: 'none' }] }, NOW));
  assert.throws(() => mutatePlayer(p, { type: 'saveSquad', squad: [{ bugId: 'ladybug', itemId: 'leaf' }, { bugId: 'ant', itemId: 'leaf' }, { bugId: 'beetle', itemId: 'none' }] }, NOW));
});
test('the last copy survives growth and stats are not client controlled', () => {
  const p = freshPlayer('a', NOW); mutatePlayer(p, { type: 'upgrade', bugId: 'ladybug' }, NOW);
  assert.equal(p.owned.ladybug.level, 2); assert.equal(p.owned.ladybug.copies, 1); assert.equal(p.nectar, 60);
  assert.throws(() => mutatePlayer(p, { type: 'upgrade', bugId: 'ladybug' }, NOW));
});
test('special move cooldown and spent units cannot be bypassed', () => {
  const b = makeBattle(freshPlayer('a', NOW), 'meadow', NOW, 'test');
  advanceBattle(b, 'ally-0', 'special', 'enemy-0'); assert.throws(() => advanceBattle(b, 'ally-0', 'attack', 'enemy-0'));
  assert.equal(b.allies[0].specialReadyRound, 3);
});
test('safari target is fixed at departure', () => {
  const p = freshPlayer('a', NOW); mutatePlayer(p, { type: 'startBattle', biomeId: 'meadow' }, NOW);
  mutatePlayer(p, { type: 'setTarget', targetId: 'moth' }, NOW); assert.equal(p.battle!.targetId, 'butterfly');
});
test('expedition checks server time and repeated claims give only one reward', () => {
  const p = freshPlayer('a', NOW); mutatePlayer(p, { type: 'startExpedition', biomeId: 'meadow', targetId: 'butterfly' }, NOW, 1000);
  const id = p.expedition!.id, nectar = p.nectar;
  assert.throws(() => mutatePlayer(p, { type: 'claimExpedition', expeditionId: id }, NOW + 999));
  mutatePlayer(p, { type: 'claimExpedition', expeditionId: id }, NOW + 1000);
  const after = p.nectar; mutatePlayer(p, { type: 'claimExpedition', expeditionId: id }, NOW + 1001);
  assert.ok(after > nectar); assert.equal(p.nectar, after); assert.equal(p.research.butterfly, 1);
});
test('stale action is rejected and failed transaction leaves data unchanged', async () => {
  const store = new SqliteStore(':memory:'), service = new GameService(store, 'local', 1000, () => NOW);
  const { token } = await service.localSession(), uid = await service.localUid(token);
  await service.action(uid, { type: 'startBattle', biomeId: 'meadow' }, 0);
  await assert.rejects(() => service.action(uid, { type: 'startBattle', biomeId: 'meadow' }, 0));
  const state = await service.state(uid); assert.equal(state.player.revision, 1);
  await assert.rejects(() => service.action(uid, { type: 'battleAction', battleId: state.player.battle!.id, actorId: 'ally-0', move: 'attack', targetId: 'not-owned' }, 1));
  assert.equal((await service.state(uid)).player.revision, 1); store.close();
});
test('ranked ignores inventory level; power duels use actual collection level', () => {
  const p = freshPlayer('a', NOW); p.owned.ladybug.level = 5;
  const ranked = createMatch(p, p.squad, 'ranked', 'ABCD1234', NOW), power = createMatch(p, p.squad, 'power', 'ABCD1235', NOW);
  assert.equal(ranked.battle.allies[0].level, 3); assert.equal(power.battle.allies[0].level, 5);
  const altered = [{ bugId: 'mantis', itemId: 'none' as const }, ...p.squad.slice(1)];
  assert.doesNotThrow(() => createMatch(p, altered, 'ranked', 'ABCD1236', NOW));
  assert.throws(() => createMatch(p, altered, 'power', 'ABCD1237', NOW));
});
test('PvP refuses self-play, third players and the wrong turn', () => {
  const host = freshPlayer('host', NOW), guest = freshPlayer('guest', NOW), m = createMatch(host, host.squad, 'ranked', 'ABCD1234', NOW);
  assert.throws(() => joinMatch(m, host, host.squad, NOW)); joinMatch(m, guest, guest.squad, NOW);
  assert.throws(() => advanceMatch(m, 'outsider', 'ally-0', 'attack', 'enemy-0', NOW));
  const wrong = m.currentSide === 'host' ? 'guest' : 'host'; assert.throws(() => advanceMatch(m, wrong, 'ally-0', 'attack', 'enemy-0', NOW));
});
test('rating settles once and repeat wins against the same opponent are unrated', () => {
  const host = freshPlayer('host', NOW), guest = freshPlayer('guest', NOW), m = createMatch(host, host.squad, 'ranked', 'ABCD1234', NOW);
  joinMatch(m, guest, guest.squad, NOW); m.status = 'finished'; m.winner = 'host';
  settleMatch(m, host, guest, NOW); assert.equal(host.arena.rating, 1016); assert.equal(guest.arena.rating, 984);
  settleMatch(m, host, guest, NOW); assert.equal(host.arena.rating, 1016);
  const again = createMatch(host, host.squad, 'ranked', 'ABCD1235', NOW); joinMatch(again, guest, guest.squad, NOW); again.status = 'finished'; again.winner = 'host';
  settleMatch(again, host, guest, NOW); assert.equal(again.rated, false); assert.equal(host.arena.rating, 1016);
});
test('two concurrent PvP actions cannot create two turns', async () => {
  const store = new SqliteStore(':memory:'), service = new GameService(store, 'local', 1000, () => NOW);
  const h = await service.localSession(), g = await service.localSession(), hu = await service.localUid(h.token), gu = await service.localUid(g.token);
  const hp = (await service.state(hu)).player, gp = (await service.state(gu)).player;
  const created = await service.arenaCreate(hu, hp.squad, 'ranked'); await service.arenaJoin(gu, created.match!.code, gp.squad);
  const m = (await service.arena(hu)).match!, side = m.currentSide, uid = side === 'host' ? hu : gu;
  const actor = side === 'host' ? m.battle.allies[0] : m.battle.enemies[0], target = side === 'host' ? m.battle.enemies[0] : m.battle.allies[0];
  const payload = { code: m.code, revision: m.revision, actorId: actor.id, targetId: target.id, move: 'attack' };
  const results = await Promise.allSettled([service.arenaAction(uid, payload), service.arenaAction(uid, payload)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1); assert.equal((await service.arena(hu)).match!.battle.turn, 1); store.close();
});
