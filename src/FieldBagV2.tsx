import React,{useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {BAITS,NETS} from '../game/fieldV2';
import type {FieldItem} from '../game/fieldV2';
import {HELD} from '../game/goV2';
import type {Held} from '../game/goV2';
import type {GameViewV2} from '../game/typesV2';
import type {RunV2} from './ShopViewV2';
import {FieldArt} from './FieldArtV2';
import {CandyIconV2} from './CandyIconV2';
import {familyName,NECTAR_FAMILIES} from './resourceGainV2';
import {TabsV2} from './TabsV2';
import {Button,Counter,Glyph,Label,useInfo,V} from './uiV2';

export function FieldBagV2({view,run,busy,open}:{view:GameViewV2;run:RunV2;busy:boolean;open:(name:string)=>void}){
 const [tab,setTab]=useState<'catch'|'gear'|'training'|'nectar'>('catch'),p=view.player,g=p.go!,f=p.field!,info=useInfo();
 const show=(title:string,body:string)=>info.show({title,body,icon:'bag'});
 const tile={width:'23.5%' as const,minWidth:0,flexGrow:0,paddingHorizontal:3,paddingVertical:8,borderRadius:16,borderWidth:1,borderColor:'#52755A',backgroundColor:'#214B40',alignItems:'center' as const,gap:3,minHeight:104};
 const name=(text:string)=><Text numberOfLines={2} style={{fontSize:11,lineHeight:13,fontWeight:'700',color:V.ink,textAlign:'center'}}>{text}</Text>;
 const count=(n:number)=><View style={{position:'absolute',right:6,top:4}}><Label small bold>×{n}</Label></View>;
 const nectar=[...new Set([...Object.keys(g.candy),...Object.keys(g.xl)])].filter(k=>(g.candy[k]??0)>0||(g.xl[k]??0)>0).sort((a,b)=>(g.candy[b]??0)-(g.candy[a]??0)||(g.xl[b]??0)-(g.xl[a]??0)||familyName(a).localeCompare(familyName(b)));
 const total=Object.values(f.inventory).reduce((a,b)=>a+b,0)+Object.values(g.items).reduce((a,b)=>a+b,0)+g.fastTMs+g.chargedTMs;
 return <View style={{gap:12}}>
  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><Counter icon="bag" value={total} label="Voorwerpen" hint="Tik op een voorwerp voor uitleg."/><Counter icon="nectar" value={g.dust} label="✨ Stof" hint="Maak je bugs sterker."/></View>
  <TabsV2 testID="bag-tabs" tab={tab} setTab={setTab} tabs={[{id:'catch',emoji:'🕸️',name:'Vangen',line:'🕸️ Netten en 🍓 lokmiddelen'},{id:'gear',emoji:'🍀',name:'Items',line:'🍀 Geef een item aan een bug'},{id:'training',emoji:'📀',name:'Aanvallen',line:'📀 TM: wissel een aanval'},{id:'nectar',emoji:'🍯',name:'Nectar',line:'🍯 Voor sterker maken en evolueren'}]}/>
  {tab==='catch'&&<>{[{title:'🕸️ Netten',items:NETS},{title:'🍓 Lokmiddelen',items:BAITS}].map(group=><View key={group.title} style={{gap:5}}><Label small bold>{group.title}</Label><View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{Object.entries(group.items).map(([id,item])=><Pressable key={id} accessibilityRole="button" accessibilityLabel={item.name+': '+f.inventory[id as FieldItem]} delayLongPress={350} onPress={()=>show(item.name,item.hint+'\n📍 Veldposten en onderzoek')} onLongPress={()=>show(item.name,item.hint+'\n📍 Veldposten en onderzoek')} style={tile}>{count(f.inventory[id as FieldItem]??0)}<FieldArt id={id as FieldItem} size={54}/>{name(item.name)}</Pressable>)}</View></View>)}<Button icon={f.daily.supply?'check':'gift'} disabled={busy||f.daily.supply} onPress={()=>void run('fieldSupply')}>{f.daily.supply?'Dagbox geopend':'Dagbox'}</Button></>}
  {tab==='gear'&&<><View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{(Object.entries(HELD) as [Held,(typeof HELD)[Held]][]).map(([id,item])=>{const used=p.specimens.filter(s=>s.go?.item===id).length,body=item.hint+'\n🎒 '+used+' van '+g.items[id]+' uitgerust\n📍 Vangsten 4% · veldposten 2%';return <Pressable key={id} accessibilityRole="button" accessibilityLabel={item.name+': '+g.items[id]} delayLongPress={350} onPress={()=>show(item.name,body)} onLongPress={()=>show(item.name,body)} style={tile}>{count(g.items[id])}<Glyph name={item.icon} size={54}/>{name(item.name)}{used>0&&<Label small color={V.muted}>✅ {used}</Label>}</Pressable>;})}</View><Button secondary icon="team" onPress={()=>open('team')}>Geef aan bug</Button></>}
  {tab==='training'&&<><View style={{flexDirection:'row',gap:8}}>{([{name:'Snelle TM',count:g.fastTMs,icon:'swords',body:'⚡ Wisselt de snelle aanval van één bug.\n🐞 Open een bug › ⚔️ Aanvallen › TM.\n📍 Veldposten 1% · onderzoek · gevechten'},{name:'Speciale TM',count:g.chargedTMs,icon:'star',body:'💥 Wisselt een speciale aanval van één bug.\n🐞 Open een bug › ⚔️ Aanvallen › TM.\n📍 Veldposten 1% · onderzoek · gevechten'}] as const).map(item=><Pressable key={item.name} accessibilityRole="button" accessibilityLabel={item.name+': '+item.count} onPress={()=>show(item.name,item.body)} onLongPress={()=>show(item.name,item.body)} delayLongPress={350} style={{...tile,flex:1,width:undefined,minHeight:135,gap:5}}>{count(item.count)}<Glyph name={item.icon} size={72}/><Label small bold center>{item.name}</Label></Pressable>)}</View><Button secondary icon="team" onPress={()=>open('team')}>Wijzig aanvallen</Button></>}
  {tab==='nectar'&&(nectar.length?<View testID="bag-nectar" style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{nectar.map(k=><Pressable key={k} accessibilityRole="button" accessibilityLabel={familyName(k)+'-nectar: '+(g.candy[k]??0)+((g.xl[k]??0)>0?', XL: '+g.xl[k]:'')} onPress={()=>info.show({title:familyName(k)+'-nectar',body:'💪 Sterker maken en 🦋 evolueren van deze familie.',icon:'power'})} style={{...tile,minHeight:96}}>{count(g.candy[k]??0)}<CandyIconV2 family={k} size={46}/>{name(familyName(k))}{(g.xl[k]??0)>0&&<View style={{flexDirection:'row',alignItems:'center',gap:3}}><CandyIconV2 family={k} xl/><Label small bold>×{g.xl[k]}</Label></View>}</Pressable>)}</View>:<View testID="bag-nectar-empty" style={{alignItems:'center',gap:8,paddingVertical:18}}><View style={{opacity:.55}}><CandyIconV2 family={NECTAR_FAMILIES[0]} size={96}/></View><Label bold>Nog geen nectar</Label></View>)}
 </View>;
}
