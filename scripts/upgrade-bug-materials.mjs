// HD material pass for the bug GLBs (assets/3d/README.md B1): glossy chitin on opaque parts, a soft
// pearly sheen on translucent wings. Geometry, skins, animation names and quantization stay untouched.
// Usage: node scripts/upgrade-bug-materials.mjs <outDir> [model ...]   (default: every bug model in .local/portraits-hd/species.json)
import {readFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,KHRMaterialsClearcoat,KHRMaterialsIridescence} from '@gltf-transform/extensions';

const [outDir='.local/bug-upgrade',...only]=process.argv.slice(2);
const species=JSON.parse(await readFile('.local/portraits-hd/species.json','utf8'));
const models=only.length?only:[...new Set(species.map(s=>s.model))];
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
await mkdir(resolve(outDir),{recursive:true});
const report=[];
for(const name of models){
 const doc=await io.read(join('public','models',name+'.glb'));
 const clearcoat=doc.createExtension(KHRMaterialsClearcoat),iridescence=doc.createExtension(KHRMaterialsIridescence);
 let opaque=0,wings=0;
 for(const m of doc.getRoot().listMaterials()){
  if(m.getExtension('KHR_materials_clearcoat')||m.getExtension('KHR_materials_iridescence'))continue; // already upgraded
  if(m.getAlphaMode()==='BLEND'){
   m.setRoughnessFactor(Math.min(m.getRoughnessFactor(),.25));
   m.setExtension('KHR_materials_iridescence',iridescence.createIridescence().setIridescenceFactor(.55).setIridescenceIOR(1.3).setIridescenceThicknessMinimum(180).setIridescenceThicknessMaximum(420));
   wings++;
  }else{
   m.setRoughnessFactor(Math.min(m.getRoughnessFactor(),.6));
   m.setExtension('KHR_materials_clearcoat',clearcoat.createClearcoat().setClearcoatFactor(.6).setClearcoatRoughnessFactor(.16));
   opaque++;
  }
 }
 const out=join(outDir,name+'.glb');await io.write(out,doc);report.push({name,opaque,wings});
}
console.log(JSON.stringify({models:report.length,opaque:report.reduce((n,r)=>n+r.opaque,0),wings:report.reduce((n,r)=>n+r.wings,0)}));
