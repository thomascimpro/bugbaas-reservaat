import React,{useState} from 'react';
import {TextInput,View} from 'react-native';
import type {GameViewV2} from '../game/typesV2';
import {accountDetails,loginV2,logoutV2,resetAccountPassword,verifyAccountEmail,refreshAccountV2} from './client';
import {Button,Glyph,Label,Panel,useInfo,v} from './uiV2';

export function accountError(error:unknown){
 const code=(error as {code?:string})?.code;
 if(code==='auth/email-already-in-use'||code==='auth/credential-already-in-use')return 'Dit e-mailadres heeft al een account. Gebruik inloggen, of koppel je gastvoortgang aan een ander adres.';
 if(code==='auth/invalid-credential'||code==='auth/wrong-password'||code==='auth/user-not-found')return 'E-mailadres of wachtwoord klopt niet.';
 if(code==='auth/invalid-email')return 'Vul een geldig e-mailadres in.';
 if(code==='auth/weak-password')return 'Kies een wachtwoord van minimaal 6 tekens.';
 if(code==='auth/too-many-requests')return 'Te veel pogingen. Probeer het later opnieuw.';
 if(code==='auth/network-request-failed')return 'Geen verbinding. Je voortgang blijft bewaard.';
 return error instanceof Error&&!code?error.message:'Deze accountactie is niet gelukt. Probeer opnieuw.';
}
export function GoAccountV2({view,busy,change}:{view:GameViewV2;busy:boolean;change:(work:()=>Promise<GameViewV2>,close?:boolean)=>Promise<void>}){
 const info=useInfo(),[email,setEmail]=useState(accountDetails().email??''),[password,setPassword]=useState(''),[working,setWorking]=useState(false),[message,setMessage]=useState(''),[issue,setIssue]=useState(''),[,redraw]=useState(0),account=accountDetails(),disabled=busy||working,cloud=view.mode==='cloud';
 async function action(work:()=>Promise<unknown>,success=''){if(disabled)return;setWorking(true);setIssue('');setMessage('');try{await work();setMessage(success);redraw(n=>n+1);}catch(e){setIssue(accountError(e));}finally{setWorking(false);}}
 const login=()=>void action(()=>change(()=>loginV2(email,password,false)));
 function existing(){if(account.guest&&(view.player.field?.total.catches??0)>0){info.show({title:'Ander account openen?',icon:'profile',body:'Je opent de voortgang van dat account. Je huidige gastvangsten worden niet samengevoegd. Bewaar ze eerst met Koppel huidige voortgang als je ze wilt meenemen.',action:{label:'Open bestaand account',onPress:()=>{info.hide();login();}}});}else login();}
 if(!cloud)return <Panel><Glyph name="profile" size={64}/><Label>Accounts werken in de online versie. Je huidige lokale voortgang blijft behouden.</Label></Panel>;
 return <View style={{gap:14}}>
  <Panel><View style={{flexDirection:'row',alignItems:'center',gap:12}}><Glyph name="profile" size={54}/><View style={{flex:1,gap:4}}><Label bold>{account.guest?'Bewaar je avontuur':account.email}</Label><Label small>{account.guest?'Koppel je gastvoortgang voor een ander toestel.':account.verified?'E-mailadres bevestigd':'E-mailadres nog niet bevestigd'}</Label></View></View>
   <TextInput accessibilityLabel="E-mailadres" autoCapitalize="none" keyboardType="email-address" autoComplete="email" editable={!disabled} value={email} onChangeText={setEmail} placeholder="E-mailadres" style={v.input}/>
   <TextInput accessibilityLabel="Wachtwoord" secureTextEntry autoCapitalize="none" autoComplete="current-password" editable={!disabled} value={password} onChangeText={setPassword} placeholder="Wachtwoord" style={v.input}/>
   {account.guest&&<Button disabled={disabled||!email.trim()||password.length<6} onPress={()=>void action(()=>change(()=>loginV2(email,password,true)))}>Koppel huidige voortgang</Button>}
   <Button secondary disabled={disabled||!email.trim()||!password} onPress={existing}>Log in op bestaand account</Button>
   <Button small secondary disabled={disabled||!email.trim()} onPress={()=>void action(async()=>{try{await resetAccountPassword(email);}catch(e){if((e as {code?:string}).code!=='auth/user-not-found')throw e;}},'Als er een account bestaat, ontvang je een herstelmail. Controleer ook je spammap.')}>Wachtwoord vergeten</Button>
  </Panel>
  {!account.guest&&<Panel>
   {!account.verified&&<><Button disabled={disabled} icon="gift" onPress={()=>void action(verifyAccountEmail,'Bevestigingsmail verstuurd. Open de link en tik daarna op Controleer bevestiging.')}>Verstuur bevestigingsmail</Button><Button small secondary disabled={disabled} onPress={()=>void action(()=>change(refreshAccountV2,false), 'Account gecontroleerd.')}>Controleer bevestiging</Button></>}
   <Button secondary disabled={disabled} onPress={()=>info.show({title:'Uitloggen?',icon:'profile',body:'Je gekoppelde voortgang blijft in de cloud. Je kunt die terughalen met je e-mailadres en wachtwoord. Daarna start hier een nieuw gastprofiel.',action:{label:'Uitloggen',onPress:()=>{info.hide();void action(()=>change(logoutV2));}}})}>Uitloggen</Button>
  </Panel>}
  {!!message&&<Label center>{message}</Label>}{!!issue&&<Label center color="#8C372B">{issue}</Label>}{working&&<Label small center>Even verbinden…</Label>}
 </View>;
}
