import React from 'react';
import {createPortal} from 'react-dom';
export function RewardHost({children}:{children:React.ReactNode}){return createPortal(<div style={{position:'fixed',top:'calc(env(safe-area-inset-top, 0px) + 62px)',left:'50%',transform:'translateX(-50%)',width:'min(520px, calc(100vw - 28px))',zIndex:100000,pointerEvents:'none'}}>{children}</div>,document.body);}
