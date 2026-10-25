type Point={x:number;y:number};
const overlapsWild=(gym:Point,wild:Point)=>gym.x-39<wild.x+35&&gym.x+39>wild.x-35&&gym.y-99<wild.y+13&&gym.y+6>wild.y-60;
// Gyms are 2D badges: move only their badge, never a bug, trainer or GPS coordinate.
export function gymMarkerPosition(origin:Point,wild:readonly Point[],width:number,height:number):Point{
 if(!wild.some(point=>overlapsWild(origin,point)))return origin;
 const candidates=[[88,0],[-88,0],[0,-116],[88,-92],[-88,-92],[0,116],[88,92],[-88,92]].map(([dx,dy])=>({x:origin.x+dx,y:origin.y+dy})).filter(point=>point.x>=43&&point.x<=width-43&&point.y>=175&&point.y<=height-125);
 return candidates.find(point=>!wild.some(bug=>overlapsWild(point,bug)))??candidates.sort((a,b)=>wild.filter(bug=>overlapsWild(a,bug)).length-wild.filter(bug=>overlapsWild(b,bug)).length)[0]??origin;
}
