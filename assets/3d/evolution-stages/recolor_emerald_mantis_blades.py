"""Idempotent material tint for the CC0 EmeraldMantisAdult elite (mantis_elite).

The author's vertex colours paint the raptorial blades bone-white, which read as foreign white
blades next to the emerald body. This sets (never multiplies) baseColorFactor on the
`bone_blade` and `spur` materials so blades become emerald green and spurs olive.
Geometry, skin, vertex colours and animation clips are untouched (geometrySha256 unchanged).
Run from the repository root:  python assets/3d/evolution-stages/recolor_emerald_mantis_blades.py
"""
import json,struct,hashlib
from pathlib import Path
TINTS={'bone_blade':[0.083,0.46,0.135,1],'spur':[0.25,0.5,0.09,1]}
for path in [Path('assets/3d/evolution-stages/EmeraldMantisAdult.glb'),Path('public/models/EmeraldMantisAdult.glb')]:
    data=path.read_bytes();magic,version,_=struct.unpack_from('<4sII',data,0);assert magic==b'glTF' and version==2
    jlen,jtype=struct.unpack_from('<I4s',data,12);assert jtype==b'JSON'
    g=json.loads(data[20:20+jlen]);rest=data[20+jlen:]
    for m in g['materials']:
        if m.get('name') in TINTS:m.setdefault('pbrMetallicRoughness',{})['baseColorFactor']=TINTS[m['name']]
    j=json.dumps(g,separators=(',',':')).encode('utf-8');j+=b' '*((4-len(j)%4)%4)
    out=struct.pack('<4sII',b'glTF',2,12+8+len(j)+len(rest))+struct.pack('<I4s',len(j),b'JSON')+j+rest
    path.write_bytes(out);print(path,len(out),hashlib.sha256(out).hexdigest())
