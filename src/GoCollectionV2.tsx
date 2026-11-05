import {RarityBadgeV2} from './RarityBadgeV2';
import {BugDetailV2} from './BugDetailV2';
import {bestOfSpecies} from '../game/bugAdviceV2';
import {bugRarity,RARITY_TIERS} from '../game/rarityDisplayV2';
import {familyName} from './resourceGainV2';
import {CandyIconV2} from './CandyIconV2';
import {TransferHelperV2} from './TransferHelperV2';
import {TabsV2} from './TabsV2';
import {cocoonActive,cocoonWalked} from '../game/goCocoonsV2';

import BugStageV2 from './BugStageV2';
import {CollectionArtV2} from './CollectionArtV2';

import {DEX_SPECIES,dexNumber,dexStatus,EVOLUTIONS,usesSharedEvolutionModel,evolutionLine} from '../game/dexV2';

import {collectionSearch,COLLECTION_SEARCH_HELP} from '../game/collectionSearchV2';

import {useGoBack} from './GoBackV2';

import {ShinyBackdropV2,ShinyMarkV2} from './WorldEffectsV2';

import React,{useEffect,useRef,useState} from 'react';

import {Platform,Pressable,ScrollView,Share,Text,TextInput,View} from 'react-native';

import type {GameViewV2} from '../game/typesV2';

import {SPECIES,species} from '../game/catalogV2';

import {appraisal,stats,family,movePool,buddyDistance} from '../game/goV2';

import {GoTypeHelp,GoTypes,GO_TYPES} from './GoTypeV2';
import Svg,{Circle} from 'react-native-svg';

import {WALK_MODELS} from '../game/walkingV2';

import type {RunV2} from './ShopViewV2';

import {SpriteView,Scene} from './artV2';

import {Button,Counter,Glyph,Help,IconButton,Label,Panel,Title,V,v,useInfo,font} from './uiV2';
import {PO} from './PogoUiV2';
import {MainTypeEmblemV2} from './TypeEmblemV2';

export function GoCollectionV2({view,run,busy,initialSpecimenId,open,onSelectionChange,active=true,onTargetConsumed}:{view:GameViewV2;run:RunV2;busy:boolean;initialSpecimenId?:string;open?:(name:string)=>void;onSelectionChange?:(selected:boolean)=>void;active?:boolean;onTargetConsumed?:()=>void}){

 const previousOrder=useRef<string[]>([]);

 const p=view.player,g=p.go!,[selected,setSelected]=useState(()=>p.specimens.some(s=>s.id===initialSpecimenId&&s.go)?initialSpecimenId!:''),[query,setQuery]=useState(''),[sort,setSort]=useState<'cp'|'recent'|'shiny'>('cp'),[favoriteOnly,setFavoriteOnly]=useState(false),[perfectOnly,setPerfectOnly]=useState(false),[filters,setFilters]=useState(false),[multi,setMulti]=useState(false),[selection,setSelection]=useState<string[]>([]),info=useInfo();

 const [gridWidth,setGridWidth]=useState(280),[helper,setHelper]=useState(false);

 useEffect(()=>{onSelectionChange?.(active&&!!selected);return()=>onSelectionChange?.(false);},[active,selected,onSelectionChange]);

 const matches=collectionSearch(query,{buddy:p.buddy,team:g.team}),bugs=p.specimens.filter(s=>matches(s)&&(sort!=='shiny'||s.shiny)&&(!favoriteOnly||s.favorite)&&(!perfectOnly||appraisal(s)===4)).sort((a,b)=>(sort==='recent'?b.obtainedAt-a.obtainedAt:stats(b).cp-stats(a).cp)||a.id.localeCompare(b.id)),s=p.specimens.find(s=>s.id===selected&&s.go);

 const bugIds=bugs.map(b=>b.id),orderKey=JSON.stringify(bugIds),selectedIndex=bugIds.indexOf(selected),previousId=selectedIndex>0?bugIds[selectedIndex-1]:undefined,nextId=selectedIndex>=0?bugIds[selectedIndex+1]:bugIds[0];

 const bestIds=bestOfSpecies(p.specimens);

 // Consume a navigation ID only when it changes; refreshed player data must not reopen a closed detail.

 useEffect(()=>{if(!initialSpecimenId)return;setSelected(p.specimens.some(s=>s.id===initialSpecimenId&&s.go)?initialSpecimenId:'');onTargetConsumed?.();},[initialSpecimenId]);

 useEffect(()=>{if(selected&&!s){const old=previousOrder.current,index=old.indexOf(selected),replacement=[...old.slice(index+1),...old.slice(0,index).reverse()].find(id=>bugIds.includes(id))??bugIds[0]??'';setSelected(current=>current===selected?replacement:current);}previousOrder.current=bugIds;},[selected,s?.id,orderKey]);

 const searchTerms=query.toLowerCase().split('&').map(t=>t.trim()).filter(Boolean),filtered=!!query.trim()||favoriteOnly||perfectOnly||sort==='shiny',resetFilters=()=>{setQuery('');setFavoriteOnly(false);setPerfectOnly(false);setSort('cp');};

 const toggleSearch=(term:string)=>setQuery(searchTerms.includes(term)?searchTerms.filter(t=>t!==term).join('&'):[...searchTerms,term].join('&'));

 useGoBack(active&&!!s,()=>{setSelected('');return true;});

 const protectedBug=(b:typeof p.specimens[number])=>b.favorite||b.shiny||b.id===p.buddy||g.team.includes(b.id)||!!g.gyms?.deployed.some(d=>d.specimen===b.id);

 const releaseMany=()=>info.show({title:selection.length+' bugs vrijlaten?',icon:'leaf',body:'🍯 +'+selection.length+' nectar\n🔒 ✦ ⭐ ❤️ blijven veilig\n⚠️ Definitief',action:{label:'Laat '+selection.length+' vrij',onPress:()=>{void run('goTransferMany',{ids:selection}).then(ok=>{if(ok){setSelection([]);setMulti(false);info.hide();}});}}});

 const readyCocoons=(g.cocoons?.items??[]).filter(c=>cocoonActive(p,c.id)&&cocoonWalked(p,c.id)>=c.km*1000).length;

 // Detail: simple PoGO-HD screen (BugDetailV2); remounts per bug so sheet, rename and power-up amount reset.
 if(s)return <BugDetailV2 key={s.id} {...{view,run,busy,open,active}} bug={s} onClose={()=>setSelected('')} onPrevious={previousId?()=>setSelected(previousId):undefined} onNext={nextId&&nextId!==s.id?()=>setSelected(nextId):undefined}/>;

 return <View style={{flex:1}}><ScrollView testID="go-collection-list" contentContainerStyle={{padding:15,paddingTop:22,gap:12,paddingBottom:100}}>

  <View testID="collection-tabs" style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text accessibilityRole="header" style={{fontFamily:font,fontSize:32,fontWeight:'800',color:PO.text}}>Bugs</Text><View style={{flexDirection:'row',alignItems:'center',gap:10}}><Text style={{fontFamily:font,fontSize:15,fontWeight:'700',color:PO.muted}}>{p.specimens.filter(b=>b.go).length}</Text>{open&&<Pressable accessibilityRole="button" accessibilityLabel={'Cocons'+(readyCocoons?', '+readyCocoons+' klaar':'')} onPress={()=>open('cocoons')} style={{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center',backgroundColor:PO.surface,borderWidth:1,borderColor:PO.rim}}><Text style={{fontSize:20}}>🐣</Text>{!!readyCocoons&&<View style={{position:'absolute',right:-3,top:-3,minWidth:18,height:18,borderRadius:9,backgroundColor:PO.raid,alignItems:'center',justifyContent:'center'}}><Text style={{fontFamily:font,fontSize:10,fontWeight:'800',color:'#fff'}}>{readyCocoons}</Text></View>}</Pressable>}</View></View>

   <View style={{flexDirection:'row',gap:8}}><View style={{flex:1,flexDirection:'row',alignItems:'center',gap:6,height:46,paddingHorizontal:14,borderRadius:14,backgroundColor:PO.surface,borderWidth:1,borderColor:PO.rim}}><Text style={{fontSize:16,color:PO.muted}}>⌕</Text><TextInput placeholderTextColor={PO.muted} selectionColor={PO.teal} accessibilityLabel="Zoek gevangen bug" placeholder="Zoek…" autoCapitalize="none" autoCorrect={false} value={query} onChangeText={setQuery} style={{flex:1,fontFamily:font,fontSize:15,color:PO.text,height:44}}/></View><Pressable accessibilityRole="button" accessibilityLabel={'Sorteer: '+(sort==='cp'?'CP':sort==='recent'?'nieuwste':'shiny')} onPress={()=>setSort(sort==='cp'?'recent':sort==='recent'?'shiny':'cp')} style={{height:46,minWidth:86,paddingHorizontal:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,borderRadius:14,backgroundColor:PO.surface,borderWidth:1,borderColor:PO.rim}}><Text style={{fontFamily:font,fontSize:14,fontWeight:'800',color:PO.text}}>{sort==='cp'?'CP':sort==='recent'?'Nieuw':'Shiny'}</Text><Text style={{color:PO.muted,fontSize:12}}>▾</Text></Pressable><IconButton name="settings" label="Collectiefilters" active={filters||filtered} onPress={()=>setFilters(!filters)}/></View>

   {filters&&<View style={{flexDirection:'row',gap:6,flexWrap:'wrap'}}>{(['cp','recent','shiny'] as const).map(k=><Pressable key={k} accessibilityRole="button" accessibilityLabel={'Sorteer '+(k==='cp'?'CP':k==='recent'?'nieuwste':'shiny')} accessibilityState={{selected:sort===k}} onPress={()=>setSort(k)} style={{minHeight:40,paddingHorizontal:12,borderRadius:20,backgroundColor:sort===k?PO.teal+'33':PO.surface,borderWidth:1,borderColor:sort===k?PO.tealText:PO.rim,justifyContent:'center'}}><Text style={{fontFamily:font,fontSize:13,fontWeight:'700',color:PO.text}}>{k==='cp'?'CP':k==='recent'?'Nieuw':'Shiny'}</Text></Pressable>)}<GoTypeHelp/><Button small secondary icon="leaf" disabled={busy} onPress={()=>{setMulti(false);setSelection([]);setHelper(true);}}>Opruimen</Button><Button small secondary={!multi} onPress={()=>{setMulti(!multi);setSelection([]);}}>Selecteren</Button></View>}

   {filters&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}><Help title="Zoeken en filters" body={COLLECTION_SEARCH_HELP}/>

    <Button small secondary={!favoriteOnly} icon="star" hint="⭐ Alleen favorieten." onPress={()=>setFavoriteOnly(!favoriteOnly)}>Favoriet</Button>

    <Button small secondary={!perfectOnly} hint="4★ = perfecte aanleg." onPress={()=>setPerfectOnly(!perfectOnly)}>4★</Button>

    {([{term:'buddy',label:'Buddy',icon:'heart'},{term:'team',label:'Team',icon:'swords'},{term:'0*',label:'0★',icon:'info'},{term:'1*',label:'1★',icon:'info'},{term:'2*',label:'2★',icon:'info'},{term:'3*',label:'3★',icon:'info'},{term:'cp-1500',label:'≤1500 CP',icon:'shield'},{term:'cp-2500',label:'≤2500 CP',icon:'shield'}] as const).map(f=><Pressable key={f.term} accessibilityRole="button" accessibilityLabel={'Filter '+f.label} accessibilityState={{selected:searchTerms.includes(f.term)}} onPress={()=>toggleSearch(f.term)} onLongPress={()=>info.show({title:'Zoeken: '+f.term,body:COLLECTION_SEARCH_HELP,icon:f.icon})} style={{minHeight:44,paddingHorizontal:12,paddingVertical:9,borderRadius:22,justifyContent:'center',backgroundColor:searchTerms.includes(f.term)?'#476A4B':'#214F45',borderWidth:1,borderColor:searchTerms.includes(f.term)?V.pine:V.line}}><View style={[v.row,{gap:4}]}>{!f.term.endsWith('*')&&<Glyph name={f.icon} size={20}/>}<Label small bold>{f.label}</Label></View></Pressable>)}

   </View>}

   {filtered&&<View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{fontFamily:font,fontSize:13,fontWeight:'700',color:PO.muted}}>{bugs.length} gevonden</Text><Button small secondary icon="close" onPress={resetFilters}>Wis filters</Button></View>}{multi&&<Panel><Label small>{selection.length} / 50 · 🔒 ✦ ⭐ ❤️ blijven veilig</Label><Button small disabled={busy||selection.length===0} onPress={releaseMany}>Vrijlaten · {selection.length}</Button></Panel>}{!bugs.length&&<Panel><Glyph name="compass" size={60}/><Label bold>{p.specimens.some(b=>b.go)?'Geen bugs gevonden':'Vang bugs op de GPS-kaart'}</Label>{!p.specimens.some(b=>b.go)&&open&&<Button small icon="compass" onPress={()=>open('map')}>Ga vangen</Button>}{filtered&&<Button small secondary onPress={resetFilters}>Toon alle bugs</Button>}</Panel>}<View onLayout={event=>setGridWidth(event.nativeEvent.layout.width)} style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{bugs.map(b=><Pressable key={b.id} testID={'go-bug-'+b.id} accessibilityRole="button" accessibilityLabel={(b.nickname?b.nickname+' · ':'')+species(b.species).name+' CP '+stats(b).cp+' · '+RARITY_TIERS[bugRarity(b.species)].name} disabled={multi&&(protectedBug(b)||selection.length>=50)&&!selection.includes(b.id)} onPress={()=>{if(multi)setSelection(ids=>ids.includes(b.id)?ids.filter(id=>id!==b.id):[...ids,b.id]);else setSelected(b.id);}} style={({pressed})=>({opacity:multi&&protectedBug(b)? .4 : 1,width:Math.floor((gridWidth-16)/3),minWidth:0,borderRadius:16,overflow:'hidden',backgroundColor:'#0C2622',borderWidth:selection.includes(b.id)?2:1.5,borderColor:selection.includes(b.id)?PO.tealText:b.shiny?'#E8C35A':RARITY_TIERS[bugRarity(b.species)].color+'AA',boxShadow:'0px 4px 10px #00000055',transform:[{scale:pressed?.97:1}]})}><View style={{height:Math.floor((gridWidth-16)/3)*.92,alignItems:'center',justifyContent:'center',backgroundColor:RARITY_TIERS[bugRarity(b.species)].color+'26'}}><SpriteView id={b.species} shiny={b.shiny} size={Math.floor((gridWidth-16)/3)*.9}/></View>{b.shiny&&<View style={{position:'absolute',right:5,top:5}}><ShinyMarkV2 size={20}/></View>}<View style={{paddingHorizontal:6,paddingTop:5,paddingBottom:7,gap:1,backgroundColor:'#0F2D2DF2',borderTopWidth:1,borderTopColor:PO.rim}}><View style={{flexDirection:'row',alignItems:'center',gap:5}}><MainTypeEmblemV2 species={b.species} size={20}/><Text numberOfLines={1} style={{fontFamily:font,fontSize:13,fontWeight:'800',color:PO.text}}><Text style={{fontSize:10,color:PO.muted}}>CP </Text>{stats(b).cp}</Text></View><Text numberOfLines={1} style={{fontFamily:font,fontSize:11,fontWeight:'600',color:PO.muted,textAlign:'center'}}>{b.nickname||species(b.species).name}</Text></View>{multi&&<View style={{position:'absolute',left:'50%',top:'35%',marginLeft:-11}}><Glyph name={selection.includes(b.id)?'check':protectedBug(b)?'lock':'leaf'} size={22}/></View>} {g.gyms?.deployed.some(d=>d.specimen===b.id)&&<View style={{position:'absolute',left:3,top:24}}><Glyph name="shield" size={21}/></View>} {b.favorite&&<View style={{position:'absolute',right:4,top:4}}><Glyph name="star" size={15}/></View>}{bestIds.has(b.id)&&<View testID={'best-'+b.id} accessibilityLabel="Je beste van deze soort" style={{position:'absolute',left:4,top:3}}><Text style={{fontSize:13}}>👍</Text></View>}</Pressable>)}</View>

 </ScrollView>

 {helper&&<TransferHelperV2 {...{view,run,busy}} onClose={()=>setHelper(false)}/>}

 </View>;

}

export function GoDexV2({view}:{view:GameViewV2}){

 const p=view.player,[shiny,setShiny]=useState(false),[filter,setFilter]=useState<'all'|'seen'|'caught'>('all'),[selected,setSelected]=useState(''),[query,setQuery]=useState('');

 useGoBack(!!selected,()=>{setSelected('');return true;});

 const entries=DEX_SPECIES.filter(s=>WALK_MODELS[s.id]),legacy=SPECIES.filter(s=>!dexNumber(s.id)&&p.go?.dex?.includes(s.id)),caught=entries.filter(s=>dexStatus(p,s.id)[shiny?'shiny':'caught']).length,seenCount=entries.filter(s=>dexStatus(p,s.id).seen).length,share=entries.length?caught/entries.length:0;

 const entry=(id:string)=>{const status=dexStatus(p,id),visible=shiny?status.shiny:status.caught,n=dexNumber(id);return <Pressable key={id} accessibilityRole="button" accessibilityLabel={'Bugdex '+(n?'#'+String(n).padStart(3,'0')+' ':'')+(status.seen?species(id).name:'Onbekend')} onPress={()=>setSelected(id)} style={{width:'31%',alignItems:'center',padding:7,borderRadius:18,backgroundColor:shiny?'#354952':'#214F45',gap:3,borderWidth:2,borderColor:status.seen?RARITY_TIERS[bugRarity(id)].color+(status.caught?'':'88'):'transparent'}}><Label small bold>{n?'#'+String(n).padStart(3,'0'):'Archief'}</Label><SpriteView id={id} shiny={shiny} silhouette={!visible} size={75}/><Label small>{status.seen?species(id).name:'???'}</Label>{status.seen?<View style={{alignItems:'center',gap:2}}><RarityBadgeV2 species={id} compact/><View style={{flexDirection:'row',alignItems:'center',gap:2}}>{movePool(id).types.map(t=><Glyph key={t} name={GO_TYPES[t].icon} size={15}/>)}{status.caught&&<Glyph name="check" size={15}/>}</View></View>:<Glyph name="lock" size={16}/>}</Pressable>;};

 if(selected){const status=dexStatus(p,selected),visible=shiny?status.shiny:status.caught,line=evolutionLine(selected);return <View style={{gap:14}}>

  <View style={[v.row,{justifyContent:'space-between'}]}><Title>{dexNumber(selected)?'#'+String(dexNumber(selected)).padStart(3,'0'): 'Archief'}</Title><IconButton name="close" label="Terug naar Bugdex" onPress={()=>setSelected('')}/></View>

  <View style={{height:250,alignItems:'center',justifyContent:'center',borderRadius:25,overflow:'hidden',backgroundColor:'#244E3E'}}>{shiny&&visible&&<ShinyBackdropV2/>}<CollectionArtV2 key={selected} id={selected} shiny={shiny} visible={visible} size={225}/></View><Title>{status.seen?species(selected).name:'Nog niet gezien'}</Title>

  <View style={v.row}><Glyph name={status.caught?'check':'compass'} size={25}/><Label>{status.caught?'Gevangen':status.seen?'Gezien':'Onbekend'}</Label>{status.shiny&&<ShinyMarkV2 size={24}/>}</View>

  {status.caught&&line.length>1&&<Panel><Label bold>Evolutielijn</Label><View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>{line.map((id,i)=><View key={id} style={{flex:1,minWidth:0,alignItems:'center'}}>{i>0&&<View style={{position:'absolute',left:-10,top:30}}><Glyph name="power" size={20}/></View>}<Pressable accessibilityRole="button" accessibilityLabel={'Evolutielijn '+species(id).name} onPress={()=>setSelected(id)} style={{width:'100%',alignItems:'center',gap:4}}><SpriteView id={id} size={line.length>2?70:100} shiny={shiny} silhouette={!dexStatus(p,id)[shiny?'shiny':'caught']}/><Label small>#{String(dexNumber(id)).padStart(3,'0')}</Label><Label small center>{usesSharedEvolutionModel(id)?'Elite':species(id).name}</Label>{EVOLUTIONS[id]&&<Label small>{EVOLUTIONS[id].candy} nectar</Label>}</Pressable></View>)}</View>{line.some(usesSharedEvolutionModel)&&<Label small>Elite is een sterkere spelvorm van dezelfde diersoort.</Label>}</Panel>}

 </View>;}

 return <View style={{gap:12}}><View style={[v.row,{justifyContent:'space-between'}]}><View accessibilityRole="progressbar" accessibilityLabel={(shiny?'Shiny gevangen ':'Gevangen ')+caught+' van '+entries.length} style={{flexDirection:'row',alignItems:'center',gap:10}}><View style={{width:64,height:64,alignItems:'center',justifyContent:'center'}}><Svg width={64} height={64} viewBox="0 0 64 64" style={{position:'absolute'}}><Circle cx={32} cy={32} r={27} stroke="#102F2A" strokeWidth={8} fill="none"/><Circle cx={32} cy={32} r={27} stroke={shiny?'#F2D16E':share>=1?'#F2A33A':'#A4DF82'} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={`${Math.max(.001,share)*2*Math.PI*27} ${2*Math.PI*27}`} transform="rotate(-90 32 32)"/></Svg><Label small bold>{Math.floor(share*100)}%</Label></View><View><Label bold>{caught} / {entries.length}</Label><View style={{flexDirection:'row',alignItems:'center',gap:4}}><Glyph name="compass" size={15}/><Label small>{seenCount}</Label></View></View></View><IconButton name="star" label="Shiny Bugdex" active={shiny} onPress={()=>setShiny(!shiny)}/></View><TextInput placeholderTextColor="#B7CAB6" selectionColor="#A5CE87" accessibilityLabel="Zoek in Bugdex" placeholder="Naam of nummer" value={query} onChangeText={setQuery} style={v.input}/><View style={v.row}>{(['all','seen','caught'] as const).map(f=><Button key={f} small secondary={filter!==f} onPress={()=>setFilter(f)}>{f==='all'?'Alle':f==='seen'?'Gezien':'Gevangen'}</Button>)}</View><View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{entries.filter(e=>{const status=dexStatus(p,e.id);return (filter==='all'||status[filter])&&(!query||String(e.number).padStart(3,'0').includes(query)||status.seen&&species(e.id).name.toLowerCase().includes(query.toLowerCase()));}).map(e=>entry(e.id))}</View>{legacy.length>0&&<><Label bold>Archief</Label><View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{legacy.map(e=>entry(e.id))}</View></>}</View>;

}

export {GoBuddyV2} from './GoBuddyV2';

export function GoFriendsV2({view,run,busy,open}:{view:GameViewV2;run:RunV2;busy:boolean;open?:(name:string)=>void}){const [code,setCode]=useState(''),[copied,setCopied]=useState(false),p=view.player;return <View style={{gap:14}}><Panel><Label small>Vriendencode</Label><Text selectable style={{fontSize:25,fontWeight:'800',textAlign:'center',letterSpacing:3,color:V.ink}}>{p.friendCode}</Text><Button small secondary icon="friends" onPress={()=>{if(Platform.OS==='web'&&navigator.clipboard)void navigator.clipboard.writeText(p.friendCode).then(()=>setCopied(true)).catch(()=>{});else void Share.share({message:'Mijn BugBaas-code: '+p.friendCode});}}>{copied?'Gekopieerd':'Deel code'}</Button>{open&&<Button small icon="swords" onPress={()=>open('ranked')}>Vriendenduel</Button>}<TextInput placeholderTextColor="#B7CAB6" selectionColor="#A5CE87" accessibilityLabel="Vriendencode" placeholder="Code van vriend" maxLength={8} autoCapitalize="characters" value={code} onChangeText={v=>setCode(v.toUpperCase())} style={v.input}/><Button small disabled={busy||code.length!==8} onPress={()=>void run('friendRequest',{code})}>Voeg toe</Button></Panel>{view.friends.map(f=><Panel key={f.id}><Label bold>{f.names[1-f.users.indexOf(p.uid)]}</Label>{!f.accepted?(f.requestedBy!==p.uid?<Button small disabled={busy} onPress={()=>void run('friendAccept',{pair:f.id})}>Accepteer</Button>:<Label small>Verzoek verstuurd</Label>):<><Label small>Gebruik de duelcode bij Strijd voor een live vriendenduel.</Label><Button small secondary disabled={busy} onPress={()=>void run('friendRemove',{pair:f.id})}>Verwijder vriend</Button></>}</Panel>)}</View>;}
