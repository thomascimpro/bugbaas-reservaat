import {build} from 'esbuild';
import {stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const result=await build({entryPoints:[resolve(root,'src/nativeBugViewerV2.ts')],outfile:resolve(root,'public/bug-viewer.js'),bundle:true,minify:true,format:'iife',platform:'browser',target:'es2020',metafile:true,legalComments:'eof',logLevel:'warning'});
const forbidden=Object.keys(result.metafile.inputs).filter(path=>/node_modules[\\/](?:react(?:-native)?[\\/]|firebase[\\/]|@firebase[\\/]|maplibre-gl[\\/])|src[\\/]WalkingSceneV2/.test(path));
if(forbidden.length)throw new Error('The isolated bug viewer must not include the game, accounts, or map.');
console.log(JSON.stringify({viewerBuilt:true,bytes:(await stat(resolve(root,'public/bug-viewer.js'))).size,reactFirebaseMapModules:0}));
