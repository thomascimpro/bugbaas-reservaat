export type MapCameraV2={center:[number,number];zoom:number;pitch:number;bearing:number};
export const MAP_ZOOM={min:15,max:20} as const;
export function stepMapZoom(zoom:number,step:number){return Math.max(MAP_ZOOM.min,Math.min(MAP_ZOOM.max,zoom+step));}
