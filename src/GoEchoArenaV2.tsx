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

export function GoEchoArenaV2({view,run,busy,now,onChooseTeam}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;onChooseTeam?:()=>void}){
 const [details,setDetails]=useState(false),p=view.player,g=p.go!,e=g.echo,issue=competitionTeamIssue(p),defense=e?.defense;
 const remaining=Math.max(0,ECHO_DAILY_LIMIT-(e?.day===dayV2(now)?e.rewarded:0));
 return <Panel><View style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1,gap:4}}><Label bold>Direct duel</Label><Label small>Speel ook als je vrienden offline zijn.</Label></View><Help title="Direct duel" body="Je speelt tegen een opgeslagen team. Is er niemand, dan speel je tegen een computer. Jullie bugs krijgen gelijke levels. Je eigen bugs veranderen niet.\n\nJe team, aanvallen en items maken het verschil. De eerste vijf verschillende tegenstanders per dag geven een beloning. Daarna kun je blijven oefenen. Alleen duels tegen spelerteams tellen voor je duelranglijst."/></View>
  <View style={{flexDirection:'row',gap:7}}>{[0,1,2].map(i=>{const s=p.specimens.find(s=>s.id===g.team[i]&&s.go),f=s?normalizeCompetitionFighter(fighterGo(s),g.league):null;return <View key={i} style={{flex:1,alignItems:'center',justifyContent:'center',minHeight:86,borderRadius:17,backgroundColor:'#214F42'}}>{s&&f?<><SpriteView id={s.species} shiny={s.shiny} size={55}/><Label small>{f.cp} CP</Label></>:<Glyph name="team" size={38}/>}</View>;})}</View>
  {onChooseTeam&&<Button small secondary icon="team" onPress={onChooseTeam}>Team kiezen</Button>}
  <View style={[v.row,{justifyContent:'space-between',gap:8}]}><Label small>Gelijke levels</Label><Label small bold>{remaining}/{ECHO_DAILY_LIMIT} beloningen over</Label></View>
  <Button icon="swords" disabled={busy||!!issue} onPress={()=>void run('echoQueue')}>{remaining?'Start duel':'Oefen een duel'}</Button>
  {issue&&<Label small color="#F0C69B">{issue}</Label>}
  <Pressable accessibilityRole="button" accessibilityLabel="Echo-verdediging en ranglijst" onPress={()=>setDetails(!details)} style={{minHeight:44,justifyContent:'center'}}><Label small>{details?'Verberg ranglijst':'Ranglijst en verdediging'}</Label></Pressable>
  {details&&<><Label small>{defense?'Bewaard: '+LEAGUES[defense.league].name+' · '+new Date(defense.savedAt).toLocaleDateString('nl-NL',{day:'numeric',month:'short'}):'Je team wordt bewaard zodra je een geldig strijdteam kiest.'}</Label><Button small secondary disabled={busy||!!issue||!view.linked} onPress={()=>void run('echoSave')}>Werk verdediging bij</Button>{!view.linked&&<Label small>Koppel je account om je verdediging met spelers te delen.</Label>}{view.echoLeaderboard?.length?view.echoLeaderboard.slice(0,5).map((r,i)=><View key={i} style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1}}><Label small bold={r.me}>{i+1}. {r.name}</Label></View><Label small>{r.rating}</Label></View>):<Label small>Nog geen gespeelde spelerduels.</Label>}</>}
 </Panel>;
}
