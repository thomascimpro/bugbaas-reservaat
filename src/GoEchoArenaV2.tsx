import React,{useState} from 'react';
import {View} from 'react-native';
import {ECHO_DAILY_LIMIT} from '../game/echoArenaV2';
import {LEAGUES,stats,teamIssue} from '../game/goV2';
import {dayV2} from '../game/safariV2';
import type {GameViewV2} from '../game/typesV2';
import type {RunV2} from './ShopViewV2';
import {SpriteView} from './artV2';
import {Button,Glyph,Help,Label,Panel,v} from './uiV2';

export function GoEchoArenaV2({view,run,busy,now}:{view:GameViewV2;run:RunV2;busy:boolean;now:number}){
 const [open,setOpen]=useState(false),[ranks,setRanks]=useState(false),p=view.player,g=p.go!,e=g.echo,issue=teamIssue(p,g.team,g.league),defense=e?.defense;
 const remaining=Math.max(0,ECHO_DAILY_LIMIT-(e?.day===dayV2(now)?e.rewarded:0));
 return <Panel><View style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1,gap:4}}><Label bold>Echo-arena</Label><Label small>Offline · opgeslagen spelerteams</Label></View><Help title="Echo-arena" body="Speel tegen een opgeslagen team van een echte speler. De server bestuurt die kopie; de eigenaar speelt niet live mee. IV, level, aanvallen, item en shiny blijven zoals bij opslaan. Je eigen verdediging is een kopie van je huidige strijdteam. Deze arena heeft een aparte rating en verandert geen live Elo. Maximaal vijf beloonde duels per UTC-dag en één per verdediger. Daarna kun je verder oefenen; morgen zijn er nieuwe beloningen. Opnieuw opslaan geeft vandaag geen extra beloning."/></View>
  <Button small secondary icon="swords" onPress={()=>setOpen(!open)}>{open?'Sluit echo-arena':'Open echo-arena'}</Button>
  {open&&<><View style={[v.row,{justifyContent:'space-between',flexWrap:'wrap'}]}><Label bold>{e?.rating??1000} echo-rating</Label><Label small>{remaining} / {ECHO_DAILY_LIMIT} beloningen over</Label></View>
   <View style={{flexDirection:'row',gap:6}}>{[0,1,2].map(i=>{const s=p.specimens.find(s=>s.id===g.team[i]&&s.go);return <View key={i} style={{flex:1,alignItems:'center',justifyContent:'center',minHeight:89,borderRadius:16,backgroundColor:'#E4EADB'}}>{s?<><SpriteView id={s.species} shiny={s.shiny} size={58}/><Label small>{stats(s).cp} CP</Label></>:<Glyph name="team" size={38}/>}</View>;})}</View>
   <Label small>{defense?'Verdediging: '+LEAGUES[defense.league].name+' · '+new Date(defense.savedAt).toLocaleDateString('nl-NL',{day:'numeric',month:'short'}):'Bewaar je team als verdediging.'}</Label>
   <Button small secondary disabled={busy||!!issue||!view.linked} onPress={()=>void run('echoSave')}>{defense?'Werk verdediging bij':'Bewaar verdediging'}</Button>
   <Button small icon="swords" disabled={busy||!!issue||!view.linked} onPress={()=>void run('echoQueue')}>Speel offline duel</Button>
   {!view.linked&&<Label small>Koppel je account voor offline duels.</Label>}{issue&&<Label small>{issue}</Label>}
   <Label small>{remaining?'Winst: 150 stof · 100 XP':'Oefenen blijft beschikbaar · geen beloning'}</Label>
   <Button small secondary onPress={()=>setRanks(!ranks)}>{ranks?'Sluit echo-ranglijst':'Echo-ranglijst'}</Button>
   {ranks&&(view.echoLeaderboard?.length?view.echoLeaderboard.map((r,i)=><View key={i} style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1}}><Label small bold={r.me}>{i+1}. {r.name}</Label></View><Label small>{r.rating}</Label></View>):<Label small>Nog geen echo-resultaten</Label>)}
  </>}
 </Panel>;
}
