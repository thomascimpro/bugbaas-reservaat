export type WorldPoint={x:number;z:number};
const flying=new Set(['butterfly','moth','lacewing','hoverfly','cranefly','mayfly']);
export function advanceWorldPosition(current:WorldPoint,target:WorldPoint,delta:number,reduced=false){
 const gap=Math.hypot(target.x-current.x,target.z-current.z);
 if(reduced||gap>120||gap<.04)return {...target,moving:false};
 const blend=1-Math.exp(-5*Math.max(0,Math.min(delta,.1)));
 return {x:current.x+(target.x-current.x)*blend,z:current.z+(target.z-current.z)*blend,moving:gap>.15};
}
export function worldHeading(current:number,target:number,delta:number,reduced=false){const turn=Math.atan2(Math.sin(target-current),Math.cos(target-current));return current+turn*(reduced?1:1-Math.exp(-9*Math.max(0,Math.min(delta,.1))));}
export function worldClip(names:readonly string[],moving:boolean,species?:string){
 const preferred=flying.has(species??'')?['fly','buzz','idle']:moving?['walk','crawl','run','idle']:['idle','perch'];
 return preferred.map(name=>names.find(n=>n.toLowerCase()===name)).find(Boolean)??names[0];
}
export function worldIdle(species:string,id:string,seconds:number,reduced=false){
 if(reduced)return {height:0,turn:0};
 const phase=Array.from(id).reduce((sum,c)=>sum+c.charCodeAt(0),0)*.37,isFlying=flying.has(species),slow=species==='stick'||species==='leaf'||species==='mantis'||species==='caterpillar',rate=isFlying?3.2:slow?.9:1.8;
 return {height:(isFlying?.55:.045)*(1+Math.sin(seconds*rate+phase)),turn:Math.sin(seconds*(slow?.45:.7)+phase)*(isFlying?.055:slow?.025:.045)};
}
