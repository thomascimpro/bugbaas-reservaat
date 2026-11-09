import React,{useEffect,useState} from 'react';
import {ScrollView,View} from 'react-native';
import type {GameViewV2} from '../game/typesV2';
import type {RunV2} from './ShopViewV2';
import {GoCollectionV2,GoDexV2,GoBuddyV2} from './GoCollectionV2';
import {GoTeamPickerV2} from './GoTeamPickerV2';
import {TabsV2} from './TabsV2';
export type BugsSectionV3='collection'|'team'|'buddy'|'dex';
export function BugsHomeV3({view,run,busy,now,active,section,onSection,initialSpecimenId,onTargetConsumed,open}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;active:boolean;section:BugsSectionV3;onSection:(s:BugsSectionV3)=>void;initialSpecimenId?:string;onTargetConsumed:()=>void;open:(name:string,id?:string)=>void}){
 const [detail,setDetail]=useState(false);useEffect(()=>{if(section!=='collection')setDetail(false);},[section]);
 return <View style={{flex:1,minHeight:0}}>
  {!detail&&<View style={{padding:10,paddingBottom:4}}><TabsV2 testID="bugs-tabs" tab={section} setTab={onSection} tabs={[{id:'collection',icon:'leaf',name:'Bugs',line:'Jouw collectie'},{id:'team',icon:'team',name:'Team',line:'Kies je drie bugs'},{id:'buddy',icon:'heart',name:'Buddy',line:'Samen op pad'},{id:'dex',icon:'book',name:'Bugdex',line:'Alle soorten'}]}/></View>}
  {section==='collection'?<GoCollectionV2 {...{view,run,busy,active,initialSpecimenId,onTargetConsumed,open}} onSelectionChange={setDetail}/>:section==='team'?<GoTeamPickerV2 embedded player={view.player} {...{run,busy}} onClose={()=>onSection('collection')}/>:<ScrollView contentContainerStyle={{padding:12,gap:12,paddingBottom:20}}>{section==='buddy'?<GoBuddyV2 {...{view,run,busy,now}}/>:<GoDexV2 view={view}/>}</ScrollView>}
 </View>;
}
