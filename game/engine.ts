import { BUGS, STARTERS, allyAbility, biomeById, bugById, itemById } from './catalog';
import type { BiomeId, Stats } from './catalog';
import { GameError } from './types';
import type { Action, Battle, EnemyPlan, Fighter, Player, SquadSlot } from './types';

const randomUUID = () => globalThis.crypto.randomUUID();

export function freshPlayer(uid: string, now: number): Player {
  return { schemaVersion: 1, uid, revision: 0, name: 'Natuuronderzoeker', createdAt: now,
    owned: Object.fromEntries(STARTERS.map(id => [id, { level: 1, copies: 2 }])),
    squad: STARTERS.slice(0, 3).map(bugId => ({ bugId, itemId: 'none' })), nectar: 80,
    research: {}, targetId: 'butterfly', battle: null, expedition: null, discoveries: [],
    day: new Date(now).toISOString().slice(0, 10), winsToday: 0, scoutsToday: 0, totalWins: 0,
    arena: { rating: 1000, wins: 0, losses: 0, activeCode: null, ratedDays: {} } };
}
function requireGame(condition: unknown, message: string): asserts condition { if (!condition) throw new GameError(message); }
export function validateSquad(player: Player, squad: SquadSlot[]) {
  requireGame(Array.isArray(squad) && squad.length === 3, 'Kies precies drie bugs.');
  requireGame(new Set(squad.map(s => s.bugId)).size === 3, 'Een bug kan maar één keer in je team.');
  for (const s of squad) {
    requireGame(s && typeof s.bugId === 'string' && Object.hasOwn(player.owned, s.bugId), 'Deze bug zit niet in jouw collectie.');
    bugById(s.bugId);
    requireGame(itemById(s.itemId), 'Dit voorwerp bestaat niet.');
  }
  const held = squad.map(s => s.itemId).filter(id => id !== 'none');
  requireGame(new Set(held).size === held.length, 'Ieder voorwerp is één keer beschikbaar voor je team.');
}
export function statsFor(bugId: string, level: number, itemId: string, biomeId: BiomeId, team: SquadSlot[]): Stats {
  const b = bugById(bugId), item = itemById(itemId), bonus = Math.max(0, level - 1);
  const stats: Stats = { hp: b.stats.hp + bonus * 5, power: b.stats.power + bonus * 2, armor: b.stats.armor + bonus, speed: b.stats.speed + bonus };
  for (const key of Object.keys(stats) as (keyof Stats)[]) stats[key] += item.stats[key];
  if (biomeId === 'meadow' && b.biome === 'meadow') stats.power += 3;
  if (biomeId === 'soil' && b.biome === 'soil') stats.armor += 4;
  if (biomeId === 'pond' && b.biome === 'pond') stats.speed += 5;
  if (biomeId === 'night' && b.biome === 'night') { stats.hp += 12; stats.armor += 3; }
  if (biomeId === 'pond' && ['dragonfly', 'streamfly', 'butterfly'].includes(b.id)) stats.speed += 6;
  if (biomeId === 'soil' && ['beetle', 'earwig'].includes(b.id)) stats.armor += 4;
  if (team.some(s => s.bugId === 'ladybug')) stats.armor += 2;
  stats.power += team.filter(s => ['ant', 'firebug'].includes(s.bugId)).length * 2;
  if (biomeId === 'night' && b.id === 'moth') stats.armor += 4;
  stats.armor = Math.max(0, stats.armor); stats.speed = Math.max(1, stats.speed);
  return stats;
}
export function fighter(s: SquadSlot, level: number, biomeId: BiomeId, team: SquadSlot[], side: string, i: number): Fighter {
  const stats = statsFor(s.bugId, level, s.itemId, biomeId, team);
  return { id: `${side}-${i}`, bugId: s.bugId, level, itemId: s.itemId, stats, hp: stats.hp,
    acted: false, specialReadyRound: 1, slowUntil: 0, weakUntil: 0, armorUntil: 0, powerUntil: 0, coverTurn: -1 };
}
export function makeBattle(player: Player, biomeId: BiomeId, now: number, id: string = randomUUID()): Battle {
  validateSquad(player, player.squad); const biome = biomeById(biomeId);
  const enemyTeam: SquadSlot[] = biome.enemies.map(bugId => ({ bugId, itemId: 'none' }));
  return { id, biomeId, targetId: biome.targets.includes(player.targetId) ? player.targetId : biome.targets[0], turn: 0, round: 1, allies: player.squad.map((s, i) => fighter(s, player.owned[s.bugId].level, biomeId, player.squad, 'ally', i)),
    enemies: enemyTeam.map((s, i) => fighter(s, biome.level, biomeId, enemyTeam, 'enemy', i)),
    status: 'active', log: [`Je team verkent de ${biome.name}. ${biome.rule}`], createdAt: now, outcome: null };
}
const alive = (side: Fighter[]) => side.filter(f => f.hp > 0);
export function nextEnemyPlan(b: Battle): EnemyPlan | null {
  if (b.status !== 'active' || !alive(b.enemies).length || !alive(b.allies).length) return null;
  const actor = alive(b.enemies)[b.turn % alive(b.enemies).length];
  const hurt = alive(b.enemies).sort((a, c) => a.hp / a.stats.hp - c.hp / c.stats.hp)[0];
  if (['bumblebee', 'glowworm'].includes(actor.bugId) && hurt.hp < hurt.stats.hp * .75 && b.turn % 2 === 0)
    return { actorId: actor.id, actorBugId: actor.bugId, targetId: hurt.id, kind: 'heal', label: `${bugById(actor.bugId).short} geneest ${bugById(hurt.bugId).short}`, multiplier: 1 };
  const target = alive(b.allies).sort((a, c) => a.hp / a.stats.hp - c.hp / c.stats.hp || a.id.localeCompare(c.id))[0];
  const heavy = b.turn % 3 === 2;
  return { actorId: actor.id, actorBugId: actor.bugId, targetId: target.id, kind: heavy ? 'heavy' : 'attack', label: `${bugById(actor.bugId).short}: ${heavy ? 'zware aanval' : 'aanval'} op ${bugById(target.bugId).short}`, multiplier: heavy ? 1.6 : 1 };
}
export function effectiveStat(f: Fighter, stat: 'power' | 'armor' | 'speed', round: number) {
  if (stat === 'power') return Math.max(1, f.stats.power + (f.powerUntil >= round ? 5 : 0) - (f.weakUntil >= round ? 6 : 0));
  if (stat === 'armor') return f.stats.armor + (f.armorUntil >= round ? 5 : 0);
  return Math.max(1, f.stats.speed - (f.slowUntil >= round ? 6 : 0));
}
function hit(b: Battle, source: Fighter, target: Fighter, multiplier: number, piercing = false) {
  let power = effectiveStat(source, 'power', b.round);
  if (source.bugId === 'mantis' && target.hp < target.stats.hp / 2) power += 4;
  let amount = Math.max(5, Math.round(power * multiplier - effectiveStat(target, 'armor', b.round) * (piercing ? .25 : .5)));
  if (target.coverTurn === b.turn) { amount = Math.max(1, Math.round(amount * .35)); b.log.push('Bladschild vangt de aanval op.'); }
  target.hp = Math.max(0, target.hp - amount);
  b.log.push(`${bugById(source.bugId).short} raakt ${bugById(target.bugId).short}: -${amount} leven${target.hp === 0 ? ' · uitgeschakeld' : ''}.`);
}
function heal(b: Battle, source: Fighter, target: Fighter, amount: number) {
  if (target.hp <= 0) return;
  if (source.bugId === 'bumblebee') amount += 6;
  if (b.biomeId === 'night' && ['glowworm', 'moth'].includes(source.bugId)) amount += 4;
  const restored = Math.min(amount, target.stats.hp - target.hp); target.hp += restored;
  b.log.push(`${bugById(source.bugId).short} verzorgt ${bugById(target.bugId).short}: +${restored} leven.`);
}
function applySpecial(b: Battle, actor: Fighter, target: Fighter) {
  const ability = bugById(actor.bugId).ability;
  if (ability === 'heal') heal(b, actor, target, 24);
  else if (ability === 'teamHeal') for (const f of alive(b.allies)) heal(b, actor, f, 14);
  else if (ability === 'protect') { target.coverTurn = b.turn; b.log.push(`${bugById(actor.bugId).short} beschermt ${bugById(target.bugId).short}.`); }
  else if (ability === 'teamArmor' || ability === 'teamPower') {
    for (const f of alive(b.allies)) if (ability === 'teamArmor') f.armorUntil = b.round + 1; else f.powerUntil = b.round + 1;
    b.log.push(`${bugById(actor.bugId).short}: het team krijgt +5 ${ability === 'teamArmor' ? 'pantser' : 'kracht'} voor 2 rondes.`);
  } else {
    hit(b, actor, target, ability === 'strike' ? 1.6 : ability === 'pierce' ? 1.4 : 1.2, ability === 'pierce');
    if (ability === 'slow') { target.slowUntil = b.round + 1; b.log.push('Het doel verliest 6 tempo voor 2 rondes.'); }
    if (ability === 'weaken') { target.weakUntil = b.round + 1; b.log.push('Het doel verliest 6 kracht voor 2 rondes.'); }
  }
  actor.specialReadyRound = b.round + 2;
}
export function performMove(b: Battle, actor: Fighter, move: 'attack' | 'special', target: Fighter) {
  if (move === 'attack') hit(b, actor, target, 1); else applySpecial(b, actor, target);
}
export function advanceBattle(b: Battle, actorId: string, move: 'attack' | 'special', targetId: string): void {
  requireGame(b.status === 'active', 'Deze ontmoeting is al afgelopen.');
  const actor = b.allies.find(f => f.id === actorId);
  requireGame(actor && actor.hp > 0 && !actor.acted, 'Kies een levende bug die deze ronde nog niet heeft gehandeld.');
  requireGame(move === 'attack' || move === 'special', 'Deze actie bestaat niet.');
  requireGame(move !== 'special' || b.round >= actor.specialReadyRound, 'De speciale actie herstelt nog.');
  const useAlly = move === 'special' && allyAbility(bugById(actor.bugId).ability);
  const target = (useAlly ? b.allies : b.enemies).find(f => f.id === targetId);
  requireGame(target && target.hp > 0, 'Kies een geldig levend doel.');
  const enemyPlan = nextEnemyPlan(b)!;
  const enemy = b.enemies.find(f => f.id === enemyPlan.actorId)!;
  const playerTurn = () => {
    if (actor.hp <= 0) { b.log.push(`${bugById(actor.bugId).short} is uitgeschakeld voordat hij kon handelen.`); return; }
    if (target.hp <= 0) { b.log.push('Het gekozen doel is niet meer beschikbaar.'); return; }
    if (move === 'attack') hit(b, actor, target, 1); else applySpecial(b, actor, target);
  };
  const enemyTurn = () => {
    if (enemy.hp <= 0 || !alive(b.allies).length) return;
    if (enemyPlan.kind === 'heal') { const t = b.enemies.find(f => f.id === enemyPlan.targetId); if (t) heal(b, enemy, t, 18); }
    else { const t = b.allies.find(f => f.id === enemyPlan.targetId); if (t && t.hp > 0) hit(b, enemy, t, enemyPlan.multiplier); }
  };
  const priority = move === 'special' && bugById(actor.bugId).ability === 'protect' ? 40 : 0;
  if (effectiveStat(actor, 'speed', b.round) + priority >= effectiveStat(enemy, 'speed', b.round)) { playerTurn(); enemyTurn(); }
  else { enemyTurn(); playerTurn(); }
  actor.acted = true; b.turn += 1;
  if (!alive(b.enemies).length) b.status = 'won';
  else if (!alive(b.allies).length || b.turn >= 36) { b.status = 'lost'; b.log.push(b.turn >= 36 ? 'De ontmoeting eindigt na 36 keuzes. Je team keert veilig terug.' : 'Je team trekt zich terug. Je collectie blijft behouden.'); }
  else if (alive(b.allies).every(f => f.acted)) { b.round += 1; for (const f of b.allies) f.acted = false; b.log.push(`Ronde ${b.round}: je levende bugs zijn opnieuw aan zet.`); }
  b.log = b.log.slice(-60);
}
export function addResearch(p: Player, bugId: string, now: number): string | null {
  const steps = (p.research[bugId] ?? 0) + 1;
  if (steps < 3) { p.research[bugId] = steps; return null; }
  p.research[bugId] = 0;
  if (p.owned[bugId]) p.owned[bugId].copies += 1;
  else { p.owned[bugId] = { level: 1, copies: 1 }; p.discoveries.unshift({ bugId, at: now }); }
  return bugId;
}
export function resetDay(p: Player, now: number) { const day = new Date(now).toISOString().slice(0, 10); if (day !== p.day) { p.day = day; p.winsToday = 0; p.scoutsToday = 0; } }
export function scoutNectar(p: Player, biomeId: BiomeId) {
  const stats = p.squad.map(s => statsFor(s.bugId, p.owned[s.bugId].level, s.itemId, biomeId, p.squad));
  const specialty = stats.reduce((sum, s) => sum + (biomeId === 'pond' ? s.speed : biomeId === 'soil' ? s.armor : biomeId === 'night' ? s.hp / 4 : s.power), 0);
  return Math.min(24, Math.max(10, Math.round(specialty / 4)));
}
export function mutatePlayer(p: Player, action: Action, now: number, durationMs = 180000): Player {
  resetDay(p, now);
  switch (action.type) {
    case 'saveSquad':
      requireGame(!p.battle || p.battle.status !== 'active', 'Maak je ontmoeting eerst af.'); validateSquad(p, action.squad); p.squad = action.squad.map(s => ({ bugId: s.bugId, itemId: s.itemId })); break;
    case 'setTarget': bugById(action.targetId); p.targetId = action.targetId; break;
    case 'startBattle':
      requireGame(!p.battle || p.battle.status !== 'active', 'Je hebt al een actieve ontmoeting.'); p.battle = makeBattle(p, action.biomeId, now); break;
    case 'battleAction': {
      requireGame(p.battle && p.battle.id === action.battleId, 'Deze ontmoeting is niet van jouw huidige team.');
      advanceBattle(p.battle, action.actorId, action.move, action.targetId);
      if (p.battle.status !== 'active' && !p.battle.outcome) {
        const rewarded = p.battle.status === 'won' && p.winsToday < 6;
        const discovery = rewarded ? addResearch(p, p.battle.targetId, now) : null;
        if (rewarded) { p.nectar += 15; p.winsToday += 1; } if (p.battle.status === 'won') p.totalWins += 1;
        p.battle.outcome = { nectar: rewarded ? 15 : 0, research: rewarded ? 1 : 0, discovery, training: p.battle.status === 'won' && !rewarded };
      }
      break;
    }
    case 'startExpedition': {
      requireGame(!p.expedition || p.expedition.claimed, 'Je verkenners zijn nog onderweg.');
      requireGame(p.scoutsToday < 3, 'Je drie onderzoeksverkenningen voor vandaag zijn gestart. Safari blijft beschikbaar.');
      const biome = biomeById(action.biomeId); bugById(action.targetId);
      requireGame(biome.targets.includes(action.targetId), 'Deze soort hoort bij een ander verkenningsgebied.');
      validateSquad(p, p.squad); const nectar = scoutNectar(p, action.biomeId);
      p.expedition = { id: randomUUID(), biomeId: action.biomeId, targetId: action.targetId, team: structuredClone(p.squad), startedAt: now, endsAt: now + durationMs, claimed: false, nectar, result: null }; p.scoutsToday += 1; break;
    }
    case 'claimExpedition': {
      requireGame(p.expedition && p.expedition.id === action.expeditionId, 'Deze expeditie bestaat niet voor jouw account.');
      if (p.expedition.claimed) return p;
      requireGame(now >= p.expedition.endsAt, 'Je verkenners zijn nog onderweg.');
      p.expedition.claimed = true; p.nectar += p.expedition.nectar; p.expedition.result = addResearch(p, p.expedition.targetId, now); break;
    }
    case 'upgrade': {
      requireGame(!p.battle || p.battle.status !== 'active', 'Groei kan na de huidige ontmoeting.');
      requireGame(Object.hasOwn(p.owned, action.bugId), 'Deze bug zit niet in jouw collectie.'); const owned = p.owned[action.bugId];
      requireGame(owned.level < 5, 'Deze bewoner heeft het hoogste previewlevel.');
      requireGame(owned.copies > 1, 'Je hebt een extra exemplaar nodig. Je laatste bewoner blijft altijd behouden.');
      const cost = owned.level * 20; requireGame(p.nectar >= cost, `Je hebt ${cost} nectar nodig.`);
      p.nectar -= cost; owned.copies -= 1; owned.level += 1; break;
    }
    default: throw new GameError('Onbekende spelactie.');
  }
  p.revision += 1; return p;
}
export function publicPlayer(p: Player, now: number) { const view = structuredClone(p); resetDay(view, now); return view; }
