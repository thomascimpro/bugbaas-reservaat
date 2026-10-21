import React,{useState} from 'react';
import {View} from 'react-native';
import {BOSS_LEVELS,bossChallenge,bossIssue} from '../game/goBossV2';
import type {BossDifficulty} from '../game/goBossV2';
import {species} from '../game/catalogV2';
import type {GameViewV2} from '../game/typesV2';
import type {RunV2} from './ShopViewV2';
import {SpriteView} from './artV2';
import {GoTypes} from './GoTypeV2';
import {Button,Counter,Glyph,Help,Label,Panel,v} from './uiV2';

export function GoBossV2({view,run,busy,now}:{view:GameViewV2;run:RunV2;busy:boolean;now:number}){
 const [open,setOpen]=useState(false),p=view.player;
 return <Panel><View style={[v.row,{justifyContent:'space-between'}]}><Label bold>Dagbaas</Label><Help title="Dagbaas" body="Drie eigen bugs tegen één sterke tegenstander. Zijn level blijft vast: een betere build en upgrades maken deze uitdaging makkelijker. Bekijk zijn types en kies passende aanvallen. Je behoudt je bugs en voorwerpen bij verlies. De eerste winst per moeilijkheid per UTC-dag geeft stof en XP. Meester geeft daarnaast 50% kans op een held item, 25% op een snelle TM en 25% op een opgeladen TM. Die uitkomst ligt per dag vast. Opnieuw proberen mag altijd; dezelfde uitdaging geeft geen dubbele beloning. Dit is een solo-uitdaging, geen gezamenlijke kaart-raid."/></View>
  <Button small secondary icon="cup" onPress={()=>setOpen(!open)}>{open?'Sluit uitdagingen':'Kies uitdaging'}</Button>
  {open&&(Object.keys(BOSS_LEVELS) as BossDifficulty[]).map(difficulty=>{const c=bossChallenge(difficulty,now),issue=bossIssue(p,difficulty),claimed=p.go?.bosses?.claimed.includes(c.id);return <View key={difficulty} style={{borderTopWidth:1,borderColor:'#D5DDCB',paddingTop:12,gap:8}}>
   <View style={[v.row,{gap:12}]}><SpriteView id={c.species} size={75}/><View style={{flex:1,gap:4}}><Label bold>{c.name} · Lv. {c.level}</Label><Label small>{species(c.species).name}</Label><GoTypes species={c.species} compact/></View>{claimed&&<Glyph name="check" size={26}/>}</View>
   <View style={[v.row,{justifyContent:'space-around'}]}><Counter icon="nectar" value={'+'+c.dust} label="Nectarstof"/><Counter icon="star" value={'+'+c.xp} label="XP"/>{difficulty==='end'&&<Glyph name="gift" size={27}/>}</View>
   <Button small disabled={busy||!!issue} icon={claimed?'refresh':'swords'} onPress={()=>void run('goBoss',{difficulty})}>{claimed?'Oefenen':c.name}</Button>{issue&&<Label small>{issue}</Label>}
  </View>;})}
 </Panel>;
}
