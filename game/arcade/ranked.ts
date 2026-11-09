import type {ArcadeGameId} from './games';
import type {SeasonReceiptV3} from '../seasonRewardsV3';
export const ARCADE_RANKED_BOTS_PER_DAY=5;
export type ArcadeRankedSeason={key:string;played:number;wins:number;best:number;promoted:number;history:SeasonReceiptV3[]};

/** Asynchronous Elo rules copied from old src/services/bugSmashDuelService.ts:210–219.
 * Match TTL (48h) and pair cooldown (15m) retain the old open-random-duel values.
 * These statistics are separate from existing live Arena/Echo/season ratings.
 */
export const ARCADE_RANKED_TTL_MS=48*60*60*1000;
export const ARCADE_RANKED_PAIR_MS=15*60*1000;
export const ARCADE_RANKED_DAILY_STARTS=25;
export type ArcadeRankedOutcome='win'|'loss'|'draw';
export type ArcadeRankedTicket={duel:string;side:'from'|'to';acceptedAt?:number;baseEligible?:boolean;bonusPaid?:boolean};
export type ArcadeRankedResult={duel:string;status:'waiting'|'completed'|'cancelled';result?:ArcadeRankedOutcome;opponent?:string;opponentScore?:number;rating:number;delta:number;bonusDust:number;at?:number;bot?:boolean;promotionDust?:number};
export type ArcadeRankedHistory={duel:string;game:ArcadeGameId;opponent:string;result:ArcadeRankedOutcome;score:number;opponentScore:number;delta:number;rating:number;at:number};
export type ArcadeRankedProgress={rating:number;highest:number;wins:number;losses:number;draws:number;day:string;starts:number;bots?:number;season?:ArcadeRankedSeason;recent:Record<string,number>;history:ArcadeRankedHistory[];waiting:string[]};
export type ArcadeRankedRank={uid:string;name:string;rating:number;highest:number;wins:number;losses:number;draws:number;updatedAt:number;season?:string};
export function freshArcadeRanked(now:number):ArcadeRankedProgress{return {rating:1000,highest:1000,wins:0,losses:0,draws:0,day:new Date(now).toISOString().slice(0,10),starts:0,recent:{},history:[],waiting:[]};}
export function arcadeRankedK(_p:Pick<ArcadeRankedProgress,'rating'|'wins'|'losses'|'draws'>){return 40;}
export function arcadeRankedEloDelta(playerRating:number,opponentRating:number,actualScore:0|.5|1,kFactor=32){return Math.round(kFactor*(actualScore-1/(1+10**((opponentRating-playerRating)/400))));}
export function arcadeRankedRatingChange(player:Pick<ArcadeRankedProgress,'rating'|'wins'|'losses'|'draws'>,opponentRating:number,outcome:ArcadeRankedOutcome){const delta=arcadeRankedEloDelta(player.rating,opponentRating,outcome==='win'?1:outcome==='loss'?0:.5,arcadeRankedK(player)),rating=Math.max(1000,player.rating+delta);return {rating,delta:rating-player.rating};}
