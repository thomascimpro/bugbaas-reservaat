import React,{useState} from 'react';
import {Pressable,Text,TextInput,View} from 'react-native';
import {NAME_ENDINGS,NAME_IDEAS,OUTFITS,STARTER_INFO,STARTER_PARTNERS,trainerPalette,type OutfitId,type TrainerAvatar} from '../game/avatarV2';
import {species} from '../game/catalogV2';
import {SpriteView} from './artV2';
import {AvatarChoices,OutfitChoices,TrainerPortrait} from './AvatarV2';
import {BrandMark} from './gameUiArt';
import {GoTypes} from './GoTypeV2';
import type {RunV2} from './ShopViewV2';
import {Button,Label,Panel,V,v} from './uiV2';

const VALID=/^[\p{L}\p{N} _-]{2,18}$/u;
const suggestName=()=>{const a=NAME_IDEAS[Math.floor(Math.random()*NAME_IDEAS.length)],b=NAME_ENDINGS[Math.floor(Math.random()*NAME_ENDINGS.length)];return (a+b).slice(0,15)+(Math.random()<.5?String(Math.floor(Math.random()*90)+10):'');};

/** Three short steps for a new player: who you are, your name, your first partner. Nothing is saved until the last step. */
export function OnboardingV2({busy,run,cloud,onAccount}:{busy:boolean;run:RunV2;cloud:boolean;onAccount:()=>void}){
 const [step,setStep]=useState(0),[avatar,setAvatar]=useState<TrainerAvatar>('fern'),[outfit,setOutfit]=useState<OutfitId>('moss'),[name,setName]=useState(''),[starter,setStarter]=useState<typeof STARTER_PARTNERS[number]|null>(null);
 const trimmed=name.trim(),validName=VALID.test(trimmed),ring=trainerPalette(avatar,outfit).trim;
 const dots=<View accessibilityLabel={'Stap '+(step+1)+' van 3'} style={{flexDirection:'row',justifyContent:'center',gap:6}}>{[0,1,2].map(i=><View key={i} style={{width:i===step?26:9,height:9,borderRadius:5,backgroundColor:i<=step?'#F2D16E':'#FFFFFF44'}}/>)}</View>;
 return <View testID={'onboarding-step-'+step} style={{gap:12}}>
  <View style={{alignItems:'center',gap:6}}><BrandMark width={step===0?200:150}/>{dots}</View>
  {step===0&&<>
   <View style={{alignItems:'center'}}><View style={{padding:5,borderRadius:56,borderWidth:4,borderColor:ring}}><TrainerPortrait avatar={avatar} outfit={outfit} size={180}/></View></View>
   <Panel><Text style={{fontSize:20,fontWeight:'800',color:V.ink,textAlign:'center'}}>Wie ben jij?</Text><Label small center>Kies je ranger en de kleur van je outfit. Die zie je ook op de kaart.</Label><AvatarChoices value={avatar} outfit={outfit} onChange={setAvatar} disabled={busy}/><OutfitChoices value={outfit} onChange={setOutfit} disabled={busy}/><Button disabled={busy} onPress={()=>setStep(1)}>Volgende</Button>{cloud&&<Button small secondary disabled={busy} onPress={onAccount}>Ik heb al een account</Button>}</Panel>
  </>}
  {step===1&&<Panel>
   <View style={{alignItems:'center'}}><TrainerPortrait avatar={avatar} outfit={outfit} size={110}/></View>
   <Text style={{fontSize:20,fontWeight:'800',color:V.ink,textAlign:'center'}}>Hoe heet je?</Text>
   <View style={{flexDirection:'row',gap:8,alignItems:'center'}}><TextInput accessibilityLabel="Spelnaam" placeholder="Jouw spelnaam" placeholderTextColor="#B7CAB6" selectionColor="#A5CE87" maxLength={18} value={name} onChangeText={setName} style={[v.input,{flex:1}]}/><Pressable accessibilityRole="button" accessibilityLabel="Verzin een naam" testID="name-dice" disabled={busy} onPress={()=>setName(suggestName())} style={{width:52,height:52,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:'#315B49',borderWidth:1,borderColor:'#E9D6A2'}}><Text style={{fontSize:26}}>🎲</Text></Pressable></View>
   <Label small color={!trimmed||validName?V.muted:'#FFB9A5'}>{!trimmed||validName?'2 tot 18 letters of cijfers. Geen echte achternaam nodig!':'Gebruik alleen letters, cijfers, spaties, _ of -.'}</Label>
   <View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button secondary disabled={busy} onPress={()=>setStep(0)}>Terug</Button></View><View style={{flex:1}}><Button disabled={busy||!validName} onPress={()=>setStep(2)}>Volgende</Button></View></View>
  </Panel>}
  {step===2&&<Panel>
   <Text style={{fontSize:20,fontWeight:'800',color:V.ink,textAlign:'center'}}>Kies je eerste maatje</Text>
   <Label small center>Je maatje wordt je buddy en loopt met je mee. Daarna ga je zelf bugs vangen!</Label>
   <View style={{gap:8}}>{STARTER_PARTNERS.map(id=>{const selected=starter===id;return <Pressable key={id} testID={'starter-'+id} accessibilityRole="button" accessibilityLabel={'Kies '+species(id).name} accessibilityState={{selected}} disabled={busy} onPress={()=>setStarter(id)} style={{flexDirection:'row',alignItems:'center',gap:10,padding:9,borderRadius:20,borderWidth:2,borderColor:selected?'#F2D16E':'#72927955',backgroundColor:selected?'#365D45':'#163D33'}}>
    <SpriteView id={id} size={78} animate={selected}/>
    <View style={{flex:1,gap:4}}><Label bold>{species(id).name}</Label><View pointerEvents="none"><GoTypes species={id} compact/></View><Label small>{STARTER_INFO[id]}</Label></View>
    {selected&&<Text style={{fontSize:22}}>👍</Text>}
   </Pressable>;})}</View>
   <View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button secondary disabled={busy} onPress={()=>setStep(1)}>Terug</Button></View><View style={{flex:1}}><Button disabled={busy||!starter||!validName} onPress={()=>void run('profile',{name:trimmed,avatar,outfit,starter})}>Begin avontuur</Button></View></View>
  </Panel>}
 </View>;
}
