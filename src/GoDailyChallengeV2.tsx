import React,{useMemo} from 'react';
import {View} from 'react-native';
import {DAILY_CHALLENGE_ATTEMPTS,dailyChallenge} from '../game/dailyChallengeV2';
import {dayV2} from '../game/safariV2';
import {competitionTeamIssue} from '../game/echoArenaV2';
import {LEAGUES} from '../game/goV2';
import type {GameViewV2} from '../game/typesV2';
import type {RunV2} from './ShopViewV2';
import {SpriteView} from './artV2';
import {GoTypes} from './GoTypeV2';
import {Button,Counter,Help,Label,Panel,v} from './uiV2';

export function GoDailyChallengeV2({view,run,busy,now}:{view:GameViewV2;run:RunV2;busy:boolean;now:number}){
 const p=view.player,league=p.go!.league,day=dayV2(now),c=useMemo(()=>dailyChallenge(league,now),[league,day]),progress=view.dailyChallenge,issue=competitionTeamIssue(p),attempts=progress?.day===c.day?progress.attempts:0,best=progress?.day===c.day&&progress.league===league?progress.best:0,remaining=Math.max(0,DAILY_CHALLENGE_ATTEMPTS-attempts),ranks=view.dailyChallengeLeaderboard??[];
 return <Panel><View style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1,gap:4}}><Label bold>Dagstrijd</Label><Label small>{new Date(c.day+'T12:00:00Z').toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'short'})} · {LEAGUES[league].name}</Label></View><Help title="Dagstrijd" body="Iedereen krijgt vandaag in dezelfde league hetzelfde tegenstanderteam. Beide teams krijgen competitielevels en IV 10/10/10. Jouw soorten, aanvallen en voorwerpen bepalen je build; je eigen collectie verandert niet.\n\nJe hebt drie scorepogingen per UTC-dag, samen over alle leagues. Je beste score per dag en league telt mee in de weekranglijst met vrienden. De week begint maandag om 00:00 UTC. Score: winst, verslagen tegenstanders, overlevende bugs en resterende HP, met een kleine aftrek per gestarte aanval. Je internetsnelheid en verstreken seconden geven geen scorebonus. Opgave geeft nul punten.\n\nJe eerste winst in een scorepoging geeft eenmaal per dag 200 stof en 100 XP, over alle leagues samen. Oefenen mag onbeperkt, zonder score of beloning. Een begonnen scorepoging telt ook bij verlies of opgave."/></View>
  <View accessibilityLabel="Hetzelfde tegenstanderteam voor alle spelers vandaag" style={{flexDirection:'row',gap:7}}>{c.team.map(f=><View key={f.id} style={{flex:1,minWidth:0,alignItems:'center',paddingVertical:6,gap:3,borderRadius:18,backgroundColor:'#173F37',borderWidth:1,borderColor:'#C6D7A844'}}><SpriteView id={f.species} size={66}/><GoTypes species={f.species} compact/></View>)}</View>
  <View style={[v.row,{justifyContent:'space-between'}]}><Counter icon="cup" value={best} label="Beste dagscore"/><Label small bold>{remaining}/{DAILY_CHALLENGE_ATTEMPTS} scorepogingen</Label></View>
  <Button small icon="swords" disabled={busy||!!issue||remaining===0} onPress={()=>void run('dailyChallenge')}>{remaining?'Speel voor je score':'Morgen nieuwe scorepogingen'}</Button>
  <Button small secondary disabled={busy||!!issue} onPress={()=>void run('dailyChallenge',{practice:true})}>Oefenen · geen score</Button>
  {issue&&<Label small color="#F0C69B">{issue}</Label>}
  <Label small>{progress?.day===c.day&&progress.rewarded?'Dagbeloning binnen · verbeter je score':'+200 stof · +100 XP bij je eerste scorewinst'}</Label>
  <View style={{borderTopWidth:1,borderTopColor:'#A3BE8F44',paddingTop:10,gap:7}}><Label small bold>Deze week · vrienden</Label>{ranks.length?ranks.slice(0,5).map((r,i)=><View key={i} style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1}}><Label small bold={r.me}>{i+1}. {r.name}{r.me?' · jij':''}</Label></View><Label small bold>{r.score}</Label></View>):<Label small>Speel een scorepoging om je weekscore te zetten.</Label>}</View>
 </Panel>;
}
