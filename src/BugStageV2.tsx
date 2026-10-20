import React from 'react';
import {SpriteView} from './artV2';
export default function BugStageV2({id,shiny=false}:{id:string;shiny?:boolean}){return <SpriteView id={id} shiny={shiny} size={190} animate/>;}
