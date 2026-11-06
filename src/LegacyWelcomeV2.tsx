import React,{useEffect,useState} from 'react';
import {Image,Modal,View} from 'react-native';
import type {GameViewV2} from '../game/typesV2';
import type {LegacyReward} from '../game/legacyV2';
import type {RunV2} from './ShopViewV2';
import {checkLegacyV2} from './client';
import {Button,Counter,Label,Title} from './uiV2';

export function LegacyWelcomeV2({view,visible,run,busy,onUpdate}:{view:GameViewV2;visible:boolean;run:RunV2;busy:boolean;onUpdate:(view:GameViewV2)=>void}){
 const uid=view.player.uid,[offer,setOffer]=useState<{uid:string;reward:LegacyReward}|null>(null),[working,setWorking]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let alive=true;setOffer(null);setError('');if(view.mode!=='cloud'||!view.linked||view.player.legacy)return;void checkLegacyV2().then(result=>{if(alive&&result.offer)setOffer({uid,reward:result.offer});}).catch(()=>{/* This optional check must never block playing or signing in. */});return()=>{alive=false;};},[uid,view.linked,view.mode,!!view.player.legacy]);
 const reward=view.player.legacy??(offer?.uid===uid?offer.reward:null),received=!!view.player.legacy;
 const show=visible&&!!reward&&!view.player.legacy?.acknowledgedAt;
 async function claim(){if(working||busy)return;setWorking(true);setError('');try{const result=await checkLegacyV2(true);if(result.view&&result.view.player.uid===uid)onUpdate(result.view);else setError('Je oude account kon nog niet worden bevestigd.');}catch(e){setError(e instanceof Error?e.message:'Probeer opnieuw.');}finally{setWorking(false);}}
 return <Modal visible={show} transparent animationType={view.player.settings.reducedMotion?'none':'fade'} onRequestClose={()=>{if(received&&!busy)void run('legacySeen');else if(!working)setOffer(null);}}><View style={{flex:1,justifyContent:'center',padding:24,backgroundColor:'#031B18C9'}}>{reward&&<View testID="legacy-rewards" style={{padding:22,gap:16,borderRadius:28,backgroundColor:'#0E2D2D',borderWidth:1,borderColor:'#EAC66F',alignItems:'center'}}><Image source={require('../assets/v2/props/medal-goud.webp')} resizeMode="contain" style={{width:88,height:88}}/><Title>Welkom terug!</Title><Label small center>Bedankt voor je avontuur in de oude Bugbaas.</Label><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:14}}><Counter icon="nectar" value={'+'+reward.dust} label="Stof"/><Counter icon="leaf" value={'+'+reward.nets} label="Veldnetten"/><Counter icon="attack" value={'+'+(reward.fastTMs+reward.chargedTMs)} label="TM"/></View><Label small center>Je legacy-medaille staat bij je trainer.</Label>{error&&<Label color="#FFB9A5" small center>{error}</Label>}<View style={{alignSelf:'stretch'}}><Button disabled={working||busy} icon={received?'check':'gift'} onPress={()=>{if(received)void run('legacySeen');else void claim();}}>{working?'Ophalen…':received?'Klaar':'Ontvang'}</Button></View></View>}</View></Modal>;
}
