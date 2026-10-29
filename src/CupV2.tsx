import React,{useMemo,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {CUP_CAP,CUP_REWARD,CUP_WIN_GOAL,cupBlock,cupSuggestion,cupTeamIssue,cupTheme,pvpView} from '../game/pvpV2';
import {stats} from '../game/goV2';
import {species} from '../game/catalogV2';
import type {GameViewV2} from '../game/typesV2';
import type {RunV2} from './ShopViewV2';
import {SpriteView} from './artV2';
import {GoTypeBadge,GoTypes} from './GoTypeV2';
import {Button,font,Glyph,Help,Label,Panel} from './uiV2';

/** Weekbeker: this week's types, three stars to the weekly prize, a ready 👍 team and one big start button. */
export function CupPanelV2({view,run,busy,now,open}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;open?:(name:string)=>void}){
 const p=view.player,theme=cupTheme(now),s=pvpView(p,now),suggested=useMemo(()=>cupSuggestion(p,now),[p.revision,theme.id]),[chosen,setChosen]=useState<string[]|null>(null),[edit,setEdit]=useState(false);
 const ids=(chosen??suggested).filter(id=>p.specimens.some(b=>b.id===id)),issue=cupTeamIssue(p,ids,now),bugs=p.specimens.filter(b=>b.go).map(b=>({b,why:cupBlock(p,b,now),cp:stats(b).cp})).sort((x,y)=>Number(!!x.why)-Number(!!y.why)||y.cp-x.cp),eligible=bugs.filter(x=>!x.why).length;
 const toggle=(id:string)=>{const cur=ids;if(cur.includes(id)){setChosen(cur.filter(x=>x!==id));return;}const bug=p.specimens.find(b=>b.id===id)!;if(cur.length>=3||cur.some(x=>p.specimens.find(b=>b.id===x)?.species===bug.species))return;setChosen([...cur,id]);};
 return <View style={{gap:12}}>
  <Panel style={{gap:10,alignItems:'center'}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:10,alignSelf:'stretch'}}><Text style={{fontSize:44}}>{theme.emoji}</Text><View style={{flex:1,gap:4}}><Text style={{fontFamily:font,fontSize:22,fontWeight:'900',color:'#FFF1CD'}}>{theme.name}</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:4}}>{theme.types.map(t=><GoTypeBadge key={t} type={t}/>)}<Label small>≤ {CUP_CAP} CP</Label></View></View><Help title="Weekbeker" body={'Elke week een ander thema. Alleen bugs met een van deze types mogen meedoen (👍), tot '+CUP_CAP+' CP. Win '+CUP_WIN_GOAL+' keer voor de weekprijs: ✨ '+CUP_REWARD.dust+' stof, 💿 TM en een zeldzame bug van dit thema. Maak je '+theme.name.replace('week','')+'-bugs sterker voor betere kansen!'}/></View>
   <View accessibilityLabel={Math.min(s.cupWins,CUP_WIN_GOAL)+' van '+CUP_WIN_GOAL+' bekerwinsten'} style={{flexDirection:'row',alignItems:'center',gap:8}}>{Array.from({length:CUP_WIN_GOAL},(_,i)=><Text key={i} style={{fontSize:34,opacity:i<s.cupWins?1:.25}}>⭐</Text>)}<Text style={{fontSize:30}}>→</Text>{s.cupClaimed?<Text style={{fontSize:34}}>✅</Text>:<View style={{flexDirection:'row',alignItems:'center',gap:4}}><Glyph name="nectar" size={26}/><Glyph name="burst" size={24}/><Text style={{fontSize:26}}>🐞</Text></View>}</View>
  </Panel>
  {eligible<3?<Panel style={{alignItems:'center',gap:8}}><Label bold center>Vang {theme.name.replace('week','').toLowerCase()}-bugs! {eligible}/3</Label><View style={{flexDirection:'row',gap:6}}>{theme.types.map(t=><GoTypeBadge key={t} type={t}/>)}</View>{open&&<Button small secondary icon="compass" onPress={()=>open('map')}>Ga vangen</Button>}</Panel>:<Panel style={{gap:10}}>
   <View style={{flexDirection:'row',gap:7}}>{[0,1,2].map(i=>{const b=p.specimens.find(x=>x.id===ids[i]);return <Pressable key={i} accessibilityRole="button" accessibilityLabel={b?'Bekerteam: '+species(b.species).name:'Leeg bekerslot'} onPress={()=>setEdit(true)} style={{flex:1,minHeight:96,alignItems:'center',justifyContent:'center',borderRadius:18,backgroundColor:'#214F42',borderWidth:2,borderColor:b?'#F2D16E88':'#FFFFFF22'}}>{b?<><SpriteView id={b.species} shiny={b.shiny} size={58}/><Label small bold>{stats(b).cp} CP</Label></>:<Glyph name="team" size={40}/>}</Pressable>;})}</View>
   <Button icon="cup" disabled={busy||!!issue} onPress={()=>void run('cupFight',{ids})}>{theme.emoji} Start beker</Button>
   <View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button small secondary disabled={busy} onPress={()=>{setChosen(null);setEdit(false);}}>👍 Beste team</Button></View><View style={{flex:1}}><Button small secondary icon="team" onPress={()=>setEdit(!edit)}>{edit?'Klaar':'Wijzig'}</Button></View></View>
   {issue&&ids.length===3&&<Label small color="#F0C69B">{issue}</Label>}
  </Panel>}
  {edit&&eligible>=3&&<Panel><View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{bugs.map(({b,why,cp})=>{const picked=ids.includes(b.id);return <Pressable key={b.id} testID={'cup-pick-'+b.id} accessibilityRole="button" accessibilityLabel={species(b.species).name+(why?' · mag niet mee':' · mag mee')} accessibilityState={{selected:picked,disabled:!!why}} disabled={!!why||busy} onPress={()=>toggle(b.id)} style={{width:84,alignItems:'center',padding:5,borderRadius:16,backgroundColor:picked?'#4E6B3A':'#214F42',borderWidth:2,borderColor:picked?'#F2D16E':'#FFFFFF22',opacity:why?.3:1}}>
   <SpriteView id={b.species} shiny={b.shiny} size={50}/><Label small bold>{cp} CP</Label><GoTypes species={b.species} compact/>
   <View style={{position:'absolute',top:3,right:3}}><Text style={{fontSize:14}}>{why==='type'?'🚫':why==='cp'?'⬆️':why==='gym'?'🏰':'👍'}</Text></View>
  </Pressable>;})}</View></Panel>}
 </View>;
}
