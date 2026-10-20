import type { BiomeId, ItemId, Stats } from './catalog';
export type SquadSlot = { bugId: string; itemId: ItemId };
export type OwnedBug = { level: number; copies: number };
export type Fighter = {
  id: string; bugId: string; level: number; itemId: ItemId; stats: Stats; hp: number;
  acted: boolean; specialReadyRound: number; slowUntil: number; weakUntil: number;
  armorUntil: number; powerUntil: number; coverTurn: number;
};
export type Battle = {
  id: string; biomeId: BiomeId; targetId: string; turn: number; round: number; allies: Fighter[]; enemies: Fighter[];
  status: 'active' | 'won' | 'lost'; log: string[]; createdAt: number;
  outcome: null | { nectar: number; research: number; discovery: string | null; training: boolean };
};
export type Expedition = { id: string; biomeId: BiomeId; targetId: string; team: SquadSlot[]; startedAt: number; endsAt: number; claimed: boolean; nectar: number; result: string | null };
export type Player = {
  schemaVersion: 1; uid: string; revision: number; name: string; createdAt: number;
  owned: Record<string, OwnedBug>; squad: SquadSlot[]; nectar: number;
  research: Record<string, number>; targetId: string; battle: Battle | null;
  expedition: Expedition | null; discoveries: { bugId: string; at: number }[];
  day: string; winsToday: number; scoutsToday: number; totalWins: number;
  arena: { rating: number; wins: number; losses: number; activeCode: string | null; ratedDays: Record<string, string> };
};
export type GameView = { player: Player; now: number; mode: 'local' | 'cloud'; expeditionDuration: number };
export type EnemyPlan = { actorId: string; actorBugId: string; targetId: string; kind: 'attack' | 'heavy' | 'heal'; label: string; multiplier: number };
export type Action =
  | { type: 'saveSquad'; squad: SquadSlot[] }
  | { type: 'setTarget'; targetId: string }
  | { type: 'startBattle'; biomeId: BiomeId }
  | { type: 'battleAction'; battleId: string; actorId: string; move: 'attack' | 'special'; targetId: string }
  | { type: 'startExpedition'; biomeId: BiomeId; targetId: string }
  | { type: 'claimExpedition'; expeditionId: string }
  | { type: 'upgrade'; bugId: string };
export type Match = {
  code: string; hostUid: string; guestUid: string | null; hostName: string; guestName: string | null;
  format: 'ranked' | 'power'; status: 'waiting' | 'active' | 'finished' | 'cancelled';
  battle: Battle; currentSide: 'host' | 'guest'; revision: number; createdAt: number;
  updatedAt: number; winner: 'host' | 'guest' | 'draw' | null; settled: boolean;
  ratingChange: number; rated: boolean;
};
export type ArenaView = { match: Match | null; leaderboard: { name: string; rating: number; wins: number; losses: number; me: boolean }[] };
export class GameError extends Error { constructor(message: string, public status = 400) { super(message); } }
