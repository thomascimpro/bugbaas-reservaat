import React,{useState} from 'react';
import {Pressable,View} from 'react-native';
import {species} from '../game/catalogV2';
import {effectiveness} from '../game/goBattleV2';
import {movePool} from '../game/goV2';
import type {Element} from '../game/goV2';
import {RAID_RULES,RAID_TIERS,freeRemoteLeft} from '../game/raidsV2';
import {matchup} from '../game/recommendV2';
import type {RaidInvite,RaidTier,RaidView} from '../game/raidsV2';
import {trainerLevel} from '../game/trainerV2';
import type {GameViewV2} from '../game/typesV2';
import {SpriteView} from './artV2';
import {GoTeamPickerV2} from './GoTeamPickerV2';
import {GO_TYPES,GoTypeBadge,GoTypes} from './GoTypeV2';
import type {RunV2} from './ShopViewV2';
import {Button,Counter,Glyph,Help,Label,Panel} from './uiV2';

const RAID_HELP='Elke gympost krijgt om de 2 à 3 uur een zwermei (★1, ★3 of zeldzaam ★4), steeds met een ander type baas. Het ei komt na een uur uit; daarna blijft de zwerm 45 minuten. Max. 6 spelers per groep, waarvan max. 4 op afstand. De lobby start na 90 seconden of zodra hij vol is; daarna hebben jullie samen 3 minuten. Iedereen vecht met drie eigen bugs, zonder CP-limiet. Alle schade telt voor dezelfde baas. Wie schade deed, krijgt na winst één keer een beloning en een vangpoging met extra netten. Op afstand meedoen kan alleen met een uitnodiging van een vriend: 1 keer per dag gratis 🎟️, daarna kost het een Zwermfluit (1 gratis op te halen per dag, max. 3 in bezit, max. 3 keer per dag). 👍 = type dat sterk is tegen de baas. Max. 5 zwermbeloningen per dag.';
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

/** Raid card on a gym: egg countdown, join locally, or invite friends. */
export function RaidAtGymV2({view,raid,run,busy,now,ensureGPS}:{view:GameViewV2;raid:RaidView;run:RunV2;busy:boolean;now:number;ensureGPS?:()=>Promise<boolean>}){
 const [inviting,setInviting]=useState(false),config=RAID_TIERS[raid.tier],egg=now<raid.hatchAt,g=view.player.go!.raids,claimed=!!g?.claimed.includes(raid.id),inLobby=!!view.raidLobby&&view.raidLobby.raidId===raid.id;
 const low=trainerLevel(view.player.go!.trainer!.xp)<config.trainer,closing=now>=raid.joinableUntil,capped=(g?.rewards??0)>=RAID_RULES.rewardsPerDay,remoteOk=(g?.remote??0)<RAID_RULES.remotePerDay&&(freeRemoteLeft(g,now)||(g?.passes??0)>0);
 async function join(){if(ensureGPS&&!await ensureGPS())return;await run('raidJoin',{raid:raid.id,remote:false});}
 return <Panel style={{borderColor:'#D7A74F'}}><View style={{flexDirection:'row',alignItems:'center',gap:7}}><Glyph name="swords" size={24}/><View style={{flex:1}}><Label bold>{config.name} · samen</Label><Stars tier={raid.tier}/></View><Help title="Zwermen" body={RAID_HELP}/></View>
  <View style={{flexDirection:'row',alignItems:'center',gap:12}}>{egg?<View style={{width:82,height:82,alignItems:'center',justifyContent:'center'}}><Glyph name="lock" size={48}/></View>:<SpriteView id={raid.species} size={82}/>}<View style={{flex:1,gap:5}}><Label bold>{egg?'Zwermei':species(raid.species).name}</Label><Label small>{egg?'Komt uit over '+mmss(raid.hatchAt-now):'Nog '+mmss(raid.endsAt-now)+' · Lv. '+config.level}</Label>{!egg&&<GoTypes species={raid.species} compact/>}</View></View>
  {!egg&&<Counters kind={raid.species} view={view}/>}
  {!egg&&<View style={{flexDirection:'row',justifyContent:'space-around'}}><Counter icon="nectar" value={'+'+config.dust} label="✨ Stof"/><Counter icon="star" value={'+'+config.xp} label="XP"/></View>}
  {!egg&&!inLobby&&raid.local&&<Button small icon="swords" disabled={busy||claimed||closing||low||capped||!!view.raidLobby} onPress={()=>void join()}>{claimed?'Vandaag verslagen':capped?'5 / 5 vandaag':low?'Trainerlevel '+config.trainer:closing?'Vertrekt bijna':view.raidLobby?'Je zit al in een zwerm':'Doe mee'}</Button>}
  {!egg&&!inLobby&&!raid.local&&<><Pass {...{view,run,busy,now}}/><Button small icon="swords" accessibilityLabel="Doe mee op afstand" disabled={busy||claimed||closing||low||capped||!!view.raidLobby||!remoteOk} onPress={()=>void run('raidJoin',{raid:raid.id,remote:true})}>{claimed?'Vandaag verslagen':capped?'5 / 5 vandaag':low?'Trainerlevel '+config.trainer:closing?'Vertrekt bijna':view.raidLobby?'Je zit al in een zwerm':!remoteOk?'Geen ticket of Zwermfluit':'🎟️ Doe mee op afstand'}</Button></>}
  {!closing&&<Button small secondary icon="friends" disabled={busy||!raid.local&&!inLobby} onPress={()=>setInviting(v=>!v)}>{inviting?'Sluit uitnodigen':'Nodig vrienden uit'}</Button>}
  {inviting&&<InviteFriends {...{view,run,busy}} raid={raid.id} onDone={()=>setInviting(false)}/>}
 </Panel>;
}

/** The player's current raid group: lobby timer, shared HP, members, fight and reward. */
export function RaidLobbyV2({view,run,busy,now,onBattle}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;onBattle:()=>void}){
 const l=view.raidLobby,[choosing,setChoosing]=useState(false),[inviting,setInviting]=useState(false);if(!l)return null;
 const config=RAID_TIERS[l.tier],fighting=l.status==='lobby'&&now>=l.lobbyUntil||l.status==='fighting',ended=l.status==='won'||l.status==='failed',me=l.members.find(m=>m.me),battle=view.goBattle?.raid?.lobbyId===l.id&&view.goBattle.phase!=='finished';
 async function fight(ids:string[]){const ok=await run('raidFight',{ids});if(ok)onBattle();return ok;}
 return <><Panel style={{borderColor:'#ECD289'}}><View testID="raid-lobby" style={{flexDirection:'row',alignItems:'center',gap:9}}><SpriteView id={l.species} size={58}/><View style={{flex:1,gap:3}}><Label bold>{config.name} · {species(l.species).name}</Label><Label small>{l.postName}{l.remote?' · op afstand':''}</Label><Stars tier={l.tier}/><GoTypes species={l.species} compact/></View><Help title="Zwermen" body={RAID_HELP}/></View>
  <Counters kind={l.species} view={view}/>
  <View accessibilityLabel={'Zwerm-HP '+l.hp+' van '+l.maxHP} style={{height:12,borderRadius:7,overflow:'hidden',backgroundColor:'#0E2B25'}}><View style={{height:12,width:(Math.max(0,l.hp)/Math.max(1,l.maxHP)*100)+'%' as `${number}%`,backgroundColor:l.hp/l.maxHP>.5?'#8FD47A':l.hp/l.maxHP>.2?'#F2D16E':'#F0846A'}}/></View>
  <Label small bold>{l.status==='won'?'Verslagen!':l.status==='failed'?'De zwerm is ontsnapt.':fighting?'Samen vechten · nog '+mmss((l.fightUntil??l.lobbyUntil+180000)-now):'Start over '+mmss(l.lobbyUntil-now)+' · '+l.members.length+' / '+RAID_RULES.maxMembers}</Label>
  {l.members.map((m,i)=><View key={i} style={{flexDirection:'row',alignItems:'center',gap:8}}><Glyph name={m.remote?'compass':'profile'} size={18}/><View style={{flex:1}}><Label small bold={m.me}>{m.name}{m.me?' (jij)':''}{m.remote?' · op afstand':''}</Label></View><Label small>{m.damage} schade</Label></View>)}
  {ended?<Button small icon={l.status==='won'&&!l.claimed&&(me?.damage??0)>0?'gift':'check'} disabled={busy} onPress={()=>void run('raidClaim',{lobby:l.id})}>{l.status==='won'&&!l.claimed&&(me?.damage??0)>0?'Beloning en vangpoging':'Sluiten'}</Button>
   :battle?<Button small icon="swords" onPress={onBattle}>Naar het gevecht</Button>
   :fighting?<Button small icon="swords" disabled={busy||!!view.goBattle} onPress={()=>setChoosing(true)}>{view.goBattle?'Sluit eerst je vorige gevecht':'Vecht mee'}</Button>
   :<><Button small secondary icon="friends" disabled={busy} onPress={()=>setInviting(v=>!v)}>{inviting?'Sluit uitnodigen':'Nodig vrienden uit'}</Button><Button small secondary icon="back" disabled={busy} onPress={()=>void run('raidLeave')}>Verlaat lobby</Button></>}
  {inviting&&!fighting&&!ended&&<InviteFriends {...{view,run,busy}} raid={l.raidId} onDone={()=>setInviting(false)}/>}
 </Panel>{choosing&&<GoTeamPickerV2 raid against={l.species} title="Team voor de zwerm" player={view.player} {...{run,busy}} onClose={()=>setChoosing(false)} onConfirm={fight}/>}</>;
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
