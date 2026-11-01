import {rng} from './catalogV2';
// BugBaas balance values. PoGO does not publish a universal official rate.
export const WILD_SHINY_ODDS=512,COCOON_SHINY_ODDS=64;
/** Raid bosses you catch after a win are shiny 1 in 20, like legendary raids in PoGO. */
export const RAID_SHINY_ODDS=20;
export const wildShiny=(seed:string,spawn:string,odds:number=WILD_SHINY_ODDS)=>rng(seed+':shiny:'+spawn)()<1/odds;
