import React from 'react';
import {Image} from 'react-native';

/** Original BugBaas artwork: Marcel, Colette and Gaston, with berets and baguettes. */
export function PlaagCrewV2({width=156,height=130}:{width?:number;height?:number}){
 return <Image testID="plaag-french-crew" accessibilityLabel="Marcel, Colette en Gaston met baret en baguette" source={require('../assets/v2/plaagbende/crew-v1.webp')} resizeMode="contain" style={{width,height}}/>;
}
