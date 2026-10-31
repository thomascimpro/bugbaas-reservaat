import {FieldBossV2} from './FieldBossV2';
import {RaidAtGymV2,RaidInvitesV2,RaidListV2,RaidLobbyV2} from './GoRaidV2';
import React,{useId,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import Svg,{Defs,LinearGradient,RadialGradient,Stop,Path,Ellipse,Circle,G} from 'react-native-svg';
import {GYM_TEAMS,GYM_RULES,gymCoins,gymTimeLeft,defendingGym,recommendedGymTeam,gymAttackIssue,gymFightable,firstGymTab} from '../game/gymsV2';
import type {GymTab,GymTeam,GymView} from '../game/gymsV2';
import type {GameViewV2,Specimen} from '../game/typesV2';
import {stats} from '../game/goV2';
import {distance,GPS_MAX_AGE} from '../game/walkingV2';
import {species} from '../game/catalogV2';
import {SpriteView} from './artV2';
import {GoTypes} from './GoTypeV2';
import {Button,Counter,font,Glyph,Help,Label,Panel,V,useInfo} from './uiV2';
import type {RunV2} from './ShopViewV2';
import {TabsV2} from './TabsV2';

export function GymArtV2({team,size=90,occupied=0}:{team:GymTeam|null;size?:number;occupied?:number}){
 const color=team?GYM_TEAMS[team].color:'#C6B98C',id='gym'+useId().replace(/:/g,''),pads=[[37,79],[60,71],[83,79],[34,98],[60,108],[86,98]];
 return <View pointerEvents="none" testID="gym-arena-art" style={{width:size,height:size*1.18,flexShrink:0}}><Svg width={size} height={size*1.18} viewBox="0 0 120 142"><Defs>
  <LinearGradient id={id+'stone'} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#A7BDA8"/><Stop offset=".45" stopColor="#426B57"/><Stop offset="1" stopColor="#163E35"/></LinearGradient>
  <LinearGradient id={id+'rim'} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#F4E6BC"/><Stop offset=".38" stopColor={color}/><Stop offset="1" stopColor="#32574A"/></LinearGradient>
  <RadialGradient id={id+'glow'}><Stop offset="0" stopColor={color} stopOpacity={.55}/><Stop offset="1" stopColor={color} stopOpacity={0}/></RadialGradient>
 </Defs><Ellipse cx="60" cy="94" rx="58" ry="45" fill={'url(#'+id+'glow)'}/><Ellipse cx="60" cy="130" rx="52" ry="9" fill="#062D2566"/>
 <Path d="M9 108 60 84 111 108 111 118 60 140 9 118Z" fill="#173D34" stroke="#1D493B" strokeWidth="2"/><Path d="M9 108 60 84 111 108 60 131Z" fill={'url(#'+id+'stone)'} stroke="#B6C7A688" strokeWidth="1.5"/><Path d="M60 131V139M17 113 60 132 103 113" fill="none" stroke={color} strokeWidth="2" opacity={.65}/>
 <Path d="M15 84V97C15 128 105 128 105 97V84Z" fill={'url(#'+id+'stone)'} stroke="#B8C8A4" strokeWidth="1.5"/><Ellipse cx="60" cy="84" rx="45" ry="26" fill="#183F35" stroke={'url(#'+id+'rim)'} strokeWidth="5"/><Ellipse cx="60" cy="85" rx="37" ry="20" fill="#315B45" stroke={color} strokeWidth="1"/><Path d="M28 87 60 70 92 87 60 105Z" fill="#426A4D" stroke="#B6C89744"/>
 {pads.map(([x,y],i)=><G key={i}><Ellipse cx={x} cy={y} rx="7" ry="3.7" fill={i<occupied?color:'#183B31'} stroke={i<occupied?'#F3E3B2':'#88A484'} strokeWidth="1.2"/>{i<occupied&&<Ellipse cx={x} cy={y-2} rx="3" ry="1.5" fill="#FFF2BE"/>}</G>)}
 <Path d="M22 74V50L31 46V77M89 77V46L98 50V74" fill={'url(#'+id+'stone)'} stroke="#A3B79A" strokeWidth="1.5"/>
 <Path d="M14 55C21 23 42 15 60 24 78 15 99 23 106 55L96 65C91 43 75 35 60 41 45 35 29 43 24 65Z" fill={'url(#'+id+'rim)'} stroke="#EEE2B6" strokeWidth="1.5"/>
 <Path d="M18 51C29 31 44 29 54 34M102 51C91 31 76 29 66 34" fill="none" stroke="#F8EDC7" strokeWidth="1.5" opacity={.65}/><Path d="M28 39 22 54M40 29 35 44M92 39 98 54M80 29 85 44" stroke="#173F3866" strokeWidth="2"/>
 <Path d="M60 9 78 19V39L60 50 42 39V19Z" fill={'url(#'+id+'rim)'} stroke="#F7EAC0" strokeWidth="2"/><Path d="M60 15 72 22V36L60 43 48 36V22Z" fill="#173F35" stroke={color}/><Path d="M60 22C49 19 48 34 59 36 70 34 71 19 60 22ZM60 21V37M53 24 48 21M67 24 72 21M53 31 48 34M67 31 72 34" fill={color} stroke="#EDE3BD" strokeWidth="1.2"/>
 <Path d="M10 112C0 105 3 95 13 99 17 103 14 108 10 112ZM110 112C120 105 117 95 107 99 103 103 106 108 110 112" fill="#4F8753" stroke="#94B375"/>
 </Svg></View>;
}
const hm=(ms:number)=>{const min=Math.max(0,Math.ceil(ms/60000));return Math.floor(min/60)+'u '+String(min%60).padStart(2,'0')+'m';};
const mmss=(ms:number)=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const today=(now:number)=>new Date(now).toISOString().slice(0,10);
const TABS:{id:GymTab;emoji:string;name:string;line:string}[]=[{id:'raid',emoji:'🥚',name:'Raids',line:'Raid = samen een grote baas verslaan'},{id:'gym',emoji:'🛡️',name:'Gym',line:'Gym = zet je bug neer en verdien munten'},{id:'fight',emoji:'⚔️',name:'Vechten',line:'Vechten = win een gym voor je ploeg'}];
const COIN_HELP='🪙 1 munt per 10 minuten. ⏱ Je bug blijft maximaal 8 uur (dus max. '+GYM_RULES.maxCoins+' munten) en komt dan vanzelf terug met zijn munten. Verslagen? Dan komt hij eerder terug. Samen max. '+GYM_RULES.dailyCoins+' munten per dag. Wilde wachters (NPC) geven geen munten.';
const GYM_HELP='Max. zes bugs van één ploeg, één per speler, geen dubbele soorten. Een verslagen bug verliest een ❤️; bij nul komt hij terug met zijn munten. Elke vier uur gaat er ook een ❤️ af (minstens één blijft). 🏆 Gym gewonnen? Dan mag je er 10 minuten lang meteen een bug neerzetten, ook van ver. 🎟️ 1× per dag: vechten óf een bug neerzetten op afstand. Geen schilden of Elo.';
type FarGymV2=GymView&{far?:true};
const away=(m:number)=>!Number.isFinite(m)?'📍 ?':m<1000?'📍 '+Math.round(m)+' m':'📍 '+(m/1000).toLocaleString('nl-NL',{maximumFractionDigits:1})+' km';
/** Gyms you see in the distance (same 12 the server allows from afar): team, how full and wild guards; who defends stays hidden. */
function farGymsV2(p:GameViewV2['player'],known:GymView[]):FarGymV2[]{
 const w=p.walking;if(!w)return [];return (w.mapSites??[]).filter(s=>s.gym&&s.team!==undefined&&!known.some(g=>g.postId===s.id)).sort((a,b)=>distance(w.fix,a)-distance(w.fix,b)).slice(0,12).map(s=>({id:'gym-'+s.id,postId:s.id,name:s.name==='Veldpost'?'Wachtershonk':s.name+' · Gym',lat:s.lat,lng:s.lng,team:s.team??null,revision:0,battling:false,far:true as const,defenders:Array.from({length:s.npc&&!s.defenders?3:s.defenders??0},(_,i)=>({id:'far-'+i,name:'',species:'',shiny:false,cp:0,hearts:1,at:0,me:false,npc:!!s.npc}))}));
}
function GymRowV2({g,fix,raid,onPress}:{g:FarGymV2;fix?:{lat:number;lng:number};raid:boolean;onPress:()=>void}){
 const npc=g.defenders.some(d=>d.npc);return <Pressable accessibilityRole="button" accessibilityLabel={'Open gym '+g.name} onPress={onPress} style={{flexDirection:'row',alignItems:'center',gap:10,padding:8,borderRadius:18,backgroundColor:'#214C40',borderWidth:1,borderColor:g.team?GYM_TEAMS[g.team].color:'#66886C'}}><GymArtV2 team={g.team} occupied={g.defenders.length} size={46}/><View style={{flex:1,gap:2}}><Label small bold>{g.name}</Label><Label small>{npc?'🐾 Wilde wachters':g.team?GYM_TEAMS[g.team].name:'Vrij'} · 🛡️ {g.defenders.length}/6{g.defenders.some(d=>d.me)?' · ⭐ jij':''}{raid?' · 🥚':''}</Label></View><View style={{alignItems:'flex-end'}}><Label small bold>{away(fix?distance(fix,g):Infinity)}</Label>{g.far&&<Label small color="#F2D16E">🎟️</Label>}</View><Glyph name="next" size={20}/></Pressable>;
}
/** Your bugs in gyms: ⏱ time left until they come home and 🪙 coins so far out of the maximum. */
function MyDefendersV2({view,now,onOpen}:{view:GameViewV2;now:number;onOpen:(id:string)=>void}){
 const p=view.player,list=p.go?.gyms?.deployed??[];if(!list.length)return <Label small color={V.muted}>🛡️ Nog geen bug in een gym. Kies een gym hieronder.</Label>;
 return <View testID="my-defenders" style={{gap:6}}>{list.slice(0,4).map(d=>{const bug=p.specimens.find(s=>s.id===d.specimen),coins=gymCoins(d.at,now),left=gymTimeLeft(d.at,now);return <Pressable key={d.deployment} accessibilityRole="button" accessibilityLabel={(bug?species(bug.species).name:'Bug')+' in '+d.name+', nog '+hm(left)+', '+coins+' van '+GYM_RULES.maxCoins+' munten'} onPress={()=>onOpen(d.id)} style={{flexDirection:'row',alignItems:'center',gap:9,padding:7,borderRadius:16,backgroundColor:'#1B4A3F'}}>{bug?<SpriteView id={bug.species} shiny={bug.shiny} size={42}/>:<Glyph name="shield" size={36}/>}<View style={{flex:1,gap:3}}><Label small bold>{d.name}</Label><View style={{flexDirection:'row',gap:10}}><Label small>⏱ {hm(left)}</Label><Label small>🪙 {coins} / {GYM_RULES.maxCoins}</Label></View><View style={{height:6,borderRadius:3,backgroundColor:'#0E2B25',overflow:'hidden'}}><View style={{height:6,width:(coins/GYM_RULES.maxCoins*100)+'%' as `${number}%`,backgroundColor:'#F2D16E'}}/></View></View><Glyph name="next" size={20}/></Pressable>;})}{list.length>4&&<Label small center>+{list.length-4} meer</Label>}</View>;
}
function TeamGateV2({view,run,busy,open}:{view:GameViewV2;run:RunV2;busy:boolean;open:(name:string)=>void}){
 const info=useInfo();if(!view.linked)return <Panel><Label>Bewaar je avontuur om gyms te spelen.</Label><Button icon="profile" onPress={()=>open('account')}>Koppel account</Button></Panel>;
 if(view.player.go?.gyms?.team)return null;
 return <Panel><Label bold>Kies je ploeg</Label><View style={{flexDirection:'row',gap:8}}>{(Object.keys(GYM_TEAMS) as GymTeam[]).map(team=><Pressable key={team} accessibilityRole="button" accessibilityLabel={'Kies gymploeg '+GYM_TEAMS[team].name} onPress={()=>info.show({title:'Ploeg '+GYM_TEAMS[team].name+' kiezen?',icon:'shield',body:'Samen met je ploeg verdedig je gyms. Andere ploegen kun je aanvallen. Deze keuze blijft altijd.',action:{label:'Kies '+GYM_TEAMS[team].name,onPress:()=>{void run('gymTeam',{team}).then(ok=>{if(ok)info.hide();});}}})} disabled={busy} style={{flex:1,alignItems:'center',padding:8,borderRadius:20,backgroundColor:'#234F43',borderWidth:1,borderColor:GYM_TEAMS[team].color}}><GymArtV2 team={team} size={56}/><Label bold>{GYM_TEAMS[team].name}</Label></Pressable>)}</View></Panel>;
}
/** Pick bugs from a short list (strongest first); "Meer" shows the rest. */
function BugPickV2({bugs,chosen,onPick,label}:{bugs:Specimen[];chosen:string[];onPick:(id:string)=>void;label:string}){
 const [all,setAll]=useState(false),shown=all?bugs:bugs.slice(0,6);
 return <View style={{gap:6}}><View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{shown.map(s=>{const on=chosen.includes(s.id);return <Pressable key={s.id} accessibilityRole="button" accessibilityLabel={label+' '+species(s.species).name+' CP '+stats(s).cp} accessibilityState={{selected:on}} onPress={()=>onPick(s.id)} style={{width:'31.5%',padding:5,alignItems:'center',borderRadius:15,borderWidth:2,borderColor:on?'#ECD289':'#557B6444',backgroundColor:on?'#2F6650':'#204B40'}}><SpriteView id={s.species} shiny={s.shiny} size={46}/><Label small bold>{stats(s).cp} CP</Label><GoTypes species={s.species} compact/></Pressable>;})}</View>{bugs.length>6&&<Button small secondary icon={all?'back':'next'} onPress={()=>setAll(v=>!v)}>{all?'Minder':'Meer bugs ('+bugs.length+')'}</Button>}</View>;
}

/** Nearest four first; "Meer gyms" shows the rest (far ones carry 🎟️: 1× a day from afar). */
function GymListV2({title,list,fix,raids,onOpen}:{title:string;list:FarGymV2[];fix?:{lat:number;lng:number};raids:{site:{id:string}}[];onOpen:(id:string)=>void}){
 const [all,setAll]=useState(false);return <View style={{gap:7}}><Label bold>{title}</Label>{(all?list:list.slice(0,4)).map(g=><GymRowV2 key={g.id} g={g} fix={fix} raid={raids.some(r=>r.site.id===g.id)} onPress={()=>onOpen(g.id)}/>)}{list.length>4&&<Button small secondary icon={all?'back':'next'} onPress={()=>setAll(v=>!v)}>{all?'Minder':'Meer gyms ('+list.length+')'}</Button>}</View>;
}
export function GoGymsV2({view,run,busy,now,initialId,onBattle,open,ensureGPS}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;initialId?:string;onBattle:()=>void;open:(name:string)=>void;ensureGPS?:()=>Promise<boolean>}){
 const p=view.player,progress=p.go?.gyms,myTeam=progress?.team??null,known=view.goGyms??[],gyms:FarGymV2[]=[...known,...farGymsV2(p,known)],won=progress?.won&&progress.won.until>now?progress.won:undefined,fix=p.walking?.fix,ticket=progress?.remoteDay!==today(now);
 const [selected,setSelected]=useState(()=>initialId??won?.id??''),gym=gyms.find(g=>g.id===selected);
 const invites=(view.raidInvites??[]).filter(i=>i.endsAt>now).length,raids=(view.raids??[]).filter(r=>r.endsAt>now);
 const [tab,setTab]=useState<GymTab>(()=>{const g=gyms.find(x=>x.id===(initialId??won?.id));return firstGymTab({lobby:!!view.raidLobby&&!g,invites,myTeam,gym:g,gymRaid:!!g&&raids.some(r=>r.site.id===g.id),won:!!g&&won?.id===g.id});});
 const openGym=(id:string,next:GymTab)=>{setSelected(id);setTab(next);};
 const near=(g:GymView)=>fix?distance(fix,g):Infinity,byNear=(a:GymView,b:GymView)=>near(a)-near(b),fightable=gyms.filter(g=>gymFightable(g,myTeam)).sort(byNear),own=gyms.filter(g=>!gymFightable(g,myTeam)&&(!g.team||g.team===myTeam)).sort(byNear);
 const badges={raid:gym?raids.filter(r=>r.site.id===gym.id).length:raids.length+invites+(view.raidLobby?1:0),gym:gym?Number(won?.id===gym.id):progress?.deployed.length??0,fight:gym?Number(gymFightable(gym,myTeam)):fightable.filter(g=>!(g as FarGymV2).far).length};
 const ticketChip=!!myTeam&&<Label small bold center color={ticket?'#F2D16E':V.muted}>{ticket?'🎟️ 1× vandaag op afstand':'🎟️ Op afstand: morgen weer'}</Label>;
 return <View style={{gap:12}}>
  {gym&&<Button small secondary icon="back" onPress={()=>{setSelected('');setTab('gym');}}>Alle gyms</Button>}
  <TabsV2 testID="gym-tab" tab={tab} setTab={setTab} tabs={TABS.map(t=>({...t,badge:badges[t.id]}))}/>
  {gym?<GymDetailV2 key={gym.id} {...{view,gym,tab,run,busy,now,onBattle,open,ensureGPS}}/>
  :tab==='raid'?<View style={{gap:12}}><RaidLobbyV2 {...{view,run,busy,now,onBattle}}/><RaidInvitesV2 {...{view,run,busy,now}}/><RaidListV2 {...{view,run,busy,now,ensureGPS}}/>{!raids.length&&!view.raidLobby&&!invites&&<Panel style={{alignItems:'center'}}><Text style={{fontSize:44}}>🥚</Text><Label bold center>Nu geen raid</Label><Label small center color={V.muted}>⏱ Elke 2–3 uur een nieuw ei</Label></Panel>}</View>
  :tab==='gym'?<View style={{gap:12}}><TeamGateV2 {...{view,run,busy,open}}/>
    <Panel><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Counter icon="coin" value={progress?.coins??0} label="Munten"/><View style={{flex:1}}><Label small bold>🪙 {progress?.earned??0} / {GYM_RULES.dailyCoins} vandaag</Label>{myTeam&&<Label small color={GYM_TEAMS[myTeam].color}>Ploeg {GYM_TEAMS[myTeam].name}</Label>}</View><Help title="Munten" icon="coin" body={COIN_HELP}/><Button small secondary icon="bag" onPress={()=>open('coinShop')}>Shop</Button></View>
     <MyDefendersV2 view={view} now={now} onOpen={id=>openGym(id,'gym')}/></Panel>
    {own.length?<>{ticketChip}<GymListV2 title="🛡️ Zet een bug neer" list={own} fix={fix} raids={raids} onOpen={id=>openGym(id,'gym')}/></>:<Panel style={{alignItems:'center'}}><GymArtV2 team={null} size={60}/><Label small center>{gyms.length?'⚔️ Win eerst een gym':'🗺️ Loop naar een gym'}</Label>{!gyms.length&&<Button icon="compass" onPress={()=>open('map')}>Naar kaart</Button>}</Panel>}
    {!!progress?.returns.length&&<Panel><Label bold>🏠 Terug</Label>{progress.returns.slice(0,2).map(r=><View key={r.id} style={{flexDirection:'row',alignItems:'center',gap:9}}><SpriteView id={r.species} shiny={r.shiny} size={40}/><View style={{flex:1}}><Label small bold>{species(r.species).name}</Label><Label small>⏱ {hm(r.minutes*60000)} · {r.name}</Label></View><Label small bold>🪙 +{r.coins}</Label></View>)}</Panel>}</View>
  :<View style={{gap:12}}><TeamGateV2 {...{view,run,busy,open}}/>
    {fightable.length?<>{ticketChip}<GymListV2 title="⚔️ Gyms om te winnen" list={fightable} fix={fix} raids={raids} onOpen={id=>openGym(id,'fight')}/></>:<Label small center color={V.muted}>Geen gym om te winnen.</Label>}</View>}
 </View>;
}

/** One gym, same three tabs: its raid, the gym itself (defenders, place a bug), and fighting it (here or 1× a day from afar). */
function GymDetailV2({view,gym,tab,run,busy,now,onBattle,open,ensureGPS}:{view:GameViewV2;gym:FarGymV2;tab:GymTab;run:RunV2;busy:boolean;now:number;onBattle:()=>void;open:(name:string)=>void;ensureGPS?:()=>Promise<boolean>}){
 const p=view.player,progress=p.go?.gyms,myTeam=progress?.team??null,info=useInfo(),[defender,setDefender]=useState(''),[attack,setAttack]=useState<string[]>(()=>recommendedGymTeam(p)),[problem,setProblem]=useState('');
 const fix=p.walking?.fix,meters=fix?Math.round(distance(fix,gym)):Infinity,fresh=!!p.walking&&now-Math.min(p.walking.at,fix?.timestamp??p.walking.at)<GPS_MAX_AGE&&(fix?.accuracy??999)<=35&&(p.walking.blockedUntil??0)<=now,here=fresh&&meters<=GYM_RULES.range;
 const npc=gym.defenders.some(d=>d.npc),fight=gymFightable(gym,myTeam),mine=progress?.deployed.find(d=>d.id===gym.id),won=progress?.won&&progress.won.id===gym.id&&progress.won.until>now?progress.won:undefined,ticket=progress?.remoteDay!==today(now);
 const free=p.specimens.filter(s=>s.go&&!defendingGym(p,s.id)).sort((a,b)=>stats(b).cp-stats(a).cp),eligible=free.filter(s=>s.id!==p.buddy&&!gym.defenders.some(d=>d.species===s.species)),chosen=eligible.find(s=>s.id===defender),attackIds=attack.filter(id=>free.some(s=>s.id===id)),issue=gymAttackIssue(p,attackIds);
 const gymRaids=(view.raids??[]).filter(r=>r.site.id===gym.id&&r.endsAt>now),canPlace=!!myTeam&&!mine&&!gym.battling&&!npc&&(gym.team===null||gym.team===myTeam)&&gym.defenders.length<GYM_RULES.slots;
 async function act(type:'gymDefend'|'gymAttack',params:Record<string,unknown>,remote:boolean){setProblem('');if(!remote&&!(type==='gymDefend'&&won)&&ensureGPS&&!await ensureGPS())return false;const ok=await run(type,remote?{...params,remote:true}:params);if(ok&&type==='gymAttack')onBattle();if(!ok)setProblem('Dat lukte niet. Probeer het nog eens.');return ok;}
 const walk=gym.far?<Label small bold center color={V.muted}>🎟️ Op afstand: morgen weer</Label>:<Button small secondary icon="compass" onPress={()=>{if(ensureGPS)void ensureGPS();else open('map');}}>{!fresh?'📍 Vernieuw GPS':'📍 Loop binnen '+GYM_RULES.range+' m'}</Button>;
 return <View style={{gap:10}}>
  {!(tab==='raid'&&(gymRaids.length||view.raidLobby))&&<View testID="gym-hero" style={{flexDirection:'row',alignItems:'center',gap:12,padding:10,borderRadius:22,backgroundColor:'#163E34',borderWidth:1,borderColor:gym.team?GYM_TEAMS[gym.team].color+'88':'#B4BA8C77'}}><GymArtV2 team={gym.team} occupied={gym.defenders.length} size={72}/><View style={{flex:1,gap:3}}><Text numberOfLines={2} style={{fontFamily:font,fontSize:19,lineHeight:23,fontWeight:'700',color:V.ink}}>{gym.name}</Text><Label small bold color={gym.team?GYM_TEAMS[gym.team].color:undefined}>{npc?'🐾 Wilde wachters':gym.team?'Ploeg '+GYM_TEAMS[gym.team].name:'Vrije gym'}</Label><Label small>🛡️ {gym.defenders.length}/6 · {away(meters)}{gym.far?' · 🎟️':''}{gym.battling?' · ⚔️ bezig':''}</Label></View></View>}
  {tab==='raid'?<View style={{gap:10}}><RaidLobbyV2 {...{view,run,busy,now,onBattle}}/>{gymRaids.map(r=><RaidAtGymV2 key={r.id} raid={r} {...{view,run,busy,now,ensureGPS}}/>)}{!gymRaids.length&&!gym.far&&<FieldBossV2 player={p} post={gym.postId} {...{run,busy,now,ensureGPS,onBattle,fresh}} near={meters}/>}{!gymRaids.length&&<Label small center color={V.muted}>🥚 Nu geen raid hier</Label>}</View>
  :tab==='gym'?<Panel>
   {!!gym.defenders.length&&!gym.far&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{gym.defenders.map(d=><View key={d.id} style={{width:'31.5%',minHeight:92,borderRadius:15,padding:4,alignItems:'center',justifyContent:'center',gap:1,backgroundColor:d.me?'#3D6446':'#163E34',borderWidth:1,borderColor:d.me?'#ECD289':'#73967844'}}><SpriteView id={d.species} shiny={d.shiny} size={44}/><Label small bold>{d.cp} CP</Label><Label small>{d.npc?'🐾':d.me?'⭐ jij':d.name}</Label><View style={{flexDirection:'row'}}>{[1,2,3].map(n=><View key={n} style={{opacity:n<=d.hearts?1:.2}}><Glyph name="heart" size={13}/></View>)}</View></View>)}</View>}
   {gym.far&&!!gym.defenders.length&&<Label small center color={V.muted}>{npc?'🐾 Wilde wachters':'🛡️ '+gym.defenders.length+' bugs'} · 👀 ver weg</Label>}{gym.defenders.length<GYM_RULES.slots&&<View accessibilityLabel={(GYM_RULES.slots-gym.defenders.length)+' vrije plekken'} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4}}>{Array.from({length:GYM_RULES.slots-gym.defenders.length},(_,i)=><View key={i} style={{opacity:.55}}><Glyph name="shield" size={22}/></View>)}<Label small> vrij</Label></View>}
   {mine&&<View testID="gym-own-defender" style={{flexDirection:'row',justifyContent:'space-around'}}><Label bold>⏱ nog {hm(gymTimeLeft(mine.at,now))}</Label><Label bold>🪙 {gymCoins(mine.at,now)} / {GYM_RULES.maxCoins}</Label><Help title="Munten" icon="coin" body={COIN_HELP}/></View>}
   {won&&canPlace&&<Label bold center color="#F2D16E">🏆 Gewonnen! Zet nu je bug neer · ⏱ {mmss(won.until-now)}</Label>}
   {canPlace?<><Label bold>🛡️ Kies je bug</Label>{eligible.length?<BugPickV2 bugs={eligible} chosen={defender?[defender]:[]} onPick={setDefender} label="Verdedig met"/>:<Label small>Geen vrije bug (je buddy en bugs in gyms tellen niet).</Label>}
    {here||won?<Button icon="shield" disabled={busy||!chosen} onPress={()=>{if(!chosen)return;info.show({title:'Laat '+species(chosen.species).name+' achter?',icon:'shield',body:'⏱ Max. 8 uur · 🪙 1 munt per 10 min (max. '+GYM_RULES.maxCoins+'). Daarna, of als hij verslagen is, komt hij vanzelf terug met zijn munten.',action:{label:'🛡️ Zet neer',onPress:()=>{void act('gymDefend',{gym:gym.id,id:chosen.id},false).then(()=>info.hide());}}});}}>Zet bug neer</Button>
    :ticket?<Button icon="shield" accessibilityLabel="Zet bug neer op afstand" disabled={busy||!chosen} onPress={()=>{if(!chosen)return;info.show({title:'🎟️ Op afstand neerzetten?',icon:'shield',body:'Dit gebruikt je gym-op-afstand van vandaag (1× per dag). ⏱ Max. 8 uur · 🪙 max. '+GYM_RULES.maxCoins+' munten.',action:{label:'🎟️ Zet neer',onPress:()=>{void act('gymDefend',{gym:gym.id,id:chosen.id},true).then(()=>info.hide());}}});}}>🎟️ Zet neer op afstand</Button>:walk}</>
   :!mine&&<Label small center color={V.muted}>{!myTeam?'Kies eerst je ploeg bij 🛡️ Gym.':npc||fight?'⚔️ Win deze gym eerst bij Vechten.':gym.battling?'⚔️ Er wordt nu gevochten.':gym.defenders.length>=GYM_RULES.slots?'Deze gym is vol.':''}</Label>}
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Help title="Gyms" icon="shield" body={GYM_HELP}/>{here&&p.walking?.posts?.some(post=>post.id===gym.postId)&&<Button small secondary disabled={busy||(p.go!.sites?.visits[gym.postId]??0)+300000>now} icon="refresh" onPress={()=>void run('poiSpin',{poi:gym.postId})}>Draai gympost</Button>}</View>
  </Panel>
  :<Panel>{!myTeam?<Label small center>Kies eerst je ploeg bij 🛡️ Gym.</Label>:!fight?<Label bold center>{gym.battling?'⚔️ Er wordt nu gevochten.':'✅ Deze gym is van jouw ploeg. Zet een bug neer bij 🛡️ Gym.'}</Label>:gym.battling?<Label bold center>⚔️ Er wordt nu gevochten. Even wachten.</Label>
   :<><Label bold>⚔️ Jouw team · {attackIds.length} / 3 <Label small>👍 sterkste eerst</Label></Label><BugPickV2 bugs={free} chosen={attackIds} label="Aanvalsteam" onPick={id=>setAttack(ids=>ids.includes(id)?ids.filter(x=>x!==id):ids.length<3?[...ids,id]:[...ids.slice(1),id])}/>{issue&&<Label small color="#F3D6A4">{issue}</Label>}
    {here?<Button icon="swords" disabled={busy||!!issue} onPress={()=>void act('gymAttack',{gym:gym.id,ids:attackIds},false)}>Val aan</Button>
    :ticket?<Button icon="swords" accessibilityLabel="Vecht op afstand" disabled={busy||!!issue} onPress={()=>void act('gymAttack',{gym:gym.id,ids:attackIds},true)}>🎟️ Vecht op afstand (1× vandaag)</Button>:<>{walk}{!gym.far&&<Label small center color={V.muted}>🎟️ Op afstand: morgen weer</Label>}</>}</>}</Panel>}
  {!!problem&&<Label small color="#FFD9CF">{problem}</Label>}
 </View>;
}
