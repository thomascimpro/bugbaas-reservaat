import React,{useContext,useEffect,useRef,useState} from 'react';

import {Image,Pressable,ScrollView,Text,TextInput,useWindowDimensions,View} from 'react-native';

import {CHARGED,FAST,HELD,LEAGUES,movePool,stats,teamIssue} from '../game/goV2';

import {effectiveness} from '../game/goBattleV2';
import {typeMatchup} from '../game/recommendV2';

import type {GameViewV2} from '../game/typesV2';

import {species} from '../game/catalogV2';

import type {RunV2} from './ShopViewV2';

import {Scene,SpriteView} from './artV2';

import {legacyArt} from './legacyArtV2';

function RankEmblem({rating,size=130}:{rating:number;size?:number}){return <Image source={legacyArt[rating<1100?'bronze':rating<1300?'silver':'gold']} resizeMode="contain" style={{width:size,height:size}}/>;}

import {Button,Counter,font,Glyph,Help,IconButton,Label,MotionPrefs,Panel,Title,v,Wash,useInfo} from './uiV2';

import {GoTeamPickerV2} from './GoTeamPickerV2';

import {GoEchoArenaV2} from './GoEchoArenaV2';

import {GoBossV2} from './GoBossV2';

import {GoDailyChallengeV2} from './GoDailyChallengeV2';

import {GoBattleStageV2} from './GoBattlePresentationV2';
import {ChargeGameV2} from './ChargeGameV2';

import {GO_TYPES,GoTypeHelp,GoTypes} from './GoTypeV2';

import {battleReadyEnergy,BattleInputBuffer} from './goBattleInputV2';

import type {BufferedBattleAction} from './goBattleInputV2';

function useBattleInput(view:GameViewV2,run:RunV2,busy:boolean,now:number){

 const buffer=useRef(new BattleInputBuffer()),working=useRef(false),waitingRevision=useRef(-1),clock=useRef({now,received:Date.now()}),current=useRef({view,run,busy,now,received:Date.now()}),[queued,setQueued]=useState<string|null>(null),[targets,setTargets]=useState<number[]>([]),[shield,setShield]=useState<boolean>();

 if(clock.current.now!==now)clock.current={now,received:Date.now()};

 current.current={view,run,busy,now,received:clock.current.received};

 const sync=()=>{setQueued(buffer.current.queued);const pending=buffer.current.pendingTargets;setTargets(prior=>prior.join(',')===pending.join(',')?prior:pending);setShield(buffer.current.pendingShield);};

 const flush=()=>{const c=current.current,at=c.now+Date.now()-c.received;

  const action=buffer.current.take(c.view.goBattle??null,at,c.busy||working.current||c.view.player.revision<=waitingRevision.current);sync();

  if(!action)return;working.current=true;waitingRevision.current=c.view.player.revision;

  void c.run('goAct',action).then(ok=>{if(!ok){buffer.current.clear();waitingRevision.current=-1;}}).finally(()=>{working.current=false;sync();});

 };

 useEffect(()=>{buffer.current.clear();waitingRevision.current=-1;sync();if(!view.goBattle)return;const timer=setInterval(flush,50);return()=>{clearInterval(timer);buffer.current.clear();};},[view.goBattle?.id,view.player.uid]);

 const tap=(action:BufferedBattleAction['action'],value:BufferedBattleAction['value']=null)=>{const c=current.current,b=c.view.goBattle;if(!b)return;buffer.current.push(b,action,value,c.now+Date.now()-c.received);sync();flush();};

 return {tap,queued,targets,shield};

}
function HP({value,max}:{value:number;max:number}){return <View style={{width:'100%',height:7,borderRadius:5,overflow:'hidden',backgroundColor:'#0B2523',borderWidth:1,borderColor:'#DBEAD45C'}}><View style={{height:'100%',width:(value/max*100+'%') as '100%',backgroundColor:value/max>.5?'#8ED99B':value/max>.2?'#F0CC70':'#EC8A77'}}/></View>;}

export function GoBattleV2({view,run,busy,now,open}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;open?:(name:string)=>void}){

 const reduced=useContext(MotionPrefs);
 const p=view.player,g=p.go!,b=view.goBattle,[picking,setPicking]=useState(false),[code,setCode]=useState(''),[invite,setInvite]=useState(false),[inviteMade,setInviteMade]=useState(0),[mode,setMode]=useState<'duel'|'daily'|'boss'|'live'>('duel'),[ranks,setRanks]=useState(false),[searchExpired,setSearchExpired]=useState(false),queued=useRef(g.queue?.until),info=useInfo(),{height}=useWindowDimensions(),fighterSize=Math.max(72,Math.min(160,(height-340)*.36)),live=mode==='live';

 useEffect(()=>{if(queued.current&&!g.queue&&!b&&now>=queued.current)setSearchExpired(true);if(g.queue)setSearchExpired(false);queued.current=g.queue?.until;},[g.queue?.until,b?.id]);

 const input=useBattleInput(view,run,busy,now);

 if(b){const side=b.side,other=1-side,a=b.teams[side][b.active[side]],enemy=b.teams[other][b.active[other]],charge=b.charge,canTap=b.phase==='fight'&&a.hp>0&&enemy.hp>0&&!b.replaceAt.some(Boolean),fast=FAST[a.go.fast],cooldown=Math.max(0,a.readyAt-now),readyEnergy=battleReadyEnergy(b),queuedAction=input.queued??b.queued?.[side]?.kind,hitTargets=charge?[...new Set([...charge.hits,...input.targets])]:[],chargeArtSize=Math.min(150,Math.max(64,(height-330)/3));

  if(b.phase==='finished'){const reward=b.rewards?.[side],delta=side===0?b.delta:-b.delta;return <View style={{flex:1,justifyContent:'center',padding:22,gap:20}}><Scene index={4}/><Panel style={{alignItems:'center',gap:15}}><RankEmblem rating={g.rating} size={120}/><Title>{b.winner===null?'Gelijkspel':b.winner===side?'Gewonnen':'Verloren'}</Title><Label bold>{b.raid?(b.winner===side?'Zwerm verslagen · haal je beloning bij Gyms':'Zwerm · nog niet verslagen; vecht mee zolang de tijd loopt'):b.gym?'Gym · geen Elo':b.dailyChallenge?(b.dailyChallenge.practice?'Dagstrijd · oefenen · geen score':'Dagstrijd · score '+(b.dailyChallenge.score??0)):b.boss?'Dagbaas · '+(b.boss.rewarded?'beloning verdiend':'geen nieuwe beloning'):b.echo?(b.echo.npc?'NPC · geen rating':'Echo · '+((b.echo.delta??0)>0?'+':'')+(b.echo.delta??0)+' rating'):b.training?'Training · geen Elo':b.ranked?(delta>0?'+':'')+delta+' Elo':'Vriendenduel · geen Elo'}</Label>{b.echo?.rewarded===false&&<Label small>Oefenduel · geen beloning</Label>}{reward&&(b.ranked||b.echo||b.boss||b.dailyChallenge)&&<View accessibilityLabel="Gevechtsbeloning" style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:16}}><Counter icon="nectar" value={'+'+reward.dust} label="Nectarstof verdiend"/>{reward.xp>0&&<Counter icon="star" value={'+'+reward.xp} label="XP verdiend"/>}{reward.fastTMs>0&&<Counter icon="attack" value={'+'+reward.fastTMs} label="Snelle TM verdiend"/>}{reward.chargedTMs>0&&<Counter icon="burst" value={'+'+reward.chargedTMs} label="Opgeladen TM verdiend"/>}{reward.item&&<Counter icon={HELD[reward.item].icon} value="+1" label={HELD[reward.item].name}/>}</View>}{b.gym&&<Label small>{view.goGyms?.find(g=>g.id===b.gym!.id)?.team===null?'Gym vrij · laat een bug achter':'Verdediging verzwakt na iedere verslagen bug'}</Label>}{b.boss?.post&&b.boss.rewarded&&b.winner===side&&<Button icon="leaf" disabled={busy} onPress={()=>void run('goClose').then(ok=>{if(ok)open?.('map');})}>Vang kaartbaas</Button>}<Button onPress={()=>void run('goClose').then(ok=>{if(ok&&b.gym)open?.('gyms');})} disabled={busy}>{b.gym?'Naar gyms':'Verder'}</Button></Panel></View>;}

  return <View style={{flex:1,padding:12,gap:6,backgroundColor:'#143F38'}}><Scene index={4} dim={.16}/><Wash from="#153B311A" to="#0C322DBB"/>

   <View style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1}}><Label small bold color="white">{b.names[other]}</Label><Label small color="#C9DDBE">Tegenstander</Label></View><Label small color="#F5EACB">{Math.max(0,Math.ceil((b.endsAt-now)/1000))} s</Label>{!b.gym&&<View style={v.row}>{[0,1].map(i=><View key={i} style={{opacity:i<b.shields[other]?1:.2}}><Glyph name="shield" size={23}/></View>)}</View>}<IconButton name="close" label="Gevecht opgeven" onPress={()=>info.show({title:'Gevecht opgeven?',body:'Je tegenstander wint dit duel.',icon:'swords',action:{label:'Geef op',onPress:()=>{void run('goAct',{action:'forfeit',value:null}).then(ok=>{if(ok)info.hide();});}}})}/></View>

   <GoBattleStageV2 battle={b} size={fighterSize} canTap={canTap} cooldown={cooldown} queued={queuedAction} onFast={()=>input.tap('fast')} onInfo={()=>info.show({title:fast.name,icon:GO_TYPES[fast.type].icon,body:fast.power+' kracht · +'+fast.energy+' energie · '+fast.turns*.5+' s. Tik op het veld voor een snelle aanval. Een extra tik wordt één keer bewaard. Beide opgeladen aanvallen gebruiken dezelfde energievoorraad.'})}/>

   <View style={[v.row,{justifyContent:'space-between'}]}>{!b.gym?<View accessibilityLabel={b.shields[side]+' schilden over'} style={v.row}>{[0,1].map(i=><View key={i} style={{opacity:i<b.shields[side]?1:.2}}><Glyph name="shield" size={27}/></View>)}</View>:<View/>}<Help title="Gevecht" body={b.gym?"Tik op het gevechtsveld voor snelle aanvallen. Tik op een volle aanvalmeter voor een opgeladen aanval. Houd een meter vast voor de naam, kracht en energiekosten. Gymverdedigers vechten automatisch. Geen schilden of Elo. Iedere verslagen bug verliest een hart; bij nul komt hij terug.":"Tik waar je wilt op het gevechtsveld voor een snelle aanval. Een extra tik tijdens de wachttijd wordt één keer bewaard. Snelle aanvallen vullen beide meters uit dezelfde energievoorraad. Tik op een volle meter voor een opgeladen aanval en raak de acht doelen. De kleur en het icoon tonen het aanvalstype. Houd de meter vast om kracht en energiekosten te zien; stats en types bepalen de schade. Houd een meter vast voor aanvalsinformatie. Bij een vijandelijke opgeladen aanval kun je één van je twee schilden gebruiken. Tik op een teambug om te wisselen. Energie blijft bewaard; daarna geldt een wisselwachttijd."}/></View>

   <View style={{flexDirection:'row',gap:8}}>{[0,1].map(slot=>{const move=a.go.charged[slot];if(!move)return <Pressable key={'locked-'+slot} testID={'battle-charged-'+slot} accessibilityRole="button" accessibilityLabel="Tweede aanval vergrendeld" onPress={()=>info.show({title:'Tweede aanval',icon:'lock',body:'Deze bug heeft nog geen tweede opgeladen aanval. Leer die eerst in je collectie met nectarstof en soortnectar.'})} style={{flex:1,minHeight:92,borderRadius:23,backgroundColor:'#163E36',borderWidth:2,borderColor:'#72918066',alignItems:'center',justifyContent:'center'}}><Glyph name="lock" size={26}/><Label small color="#C4D7BC">Tweede aanval</Label><View style={{position:'absolute',right:10,top:8}}><Glyph name="info" size={16}/></View></Pressable>;const m=CHARGED[move],type=GO_TYPES[m.type],ready=canTap&&readyEnergy>=m.energy,matchup=effectiveness(m.type,movePool(enemy.species).types);return <Pressable key={move} testID={'battle-charged-'+slot} accessibilityRole="button" accessibilityLabel={m.name+' · '+m.power+' kracht · '+Math.min(readyEnergy,m.energy)+' van '+m.energy+' energie'} accessibilityHint="Houd vast voor aanvalsinformatie" accessibilityState={{disabled:!ready}} onPress={()=>{if(ready)input.tap('charged',move);}} onLongPress={()=>info.show({title:m.name,icon:type.icon,body:type.name+' · '+m.power+' kracht · kost '+m.energy+' energie.'+(matchup>1?' Sterk tegen deze tegenstander.':matchup<1?' Zwak tegen deze tegenstander.':'')+' Tik op alle acht energiedoelen voor maximale schade. Stats en types bepalen de uiteindelijke schade. Een schild vangt de aanval op.'})} style={({pressed})=>({flex:1,minHeight:92,borderRadius:23,overflow:'hidden',backgroundColor:'#102E29',borderWidth:2,borderColor:ready?'#FFE3A0':type.color,alignItems:'center',justifyContent:'center',gap:3,transform:[{scale:pressed&&ready?.97:1}]})}><View pointerEvents="none" style={{position:'absolute',bottom:0,left:0,right:0,height:(Math.min(100,readyEnergy/m.energy*100)+'%') as '100%',backgroundColor:type.color,borderTopWidth:readyEnergy>0?2:0,borderTopColor:'#FFF1C0'}}/><View pointerEvents="none" style={{alignItems:'center',gap:2}}><View style={[v.row,{gap:5,paddingHorizontal:7,borderRadius:10,backgroundColor:'#102E29E8'}]}><Glyph name={type.icon} size={23}/><Label small bold color="#FFF5DB">{type.name}</Label></View><View style={{paddingHorizontal:5,borderRadius:8,backgroundColor:'#102E29E8'}}><Label small bold color="#FFF5DB">{m.name}</Label></View><View style={{paddingHorizontal:6,borderRadius:8,backgroundColor:'#102E29E8'}}><Label small bold color="#FFF5DB">{ready?'KLAAR':Math.min(readyEnergy,m.energy)+' / '+m.energy}</Label></View></View>{ready&&<View pointerEvents="none" style={{position:'absolute',right:9,top:7}}><Glyph name="check" size={18}/></View>}{matchup!==1&&<View testID={'battle-matchup-'+slot} pointerEvents="none" style={{position:'absolute',left:7,top:6,paddingHorizontal:6,paddingVertical:1,borderRadius:9,backgroundColor:matchup>1?'#2F6B3AF0':'#6B3A2FF0'}}><Label small bold color="#FFF5DB">{matchup>1?'👍 Sterk':'👎 Zwak'}</Label></View>}</Pressable>;})}</View>

   {(()=>{const now_=typeMatchup(a.species,enemy.species),better=b.teams[side].findIndex((u,i)=>i!==b.active[side]&&u.hp>0&&typeMatchup(u.species,enemy.species).good);return a.hp>0&&now_.danger&&better>=0&&b.phase==='fight'?<View testID="swap-tip" style={{alignSelf:'center',paddingHorizontal:10,paddingVertical:4,borderRadius:12,backgroundColor:'#5A3A1FE6',borderWidth:1,borderColor:'#FFB45A'}}><Label small bold color="#FFD27A">{'⚠️ '+species(enemy.species).name+' is sterk tegen jou. Tip: wissel naar '+species(b.teams[side][better].species).name+' 👍'}</Label></View>:null;})()}{a.hp<=0&&<Label small bold color="#FFF0C5">Kies je volgende bug · {Math.max(0,Math.ceil(((b.replaceAt?.[side]??now)-now)/1000))}</Label>}<View style={{flexDirection:'row',gap:8}}>{b.teams[side].map((u,i)=><Pressable key={u.id} accessibilityRole="button" accessibilityLabel={'Wissel naar '+species(u.species).name} disabled={b.phase!=='fight'||i===b.active[side]||u.hp<=0||a.hp>0&&b.swapAt[side]>now} onPress={()=>input.tap('switch',i)} style={{flex:1,padding:5,borderRadius:19,borderWidth:2,borderColor:i===b.active[side]?'#F0CA71':'#FFFFFF33',opacity:u.hp>0?1:.3,backgroundColor:'#214A40EB',alignItems:'center'}}><SpriteView id={u.species} shiny={u.shiny} size={44}/>{u.hp>0&&(()=>{const t=typeMatchup(u.species,enemy.species);return t.good?<View testID={'switch-good-'+i} style={{position:'absolute',left:4,top:3}}><Label small>👍</Label></View>:t.danger?<View style={{position:'absolute',left:4,top:3}}><Label small>⚠️</Label></View>:null;})()}<HP value={u.hp} max={u.maxHP}/><Label small color="#F0E6C8">{u.hp<=0?'Uitgeschakeld':i===b.active[side]?'In het veld':a.hp>0&&b.swapAt[side]>now?Math.ceil((b.swapAt[side]-now)/1000)+' s':'Wissel'}</Label></Pressable>)}</View>

   {charge&&<View style={{position:'absolute',inset:0,backgroundColor:charge.side===side?'#0B2824ED':'#2B1512F0',justifyContent:'center',padding:18,gap:12,alignItems:'center'}}><View pointerEvents="none" style={{position:'absolute',left:'10%',right:'10%',top:'18%',aspectRatio:1,borderRadius:999,backgroundColor:charge.side===side?GO_TYPES[CHARGED[charge.move].type].color+'33':'#E2574233',boxShadow:charge.side===side?undefined:'0px 0px 80px #E25742AA'}}/><SpriteView id={charge.side===side?a.species:enemy.species} shiny={charge.side===side?a.shiny:enemy.shiny} size={chargeArtSize} animate/>{charge.side!==side&&<Label small bold color="#FFB09C">PAS OP!</Label>}<Text accessibilityRole="header" style={{fontFamily:font,fontSize:28,fontWeight:'900',textAlign:'center',color:charge.side===side?'#FFF1CD':'#FFE1D6',textShadowColor:'#061A16',textShadowOffset:{width:0,height:2},textShadowRadius:6}}>{CHARGED[charge.move].name}</Text><Text style={{fontFamily:font,fontSize:40,fontWeight:'900',fontVariant:['tabular-nums'],color:'#F7E9BF',textShadowColor:'#061A16',textShadowRadius:6}}>{Math.max(0,Math.ceil((charge.deadline-now)/1000))}</Text>{charge.side===side?(reduced?<><View style={{flexDirection:'row',alignItems:'center',gap:6}}><Glyph name={GO_TYPES[CHARGED[charge.move].type].icon} size={23}/><Label small color="#F7E9BF">{GO_TYPES[CHARGED[charge.move].type].name} · Raak alle 8 doelen</Label></View><View style={{width:256,flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:9}}>{Array.from({length:8},(_,i)=><Pressable key={i} accessibilityRole="button" accessibilityLabel={'Energiedoel '+(i+1)} disabled={hitTargets.includes(i)||now>=charge.deadline} onPress={()=>input.tap('chargeTap',i)} style={{width:57,height:57,alignItems:'center',justifyContent:'center',borderRadius:29,borderWidth:2,borderColor:'#C7E6CB',backgroundColor:hitTargets.includes(i)?'#72B995':GO_TYPES[CHARGED[charge.move].type].color+'66',opacity:hitTargets.includes(i)?.6:1}}><Glyph name={hitTargets.includes(i)?'check':GO_TYPES[CHARGED[charge.move].type].icon} size={34}/></Pressable>)}</View><Label small color="#F7E9BF">{hitTargets.length} / 8</Label></>:<ChargeGameV2 key={charge.startedAt} type={CHARGED[charge.move].type} hits={hitTargets.length} ended={now>=charge.deadline} reduced={reduced} onHit={()=>{const next=Array.from({length:8},(_,i)=>i).find(i=>!hitTargets.includes(i));if(next!==undefined)input.tap('chargeTap',next);}}/>):charge.shield===null&&input.shield===undefined?<><Label small center color="#F7E9BF">{b.shields[side]>0?'Een schild houdt deze aanval tegen':'Geen schilden meer over'}</Label><Pressable accessibilityRole="button" accessibilityLabel={'Schild · '+b.shields[side]} accessibilityState={{disabled:b.shields[side]<1}} disabled={b.shields[side]<1} onPress={()=>input.tap('shield',true)} style={({pressed})=>({width:132,height:132,borderRadius:66,alignItems:'center',justifyContent:'center',gap:2,backgroundColor:'#2E7FA0',borderWidth:4,borderColor:'#BDEBF5',boxShadow:'0px 0px 34px #8FDAEAAA',opacity:b.shields[side]<1?.4:1,transform:[{scale:pressed?.94:1}]})}><Glyph name="shield" size={64}/><Label bold color="#F2FBFF">Schild · {b.shields[side]}</Label></Pressable><Button small secondary onPress={()=>input.tap('shield',false)}>Zonder schild</Button></>:<><Glyph name={(charge.shield??input.shield)?'shield':'check'} size={65}/><Label small color="#F7E9BF">{(charge.shield??input.shield)?'Schild klaar':'Aanval komt eraan'}</Label></>}</View>}

  </View>;

 }

 if(g.queue)return <View style={{flex:1,justifyContent:'center',padding:22,gap:20}}><Scene index={4}/><Panel style={{alignItems:'center',gap:20}}><Glyph name="swords" size={80}/><Title>Tegenstander zoeken</Title><Label>{LEAGUES[g.queue.league].name} · {Math.max(0,Math.ceil((g.queue.until-now)/1000))} s</Label><Button secondary disabled={busy} onPress={()=>void run('goCancel')}>Stop zoeken</Button></Panel></View>;

 const pool=p.specimens.filter(s=>s.go).sort((a,b)=>stats(b).cp-stats(a).cp),issue=teamIssue(p,g.team,g.league),valid=!issue;

 return <ScrollView contentContainerStyle={{padding:16,paddingTop:87,gap:14,paddingBottom:100}}><View style={[v.row,{justifyContent:'space-between'}]}><Title>Strijd</Title><GoTypeHelp/><Help title="Strijd" body="Duel: speel direct, ook als niemand online is. Dagstrijd: verbeter je dagscore. Dagbaas: versla een sterke bug. Samen online spelen: beide spelers moeten aanwezig zijn."/></View>

  <View accessibilityRole="tablist" style={{flexDirection:'row',gap:5}}>{([{id:'duel',name:'Duel'},{id:'daily',name:'Dagstrijd'},{id:'boss',name:'Dagbaas'}] as const).map(tab=><Pressable key={tab.id} accessibilityRole="tab" accessibilityLabel={tab.name} accessibilityState={{selected:mode===tab.id}} onPress={()=>setMode(tab.id)} style={{flex:1,minHeight:46,alignItems:'center',justifyContent:'center',borderRadius:14,backgroundColor:mode===tab.id?'#426B4A':'#1A4035',borderWidth:1,borderColor:mode===tab.id?'#A2C58D':'#66836C55'}}><Label bold>{tab.name}</Label></Pressable>)}</View>

  {mode==='duel'&&<GoEchoArenaV2 {...{view,run,busy,now}} onChooseTeam={()=>setPicking(true)}/>}

  {mode==='daily'&&<GoDailyChallengeV2 {...{view,run,busy,now}}/>}

  {mode==='boss'&&<GoBossV2 {...{view,run,busy,now}}/>}

  <Button small secondary icon="friends" onPress={()=>setMode(live?'duel':'live')}>{live?'Terug naar duels':'Samen online spelen'}</Button>

  {live&&<><Panel style={{flexDirection:'row',alignItems:'center',gap:16}}><RankEmblem rating={g.rating} size={65}/><View style={{flex:1,gap:5}}><Title>{g.rating}</Title><Label small>Live Elo · {Math.max(0,25-(g.ratedCount??0))} duels over</Label></View></Panel>



  <Panel><View style={[v.row,{justifyContent:'space-between'}]}><Label bold>{LEAGUES[g.league].name}</Label><IconButton name="settings" label="PvP-team kiezen" onPress={()=>setPicking(true)}/></View><View style={{flexDirection:'row',gap:8}}>{[0,1,2].map(i=>{const s=pool.find(s=>s.id===g.team[i]);return <Pressable key={i} accessibilityRole="button" accessibilityLabel={'Teamslot '+(i+1)} onPress={()=>setPicking(true)} style={{flex:1,minHeight:105,alignItems:'center',justifyContent:'center',borderRadius:19,backgroundColor:'#294F43'}}>{s?<><SpriteView id={s.species} shiny={s.shiny} size={70}/><Label small bold>{stats(s).cp} CP</Label><GoTypes species={s.species} compact/>{s.go!.item&&<Glyph name={HELD[s.go!.item].icon} size={22}/>}</>:<Glyph name="team" size={50}/>}</Pressable>;})}</View><Button icon="swords" disabled={busy||!valid||(g.ratedCount??0)>=25||!view.linked} onPress={()=>void run('goQueue')}>Speel Ranked</Button><View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button secondary small disabled={busy||!valid} onPress={()=>void run('goTrain')}>Training</Button></View><View style={{flex:1}}><Button secondary small disabled={busy||!valid} onPress={()=>setInvite(!invite)}>Vriendenduel</Button></View></View>{!view.linked&&valid&&open&&<Button small secondary icon="profile" onPress={()=>open('account')}>Koppel account voor Ranked</Button>}{!valid&&<><Label small>{issue}</Label>{new Set(pool.map(s=>s.species)).size<3&&open&&<Button small secondary icon="compass" onPress={()=>open('map')}>Ga vangen</Button>}</>}</Panel>

  {invite&&<Panel><Button small secondary disabled={busy||!valid} onPress={()=>void run('goInvite').then(ok=>{if(ok)setInviteMade(now+300000);})}>Maak uitnodiging</Button><Label bold center>{p.friendCode}</Label>{inviteMade>0&&<Label small>{inviteMade>now?'Duelcode actief · '+Math.ceil((inviteMade-now)/60000)+' min':'Duelcode verlopen'}</Label>}<TextInput accessibilityLabel="Duelcode" placeholder="Code van vriend" placeholderTextColor="#B7CAB6" selectionColor="#A5CE87" maxLength={8} autoCapitalize="characters" value={code} onChangeText={v=>setCode(v.toUpperCase())} style={v.input}/><Button small disabled={busy||code.length!==8||!valid} onPress={()=>void run('goJoin',{code})}>Doe mee</Button></Panel>}

  {searchExpired&&<Panel><Label small>Niemand gevonden · probeer Training</Label><Button small disabled={busy||!valid} onPress={()=>void run('goTrain')}>Training</Button></Panel>}<Button small secondary onPress={()=>setRanks(!ranks)}>Ranglijst</Button>{ranks&&<Panel>{view.leaderboard.length?view.leaderboard.map((r,i)=><View key={i} style={[v.row,{justifyContent:'space-between'}]}><Label bold={r.me}>{i+1}. {r.name}</Label><Label>{r.rating}</Label></View>):<Label small>Nog geen Ranked-resultaten</Label>}</Panel>}

  </>}

  {!live&&mode!=='duel'&&<Button small secondary icon="team" onPress={()=>setPicking(true)}>Mijn strijdteam</Button>}

  {picking&&<GoTeamPickerV2 player={p} {...{run,busy}} onClose={()=>setPicking(false)}/>}

 </ScrollView>;

}
