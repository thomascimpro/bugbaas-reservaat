import React from 'react';
import {ScrollView,View} from 'react-native';
import type {GameViewV2} from '../game/typesV2';
import type {RunV2} from './ShopViewV2';
import {FieldBagV2} from './FieldBagV2';
import {GoCocoonsV2} from './GoCocoonsV2';
import {TabsV2} from './TabsV2';
import {Button} from './uiV2';
export function BagHomeV3({view,run,busy,now,section,onSection,open}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;section:'items'|'cocoons';onSection:(s:'items'|'cocoons')=>void;open:(name:string,id?:string)=>void}){
 return <View style={{flex:1,minHeight:0}}><View style={{padding:12,gap:8}}><View style={{alignItems:'flex-end'}}><Button small secondary icon="coin" onPress={()=>open('coinShop')}>Shop</Button></View><TabsV2 testID="bag-tabs" tab={section} setTab={onSection} tabs={[{id:'items',icon:'bag',name:'Items',line:'Netten en hulpmiddelen'},{id:'cocoons',icon:'expedition',name:'Cocons',line:'Loop om uit te broeden'}]}/></View>{section==='cocoons'?<GoCocoonsV2 embedded {...{view,run,busy,now,open}}/>:<ScrollView contentContainerStyle={{padding:12,paddingBottom:24,gap:12}}><FieldBagV2 {...{view,run,busy,open}}/></ScrollView>}</View>;
}
