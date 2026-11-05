import React,{useState} from 'react';
import {Modal,Pressable,ScrollView,Text,TextInput,View,useWindowDimensions} from 'react-native';
import type {GameViewV2,Specimen} from '../game/typesV2';
import type {RunV2} from './ShopViewV2';
import {species} from '../game/catalogV2';
import {FAST,CHARGED,HELD,appraisal,stats,powerCost,secondCost,family,movePool} from '../game/goV2';
import type {Held} from '../game/goV2';
import {EVOLUTIONS,usesSharedEvolutionModel} from '../game/dexV2';
import {powerUpLeagueWarning} from '../game/collectionSearchV2';
import {familyName} from './resourceGainV2';
import {CandyIconV2} from './CandyIconV2';
import {CollectionArtV2} from './CollectionArtV2';
import {BugUpgradeFxV3} from './BugUpgradeFxV3';
import {CollectionEvolutionV2,CollectionStatsV2,InfoDot} from './CollectionPresentationV2';
import {BugStrengthV2} from './BugStrengthV2';
import {GoTypes,GO_TYPES} from './GoTypeV2';
import {RarityBadgeV2} from './RarityBadgeV2';
import {Scene} from './artV2';
import {ShinyBackdropV2,ShinyMarkV2} from './WorldEffectsV2';
import {useGoBack} from './GoBackV2';
import {font,Glyph,useInfo} from './uiV2';
import {PO,PoBar,PoCircle,PoClose,PoPill,PoSheet,poText} from './PogoUiV2';
import type {GameIconName} from './gameUiArt';

type Section='moves'|'items'|'iv'|'evolve';
const short=(n:number)=>n>=10000?Math.round(n/1000)+'k':n.toLocaleString('nl-NL');
const t=(size:number,weight:'400'|'600'|'700'|'800'='700',color:string=PO.text)=>({fontFamily:font,fontSize:size,fontWeight:weight,color});

/** Bug detail in the simple PoGO-HD look: big habitat photo with the bug and CP, a white sheet with one STERKER pill, extras behind ☰. */
export function BugDetailV2({view,run,busy,bug:s,open,onClose,onPrevious,onNext,active=true}:{active?:boolean;view:GameViewV2;run:RunV2;busy:boolean;bug:Specimen;open?:(name:string)=>void;onClose:()=>void;onPrevious?:()=>void;onNext?:()=>void}){
 const p=view.player,g=p.go!,go=s.go!,info=useInfo(),win=useWindowDimensions();
 const [sheet,setSheet]=useState<Section|null>(null),[renaming,setRenaming]=useState(false),[nickname,setNickname]=useState(''),[powerSteps,setPowerSteps]=useState(1),[powerOpen,setPowerOpen]=useState(false),[mode,setMode]=useState<'2D'|'3D'>('2D'),[box,setBox]=useState({w:Math.min(560,win.width),h:win.height});
 const st=stats(s),key=family(s.species),evo=EVOLUTIONS[s.species],candy=g.candy[key]??0,xl=g.xl[key]??0,name=species(s.species).name;
 const maxPowerSteps=Math.min(10,Math.max(0,Math.round((50-go.level)*2))),steps=Math.min(powerSteps,Math.max(1,maxPowerSteps)),cost=powerCost(go.level,steps),nextStats=cost?stats(s,{...go,level:go.level+steps*.5}):st,nextCP=nextStats.cp;
 /** PoGO multi power-up: the most steps (≤10) you can pay for right now. */
 const affordable=(n:number)=>{const c=powerCost(go.level,n);return !!c&&g.dust>=c.dust&&candy>=c.candy&&xl>=c.xl;},maxAffordable=(()=>{let n=0;for(let i=1;i<=maxPowerSteps;i++)if(affordable(i))n=i;return n;})(),one=powerCost(go.level,1);
 const canPower=maxAffordable>0,canEvolve=!!evo&&candy>=evo.candy,deployed=!!g.gyms?.deployed.some(d=>d.specimen===s.id),second=secondCost(s.species),maxStats=stats(s,{...go,level:50});
 const trimmed=nickname.trim(),validNickname=Array.from(trimmed).length<=18&&/^[\p{L}\p{N} _'-]*$/u.test(trimmed);
 const estimate=380+(evo?68:0)+(renaming?70:0),photoH=Math.round(Math.max(240,Math.min(box.h*.56,box.h-estimate))),artW=Math.min(300,box.w-96);

 useGoBack(active&&(!!sheet||renaming||powerOpen),()=>{if(powerOpen)setPowerOpen(false);else if(sheet)setSheet(null);else setRenaming(false);return true;},20);

 const action=(type:string,params:Record<string,unknown>={},onOk?:()=>void)=>{if(deployed&&['goPower','goSecond','goTM','goEquip','goEvolve'].includes(type)){info.show({title:'Gymverdediger',icon:'shield',body:'🛡️ Zit in een gym.\n⏱ Terug na een nederlaag of na 8 uur.'});return;}void run(type,{id:s.id,...params}).then(ok=>{if(ok)onOk?.();});};
 const power=()=>{if(deployed){action('goPower');return;}setPowerSteps(1);setPowerOpen(true);};
 const confirmPower=()=>{if(!cost||!affordable(steps))return;action('goPower',{steps},()=>setPowerOpen(false));};
 const saveNickname=()=>{if(!validNickname)return;info.show({title:trimmed?'Bijnaam bewaren?':'Bijnaam verwijderen?',icon:'info',body:trimmed?name+' heet voortaan '+trimmed+'.':'Deze bug heet weer '+name+'.',action:{label:trimmed?'Bewaar bijnaam':'Verwijder bijnaam',onPress:()=>{void run('goRename',{id:s.id,name:trimmed}).then(ok=>{if(ok){setRenaming(false);info.hide();}});}}});};
 const changeMove=(slot:'fast'|number)=>{const pool=movePool(s.species),options=slot==='fast'?pool.fast.filter(m=>m!==go.fast).map(m=>FAST[m].name):pool.charged.filter(m=>!go.charged.includes(m)).map(m=>CHARGED[m].name);info.show({title:'Andere aanval?',icon:'attack',body:'📀 Kost 1 '+(slot==='fast'?'snelle':'speciale')+' TM.\n🎲 Nieuw: '+options.join(' of ')+'.',action:{label:'Gebruik TM',onPress:()=>action('goTM',{slot},info.hide)}});};
 const startRename=()=>{setSheet(null);setNickname(s.nickname??'');setRenaming(true);};
 const releaseBlocked=busy||s.favorite||s.shiny||s.id===p.buddy||g.team.includes(s.id)||deployed;
 const release=()=>info.show({title:'Vrijlaten?',icon:'leaf',body:'Dit exemplaar verdwijnt en geeft 1 '+familyName(key)+'-nectar. Dit kun je niet terugdraaien.',action:{label:'Laat vrij',onPress:()=>{void run('goTransfer',{id:s.id}).then(ok=>{if(ok)info.hide();});}}});

 const edge=(style:object,child:React.ReactNode)=><View style={[{position:'absolute'},style]}>{child}</View>;
 const choices:{id:Section;icon:GameIconName;label:string}[]=[{id:'moves',icon:'attack',label:'Aanvallen'},{id:'items',icon:'bag',label:'Item'},{id:'iv',icon:'info',label:'Beoordelen'},...(evo?[{id:'evolve' as const,icon:'power' as const,label:'Evolutie'}]:[])];

 return <View testID={'go-detail-'+s.id} onLayout={e=>{const {width,height}=e.nativeEvent.layout;if(Math.abs(height-box.h)>1||Math.abs(width-box.w)>1)setBox({w:width,h:height});}} style={{flex:1,backgroundColor:PO.surface}}>
  <ScrollView style={{flex:1,marginBottom:80}} contentContainerStyle={{flexGrow:1}}>
   <View style={{height:photoH,overflow:'hidden',backgroundColor:'#5E8C4A'}}>
    <Scene index={0}/>
    {active&&s.shiny&&<View pointerEvents="none" style={{position:'absolute',inset:0,opacity:.5}}><ShinyBackdropV2/></View>}
    <View pointerEvents="none" style={{position:'absolute',left:0,right:0,top:14,alignItems:'center'}}><View accessibilityLabel={'CP '+st.cp} style={{flexDirection:'row',alignItems:'baseline',gap:6}}><Text style={[poText.onPhoto,{fontSize:18,fontWeight:'600'}]}>CP</Text><Text style={[poText.onPhoto,{fontSize:46,fontWeight:'300',letterSpacing:.5}]}>{st.cp}</Text>{s.shiny&&<ShinyMarkV2 size={26}/>}</View></View>
    <View pointerEvents="none" style={{position:'absolute',left:'50%',bottom:52,width:artW*.62,height:30,marginLeft:-artW*.31,borderRadius:artW,backgroundColor:'#1A2A1238',boxShadow:'0px 0px 18px 10px #1A2A1230'}}/>
    <View style={{position:'absolute',left:'50%',marginLeft:-artW/2,width:artW,top:72,bottom:40,alignItems:'center',justifyContent:'center'}}><BugUpgradeFxV3 id={s.id} species={s.species} shiny={s.shiny} cp={st.cp} size={Math.min(artW,photoH-120)}><CollectionArtV2 visible={active} id={s.species} shiny={s.shiny} size={Math.min(artW,photoH-120)} mode={mode}/></BugUpgradeFxV3></View>
    {edge({left:14,top:16,gap:10},<>
     <PoCircle size={44} label="Favoriet" ring={s.favorite?PO.gold:undefined} onPress={()=>action('favorite')}><Glyph name="star" size={28}/></PoCircle>
     <PoCircle size={44} label="Als buddy" ring={p.buddy===s.id?PO.raid:undefined} onPress={()=>{if(p.buddy!==s.id)action('buddy');else info.show({title:'Buddy',icon:'heart',body:'❤️ Dit is je buddy.'});}}><Glyph name="heart" size={28}/></PoCircle>
     {deployed&&<PoCircle size={44} label="Verdedigt een gym" onPress={()=>info.show({title:'Gymverdediger',icon:'shield',body:'🛡️ Zit in een gym.\n⏱ Terug na een nederlaag of na 8 uur, met 🪙 munten.'})}><Glyph name="shield" size={28}/></PoCircle>}
    </>)}
    {edge({right:14,top:16},<PoCircle size={44} label="Bugacties" onPress={()=>setSheet(sheet?null:'moves')}><View style={{gap:4}}>{[0,1,2].map(n=><View key={n} style={{width:20,height:3,borderRadius:2,backgroundColor:PO.text}}/>)}</View></PoCircle>)}
    {onPrevious&&edge({left:10,top:photoH/2-8},<PoCircle size={40} label="Vorige bug" onPress={()=>{if(!busy)onPrevious();}}><Glyph name="back" size={26}/></PoCircle>)}
    {onNext&&edge({right:10,top:photoH/2-8},<PoCircle size={40} label="Volgende bug" onPress={()=>{if(!busy)onNext();}}><Glyph name="next" size={26}/></PoCircle>)}
    {edge({right:14,bottom:42},<PoCircle size={44} label={mode==='2D'?'Bekijk 3D':'Bekijk 2D'} onPress={()=>setMode(mode==='2D'?'3D':'2D')}><Text style={t(14,'800',PO.tealText)}>{mode==='2D'?'3D':'2D'}</Text></PoCircle>)}
   </View>

   <PoSheet style={{marginTop:-28,flexGrow:1,alignItems:'center',paddingBottom:20}}>
    {renaming?<View style={{alignSelf:'stretch',gap:8}}>
     <TextInput placeholderTextColor={PO.muted} selectionColor={PO.teal} accessibilityLabel="Bijnaam" placeholder={name} autoCapitalize="words" autoCorrect={false} autoFocus value={nickname} editable={!busy} onChangeText={setNickname} onSubmitEditing={()=>{if(!busy&&trimmed!==(s.nickname??''))saveNickname();}} style={{fontFamily:font,height:50,borderRadius:25,paddingHorizontal:18,fontSize:18,color:PO.text,backgroundColor:PO.bg,borderWidth:2,borderColor:validNickname?PO.rim:PO.raid,textAlign:'center'}}/>
     <Text style={[t(12,'600',validNickname?PO.muted:PO.raid),{textAlign:'center'}]}>{validNickname?'Max. 18 tekens · leeg = soortnaam':'Max. 18 letters, cijfers, spaties, _ - of \''}</Text>
     <View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><PoPill variant="ghost" height={46} label="Annuleren" disabled={busy} onPress={()=>setRenaming(false)}/></View><View style={{flex:1}}><PoPill height={46} label="Bewaren" disabled={busy||!validNickname||trimmed===(s.nickname??'')} onPress={saveNickname}/></View></View>
    </View>:<Pressable accessibilityRole="button" accessibilityLabel="Bijnaam wijzigen" disabled={busy} onPress={startRename} style={{alignItems:'center',minHeight:40,justifyContent:'center'}}>
     <Text numberOfLines={1} style={[poText.title,{maxWidth:box.w-60}]}>{s.nickname||name}</Text>{!!s.nickname&&<Text style={t(13,'600',PO.muted)}>{name}</Text>}
    </Pressable>}
    <View accessibilityLabel={'HP buiten gevecht: '+st.hp} style={{width:'68%',alignItems:'center',gap:5}}><PoBar value={st.hp} max={st.hp}/><Text style={t(13,'600',PO.muted)}>{st.hp+' / '+st.hp+' HP'}</Text></View>
    <View testID="bug-resources" accessibilityLabel={g.dust+' stof, '+candy+' '+familyName(key)+'-nectar'+(xl>0?', '+xl+' XL-nectar':'')} style={{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:34}}>
     <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Glyph name="nectar" size={34}/><Text style={t(20)}>{g.dust.toLocaleString('nl-NL')}</Text></View>
     <View style={{flexDirection:'row',alignItems:'center',gap:8}}><CandyIconV2 family={key} size={34}/><Text style={t(20)}>{candy}</Text></View>
     {xl>0&&<View style={{flexDirection:'row',alignItems:'center',gap:8}}><CandyIconV2 family={key} size={30} xl/><Text style={t(20)}>{xl}</Text></View>}
    </View>
    <View testID="bug-quick-actions" style={{alignSelf:'stretch',flexDirection:'row',gap:8}}>{([{id:'iv',icon:'info',label:'Beoordeel'},{id:'moves',icon:'attack',label:'Aanvallen'},{id:'items',icon:'bag',label:'Item'}] as const).map(c=><Pressable key={c.id} accessibilityRole="button" accessibilityLabel={c.id==='moves'?'Aanvallen en TM':c.label} onPress={()=>setSheet(c.id)} style={{flex:1,minHeight:64,alignItems:'center',justifyContent:'center',gap:4,borderRadius:16,borderWidth:1,borderColor:PO.rim,backgroundColor:PO.bg}}><Glyph name={c.icon} size={25}/><Text style={t(12)}>{c.label}</Text></Pressable>)}</View>
    <View testID="power-block" style={{alignSelf:'stretch',gap:8}}>
     <PoPill height={62} icon="power" label={one?'Sterker':'Max!'} accessibilityLabel="Sterker maken" disabled={busy||!canPower} onPress={power} right={one?<>
      <Glyph name="nectar" size={20}/><Text style={t(14,'800',PO.white)}>{short(one.dust)}</Text>
      <CandyIconV2 family={key} size={20}/><Text style={t(14,'800',PO.white)}>{one.candy}</Text>
      {one.xl>0&&<><CandyIconV2 family={key} size={20} xl/><Text style={t(14,'800',PO.white)}>{one.xl}</Text></>}
     </>:undefined}/>
     {maxAffordable>1&&<Text style={[t(13,'600',PO.muted),{textAlign:'center'}]}>{'Tot '+maxAffordable+'× in één keer'}</Text>}
    </View>
    {evo&&<View style={{alignSelf:'stretch'}}><PoPill variant="ghost" height={54} icon="power" label="Evolueer" disabled={busy} onPress={()=>setSheet('evolve')} right={<><CandyIconV2 family={key} size={20}/><Text style={t(14,'800',canEvolve?PO.tealText:PO.muted)}>{candy+' / '+evo.candy}</Text></>}/></View>}
   </PoSheet>
  </ScrollView>
  <Modal transparent visible={active&&powerOpen} animationType="slide" onRequestClose={()=>setPowerOpen(false)}>
   <Pressable accessibilityRole="button" accessibilityLabel="Sluit sterker maken" onPress={()=>setPowerOpen(false)} style={{flex:1,backgroundColor:'#0B1D1866'}}/>
   <PoSheet style={{alignItems:'center',paddingBottom:22,gap:14,backgroundColor:'#0E2828'}}>
    <View testID="power-sheet" accessibilityLabel={'CP '+st.cp+' wordt '+nextCP} style={{flexDirection:'row',alignItems:'baseline',gap:10}}>
     <Text style={t(18,'600',PO.muted)}>{'CP '+st.cp}</Text><Text style={t(20,'700',PO.muted)}>→</Text><Text style={[t(40,'400',PO.tealText),{fontWeight:'300'}]}>{'CP '+nextCP}</Text>
    </View>
    <Text style={t(13,'600',PO.muted)}>{'HP '+st.hp+' → '+nextStats.hp+'  ·  Lv. '+go.level+' → '+(go.level+steps*.5)}</Text>
    <View style={{flexDirection:'row',alignItems:'center',gap:18}}>
     <PoCircle size={52} label="Minder power-ups" style={{opacity:steps<=1?.4:1}} onPress={()=>{if(steps>1)setPowerSteps(steps-1);}}><Text style={t(28,'700',PO.tealText)}>−</Text></PoCircle>
     <Text accessibilityLabel={steps+' power-ups'} style={[t(34,'800'),{minWidth:70,textAlign:'center'}]}>{steps+'×'}</Text>
     <PoCircle size={52} label="Meer power-ups" style={{opacity:steps>=maxAffordable?.4:1}} onPress={()=>{if(steps<maxAffordable)setPowerSteps(steps+1);}}><Text style={t(28,'700',PO.tealText)}>+</Text></PoCircle>
     <PoCircle size={52} label="Maximaal" ring={steps===maxAffordable?PO.teal:undefined} onPress={()=>setPowerSteps(Math.max(1,maxAffordable))}><Text style={t(13,'800',PO.tealText)}>MAX</Text></PoCircle>
    </View>
    {cost&&<View style={{flexDirection:'row',alignItems:'center',gap:8}}>
     <Glyph name="nectar" size={24}/><Text style={t(17)}>{cost.dust.toLocaleString('nl-NL')}</Text>
     <CandyIconV2 family={key} size={24}/><Text style={t(17)}>{cost.candy}</Text>
     {cost.xl>0&&<><CandyIconV2 family={key} size={24} xl/><Text style={t(17)}>{cost.xl}</Text></>}
    </View>}
    {!!powerUpLeagueWarning(st.cp,nextCP)&&<Text style={[t(13,'600',PO.raid),{textAlign:'center'}]}>{powerUpLeagueWarning(st.cp,nextCP)}</Text>}
    <View style={{alignSelf:'stretch'}}><PoPill height={62} icon="power" label={'Sterker '+steps+'×'} accessibilityLabel="Bevestig sterker maken" disabled={busy||!cost||!affordable(steps)} onPress={confirmPower}/></View>
    <PoClose label="Annuleren" onPress={()=>setPowerOpen(false)}/>
   </PoSheet>
  </Modal>
  <View pointerEvents="box-none" style={{position:'absolute',left:0,right:0,bottom:16,alignItems:'center'}}><PoClose label="Sluit bug" onPress={onClose}/></View>

  {sheet&&<View style={{position:'absolute',left:0,right:0,top:0,bottom:0}}>
   <Pressable accessibilityRole="button" accessibilityLabel="Sluit menu" onPress={()=>setSheet(null)} style={{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'#1E3C3247'}}/>
   <PoSheet style={{position:'absolute',left:0,right:0,bottom:0,maxHeight:'84%',paddingHorizontal:0,paddingBottom:0,gap:10}}>
    <View testID="bug-tabs" style={{flexDirection:'row',justifyContent:'space-around',paddingHorizontal:10}}>{choices.map(c=><Pressable key={c.id} accessibilityRole="button" accessibilityLabel={c.label} accessibilityState={{selected:sheet===c.id}} onPress={()=>setSheet(c.id)} style={{alignItems:'center',gap:5,minWidth:64}}>
     <PoCircle size={54} label={c.label} ring={sheet===c.id?PO.teal:undefined}><Glyph name={c.icon} size={36}/></PoCircle>
     <Text style={t(12,'700',sheet===c.id?PO.tealText:PO.muted)}>{c.label}</Text>
    </Pressable>)}</View>
    <ScrollView style={{flexGrow:0,flexShrink:1}} contentContainerStyle={{paddingHorizontal:20,paddingTop:6,paddingBottom:8,gap:12}}>
     {sheet==='moves'&&<>
      <MoveRow icon={GO_TYPES[FAST[go.fast].type].icon} name={'⚡ '+FAST[go.fast].name} line={'⚔️ '+FAST[go.fast].power+'  ·  ⚡ +'+FAST[go.fast].energy+'  ·  '+FAST[go.fast].turns*.5+'s'} tms={g.fastTMs} label="Wijzig snelle aanval" disabled={busy||g.fastTMs<1} onPress={()=>changeMove('fast')}/>
      {go.charged.map((move,i)=><MoveRow key={i} icon={GO_TYPES[CHARGED[move].type].icon} name={'💥 '+CHARGED[move].name} line={'⚔️ '+CHARGED[move].power+'  ·  ⚡ −'+CHARGED[move].energy} tms={g.chargedTMs} label={'Wijzig opgeladen aanval '+(i+1)} disabled={busy||g.chargedTMs<1} onPress={()=>changeMove(i)}/>)}
      {go.charged.length===1&&<PoPill variant="ghost" height={50} label="Nieuwe aanval" accessibilityLabel={'Nieuwe aanval · '+second.dust+' stof, '+second.candy+' nectar'} disabled={busy||g.dust<second.dust||candy<second.candy} onPress={()=>info.show({title:'Tweede aanval',icon:'burst',body:'✨ '+second.dust.toLocaleString('nl-NL')+' Stof · 🍯 '+second.candy+' '+familyName(key)+'-nectar\n💥 Je krijgt een extra speciale aanval. De huidige blijft.',action:{label:'Ontgrendel aanval',onPress:()=>action('goSecond',{},info.hide)}})} right={<><Glyph name="nectar" size={18}/><Text style={t(13,'800',PO.tealText)}>{short(second.dust)}</Text><CandyIconV2 family={key} size={18}/><Text style={t(13,'800',PO.tealText)}>{second.candy}</Text></>}/>}
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>{open?<PoPill variant="ghost" height={44} icon="swords" label="Naar Strijd" onPress={()=>open('ranked')}/>:<View/>}<InfoDot title="Aanvallen" body={'⚡ Snelle aanval: schade + energie.\n💥 Speciale aanval: kost energie, raakt hard.\n📀 TM: wisselt een aanval (willekeurig).\n🎁 TM\'s: onderzoek, levels, dagbazen en het eerste Ranked-duel van de dag.'}/></View>
     </>}
     {sheet==='items'&&<>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'space-between'}}>{Object.entries(HELD).map(([id,h])=>{const item=id as Held,active=go.item===item,free=Math.max(0,g.items[item]-p.specimens.filter(b=>b.go?.item===item).length),preview=stats(s,{...go,item}),available=active||free>0;return <Pressable key={id} accessibilityRole="button" accessibilityLabel={'Rust '+h.name+' uit'} accessibilityState={{selected:active}} disabled={busy} onPress={()=>info.show({title:h.name,icon:h.icon,body:h.hint+'\nCP '+st.cp+' → '+preview.cp+' · HP '+st.hp+' → '+preview.hp+(powerUpLeagueWarning(st.cp,preview.cp)?'\n'+powerUpLeagueWarning(st.cp,preview.cp):'')+'\n'+(active?'✅ Uitgerust':free>0?'🎒 '+free+' vrij':g.items[item]>0?'🔒 Alle in gebruik':'🔒 Nog niet gevonden'),action:available&&!active?{label:'Rust uit',onPress:()=>action('goEquip',{item},info.hide)}:undefined})} style={{width:'23%',minWidth:0,paddingVertical:8,alignItems:'center',gap:2,borderRadius:18,backgroundColor:active?'#1FC3D326':PO.bg,borderWidth:2,borderColor:active?PO.teal:'transparent',opacity:available?1:.5}}>
       <Glyph name={h.icon} size={40}/><Text numberOfLines={1} adjustsFontSizeToFit style={[t(11,'700'),{maxWidth:'94%'}]}>{h.name}</Text><Text style={t(11,'700',active?PO.tealText:PO.muted)}>{active?'✓':'×'+free}</Text>
      </Pressable>;})}</View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>{go.item?<PoPill variant="ghost" height={44} label="Item af" disabled={busy} onPress={()=>action('goEquip',{item:null})}/>:<View/>}<InfoDot title="Held items" body={'🎒 Eén item per bug. Telt mee in CP.\n🍀 Vangst: 1 op 25 kans op een item. Ook uit je eerste cocon en de Meester-dagbaas.\n🔄 Wisselen en afdoen is gratis.'}/></View>
     </>}
     {sheet==='iv'&&<>
      <View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:8}}><GoTypes species={s.species} compact/><RarityBadgeV2 species={s.species}/><Chip text={'Lv. '+go.level}/>{s.shiny&&<Chip text="✦ Shiny"/>}{deployed&&<Chip text="🛡️ Gym"/>}</View>
      <BugStrengthV2 player={p} bug={s} nextCp={cost?nextCP:undefined} onDetails={()=>{}}/>
      <CollectionStatsV2 onPress={()=>{}} values={[{label:'Aanval',value:st.attack,max:maxStats.attack,color:'#E7AF73'},{label:'Verdediging',value:st.defense,max:maxStats.defense,color:'#8FB2DB'},{label:'HP',value:st.hp,max:maxStats.hp,color:'#7FCB8E'}]}/>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={t(16,'800')}>{(appraisal(s)===4?'Perfect':'★'.repeat(appraisal(s))+'☆'.repeat(Math.max(0,3-appraisal(s))))+'  ·  '+Math.round(go.iv.reduce((a,b)=>a+b,0)/45*100)+'%'}</Text><InfoDot title="Stats en IV" body={'⚔️ Aanval: meer schade.\n🛡️ Verdediging en ❤️ HP: langer volhouden.\n📊 IV = vaste aanleg (0–15). Sterker maken verandert die niet.'}/></View>
      {go.iv.map((n,i)=><View key={i} style={{gap:4}}><View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={t(12,'600',PO.muted)}>{['Aanval','Verdediging','HP'][i]}</Text><Text style={t(12,'800')}>{n}/15</Text></View><View accessibilityRole="progressbar" accessibilityLabel={['Aanval','Verdediging','HP'][i]+' IV'} accessibilityValue={{min:0,max:15,now:n}} aria-valuemin={0} aria-valuemax={15} aria-valuenow={n}><PoBar value={n} max={15} color={n===15?'#F08A6B':PO.gold}/></View></View>)}
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>{s.obtainedAt>0?<Text style={t(12,'600',PO.muted)}>{'📅 '+new Date(s.obtainedAt).toLocaleDateString('nl-NL',{dateStyle:'medium'})}</Text>:<View/>}{s.catchLocation&&<PoPill variant="ghost" height={40} icon="compass" label="Vangplek" onPress={()=>info.show({title:s.catchLocation?.boss?'Gevangen kaartbaas':'Vangplek',icon:'compass',body:'📍 '+s.catchLocation!.lat.toFixed(5)+', '+s.catchLocation!.lng.toFixed(5)})}/>}</View>
      <View style={{flexDirection:'row',gap:10}}><View style={{flex:1}}><PoPill variant="ghost" height={46} label="Bijnaam" disabled={busy} onPress={startRename}/></View><View style={{flex:1}}><PoPill variant="ghost" height={46} icon="leaf" label="Vrijlaten" disabled={releaseBlocked} onPress={release}/></View></View>
      {releaseBlocked&&!busy&&<Text style={[t(11,'600',PO.muted),{textAlign:'center'}]}>🔒 Favoriet, shiny, buddy, team en gym blijven veilig.</Text>}
     </>}
     {sheet==='evolve'&&evo&&<>
      <CollectionEvolutionV2 id={s.species} shiny={s.shiny}/>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',flexWrap:'wrap',gap:14}}>{usesSharedEvolutionModel(evo.to)&&<Chip text="⭐ Elite"/>}<Text style={t(18,'800')}>{'CP '+st.cp+' → '+stats({...s,species:evo.to}).cp}</Text><View accessibilityLabel={evo.candy+' '+familyName(key)+'-nectar'} style={{flexDirection:'row',alignItems:'center',gap:4}}><CandyIconV2 family={key} size={28}/><Text style={t(16,'800',candy>=evo.candy?PO.text:PO.raid)}>{candy+' / '+evo.candy}</Text></View><InfoDot title="Evolueren" body={'🦋 Nieuwe vorm, meer CP.\n✦ Shiny, level, aanleg en item blijven.\n🍯 Na evolueren krijg je 1 nectar terug.'}/></View>
      {!!powerUpLeagueWarning(st.cp,stats({...s,species:evo.to}).cp)&&<Text style={[t(12,'700','#C77A1E'),{textAlign:'center'}]}>{powerUpLeagueWarning(st.cp,stats({...s,species:evo.to}).cp)}</Text>}
      <PoPill height={58} icon="power" label="Bevestig evolutie" disabled={busy||candy<evo.candy} onPress={()=>action('goEvolve',{},()=>setSheet(null))}/>
     </>}
    </ScrollView>
    <View style={{alignItems:'center',paddingTop:4,paddingBottom:16}}><PoClose label="Sluit menu" onPress={()=>setSheet(null)}/></View>
   </PoSheet>
  </View>}
 </View>;
}

function Chip({text}:{text:string}){return <View style={{paddingHorizontal:10,paddingVertical:4,borderRadius:12,backgroundColor:PO.bg}}><Text style={{fontFamily:font,fontSize:12,fontWeight:'700',color:PO.text}}>{text}</Text></View>;}

function MoveRow({icon,name,line,tms,label,disabled,onPress}:{icon:GameIconName;name:string;line:string;tms:number;label:string;disabled:boolean;onPress:()=>void}){
 return <View style={{flexDirection:'row',alignItems:'center',gap:10,padding:10,borderRadius:20,backgroundColor:PO.bg}}>
  <Glyph name={icon} size={34}/>
  <View style={{flex:1,minWidth:0,gap:2}}><Text numberOfLines={1} style={{fontFamily:font,fontSize:16,fontWeight:'800',color:PO.text}}>{name}</Text><Text style={{fontFamily:font,fontSize:12,fontWeight:'600',color:PO.muted}}>{line}</Text></View>
  <PoPill variant="ghost" height={40} label={'TM '+tms} accessibilityLabel={label} disabled={disabled} onPress={onPress}/>
 </View>;
}
