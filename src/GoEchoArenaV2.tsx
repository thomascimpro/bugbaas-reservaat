import React,{useState} from 'react';
import {Pressable,View} from 'react-native';
import {ECHO_DAILY_LIMIT,echoTeamIssue} from '../game/echoArenaV2';
import {fighterGo} from '../game/goBattleV2';
import {LEAGUES} from '../game/goV2';
import {dayV2} from '../game/safariV2';
import type {GameViewV2} from '../game/typesV2';
import type {RunV2} from './ShopViewV2';
import {SpriteView} from './artV2';
import {Text} from 'react-native';
import {species} from '../game/catalogV2';
import {Button,font,Glyph,Help,Label,Panel,v} from './uiV2';
import {PO,PoPill,PoBar} from './PogoUiV2';
import {MainTypeEmblemV2} from './TypeEmblemV2';

export function GoEchoArenaV2({view,run,busy,now,onChooseTeam}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;onChooseTeam?:()=>void}){
 const [details,setDetails]=useState(false),p=view.player,g=p.go!,e=g.echo,issue=echoTeamIssue(p),defense=e?.defense;
 const remaining=Math.max(0,ECHO_DAILY_LIMIT-(e?.day===dayV2(now)?e.rewarded:0));
 const team=[0,1,2].map(i=>p.specimens.find(s=>s.id===g.team[i]&&s.go));
 return <View style={{gap:12}}><View style={[v.row,{justifyContent:'space-between'}]}><Text style={{fontFamily:font,fontSize:16,fontWeight:'800',color:PO.text}}>Mijn team</Text><View style={[v.row,{gap:8}]}><Text accessibilityLabel={remaining+' beloningen over'} style={{fontFamily:font,fontSize:13,fontWeight:'700',color:PO.muted}}>🎁 {remaining}/{ECHO_DAILY_LIMIT}</Text><Help title="Direct duel" body={'⚔️ Tegen een opgeslagen team of een computer.\n🎁 Eerste '+ECHO_DAILY_LIMIT+' per dag geven een beloning.'}/></View></View>
  {view.goBattle?.echo&&view.goBattle.echo.policy!=='owned-1'&&view.goBattle.echo.normalized!==false&&<Label small>Opgeslagen duel · oude vaste stats</Label>}
  <View style={{flexDirection:'row',gap:8}}>{team.map((s,i)=>{const f=s?fighterGo(s):null;return <Pressable key={i} accessibilityRole="button" accessibilityLabel={s?species(s.species).name+' '+(f?.cp??0)+' CP':'Kies een bug'} onPress={onChooseTeam} style={{flex:1,borderRadius:16,overflow:'hidden',backgroundColor:'#0C2622',borderWidth:1,borderColor:PO.rim}}>{s&&f?<><View style={{height:96,alignItems:'center',justifyContent:'center',backgroundColor:'#FFFFFF0D'}}><SpriteView id={s.species} shiny={s.shiny} size={92}/></View><View style={{padding:7,gap:5}}><View style={{flexDirection:'row',alignItems:'center',gap:5}}><MainTypeEmblemV2 species={s.species} size={18}/><Text style={{fontFamily:font,fontSize:13,fontWeight:'800',color:PO.text}}>CP {f.cp}</Text></View><PoBar value={1} max={1} color="#56D364"/></View></>:<View style={{height:140,alignItems:'center',justifyContent:'center'}}><Glyph name="team" size={38}/></View>}</Pressable>;})}</View>
  {onChooseTeam&&<PoPill variant="ghost" height={44} icon="team" label="Team kiezen" onPress={onChooseTeam}/>}
  <PoPill height={64} icon="swords" label={remaining?'Duel':'Oefenen'} accessibilityLabel={remaining?'Start duel':'Oefen een duel'} disabled={busy||!!issue} onPress={()=>void run('echoQueue')}/>
  {issue&&<Label small color="#F0C69B">{issue}</Label>}
  <Pressable accessibilityRole="button" accessibilityLabel="Echo-verdediging en ranglijst" onPress={()=>setDetails(!details)} style={{minHeight:40,justifyContent:'center',alignItems:'center'}}><Text style={{fontFamily:font,fontSize:13,fontWeight:'700',color:PO.muted}}>{details?'Verberg':'🏆 Ranglijst · 🛡️ Verdediging'}</Text></Pressable>
  {details&&<><Label small>{defense?'Bewaard: '+LEAGUES[defense.league].name+' · '+new Date(defense.savedAt).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})+(defense.policy==='owned-1'?' · echte stats':' · oude vaste stats'):'Je team wordt bewaard zodra je een geldig strijdteam kiest.'}</Label><Button small secondary disabled={busy||!!issue||!view.linked} onPress={()=>void run('echoSave')}>Werk verdediging bij</Button>{!view.linked&&<Label small>Koppel je account om je verdediging met spelers te delen.</Label>}{view.echoLeaderboard?.length?view.echoLeaderboard.slice(0,5).map((r,i)=><View key={i} style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1}}><Label small bold={r.me}>{i+1}. {r.name}</Label></View><Label small>{r.rating}</Label></View>):<Label small>Nog geen gespeelde spelerduels.</Label>}</>}
 </View>;
}
