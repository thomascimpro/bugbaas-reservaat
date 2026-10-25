import React from 'react';
import {View} from 'react-native';
export function RewardHost({children}:{children:React.ReactNode}){return <View pointerEvents="box-none" style={{position:'absolute',right:12,top:270,width:92,height:310,zIndex:1000}}>{children}</View>;}
