import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Map as GameMap,LayerSpecification,SkySpecification,StyleSpecification} from 'maplibre-gl';
import {validateStyleMin} from '@maplibre/maplibre-gl-style-spec';
import {applyWorldSurface,surfaceTexture} from '../src/worldSurfaceV2';

function fixture(){
 const style:StyleSpecification={version:8,sources:{openmaptiles:{type:'vector',url:'https://tiles.openfreemap.org/planet'},route:{type:'geojson',data:{type:'FeatureCollection',features:[]}}},layers:[
  {id:'background',type:'background',paint:{'background-color':'#FFFFFF'}},
  {id:'landcover_wood',type:'fill',source:'openmaptiles','source-layer':'landcover',filter:['==',['get','class'],'wood']},
  {id:'landcover_grass',type:'fill',source:'openmaptiles','source-layer':'landcover',filter:['==',['get','class'],'grass']},
  {id:'landcover_wetland',type:'fill',source:'openmaptiles','source-layer':'landcover',filter:['==',['get','class'],'wetland']},
  {id:'park',type:'fill',source:'openmaptiles','source-layer':'park'},
  {id:'landuse',type:'fill',source:'openmaptiles','source-layer':'landuse'},
  {id:'water',type:'fill',source:'openmaptiles','source-layer':'water',filter:['!=',['get','brunnel'],'tunnel'],minzoom:6},
  {id:'waterway',type:'line',source:'openmaptiles','source-layer':'waterway'},
  {id:'road-casing',type:'line',source:'openmaptiles','source-layer':'transportation',paint:{'line-width':8}},
  {id:'road-path',type:'line',source:'openmaptiles','source-layer':'transportation',paint:{'line-width':5}},
  {id:'route-gameplay',type:'line',source:'route',paint:{'line-color':'#219C8D','line-width':6}},
 ]};
 const images=new Map<string,ReturnType<typeof surfaceTexture>>();let sky:SkySpecification|undefined={'sky-color':'#FFFFFF'},writes=0,serializeBlocked=false;
 const find=(id:string)=>style.layers.find(l=>l.id===id);
 const map={
  getStyle:()=>{assert.equal(serializeBlocked,false,'updates must not serialize later custom Three.js layers');return structuredClone(style);},
  getLayer:find,hasImage:(id:string)=>images.has(id),addImage:(id:string,image:ReturnType<typeof surfaceTexture>)=>{images.set(id,image);writes++;},updateImage:(id:string,image:ReturnType<typeof surfaceTexture>)=>{images.set(id,image);writes++;},removeImage:(id:string)=>images.delete(id),
  getPaintProperty:(id:string,key:string)=>(find(id)?.paint as Record<string,unknown>|undefined)?.[key],
  setPaintProperty:(id:string,key:string,value:unknown)=>{const layer=find(id)!;layer.paint??={};const paint=layer.paint as Record<string,unknown>;if(value===undefined)delete paint[key];else paint[key]=structuredClone(value);writes++;},
  setLayoutProperty:()=>{},getSky:()=>structuredClone(sky),setSky:(value:SkySpecification|undefined)=>{sky=structuredClone(value);if(sky===undefined)delete style.sky;else style.sky=sky;writes++;},
  addLayer:(layer:LayerSpecification,before:string)=>{style.layers.splice(style.layers.findIndex(l=>l.id===before),0,structuredClone(layer));writes++;},
  removeLayer:(id:string)=>{style.layers=style.layers.filter(l=>l.id!==id);},
 } as unknown as GameMap;
 return {map,style,images,find,get writes(){return writes;},get sky(){return sky;},blockSerialization(){serializeBlocked=true;}};
}

test('world textures are deterministic opaque 64px tiles with a restrained wave pattern and distinct night colors',()=>{
 for(const kind of ['grass','forest','water'] as const){const day=surfaceTexture(kind),night=surfaceTexture(kind,false);assert.equal(day.width,64);assert.equal(day.height,64);assert.equal(day.data.length,64*64*4);assert.deepEqual(surfaceTexture(kind).data,day.data);assert.notDeepEqual(day.data,night.data);
  const red=[];for(let i=0;i<day.data.length;i+=4){assert.equal(day.data[i+3],255);red.push(day.data[i]);}assert.ok(Math.max(...red)-Math.min(...red)<=15,'small contrast avoids a noisy tile grid');
 }
});

test('surface styling uses real source geometry and preserves transport widths and gameplay overlays',()=>{
 const f=fixture(),sources=structuredClone(f.style.sources),route=structuredClone(f.find('route-gameplay')),surface=applyWorldSurface(f.map,{isDay:true});
 try{assert.deepEqual(f.style.sources,sources);assert.deepEqual(f.find('route-gameplay'),route);assert.equal((f.find('road-path')!.paint as Record<string,unknown>)['line-width'],5);
  const water=f.find('water')!,shore=f.find('bb-world-shore-water')!;assert.equal(shore.type,'line');assert.equal('source' in shore&&shore.source,'openmaptiles');assert.equal('source-layer' in shore&&shore['source-layer'],'water');assert.deepEqual('filter' in shore&&shore.filter,'filter' in water&&water.filter);assert.equal(shore.minzoom,water.minzoom);assert.ok(f.style.layers.indexOf(shore)<f.style.layers.indexOf(water));
  assert.equal((water.paint as Record<string,unknown>)['fill-pattern'],'bb-world-water');assert.equal(f.images.get('bb-world-water')!.width,64);assert.deepEqual(validateStyleMin(f.style),[]);
 }finally{surface.dispose();}
});

test('day/night updates are idempotent after custom layer creation and dispose releases owned decoration',()=>{
 const f=fixture(),surface=applyWorldSurface(f.map,{isDay:true,reducedMotion:false}),daySky=f.sky,dayWater=f.images.get('bb-world-water')!.data.slice(),writes=f.writes;
 f.blockSerialization();surface.update({isDay:true});surface.update({reducedMotion:true});assert.equal(f.writes,writes);
 surface.update({isDay:false});assert.notDeepEqual(f.sky,daySky);assert.notDeepEqual(f.images.get('bb-world-water')!.data,dayWater);assert.deepEqual(validateStyleMin(f.style),[]);
 surface.update({isDay:null});assert.deepEqual(f.sky,daySky);assert.deepEqual(f.images.get('bb-world-water')!.data,dayWater);
 surface.dispose();assert.equal(f.find('bb-world-shore-water'),undefined);assert.equal(f.images.has('bb-world-water'),false);assert.equal(f.images.has('bb-world-grass'),false);assert.equal(f.images.has('bb-grass'),true);assert.equal((f.find('water')!.paint as Record<string,unknown>)['fill-pattern'],undefined);assert.deepEqual(f.sky,{'sky-color':'#FFFFFF'});
 const disposedWrites=f.writes;surface.update({isDay:false});surface.dispose();assert.equal(f.writes,disposedWrites);
});

test('surface updates tolerate removed cached layers and cleanup restores an originally absent sky',()=>{
 const f=fixture();
 // MapLibre returns undefined when a style has no sky, despite its public return type.
 f.map.setSky(undefined as unknown as SkySpecification);
 const surface=applyWorldSurface(f.map,{isDay:true});
 f.map.removeLayer('landcover_wood');f.map.removeLayer('bb-world-shore-water');f.blockSerialization();
 surface.update({isDay:false});assert.deepEqual(validateStyleMin(f.style),[]);
 surface.dispose();assert.equal(f.sky,undefined);assert.equal('sky' in f.style,false);
 assert.equal(f.images.has('bb-world-forest'),false);
 const writes=f.writes;surface.dispose();assert.equal(f.writes,writes);
});
