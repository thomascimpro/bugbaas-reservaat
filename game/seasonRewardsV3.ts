import {rng} from './catalogV2';
import {grantField} from './fieldV2';
import {COCOON_CAP} from './goCocoonsV2';
import {RANKS,SEASON_REWARDS} from './ranksV3';
import type {RankIndex} from './ranksV3';
import type {PlayerV2} from './typesV2';

export type SeasonReceiptV3={key:string;rank:RankIndex;dust:number;nets:number;fastTMs:number;chargedTMs:number;cocoon:boolean;held:boolean;at:number};
/** Must be called in the same player transaction that advances the season key. */
export function paySeasonV3(p:PlayerV2,key:string,rank:RankIndex,now:number,scope='arcade'):SeasonReceiptV3{
 const g=p.go!,r=SEASON_REWARDS[rank],seed=p.uid+':'+scope+':'+key,odd=r.tms%2,fastTMs=Math.floor(r.tms/2)+(odd&&rng(seed+':tm')()<.5?1:0),chargedTMs=r.tms-fastTMs;
 let cocoon=false,dust=r.dust;
 if(r.cocoon){const c=g.cocoons;if(c&&c.items.length<COCOON_CAP){c.items.push({id:'cocoon-'+c.nextId++,km:5,obtainedAt:now,hatchSeed:seed+':cocoon'});cocoon=true;}else dust+=1000;}
 g.dust+=dust;grantField(p,{blue:r.nets},now);g.fastTMs+=fastTMs;g.chargedTMs+=chargedTMs;if(r.held)g.items.thorn++;
 const medal=scope+'-season:'+key+':'+RANKS[rank].id;if(!p.medals.includes(medal))p.medals.push(medal);
 return {key,rank,dust,nets:r.nets,fastTMs,chargedTMs,cocoon,held:r.held,at:now};
}
