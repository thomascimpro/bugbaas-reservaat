import React,{useState} from 'react';
import {Modal,Pressable,ScrollView,Text,TextInput,useWindowDimensions,View} from 'react-native';
import {CHARGED,FAST,HELD,LEAGUES,movePool,stats,teamIssue} from '../game/goV2';
import type {League} from '../game/goV2';
import {effectiveness} from '../game/goBattleV2';
import type {PlayerV2} from '../game/typesV2';
import {species} from '../game/catalogV2';
import {collectionSearch} from '../game/collectionSearchV2';
import {SpriteView} from './artV2';
import type {RunV2} from './ShopViewV2';
import {Button,font,Glyph,Help,IconButton,Label,Title,useInfo,V,v} from './uiV2';
import {GO_TYPES,GoTypeBadge,GoTypes} from './GoTypeV2';
import type {Element} from '../game/goV2';
import {useGoBack} from './GoBackV2';

export function GoTeamPickerV2({player:p,run,busy,onClose,raid=false,title,onConfirm}:{player:PlayerV2;run:RunV2;busy:boolean;onClose:()=>void;raid?:boolean;title?:string;onConfirm?:(ids:string[])=>Promise<boolean>}){
 const g=p.go!,[chosen,setChosen]=useState(g.team),[league,setLeague]=useState<League>(raid?'master':g.league),[query,setQuery]=useState(''),info=useInfo(),compact=useWindowDimensions().height<740;
 useGoBack(true,()=>{onClose();return true;},40);
 const pool=p.specimens.filter(s=>s.go).sort((a,b)=>stats(b).cp-stats(a).cp),selected=chosen.map(id=>pool.find(s=>s.id===id)),issue=teamIssue(p,chosen,league,raid);
 const weaknesses=(Object.keys(GO_TYPES) as Element[]).map(type=>({type,count:selected.filter(s=>s&&effectiveness(type,movePool(s.species).types)>1).length})).filter(x=>x.count>=2).sort((a,b)=>b.count-a.count).slice(0,2);
 function select(id:string){
  const bug=pool.find(s=>s.id===id)!;
  if(chosen.includes(id)){setChosen(chosen.filter(x=>x!==id));return;}
  if(g.gyms?.deployed.some(d=>d.specimen===id))return;
  const reason=stats(bug).cp>LEAGUES[league].cap?'Deze bug zit boven de CP-limiet.':selected.some(s=>s?.species===bug.species)?'Er mag maar één bug van iedere soort in je team.':chosen.length===3?'Tik eerst een gekozen bug aan om die te verwijderen.':'';
  if(reason){info.show({title:species(bug.species).name,body:reason,icon:'team'});return;}
  setChosen([...chosen,id]);
 }
 function preset(slot:number,save=false){const saved=g.teamPresets?.[league]?.[slot];if(save||!saved){info.show({title:'Team '+(slot+1),body:issue??'Bewaar deze drie bugs in dit teamslot. Houd een gevuld slot vast om het te vervangen.',...(issue?{}:{action:{label:'Bewaar selectie',onPress:()=>{void run('teamPreset',{action:'save',league,slot,ids:chosen}).then(ok=>{if(ok)info.hide();});}}})});}else void run('teamPreset',{action:'load',league,slot}).then(ok=>{if(ok)setChosen([...saved]);});}
 return <Modal visible transparent animationType={p.settings.reducedMotion?'none':'slide'} onRequestClose={onClose}><View style={{flex:1,backgroundColor:'#092B28DD',justifyContent:'flex-end',alignItems:'center'}}><View style={{width:'100%',maxWidth:560,maxHeight:compact?'97%':'94%',padding:compact?12:16,borderTopLeftRadius:28,borderTopRightRadius:28,backgroundColor:V.paper,gap:compact?7:10}}>
  <View style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1}}><Title>{title??(raid?'Team voor kaartbaas':'Mijn team')}</Title></View><Help title="Team bouwen" body="Je startbug gaat als eerste het veld op. Kies drie verschillende soorten binnen de CP-limiet. Een snelle aanval met veel energie laadt je speciale aanvallen eerder; een zware snelle aanval geeft direct meer schade. Combineer verschillende aanvalstypes en voorkom dat alle drie dezelfde zwakte hebben. Held items tellen mee in CP. Een goed team wint niet automatisch: schilden, energie sparen en op tijd wisselen blijven belangrijk."/><IconButton name="close" label="Sluit teamkiezer" onPress={onClose}/></View>
  {!raid&&<View style={{flexDirection:'row',gap:6}}>{(Object.keys(LEAGUES) as League[]).map(k=><Pressable key={k} accessibilityRole="button" accessibilityLabel={LEAGUES[k].name} accessibilityState={{selected:league===k}} onPress={()=>setLeague(k)} style={{flex:1,minHeight:44,borderRadius:17,justifyContent:'center',alignItems:'center',backgroundColor:league===k?'#125D4D':'#284E40'}}><Text style={{fontFamily:font,fontWeight:'800',color:league===k?'#FFF1CD':V.ink}}>{Number.isFinite(LEAGUES[k].cap)?LEAGUES[k].cap+' CP':'Vrij'}</Text></Pressable>)}</View>}
  {!raid&&<View style={{flexDirection:'row',gap:6}}>{[0,1,2].map(slot=>{const saved=g.teamPresets?.[league]?.[slot];return <Pressable key={slot} accessibilityRole="button" accessibilityLabel={'Bewaard team '+(slot+1)} accessibilityHint="Tik om te gebruiken; houd vast om te bewaren" disabled={busy} onPress={()=>preset(slot)} onLongPress={()=>preset(slot,true)} style={{flex:1,minHeight:44,padding:6,borderRadius:13,backgroundColor:saved?'#386046':'#21443A',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5}}><Glyph name="team" size={20}/><Label small>Team {slot+1}</Label></Pressable>;})}</View>}
  <View style={{flexDirection:'row',gap:7}}>{[0,1,2].map(i=>{const s=selected[i];return <Pressable key={i} accessibilityRole="button" accessibilityLabel={s?(i===0?'Startbug ':'Zet vooraan ')+species(s.species).name:'Leeg teamslot '+(i+1)} onPress={()=>{if(s&&i>0)setChosen([s.id,...chosen.filter(id=>id!==s.id)]);}} style={{flex:1,minWidth:0,alignItems:'center',padding:7,gap:2,borderRadius:19,borderWidth:2,borderColor:i===0?'#C7A455':'#64856A',backgroundColor:i===0?'#496345':'#214F42'}}>
   <Label small bold>{i===0?'Start':i+1}</Label>{s?<><Pressable accessibilityRole="button" accessibilityLabel={'Verwijder '+species(s.species).name+' uit team'} disabled={busy} hitSlop={7} onPress={e=>{e.stopPropagation();setChosen(chosen.filter(id=>id!==s.id));}} style={{position:'absolute',right:3,top:3,padding:3}}><Glyph name="close" size={20}/></Pressable><SpriteView id={s.species} shiny={s.shiny} size={compact?42:61}/><Label small bold>{stats(s).cp} CP</Label>{!compact&&<Text numberOfLines={1} style={{fontFamily:font,fontSize:10,color:V.ink}}>{species(s.species).name}</Text>}</>:<View style={{height:96,justifyContent:'center'}}><Glyph name="team" size={42}/></View>}
  </Pressable>;})}</View>
  {!compact&&<Label small>Tik een reserve om die vooraan te zetten.</Label>}
  {weaknesses.length>0&&<View style={{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:6}}><Label small>Zwak:</Label>{weaknesses.map(w=><View key={w.type} style={v.row}><GoTypeBadge type={w.type}/><Label small>{w.count}/3</Label></View>)}</View>}
  <TextInput accessibilityLabel="Zoek teambug" placeholder="Naam of CP" autoCapitalize="none" value={query} onChangeText={setQuery} style={v.input}/>
  <ScrollView style={{flexShrink:1}} contentContainerStyle={{flexDirection:'row',flexWrap:'wrap',gap:7,paddingBottom:8}}>{pool.filter(collectionSearch(query,{buddy:p.buddy,team:chosen})).map(s=>{const picked=chosen.includes(s.id),over=stats(s).cp>LEAGUES[league].cap,deployed=g.gyms?.deployed.some(d=>d.specimen===s.id),fast=FAST[s.go!.fast];return <Pressable key={s.id} testID={'pick-'+s.id} accessibilityRole="button" accessibilityLabel={'Selecteer '+species(s.species).name+' '+stats(s).cp} accessibilityState={{selected:picked}} disabled={busy||deployed&&!picked} onPress={()=>select(s.id)} onLongPress={()=>info.show({title:species(s.species).name,icon:'attack',body:fast.name+': '+fast.power+' kracht, +'+fast.energy+' energie per '+fast.turns*.5+' s.\n'+s.go!.charged.map(m=>CHARGED[m].name+': '+CHARGED[m].power+' kracht / '+CHARGED[m].energy+' energie').join('\n')+(s.go!.item?'\n'+HELD[s.go!.item].name+': '+HELD[s.go!.item].hint:'')})} style={{width:'31.5%',minWidth:0,padding:6,gap:4,borderWidth:picked?2:1,borderColor:picked?'#E0C985':'#64856A66',borderRadius:19,alignItems:'center',backgroundColor:picked?'#3E674A':'#21483D',opacity:over||deployed?.45:1}}>
   <Label small bold>{deployed?'In gym':stats(s).cp+' CP'}</Label><SpriteView id={s.species} shiny={s.shiny} size={compact?52:65}/><Text numberOfLines={1} style={{fontFamily:font,fontSize:11,color:V.ink}}>{species(s.species).name}</Text><GoTypes species={s.species} compact/><View style={[v.row,{gap:2}]}><Glyph name="burst" size={17}/><Label small>+{fast.energy}</Label><Glyph name="clock" size={16}/><Label small>{fast.turns*.5}s</Label></View>{picked&&<View style={{position:'absolute',left:2,top:29}}><Glyph name="check" size={22}/></View>}{s.go!.item&&<View style={{position:'absolute',right:3,top:29}}><Glyph name={HELD[s.go!.item].icon} size={24}/></View>}
  </Pressable>;})}</ScrollView>
  {issue&&<Label small color="#F0C69B">{chosen.length<3?chosen.length+' / 3 · Kies drie verschillende soorten.':issue}</Label>}
  <Button small={compact} icon="check" disabled={busy||!!issue} onPress={()=>void (onConfirm?onConfirm(chosen):run('goTeam',{ids:chosen,league})).then(ok=>{if(ok)onClose();})}>{raid?'Start gevecht':'Bewaar team'}</Button>
 </View></View></Modal>;
}
