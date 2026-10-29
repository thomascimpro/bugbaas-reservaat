import React from 'react';
import {Text,View} from 'react-native';
import {RANKS,SEASON_REWARDS,TRACK,pvpView} from '../game/pvpV2';
import type {PvpGain,TrackReward,TrackSlot} from '../game/pvpV2';
import {species} from '../game/catalogV2';
import {RARITY_TIERS} from '../game/rarityDisplayV2';
import type {PlayerV2} from '../game/typesV2';
import {SpriteView} from './artV2';
import {FieldActivityArt,FieldArt} from './FieldArtV2';
import {font,Glyph,Help,Label,Panel} from './uiV2';

/** Round coloured rank medal (emoji on the rank colour). Used on the Strijd screen and the trainer card. */
export function RankMedalV2({rank,size=56}:{rank:number;size?:number}){const r=RANKS[rank];return <View accessibilityLabel={'Rang '+r.name} style={{width:size,height:size,borderRadius:size/2,alignItems:'center',justifyContent:'center',backgroundColor:r.color,borderWidth:Math.max(2,size/18),borderColor:'#FFF6D6',boxShadow:'0px 0px '+Math.round(size/4)+'px '+r.color+'AA'}}><Text style={{fontSize:size*.5}}>{r.emoji}</Text></View>;}

/** Compact badge: medal + rank name (trainer card). */
export function RankBadgeV2({player,now=Date.now(),size=34}:{player:PlayerV2;now?:number;size?:number}){const s=pvpView(player,now),r=RANKS[s.rank];return <View testID="rank-badge" style={{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:8,paddingVertical:3,borderRadius:18,backgroundColor:'#00000033',borderWidth:1,borderColor:r.color}}><RankMedalV2 rank={s.rank} size={size}/><Label small bold color={r.color}>{r.name}</Label></View>;}

/** Strijd header: big medal, rank name, bar to the next rank and days left in the season. */
export function RankCardV2({player,now}:{player:PlayerV2;now:number}){
 const s=pvpView(player,now),r=RANKS[s.rank];
 return <Panel style={{flexDirection:'row',alignItems:'center',gap:14}}><RankMedalV2 rank={s.rank} size={70}/><View style={{flex:1,gap:5}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:6}}><Text style={{fontFamily:font,fontSize:24,fontWeight:'900',color:r.color}}>{r.name}</Text><View style={{flex:1}}/><Label small>🏅 {s.points}</Label></View>
  <View accessibilityLabel={s.next?'Op weg naar '+s.next.name:'Hoogste rang'} style={{flexDirection:'row',alignItems:'center',gap:6}}><View style={{flex:1,height:12,borderRadius:6,backgroundColor:'#345A49',overflow:'hidden'}}><View style={{height:12,width:(s.progress*100+'%') as `${number}%`,backgroundColor:r.color}}/></View><Text style={{fontSize:18}}>{s.next?.emoji??'🏆'}</Text></View>
  <Label small>📅 nog {s.daysLeft} {s.daysLeft===1?'dag':'dagen'}</Label>
 </View><Help title="Rang" body={'Win duels om punten 🏅 te halen: '+RANKS.map(x=>x.emoji+' '+x.name).join(' → ')+'.\n\nElke maand begint een nieuw seizoen. Dan krijg je een beloning voor je hoogste rang en zakken je punten half terug naar 1000.\n\n🥇 Goud en hoger: ook een 🥚 cocon. 💎 Platina en 👑 Kampioen: ook een zeldzame bug.'}/></Panel>;
}

/** Shown for three days after a season ended: what you won. */
export function SeasonNewsV2({player,now}:{player:PlayerV2;now:number}){
 const n=pvpView(player,now).lastSeason;if(!n)return null;
 return <Panel style={{alignItems:'center',gap:8,borderColor:RANKS[n.rank].color}}><Label bold>🎉 Nieuw seizoen!</Label><View style={{flexDirection:'row',alignItems:'center',gap:12,flexWrap:'wrap',justifyContent:'center'}}><RankMedalV2 rank={n.rank} size={44}/><Glyph name="nectar" size={26}/><Label bold>+{n.dust}</Label><FieldArt id="blue" size={28}/><Label bold>+{n.nets}</Label>{n.cocoon&&<FieldActivityArt id="cocoon" size={30}/>}{n.species&&<SpriteView id={n.species} size={44}/>}</View></Panel>;
}

function SlotArt({kind,reward,size}:{kind:TrackSlot;reward?:TrackReward;size:number}){
 if(kind==='dust')return <Glyph name="nectar" size={size}/>;
 if(kind==='nets')return <FieldArt id="blue" size={size}/>;
 if(kind==='tm')return <Glyph name={reward?.tm==='fast'?'attack':'burst'} size={size}/>;
 if(kind==='cocoon')return <FieldActivityArt id="cocoon" size={size}/>;
 return reward?.species?<SpriteView id={reward.species} shiny={reward.shiny} size={size+6}/>:<Text style={{fontSize:size*.8}}>⭐</Text>;
}
/** Daily reward track (GBL style): each win fills the next slot; slot 5 is a ★★★ bug. */
export function RewardTrackV2({player,now}:{player:PlayerV2;now:number}){
 const s=pvpView(player,now),won=s.track.length,rare=RARITY_TIERS[3].color;
 return <Panel style={{gap:8}}><View style={{flexDirection:'row',alignItems:'center',gap:6}}><Label bold>🎁 Winst vandaag</Label><View style={{flex:1}}/><Label bold>{won} / {TRACK.length}</Label><Help title="Beloningspad" body={'Elke gewonnen strijd (ook tegen de computer) vult het volgende vakje: '+TRACK.map(t=>t.emoji+' '+t.name).join(', ')+'.\n\nMorgen begint het pad opnieuw.'}/></View>
  <View style={{flexDirection:'row',gap:5}}>{TRACK.map((t,i)=>{const done=i<won,next=i===won,reward=s.rewards[i];return <View key={t.kind} testID={'track-slot-'+i} accessibilityLabel={(done?'Gewonnen: ':'Winst '+(i+1)+': ')+(reward?.species?species(reward.species).name:t.name)} style={{flex:1,aspectRatio:.82,borderRadius:14,alignItems:'center',justifyContent:'center',gap:2,backgroundColor:done?'#4E6B3A':next?'#2C5546':'#1D3D33',borderWidth:2,borderColor:done?'#F2D16E':next?'#A2C58D':i===4?rare+'99':'#FFFFFF22',opacity:done||next?1:.6}}>
   <SlotArt kind={t.kind} reward={reward} size={30}/>{i===4&&!done&&<Text style={{fontSize:9,color:rare,fontWeight:'900'}}>★★★</Text>}
   <View style={{position:'absolute',top:-6,left:-4,width:20,height:20,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:done?'#F2D16E':'#1D3D33',borderWidth:1,borderColor:'#FFF6D688'}}>{done?<Text style={{fontSize:11}}>✓</Text>:<Text style={{fontSize:11,fontWeight:'900',color:'#F5EACB'}}>{i+1}</Text>}</View>
  </View>;})}</View>
 </Panel>;
}

/** Season reward preview per rank (small row, used in the help panel of the Arena tab). */
export function SeasonRewardsRowV2(){return <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'center'}}>{SEASON_REWARDS.map((r,i)=><View key={i} style={{alignItems:'center',gap:2}}><RankMedalV2 rank={i} size={30}/><Label small>✨{r.dust}</Label>{r.cocoon&&<Text>🥚</Text>}{r.bug&&<Text>⭐</Text>}</View>)}</View>;}

/** After a battle: points, the reward-track slot you just filled, a new rank and cup stars. */
export function PvpGainV2({gain}:{gain:PvpGain}){
 return <View testID="pvp-gain" style={{alignItems:'center',gap:8}}>
  {gain.rankUp&&<View style={{alignItems:'center',gap:4}}><RankMedalV2 rank={gain.rank} size={64}/><Label bold color={RANKS[gain.rank].color}>Nieuwe rang: {RANKS[gain.rank].name}!</Label></View>}
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:12}}>
   {gain.points!==0&&<Label bold>{gain.points>0?'+':''}{gain.points} 🏅</Label>}
   {gain.slot!==null&&gain.reward&&<View accessibilityLabel={'Beloningspad vakje '+(gain.slot+1)} style={{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:8,paddingVertical:4,borderRadius:14,backgroundColor:'#4E6B3A',borderWidth:2,borderColor:'#F2D16E'}}><Label small bold>🎁 {gain.slot+1}/{TRACK.length}</Label><SlotArt kind={gain.reward.kind} reward={gain.reward} size={28}/></View>}
   {gain.cupStar&&<Label bold>⭐ Beker</Label>}
  </View>
  {gain.cupReward&&<View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text style={{fontSize:26}}>🏆</Text><Glyph name="nectar" size={24}/><Label bold>+{gain.cupReward.dust}</Label><Glyph name="burst" size={22}/>{gain.cupReward.species&&<SpriteView id={gain.cupReward.species} size={44}/>}</View>}
 </View>;
}
