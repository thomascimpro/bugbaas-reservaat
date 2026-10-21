import React,{useEffect} from 'react';
import {SpriteView} from './artV2';
export default function BugStageV2({id,shiny=false,onReady}:{id:string;shiny?:boolean;onReady?:()=>void}){useEffect(()=>{onReady?.();},[id,shiny]);return <SpriteView id={id} shiny={shiny} size={190} animate/>;}
