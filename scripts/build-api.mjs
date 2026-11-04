import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
const require=createRequire(import.meta.url),three=resolve(dirname(require.resolve('three')),'three.module.js');
// Vercel's CommonJS loader cannot load Three 0.186's require-to-ESM shim.
// Bundle its pure replay maths unchanged; Firebase and all other packages stay external.
const result=await build({entryPoints:['server/cloudEntryV2.ts'],outfile:'server/cloudRuntime.cjs',platform:'node',target:'node22',format:'cjs',bundle:true,minify:true,packages:'external',metafile:true,plugins:[{name:'three-esm',setup(b){b.onResolve({filter:/^three$/},()=>({path:three}));}}]});
if(Object.keys(result.metafile.inputs).some(p=>/node_modules[\\/](?:react|react-native|maplibre-gl)[\\/]/.test(p)))throw Error('Cloud replay must not include UI or map rendering.');
console.log('Cloud API bundled with original Three.js replay maths.');
