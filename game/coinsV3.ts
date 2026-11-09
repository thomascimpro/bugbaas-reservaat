import type {PlayerV2} from './typesV2';

// Extra coin sources (balance 9 Nov). Gyms stay the main source (1 coin / 10 min, max 50 a day, game/gymsV2.ts);
// these small, capped rewards let players without a nearby gym still reach the coin shop:
// 3 daily research tasks × 5, every 7th research stamp 50, weekly walk 5/25/50 km → 20/40/60.
// Without gyms that is ±40 coins a day on average; with one gym defender ±90.
export const COIN_SOURCES={daily:5,breakthrough:50,week:{5:20,25:40,50:60} as Record<number,number>} as const;
/** Adds coins to the same wallet the coin shop spends (go.gyms.coins); creates the wallet like ensureGyms would. */
export function grantCoins(p:PlayerV2,amount:number){
 if(!p.go||!Number.isSafeInteger(amount)||amount<=0)return;
 const g=p.go.gyms??={team:null,coins:0,day:'',earned:0,deployed:[],returns:[]};g.coins+=amount;
}
