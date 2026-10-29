import {rng} from './catalogV2';
import {DEX_SPECIES,evolutionStage} from './dexV2';
import {makeGoBattle} from './goBattleV2';
import type {GoBattle} from './goBattleV2';
import {awardGoCatch,ensureGo,movePool,rollGoBug,stats,teamIssue} from './goV2';
import type {Element} from './goV2';
import {gymSites} from './gymsV2';
import {freshV2} from './safariV2';
import {grantXP} from './trainerV2';
import type {PlayerV2,Specimen} from './typesV2';
import {distance,requireFieldLocation} from './walkingV2';
import type {Walking} from './walkingV2';
import {POST_RADIUS} from './worldSitesV2';
import {checkV2 as check} from './shopV2';

/** Plaagbende (kid-friendly Team GO Rocket): some posts are taken over for a few hours, plus a balloon every ~6 h near the player. */
export const PLAAG_WINDOW_MS=3*3600000,PLAAG_CHANCE=.2,BALLOON_EVERY_MS=6*3600000,BALLOON_STAYS_MS=3*3600000,BALLOON_FOLLOW_M=120;
export const PLAAG_REWARD={dust:500,xp:300,rescueLevel:15} as const;
export const PLAAG_EMOJI:Record<Element,string>={bug:'🐛',flying:'🪶',poison:'🧪',grass:'🌿',ground:'⛏️',rock:'🪨',steel:'⚙️',dark:'🌙',normal:'⭐',fire:'🔥',water:'💧'};
const NAMES:Record<Element,string>={bug:'Plaagbende-kriebel',flying:'Plaagbende-fladder',poison:'Plaagbende-stinker',grass:'Plaagbende-grasdief',ground:'Plaagbende-graver',rock:'Plaagbende-keitje',steel:'Plaagbende-blikkie',dark:'Plaagbende-sluiper',normal:'Plaagbende-rover',fire:'Plaagbende-vonk',water:'Plaagbende-spetter'};
export const plaagName=(type:Element)=>NAMES[type]??'Plaagbende-rover';
export type PlaagBalloon={id:string;type:Element;lat:number;lng:number;at:number;until:number};
export type PlaagbendeProgress={wins:number;cleared:string[];balloon?:PlaagBalloon|null;nextBalloonAt?:number};
/** Public invasion on a post (near: playable post; far: horizon marker only). */
export type PlaagView={id:string;postId:string;type:Element;team:string[];endsAt:number;far?:true};
export type PlaagBattleMeta={id:string;kind:'post'|'balloon';type:Element;team:string[];postId?:string;rewarded?:boolean;rescued?:string};
export type PlaagToken=(input:string)=>string;

let pools:Partial<Record<Element,string[]>>|undefined;
/** Species per main type; every theme needs three different species. */
export function plaagPools(){if(pools)return pools;const out:Partial<Record<Element,string[]>>={};for(const {id} of DEX_SPECIES){const t=movePool(id).types[0];(out[t]??=[]).push(id);}for(const k of Object.keys(out) as Element[])if(out[k]!.length<3)delete out[k];return pools=out;}
export const plaagThemes=()=>(Object.keys(plaagPools()) as Element[]).sort();
/** Three different species of the theme; the lead (the bug you rescue) is a first stage when possible. */
export function plaagTeam(id:string,type:Element):string[]{
 const pool=plaagPools()[type]??plaagPools()[plaagThemes()[0]]!,random=rng('plaag-team:'+id),first=pool.filter(s=>evolutionStage(s)===1),lead=(first.length?first:pool)[Math.floor(random()*(first.length||pool.length))],rest=pool.filter(s=>s!==lead),out=[lead];
 while(out.length<3){const s=rest[Math.floor(random()*rest.length)];if(!out.includes(s))out.push(s);}return out;
}
/** Deterministic per post per 3-hour UTC window, keyed with the server secret so clients cannot plan ahead; about one in five posts. */
export function invasionAt(postId:string,now:number,token:PlaagToken):PlaagView|null{
 const slot=Math.floor(now/PLAAG_WINDOW_MS),random=rng(token('plaag:'+slot+':'+postId));if(random()>=PLAAG_CHANCE)return null;
 const themes=plaagThemes(),type=themes[Math.floor(random()*themes.length)],id='p'+slot+':'+postId;return {id,postId,type,team:plaagTeam(id,type),endsAt:(slot+1)*PLAAG_WINDOW_MS};
}
export function ensurePlaag(p:PlayerV2):PlaagbendeProgress{const g=p.go!;return g.plaagbende??={wins:0,cleared:[]};}
const ready=(p:PlayerV2)=>new Set(p.specimens.filter(s=>s.go).map(s=>s.species)).size>=3;
/** Invasions this player can still beat: nearby non-gym posts (playable) and far horizon posts (display only). */
export function plaagView(p:PlayerV2,now:number,token:PlaagToken):PlaagView[]{
 const w=p.walking;if(!w)return [];const cleared=new Set(p.go?.plaagbende?.cleared??[]),gyms=new Set(gymSites(w.posts??[]).map(g=>g.postId)),near=(w.posts??[]).filter(s=>!gyms.has(s.id)),nearIds=new Set(near.map(s=>s.id));
 const far=(w.mapSites??[]).filter(s=>!s.gym&&!nearIds.has(s.id));
 return [...near.map(s=>invasionAt(s.id,now,token)),...far.map(s=>{const v=invasionAt(s.id,now,token);return v?{...v,far:true as const}:null;})].filter((v):v is PlaagView=>!!v&&!cleared.has(v.id));
}
/** Balloon (while the app is open): one at a time, a new one about every 6 hours, it drifts along when the player walks away. */
export function ensureBalloon(p:PlayerV2,now:number,seed:string){
 const w=p.walking;if(!w||!p.go)return null;const g=ensurePlaag(p);if(g.balloon&&g.balloon.until<=now)g.balloon=null;
 const place=(salt:string)=>{const random=rng(seed+':plaag-balloon:'+salt),angle=random()*Math.PI*2,meters=35+random()*30;return {lat:w.fix.lat+meters*Math.cos(angle)/111320,lng:w.fix.lng+meters*Math.sin(angle)/(111320*Math.cos(w.fix.lat*Math.PI/180))};};
 if(g.balloon){if(distance(w.fix,g.balloon)>BALLOON_FOLLOW_M)Object.assign(g.balloon,place('move'));return g.balloon;}
 if(now<(g.nextBalloonAt??0)||!ready(p))return null;
 const themes=plaagThemes(),type=themes[Math.floor(rng(seed+':plaag-type')()*themes.length)];
 g.balloon={id:'b'+Math.floor(now/1000).toString(36),type,...place('new'),at:now,until:now+BALLOON_STAYS_MS};g.nextBalloonAt=now+BALLOON_EVERY_MS;return g.balloon;
}
function target(p:PlayerV2,raw:unknown,now:number,token:PlaagToken):{id:string;kind:'post'|'balloon';type:Element;postId?:string}{
 check(typeof raw==='string'&&raw.length>0&&raw.length<240,'Kies de Plaagbende.');const g=ensurePlaag(p);
 if(raw==='balloon'){const b=g.balloon;check(b&&b.until>now,'De ballon is weggevlogen.');check(!g.cleared.includes(b.id),'Deze ballon is al verslagen.');return {id:b.id,kind:'balloon',type:b.type};}
 const w=requireFieldLocation(p.walking,now) as Walking,post=w.posts?.find(s=>s.id===raw);check(post,'Deze post is niet in de buurt.');check(!gymSites(w.posts??[]).some(s=>s.postId===post.id),'Deze post is een gym.');
 check(distance(w.fix,post)<=POST_RADIUS,'Loop binnen '+POST_RADIUS+' meter van de post.');const v=invasionAt(post.id,now,token);check(v,'De Plaagbende is hier al weg.');check(!g.cleared.includes(v.id),'Deze Plaagbende heb je al verslagen.');
 return {id:v.id,kind:'post',type:v.type,postId:post.id};
}
/** A fair fight for kids: the grunt's bugs sit just below the player's own team CP; no CP limit, one shield. */
/** Kid-friendly villains: their bugs sit at 70% of your team's average CP and they have no shields, so a fair team usually wins. */
export const PLAAG_CP_SHARE=.7;
export function makePlaagBattle(p:PlayerV2,raw:unknown,ids:unknown,id:string,now:number,token:PlaagToken):GoBattle{
 const issue=teamIssue(p,ids,'master',true);check(!issue,issue??'Kies drie bugs.');const t=target(p,raw,now,token),team=plaagTeam(t.id,t.type);
 const mine=(ids as string[]).map(x=>p.specimens.find(s=>s.id===x)!),goal=Math.max(10,Math.round(mine.reduce((n,s)=>n+stats(s).cp,0)/3*PLAAG_CP_SHARE));
 const attacker=structuredClone(p);attacker.go!.league='master';attacker.go!.team=[...ids as string[]];
 const q=freshV2('plaagbende-'+t.id,'PLAAGBND',now);ensureGo(q,now);q.name=plaagName(t.type);q.go!.league='master';
 q.specimens=team.map((kind,i)=>{const s:Specimen={id:'plaag-'+i,species:kind,level:1,shiny:false,favorite:false,obtainedAt:now,source:'plaagbende',hearts:0,item:null,go:{...rollGoBug(kind,'plaag:'+t.id+':'+i),iv:[10,10,10]}};let best=1;for(let l=1;l<=50;l+=.5){s.go!.level=l;if(stats(s).cp<=goal)best=l;else break;}s.go!.level=best;return s;});
 q.go!.team=q.specimens.map(s=>s.id);const b=makeGoBattle(attacker,q,id,now,false,true,true);b.shields[1]=0;
 b.plaagbende={id:t.id,kind:t.kind,type:t.type,team,...(t.postId?{postId:t.postId}:{})};return b;
}
/** Win once per invasion/balloon: stof, XP and a rescued bug of the grunt's type with good IVs. Losing costs nothing; retry any time. */
export function settlePlaag(p:PlayerV2,b:GoBattle,now:number):{dust:number;xp:number;rescued?:Specimen}|null{
 const m=b.plaagbende;if(!m||b.phase!=='finished'||b.settled)return null;check(b.training&&!b.ranked&&b.players[0]===p.uid,'Dit gevecht is niet van jou.',403);
 b.settled=true;const g=ensurePlaag(p),won=b.winner===0&&!g.cleared.includes(m.id);m.rewarded=won;if(!won)return {dust:0,xp:0};
 const go=p.go!,before={dust:go.dust,xp:go.trainer!.xp};g.cleared=[...g.cleared,m.id].slice(-60);g.wins++;if(g.balloon?.id===m.id)g.balloon=null;
 const s:Specimen={id:'gered-'+b.id,species:m.team[0],level:1,shiny:false,favorite:false,obtainedAt:now,source:'plaagbende',hearts:0,item:null};
 awardGoCatch(p,s,'plaag-rescue:'+p.uid+':'+m.id,null,undefined,false,{level:PLAAG_REWARD.rescueLevel});p.specimens.push(s);if(!p.discovered.includes(s.species))p.discovered.push(s.species);
 go.dust+=PLAAG_REWARD.dust;grantXP(p,PLAAG_REWARD.xp);m.rescued=s.species;return {dust:go.dust-before.dust,xp:go.trainer!.xp-before.xp,rescued:s};
}
