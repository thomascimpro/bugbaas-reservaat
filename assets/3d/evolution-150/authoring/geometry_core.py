#!/usr/bin/env python3
"""BugBaas procedural 3D prototype generator. Pure Python 3.10+, no Blender.

Creates draft low-poly animated insect/arachnid GLB files for artists to review.
NOT a replacement for licensed, hand-reviewed professional art. No game code touched.
"""
from __future__ import annotations
import argparse, copy, hashlib, json, math, random, struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PALETTE = [
    ('#355746','#8de1a0','#ddf4bc','#0f2430'),
    ('#334865','#75b7e1','#f5e2ba','#142132'),
    ('#5d375d','#be75c6','#ffe9b0','#251933'),
    ('#624b35','#e4ad6c','#fcdf96','#332b25'),
    ('#31635f','#73cdc0','#b7f9e0','#122b33'),
    ('#6b4442','#ed9481','#facd92','#2a282b'),
    ('#364d33','#bdd078','#e0f2a4','#26322b'),
    ('#414a65','#b5a5f7','#cde7ff','#21243b'),
]

OLD_BASES = 'beetle ant aphid weevil moth earwig grasshopper lacewing dungbeetle mantis butterfly divingbeetle waterstrider hoverfly leafhopper cricket stick leaf silverfish hercules antlion cockroach cranefly flea giantwaterbug mayfly termite tigerbeetle tortoisebeetle bee'.split()
HAS_UNIQUE_ELITE = {'ant','mantis','butterfly'}
THREE_STAGE_OLD = {'moth','hercules'}
NEW_FAMILIES = ['spider','armabee','scorpion','centipede','wasp','dragonfly','firefly','cicada','mosquito','snail']


def color(hexcode, alpha=1):
    h = hexcode.lstrip('#')
    def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
    return [round(linear(int(h[i:i+2],16)/255),6) for i in (0,2,4)]+[alpha]


def norm(v):
    s=math.sqrt(sum(x*x for x in v))
    return tuple(x/s for x in v) if s>1e-8 else (0.,1.,0.)


def quat_y_to(v):
    # quaternion xyzw: rotate canonical up-axis (0,1,0) to vector v.
    x,y,z=norm(v)
    if y < -0.999999: return [1.,0.,0.,0.]
    if y > 0.999999: return [0.,0.,0.,1.]
    q=(z,0.,-x,1.+y)
    s=math.sqrt(sum(x*x for x in q))
    return [round(x/s,7) for x in q]


def qaxis(axis, radians):
    x,y,z=norm(axis);t=math.sin(radians*0.5)
    return [x*t,y*t,z*t,math.cos(radians*0.5)]


def ellipsoid(lat=7, lon=12):
    verts=[];idx=[]
    for i in range(lat+1):
        theta=math.pi*i/lat
        for j in range(lon+1):
            angle=2*math.pi*j/lon
            verts.extend((math.sin(theta)*math.cos(angle), math.cos(theta), math.sin(theta)*math.sin(angle)))
    for i in range(lat):
        for j in range(lon):
            p=i*(lon+1)+j
            idx.extend((p,p+lon+1,p+1, p+1,p+lon+1,p+lon+2))
    return verts,idx


def tapered_tube(segments=9,r0=1.,r1=0.26):
    verts=[]; idx=[]
    for yy,rr in ((0.,r0),(1.,r1)):
        for i in range(segments):
            a=2*math.pi*i/segments
            verts.extend((math.cos(a)*rr, yy, math.sin(a)*rr))
    for i in range(segments):
        j=(i+1)%segments
        idx.extend((i,j,segments+i,i+segments,j,segments+j))
        idx.extend((i,j,segments+i)) if False else None
    idx.extend(tuple(range(segments-1,-1,-1))) if False else None
    for i in range(1,segments-1):
        idx.extend((0,i+1,i))
        idx.extend((segments,segments+i,segments+i+1))
    return verts,idx


def leaf_wing():
    # Blade-like wing from (0,0,0) to (0,0,1); double-sided surface with rib.
    verts=[]
    for z,width in ((0.,0.03),(.23,.42),(.56,.55),(.82,.3),(1.,0.015)):
        verts.extend((-width,0,z, width,0,z))
    idx=[]
    for i in range(4):
        k=i*2
        idx.extend((k,k+1,k+2, k+1,k+3,k+2))
    # Wing face material uses doubleSided=true; visible from either angle.
    return verts,idx


def ring_mesh(segments=12):
    verts=[];idx=[]
    for y,r in ((-.06,.95),(.04,1.05)):
        for j in range(segments):
            angle=2*math.pi*j/segments
            verts.extend((math.cos(angle)*r,y,math.sin(angle)*r))
    for j in range(segments):
        k=(j+1)%segments
        idx.extend((j,k,segments+j, k,segments+k,segments+j))
    return verts,idx


class GLB:
    def __init__(self,name):
        self.name=name;self.nodes=[];self.meshes=[];self.materials=[];self.material_ids={};self.mesh_ids={}
        self.buffer=bytearray();self.buffer_views=[];self.accessors=[];self.animations=[]
        self.root=self.node('Root',None)
        self.add_shape('Sphere',*ellipsoid())
        self.add_shape('Tube',*tapered_tube())
        self.add_shape('Needle',*tapered_tube(8,1,0.0))
        self.add_shape('Wing',*leaf_wing())
        self.add_shape('Ring',*ring_mesh())

    def node(self,name,parent,translation=(0.,0.,0.),rotation=None,scale=None,mesh=None):
        n={'name':name,'translation':list(translation)}
        if rotation is not None:n['rotation']=list(rotation)
        if scale is not None:n['scale']=list(scale)
        if mesh is not None:n['mesh']=mesh
        ix=len(self.nodes);self.nodes.append(n)
        if parent is not None:self.nodes[parent].setdefault('children',[]).append(ix)
        return ix

    def add_shape(self,name,vertices,indices):
        self.mesh_ids[name]=(vertices,indices)

    def accessor(self,values,component_type,kind,buffer_target=None):
        if component_type==5126: data=struct.pack('<'+str(len(values))+'f',*values)
        elif component_type==5123: data=struct.pack('<'+str(len(values))+'H',*values)
        elif component_type==5125: data=struct.pack('<'+str(len(values))+'I',*values)
        else:raise ValueError('unsupported component')
        while len(self.buffer)%4:self.buffer.append(0)
        off=len(self.buffer);self.buffer.extend(data)
        view={'buffer':0,'byteOffset':off,'byteLength':len(data)}
        if buffer_target:view['target']=buffer_target
        self.buffer_views.append(view)
        acc={'bufferView':len(self.buffer_views)-1,'componentType':component_type,'count':len(values)//{'SCALAR':1,'VEC3':3,'VEC4':4}[kind],'type':kind}
        if kind in ('VEC3','SCALAR') and values:
            size=1 if kind=='SCALAR' else 3
            acc['min']=[min(values[i::size]) for i in range(size)]
            acc['max']=[max(values[i::size]) for i in range(size)]
        self.accessors.append(acc)
        return len(self.accessors)-1

    def material(self,col,emissive=False,alpha=None):
        key=(tuple(col),emissive,alpha)
        if key not in self.material_ids:
            mat={'name':'mat'+str(len(self.materials)),'pbrMetallicRoughness':{'baseColorFactor':list(col),'metallicFactor':0.,'roughnessFactor':.72},'doubleSided':True}
            if emissive:mat['emissiveFactor']=[min(1,c*.45) for c in col[:3]]
            if alpha is not None:mat['alphaMode']='BLEND';mat['pbrMetallicRoughness']['baseColorFactor'][3]=alpha
            self.materials.append(mat);self.material_ids[key]=len(self.materials)-1
        return self.material_ids[key]

    def newmesh(self,shape,mat):
        key=(shape,mat)
        if key in self.mesh_ids:return self.mesh_ids[key]
        vs,ind=self.mesh_ids[shape]
        attrs={'POSITION':self.accessor(vs,5126,'VEC3',34962)}
        index=self.accessor(ind,5123 if max(ind)<65536 else 5125,'SCALAR',34963)
        self.meshes.append({'name':shape+'_'+str(mat),'primitives':[{'attributes':attrs,'indices':index,'material':mat}]})
        self.mesh_ids[key]=len(self.meshes)-1
        return self.mesh_ids[key]

    def part(self,shape,col,name,pos,scale,par=None,rotation=None,emissive=False,alpha=None):
        mat=self.material(col,emissive,alpha)
        mesh=self.newmesh(shape,mat)
        return self.node(name,par if par is not None else self.root,pos,rotation,scale,mesh)

    def sphere(self,name,pos,scale,colour,par=None,emissive=False):
        return self.part('Sphere',colour,name,pos,scale,par,emissive=emissive)

    def tube(self,name,a,b,r0,r1,col,par=None,shape='Tube'):
        delta=tuple(b[i]-a[i] for i in range(3));length=math.sqrt(sum(x*x for x in delta))
        if length<1e-5:return None
        if abs(r0)<1e-5 or abs(r1)<1e-5:shape='Needle'
        return self.part(shape,col,name,a,(r0,length,r0),par,quat_y_to(delta))

    def wing(self,name,pos,scale,col,rot=None,par=None):
        return self.part('Wing',col,name,pos,scale,par,rot or qaxis((0,1,0),0),alpha=.8)

    def anim(self,name,channels,duration=1.2):
        doc={'name':name,'samplers':[],'channels':[]}
        for node,path,times,values in channels:
            input_ix=self.accessor(times,5126,'SCALAR')
            typ='VEC4' if path=='rotation' else 'VEC3'
            flattened=[x for row in values for x in row]
            output_ix=self.accessor(flattened,5126,typ)
            sampler_ix=len(doc['samplers']);doc['samplers'].append({'input':input_ix,'output':output_ix,'interpolation':'LINEAR'})
            doc['channels'].append({'sampler':sampler_ix,'target':{'node':node,'path':path}})
        self.animations.append(doc)

    def export(self):
        while len(self.buffer)%4:self.buffer.append(0)
        doc={'asset':{'version':'2.0','generator':'BugBaas Procedural Draft Generator 2026-10-26'},'scene':0,'scenes':[{'nodes':[self.root]}],
             'nodes':self.nodes,'meshes':self.meshes,'materials':self.materials,
             'buffers':[{'byteLength':len(self.buffer)}], 'bufferViews':self.buffer_views,
             'accessors':self.accessors,'animations':self.animations}
        j=json.dumps(doc,separators=(',',':'),ensure_ascii=True).encode('utf-8')
        while len(j)%4:j+=b' '
        blob=bytes(self.buffer)
        length=12+8+len(j)+8+len(blob)
        return b'glTF'+struct.pack('<II',2,length)+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(blob),b'BIN\x00')+blob
