import {RarityBadgeV2} from './RarityBadgeV2';
import {BugStrengthV2} from './BugStrengthV2';
import {bestOfSpecies} from '../game/bugAdviceV2';
import {bugRarity,RARITY_TIERS} from '../game/rarityDisplayV2';
import {familyName} from './resourceGainV2';
import {CandyIconV2} from './CandyIconV2';
import {TransferHelperV2} from './TransferHelperV2';

import BugStageV2 from './BugStageV2';
import {CollectionArtV2} from './CollectionArtV2';

import {CollectionEvolutionV2,CollectionStatsV2} from './CollectionPresentationV2';

import {CPArcV2} from './TrainerV2';

import {DEX_SPECIES,dexNumber,dexStatus,EVOLUTIONS,usesSharedEvolutionModel,evolutionLine} from '../game/dexV2';

import {collectionSearch,COLLECTION_SEARCH_HELP,powerUpLeagueWarning} from '../game/collectionSearchV2';

import {useGoBack} from './GoBackV2';

import {ShinyBackdropV2,ShinyMarkV2} from './WorldEffectsV2';

import React,{useEffect,useRef,useState} from 'react';

import {Platform,Pressable,ScrollView,Share,Text,TextInput,View} from 'react-native';

import type {GameViewV2} from '../game/typesV2';

import {SPECIES,species} from '../game/catalogV2';

import {FAST,CHARGED,HELD,appraisal,stats,powerCost,secondCost,family,movePool,buddyDistance} from '../game/goV2';

import type {Held} from '../game/goV2';

import {GoTypeBadge,GoTypeHelp,GoTypes} from './GoTypeV2';

import {WALK_MODELS} from '../game/walkingV2';

import type {RunV2} from './ShopViewV2';

import {SpriteView,Scene} from './artV2';

import {Button,Counter,Glyph,Help,IconButton,Label,Panel,Title,V,v,useInfo} from './uiV2';

export function GoCollectionV2({view,run,busy,initialSpecimenId,open,onSelectionChange}:{view:GameViewV2;run:RunV2;busy:boolean;initialSpecimenId?:string;open?:(name:string)=>void;onSelectionChange?:(selected:boolean)=>void}){

 const scroll=useRef<ScrollView>(null),previousOrder=useRef<string[]>([]);

 const p=view.player,g=p.go!,[selected,setSelected]=useState(()=>p.specimens.some(s=>s.id===initialSpecimenId&&s.go)?initialSpecimenId!:''),[query,setQuery]=useState(''),[sort,setSort]=useState<'cp'|'recent'|'shiny'>('cp'),[favoriteOnly,setFavoriteOnly]=useState(false),[perfectOnly,setPerfectOnly]=useState(false),[filters,setFilters]=useState(false),[multi,setMulti]=useState(false),[selection,setSelection]=useState<string[]>([]),[details,setDetails]=useState<'iv'|'items'|'moves'|'evolve'|null>(null),info=useInfo();

 const [gridWidth,setGridWidth]=useState(280),[options,setOptions]=useState(false),[helper,setHelper]=useState(false);

 useEffect(()=>{onSelectionChange?.(!!selected);setOptions(false);return()=>onSelectionChange?.(false);},[selected,onSelectionChange]);

 const [renaming,setRenaming]=useState(false),[nickname,setNickname]=useState(''),[powerSteps,setPowerSteps]=useState(1);

 const matches=collectionSearch(query,{buddy:p.buddy,team:g.team}),bugs=p.specimens.filter(s=>matches(s)&&(sort!=='shiny'||s.shiny)&&(!favoriteOnly||s.favorite)&&(!perfectOnly||appraisal(s)===4)).sort((a,b)=>(sort==='recent'?b.obtainedAt-a.obtainedAt:stats(b).cp-stats(a).cp)||a.id.localeCompare(b.id)),s=p.specimens.find(s=>s.id===selected&&s.go),st=s?stats(s):null,key=s?family(s.species):'',evo=s?EVOLUTIONS[s.species]:undefined,maxPowerSteps=s?Math.min(10,Math.max(0,Math.round((50-s.go!.level)*2))):0,steps=Math.min(powerSteps,Math.max(1,maxPowerSteps)),cost=s?powerCost(s.go!.level,steps):null,second=s?secondCost(s.species):{dust:0,candy:0},nextStats=s&&cost?stats(s,{...s.go!,level:s.go!.level+steps*.5}):st,nextCP=nextStats?.cp??0;

 const bugIds=bugs.map(b=>b.id),orderKey=JSON.stringify(bugIds),selectedIndex=bugIds.indexOf(selected),previousId=selectedIndex>0?bugIds[selectedIndex-1]:undefined,nextId=selectedIndex>=0?bugIds[selectedIndex+1]:bugIds[0],trimmedNickname=nickname.trim(),validNickname=Array.from(trimmedNickname).length<=18&&/^[\p{L}\p{N} _'-]*$/u.test(trimmedNickname);

 const maxStats=s?stats(s,{...s.go!,level:50}):null;
 const bestIds=bestOfSpecies(p.specimens);

 // Consume a navigation ID only when it changes; refreshed player data must not reopen a closed detail.

 useEffect(()=>{setSelected(p.specimens.some(s=>s.id===initialSpecimenId&&s.go)?initialSpecimenId!:'');setDetails(null);},[initialSpecimenId]);

 useEffect(()=>{if(selected&&!s){const old=previousOrder.current,index=old.indexOf(selected),replacement=[...old.slice(index+1),...old.slice(0,index).reverse()].find(id=>bugIds.includes(id))??bugIds[0]??'';setSelected(current=>current===selected?replacement:current);setDetails(null);}previousOrder.current=bugIds;},[selected,s?.id,orderKey]);

 useEffect(()=>{setRenaming(false);setNickname('');setPowerSteps(1);},[selected]);

 useEffect(()=>{if(selected)scroll.current?.scrollTo({y:0,animated:false});},[selected,s?.species]);

 useEffect(()=>{if(details==='iv')requestAnimationFrame(()=>scroll.current?.scrollToEnd({animated:true}));},[details]);

 const searchTerms=query.toLowerCase().split('&').map(t=>t.trim()).filter(Boolean),filtered=!!query.trim()||favoriteOnly||perfectOnly||sort==='shiny',resetFilters=()=>{setQuery('');setFavoriteOnly(false);setPerfectOnly(false);setSort('cp');};

 const toggleSearch=(term:string)=>setQuery(searchTerms.includes(term)?searchTerms.filter(t=>t!==term).join('&'):[...searchTerms,term].join('&'));

 useGoBack(!!s,()=>{if(options)setOptions(false);else if(renaming)setRenaming(false);else if(details)setDetails(null);else setSelected('');return true;});

 const protectedBug=(b:typeof p.specimens[number])=>b.favorite||b.shiny||b.id===p.buddy||g.team.includes(b.id)||!!g.gyms?.deployed.some(d=>d.specimen===b.id);

 const releaseMany=()=>info.show({title:selection.length+' bugs vrijlaten?',icon:'leaf',body:'Je krijgt '+selection.length+' nectar. Favorieten, shinies, buddy en team zijn beschermd. Vrijlaten is definitief.',action:{label:'Laat '+selection.length+' vrij',onPress:()=>{void run('goTransferMany',{ids:selection}).then(ok=>{if(ok){setSelection([]);setMulti(false);info.hide();}});}}});

 const action=(type:string,params:Record<string,unknown>={})=>{if(g.gyms?.deployed.some(d=>d.specimen===s?.id)&&['goPower','goSecond','goTM','goEquip','goEvolve'].includes(type)){info.show({title:'Gymverdediger',icon:'shield',body:'Je bug komt terug na een nederlaag of na 12 uur. Daarna kun je deze weer verbeteren of inzetten.'});return;}void run(type,{id:s?.id,...params});};

 const navigate=(id:string)=>{setSelected(id);setDetails(null);};

 const saveNickname=()=>{if(!s||!validNickname)return;const id=s.id;info.show({title:trimmedNickname?'Bijnaam bewaren?':'Bijnaam verwijderen?',icon:'info',body:trimmedNickname?species(s.species).name+' heet voortaan '+trimmedNickname+'.':'Deze bug heet weer '+species(s.species).name+'.',action:{label:trimmedNickname?'Bewaar bijnaam':'Verwijder bijnaam',onPress:()=>{void run('goRename',{id,name:trimmedNickname}).then(ok=>{if(ok){setRenaming(false);info.hide();}});}}});};

 const changeMove=(slot:'fast'|number)=>{if(!s)return;const pool=movePool(s.species),options=slot==='fast'?pool.fast.filter(m=>m!==s.go!.fast).map(m=>FAST[m].name):pool.charged.filter(m=>!s.go!.charged.includes(m)).map(m=>CHARGED[m].name);info.show({title:'Andere aanval?',icon:'attack',body:'Dit kost 1 '+(slot==='fast'?'snelle':'opgeladen')+' TM. De server kiest willekeurig: '+options.join(' of ')+'. De huidige aanval wordt vervangen.',action:{label:'Gebruik TM',onPress:()=>{void run('goTM',{id:s.id,slot}).then(ok=>{if(ok)info.hide();});}}});};



 return <View style={{flex:1}}><ScrollView ref={scroll} style={{marginBottom:s?74:0}} testID={s?'go-detail-'+s.id:'go-collection-list'} contentContainerStyle={{padding:15,paddingTop:s?12:22,gap:12,paddingBottom:100}}>

  {!s&&<><View style={[v.row,{justifyContent:'space-between'}]}><Title>Bugs</Title><GoTypeHelp/></View>{open&&<View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button small onPress={()=>{}}>BUGS</Button></View><View style={{flex:1}}><Button small secondary onPress={()=>open('cocoons')}>COCONS</Button></View></View>}</>}

  {s&&st?<>

  {renaming&&<Panel><TextInput placeholderTextColor="#B7CAB6" selectionColor="#A5CE87" accessibilityLabel="Bijnaam" placeholder={species(s.species).name} autoCapitalize="words" autoCorrect={false} value={nickname} editable={!busy} onChangeText={setNickname} onSubmitEditing={()=>{if(!busy&&trimmedNickname!==(s.nickname??''))saveNickname();}} style={v.input}/><Label small color={validNickname?V.muted:V.red}>{validNickname?'Max. 18 tekens · leeg = soortnaam':'Gebruik max. 18 letters, cijfers, spaties, _ - of apostrof.'}</Label><View style={[v.row,{flexWrap:'wrap'}]}><Button small disabled={busy||!validNickname||trimmedNickname===(s.nickname??'')} onPress={saveNickname}>Bewaren</Button><Button small secondary disabled={busy} onPress={()=>setRenaming(false)}>Annuleren</Button></View></Panel>}

  <Panel style={{padding:12,gap:13}}>

   <View style={{height:240,alignItems:'center',justifyContent:'center',borderRadius:23,overflow:'hidden',backgroundColor:'#1E5144'}}><View pointerEvents="none" style={{position:'absolute',inset:0,opacity:.45}}><Scene index={species(s.species).habitat}/></View>{s.shiny&&<ShinyBackdropV2/>}<View style={{position:'absolute',top:12,paddingHorizontal:15,paddingVertical:6,borderRadius:18,backgroundColor:'#113F36E6'}}><Text style={{fontSize:26,fontWeight:'800',color:'#FFFDEB',letterSpacing:.5}}><Text style={{fontSize:13,fontWeight:'600'}}>CP </Text>{st.cp}</Text></View><View style={{width:220,height:210,marginTop:32,alignItems:'center',justifyContent:'center'}}><CollectionArtV2 key={s.id} id={s.species} shiny={s.shiny} size={205}/></View><CPArcV2 level={s.go!.level}/><View style={{position:'absolute',left:4,top:104}}><IconButton name="back" label="Vorige bug" onPress={()=>{if(!busy&&previousId)navigate(previousId);}}/></View><View style={{position:'absolute',right:4,top:104}}><IconButton name="next" label="Volgende bug" onPress={()=>{if(!busy&&nextId)navigate(nextId);}}/></View><View style={{position:'absolute',right:12,bottom:9,paddingHorizontal:7,paddingVertical:2,borderRadius:10,backgroundColor:'#113F36E6'}}><Label small color="white">{selectedIndex>=0?(selectedIndex+1)+' / '+bugs.length:'—'}</Label></View>{g.gyms?.deployed.some(d=>d.specimen===s.id)&&<View style={{position:'absolute',left:10,top:10}}><Counter icon="shield" value="Gym" label="Verdedigt een gym" hint="Komt terug na een nederlaag of na 12 uur, met verdiende coins."/></View>}<View style={{position:'absolute',left:12,bottom:9,paddingHorizontal:7,paddingVertical:2,borderRadius:10,backgroundColor:'#113F36E6'}}><Label small color="white">Lv. {s.go!.level}</Label></View><View style={{position:'absolute',right:10,top:10}}><IconButton name="star" label="Favoriet" active={s.favorite} onPress={()=>action('favorite')}/></View></View>

   <View style={{alignItems:'center',gap:4}}><Pressable accessibilityRole="button" accessibilityLabel="Bijnaam wijzigen" disabled={busy} onPress={()=>{setNickname(s.nickname??'');setRenaming(!renaming);}} style={{minHeight:44,alignItems:'center',justifyContent:'center',paddingHorizontal:8}}><Title>{s.nickname||species(s.species).name}</Title>{s.nickname&&<Label small color={V.muted}>{species(s.species).name}</Label>}</Pressable></View>

   <View style={{gap:5,alignItems:'center'}}><View accessibilityRole="progressbar" accessibilityLabel="HP buiten gevecht" accessibilityValue={{min:0,max:st.hp,now:st.hp}} aria-valuemin={0} aria-valuemax={st.hp} aria-valuenow={st.hp} style={{width:'68%',height:8,borderRadius:5,backgroundColor:'#102F2A',overflow:'hidden'}}><View style={{width:'100%',height:8,backgroundColor:'#8ECC9B'}}/></View><Label small bold>{st.hp} / {st.hp} HP</Label></View>

   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,flexWrap:'wrap'}}><GoTypes species={s.species}/><RarityBadgeV2 species={s.species}/></View><BugStrengthV2 player={p} bug={s} nextCp={cost?nextCP:undefined} onDetails={()=>setDetails(details==='iv'?null:'iv')}/>

   





   <View testID="bug-resources" accessibilityLabel={g.dust+' stof, '+(g.candy[key]??0)+' '+familyName(key)+'-nectar'+((g.xl[key]??0)>0?', '+g.xl[key]+' XL-nectar':'')} style={{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:12}}><View style={{flexDirection:'row',alignItems:'center',gap:3}}><Glyph name="nectar" size={22}/><Label small bold>{g.dust.toLocaleString('nl-NL')}</Label></View><View style={{flexDirection:'row',alignItems:'center',gap:3}}><CandyIconV2 family={key}/><Label small bold>{g.candy[key]??0}</Label></View>{(g.xl[key]??0)>0&&<View style={{flexDirection:'row',alignItems:'center',gap:3}}><CandyIconV2 family={key} xl/><Label small bold>{g.xl[key]}</Label></View>}</View><View testID="power-block" style={{flexDirection:'row',gap:8,paddingTop:6,borderTopWidth:1,borderColor:'#66836C66'}}><View style={{flex:1,gap:5}}><Button icon="power" disabled={busy||!cost||g.dust<cost.dust||(g.candy[key]??0)<cost.candy||(g.xl[key]??0)<cost.xl} accessibilityLabel="Sterker maken" onPress={()=>info.show({title:'Sterker maken',icon:'power',body:'CP '+st.cp+' → '+nextCP+' · HP '+st.hp+' → '+nextStats!.hp+'\n'+cost!.dust+' ✨ Stof · '+cost!.candy+' '+familyName(key)+'-nectar'+(cost!.xl?' · '+cost!.xl+' XL-nectar':'')+'.'+(powerUpLeagueWarning(st.cp,nextCP)?'\n\n'+powerUpLeagueWarning(st.cp,nextCP):''),action:{label:'Sterker maken',onPress:()=>{void run('goPower',{id:s.id,steps}).then(ok=>{if(ok)info.hide();});}}})}>{cost?'Sterker':'Max!'}</Button>{cost&&<View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:6,flexWrap:'wrap'}}><Cost art={<Glyph name="nectar" size={18}/>} need={cost.dust} have={g.dust} label="✨ Stof"/><Cost art={<CandyIconV2 family={key} size={20}/>} need={cost.candy} have={g.candy[key]??0} label={familyName(key)+'-nectar'}/>{cost.xl>0&&<Cost art={<CandyIconV2 family={key} size={20} xl/>} need={cost.xl} have={g.xl[key]??0} label="XL-nectar"/>}</View>}{cost&&maxPowerSteps>1&&<View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:6}}><Pressable accessibilityRole="button" accessibilityLabel="Minder power-ups" disabled={busy||steps<=1} onPress={()=>setPowerSteps(steps-1)} style={{width:30,height:30,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:'#214F45',opacity:steps<=1?.4:1}}><Label bold>−</Label></Pressable><Label small bold>{steps+'×'}</Label><Pressable accessibilityRole="button" accessibilityLabel="Meer power-ups" disabled={busy||steps>=maxPowerSteps} onPress={()=>setPowerSteps(steps+1)} style={{width:30,height:30,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:'#214F45',opacity:steps>=maxPowerSteps?.4:1}}><Label bold>+</Label></Pressable></View>}</View>{evo&&<View style={{flex:1,gap:5}}><Button secondary icon="power" disabled={busy} onPress={()=>setDetails(details==='evolve'?null:'evolve')}>{((g.candy[key]??0)>=evo.candy?'👍 ':'')+'Evolueer'}</Button><View style={{flexDirection:'row',justifyContent:'center'}}><Cost art={<CandyIconV2 family={key} size={20}/>} need={evo.candy} have={g.candy[key]??0} label={familyName(key)+'-nectar'}/></View></View>}</View>

   <View style={{flexDirection:'row',justifyContent:'space-around'}}><View style={{alignItems:'center',gap:3}}><IconButton name="attack" label="Aanvallen" active={details==='moves'} onPress={()=>setDetails(details==='moves'?null:'moves')}/><Label small>Aanvallen</Label></View><View style={{alignItems:'center',gap:3}}><IconButton name="bag" label="Held item" active={details==='items'} onPress={()=>setDetails(details==='items'?null:'items')}/><Label small>Item</Label></View><View style={{alignItems:'center',gap:3}}><IconButton name="heart" label="Als buddy" active={p.buddy===s.id} hint={p.buddy===s.id?'Dit is al je buddy. Je afstand blijft behouden.':'Kies deze bug als buddy.'} onPress={()=>{if(p.buddy!==s.id)action('buddy');}}/><Label small>Buddy</Label></View></View>

  </Panel>





  {details==='iv'&&<Panel><CollectionStatsV2 onPress={()=>setDetails(details==='iv'?null:'iv')} values={[{label:'Aanval',value:st.attack,max:maxStats!.attack,color:'#E7AF73'},{label:'Verdediging',value:st.defense,max:maxStats!.defense,color:'#9FBCDD'},{label:'HP',value:st.hp,max:maxStats!.hp,color:'#9DCF9C'}]}/><View style={[v.row,{justifyContent:'space-between'}]}><Label bold>{appraisal(s)===4?'Perfect':appraisal(s)+' ★'} · {Math.round(s.go!.iv.reduce((a,b)=>a+b,0)/45*100)}%</Label><Help title="Stats en IV" body="Aanval geeft meer schade. Verdediging en HP helpen je langer vol te houden. IV is de vaste aanleg van je bug. Sterker maken verhoogt het level; IV blijft hetzelfde. Je item en het type tellen ook mee."/></View>{s.go!.iv.map((n,i)=><View key={i} style={{gap:4}}><View style={[v.row,{justifyContent:'space-between'}]}><Label small>{['Aanval','Verdediging','HP'][i]}</Label><Label small bold>{n}/15</Label></View><View accessibilityRole="progressbar" accessibilityLabel={['Aanval','Verdediging','HP'][i]+' IV'} accessibilityValue={{min:0,max:15,now:n}} aria-valuemin={0} aria-valuemax={15} aria-valuenow={n} style={{height:11,borderRadius:6,overflow:'hidden',backgroundColor:'#102F2A'}}><View style={{height:11,width:`${n/15*100}%`,backgroundColor:n===15?'#E4AF8D':'#E0BB69'}}/></View></View>)}</Panel>}

  {details==='moves'&&<Panel><View style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1,gap:5}}><Label small color={V.muted}>Snelle aanval</Label><Label bold>{FAST[s.go!.fast].name}</Label><GoTypeBadge type={FAST[s.go!.fast].type}/><View style={[v.row,{flexWrap:'wrap',gap:6}]}><Counter icon="attack" value={FAST[s.go!.fast].power} label="Kracht snelle aanval" hint="De echte schade hangt ook af van aanval, verdediging en types."/><Counter icon="burst" value={'+'+FAST[s.go!.fast].energy} label="Energie per snelle aanval"/><Label small>{FAST[s.go!.fast].turns*.5}s</Label></View></View><Button small secondary disabled={busy||g.fastTMs<1} accessibilityLabel="Wijzig snelle aanval" onPress={()=>changeMove('fast')}>TM · {g.fastTMs}</Button></View>{s.go!.charged.map((move,i)=><View key={i} style={[v.row,{justifyContent:'space-between'}]}><View style={{flex:1,gap:4}}><Label small color={V.muted}>Opgeladen aanval</Label><Label bold>{CHARGED[move].name}</Label><GoTypeBadge type={CHARGED[move].type}/><View style={[v.row,{flexWrap:'wrap',gap:6}]}><Counter icon="attack" value={CHARGED[move].power} label="Kracht opgeladen aanval"/><Counter icon="burst" value={'−'+CHARGED[move].energy} label="Energiekosten" hint="Snelle aanvallen vullen energie. Dit aantal is nodig om deze aanval te gebruiken."/></View></View><Button small secondary disabled={busy||g.chargedTMs<1} accessibilityLabel={'Wijzig opgeladen aanval '+(i+1)} onPress={()=>changeMove(i)}>TM · {g.chargedTMs}</Button></View>)}{s.go!.charged.length===1&&<Button small icon="power" disabled={busy||g.dust<second.dust||(g.candy[key]??0)<second.candy} onPress={()=>info.show({title:'Tweede aanval',icon:'burst',body:second.dust.toLocaleString('nl-NL')+' ✨ Stof en '+second.candy+' '+familyName(key)+'-nectar. Je huidige aanval blijft behouden; je krijgt één andere legale opgeladen aanval. Beide gebruiken dezelfde energievoorraad.',action:{label:'Ontgrendel aanval',onPress:()=>{void run('goSecond',{id:s.id}).then(ok=>{if(ok)info.hide();});}}})}>Nieuwe aanval · {second.dust.toLocaleString('nl-NL')} / {second.candy}</Button>}<Help title="Aanvallen" body="Een snelle aanval geeft schade én energie. Meer kracht geeft meer schade; meer energie laadt speciale aanvallen eerder. Een tweede opgeladen aanval geeft extra dekking of een goedkopere aanval om een schild uit te lokken. Een TM vervangt willekeurig een aanval en wordt verbruikt. Je krijgt TMs via onderzoek, trainerlevels, dagbazen en het eerste Ranked-duel van de dag. Nachtvlinders kunnen Zonnegloed leren tegen Insect/Staal; pas op voor Steen."/></Panel>}

  {details==='items'&&<Panel><View style={[v.row,{justifyContent:'space-between'}]}><Label bold>Held item</Label><Help title="Held items" body={'Eén item per bug. Een uitgerust item gebruikt één eigen kopie en telt mee in stats en CP. Kaartvangst: 1/25 op een item, dus 1/'+(25*Object.keys(HELD).length)+' per itemsoort. Je eerste cocon helpt je aan uitrusting. Ook de Meester-dagbaas kan een item geven. Wisselen en afdoen is gratis.'}/></View><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{Object.entries(HELD).map(([id,h])=>{const item=id as Held,active=s.go!.item===item,free=Math.max(0,g.items[item]-p.specimens.filter(b=>b.go?.item===item).length),preview=stats(s,{...s.go!,item}),available=active||free>0;return <Pressable key={id} accessibilityRole="button" accessibilityLabel={'Rust '+h.name+' uit'} accessibilityState={{selected:active}} disabled={busy} onPress={()=>info.show({title:h.name,icon:h.icon,body:h.hint+' · CP '+st.cp+' → '+preview.cp+' · HP '+st.hp+' → '+preview.hp+'.'+(powerUpLeagueWarning(st.cp,preview.cp)?'\n'+powerUpLeagueWarning(st.cp,preview.cp):'')+'\n'+(active?'Dit item is uitgerust.':free>0?free+' vrij beschikbaar.':g.items[item]>0?'Alle kopieën zijn in gebruik. Doe dit item bij een andere bug af.':'Nog niet gevonden. Vang bugs voor een kans op dit item.'),action:available&&!active?{label:'Rust uit',onPress:()=>{void run('goEquip',{id:s.id,item}).then(ok=>{if(ok)info.hide();});}}:undefined})} style={{width:'47%',padding:10,alignItems:'center',gap:5,borderRadius:19,borderWidth:2,borderColor:active?'#E5CA7D':'#66856A',backgroundColor:active?'#3A6048':'#183E34'}}><Glyph name={h.icon} size={55}/><Label small bold>{h.name}</Label><Label small>{active?'Uitgerust':free+' vrij'}</Label>{!available&&<Glyph name="lock" size={18}/>}</Pressable>;})}</View>{s.go!.item&&<Button small secondary disabled={busy} onPress={()=>action('goEquip',{item:null})}>Item af</Button>}</Panel>}

  {details==='evolve'&&evo&&<Panel><Title>{usesSharedEvolutionModel(evo.to)?'Elite-evolutie':'Evolutie'}</Title><CollectionEvolutionV2 id={s.species} shiny={s.shiny}/><Label bold center>CP {st.cp} → {stats({...s,species:evo.to}).cp}</Label><View accessibilityLabel={evo.candy+' '+familyName(key)+'-nectar'} style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6}}><CandyIconV2 family={key} size="large"/><Label bold>{(g.candy[key]??0)+' / '+evo.candy}</Label></View><Help title="Evolueren" body="Je bug krijgt een nieuwe vorm en wordt sterker. Zijn aanleg, level, shiny en item blijven behouden. Hiervoor betaal je nectar van deze familie. Na evolueren krijg je 1 nectar terug."/>{powerUpLeagueWarning(st.cp,stats({...s,species:evo.to}).cp)&&<Label small bold color="#F0BC85">{powerUpLeagueWarning(st.cp,stats({...s,species:evo.to}).cp)}</Label>}<Button disabled={busy||(g.candy[key]??0)<evo.candy} onPress={()=>void run('goEvolve',{id:s.id}).then(ok=>{if(ok)setDetails(null);})}>Bevestig evolutie</Button><Button small secondary onPress={()=>setDetails(null)}>Annuleren</Button></Panel>}

  {details==='iv'&&s.catchLocation&&<Button small secondary icon="compass" onPress={()=>info.show({title:s.catchLocation?.boss?'Gevangen kaartbaas':'Vangplek',icon:'compass',body:s.catchLocation!.lat.toFixed(5)+', '+s.catchLocation!.lng.toFixed(5)+' · GPS-plek van de bug bij de bevestigde vangst.'})}>Vangplek</Button>}{details==='iv'&&s.obtainedAt>0&&<Label small color={V.muted}>Verkregen · {new Date(s.obtainedAt).toLocaleString('nl-NL',{dateStyle:'medium',timeStyle:'short'})}</Label>}

  {open&&<Button small icon="swords" onPress={()=>open('ranked')}>Naar Strijd</Button>}



  </>:<>

   <TextInput placeholderTextColor="#B7CAB6" selectionColor="#A5CE87" accessibilityLabel="Zoek gevangen bug" placeholder="Zoek een bug" autoCapitalize="none" autoCorrect={false} value={query} onChangeText={setQuery} style={v.input}/>

   <View style={[v.row,{justifyContent:'space-between'}]}><View style={[v.row,{gap:5}]}>{(['cp','recent','shiny'] as const).map(k=><Pressable key={k} accessibilityRole="button" accessibilityLabel={'Sorteer '+(k==='cp'?'CP':k==='recent'?'nieuwste':'shiny')} accessibilityState={{selected:sort===k}} onPress={()=>setSort(k)} style={{minHeight:44,paddingHorizontal:12,paddingVertical:8,borderRadius:19,backgroundColor:sort===k?'#4C6E4E':'#214F45',borderWidth:1,borderColor:sort===k?'#DAC57F':'#6A85684D',justifyContent:'center'}}><Label small bold>{k==='cp'?'CP':k==='recent'?'Nieuw':'Shiny'}</Label></Pressable>)}</View><IconButton name="settings" label="Collectiefilters" active={filters||filtered} onPress={()=>setFilters(!filters)}/></View>

   {filters&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}><Help title="Zoeken en filters" body={COLLECTION_SEARCH_HELP}/>

    <Button small secondary={!favoriteOnly} icon="star" hint="Toont je favorieten. Zoeken kan ook met favoriet of !favoriet." onPress={()=>setFavoriteOnly(!favoriteOnly)}>Favoriet</Button>

    <Button small secondary={!perfectOnly} hint="Perfecte IV's: 4*. Zoek ook met 0*, 1*, 2* of 3*." onPress={()=>setPerfectOnly(!perfectOnly)}>4★</Button>

    {([{term:'buddy',label:'Buddy',icon:'heart'},{term:'team',label:'Team',icon:'swords'},{term:'0*',label:'0★',icon:'info'},{term:'1*',label:'1★',icon:'info'},{term:'2*',label:'2★',icon:'info'},{term:'3*',label:'3★',icon:'info'},{term:'cp-1500',label:'≤1500 CP',icon:'shield'},{term:'cp-2500',label:'≤2500 CP',icon:'shield'}] as const).map(f=><Pressable key={f.term} accessibilityRole="button" accessibilityLabel={'Filter '+f.label} accessibilityState={{selected:searchTerms.includes(f.term)}} onPress={()=>toggleSearch(f.term)} onLongPress={()=>info.show({title:'Zoeken: '+f.term,body:COLLECTION_SEARCH_HELP,icon:f.icon})} style={{minHeight:44,paddingHorizontal:12,paddingVertical:9,borderRadius:22,justifyContent:'center',backgroundColor:searchTerms.includes(f.term)?'#476A4B':'#214F45',borderWidth:1,borderColor:searchTerms.includes(f.term)?V.pine:V.line}}><View style={[v.row,{gap:4}]}>{!f.term.endsWith('*')&&<Glyph name={f.icon} size={20}/>}<Label small bold>{f.label}</Label></View></Pressable>)}

   </View>}

   <View style={[v.row,{justifyContent:'space-between',flexWrap:'wrap'}]}><Label small>{bugs.length} / {p.specimens.filter(b=>b.go).length} bugs</Label>{filtered&&<Button small secondary icon="close" onPress={resetFilters}>Wis filters</Button>}<Button small secondary icon="leaf" disabled={busy} onPress={()=>{setMulti(false);setSelection([]);setHelper(true);}}>Opruimen</Button><Button small secondary={!multi} onPress={()=>{setMulti(!multi);setSelection([]);}}>Selecteren</Button></View>{multi&&<Panel><Label small>{selection.length} / 50 · shinies, favorieten, buddy en team beschermd</Label><Button small disabled={busy||selection.length===0} onPress={releaseMany}>Vrijlaten · {selection.length}</Button></Panel>}{!bugs.length&&<Panel><Glyph name="compass" size={60}/><Label bold>{p.specimens.some(b=>b.go)?'Geen bugs gevonden':'Vang bugs op de GPS-kaart'}</Label>{!p.specimens.some(b=>b.go)&&open&&<Button small icon="compass" onPress={()=>open('map')}>Ga vangen</Button>}{filtered&&<><Label small>Pas je zoekopdracht aan of wis alle filters.</Label><Button small secondary onPress={resetFilters}>Toon alle bugs</Button></>}</Panel>}<View onLayout={event=>setGridWidth(event.nativeEvent.layout.width)} style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{bugs.map(b=><Pressable key={b.id} testID={'go-bug-'+b.id} accessibilityRole="button" accessibilityLabel={(b.nickname?b.nickname+' · ':'')+species(b.species).name+' CP '+stats(b).cp+' · '+RARITY_TIERS[bugRarity(b.species)].name} disabled={multi&&(protectedBug(b)||selection.length>=50)&&!selection.includes(b.id)} onPress={()=>{if(multi)setSelection(ids=>ids.includes(b.id)?ids.filter(id=>id!==b.id):[...ids,b.id]);else{setSelected(b.id);setDetails(null);}}} style={{opacity:multi&&protectedBug(b)? .4 : 1,width:Math.floor((gridWidth-16)/3),minWidth:0,padding:5,paddingTop:9,paddingBottom:10,borderRadius:19,alignItems:'center',gap:4,backgroundColor:b.shiny?'#364C4E':RARITY_TIERS[bugRarity(b.species)].color+'2E',borderWidth:selection.includes(b.id)?2:bugRarity(b.species)>=4?2:1,borderColor:selection.includes(b.id)?'#CEE4A7':b.shiny?'#D7B653':RARITY_TIERS[bugRarity(b.species)].color+'99'}}><Text style={{fontSize:16,fontWeight:'800',color:V.ink}}><Text style={{fontSize:9,fontWeight:'500',color:V.muted}}>CP </Text>{stats(b).cp}</Text><RarityBadgeV2 species={b.species} compact/><SpriteView id={b.species} shiny={b.shiny} size={Math.min(98,Math.floor((gridWidth-16)/3)-12)}/>{b.shiny&&<View style={{position:'absolute',right:5,top:25}}><ShinyMarkV2 size={20}/></View>}<Text numberOfLines={1} style={{fontSize:12,color:V.ink,textAlign:'center',maxWidth:'100%'}}>{b.nickname||species(b.species).name}</Text>{b.nickname&&<Text numberOfLines={1} style={{fontSize:10,color:V.muted,maxWidth:'100%'}}>{species(b.species).name}</Text>}<GoTypes species={b.species} compact/>{multi&&<Glyph name={selection.includes(b.id)?'check':protectedBug(b)?'lock':'leaf'} size={18}/>} {g.gyms?.deployed.some(d=>d.specimen===b.id)&&<View style={{position:'absolute',left:3,top:22}}><Glyph name="shield" size={23}/></View>} {b.favorite&&<View style={{position:'absolute',right:4,top:4}}><Glyph name="star" size={15}/></View>}{bestIds.has(b.id)&&<View testID={'best-'+b.id} accessibilityLabel="Je beste van deze soort" style={{position:'absolute',left:4,top:3}}><Text style={{fontSize:13}}>👍</Text></View>}</Pressable>)}</View></>}

 </ScrollView>

 {helper&&!s&&<TransferHelperV2 {...{view,run,busy}} onClose={()=>setHelper(false)}/>}

 {s&&<><View pointerEvents="none" style={{position:'absolute',left:0,right:0,bottom:0,height:74,backgroundColor:V.paper,borderTopWidth:1,borderTopColor:'#829B7544'}}/><View pointerEvents="box-none" style={{position:'absolute',left:0,right:0,bottom:18,alignItems:'center'}}><IconButton name="close" label="Sluit bug" onPress={()=>{setSelected('');setDetails(null);setOptions(false);}}/></View><View style={{position:'absolute',right:18,bottom:18}}><Pressable accessibilityRole="button" accessibilityLabel="Bugacties" accessibilityState={{expanded:options}} onPress={()=>setOptions(!options)} style={{width:48,height:48,borderRadius:24,backgroundColor:options?'#486340':'#214C40',borderWidth:1,borderColor:'#9AB38A',alignItems:'center',justifyContent:'center',gap:4}}>{[0,1,2].map(n=><View key={n} style={{width:22,height:3,borderRadius:2,backgroundColor:'#E5EDD1'}}/>)}</Pressable></View>{options&&<Panel style={{position:'absolute',right:15,bottom:72,width:220,borderWidth:1,borderColor:'#8AA47D',boxShadow:'0px 5px 20px #071E1ACC'}}><Button small secondary icon="info" onPress={()=>{setDetails('iv');setOptions(false);}}>Beoordelen</Button>

  <Button small secondary disabled={busy||s.favorite||s.shiny||s.id===p.buddy||g.team.includes(s.id)||!!g.gyms?.deployed.some(d=>d.specimen===s.id)} onPress={()=>info.show({title:'Vrijlaten?',icon:'leaf',body:'Dit exemplaar verdwijnt en geeft 1 '+familyName(key)+'-nectar. Dit kun je niet terugdraaien.',action:{label:'Laat vrij',onPress:()=>{void run('goTransfer',{id:s.id}).then(ok=>{if(ok)info.hide();});}}})}>Vrijlaten</Button>

 </Panel>}</>}

 </View>;

}

export function GoDexV2({view}:{view:GameViewV2}){

 const p=view.player,[shiny,setShiny]=useState(false),[filter,setFilter]=useState<'all'|'seen'|'caught'>('all'),[selected,setSelected]=useState(''),[query,setQuery]=useState('');

 useGoBack(!!selected,()=>{setSelected('');return true;});

 const entries=DEX_SPECIES.filter(s=>WALK_MODELS[s.id]),legacy=SPECIES.filter(s=>!dexNumber(s.id)&&p.go?.dex?.includes(s.id)),caught=entries.filter(s=>dexStatus(p,s.id)[shiny?'shiny':'caught']).length;

 const entry=(id:string)=>{const status=dexStatus(p,id),visible=shiny?status.shiny:status.caught,n=dexNumber(id);return <Pressable key={id} accessibilityRole="button" accessibilityLabel={'Bugdex '+(n?'#'+String(n).padStart(3,'0')+' ':'')+(status.seen?species(id).name:'Onbekend')} onPress={()=>setSelected(id)} style={{width:'31%',alignItems:'center',padding:7,borderRadius:18,backgroundColor:shiny?'#354952':'#214F45',gap:3}}><Label small bold>{n?'#'+String(n).padStart(3,'0'):'Archief'}</Label><SpriteView id={id} shiny={shiny} silhouette={!visible} size={75}/><Label small>{status.seen?species(id).name:'???'}</Label><Glyph name={status.caught?'check':status.seen?'compass':'lock'} size={16}/></Pressable>;};

 if(selected){const status=dexStatus(p,selected),visible=shiny?status.shiny:status.caught,line=evolutionLine(selected);return <View style={{gap:14}}>

  <View style={[v.row,{justifyContent:'space-between'}]}><Title>{dexNumber(selected)?'#'+String(dexNumber(selected)).padStart(3,'0'): 'Archief'}</Title><IconButton name="close" label="Terug naar Bugdex" onPress={()=>setSelected('')}/></View>

  <View style={{height:250,alignItems:'center',justifyContent:'center',borderRadius:25,overflow:'hidden',backgroundColor:'#244E3E'}}>{shiny&&visible&&<ShinyBackdropV2/>}<CollectionArtV2 key={selected} id={selected} shiny={shiny} visible={visible} size={225}/></View><Title>{status.seen?species(selected).name:'Nog niet gezien'}</Title>

  <View style={v.row}><Glyph name={status.caught?'check':'compass'} size={25}/><Label>{status.caught?'Gevangen':status.seen?'Gezien':'Onbekend'}</Label>{status.shiny&&<ShinyMarkV2 size={24}/>}</View>

  {status.caught&&line.length>1&&<Panel><Label bold>Evolutielijn</Label><View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>{line.map((id,i)=><View key={id} style={{flex:1,minWidth:0,alignItems:'center'}}>{i>0&&<View style={{position:'absolute',left:-10,top:30}}><Glyph name="power" size={20}/></View>}<Pressable accessibilityRole="button" accessibilityLabel={'Evolutielijn '+species(id).name} onPress={()=>setSelected(id)} style={{width:'100%',alignItems:'center',gap:4}}><SpriteView id={id} size={line.length>2?70:100} shiny={shiny} silhouette={!dexStatus(p,id)[shiny?'shiny':'caught']}/><Label small>#{String(dexNumber(id)).padStart(3,'0')}</Label><Label small center>{usesSharedEvolutionModel(id)?'Elite':species(id).name}</Label>{EVOLUTIONS[id]&&<Label small>{EVOLUTIONS[id].candy} nectar</Label>}</Pressable></View>)}</View>{line.some(usesSharedEvolutionModel)&&<Label small>Elite is een sterkere spelvorm van dezelfde diersoort.</Label>}</Panel>}

 </View>;}

 return <View style={{gap:12}}><View style={[v.row,{justifyContent:'space-between'}]}><Label bold>{caught} / {entries.length}</Label><IconButton name="star" label="Shiny Bugdex" active={shiny} onPress={()=>setShiny(!shiny)}/></View><TextInput placeholderTextColor="#B7CAB6" selectionColor="#A5CE87" accessibilityLabel="Zoek in Bugdex" placeholder="Naam of nummer" value={query} onChangeText={setQuery} style={v.input}/><View style={v.row}>{(['all','seen','caught'] as const).map(f=><Button key={f} small secondary={filter!==f} onPress={()=>setFilter(f)}>{f==='all'?'Alle':f==='seen'?'Gezien':'Gevangen'}</Button>)}</View><View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{entries.filter(e=>{const status=dexStatus(p,e.id);return (filter==='all'||status[filter])&&(!query||String(e.number).padStart(3,'0').includes(query)||status.seen&&species(e.id).name.toLowerCase().includes(query.toLowerCase()));}).map(e=>entry(e.id))}</View>{legacy.length>0&&<><Label bold>Archief</Label><View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{legacy.map(e=>entry(e.id))}</View></>}</View>;

}

export function GoBuddyV2({view,run,busy}:{view:GameViewV2;run:RunV2;busy:boolean}){const p=view.player,b=p.specimens.find(s=>s.id===p.buddy&&s.go),required=b?buddyDistance(b.species):1000,progress=Math.max(0,(p.field?.walk?.meters??0)-p.go!.buddyMeters)%required;return <View style={{gap:14}}>{b?<><View style={{height:255,borderRadius:25,overflow:'hidden',alignItems:'center',justifyContent:'flex-end',paddingBottom:12}}><Scene index={species(b.species).habitat}/>{b.shiny&&<ShinyBackdropV2/>}<BugStageV2 id={b.species} shiny={b.shiny}/><Label bold color='white'>{species(b.species).name}</Label></View><Panel><Counter icon="compass" value={(progress/1000).toLocaleString('nl-NL',{maximumFractionDigits:2})+' / '+required/1000+' km'} label="Buddyafstand"/><View accessibilityRole="progressbar" accessibilityLabel="Voortgang buddyafstand" accessibilityValue={{min:0,max:required,now:progress}} aria-valuemin={0} aria-valuemax={required} aria-valuenow={progress} style={{height:9,borderRadius:6,overflow:'hidden',backgroundColor:'#102F2A'}}><View style={{height:9,width:(progress/required*100+'%') as `${number}%`,backgroundColor:V.pine}}/></View><View style={[v.row,{justifyContent:'center',gap:6}]}><CandyIconV2 family={family(b.species)}/><Label small bold>+1 {familyName(family(b.species))}-nectar</Label></View><Help title="Buddy" body="Verdien 1 nectar per 1, 3 of 5 km, afhankelijk van de familie. Evolueren maakt die afstand niet langer. Android: koppel Adventure Sync voor wandelen met de app gesloten; autovangst kan ook GPS-afstand op de achtergrond meten. Browser: houd de GPS-kaart open. Stilstand, slecht GPS en te hard rijden tellen niet. Je buddy kan gewoon in je PvP-team. Bij wisselen begint de afstand voor de nieuwe buddy opnieuw."/></Panel></>:<Label>Vang eerst een bug.</Label>}<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{p.specimens.filter(s=>s.go).map(s=><Pressable key={s.id} accessibilityRole="button" accessibilityLabel={'Buddy '+species(s.species).name} accessibilityState={{selected:s.id===p.buddy,disabled:busy||s.id===p.buddy}} disabled={busy||s.id===p.buddy} onPress={()=>{if(s.id!==p.buddy)void run('buddy',{id:s.id});}} style={{padding:6,borderRadius:18,borderWidth:1,borderColor:s.id===p.buddy?V.pine:V.line,backgroundColor:s.id===p.buddy?'#345B43':undefined}}><SpriteView id={s.species} shiny={s.shiny} size={70}/>{s.id===p.buddy&&<View style={{position:'absolute',right:2,top:2}}><Glyph name="check" size={20}/></View>}</Pressable>)}</View></View>;}

export function GoFriendsV2({view,run,busy,open}:{view:GameViewV2;run:RunV2;busy:boolean;open?:(name:string)=>void}){const [code,setCode]=useState(''),[copied,setCopied]=useState(false),p=view.player;return <View style={{gap:14}}><Panel><Label small>Vriendencode</Label><Text selectable style={{fontSize:25,fontWeight:'800',textAlign:'center',letterSpacing:3,color:V.ink}}>{p.friendCode}</Text><Button small secondary icon="friends" onPress={()=>{if(Platform.OS==='web'&&navigator.clipboard)void navigator.clipboard.writeText(p.friendCode).then(()=>setCopied(true)).catch(()=>{});else void Share.share({message:'Mijn BugBaas-code: '+p.friendCode});}}>{copied?'Gekopieerd':'Deel code'}</Button>{open&&<Button small icon="swords" onPress={()=>open('ranked')}>Vriendenduel</Button>}<TextInput placeholderTextColor="#B7CAB6" selectionColor="#A5CE87" accessibilityLabel="Vriendencode" placeholder="Code van vriend" maxLength={8} autoCapitalize="characters" value={code} onChangeText={v=>setCode(v.toUpperCase())} style={v.input}/><Button small disabled={busy||code.length!==8} onPress={()=>void run('friendRequest',{code})}>Voeg toe</Button></Panel>{view.friends.map(f=><Panel key={f.id}><Label bold>{f.names[1-f.users.indexOf(p.uid)]}</Label>{!f.accepted?(f.requestedBy!==p.uid?<Button small disabled={busy} onPress={()=>void run('friendAccept',{pair:f.id})}>Accepteer</Button>:<Label small>Verzoek verstuurd</Label>):<><Label small>Gebruik de duelcode bij Strijd voor een live vriendenduel.</Label><Button small secondary disabled={busy} onPress={()=>void run('friendRemove',{pair:f.id})}>Verwijder vriend</Button></>}</Panel>)}</View>;}

/** Cost chip like PoGO: icon and price, green when you have enough and red when not. */
function Cost({art,need,have,label}:{art:React.ReactNode;need:number;have:number;label:string}){const ok=have>=need;return <View accessibilityLabel={label+': '+need+' nodig, '+have+' in bezit'} style={{flexDirection:'row',alignItems:'center',gap:3,paddingHorizontal:7,paddingVertical:2,borderRadius:10,backgroundColor:ok?'#1E4A36':'#5A2A22'}}>{art}<Text style={{fontSize:12,fontWeight:'800',color:ok?'#CDEBB6':'#FFB9A5'}}>{need>=10000?Math.round(need/1000)+'k':need}</Text></View>;}
