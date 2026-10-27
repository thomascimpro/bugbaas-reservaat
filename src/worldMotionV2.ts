import {EXPANDED_BY_ID} from '../game/dexExpansionV2';
import {EVOLUTION_ASSETS} from '../game/evolutionAssetsV2';
export type WorldPoint={x:number;z:number};
const flying=new Set(['butterfly','moth','lacewing','hoverfly','cranefly','mayfly']);
const flies=(id:string)=>EXPANDED_BY_ID[id]?.flying??EVOLUTION_ASSETS[id]?.flying??flying.has(id.replace(/_elite$/,''));
export function advanceWorldPosition(current:WorldPoint,target:WorldPoint,delta:number,reduced=false){
 const gap=Math.hypot(target.x-current.x,target.z-current.z);
 if(reduced||gap>120||gap<.04)return {...target,moving:false};
 const blend=1-Math.exp(-5*Math.max(0,Math.min(delta,.1)));
 return {x:current.x+(target.x-current.x)*blend,z:current.z+(target.z-current.z)*blend,moving:gap>.15};
}
export function worldHeading(current:number,target:number,delta:number,reduced=false){const turn=Math.atan2(Math.sin(target-current),Math.cos(target-current));return current+turn*(reduced?1:1-Math.exp(-9*Math.max(0,Math.min(delta,.1))));}
export function worldClip(names:readonly string[],moving:boolean,species?:string){
 const preferred=flies(species??'')?['fly','buzz','idle']:moving?['walk','crawl','run','idle']:['idle','perch'];
 return preferred.map(name=>names.find(n=>n.toLowerCase()===name)).find(Boolean)??names[0];
}
export function worldIdle(species:string,id:string,seconds:number,reduced=false){
 if(reduced)return {height:0,turn:0};
 const base=species.replace(/_(elite|ultimate)$/,''),phase=Array.from(id).reduce((sum,c)=>sum+c.charCodeAt(0),0)*.37,isFlying=flies(species),slow=base==='stick'||base==='leaf'||base==='mantis'||base==='caterpillar'||species.startsWith('snail_'),rate=isFlying?3.2:slow?.9:1.8;
 return {height:(isFlying?.55:.045)*(1+Math.sin(seconds*rate+phase)),turn:Math.sin(seconds*(slow?.45:.7)+phase)*(isFlying?.055:slow?.025:.045)};
}
// Cosmetic steps stay close to the real spawn; capture distance and hit targets never move.
export function worldRoam(species:string,id:string,seconds:number,reduced=false){
 if(reduced)return {x:0,z:0,heading:0,moving:false};
 const base=species.replace(/_(elite|ultimate)$/,''),seed=Array.from(id).reduce((sum,c)=>sum+c.charCodeAt(0),0),slow=['stick','leaf','mantis','caterpillar','beetlegrub'].includes(base)||species.startsWith('snail_'),angle=seed*.37,phase=seconds*(slow?.3:.65)+seed*.17,radius=flies(species)?1.8:slow?.7:1.25,offset=Math.cos(phase)*radius;
 return {x:Math.sin(angle)*offset,z:Math.cos(angle)*offset,heading:angle+(Math.sin(phase)>0?Math.PI:0),moving:Math.abs(Math.sin(phase))>.2};
}
