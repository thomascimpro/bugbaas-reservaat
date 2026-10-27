import type {ExpressionSpecification,FillLayerSpecification,Map as GameMap,SkySpecification} from 'maplibre-gl';
import {applyNatureStyle} from './natureMapV2';

export type WorldSurfaceOptions={isDay?:boolean|null;reducedMotion?:boolean};
// Deeper foliage and cool water frame warm paths; contrast comes from the same source layers.
const DAY={ground:'#8BB66B',grass:'#80B65C',forest:'#3E7957',wetland:'#66A18A',sand:'#E4CF98',city:'#96BE72',built:'#A9B992',building:'#CBBB99',buildingEdge:'#899579',park:'#76AD59',water:'#399BA7',shore:'#74B49A',road:'#EDDFBC',path:'#F8EDCF',edge:'#63865A',rail:'#718A83',sky:'#8FCADB',horizon:'#C7DDB0'};
const NIGHT={ground:'#536E62',grass:'#5B7D62',forest:'#375D54',wetland:'#527A73',sand:'#9C9A82',city:'#61796A',built:'#6D7F76',building:'#8E9381',buildingEdge:'#6D7C6C',park:'#5B8060',water:'#36757F',shore:'#608F86',road:'#AEA98E',path:'#D0C5A2',edge:'#536B60',rail:'#637D78',sky:'#152C48',horizon:'#708988'};
const IMAGES={grass:'bb-world-grass',forest:'bb-world-forest',water:'bb-world-water'} as const;
type PaintName=Parameters<GameMap['setPaintProperty']>[1];
type PaintValue=Parameters<GameMap['setPaintProperty']>[2];

export function surfaceTexture(kind:keyof typeof IMAGES,isDay=true){
 const palette=isDay?DAY:NIGHT,hex=palette[kind].slice(1),base=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)),size=64,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size*Math.PI*2,v=y/size*Math.PI*2;
  const wave=Math.pow(Math.max(0,Math.cos(v*4+Math.sin(u*2)*.65)),16);
  const tint=kind==='water'?wave*10+Math.sin(u+v)*1.4:Math.sin(u*4)*Math.cos(v*4)*2+Math.sin(u*9+v*7)*1.1;
  const i=(y*size+x)*4;for(let c=0;c<3;c++)data[i+c]=Math.round(Math.max(0,Math.min(255,base[c]+tint)));data[i+3]=255;
 }
 return {width:size,height:size,data};
}

export function applyWorldSurface(map:GameMap,initial:WorldSurfaceOptions={}){
 // This is the existing base styling, applied once; all decoration stays on its real sources.
 applyNatureStyle(map);
 let options={...initial},disposed=false,night:boolean|undefined;
 const paint=new Map<string,Map<PaintName,PaintValue>>(),shores:string[]=[],addedImages:string[]=[];
 const originalSky=map.getSky();
 function set(id:string,name:PaintName,value:PaintValue){
  if(!map.getLayer(id))return;
  if(!paint.has(id))paint.set(id,new Map());const saved=paint.get(id)!;
  if(!saved.has(name))saved.set(name,map.getPaintProperty(id,name));map.setPaintProperty(id,name,value);
 }
 const layers=map.getStyle().layers;
 const waterLayers=layers.filter((l):l is FillLayerSpecification=>l.type==='fill'&&l['source-layer']==='water');
 for(const water of waterLayers){
  const id='bb-world-shore-'+water.id;if(map.getLayer(id))continue;
  map.addLayer({id,type:'line',source:water.source,'source-layer':water['source-layer'],filter:water.filter,minzoom:water.minzoom,maxzoom:water.maxzoom,layout:{'line-join':'round','line-cap':'round',visibility:water.layout?.visibility??'visible'},paint:{'line-width':['interpolate',['linear'],['zoom'],12,1,17,4,20,7],'line-blur':1,'line-opacity':.65}},water.id);shores.push(id);
 }
 function update(next:WorldSurfaceOptions={}){
  if(disposed)return;options={...options,...next};const isNight=options.isDay===false,p=isNight?NIGHT:DAY;
  if(night===isNight)return;night=isNight;
  for(const kind of Object.keys(IMAGES) as (keyof typeof IMAGES)[]){const name=IMAGES[kind],image=surfaceTexture(kind,!isNight);if(map.hasImage(name))map.updateImage(name,image);else{map.addImage(name,image);addedImages.push(name);}}
  for(const id of shores)set(id,'line-color',p.shore);
  for(const l of layers){
   const source='source-layer' in l?l['source-layer']:'';
   if(l.type==='background'){set(l.id,'background-color',p.ground);continue;}
   if(l.type==='fill'){
    if(source==='water'){set(l.id,'fill-color',p.water);set(l.id,'fill-pattern',IMAGES.water);set(l.id,'fill-opacity',1);}
    else if(source==='landcover'){
     set(l.id,'fill-pattern',/wood/.test(l.id)?IMAGES.forest:/grass/.test(l.id)?IMAGES.grass:undefined);
     set(l.id,'fill-color',['match',['get','class'],'wood',p.forest,'grass',p.grass,'wetland',p.wetland,'sand',p.sand,'ice',isNight?'#9DBCBF':'#DCEDE4',p.grass] satisfies ExpressionSpecification);set(l.id,'fill-opacity',.92);
    }else if(source==='park'){set(l.id,'fill-color',p.park);set(l.id,'fill-pattern',IMAGES.grass);set(l.id,'fill-opacity',.95);}
    else if(source==='landuse'){set(l.id,'fill-color',['match',['get','class'],'residential',p.city,'industrial',p.built,'commercial',p.built,'farmland',p.grass,'cemetery',p.park,'pitch',p.park,p.city] satisfies ExpressionSpecification);set(l.id,'fill-opacity',.82);}
    else if(source==='transportation'){set(l.id,'fill-color',p.road);}
    else if(source==='building'){set(l.id,'fill-color',p.building);set(l.id,'fill-outline-color',p.buildingEdge);}
   }else if(l.type==='line'){
    if(source==='waterway'){set(l.id,'line-color',p.water);}
    else if(source==='transportation')set(l.id,'line-color',/casing|outline/.test(l.id)?p.edge:['match',['get','class'],'path',p.path,'rail',p.rail,'transit',p.rail,p.road] satisfies ExpressionSpecification);
   }
  }
  const sky:SkySpecification={'sky-color':p.sky,'horizon-color':p.horizon,'sky-horizon-blend':.65,'atmosphere-blend':.12,'horizon-fog-blend':0,'sky-color-transition':{duration:0},'horizon-color-transition':{duration:0}};
  map.setSky(sky);
 }
 update();
 return {update,dispose(){
  if(disposed)return;disposed=true;
  for(const id of shores)if(map.getLayer(id))map.removeLayer(id);
  for(const [id,properties] of paint)if(map.getLayer(id))for(const [name,value] of properties)map.setPaintProperty(id,name,value);
  for(const name of addedImages)if(map.hasImage(name))map.removeImage(name);
  map.setSky(originalSky);
 }};
}
