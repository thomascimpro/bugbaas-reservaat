import React,{useState} from 'react';
import {Pressable,View} from 'react-native';
import {ECHO_DAILY_LIMIT,competitionTeamIssue,normalizeCompetitionFighter} from '../game/echoArenaV2';
import {fighterGo} from '../game/goBattleV2';
import {LEAGUES} from '../game/goV2';
import {dayV2} from '../game/safariV2';
import type {GameViewV2} from '../game/typesV2';
import type {RunV2} from './ShopViewV2';
import {SpriteView} from './artV2';
import {Button,Glyph,Help,Label,Panel,v} from './uiV2';

export function GoEchoArenaV2({view,run,busy,now}:{view:GameViewV2;run:RunV2;busy:boolean;now:number}){
 const [details,setDetails]=useState(false),p=view.player,g=p.go!,e=g.echo,issue=competitionTeamIssue(p),defense=e?.defense;
 const remaining=Math.max(0,ECHO_DAILY_LIMIT-(e?.day===dayV2(now)?e.rewarded:0));
 return <Panel><View style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1,gap:4}}><Label bold>Echo-arena</Label><Label small>Altijd een tegenstander · geen wachtrij</Label></View><Help title="Echo-arena" body="Speel tegen een bewaard spelerteam. Is er geen nieuw spelerteam, dan staat een herkenbare veldwachter (NPC) klaar. De server bestuurt de tegenstander; de eigenaar hoeft niet online te zijn. Beide teams krijgen competitielevels en IV 10/10/10. Soorten, aanvallen, voorwerpen en shiny blijven behouden; je collectie verandert niet.\n\nEen spelerteam kan je aparte echo-rating veranderen. NPC's geven alleen grondstoffen, nooit rating of ranglijstoverwinningen. De afwezige eigenaar verliest geen Elo. Maximaal vijf beloonde duels per UTC-dag, één per tegenstander en teamkopie. Winst: 150 stof en 100 XP; verlies: 50 stof. Daarna kun je blijven oefenen. Opnieuw opslaan geeft geen nieuwe beloning."/></View>
  <View style={{flexDirection:'row',gap:7}}>{[0,1,2].map(i=>{const s=p.specimens.find(s=>s.id===g.team[i]&&s.go),f=s?normalizeCompetitionFighter(fighterGo(s),g.league):null;return <View key={i} style={{flex:1,alignItems:'center',justifyContent:'center',minHeight:86,borderRadius:17,backgroundColor:'#214F42'}}>{s&&f?<><SpriteView id={s.species} shiny={s.shiny} size={55}/><Label small>{f.cp} CP</Label></>:<Glyph name="team" size={38}/>}</View>;})}</View>
  <View style={[v.row,{justifyContent:'space-between',gap:8}]}><Label small>{LEAGUES[g.league].name} · gelijke levels/IV</Label><Label small bold>{remaining}/{ECHO_DAILY_LIMIT} beloningen</Label></View>
  <Button small icon="swords" disabled={busy||!!issue} onPress={()=>void run('echoQueue')}>{remaining?'Speel Echo-duel':'Oefen Echo-duel'}</Button>
  {issue&&<Label small color="#F0C69B">{issue}</Label>}
  <Pressable accessibilityRole="button" accessibilityLabel="Echo-verdediging en ranglijst" onPress={()=>setDetails(!details)} style={{minHeight:40,justifyContent:'center'}}><Label small>{details?'Sluit details':'Verdediging en echo-ranglijst'} · {e?.rating??1000}</Label></Pressable>
  {details&&<><Label small>{defense?'Bewaard: '+LEAGUES[defense.league].name+' · '+new Date(defense.savedAt).toLocaleDateString('nl-NL',{day:'numeric',month:'short'}):'Je team wordt bewaard zodra je een geldig strijdteam kiest.'}</Label><Button small secondary disabled={busy||!!issue||!view.linked} onPress={()=>void run('echoSave')}>Werk verdediging bij</Button>{!view.linked&&<Label small>Koppel je account om je verdediging met spelers te delen.</Label>}{view.echoLeaderboard?.length?view.echoLeaderboard.slice(0,5).map((r,i)=><View key={i} style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1}}><Label small bold={r.me}>{i+1}. {r.name}</Label></View><Label small>{r.rating}</Label></View>):<Label small>Nog geen gespeelde spelerduels.</Label>}</>}
 </Panel>;
}
