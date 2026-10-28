import React,{useContext,useEffect,useRef,useState} from 'react';
import {Animated,Easing,Modal,Pressable,Text,View} from 'react-native';
import {HABITATS} from '../game/catalogV2';
import {BAITS,NETS} from '../game/fieldV2';
import {Scene} from './artV2';
import {FieldArt} from './FieldArtV2';
import {Button,Counter,Label,MotionPrefs,V} from './uiV2';

export type GiftReveal={friend:string;habitat:number;dust:number;items:Record<string,number>};
const itemName=(id:string)=>(NETS as Record<string,{name:string}>)[id]?.name??(BAITS as Record<string,{name:string}>)[id]?.name??id;

/** Shake, pop open, then show the postcard and every item that came out. Purely visual: the server already granted it. */
export function GiftRevealV2({gift,onClose}:{gift:GiftReveal|null;onClose:()=>void}){
 const reduced=useContext(MotionPrefs),shake=useRef(new Animated.Value(0)).current,pop=useRef(new Animated.Value(0)).current,[open,setOpen]=useState(false);
 useEffect(()=>{if(!gift)return;setOpen(false);shake.setValue(0);pop.setValue(0);if(reduced){setOpen(true);pop.setValue(1);return;}
  const wiggle=Animated.sequence(Array.from({length:6},(_,i)=>Animated.timing(shake,{toValue:i%2?-1:1,duration:90,easing:Easing.linear,useNativeDriver:false})));
  Animated.sequence([Animated.delay(250),wiggle,Animated.timing(shake,{toValue:0,duration:80,useNativeDriver:false})]).start(()=>{setOpen(true);Animated.spring(pop,{toValue:1,friction:5,useNativeDriver:false}).start();});
 },[gift]);
 if(!gift)return null;
 const rotate=shake.interpolate({inputRange:[-1,1],outputRange:['-12deg','12deg']}),scale=pop.interpolate({inputRange:[0,1],outputRange:[.4,1]});
 return <Modal visible transparent animationType={reduced?'none':'fade'} onRequestClose={onClose}><Pressable accessibilityLabel="Sluit cadeau" onPress={()=>{if(open)onClose();}} style={{flex:1,backgroundColor:'#082A28E6',alignItems:'center',justifyContent:'center',padding:20}}>
  {!open?<Animated.View testID="gift-box" style={{transform:[{rotate}]}}><Text style={{fontSize:110}}>🎁</Text><Label center bold color="#FFF3D5">{'Van '+gift.friend}</Label></Animated.View>:
  <Animated.View testID="gift-open" style={{width:'100%',maxWidth:380,gap:12,padding:16,borderRadius:28,backgroundColor:V.paper,borderWidth:2,borderColor:'#F2D16E',transform:[{scale}],opacity:pop}}>
   <Text style={{fontSize:22,fontWeight:'800',color:V.ink,textAlign:'center'}}>Cadeau van {gift.friend}!</Text>
   <View style={{height:110,borderRadius:18,overflow:'hidden',justifyContent:'flex-end',padding:7}}><Scene index={gift.habitat}/><View style={{padding:5,borderRadius:8,backgroundColor:'#214B40EE'}}><Label small bold>{'📮 '+(HABITATS[gift.habitat]?.name??'Habitatkaart')+' · in je album'}</Label></View></View>
   <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:10}}>
    <Counter icon="nectar" value={gift.dust} label="Nectarstof"/>
    {Object.entries(gift.items).map(([id,n])=><View key={id} accessibilityLabel={itemName(id)+': +'+n} style={{alignItems:'center',minWidth:64}}><FieldArt id={id as never} size={42}/><Label small bold>+{n}</Label><Label small>{itemName(id)}</Label></View>)}
   </View>
   <Button onPress={onClose}>Super!</Button>
  </Animated.View>}
 </Pressable></Modal>;
}
