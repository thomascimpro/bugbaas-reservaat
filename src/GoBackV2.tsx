import React,{createContext,useCallback,useContext,useEffect,useMemo,useRef} from 'react';
import {BackHandler,Platform} from 'react-native';

type Back=()=>boolean;
const BackActions=createContext<(action:Back,priority:number)=>()=>void>(()=>()=>{});
export function GoBackProvider({children,onBack}:{children:React.ReactNode;onBack:Back}){
 const current=useRef(onBack),actions=useRef(new Map<Back,number>());current.current=onBack;
 const register=useCallback((action:Back,priority:number)=>{actions.current.set(action,priority);return()=>{actions.current.delete(action);};},[]);
 useEffect(()=>{
  const back=()=>{for(const [action] of [...actions.current].sort((a,b)=>b[1]-a[1]))if(action())return true;return current.current();};
  if(Platform.OS==='web'){
   const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&back())e.preventDefault();};
   const pop=()=>{if(back())history.pushState({bugbaasBack:true},'',location.href);};
   history.pushState({bugbaasBack:true},'',location.href);window.addEventListener('keydown',key);window.addEventListener('popstate',pop);
   return()=>{window.removeEventListener('keydown',key);window.removeEventListener('popstate',pop);};
  }
  const listener=BackHandler.addEventListener('hardwareBackPress',back);return()=>listener.remove();
 },[]);
 return <BackActions.Provider value={register}>{children}</BackActions.Provider>;
}
export function useGoBack(active:boolean,action:Back,priority=10){
 const register=useContext(BackActions),current=useRef(action);current.current=action;
 useEffect(()=>{if(active)return register(()=>current.current(),priority);},[active,register,priority]);
}

/** Retained tabs keep their local state but only the visible tab can handle Back. */
export function GoBackScope({active,children}:{active:boolean;children:React.ReactNode}){
 const parent=useContext(BackActions);
 const register=useMemo(()=>active?parent:()=>()=>{},[active,parent]);
 return <BackActions.Provider value={register}>{children}</BackActions.Provider>;
}
