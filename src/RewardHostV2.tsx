import React from 'react';
import {View} from 'react-native';
export function RewardHost({children}:{children:React.ReactNode}){return <View pointerEvents="box-none" style={{position:'absolute',left:14,right:14,top:62,zIndex:1000}}>{children}</View>;}
