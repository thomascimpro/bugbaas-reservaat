import React,{useEffect,useState} from 'react';
import {Linking,Modal,View} from 'react-native';
import Constants from 'expo-constants';
import {olderVersion} from '../game/versionV2';
import {serverMinClient} from './client';
import {Button,Label,Panel,Title} from './uiV2';

const RELEASES='https://github.com/thomascimpro/bugbaas-reservaat/releases/latest';
/** Blocks play when the server needs a newer app, so old builds cannot misread new game data. */
export function UpdateGateV2({connected}:{connected:boolean}){
 const [required,setRequired]=useState<string|undefined>();
 const current=Constants.expoConfig?.version;
 useEffect(()=>{if(connected)setRequired(serverMinClient());},[connected]);
 if(!olderVersion(current,required))return null;
 return <Modal visible transparent animationType="fade" onRequestClose={()=>{}}><View style={{flex:1,backgroundColor:'#071F1AE6',alignItems:'center',justifyContent:'center',padding:22}}><Panel style={{width:'100%',maxWidth:420}}><Title>Update nodig</Title><Label>Deze versie ({current}) kan de nieuwste spelgegevens niet veilig lezen. Installeer versie {required} of nieuwer; je voortgang blijft bewaard.</Label><Button icon="compass" onPress={()=>void Linking.openURL(RELEASES)}>Download de nieuwe versie</Button></Panel></View></Modal>;
}
