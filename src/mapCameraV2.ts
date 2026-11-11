export type MapCameraV2={center:[number,number];zoom:number;pitch:number;bearing:number};
export const MAP_ZOOM={min:15,max:20} as const;
export function stepMapZoom(zoom:number,step:number){return Math.max(MAP_ZOOM.min,Math.min(MAP_ZOOM.max,zoom+step));}
/** Walking view like PoGO: close behind the trainer, tilted far enough to show horizon and sky; the trainer stands in the lower part of the screen (trainerDrop = share of the map height used as top padding). */
export const MAP_VIEW={zoom:18.4,pitch:66,trainerDrop:.3} as const;
