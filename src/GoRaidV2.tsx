import React,{useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {species} from '../game/catalogV2';
import {effectiveness} from '../game/goBattleV2';
import {movePool} from '../game/goV2';
import type {Element} from '../game/goV2';
import {RAID_RULES,RAID_TIERS,freeRemoteLeft} from '../game/raidsV2';
import {matchup} from '../game/recommendV2';
import type {RaidInvite,RaidTier,RaidView} from '../game/raidsV2';
import {trainerLevel} from '../game/trainerV2';
import {RARITY_TIERS} from '../game/rarityDisplayV2';
import type {GameViewV2} from '../game/typesV2';
import {SpriteView} from './artV2';
import {GoTeamPickerV2} from './GoTeamPickerV2';
import {GO_TYPES,GoTypeBadge,GoTypes} from './GoTypeV2';
import type {RunV2} from './ShopViewV2';
import {Button,Counter,Glyph,Help,Label,Panel} from './uiV2';

const RAID_HELP=['🥚 Om de 2–3 uur een ei bij een gym. Na 1 uur komt de baas eruit, die blijft 45 min.','👥 Max. 6 spelers, samen 3 minuten vechten. Iedereen met 3 eigen bugs.','🏆 Gewonnen? Beloning + vangpoging met extra netten. Max. 5 per dag.','🎟️ Op afstand: 1× per dag gratis, daarna een Zwermfluit. Alleen bij een raid op je kaart of met een uitnodiging.','👍 = type dat sterk is tegen de baas.'].join('\n');
const mmss=(ms:number)=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
function Stars({tier}:{tier:RaidTier}){return <View accessibilityLabel={tier+' sterren'} style={{flexDirection:'row',gap:2}}>{Array.from({length:tier},(_,i)=><Glyph key={i} name="star" size={15}/>)}</View>;}
/** 👍 types that hit this boss hard, and how many own bugs the team picker marks with 👍. Types are read at runtime. */
function Counters({kind,view}:{kind:string;view:GameViewV2}){
 const enemy=movePool(kind).types,strong=(Object.keys(GO_TYPES) as Element[]).filter(t=>effectiveness(t,enemy)>1).slice(0,3),mine=view.player.specimens.filter(s=>s.go&&matchup(s,kind).recommended).length;if(!strong.length)return null;
 return <View testID="raid-counters" accessibilityLabel={'Sterk tegen deze baas: '+strong.map(t=>GO_TYPES[t].name).join(', ')} style={{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:4}}><Label small bold>👍</Label>{strong.map(t=><GoTypeBadge key={t} type={t} compact/>)}{mine>0&&<Label small>{'· '+mine+' van jou'}</Label>}</View>;
}
/** Today's free remote raid first; once used, the Zwermfluit count (and the daily free Zwermfluit). */
function Pass({view,run,busy,now}:{view:GameViewV2;run:RunV2;busy:boolean;now:number}){
 const g=view.player.go!.raids,today=new Date(view.now).toISOString().slice(0,10),passes=g?.passes??0,free=g?.freeDay!==today&&passes<RAID_RULES.maxPasses;
 if(freeRemoteLeft(g,now))return <Label small bold>🎟️ 1 gratis vandaag</Label>;
 return <View style={{flexDirection:'row',alignItems:'center',gap:9}}><Counter icon="star" value={passes+' / '+RAID_RULES.maxPasses} label="Zwermfluiten"/>{free&&<Button small secondary icon="gift" disabled={busy} onPress={()=>void run('raidPass')}>Gratis Zwermfluit</Button>}</View>;
}
function InviteFriends({view,raid,run,busy,onDone}:{view:GameViewV2;raid:string;run:RunV2;busy:boolean;onDone:()=>void}){
 const p=view.player,[chosen,setChosen]=useState<string[]>([]);
 const friends=view.friends.filter(f=>f.accepted&&!f.removed).map(f=>{const side=f.users.indexOf(p.uid);return {uid:f.users[1-side],name:f.names[1-side]};});
 if(!friends.length)return <Label small>Voeg eerst vrienden toe om ze uit te nodigen.</Label>;
 return <View style={{gap:7}}><Label small>Je vrienden zien alleen de naam van deze gympost, niet jouw locatie.</Label>
  {friends.map(f=>{const on=chosen.includes(f.uid);return <Pressable key={f.uid} accessibilityRole="checkbox" accessibilityState={{checked:on}} accessibilityLabel={'Nodig '+f.name+' uit'} onPress={()=>setChosen(c=>on?c.filter(x=>x!==f.uid):c.length<RAID_RULES.invitesPerRaid?[...c,f.uid]:c)} style={{flexDirection:'row',alignItems:'center',gap:9,padding:9,borderRadius:16,backgroundColor:on?'#2F6650':'#204B40',borderWidth:1,borderColor:on?'#ECD289':'#557B6444'}}><Glyph name={on?'check':'friends'} size={22}/><Label bold>{f.name}</Label></Pressable>;})}
  <Button small icon="friends" disabled={busy||!chosen.length} onPress={()=>void run('raidInvite',{raid,friends:chosen}).then(ok=>{if(ok){setChosen([]);onDone();}})}>{'Verstuur '+chosen.length+' uitnodiging'+(chosen.length===1?'':'en')}</Button></View>;
}

/** Tier colour, the same as the egg/boss bubble on the map. */
const tierColor=(tier:RaidTier)=>RARITY_TIERS[tier>=5?5:tier>=4?4:tier>=3?3:2].color;
function Pill({text,color}:{text:string;color:string}){return <View style={{alignSelf:'center',paddingHorizontal:12,paddingVertical:4,borderRadius:16,backgroundColor:color}}><Text style={{color:'#fff',fontWeight:'900',fontSize:16,textShadowColor:'#0008',textShadowRadius:2}}>{text}</Text></View>;}
/** PoGO-style boss hero: stars on top, big boss (or egg) on a glow in the tier colour, a timer pill, name and types. */
function BossHeroV2({kind,tier,egg,timer,size=104}:{kind:string;tier:RaidTier;egg:boolean;timer:string;size?:number}){
 const color=tierColor(tier);
 return <View testID="raid-hero" style={{alignItems:'center',gap:5}}><Stars tier={tier}/><View style={{width:size+22,height:size+22,borderRadius:(size+22)/2,alignItems:'center',justifyContent:'center',backgroundColor:color+'33',borderWidth:3,borderColor:color}}>{egg?<Text style={{fontSize:size*.62}}>🥚</Text>:<SpriteView id={kind} size={size}/>}</View>
  <Pill text={timer} color={color}/><Label bold center>{egg?'Zwermei':species(kind).name}</Label>{!egg&&<GoTypes species={kind} compact/>}</View>;
}
/** Raid card on a gym: big boss and timer, one big button, small round buttons for friends and help. */
export function RaidAtGymV2({view,raid,run,busy,now,ensureGPS}:{view:GameViewV2;raid:RaidView;run:RunV2;busy:boolean;now:number;ensureGPS?:()=>Promise<boolean>}){
 const [inviting,setInviting]=useState(false),config=RAID_TIERS[raid.tier],egg=now<raid.hatchAt,g=view.player.go!.raids,claimed=!!g?.claimed.includes(raid.id),inLobby=!!view.raidLobby&&view.raidLobby.raidId===raid.id;
 const low=trainerLevel(view.player.go!.trainer!.xp)<config.trainer,closing=now>=raid.joinableUntil,capped=(g?.rewards??0)>=RAID_RULES.rewardsPerDay,remoteOk=(g?.remote??0)<RAID_RULES.remotePerDay&&(freeRemoteLeft(g,now)||(g?.passes??0)>0);
 async function join(){if(ensureGPS&&!await ensureGPS())return;await run('raidJoin',{raid:raid.id,remote:false});}
 if(inLobby)return null;const blocked=claimed?'✅ Vandaag verslagen':capped?'5 / 5 vandaag':low?'🔒 Level '+config.trainer:closing?'⏳ Vertrekt bijna':view.raidLobby?'Je zit al in een raid':'';
 return <Panel style={{borderColor:tierColor(raid.tier),gap:10}}>
  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Label bold>{config.name}</Label><Help title="Raid" body={RAID_HELP}/></View>
  <BossHeroV2 kind={raid.species} tier={raid.tier} egg={egg} timer={egg?'🥚 '+mmss(raid.hatchAt-now):'⏱ '+mmss(raid.endsAt-now)}/>
  {!egg&&<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:6}}><Counters kind={raid.species} view={view}/><Label small>✨ +{config.dust} · 🕸️ {config.nets}</Label></View>}
  {!egg&&!inLobby&&<View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{flex:1}}>{raid.local?<Button icon="swords" disabled={busy||!!blocked} onPress={()=>void join()}>{blocked||'⚔️ Doe mee'}</Button>
    :<Button icon="swords" accessibilityLabel="Doe mee op afstand" disabled={busy||!!blocked||!remoteOk} onPress={()=>void run('raidJoin',{raid:raid.id,remote:true})}>{blocked||(!remoteOk?'🎟️ Geen ticket':'🎟️ Op afstand')}</Button>}</View>
   {!closing&&<Pressable accessibilityRole="button" accessibilityLabel="Nodig vrienden uit" disabled={busy||!raid.local} onPress={()=>setInviting(v=>!v)} style={{width:52,height:52,borderRadius:26,alignItems:'center',justifyContent:'center',backgroundColor:inviting?'#3D6446':'#1B4A3F',borderWidth:1,borderColor:'#9AB38A',opacity:raid.local?1:.4}}><Text style={{fontSize:24}}>👥</Text></Pressable>}</View>}
  {egg&&<Label small center>⏳ Komt zo uit. Kom terug als de baas er is!</Label>}
  {!egg&&!inLobby&&!raid.local&&<Pass {...{view,run,busy,now}}/>}
  {inviting&&<InviteFriends {...{view,run,busy}} raid={raid.id} onDone={()=>setInviting(false)}/>}
 </Panel>;
}

/** PoGO-style lobby: boss, big timer, shared HP, six player slots, one big button. */
export function RaidLobbyV2({view,run,busy,now,onBattle}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;onBattle:()=>void}){
 const l=view.raidLobby,[choosing,setChoosing]=useState(false),[inviting,setInviting]=useState(false);if(!l)return null;
 const config=RAID_TIERS[l.tier],fighting=l.status==='lobby'&&now>=l.lobbyUntil||l.status==='fighting',ended=l.status==='won'||l.status==='failed',me=l.members.find(m=>m.me),battle=view.goBattle?.raid?.lobbyId===l.id&&view.goBattle.phase!=='finished',color=tierColor(l.tier),share=Math.max(0,l.hp)/Math.max(1,l.maxHP);
 async function fight(ids:string[]){const ok=await run('raidFight',{ids});if(ok)onBattle();return ok;}
 const timer=l.status==='won'?'🏆 Verslagen!':l.status==='failed'?'💨 Ontsnapt':fighting?'⚔️ '+mmss((l.fightUntil??l.lobbyUntil+180000)-now):'⏳ Start '+mmss(l.lobbyUntil-now);
 return <><Panel style={{borderColor:color,gap:10}}><View testID="raid-lobby" style={{flexDirection:'row',alignItems:'center',gap:10}}><View style={{width:70,height:70,borderRadius:35,alignItems:'center',justifyContent:'center',backgroundColor:color+'33',borderWidth:2,borderColor:color}}><SpriteView id={l.species} size={60}/></View><View style={{flex:1,gap:2}}><Label bold>{species(l.species).name}</Label><Stars tier={l.tier}/><Label small>{l.remote?'🌍 ':'📍 '}{l.postName}</Label></View><Help title="Raid" body={RAID_HELP}/></View>
  <Pill text={timer} color={color}/>
  <View accessibilityLabel={'Baas-HP '+l.hp+' van '+l.maxHP} style={{height:16,borderRadius:8,overflow:'hidden',backgroundColor:'#0E2B25',borderWidth:1,borderColor:'#FFFFFF33'}}><View style={{height:16,width:(share*100)+'%' as `${number}%`,backgroundColor:share>.5?'#8FD47A':share>.2?'#F2D16E':'#F0846A'}}/></View>
  <View testID="raid-players" style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{Array.from({length:RAID_RULES.maxMembers},(_,i)=>{const m=l.members[i];return <View key={i} accessibilityLabel={m?m.name+(m.me?' (jij)':'')+', '+m.damage+' schade':'Vrije plek'} style={{width:'31.5%',minHeight:70,alignItems:'center',justifyContent:'center',gap:1,borderRadius:16,backgroundColor:m?.me?'#3D6446':m?'#1B4A3F':'transparent',borderWidth:m?1:2,borderStyle:m?'solid':'dashed',borderColor:m?.me?'#ECD289':'#FFFFFF33'}}>{m?<><Text style={{fontSize:22}}>{m.me?'⭐':m.remote?'🌍':'🧑'}</Text><Label small bold>{m.me?'Jij':m.name}</Label>{fighting||ended?<Label small>💥 {m.damage}</Label>:null}</>:<Text style={{fontSize:22,opacity:.4}}>+</Text>}</View>;})}</View>
  {!ended&&<Counters kind={l.species} view={view}/>}
  {ended?<Button icon={l.status==='won'&&!l.claimed&&(me?.damage??0)>0?'gift':'check'} disabled={busy} onPress={()=>void run('raidClaim',{lobby:l.id})}>{l.status==='won'&&!l.claimed&&(me?.damage??0)>0?'🎁 Beloning + vangen':'Sluiten'}</Button>
   :battle?<Button icon="swords" onPress={onBattle}>⚔️ Naar het gevecht</Button>
   :fighting?<Button icon="swords" disabled={busy||!!view.goBattle} onPress={()=>setChoosing(true)}>{view.goBattle?'Sluit eerst je vorige gevecht':'⚔️ Vecht mee'}</Button>
   :<View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button secondary icon="friends" disabled={busy} onPress={()=>setInviting(v=>!v)}>Vrienden</Button></View><View style={{flex:1}}><Button secondary icon="back" disabled={busy} onPress={()=>void run('raidLeave')}>Verlaat</Button></View></View>}
  {inviting&&!fighting&&!ended&&<InviteFriends {...{view,run,busy}} raid={l.raidId} onDone={()=>setInviting(false)}/>}
 </Panel>{choosing&&<GoTeamPickerV2 raid against={l.species} title="Team voor de raid" player={view.player} {...{run,busy}} onClose={()=>setChoosing(false)} onConfirm={fight}/>}</>;
}

/** Invitations from friends: join remotely, once a day free, otherwise with a Zwermfluit. Shows the post name only. */
export function RaidInvitesV2({view,run,busy,now}:{view:GameViewV2;run:RunV2;busy:boolean;now:number}){
 const invites=(view.raidInvites??[]).filter((i:RaidInvite)=>i.endsAt>now);if(!invites.length&&!view.raidLobby)return null;
 const g=view.player.go!.raids,passes=g?.passes??0,ticket=freeRemoteLeft(g,now),remoteLeft=RAID_RULES.remotePerDay-(g?.remote??0);
 return <Panel><View style={{flexDirection:'row',alignItems:'center',gap:7}}><Glyph name="friends" size={24}/><View style={{flex:1}}><Label bold>Zwermuitnodigingen</Label></View><Help title="Zwermen" body={RAID_HELP}/></View><Pass {...{view,run,busy,now}}/>
  {invites.map(i=>{const config=RAID_TIERS[i.tier],low=trainerLevel(view.player.go!.trainer!.xp)<config.trainer,hatched=now>=i.endsAt-45*60000;return <View key={i.raidId+i.from.uid} testID="raid-invite" style={{gap:6,padding:9,borderRadius:16,backgroundColor:'#204B40'}}><View style={{flexDirection:'row',alignItems:'center',gap:9}}>{hatched?<SpriteView id={i.species} size={48}/>:<Glyph name="lock" size={36}/>}<View style={{flex:1}}><Label small bold>{i.from.name} nodigt je uit</Label><Label small>{config.name} · {hatched?species(i.species).name:'Zwermei'} · {i.postName}</Label><Label small>Nog {mmss(i.endsAt-now)}</Label>{hatched&&<GoTypes species={i.species} compact/>}</View><Stars tier={i.tier}/></View>
   <Button small icon="swords" disabled={busy||!hatched||!!view.raidLobby||passes<1&&!ticket||remoteLeft<1||low} onPress={()=>void run('raidJoin',{raid:i.raidId,remote:true})}>{view.raidLobby?'Je zit al in een zwerm':!hatched?'Nog een ei':low?'Trainerlevel '+config.trainer:remoteLeft<1?'3 / 3 vandaag':ticket?'🎟️ Doe mee op afstand':passes<1?'Zwermfluit nodig':'Doe mee op afstand'}</Button></View>;})}
 </Panel>;
}

/** PoGO-style nearby raid list: every raid at a gym you can see, eggs and bosses, near ones first; tap to open its card (join here or remotely, invite friends). */
export function RaidListV2({view,run,busy,now,ensureGPS}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;ensureGPS?:()=>Promise<boolean>}){
 const [open,setOpen]=useState(''),raids=[...(view.raids??[])].filter(r=>r.endsAt>now).sort((a,b)=>Number(b.local)-Number(a.local)||Number(a.hatchAt>now)-Number(b.hatchAt>now)||a.endsAt-b.endsAt);
 if(!raids.length)return null;
 return <View testID="raid-list"><Panel><View style={{flexDirection:'row',alignItems:'center',gap:7}}><Glyph name="swords" size={24}/><Label bold>{'Raids · '+raids.length}</Label><View style={{flex:1}}/><Pass {...{view,run,busy,now}}/></View>
  {raids.map(r=>{const egg=now<r.hatchAt,selected=open===r.id;return <View key={r.id} style={{gap:6}}><Pressable accessibilityRole="button" accessibilityLabel={(egg?'Zwermei':species(r.species).name)+', '+r.tier+' sterren, '+(r.local?'dichtbij':'op afstand')} testID={'raid-row-'+r.id} onPress={()=>setOpen(selected?'':r.id)} style={{flexDirection:'row',alignItems:'center',gap:9,padding:7,borderRadius:16,backgroundColor:selected?'#2F5B3A':'#1B4A3F',borderWidth:1,borderColor:selected?'#F2D16E':'#FFFFFF22'}}>
   {egg?<View style={{width:46,height:46,alignItems:'center',justifyContent:'center'}}><Label bold>🥚</Label></View>:<SpriteView id={r.species} size={46}/>}
   <View style={{flex:1,gap:2}}><Stars tier={r.tier}/><Label small>{r.site.name}</Label></View>
   {!egg&&<GoTypes species={r.species} compact/>}<View style={{alignItems:'flex-end'}}><Label small bold>{egg?'🥚 '+mmss(r.hatchAt-now):'⏱ '+mmss(r.endsAt-now)}</Label><Label small>{r.local?'📍 hier':'🌍 afstand'}</Label></View></Pressable>
   {selected&&<RaidAtGymV2 raid={r} {...{view,run,busy,now,ensureGPS}}/>}</View>;})}
 </Panel></View>;
}
