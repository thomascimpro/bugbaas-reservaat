import {arcadeSeed} from './tapDuel';
import type {ArcadeGameId} from './games';
import {rankOf} from '../ranksV3';

export type RankedBot={name:string;rating:number;score:number};
/** Explicit computer score targets, not fabricated player replays or human accounts.
 * Fixed tier benchmarks rise with rank; they do not learn the player's inputs.
 */
const TARGETS:Record<ArcadeGameId,readonly number[]>={
 tap_duel:[55,80,110,145,180,215,250,290],
 nest_defense:[450,750,1100,1500,2000,2600,3300,4100],
 web_runner:[150,300,500,750,1050,1450,1900,2500],
 bug_glide:[60,130,220,350,500,700,950,1250],
 butterfly_catch:[150,250,400,600,850,1150,1500,1900],
 bug_tower:[100,200,350,550,800,1100,1450,1850],
 bubble_swarm:[400,800,1400,2200,3200,4500,6000,8000],
};
export function rankedBot(game:ArcadeGameId,rating:number,seed:number):RankedBot{
 const tier=rankOf(rating),variation=arcadeSeed('bot:'+game+':'+seed)%11-5;
 return {name:'Bot '+['Linde','Roos','Sem','Noor','Bram'][arcadeSeed('name:'+seed)%5],rating:1000+tier*150+75,score:Math.max(1,Math.round(TARGETS[game][tier]*(1+variation/100)))};
}
