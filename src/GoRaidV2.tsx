import React,{useId,useState} from 'react';
import {Image,Pressable,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import Svg,{Defs,Ellipse,LinearGradient,RadialGradient,Rect,Stop} from 'react-native-svg';
import {species} from '../game/catalogV2';
import {effectiveness} from '../game/goBattleV2';
import {movePool} from '../game/goV2';
import type {Element} from '../game/goV2';
import {isLegendary} from '../game/legendaryV2';
import {RAID_RULES,RAID_TIERS,freeRemoteLeft} from '../game/raidsV2';
import {matchup} from '../game/recommendV2';
import type {RaidInvite,RaidTier,RaidView} from '../game/raidsV2';
import {trainerLevel} from '../game/trainerV2';
import {RARITY_TIERS} from '../game/rarityDisplayV2';
import type {GameViewV2} from '../game/typesV2';
import {SpriteView} from './artV2';
import {TrainerPortrait} from './AvatarV2';import {FieldActivityArt} from './FieldArtV2';
import {GoTeamPickerV2} from './GoTeamPickerV2';
import {GO_TYPES,GoTypeBadge,GoTypes} from './GoTypeV2';
import {PO,PoCircle,PoPill,poText} from './PogoUiV2';
import type {RunV2} from './ShopViewV2';
import {Button,Counter,Glyph,Help,Label,Panel,useInfo} from './uiV2';
import type {GameIconName} from './gameUiArt';

const arena=require('../assets/v2/worlds/arena-v2.webp');
const RAID_HELP=['🥚 Om de 2–3 uur een ei bij een gym. Na 1 uur komt de baas eruit, die blijft 45 min.','👥 Max. 6 spelers, samen 3 minuten vechten. Iedereen met 3 eigen bugs.','🏆 Gewonnen? Beloning + vangpoging met extra netten. Max. 5 per dag.','🎟️ Op afstand: 1× per dag gratis, daarna een Zwermfluit. Alleen bij een raid op je kaart of met een uitnodiging.','👍 = type dat sterk is tegen de baas.'].join('\n');
const mmss=(ms:number)=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const WHITE='#FFFFFF',SOFT='#FFFFFFD9';
const st={timer:{...poText.onPhoto,fontSize:64,lineHeight:72,fontWeight:'200' as const,textAlign:'center' as const,letterSpacing:1},caption:{...poText.onPhoto,fontSize:12,fontWeight:'700' as const,letterSpacing:1.4,color:SOFT,textAlign:'center' as const},name:{...poText.onPhoto,fontSize:30,lineHeight:36,fontWeight:'800' as const,textAlign:'center' as const},small:{...poText.onPhoto,fontSize:13,fontWeight:'700' as const,color:SOFT}};
/** Small dark-glass label on the HD scene (timer chips, post name, rewards). */
const glass={alignSelf:'center' as const,flexDirection:'row' as const,alignItems:'center' as const,gap:5,paddingHorizontal:11,paddingVertical:4,borderRadius:14,backgroundColor:'#0D1424A8',borderWidth:1,borderColor:'#FFFFFF24'};
function Glass({children,label}:{children:React.ReactNode;label?:string}){return <View accessibilityLabel={label} style={glass}>{typeof children==='string'?<Text numberOfLines={1} style={st.small}>{children}</Text>:children}</View>;}
function Stars({tier}:{tier:RaidTier}){return <View accessibilityLabel={tier+' sterren'} style={{flexDirection:'row',gap:2}}>{Array.from({length:tier},(_,i)=><Glyph key={i} name="star" size={15}/>)}</View>;}
/** 👍 types that hit this boss hard, and how many own bugs the team picker marks with 👍. Types are read at runtime. */
function Counters({kind,view,light=false}:{kind:string;view:GameViewV2;light?:boolean}){
 const enemy=movePool(kind).types,strong=(Object.keys(GO_TYPES) as Element[]).filter(t=>effectiveness(t,enemy)>1).slice(0,3),mine=view.player.specimens.filter(s=>s.go&&matchup(s,kind).recommended).length;if(!strong.length)return null;
 return <View testID="raid-counters" accessibilityLabel={'Sterk tegen deze baas: '+strong.map(t=>GO_TYPES[t].name).join(', ')} style={light?{...glass,flexWrap:'wrap',gap:4}:{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',flexWrap:'wrap',gap:4}}>{light?<Glyph name="check" size={17}/>:<Label small bold>👍</Label>}{strong.map(t=><GoTypeBadge key={t} type={t} compact/>)}{mine>0&&(light?<Text style={st.small}>{'· '+mine+' van jou'}</Text>:<Label small>{'· '+mine+' van jou'}</Label>)}</View>;
}
/** Today's free remote raid first; once used, the Zwermfluit count (and the daily free Zwermfluit). `light` = white text on the raid photo. */
function Pass({view,run,busy,now,light=false}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;light?:boolean}){
 const g=view.player.go!.raids,today=new Date(view.now).toISOString().slice(0,10),passes=g?.passes??0,free=g?.freeDay!==today&&passes<RAID_RULES.maxPasses;
 if(freeRemoteLeft(g,now))return light?<Glass>🎟️ 1 gratis vandaag</Glass>:<Label small bold>🎟️ 1 gratis vandaag</Label>;
 if(light)return <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10}}><Glass label={'Zwermfluiten '+passes+' van '+RAID_RULES.maxPasses}>{'🎺 '+passes+' / '+RAID_RULES.maxPasses+' Zwermfluiten'}</Glass>{free&&<View style={{width:170}}><PoPill variant="ghost" height={40} icon="gift" label="Gratis Zwermfluit" disabled={busy} onPress={()=>void run('raidPass')}/></View>}</View>;
 return <View style={{flexDirection:'row',alignItems:'center',gap:9}}><Counter icon="star" value={passes+' / '+RAID_RULES.maxPasses} label="Zwermfluiten"/>{free&&<Button small secondary icon="gift" disabled={busy} onPress={()=>void run('raidPass')}>Gratis Zwermfluit</Button>}</View>;
}
/** Friend picker on the raid photo: translucent rows, one white pill to send. */
function InviteFriends({view,raid,run,busy,onDone}:{view:GameViewV2;raid:string;run:RunV2;busy:boolean;onDone:()=>void}){
 const p=view.player,[chosen,setChosen]=useState<string[]>([]);
 const friends=view.friends.filter(f=>f.accepted&&!f.removed).map(f=>{const side=f.users.indexOf(p.uid);return {uid:f.users[1-side],name:f.names[1-side]};});
 if(!friends.length)return <Text style={[st.small,{textAlign:'center'}]}>Voeg eerst vrienden toe om ze uit te nodigen.</Text>;
 return <View testID="raid-invite-friends" style={{gap:7}}><Text style={[st.small,{textAlign:'center',fontWeight:'600'}]}>Je vrienden zien alleen de naam van deze gympost, niet jouw locatie.</Text>
  {friends.map(f=>{const on=chosen.includes(f.uid);return <Pressable key={f.uid} accessibilityRole="checkbox" accessibilityState={{checked:on}} accessibilityLabel={'Nodig '+f.name+' uit'} onPress={()=>setChosen(c=>on?c.filter(x=>x!==f.uid):c.length<RAID_RULES.invitesPerRaid?[...c,f.uid]:c)} style={{flexDirection:'row',alignItems:'center',gap:9,paddingVertical:8,paddingHorizontal:12,borderRadius:22,backgroundColor:on?'#FFFFFF40':'#FFFFFF1F',borderWidth:2,borderColor:on?PO.gold:'#FFFFFF33'}}><Glyph name={on?'check':'friends'} size={22}/><Text style={[st.small,{color:WHITE,fontSize:15}]}>{f.name}</Text></Pressable>;})}
  <PoPill variant="ghost" height={46} icon="friends" disabled={busy||!chosen.length} label={'Verstuur '+chosen.length+' uitnodiging'+(chosen.length===1?'':'en')} onPress={()=>void run('raidInvite',{raid,friends:chosen}).then(ok=>{if(ok){setChosen([]);onDone();}})}/></View>;
}

/** Tier colour, the same as the egg/boss bubble on the map; Oerbugs glow gold. */
const tierColor=(tier:RaidTier)=>RARITY_TIERS[tier>=5?5:tier>=4?4:tier>=3?3:2].color;
const glowColor=(tier:RaidTier,kind:string)=>isLegendary(kind)?PO.gold:tierColor(tier);
/** Full-bleed raid backdrop: blurred HD arena photo under a purple gradient. Everything on it is white. */
function RaidStage({children,minHeight,testID}:{children:React.ReactNode;minHeight:number;testID?:string}){
 const id='rs'+useId().replace(/:/g,'');
 return <View testID={testID} style={{minHeight,borderRadius:28,overflow:'hidden',backgroundColor:'#3B2A63',paddingHorizontal:14,paddingTop:16,paddingBottom:18,gap:12,justifyContent:'space-between'}}>
  <Image source={arena} blurRadius={6} resizeMode="cover" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%',transform:[{scale:1.08}]}]}/>
  <View pointerEvents="none" style={StyleSheet.absoluteFill}><Svg width="100%" height="100%" preserveAspectRatio="none"><Defs><LinearGradient id={id} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#3A2E8E" stopOpacity={.58}/><Stop offset=".5" stopColor="#7B3E92" stopOpacity={.42}/><Stop offset="1" stopColor="#38184F" stopOpacity={.9}/></LinearGradient></Defs><Rect width="100%" height="100%" fill={`url(#${id})`}/></Svg></View>
  {children}
 </View>;
}
/** The boss (or egg) very large on a warm glow in the tier colour. */
function BossGlow({kind,tier,egg,size}:{kind:string;tier:RaidTier;egg:boolean;size:number}){
 const id='bg'+useId().replace(/:/g,''),color=glowColor(tier,kind),box=size*1.45;
 return <View testID="raid-hero" style={{width:box,height:box*.86,alignSelf:'center',alignItems:'center',justifyContent:'center'}}>
  <View pointerEvents="none" style={StyleSheet.absoluteFill}><Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><Defs><RadialGradient id={id}><Stop offset="0" stopColor="#FFE3B0" stopOpacity={.9}/><Stop offset=".42" stopColor={color} stopOpacity={.55}/><Stop offset="1" stopColor={color} stopOpacity={0}/></RadialGradient></Defs><Ellipse cx="50" cy="50" rx="50" ry="50" fill={`url(#${id})`}/></Svg></View>
  {egg?<View accessibilityLabel="Zwermei"><FieldActivityArt id="cocoon" size={size*.72}/></View>:<SpriteView id={kind} size={size} animate/>}
 </View>;
}
/** Boss name, stars and (for Oerbugs) a gold OERBUG tag. */
function BossName({kind,tier,egg}:{kind:string;tier:RaidTier;egg:boolean}){
 return <View style={{alignItems:'center',gap:4}}>{!egg&&isLegendary(kind)&&<View testID="raid-oerbug" style={{paddingHorizontal:10,paddingVertical:2,borderRadius:12,backgroundColor:PO.gold}}><Text style={[st.caption,{color:WHITE,fontSize:11}]}>OERBUG</Text></View>}<Text numberOfLines={1} adjustsFontSizeToFit style={st.name}>{egg?'Zwermei':species(kind).name}</Text><Stars tier={tier}/></View>;
}
/** Small white round icon button on the photo. Without onPress it is shown greyed out. */
function RoundIcon({icon,label,onPress,active=false}:{icon:GameIconName;label:string;onPress?:()=>void;active?:boolean}){
 return <View style={{opacity:onPress?1:.45}}><PoCircle size={50} label={label} onPress={onPress} ring={active?PO.gold:undefined}><Glyph name={icon} size={32}/></PoCircle></View>;
}
function RaidHelpIcon(){const info=useInfo();return <RoundIcon icon="info" label="Info: Raid" onPress={()=>info.show({title:'Raid',body:RAID_HELP,icon:'info'})}/>;}

/** Raid card on a gym (before joining): photo, big timer, big boss, one red pill and the 👥 round button. */
export function RaidAtGymV2({view,raid,run,busy,now,ensureGPS}:{view:GameViewV2;raid:RaidView;run:RunV2;busy:boolean;now:number;ensureGPS?:()=>Promise<boolean>}){
 const [inviting,setInviting]=useState(false),config=RAID_TIERS[raid.tier],egg=now<raid.hatchAt,g=view.player.go!.raids,claimed=!!g?.claimed.includes(raid.id),inLobby=!!view.raidLobby&&view.raidLobby.raidId===raid.id;
 const low=trainerLevel(view.player.go!.trainer!.xp)<config.trainer,closing=now>=raid.joinableUntil,capped=(g?.rewards??0)>=RAID_RULES.rewardsPerDay,remoteOk=(g?.remote??0)<RAID_RULES.remotePerDay&&(freeRemoteLeft(g,now)||(g?.passes??0)>0);
 async function join(){if(ensureGPS&&!await ensureGPS())return;await run('raidJoin',{raid:raid.id,remote:false});}
 if(inLobby)return null;const blocked=claimed?'✅ Vandaag verslagen':capped?'5 / 5 vandaag':low?'🔒 Level '+config.trainer:closing?'⏳ Vertrekt bijna':view.raidLobby?'Je zit al in een raid':'';
 return <RaidStage testID="raid-card" minHeight={egg?470:560}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}><View style={{flex:1,alignItems:'flex-start'}}><View style={[glass,{alignSelf:'flex-start',maxWidth:'100%'}]}><Text numberOfLines={1} style={[st.small,{color:WHITE,flexShrink:1}]}>{config.name+' · '+(raid.local?'':'Op afstand · ')+raid.site.name}</Text></View></View><RaidHelpIcon/></View>
  <View style={{alignItems:'center'}}><Text accessibilityLabel={(egg?'Komt uit over ':'Nog ')+mmss((egg?raid.hatchAt:raid.endsAt)-now)} style={st.timer}>{mmss((egg?raid.hatchAt:raid.endsAt)-now)}</Text><Text style={st.caption}>{egg?'KOMT UIT OVER':'RAID NOG'}</Text></View>
  <BossGlow kind={raid.species} tier={raid.tier} egg={egg} size={180}/>
  <View style={{gap:8}}><BossName kind={raid.species} tier={raid.tier} egg={egg}/>{!egg&&<View style={{alignItems:'center'}}><GoTypes species={raid.species} compact/></View>}</View>
  {egg?<Glass>⏳ Kom terug als de baas er is!</Glass>:<>
   <View style={{alignItems:'center',gap:6}}><Counters kind={raid.species} view={view} light/><Glass label={'Beloning: '+config.dust+' stof, '+config.nets+' netten'}>{'✨ +'+config.dust+' · 🕸️ '+config.nets}</Glass></View>
   <View style={{flexDirection:'row',alignItems:'center',gap:10}}><View style={{flex:1}}>{raid.local
     ?<PoPill variant="raid" icon={blocked?undefined:'swords'} accessibilityLabel={blocked||'⚔️ Doe mee'} label={blocked||'Doe mee'} disabled={busy||!!blocked} onPress={()=>void join()}/>
     :<PoPill variant="raid" icon={blocked||!remoteOk?undefined:'swords'} accessibilityLabel="Doe mee op afstand" label={blocked||(!remoteOk?'🎟️ Geen ticket':'🎟️ Op afstand')} disabled={busy||!!blocked||!remoteOk} onPress={()=>void run('raidJoin',{raid:raid.id,remote:true})}/>}</View>
    {!closing&&<RoundIcon icon="friends" label="Nodig vrienden uit" active={inviting} onPress={busy||!raid.local?undefined:()=>setInviting(v=>!v)}/>}</View>
   {!raid.local&&<Pass light {...{view,run,busy,now}}/>}</>}
  {inviting&&<InviteFriends {...{view,run,busy}} raid={raid.id} onDone={()=>setInviting(false)}/>}
 </RaidStage>;
}

/** PoGO-style lobby: big thin timer, the boss very large, round player avatars, ONE red pill, small white round icons. */
export function RaidLobbyV2({view,run,busy,now,onBattle}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;onBattle:()=>void}){
 const l=view.raidLobby,[choosing,setChoosing]=useState(false),[inviting,setInviting]=useState(false),height=useWindowDimensions().height;if(!l)return null;
 const fighting=l.status==='lobby'&&now>=l.lobbyUntil||l.status==='fighting',ended=l.status==='won'||l.status==='failed',waiting=!fighting&&!ended,me=l.members.find(m=>m.me),battle=view.goBattle?.raid?.lobbyId===l.id&&view.goBattle.phase!=='finished',share=Math.max(0,l.hp)/Math.max(1,l.maxHP),p=view.player;
 async function fight(ids:string[]){const ok=await run('raidFight',{ids});if(ok)onBattle();return ok;}
 const reward=l.status==='won'&&!l.claimed&&(me?.damage??0)>0;
 const big=ended?(l.status==='won'?'Verslagen!':'Ontsnapt'):mmss(fighting?(l.fightUntil??l.lobbyUntil+180000)-now:l.lobbyUntil-now);
 const caption=l.status==='won'?'🏆 SAMEN GEWONNEN':l.status==='failed'?'💨 DE BAAS IS WEG':fighting?'⚔️ NOG TE VECHTEN':'⏳ TOT DE START';
 // Keep team selection in the gym page. Starting battle must not tear down
 // an animated Android modal while mounting the battle screen.
 if(choosing&&!ended&&!battle)return <View testID="raid-team-screen" style={{height:Math.max(380,Math.min(650,height-180))}}><GoTeamPickerV2 embedded raid against={l.species} title="Team voor de raid" player={view.player} {...{run,busy}} onClose={()=>setChoosing(false)} onConfirm={fight}/></View>;
 return <><RaidStage testID="raid-lobby" minHeight={640}>
  <Glass>{(l.remote?'🌍 ':'📍 ')+l.postName}</Glass>
  <View style={{alignItems:'center'}}><Text accessibilityLabel={caption+' '+big} style={[st.timer,ended&&{fontSize:46,lineHeight:56,fontWeight:'300'}]}>{big}</Text><Text style={st.caption}>{caption}</Text></View>
  <BossGlow kind={l.species} tier={l.tier} egg={false} size={220}/>
  <View style={{gap:8,alignItems:'center'}}><BossName kind={l.species} tier={l.tier} egg={false}/>
   <View accessibilityLabel={'Baas-HP '+l.hp+' van '+l.maxHP} style={{width:'70%',height:8,borderRadius:4,overflow:'hidden',backgroundColor:'#FFFFFF33'}}><View style={{height:8,borderRadius:4,width:(share*100)+'%' as `${number}%`,backgroundColor:share>.5?'#8FE07A':share>.2?'#F2D16E':'#F0846A'}}/></View>
   {!ended&&<Counters kind={l.species} view={view} light/>}</View>
  <View testID="raid-players" style={{flexDirection:'row',justifyContent:'center',gap:6}}>{Array.from({length:RAID_RULES.maxMembers},(_,i)=>{const m=l.members[i],size=46;return <View key={i} accessibilityLabel={m?m.name+(m.me?' (jij)':'')+', '+m.damage+' schade':'Vrije plek'} style={{width:48,alignItems:'center',gap:3}}>
   {m?<View style={{width:size,height:size,borderRadius:size/2,overflow:'hidden',borderWidth:3,borderColor:m.me?PO.gold:WHITE,backgroundColor:'#2C6A55',alignItems:'center',justifyContent:'center'}}>{m.me?<TrainerPortrait avatar={p.avatar} outfit={p.outfit} size={size+8}/>:<Text style={{...poText.onPhoto,fontSize:19,fontWeight:'800'}}>{(m.name.trim()[0]??'?').toUpperCase()}</Text>}</View>
    :<View style={{width:size,height:size,borderRadius:size/2,backgroundColor:'#FFFFFF2E',alignItems:'center',justifyContent:'center'}}><Text style={{color:WHITE,fontSize:22,fontWeight:'300'}}>+</Text></View>}
   {m?.remote&&<View pointerEvents="none" style={{position:'absolute',right:-2,top:-3}}><Glyph name="compass" size={17}/></View>}
   {m&&(fighting||ended)?<Text numberOfLines={1} style={[st.small,{fontSize:11}]}>{m.damage}</Text>:null}</View>;})}</View>
  <View style={{gap:12}}>
   {ended?<PoPill variant="raid" icon={reward?'gift':'check'} accessibilityLabel={reward?'🎁 Beloning + vangen':'Sluiten'} label={reward?'Beloning + vangen':'Sluiten'} disabled={busy} onPress={()=>void run('raidClaim',{lobby:l.id})}/>
    :battle?<PoPill variant="raid" icon="swords" accessibilityLabel="⚔️ Naar het gevecht" label="Naar het gevecht" onPress={onBattle}/>
    :fighting?<PoPill variant="raid" icon={view.goBattle?undefined:'swords'} accessibilityLabel={view.goBattle?'Sluit eerst je vorige gevecht':'⚔️ Vecht mee'} label={view.goBattle?'Sluit eerst je gevecht':'Vecht mee'} disabled={busy||!!view.goBattle} onPress={()=>setChoosing(true)}/>
    :<PoPill variant="raid" icon="swords" accessibilityLabel={'⚔️ Vecht mee · start over '+mmss(l.lobbyUntil-now)} label="Vecht mee" disabled onPress={()=>{}} right={<Text style={{...poText.onPhoto,fontSize:14,fontWeight:'800'}}>⏳ {mmss(l.lobbyUntil-now)}</Text>}/>}
   <View style={{flexDirection:'row',justifyContent:'center',gap:18}}>{waiting&&<RoundIcon icon="friends" label="Vrienden" active={inviting} onPress={busy?undefined:()=>setInviting(v=>!v)}/>}{waiting&&<RoundIcon icon="back" label="Verlaat" onPress={busy?undefined:()=>void run('raidLeave')}/>}<RaidHelpIcon/></View>
  </View>
  {inviting&&waiting&&<InviteFriends {...{view,run,busy}} raid={l.raidId} onDone={()=>setInviting(false)}/>}
 </RaidStage></>;
}

/** Invitations from friends: join remotely, once a day free, otherwise with a Zwermfluit. Shows the post name only. */
export function RaidInvitesV2({view,run,busy,now}:{view:GameViewV2;run:RunV2;busy:boolean;now:number}){
 const invites=(view.raidInvites??[]).filter((i:RaidInvite)=>i.endsAt>now);if(!invites.length)return null;
 const g=view.player.go!.raids,passes=g?.passes??0,ticket=freeRemoteLeft(g,now),remoteLeft=RAID_RULES.remotePerDay-(g?.remote??0);
 return <Panel><View style={{flexDirection:'row',alignItems:'center',gap:7}}><Glyph name="friends" size={24}/><View style={{flex:1}}><Label bold>Zwermuitnodigingen</Label></View><Help title="Zwermen" body={RAID_HELP}/></View><Pass {...{view,run,busy,now}}/>
  {invites.map(i=>{const config=RAID_TIERS[i.tier],low=trainerLevel(view.player.go!.trainer!.xp)<config.trainer,hatched=now>=i.endsAt-45*60000;return <View key={i.raidId+i.from.uid} testID="raid-invite" style={{gap:6,padding:9,borderRadius:16,backgroundColor:'#204B40'}}><View style={{flexDirection:'row',alignItems:'center',gap:9}}>{hatched?<SpriteView id={i.species} size={48}/>:<Glyph name="lock" size={36}/>}<View style={{flex:1}}><Label small bold>{i.from.name} nodigt je uit</Label><Label small>{config.name} · {hatched?species(i.species).name:'Zwermei'} · {i.postName}</Label><Label small>Nog {mmss(i.endsAt-now)}</Label>{hatched&&<GoTypes species={i.species} compact/>}</View><Stars tier={i.tier}/></View>
   <Button small icon="swords" disabled={busy||!hatched||!!view.raidLobby||passes<1&&!ticket||remoteLeft<1||low} onPress={()=>void run('raidJoin',{raid:i.raidId,remote:true})}>{view.raidLobby?'Je zit al in een zwerm':!hatched?'Nog een ei':low?'Trainerlevel '+config.trainer:remoteLeft<1?'3 / 3 vandaag':ticket?'🎟️ Doe mee op afstand':passes<1?'Zwermfluit nodig':'Doe mee op afstand'}</Button></View>;})}
 </Panel>;
}

/** PoGO-style nearby raid list: every raid at a gym you can see, eggs and bosses, near ones first; tap a row to open its card (join here or remotely, invite friends). */
export function RaidListV2({view,run,busy,now,ensureGPS}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;ensureGPS?:()=>Promise<boolean>}){
 const [open,setOpen]=useState(''),raids=[...(view.raids??[])].filter(r=>r.endsAt>now).sort((a,b)=>Number(b.local)-Number(a.local)||Number(a.hatchAt>now)-Number(b.hatchAt>now)||a.endsAt-b.endsAt);
 if(!raids.length)return null;
 return <View testID="raid-list" style={{gap:8}}><View style={{flexDirection:'row',alignItems:'center',gap:7}}><Glyph name="swords" size={24}/><Label bold>{'Raids · '+raids.length}</Label><View style={{flex:1}}/><Pass {...{view,run,busy,now}}/></View>
  {raids.map(r=>{const egg=now<r.hatchAt,selected=open===r.id,color=glowColor(r.tier,r.species);return <View key={r.id} style={{gap:8}}><Pressable accessibilityRole="button" accessibilityLabel={(egg?'Zwermei':species(r.species).name)+', '+r.tier+' sterren, '+(r.local?'dichtbij':'op afstand')} testID={'raid-row-'+r.id} onPress={()=>setOpen(selected?'':r.id)} style={{flexDirection:'row',alignItems:'center',gap:9,padding:7,borderRadius:22,backgroundColor:selected?'#4A3470':'#1B4A3F',borderWidth:2,borderColor:selected?PO.gold:color+'88'}}>
   <View style={{width:50,height:50,borderRadius:25,alignItems:'center',justifyContent:'center',backgroundColor:color+'33'}}>{egg?<FieldActivityArt id="cocoon" size={32}/>:<SpriteView id={r.species} size={46}/>}</View>
   <View style={{flex:1,gap:2}}><Stars tier={r.tier}/><Label small bold>{egg?'Zwermei':species(r.species).name}</Label><Label small>{r.site.name}</Label></View>
   <View style={{alignItems:'flex-end'}}><Label small bold>{egg?'🥚 '+mmss(r.hatchAt-now):'⏱ '+mmss(r.endsAt-now)}</Label><Label small>{r.local?'📍 hier':'🌍 afstand'}</Label></View></Pressable>
   {selected&&<RaidAtGymV2 raid={r} {...{view,run,busy,now,ensureGPS}}/>}</View>;})}
 </View>;
}
