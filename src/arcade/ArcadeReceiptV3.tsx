import React,{useEffect,useRef,useState} from 'react';
import {Text,View} from 'react-native';
import {font,Glyph} from '../uiV2';
import type {Glyph as GlyphName} from '../uiV2';

/** Animates confirmed receipt amounts only; never changes inventory or reward state. */
export function ArcadeReceiptAmountV3({amount,icon,label,reducedMotion,active}:{amount:number;icon:GlyphName;label:string;reducedMotion:boolean;active:boolean}){
 const [shown,setShown]=useState(reducedMotion?amount:0),previous=useRef(0);
 useEffect(()=>{if(!active)return;const from=previous.current;previous.current=amount;if(reducedMotion||from===amount){setShown(amount);return;}let frame=0,disposed=false;const started=performance.now();const step=(now:number)=>{if(disposed)return;const progress=Math.min(1,(now-started)/350);setShown(Math.round(from+(amount-from)*(1-(1-progress)**3)));if(progress<1)frame=requestAnimationFrame(step);};frame=requestAnimationFrame(step);return()=>{disposed=true;cancelAnimationFrame(frame);};},[amount,reducedMotion,active]);
 return <View accessibilityLabel={label+': +'+amount} style={{minWidth:94,minHeight:58,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,paddingHorizontal:14,borderRadius:18,backgroundColor:'#10352FE8',borderWidth:1,borderColor:'#BFF3EC47'}}><Glyph name={icon} size={29}/><Text testID={'arcade-reward-'+label} style={{fontFamily:font,color:'#FFF2C3',fontWeight:'800',fontSize:25,fontVariant:['tabular-nums']}}>+{shown}</Text></View>;
}
