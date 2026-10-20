export type ArtFrame={x:number;y:number;width:number;height:number};

// Fit the actual visible artwork, including art that crosses an atlas grid line.
export function fitArt(frame:ArtFrame,size:number){
 const scale=size*.92/Math.max(frame.width,frame.height);
 return {scale,width:frame.width*scale,height:frame.height*scale,left:(size-frame.width*scale)/2,top:(size-frame.height*scale)/2};
}

export type PlateSlice={source:ArtFrame;left:number;top:number;width:number;height:number;scale:number};

// Fixed corners and uniformly scaled texture tiles: no part of the artwork is stretched.
// The last tile is cropped to fill the available space, as with a tiled nine-patch.
export function plateSlices(width:number,height:number,bounds:number[],capWidth=240,nominalHeight=58):PlateSlice[]{
 if(width<=0||height<=0)return [];
 const [x,y,right,bottom]=bounds,sourceHeight=bottom-y;
 const scale=Math.min(height,nominalHeight)/sourceHeight,edgeX=Math.min(capWidth*scale,width/2),edgeY=Math.min(sourceHeight*.46*scale,height/2);
 const xs=[x,x+edgeX/scale,right-edgeX/scale,right],ys=[y,y+edgeY/scale,bottom-edgeY/scale,bottom];
 const dx=[0,edgeX,width-edgeX,width],dy=[0,edgeY,height-edgeY,height],slices:PlateSlice[]=[];
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  const tileWidth=(xs[col+1]-xs[col])*scale,tileHeight=(ys[row+1]-ys[row])*scale;
  if(tileWidth<=0||tileHeight<=0)continue;
  for(let top=dy[row];top<dy[row+1]-.001;top+=tileHeight)for(let left=dx[col];left<dx[col+1]-.001;left+=tileWidth){
   const w=Math.min(tileWidth,dx[col+1]-left),h=Math.min(tileHeight,dy[row+1]-top);
   slices.push({source:{x:xs[col],y:ys[row],width:w/scale,height:h/scale},left,top,width:w,height:h,scale});
  }
 }
 return slices;
}

// Three heroes must fit even on a narrow phone, independent of the window outside the game.
export const heroBugSize=(width:number)=>Math.max(0,Math.min(100,(width-24)/3.24));
export const teamBugSize=(width:number)=>Math.max(0,Math.min(82,(width-16)/3-14));
