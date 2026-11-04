import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const approval=JSON.parse(readFileSync('assets/3d/material-upgrade-20261104.json','utf8')).models as {model:string;base:string;staged:string;bytes:number;preserved:boolean}[];
const sha=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
export function runtimeAssetHash(name:string,sourceHash:string){const row=approval.find(r=>r.model===name);assert.ok(row?.preserved,'approved geometry, animations, colours and textures');assert.equal(row.base,sourceHash,'original licensed source remains unchanged');return row.staged;}
export function runtimeAssetBytes(name:string){const row=approval.find(r=>r.model===name);assert.ok(row);return row.bytes;}
export function assertRuntimeSource(runtime:Buffer,source:Buffer){const row=approval.find(r=>r.staged===sha(runtime));assert.ok(row?.preserved);assert.equal(row.base,sha(source),'runtime derives from the preserved licensed source');}
