import React,{useRef,useState} from 'react';
import {FlatList,Pressable,Text,View} from 'react-native';
import {BUDDY_DAILY,BUDDY_KM,BUDDY_LEVELS,buddyActivities,buddyLevel} from '../game/buddyV2';
import type {GameViewV2} from '../game/typesV2';
import {species} from '../game/catalogV2';
import {family} from '../game/goV2';
import type {RunV2} from './ShopViewV2';
import BugStageV2 from './BugStageV2';
import {Scene,SpriteView} from './artV2';
import {CandyIconV2} from './CandyIconV2';
import {Button,Help,Label,Panel,font,useInfo} from './uiV2';

export function GoBuddyV2({view,run,busy,now=view.now}:{view:GameViewV2;run:RunV2;busy:boolean;now?:number}){
 const p=view.player,b=p.specimens.find(s=>s.id===p.buddy&&s.go),day=buddyActivities(p,now),lv=buddyLevel(b?.hearts??0),info=useInfo(),[choose,setChoose]=useState(!b),[petProgress,setPetProgress]=useState(0),[notice,setNotice]=useState(''),petting=useRef<{at:number;x:number;y:number;travel:number;moves:number}|null>(null),sending=useRef(false);
 const walked=Math.max(0,(p.field?.walk?.meters??0)-(p.go?.buddyMeters??0))%BUDDY_KM,fruit=p.field?.inventory.fruit??0,canPet=!!b&&!busy&&day.pet<BUDDY_DAILY.pet;
 const claimPet=async()=>{if(!canPet||sending.current)return;sending.current=true;try{const ok=await run('buddyPlay',{kind:'pet'},setNotice);if(ok){setPetProgress(1);setNotice('♥');}}finally{sending.current=false;petting.current=null;}};
 const available=p.specimens.filter(s=>s.go&&(s.id===p.buddy||!p.go?.gyms?.deployed.some(d=>d.specimen===s.id)));
 const activity=(id:string,emoji:string,name:string,done:number,max:number,body:string)=><Pressable key={id} accessibilityRole="button" accessibilityLabel={name+' '+Math.min(done,max)+' van '+max} onPress={()=>info.show({title:name,body})} style={{flex:1,minWidth:0,minHeight:74,alignItems:'center',justifyContent:'center',gap:3,borderRadius:16,backgroundColor:done>=max?'#192E2B':'#16473F',borderWidth:1,borderColor:done>=max?'#69878044':'#BFF3EC47'}}><Text style={{fontSize:21,opacity:done>=max?.45:1}}>{done>=max?'✓':emoji}</Text><Text style={{fontFamily:font,fontSize:11,color:done>=max?'#8DABA2':'#EAF6F2'}}>{name}</Text><Text style={{fontFamily:font,fontSize:11,color:done>=max?'#8DABA2':'#F2C14E'}}>{Math.min(done,max)}/{max}</Text></Pressable>;
 return <View testID="buddy-page" style={{gap:12}}>
  {b&&<>
   <View style={{height:220,borderRadius:24,overflow:'hidden',alignItems:'center',justifyContent:'flex-end',paddingBottom:10}}>
    <Scene index={species(b.species).habitat}/><BugStageV2 id={b.species} shiny={b.shiny}/>
    <View testID="buddy-petting" accessibilityLabel="Aai je buddy: veeg twee seconden heen en weer" accessibilityActions={canPet?[{name:'longpress',label:'Buddy aaien'}]:[]} onAccessibilityAction={e=>{if(e.nativeEvent.actionName==='longpress')void claimPet();}} onStartShouldSetResponder={()=>canPet} onMoveShouldSetResponder={()=>canPet} onResponderTerminationRequest={()=>false} onResponderGrant={e=>{petting.current={at:Date.now(),x:e.nativeEvent.locationX,y:e.nativeEvent.locationY,travel:0,moves:0};setNotice('');}} onResponderMove={e=>{const g=petting.current;if(!g||!canPet)return;const x=e.nativeEvent.locationX,y=e.nativeEvent.locationY;if(!Number.isFinite(x)||!Number.isFinite(y))return;g.travel+=Math.hypot(x-g.x,y-g.y);g.x=x;g.y=y;g.moves++;const elapsed=Date.now()-g.at;setPetProgress(Math.min(.99,elapsed/2000,g.travel/80));if(elapsed>=2000&&g.travel>=80&&g.moves>=4)void claimPet();}} onResponderRelease={()=>{petting.current=null;if(!sending.current)setPetProgress(0);}} onResponderTerminate={()=>{petting.current=null;setPetProgress(0);}} style={{position:'absolute',inset:0,...({touchAction:'none'} as any)}}/>
    <View pointerEvents="none" style={{alignItems:'center',gap:4,paddingHorizontal:14,paddingVertical:5,borderRadius:16,backgroundColor:'#0E2828DE'}}><Label bold>{species(b.species).name}</Label><Label small>{day.pet>=BUDDY_DAILY.pet?'Vandaag geaaid ✓':petProgress?'♥ '+Math.round(petProgress*100)+'%':'Veeg om te aaien'}</Label></View>
   </View>
   <View style={{flexDirection:'row',gap:6}}>
    {activity('walk','👟','Lopen',day.walk,BUDDY_DAILY.walkHearts,'Elke geverifieerde kilometer geeft één hart, tot tien per dag. Nectar blijft per kilometer komen.')}
    {activity('pet','🤚','Aaien',day.pet,BUDDY_DAILY.pet,'Veeg twee seconden over je buddy. Eén hart per dag; extra tikken geven niets.')}
    {activity('feed','🍓','Voeren',day.feed,BUDDY_DAILY.feed,'Voer één bosframboos wanneer je buddy honger heeft. Na drie uur kan dat opnieuw, tot drie keer per dag.')}
    {activity('play','🎮','Samen',day.play,BUDDY_DAILY.play,'Speel een geldige Arcade-ronde of een gevecht met je buddy in je squad. Eén hart per dag; ook een goed gespeelde nederlaag telt.')}
   </View>
   <Panel><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Label bold>{lv.emoji+' '+lv.name}</Label><Help title="Buddyvoordelen" body={BUDDY_LEVELS.map(l=>l.emoji+' '+l.name+': '+l.perk).join('\n')}/></View><View accessibilityRole="progressbar" accessibilityLabel="Buddyvriendschap" accessibilityValue={{min:0,max:lv.next??150,now:Math.min(b.hearts??0,lv.next??150)}} style={{height:7,borderRadius:4,backgroundColor:'#FFFFFF18',overflow:'hidden'}}><View style={{height:7,width:`${lv.progress*100}%`,backgroundColor:'#EC86A6'}}/></View><Label small>{'♥ '+b.hearts+(lv.next?' / '+lv.next:'')}</Label>
    <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text style={{fontSize:21}}>👟</Text><View style={{flex:1,gap:4}}><Label small>{(walked/1000).toLocaleString('nl-NL',{maximumFractionDigits:2})+' / 1 km'}</Label><View style={{height:5,backgroundColor:'#FFFFFF18',borderRadius:3,overflow:'hidden'}}><View style={{height:5,width:`${walked/BUDDY_KM*100}%`,backgroundColor:'#1FC3D3'}}/></View></View><CandyIconV2 family={family(b.species)} size={22}/><Label small>+{lv.level>=4?2:1}</Label></View>
    <Button icon="leaf" disabled={busy||day.feed>=BUDDY_DAILY.feed||day.feedWaitMs>0||fruit<1} onPress={()=>void run('buddyPlay',{kind:'feed'},setNotice)}>{day.feed>=BUDDY_DAILY.feed?'Vandaag vol ✓':day.feedWaitMs>0?'🍓 Over '+Math.ceil(day.feedWaitMs/60000)+' min':fruit?'🍓 Voeren · 1':'🍓 Geen bosframboos'}</Button>
    {!!notice&&<Label small center>{notice}</Label>}
   </Panel>
  </>}
  <Button small secondary icon="heart" onPress={()=>setChoose(v=>!v)}>{b?'Ander maatje':'Kies je buddy'}</Button>
  {choose&&<FlatList horizontal data={available} keyExtractor={s=>s.id} initialNumToRender={6} windowSize={3} showsHorizontalScrollIndicator={false} renderItem={({item:s})=><Pressable accessibilityRole="button" accessibilityLabel={'Buddy '+species(s.species).name} accessibilityState={{selected:s.id===p.buddy,disabled:busy}} disabled={busy||s.id===p.buddy} onPress={()=>void run('buddy',{id:s.id}).then(ok=>{if(ok){setChoose(false);setPetProgress(0);setNotice('');}})} style={{marginRight:8,padding:5,borderRadius:16,borderWidth:1,borderColor:s.id===p.buddy?'#6BEFF2':'#BFF3EC47'}}><SpriteView id={s.species} shiny={s.shiny} size={66}/></Pressable>}/>}
 </View>;
}
