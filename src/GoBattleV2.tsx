import {gymBattleHint} from '../game/gymsV2';
import React,{useContext,useEffect,useRef,useState} from 'react';

import {Pressable,ScrollView,Text,TextInput,useWindowDimensions,View} from 'react-native';

import {CHARGED,FAST,HELD,LEAGUES,movePool,stats,teamIssue} from '../game/goV2';

import {battleTurnMs,effectiveness} from '../game/goBattleV2';
import {typeMatchup} from '../game/recommendV2';

import type {GameViewV2} from '../game/typesV2';

import {species} from '../game/catalogV2';

import type {RunV2} from './ShopViewV2';

import {Scene,SpriteView} from './artV2';

import {cupTheme,pvpView,suggestTeam} from '../game/pvpV2';
import {TabsV2} from './TabsV2';
import {PvpGainV2,RankCardV2,RankMedalV2,RewardTrackV2,SeasonNewsV2} from './PvpRankV2';
import {ResultFxV3} from './ResultFxV3';
import {CupPanelV2} from './CupV2';

import {Button,Counter,font,Glyph,Help,IconButton,Label,MotionPrefs,Panel,Title,v,Wash,useInfo} from './uiV2';
import {PO} from './PogoUiV2';

import {GoTeamPickerV2} from './GoTeamPickerV2';

import {GoEchoArenaV2} from './GoEchoArenaV2';

import {GoBossV2} from './GoBossV2';

import {GoDailyChallengeV2} from './GoDailyChallengeV2';

import {GoBattleStageV2} from './GoBattlePresentationV2';
import {ChargeGameV2} from './ChargeGameV2';

import {GO_TYPES,GoTypeHelp,GoTypes} from './GoTypeV2';

import {battleReadyEnergy,BattleInputBuffer} from './goBattleInputV2';

import type {BufferedBattleAction} from './goBattleInputV2';

function useBattleInput(view:GameViewV2,run:RunV2,busy:boolean,now:number,active:boolean){

 const buffer=useRef(new BattleInputBuffer()),working=useRef(false),waitingRevision=useRef(-1),clock=useRef({now,received:Date.now()}),current=useRef({view,run,busy,now,received:Date.now()}),[queued,setQueued]=useState<string|null>(null),[targets,setTargets]=useState<number[]>([]),[shield,setShield]=useState<boolean>();

 if(clock.current.now!==now)clock.current={now,received:Date.now()};

 current.current={view,run,busy,now,received:clock.current.received};

 const sync=()=>{setQueued(buffer.current.queued);const pending=buffer.current.pendingTargets;setTargets(prior=>prior.join(',')===pending.join(',')?prior:pending);setShield(buffer.current.pendingShield);};

 const flush=()=>{const c=current.current,at=c.now+Date.now()-c.received;

  const action=buffer.current.take(c.view.goBattle??null,at,c.busy||working.current||c.view.player.revision<=waitingRevision.current);sync();

  if(!action)return;working.current=true;waitingRevision.current=c.view.player.revision;

  void c.run('goAct',action).then(ok=>{if(!ok){buffer.current.clear();waitingRevision.current=-1;}}).finally(()=>{working.current=false;sync();});

 };

 useEffect(()=>{buffer.current.clear();waitingRevision.current=-1;sync();if(!active||!view.goBattle||view.goBattle.phase==='finished')return;const timer=setInterval(flush,50);return()=>{clearInterval(timer);buffer.current.clear();};},[active,view.goBattle?.id,view.goBattle?.phase,view.player.uid]);

 const tap=(action:BufferedBattleAction['action'],value:BufferedBattleAction['value']=null)=>{const c=current.current,b=c.view.goBattle;if(!active||!b)return;buffer.current.push(b,action,value,c.now+Date.now()-c.received);sync();flush();};

 return {tap,queued,targets,shield};

}
function HP({value,max}:{value:number;max:number}){return <View style={{width:'100%',height:7,borderRadius:5,overflow:'hidden',backgroundColor:'#0B2523',borderWidth:1,borderColor:'#DBEAD45C'}}><View style={{height:'100%',width:(value/max*100+'%') as '100%',backgroundColor:value/max>.5?'#8ED99B':value/max>.2?'#F0CC70':'#EC8A77'}}/></View>;}

export function GoBattleV2({view,run,busy,now,open,active=true}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;open?:(name:string)=>void;active?:boolean}){

 const reduced=useContext(MotionPrefs);
 const p=view.player,g=p.go!,b=view.goBattle,[picking,setPicking]=useState(false),[code,setCode]=useState(''),[invite,setInvite]=useState(false),[inviteMade,setInviteMade]=useState(0),[mode,setMode]=useState<'duel'|'cup'|'daily'|'boss'|'live'|'rank'>('duel'),[ranks,setRanks]=useState(false),[searchExpired,setSearchExpired]=useState(false),queued=useRef(g.queue?.until),info=useInfo(),{height}=useWindowDimensions(),fighterSize=Math.max(72,Math.min(160,(height-340)*.36)),live=mode==='live';

 useEffect(()=>{if(queued.current&&!g.queue&&!b&&now>=queued.current)setSearchExpired(true);if(g.queue)setSearchExpired(false);queued.current=g.queue?.until;},[g.queue?.until,b?.id]);

 const input=useBattleInput(view,run,busy,now,active);

 if(b){const side=b.side,other=1-side,a=b.teams[side][b.active[side]],enemy=b.teams[other][b.active[other]],charge=b.charge,canTap=b.phase==='fight'&&a.hp>0&&enemy.hp>0&&!b.replaceAt.some(Boolean),fast=FAST[a.go.fast],simple=b.flow===2,cooldown=Math.max(0,a.readyAt-now),readyEnergy=battleReadyEnergy(b),queuedAction=input.queued??b.queued?.[side]?.kind,hitTargets=charge?[...new Set([...charge.hits,...input.targets])]:[],chargeArtSize=Math.min(simple?90:150,Math.max(54,(height-330)/3));

  if(b.phase==='finished'){const reward=b.rewards?.[side],delta=side===0?b.delta:-b.delta;return <View style={{flex:1,justifyContent:'center',padding:22,gap:20}}><Scene index={4}/><ResultFxV3 key={'fx'+b.id} kind={b.winner===null?'draw':b.winner===side?'win':'lose'} title={b.winner===null?'Gelijkspel':b.winner===side?'Gewonnen!':'Verloren'} subtitle={b.ranked&&delta?(delta>0?'+':'')+delta+' Elo':b.plaagbende?.rescued&&b.winner===side?'Bug gered!':b.winner!==side&&b.winner!==null?'Volgende keer beter!':undefined}/><Panel style={{alignItems:'center',gap:15}}>{b.plaagbende?.rewarded&&b.plaagbende.rescued?<View testID="plaag-rescued" style={{alignItems:'center'}}><View style={{width:120,height:120,borderRadius:60,backgroundColor:'#F2D16E33',borderWidth:3,borderColor:'#F2D16E',alignItems:'center',justifyContent:'center'}}><SpriteView id={b.plaagbende.rescued} size={100}/></View><Glyph name="star" size={30}/></View>:<RankMedalV2 rank={pvpView(p,now).rank} size={96}/>}<Title>{b.winner===null?'Gelijkspel':b.winner===side?'Gewonnen':'Verloren'}</Title><Label bold>{b.plaagbende?(b.plaagbende.rewarded?'🦝 Plaagbende verslagen · '+(b.plaagbende.rescued?species(b.plaagbende.rescued).name+' gered!':'bug gered!'):'🦝 Plaagbende · probeer opnieuw'):b.raid?(b.winner===side?'Zwerm verslagen · haal je beloning bij Gyms':'Zwerm · nog niet verslagen; vecht mee zolang de tijd loopt'):b.gym?'Gym · geen Elo':b.dailyChallenge?(b.dailyChallenge.practice?'Dagstrijd · oefenen · geen score':'Dagstrijd · score '+(b.dailyChallenge.score??0)):b.boss?'Dagbaas · '+(b.boss.rewarded?'beloning verdiend':'geen nieuwe beloning'):b.echo?(b.echo.npc?'Veldwachter · geen rating':(b.echo.policy==='owned-1'?'Opgeslagen team · ':'Opgeslagen team · oude regels · ')+((b.echo.delta??0)>0?'+':'')+(b.echo.delta??0)+' rating'):g.pvp?.cupBattle===b.id||g.pvp?.last?.battle===b.id&&g.pvp.last.cup?cupTheme(now).emoji+' Weekbeker':b.training?'Oefenduel':b.ranked?(delta>0?'+':'')+delta+' Elo':'Vriendenduel · geen Elo'}</Label>{b.echo?.rewarded===false&&<Label small>Oefenduel · geen beloning</Label>}{reward&&(b.ranked||b.echo||b.boss||b.dailyChallenge||b.plaagbende?.rewarded)&&<View accessibilityLabel="Gevechtsbeloning" style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:16}}><Counter icon="nectar" value={'+'+reward.dust} label="✨ Stof verdiend"/>{reward.xp>0&&<Counter icon="star" value={'+'+reward.xp} label="XP verdiend"/>}{reward.fastTMs>0&&<Counter icon="attack" value={'+'+reward.fastTMs} label="Snelle TM verdiend"/>}{reward.chargedTMs>0&&<Counter icon="burst" value={'+'+reward.chargedTMs} label="Opgeladen TM verdiend"/>}{reward.item&&<Counter icon={HELD[reward.item].icon} value="+1" label={HELD[reward.item].name}/>}</View>}{g.pvp?.last?.battle===b.id&&<PvpGainV2 gain={g.pvp.last}/>}{b.gym&&<Label small>{gymBattleHint(view.goGyms?.find(g=>g.id===b.gym!.id),b.winner===side)}</Label>}{b.boss?.post&&b.boss.rewarded&&b.winner===side&&<Button icon="leaf" disabled={busy} onPress={()=>void run('goClose',{battle:b.id}).then(ok=>{if(ok)open?.('map');})}>Vang kaartbaas</Button>}<Button onPress={()=>void run('goClose',{battle:b.id}).then(ok=>{if(ok&&(b.gym||b.raid))open?.('gyms');})} disabled={busy}>{b.gym?'Naar gyms':b.raid?'Naar raid':'Verder'}</Button></Panel></View>;}

  return <View style={{flex:1,padding:12,gap:6,backgroundColor:'#143F38'}}><Scene index={4} dim={.16}/><Wash from="#153B311A" to="#0C322DBB"/>

   <View style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1}}><Label small bold color="white">{b.names[other]}</Label><Label small color="#C9DDBE">{b.raid?'Samen tegen de raidbaas':b.echo?(b.echo.npc?'Veldwachter':'Opgeslagen team'):'Tegenstander'}</Label></View><Label small color="#F5EACB">{Math.max(0,Math.ceil((b.endsAt-now)/1000))} s</Label>{!b.gym&&<View style={v.row}>{[0,1].map(i=><View key={i} style={{opacity:i<b.shields[other]?1:.2}}>{b.flow===3?<Text accessibilityLabel="Ontwijking" style={{fontSize:21,color:'#c7f4eb'}}>↔</Text>:<Glyph name="shield" size={23}/>}</View>)}</View>}<IconButton name="close" label="Gevecht opgeven" onPress={()=>info.show({title:'Gevecht opgeven?',body:'Je tegenstander wint dit duel.',icon:'swords',action:{label:'Geef op',onPress:()=>{void run('goAct',{action:'forfeit',value:null}).then(ok=>{if(ok)info.hide();});}}})}/></View>

   <GoBattleStageV2 battle={b} size={fighterSize} canTap={canTap} cooldown={cooldown} queued={queuedAction} onFast={aim=>input.tap('fast',b.flow===3?aim??null:null)} onDodge={trace=>input.tap('dodge',trace)} now={now} active={active} onInfo={()=>info.show({title:fast.name,icon:GO_TYPES[fast.type].icon,body:fast.power+' kracht · +'+fast.energy+' energie · '+fast.turns*battleTurnMs(b)/1000+' s. '+(b.flow===3?'Tik op de cirkel voor maximaal 15% extra schade. Vasthouden herhaalt gewone aanvallen.':'Tik op het veld voor een snelle aanval. Een extra tik wordt één keer bewaard.')+' Beide opgeladen aanvallen gebruiken dezelfde energievoorraad.'})}/>

   <View style={[v.row,{justifyContent:'space-between'}]}>{!b.gym?<View accessibilityLabel={b.shields[side]+(b.flow===3?' ontwijkingen over':' schilden over')} style={v.row}>{[0,1].map(i=><View key={i} style={{opacity:i<b.shields[side]?1:.2}}>{b.flow===3?<Text accessibilityLabel="Ontwijking" style={{fontSize:25,color:'#c7f4eb'}}>↔</Text>:<Glyph name="shield" size={27}/>}</View>)}</View>:<View/>}<Help title="Gevecht" body={b.flow===3?"Tik in het veld om aan te vallen. Richten op de cirkel geeft maximaal 15% extra schade; vasthouden herhaalt gewone aanvallen. Kies een volle aanvalmeter. Bij een waarschuwing: veeg horizontaal zodra ‘Veeg nu!’ verschijnt voor 75% minder schade. Je team kan tweemaal ontwijken. Wisselen kan iedere 12 seconden.":simple?"Je bug valt zelf aan, net als je tegenstander. Snelle aanvallen vullen je energie. Kies een volle aanval: goedkoop en snel, of sparen voor meer schade. Tik de vier lichtjes voor extra kracht. Een schild houdt een grote aanval tegen; je hebt er twee. Wissel naar een sterke typekeuze (👍). Na wisselen wacht je 12 seconden. Tikken op het veld geeft geen extra schade.":b.gym?"Tik op het gevechtsveld voor snelle aanvallen. Tik op een volle aanvalmeter voor een opgeladen aanval. Houd een meter vast voor de naam, kracht en energiekosten. Gymverdedigers vechten automatisch. Geen schilden of Elo. Iedere verslagen bug verliest een hart; bij nul komt hij terug.":"Tik waar je wilt op het gevechtsveld voor een snelle aanval. Een extra tik tijdens de wachttijd wordt één keer bewaard. Snelle aanvallen vullen beide meters uit dezelfde energievoorraad. Tik op een volle meter voor een opgeladen aanval en raak de acht doelen. De kleur en het icoon tonen het aanvalstype. Houd de meter vast om kracht en energiekosten te zien; stats en types bepalen de schade. Houd een meter vast voor aanvalsinformatie. Bij een vijandelijke opgeladen aanval kun je één van je twee schilden gebruiken. Tik op een teambug om te wisselen. Energie blijft bewaard; daarna geldt een wisselwachttijd."}/></View>

   <View style={{flexDirection:'row',gap:8}}>{[0,1].map(slot=>{const move=a.go.charged[slot];if(!move)return <Pressable key={'locked-'+slot} testID={'battle-charged-'+slot} accessibilityRole="button" accessibilityLabel="Tweede aanval vergrendeld" onPress={()=>info.show({title:'Tweede aanval',icon:'lock',body:'Deze bug heeft nog geen tweede opgeladen aanval. Leer die eerst in je collectie met ✨ Stof en nectar.'})} style={{flex:1,minHeight:82,borderRadius:23,backgroundColor:'#163E36',borderWidth:2,borderColor:'#72918066',alignItems:'center',justifyContent:'center'}}><Glyph name="lock" size={26}/><Label small color="#C4D7BC">Tweede aanval</Label><View style={{position:'absolute',right:10,top:8}}><Glyph name="info" size={16}/></View></Pressable>;const m=CHARGED[move],type=GO_TYPES[m.type],ready=canTap&&readyEnergy>=m.energy,matchup=effectiveness(m.type,movePool(enemy.species).types);return <Pressable key={move} testID={'battle-charged-'+slot} accessibilityRole="button" accessibilityLabel={m.name+' · '+m.power+' kracht · '+Math.min(readyEnergy,m.energy)+' van '+m.energy+' energie'} accessibilityHint="Houd vast voor aanvalsinformatie" accessibilityState={{disabled:!ready}} onPress={()=>{if(ready)input.tap('charged',move);}} onLongPress={()=>info.show({title:m.name,icon:type.icon,body:type.name+' · '+m.power+' kracht · kost '+m.energy+' energie.'+(matchup>1?' Sterk tegen deze tegenstander.':matchup<1?' Zwak tegen deze tegenstander.':'')+(b.flow===3?' De aanval gaat direct af. Bij ‘Veeg nu!’ kun je horizontaal ontwijken voor minder schade.':simple?' Tik de vier lichtjes voor extra kracht. Een schild vangt de aanval op.':' Tik alle acht doelen voor extra kracht. Een schild vangt de aanval op.')+' Stats en types bepalen de schade.'})} style={({pressed})=>({flex:1,minHeight:82,borderRadius:23,overflow:'hidden',backgroundColor:'#102E29',borderWidth:2,borderColor:ready?'#FFE3A0':type.color,alignItems:'center',justifyContent:'center',gap:3,transform:[{scale:pressed&&ready?.97:1}]})}><View pointerEvents="none" style={{position:'absolute',bottom:0,left:0,right:0,height:(Math.min(100,readyEnergy/m.energy*100)+'%') as '100%',backgroundColor:type.color,borderTopWidth:readyEnergy>0?2:0,borderTopColor:'#FFF1C0'}}/><View pointerEvents="none" style={{alignItems:'center',gap:2}}><View style={[v.row,{gap:5,paddingHorizontal:7,borderRadius:10,backgroundColor:'#102E29E8'}]}><Glyph name={type.icon} size={20}/><Label small bold color="#FFF5DB">{m.power}{matchup>1?' ↑':matchup<1?' ↓':''}</Label></View><View style={{paddingHorizontal:5,borderRadius:8,backgroundColor:'#102E29E8'}}><Label small bold color="#FFF5DB">{m.name}</Label></View><View style={{paddingHorizontal:6,borderRadius:8,backgroundColor:'#102E29E8'}}><Label small bold color="#FFF5DB">{ready?'KLAAR':Math.min(readyEnergy,m.energy)+' / '+m.energy}</Label></View></View>{ready&&<View pointerEvents="none" style={{position:'absolute',right:9,top:7}}><Glyph name="check" size={18}/></View>}{matchup!==1&&<View testID={'battle-matchup-'+slot} pointerEvents="none" style={{position:'absolute',left:7,top:6,paddingHorizontal:6,paddingVertical:1,borderRadius:9,backgroundColor:matchup>1?'#2F6B3AF0':'#6B3A2FF0'}}><Label small bold color="#FFF5DB">{matchup>1?'👍 Sterk':'👎 Zwak'}</Label></View>}</Pressable>;})}</View>

   {(()=>{const now_=typeMatchup(a.species,enemy.species),better=b.teams[side].findIndex((u,i)=>i!==b.active[side]&&u.hp>0&&typeMatchup(u.species,enemy.species).good);return a.hp>0&&now_.danger&&better>=0&&b.phase==='fight'?<View testID="swap-tip" style={{alignSelf:'center',paddingHorizontal:10,paddingVertical:4,borderRadius:12,backgroundColor:'#5A3A1FE6',borderWidth:1,borderColor:'#FFB45A'}}><Label small bold color="#FFD27A">{'⚠️ '+species(enemy.species).name+' → wissel naar '+species(b.teams[side][better].species).name+' 👍'}</Label></View>:null;})()}{a.hp<=0&&<Label small bold color="#FFF0C5">Kies je volgende bug · {Math.max(0,Math.ceil(((b.replaceAt?.[side]??now)-now)/1000))}</Label>}<View style={{flexDirection:'row',gap:8}}>{b.teams[side].map((u,i)=><Pressable key={u.id} accessibilityRole="button" accessibilityLabel={'Wissel naar '+species(u.species).name} disabled={b.phase!=='fight'||i===b.active[side]||u.hp<=0||a.hp>0&&b.swapAt[side]>now} onPress={()=>input.tap('switch',i)} style={{flex:1,padding:5,borderRadius:19,borderWidth:2,borderColor:i===b.active[side]?'#F0CA71':'#FFFFFF33',opacity:u.hp>0?1:.3,backgroundColor:'#214A40EB',alignItems:'center'}}><SpriteView id={u.species} shiny={u.shiny} size={44}/>{u.hp>0&&(()=>{const t=typeMatchup(u.species,enemy.species);return t.good?<View testID={'switch-good-'+i} style={{position:'absolute',left:4,top:3}}><Label small>👍</Label></View>:t.danger?<View style={{position:'absolute',left:4,top:3}}><Label small>⚠️</Label></View>:null;})()}<HP value={u.hp} max={u.maxHP}/><Label small color="#F0E6C8">{u.hp<=0?'Uitgeschakeld':i===b.active[side]?'In het veld':a.hp>0&&b.swapAt[side]>now?Math.ceil((b.swapAt[side]-now)/1000)+' s':'Wissel'}</Label></Pressable>)}</View>

   {charge&&b.flow!==3&&<View style={{position:'absolute',inset:0,backgroundColor:charge.side===side?'#0B2824ED':'#2B1512F0',justifyContent:'center',padding:18,gap:12,alignItems:'center'}}><View pointerEvents="none" style={{position:'absolute',left:'10%',right:'10%',top:'18%',aspectRatio:1,borderRadius:999,backgroundColor:charge.side===side?GO_TYPES[CHARGED[charge.move].type].color+'33':'#E2574233',boxShadow:charge.side===side?undefined:'0px 0px 80px #E25742AA'}}/><SpriteView id={charge.side===side?a.species:enemy.species} shiny={charge.side===side?a.shiny:enemy.shiny} size={chargeArtSize} animate/>{charge.side!==side&&<Label small bold color="#FFB09C">PAS OP!</Label>}<Text accessibilityRole="header" style={{fontFamily:font,fontSize:simple?24:28,fontWeight:'900',textAlign:'center',color:charge.side===side?'#FFF1CD':'#FFE1D6',textShadowColor:'#061A16',textShadowOffset:{width:0,height:2},textShadowRadius:6}}>{CHARGED[charge.move].name}</Text><Text style={{fontFamily:font,fontSize:simple?28:40,fontWeight:'900',fontVariant:['tabular-nums'],color:'#F7E9BF',textShadowColor:'#061A16',textShadowRadius:6}}>{Math.max(0,Math.ceil((charge.deadline-now)/1000))}</Text>{charge.side===side?(reduced||simple?<><View style={{flexDirection:'row',alignItems:'center',gap:6}}><Glyph name={GO_TYPES[CHARGED[charge.move].type].icon} size={23}/><Label small color="#F7E9BF">{simple?'Tik 4 lichtjes':GO_TYPES[CHARGED[charge.move].type].name+' · Raak alle 8 doelen'}</Label></View><View style={{width:256,flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:9}}>{Array.from({length:simple?4:8},(_,i)=><Pressable key={i} accessibilityRole="button" accessibilityLabel={'Energiedoel '+(i+1)} disabled={hitTargets.includes(simple?i*2:i)||now>=charge.deadline} onPress={()=>input.tap('chargeTap',simple?[i*2,i*2+1]:i)} style={{width:57,height:57,alignItems:'center',justifyContent:'center',borderRadius:29,borderWidth:2,borderColor:'#C7E6CB',backgroundColor:hitTargets.includes(simple?i*2:i)?'#72B995':GO_TYPES[CHARGED[charge.move].type].color+'66',opacity:hitTargets.includes(simple?i*2:i)?.6:1}}><Glyph name={hitTargets.includes(simple?i*2:i)?'check':GO_TYPES[CHARGED[charge.move].type].icon} size={34}/></Pressable>)}</View><Label small color="#F7E9BF">{simple?Math.floor(hitTargets.length/2):hitTargets.length} / {simple?4:8}</Label></>:<ChargeGameV2 key={charge.startedAt} type={CHARGED[charge.move].type} hits={hitTargets.length} ended={now>=charge.deadline} reduced={reduced} onHit={()=>{const next=Array.from({length:8},(_,i)=>i).find(i=>!hitTargets.includes(i));if(next!==undefined)input.tap('chargeTap',next);}}/>):charge.shield===null&&input.shield===undefined?<><Label small center color="#F7E9BF">{b.shields[side]>0?'Een schild houdt deze aanval tegen':'Geen schilden meer over'}</Label><Pressable accessibilityRole="button" accessibilityLabel={'Schild · '+b.shields[side]} accessibilityState={{disabled:b.shields[side]<1}} disabled={b.shields[side]<1} onPress={()=>input.tap('shield',true)} style={({pressed})=>({width:simple?96:132,height:simple?96:132,borderRadius:simple?48:66,alignItems:'center',justifyContent:'center',gap:2,backgroundColor:'#2E7FA0',borderWidth:4,borderColor:'#BDEBF5',boxShadow:'0px 0px 34px #8FDAEAAA',opacity:b.shields[side]<1?.4:1,transform:[{scale:pressed?.94:1}]})}><Glyph name="shield" size={simple?44:64}/><Label bold color="#F2FBFF">Schild · {b.shields[side]}</Label></Pressable><Button small secondary onPress={()=>input.tap('shield',false)}>Zonder schild</Button></>:<><Glyph name={(charge.shield??input.shield)?'shield':'check'} size={65}/><Label small color="#F7E9BF">{(charge.shield??input.shield)?'Schild klaar':'Aanval komt eraan'}</Label></>}</View>}

  </View>;

 }

 if(g.queue)return <View style={{flex:1,justifyContent:'center',padding:22,gap:20}}><Scene index={4}/><Panel style={{alignItems:'center',gap:20}}><Glyph name="swords" size={80}/><Title>Tegenstander zoeken</Title><Label>{LEAGUES[g.queue.league].name} · {Math.max(0,Math.ceil((g.queue.until-now)/1000))} s</Label><Button secondary disabled={busy} onPress={()=>void run('goCancel')}>Stop zoeken</Button></Panel></View>;

 const pool=p.specimens.filter(s=>s.go).sort((a,b)=>stats(b).cp-stats(a).cp),issue=teamIssue(p,g.team,g.league),valid=!issue,strong=suggestTeam(p,LEAGUES[g.league].cap);

 const leader=p.specimens.find(s=>s.id===g.team[0]&&s.go),teamCp=g.team.map(id=>p.specimens.find(s=>s.id===id&&s.go)).reduce((n,s)=>n+(s?stats(s).cp:0),0);
 return <ScrollView contentContainerStyle={{paddingBottom:16}}><View testID="strijd-hero" style={{height:160,overflow:'hidden',justifyContent:'space-between'}}><Scene index={4}/><Wash from="#0B222400" to="#0B2224F2"/>
  <View style={{flexDirection:'row',justifyContent:'flex-end',gap:8,padding:14}}><GoTypeHelp/><Help title="Strijd" body={'⚔️ Duel · 🏆 Beker · 🎯 Dag · 🏅 Rang'}/></View>
  {leader&&<View pointerEvents="none" style={{position:'absolute',right:-6,top:28}}><SpriteView id={leader.species} shiny={leader.shiny} size={140} animate/></View>}
  <View style={{paddingHorizontal:18,paddingBottom:14,gap:2}}><Text accessibilityRole="header" style={{fontFamily:font,fontSize:36,fontWeight:'800',color:PO.text,textShadowColor:'#000A',textShadowOffset:{width:0,height:2},textShadowRadius:8}}>Strijd</Text><Text style={{fontFamily:font,fontSize:17,fontWeight:'700',color:PO.text,textShadowColor:'#000A',textShadowRadius:6}}>Team · CP {teamCp}</Text></View>
 </View><View style={{padding:16,paddingTop:12,gap:14}}>

  <View testID="battle-tab" accessibilityRole="tablist" style={{flexDirection:'row',gap:6}}>{([{id:'duel',emoji:'⚔️',name:'Duel'},{id:'cup',emoji:cupTheme(now).emoji,name:'Beker'},{id:'daily',emoji:'🎯',name:'Dag'},{id:'rank',emoji:'🏅',name:'Rang'}] as const).map(t=>{const on=(mode==='live'?'duel':mode==='boss'?'daily':mode)===t.id;return <Pressable key={t.id} testID={'battle-tab-'+t.id} accessibilityRole="tab" accessibilityLabel={t.name} accessibilityState={{selected:on}} onPress={()=>setMode(t.id)} style={{flex:1,height:44,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5,borderRadius:14,backgroundColor:on?PO.teal+'2E':PO.surface,borderWidth:on?1.5:1,borderColor:on?PO.tealText:PO.rim,boxShadow:on?'0px 0px 12px '+PO.teal+'55':undefined}}><Glyph name={t.id==='duel'?'swords':t.id==='cup'||t.id==='rank'?'cup':'research'} size={22}/><Text style={{fontFamily:font,fontSize:13,fontWeight:'800',color:on?PO.tealText:PO.text}}>{t.name}</Text></Pressable>;})}</View>
  {(mode==='daily'||mode==='boss')&&<View accessibilityRole="tablist" style={{flexDirection:'row',gap:8}}>{([{id:'daily',emoji:'🎯',name:'Dagstrijd'},{id:'boss',emoji:'👹',name:'Dagbaas'}] as const).map(tab=><Pressable key={tab.id} testID={'mode-'+tab.id} accessibilityRole="tab" accessibilityLabel={tab.name} accessibilityState={{selected:mode===tab.id}} onPress={()=>setMode(tab.id)} style={{flex:1,minHeight:40,flexDirection:'row',gap:6,alignItems:'center',justifyContent:'center',borderRadius:20,backgroundColor:mode===tab.id?'#FFFFFF1A':'transparent',borderWidth:1,borderColor:mode===tab.id?PO.rim:'transparent'}}><Glyph name={tab.id==='daily'?'research':'shield'} size={21}/><Text style={{fontFamily:font,fontSize:13,fontWeight:'700',color:mode===tab.id?PO.text:PO.muted}}>{tab.name}</Text></Pressable>)}</View>}
  {mode==='rank'&&<><RankCardV2 player={p} now={now}/><SeasonNewsV2 player={p} now={now}/><RewardTrackV2 player={p} now={now}/></>}

  {(mode==='duel'||live)&&strong.length===3&&strong.join()!==g.team.join()&&<Pressable accessibilityRole="button" accessibilityLabel="Kies sterk team" disabled={busy} onPress={()=>void run('goTeam',{ids:strong,league:g.league})} style={{alignSelf:'flex-end',flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:12,height:36,borderRadius:18,backgroundColor:PO.surface,borderWidth:1,borderColor:PO.tealText+'88'}}><Glyph name="check" size={18}/><Text style={{fontFamily:font,fontSize:13,fontWeight:'800',color:PO.tealText}}>Sterk team</Text></Pressable>}

  {mode==='duel'&&<><GoEchoArenaV2 {...{view,run,busy,now}} onChooseTeam={()=>setPicking(true)}/><Button small secondary icon="friends" onPress={()=>setMode('live')}>Live met andere spelers</Button></>}

  {mode==='cup'&&<CupPanelV2 {...{view,run,busy,now,open}}/>}

  {mode==='daily'&&<GoDailyChallengeV2 {...{view,run,busy,now}}/>}

  {mode==='boss'&&<GoBossV2 {...{view,run,busy,now}}/>}


  {live&&<><Button small secondary icon="back" onPress={()=>setMode('duel')}>Direct duel · altijd spelen</Button><Panel style={{flexDirection:'row',alignItems:'center',gap:16}}><Glyph name="cup" size={46}/><View style={{flex:1,gap:5}}><Title>Arena</Title><Label small>👥 Echte spelers · 🎟️ {Math.max(0,25-(g.ratedCount??0))} over</Label></View></Panel>



  <Panel><View style={[v.row,{justifyContent:'space-between'}]}><Label bold>{LEAGUES[g.league].emoji} {LEAGUES[g.league].name}</Label><IconButton name="settings" label="Team en arena kiezen" onPress={()=>setPicking(true)}/></View><View style={{flexDirection:'row',gap:8}}>{[0,1,2].map(i=>{const s=pool.find(s=>s.id===g.team[i]);return <Pressable key={i} accessibilityRole="button" accessibilityLabel={'Teamslot '+(i+1)} onPress={()=>setPicking(true)} style={{flex:1,minHeight:105,alignItems:'center',justifyContent:'center',borderRadius:19,backgroundColor:'#294F43'}}>{s?<><SpriteView id={s.species} shiny={s.shiny} size={70}/><Label small bold>{stats(s).cp} CP</Label><GoTypes species={s.species} compact/>{s.go!.item&&<Glyph name={HELD[s.go!.item].icon} size={22}/>}</>:<Glyph name="team" size={50}/>}</Pressable>;})}</View><Button icon="swords" disabled={busy||!valid||(g.ratedCount??0)>=25||!view.linked} onPress={()=>void run('goQueue')}>🏆 Zoek tegenstander</Button><View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button secondary small disabled={busy||!valid} onPress={()=>void run('goTrain')}>Training</Button></View><View style={{flex:1}}><Button secondary small disabled={busy||!valid} onPress={()=>setInvite(!invite)}>Vriendenduel</Button></View></View>{!view.linked&&valid&&open&&<Button small secondary icon="profile" onPress={()=>open('account')}>Koppel account voor Ranked</Button>}{!valid&&<><Label small>{issue}</Label>{new Set(pool.map(s=>s.species)).size<3&&open&&<Button small secondary icon="compass" onPress={()=>open('map')}>Ga vangen</Button>}</>}</Panel>

  {invite&&<Panel><Button small secondary disabled={busy||!valid} onPress={()=>void run('goInvite').then(ok=>{if(ok)setInviteMade(now+300000);})}>Maak uitnodiging</Button><Label small center>Duelcode</Label><Label bold center>{p.friendCode}</Label>{inviteMade>0&&<Label small>{inviteMade>now?'Duelcode actief · '+Math.ceil((inviteMade-now)/60000)+' min':'Duelcode verlopen'}</Label>}<TextInput accessibilityLabel="Duelcode" placeholder="Code van vriend" placeholderTextColor="#B7CAB6" selectionColor="#A5CE87" maxLength={8} autoCapitalize="characters" value={code} onChangeText={v=>setCode(v.toUpperCase())} style={v.input}/><Button small disabled={busy||code.length!==8||!valid} onPress={()=>void run('goJoin',{code})}>Doe mee</Button></Panel>}

  {searchExpired&&<Panel><Label small>Niemand gevonden · probeer Training</Label><Button small disabled={busy||!valid} onPress={()=>void run('goTrain')}>Training</Button></Panel>}<Button small secondary onPress={()=>setRanks(!ranks)}>Ranglijst</Button>{ranks&&<Panel>{view.leaderboard.length?view.leaderboard.map((r,i)=><View key={i} style={[v.row,{justifyContent:'space-between'}]}><Label bold={r.me}>{i+1}. {r.name}</Label><Label>{r.rating}</Label></View>):<Label small>Nog geen Ranked-resultaten</Label>}</Panel>}

  </>}

  {(mode==='daily'||mode==='boss')&&<Button small secondary icon="team" onPress={()=>setPicking(true)}>Mijn strijdteam</Button>}

  {active&&picking&&<GoTeamPickerV2 player={p} {...{run,busy}} onClose={()=>setPicking(false)}/>}

 </View></ScrollView>;

}
