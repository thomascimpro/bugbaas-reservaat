import Svg,{Path} from 'react-native-svg';
import React,{useState} from 'react';
import {Pressable,TextInput,View} from 'react-native';
import type {PlayerV2} from '../game/typesV2';
import {normalizeTrainerName,trainerDisplayName,validTrainerName} from '../game/trainerNameV2';
import type {RunV2} from './ShopViewV2';
import {Button,Label,v} from './uiV2';

export function TrainerNameV2({player,run,busy}:{player:PlayerV2;run:RunV2;busy:boolean}){
 const [editing,setEditing]=useState(false),[draft,setDraft]=useState(''),[issue,setIssue]=useState(''),[saving,setSaving]=useState(false),name=trainerDisplayName(player),disabled=busy||saving;
 const save=async()=>{if(disabled||!validTrainerName(draft))return;setIssue('');setSaving(true);try{if(await run('profile',{name:normalizeTrainerName(draft)},setIssue))setEditing(false);}finally{setSaving(false);}};
 if(!editing)return <Pressable accessibilityRole="button" accessibilityLabel="Wijzig spelnaam" disabled={disabled} onPress={()=>{setDraft(name==='Trainer'&&player.name!=='Trainer'?'':name);setIssue('');setEditing(true);}} style={{flexDirection:'row',alignItems:'center',gap:7,minHeight:44,flexShrink:1}}><View style={{flex:1,gap:2}}><Label small>Spelnaam</Label><Label bold>{name}</Label></View><Svg width={23} height={23} viewBox="0 0 24 24"><Path d="m16 3 5 5M4 20l5-1 12-12a2.2 2.2 0 0 0-5-3L4 16z" fill="none" stroke="#9CECF2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></Svg></Pressable>;
 return <View style={{gap:8}}><Label small>Spelnaam</Label><TextInput accessibilityLabel="Nieuwe spelnaam" value={draft} onChangeText={setDraft} maxLength={18} editable={!disabled} autoCapitalize="none" autoCorrect={false} placeholder="Jouw spelnaam" placeholderTextColor="#B7CAB6" selectionColor="#A5CE87" style={v.input}/><Label small>2 tot 18 letters of cijfers. Andere spelers zien deze naam.</Label><View style={{flexDirection:'row',gap:7}}><View style={{flex:1}}><Button small secondary disabled={disabled} onPress={()=>setEditing(false)}>Annuleren</Button></View><View style={{flex:1}}><Button small disabled={disabled||!validTrainerName(draft)} onPress={()=>void save()}>Opslaan</Button></View></View>{!!issue&&<Label small color="#FFB9A5">{issue}</Label>}</View>;
}
