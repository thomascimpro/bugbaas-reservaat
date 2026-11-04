"""Map nature set (assets/3d/README.md A4): low-poly, one mesh + one vertex-colour material per GLB so the map can
instance hundreds of them (replaces the primitive blocks in src/natureMapV2.ts). Own work, CC0.
Run: blender --background --factory-startup --python assets/3d/nature/authoring/build_nature.py -- <repo> [preview]
Out: public/models/nature/<Name>.glb (1 unit = 1 m, base at origin) and a contact sheet .local/nature/sheet.png."""
import bpy,bmesh,math,os,random,sys
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','world-props','authoring'))
from hd_lib import HD,lin
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
REPO=args[0] if args else os.getcwd();PREVIEW='preview' in args
OUT=os.path.join(REPO,'public','models','nature');SHEET=os.path.join(REPO,'.local','nature');os.makedirs(OUT,exist_ok=True);os.makedirs(SHEET,exist_ok=True)
hd=HD(REPO,size=360 if PREVIEW else 512,samples=24 if PREVIEW else 64)

def part(o,hexcol,jitter=.06):
    """Paint every face of a part in one colour (slightly varied) as vertex colour."""
    me=o.data;attr=me.color_attributes.get('Col') or me.color_attributes.new('Col','BYTE_COLOR','CORNER');h=hexcol.lstrip('#');c=tuple(int(h[i:i+2],16)/255 for i in (0,2,4))
    for poly in me.polygons:
        k=1+random.uniform(-jitter,jitter)
        for li in poly.loop_indices:attr.data[li].color_srgb=(min(1,c[0]*k),min(1,c[1]*k),min(1,c[2]*k),1)
    return o
def ico(loc,r,sub=1,scale=(1,1,1),noise=.12):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=r,location=loc);o=bpy.context.object;o.scale=scale
    for v in o.data.vertices:v.co*=1+random.uniform(-noise,noise)
    return o
def cone(loc,r1,r2,h,verts=7,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cone_add(vertices=verts,radius1=r1,radius2=r2,depth=h,location=loc,rotation=rot);return bpy.context.object
def cyl(loc,r,h,verts=7,rot=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=h,location=loc,rotation=rot);return bpy.context.object
def blade(base,h,w,lean,yaw):
    """Flat tapered blade (grass/reed leaf)."""
    me=bpy.data.meshes.new('blade');bm=bmesh.new();x0,y0,z0=base
    ca,sa=math.cos(yaw),math.sin(yaw);pts=[(-w,0),(w,0),(w*.55,h*.55),(-w*.55,h*.55),(0,h)]
    vs=[bm.verts.new((x0+ca*(px)+sa*lean*pz/h*h*.3,y0+sa*(px)-ca*lean*pz/h*h*.3,z0+pz)) for px,pz in pts]
    bm.faces.new((vs[0],vs[1],vs[2],vs[3]));bm.faces.new((vs[3],vs[2],vs[4]));bm.to_mesh(me);bm.free()
    o=bpy.data.objects.new('blade',me);bpy.context.collection.objects.link(o);return o
def finish(name):
    """Join all parts into one mesh with a single vertex-colour material, origin at ground centre, export."""
    objs=[o for o in bpy.data.objects if o.type=='MESH']
    for o in objs:o.select_set(True)
    bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join();o=bpy.context.object;o.name=name
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    m=bpy.data.materials.new('Nature');m.use_nodes=True;nt=m.node_tree;b=nt.nodes['Principled BSDF'];ca=nt.nodes.new('ShaderNodeVertexColor');ca.layer_name='Col'
    nt.links.new(ca.outputs['Color'],b.inputs['Base Color']);b.inputs['Roughness'].default_value=.8
    o.data.materials.clear();o.data.materials.append(m)
    for p in o.data.polygons:p.use_smooth=False
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_vertex_color='ACTIVE',export_all_vertex_colors=False)
    return o,len(o.data.polygons)

BARK,BARK2='#7A5434','#5C3E26';LEAF,LEAF2,LEAF3='#4FA83E','#3D8A34','#7CC44E';PINE,PINE2='#2F6E4A','#3F8A5A'
def oak():
    part(cone((0,0,1.1),.32,.2,2.2),BARK,.1)
    for _ in range(3):
        a=random.uniform(0,math.tau);part(cone((math.cos(a)*.35,math.sin(a)*.35,1.9),.1,.04,.9,5,rot=(math.cos(a)*.7,math.sin(a)*-.7,0)),BARK2)
    for i,(x,y,z,r) in enumerate([(0,0,3.0,1.25),(.75,.2,2.55,.85),(-.7,-.25,2.6,.9),(.1,.75,2.45,.8),(-.15,-.7,3.35,.7),(.3,-.1,3.7,.7)]):
        part(ico((x,y,z),r,1,noise=.14),[LEAF,LEAF2,LEAF3][i%3])
def pine():
    part(cyl((0,0,.6),.18,1.2,6),BARK2)
    for i,(z,r,h) in enumerate([(1.4,1.25,1.5),(2.3,.95,1.3),(3.1,.68,1.15),(3.8,.4,.9)]):part(cone((0,0,z),r,0,h,8),[PINE,PINE2][i%2],.08)
def shrub():
    for i,(x,y,z,r) in enumerate([(0,0,.45,.55),(.42,.1,.38,.42),(-.38,.15,.36,.4),(.05,-.4,.34,.38),(.1,.3,.7,.35)]):part(ico((x,y,z),r,1,noise=.15),[LEAF2,LEAF,LEAF3][i%3])
    for i in range(5):a=random.uniform(0,math.tau);part(ico((math.cos(a)*.5,math.sin(a)*.5,.55+random.uniform(0,.25)),.07,0,noise=0),'#E86B8A')  # berries/blossoms
def flowers():
    cols=['#F2C14E','#E86B8A','#FFF4CF','#9C7BE8','#F28A3A']
    for i in range(7):
        a=i/7*math.tau+random.uniform(-.3,.3);R=random.uniform(.1,.38);x,y=math.cos(a)*R,math.sin(a)*R;h=random.uniform(.3,.55)
        part(cyl((x,y,h/2),.015,h,4),LEAF2);c=cols[i%len(cols)]
        for k in range(5):b=k/5*math.tau;part(ico((x+math.cos(b)*.05,y+math.sin(b)*.05,h),.045,0,scale=(1,1,.45),noise=0),c)
        part(ico((x,y,h+.01),.03,0,noise=0),'#7A4A1C')
    for i in range(6):a=random.uniform(0,math.tau);part(blade((math.cos(a)*.2,math.sin(a)*.2,0),random.uniform(.25,.4),.03,.15,a),LEAF)
def grass():
    for i in range(14):a=random.uniform(0,math.tau);R=random.uniform(0,.22);part(blade((math.cos(a)*R,math.sin(a)*R,0),random.uniform(.3,.6),.035,.25,a),random.choice([LEAF,LEAF2,LEAF3,'#8FB84A']))
def reeds():
    for i in range(10):
        a=random.uniform(0,math.tau);R=random.uniform(0,.25);x,y=math.cos(a)*R,math.sin(a)*R;h=random.uniform(.9,1.5)
        part(blade((x,y,0),h,.03,.12,a),random.choice(['#6E9A3E','#8AAE4A','#5F8A3A']))
        if i%3==0:part(cyl((x,y,h*.85),.045,.22,6),'#6B4426');part(cyl((x,y,h*.6),.012,h*.5,4),'#6E9A3E')
def rock():
    o=part(ico((0,0,.32),.55,2,scale=(1.25,1,.7),noise=.16),'#9C9483',.1)
    part(ico((.25,.1,.62),.28,1,scale=(1.2,1,.35),noise=.1),'#5E9A34',.1)   # moss cap
    part(ico((-.6,.35,.15),.22,1,scale=(1,1,.7),noise=.15),'#8C8472')
def mushroom():
    for i,(x,y,s) in enumerate([(0,0,1.),(.22,.12,.65),(-.18,.15,.5)]):
        part(cyl((x,y,.14*s),.05*s,.28*s,8),'#F4EEDC');part(ico((x,y,.3*s),.17*s,2,scale=(1,1,.55),noise=.02),'#D9452E')
        for k in range(5):b=k/5*math.tau+i;part(ico((x+math.cos(b)*.1*s,y+math.sin(b)*.1*s,.36*s),.025*s,0,noise=0),'#FFF8EA')
def log():
    part(cyl((0,0,.28),.28,1.6,9,rot=(0,math.radians(90),0)),BARK,.1)
    for sgn in (-1,1):part(cyl((sgn*.8,0,.28),.25,.04,9,rot=(0,math.radians(90),0)),'#D8B98A')
    part(ico((.2,0,.5),.3,1,scale=(1.6,.9,.3),noise=.12),'#5E9A34')
    part(ico((-.45,.05,.52),.08,1,scale=(1,1,.5),noise=0),'#D9452E')

SET=[('TreeOak',oak),('TreePine',pine),('Shrub',shrub),('Flowers',flowers),('Grass',grass),('Reeds',reeds),('Rock',rock),('Mushroom',mushroom),('Log',log)]
report=[]
for name,build in SET:
    hd.reset();random.seed(hash(name)%1000);build();o,faces=finish(name)
    report.append((name,faces,os.path.getsize(os.path.join(OUT,name+'.glb'))))
    h=max(v.co.z for v in o.data.vertices);hd.stage(max(3.2,h*2.6),max(1.6,h*1.2),h*.45,lens=50)
    hd.render(os.path.join(SHEET,name+'.png'))
for r in report:print('NATURE',*r)
