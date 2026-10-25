import React from 'react';
import {createPortal} from 'react-dom';
export function RewardHost({children}:{children:React.ReactNode}){return createPortal(<div style={{position:'fixed',top:270,right:'max(12px, calc((100vw - 560px) / 2 + 12px))',width:92,height:310,zIndex:100000,pointerEvents:'none'}}>{children}</div>,document.body);}
