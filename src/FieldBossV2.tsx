import React,{useState} from 'react';
import {GoTeamPickerV2} from './GoTeamPickerV2';
import {View} from 'react-native';
import {postBossChallenge} from '../game/goBossV2';
import {trainerLevel} from '../game/trainerV2';
import {species} from '../game/catalogV2';
import type {PlayerV2} from '../game/typesV2';
import type {RunV2} from './ShopViewV2';
import {SpriteView} from './artV2';
import {GoTypes} from './GoTypeV2';
import {Button,Counter,Glyph,Help,Label,Panel} from './uiV2';

export function FieldBossV2({player:p,post,now,run,busy,near,fresh,ensureGPS,onBattle}:{player:PlayerV2;post:string;now:number;run:RunV2;busy:boolean;near:number;fresh:boolean;ensureGPS?:()=>Promise<boolean>;onBattle:()=>void}){
 const [choosing,setChoosing]=useState(false);
 const c=postBossChallenge(post,now),claimed=p.go!.bosses?.claimed.includes(c.id),count=p.go!.bosses?.claimed.filter(id=>id.startsWith(c.day+':post:')).length??0,low=trainerLevel(p.go!.trainer!.xp)<c.trainer,pending=p.walking?.spawns.some(s=>s.source==='boss'&&s.expiresAt>now&&!p.walking!.caught.includes(s.id));
 async function start(ids:string[]){if(ensureGPS&&!await ensureGPS())return false;const ok=await run('goBoss',{difficulty:c.difficulty,post,ids});if(ok)onBattle();return ok;}
 return <><Panel style={{borderColor:claimed?'#657A6B':'#BBA464',opacity:claimed?.65:1}}><View style={{flexDirection:'row',alignItems:'center',gap:7}}><Glyph name={claimed?'check':'swords'} size={24}/><View style={{flex:1}}><Label bold>Kaartbaas · solo</Label></View><Help title="Versla en vang" body="Iedere gympost heeft een vaste kaartbaas per UTC-dag. Kies drie eigen bugs; er is geen CP-limiet. Types, aanvallen, schilden en upgrades tellen mee. Eerste winst geeft materiaal en een vangpoging op de kaart: level 10, 15 of 20, met minimaal 10/15 per IV. De baas vlucht niet uit een raak net, maar kan wel ontsnappen. Hij blijft 30 minuten op de kaart. Gebruik je gewone netten. Maximaal drie gewonnen kaartbazen per dag; vang eerst de vorige. Dagbazen in het strijdmenu blijven aparte oefenuitdagingen."/></View><View style={{flexDirection:'row',alignItems:'center',gap:12}}><SpriteView id={c.species} size={82}/><View style={{flex:1,gap:5}}><Label bold>{species(c.species).name}</Label><Label small>Lv. {c.level} · {c.name}</Label><GoTypes species={c.species} compact/></View></View><View style={{flexDirection:'row',justifyContent:'space-around'}}><Counter icon="nectar" value={'+'+c.dust} label="Nectarstof"/><Counter icon="star" value={'+'+c.xp} label="XP"/></View><Button small icon={claimed?'check':'leaf'} disabled={busy||claimed||count>=3||low||pending||near>65||!fresh&&!ensureGPS} onPress={()=>setChoosing(true)}>{claimed?'Vandaag verslagen':count>=3?'3 / 3 vandaag':pending?'Vang eerst je baas':low?'Trainerlevel '+c.trainer:near>65?'Loop dichterbij':'Versla & vang'}</Button></Panel>{choosing&&<GoTeamPickerV2 raid player={p} {...{run,busy}} onClose={()=>setChoosing(false)} onConfirm={start}/>}</>;
}
