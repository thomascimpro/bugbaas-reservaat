import React,{useState} from 'react';
import {ScrollView,TextInput,View} from 'react-native';
import type {GameViewV2} from '../game/typesV2';
import type {RememberedAccountV2} from './accountSessionV2';
import {googleLoginV2,googleSignInAvailable,loginV2,startNewGuestV2} from './client';
import {accountError} from './GoAccountV2';
import {BrandMark} from './gameUiArt';
import {Scene} from './artV2';
import {Button,Label,Panel,Title,Wash,useInfo,v} from './uiV2';
export function AccountRecoveryV2({account,busy,change}:{account:RememberedAccountV2;busy:boolean;change:(work:()=>Promise<GameViewV2>)=>Promise<void>}){
 const info=useInfo(),[working,setWorking]=useState(false),[email,setEmail]=useState(account.email??''),[password,setPassword]=useState(''),[form,setForm]=useState(!googleSignInAvailable),[error,setError]=useState('');
 async function signIn(work:()=>Promise<GameViewV2>){if(busy||working)return;setWorking(true);setError('');try{await change(work);}catch(e){setError(accountError(e));}finally{setWorking(false);}}
 return <ScrollView testID="account-recovery" contentContainerStyle={{flexGrow:1,justifyContent:'center',padding:22,gap:18}}><Scene/><Wash from="#082923BB" to="#071E1BF5"/><View style={{alignItems:'center'}}><BrandMark width={210}/></View><Panel style={{gap:14}}><Title>Welkom terug</Title><Label bold>{account.name}</Label><Label>Log in om je opgeslagen avontuur te openen.</Label>{googleSignInAvailable&&<Button disabled={busy||working} onPress={()=>void signIn(()=>googleLoginV2(false))}>Inloggen met Google</Button>}{!form?<Button small secondary onPress={()=>setForm(true)}>E-mailadres gebruiken</Button>:<><TextInput accessibilityLabel="E-mailadres" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} editable={!busy&&!working} placeholder="E-mailadres" placeholderTextColor="#9DB8B2" style={v.input}/><TextInput accessibilityLabel="Wachtwoord" autoCapitalize="none" secureTextEntry value={password} onChangeText={setPassword} editable={!busy&&!working} placeholder="Wachtwoord" placeholderTextColor="#9DB8B2" style={v.input}/><Button disabled={busy||working||!email.trim()||!password} onPress={()=>void signIn(()=>loginV2(email,password,false))}>Inloggen</Button></>}{!!error&&<Label color="#FFB9A5">{error}</Label>}<Button small secondary disabled={busy||working} onPress={()=>info.show({title:'Nieuw avontuur?',icon:'profile',body:'Je opgeslagen avontuur blijft bestaan. Je begint op dit apparaat met een nieuw gastprofiel.',action:{label:'Begin nieuw avontuur',onPress:()=>{info.hide();void signIn(startNewGuestV2);}}})}>Nieuw avontuur</Button></Panel></ScrollView>;
}
