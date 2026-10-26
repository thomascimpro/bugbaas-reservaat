import React from 'react';
import {Pressable,View} from 'react-native';
import {species} from '../game/catalogV2';
import {publicGoJournal} from '../game/goJournalV2';
import type {GoJournalEntry} from '../game/goJournalV2';
import type {GameViewV2} from '../game/typesV2';
import {SpriteView} from './artV2';
import {Button,Glyph,Help,Label,Panel,V} from './uiV2';
import type {Glyph as GlyphName} from './uiV2';

const ACTION:Record<GoJournalEntry['kind'],{label:string;icon:GlyphName}>={
 catch:{label:'Gevangen',icon:'leaf'},autoMiss:{label:'Ontsnapt aan autovanger',icon:'leaf'},
 hatch:{label:'Cocon uitgekomen',icon:'heart'},battle:{label:'Duel',icon:'swords'},
 boss:{label:'Dagbaas',icon:'cup'},echo:{label:'Echo-arena',icon:'swords'},challenge:{label:'Dagstrijd',icon:'cup'},
 evolve:{label:'Geëvolueerd',icon:'star'},power:{label:'Power-up',icon:'attack'},
 trade:{label:'Geruild',icon:'friends'},transfer:{label:'Vrijgelaten',icon:'leaf'},
 move:{label:'Aanval geleerd',icon:'attack'},equip:{label:'Uitrusting aangepast',icon:'itemLeaf'},
};
const RESULT={win:'Gewonnen',loss:'Verloren',draw:'Gelijkspel'};
function details(e:GoJournalEntry){
 return [e.result?RESULT[e.result]:null,e.opponent?`tegen ${e.opponent}`:null,
  e.method==='auto'?'Autovanger':e.method==='ranked'?'Ranked':e.method==='casual'?'Vriendschappelijk':e.method==='training'?'Training':null,
  e.cp!==undefined?`CP ${e.cp}`:null,e.dust?`${e.dust>0?'+':''}${e.dust} stof`:null,e.xp?`+${e.xp} XP`:null].filter(Boolean).join(' · ');
}

/** Content for the existing profile modal's scroll container. */
export function GoJournalV2({view,open}:{view:GameViewV2;open?:(name:string,id?:string)=>void}){
 const entries=publicGoJournal(view.player.go?.journal);
 return <View style={{gap:12}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:9}}><Glyph name="book" size={32}/><View style={{flex:1}}><Label bold>Je laatste avonturen</Label><Label small color={V.muted}>{entries.length} / 50 activiteiten</Label></View><Help title="Je dagboek" body="Hier staan maximaal 50 recente, bevestigde activiteiten, met de nieuwste bovenaan. Het dagboek vult zich vanaf deze versie; eerdere avonturen worden niet achteraf ingevuld. Een nieuwe actie geeft hier geen extra beloning. Tik op een bug die nog in je collectie zit om het exemplaar te bekijken. Precieze locaties worden niet in je dagboek bewaard."/></View>
  {!entries.length?<Panel style={{alignItems:'center'}}><Glyph name="book" size={72}/><Label bold>Je eerste bladzijde wacht</Label><Label small center>Vang een bug, open een cocon of speel een duel. Je volgende avontuur verschijnt hier.</Label>{open&&<Button small icon="compass" onPress={()=>open('map')}>Naar de kaart</Button>}</Panel>:entries.map((e,i)=>{
   const at=new Date(e.at),previous=i?new Date(entries[i-1].at):null,showDay=!previous||at.toDateString()!==previous.toDateString(),action=ACTION[e.kind],owned=e.specimenId?view.player.specimens.find(s=>s.id===e.specimenId&&s.go):undefined,canOpen=!!owned&&!!open,description=details(e),name=e.species?species(e.species).name:action.label;
   return <View key={e.id} style={{gap:7}}>{showDay&&<Label small bold color={V.muted}>{at.toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'long'})}</Label>}<Pressable disabled={!canOpen} accessibilityRole={canOpen?'button':undefined} accessibilityLabel={canOpen?`Bekijk ${name} uit je dagboek`:undefined} onPress={()=>owned&&open?.('team',owned.id)} style={({pressed})=>({flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderColor:V.line,borderRadius:18,padding:10,backgroundColor:pressed?'#E1EBD4':'#FAFAF1'})}>
    <View style={{width:56,alignItems:'center'}}>{e.species?<SpriteView id={e.species} shiny={e.shiny} size={56}/>:<Glyph name={action.icon} size={38}/>}</View>
    <View style={{flex:1,minWidth:0,gap:2}}><View style={{flexDirection:'row',alignItems:'center',gap:5}}><View style={{flex:1,minWidth:0}}><Label bold>{name}{e.shiny?' ✦':''}</Label></View><Label small color={V.muted}>{at.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}</Label></View>{e.species&&<Label small>{action.label}{e.fromSpecies?` · ${species(e.fromSpecies).name} → ${name}`:''}</Label>}{!!description&&<Label small color={V.muted}>{description}</Label>}</View>{canOpen&&<Glyph name="next" size={22}/>}
   </Pressable></View>;
  })}
 </View>;
}
