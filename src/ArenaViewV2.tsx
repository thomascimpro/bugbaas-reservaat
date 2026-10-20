import React from 'react';
import {ScrollView,Text,View} from 'react-native';
import type {GameViewV2} from '../game/typesV2';
import {Scene} from './artV2';
import {BattleViewV2} from './BattleViewV2';
import {ShopViewV2,RunV2} from './ShopViewV2';
import {Button,Glyph,Label,Panel,Title,V,font,v} from './uiV2';

export function ArenaViewV2({view,run,busy,now}:{view:GameViewV2;run:RunV2;busy:boolean;now:number}){
 const p=view.player,r=p.arenaRun!,stats=p.arenaStats!;
 if(r.phase==='shop')return <ShopViewV2 arena view={view} run={run} busy={busy} now={now}/>;
 const note=r.rated?`${r.delta>0?'+':''}${r.delta} Elo`:r.reason==='repeat'?'Herhaling · zonder Elo':r.reason==='guest'?'Gastspel · zonder Elo':r.reason==='season'?'Vorig seizoen · zonder Elo':'Training · zonder Elo';
 if(r.phase==='battle'&&r.battle)return <BattleViewV2 key={r.id+'-'+r.round} battle={r.battle} round={r.round} ownName={p.name} enemyName={r.enemy!.name} soloLives={r.lives} opponentLabel={r.enemy!.kind==='player'?'Opgeslagen':'Training'} resultNote={note} reduced={p.settings.reducedMotion} sound={p.settings.sound} onContinue={()=>void run('arenaNext')} continueLabel={r.lives<=0||r.wins>=10||r.round>=30?'Bekijk resultaat':'Volgende ronde'}/>;
 return <ScrollView contentContainerStyle={{flexGrow:1,padding:20,paddingTop:90,paddingBottom:28,justifyContent:'center'}}><Scene index={4}/><Panel style={{alignItems:'center',paddingVertical:26,gap:20}}><Glyph name="cup" size={66} color={V.gold}/><Title>{r.wins>=10?'Arena gewonnen':'Arena klaar'}</Title><Text style={{fontFamily:font,fontSize:46,fontWeight:'700',color:V.ink}}>{r.wins}<Text style={{fontSize:23,color:V.muted}}> / 10</Text></Text><View style={v.row}><Label bold>{stats.rating} Elo</Label><Label color={r.ratingDelta>=0?V.pine:V.red} bold>{r.ratingDelta>0?'+':''}{r.ratingDelta}</Label></View><View style={{width:'100%',gap:10}}><Button disabled={busy} icon="swords" onPress={()=>void(async()=>{if(await run('arenaClose'))await run('arenaStart');})()}>Nieuwe arena</Button><Button secondary small disabled={busy} onPress={()=>void run('arenaClose')}>Terug naar Ranked</Button></View></Panel></ScrollView>;
}
