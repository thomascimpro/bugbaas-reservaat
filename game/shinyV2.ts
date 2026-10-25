import {rng} from './catalogV2';
// BugBaas balance values. PoGO does not publish a universal official rate.
export const WILD_SHINY_ODDS=512,COCOON_SHINY_ODDS=64;
export const wildShiny=(seed:string,spawn:string)=>rng(seed+':shiny:'+spawn)()<1/WILD_SHINY_ODDS;
