"""BugBaas mode illustrations for the Strijd/Arcade hubs (one picture per play mode), own geometry, same HD stage.
Run low priority: blender --background --factory-startup --python build_modes.py -- <repo-with-.local/polyhaven> <out-dir> [preview] [mode ...]
Outputs <out-dir>/mode-<name>.png (512 px, transparent)."""
import bpy,math,sys,os,bmesh
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from hd_lib import HD
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
REPO=args[0];OUT=os.path.abspath(args[1]);rest=args[2:];PREVIEW='preview' in rest;ONLY=[a for a in rest if a!='preview']
os.makedirs(OUT,exist_ok=True)
hd=HD(REPO,size=300 if PREVIEW else 512,samples=24 if PREVIEW else 72)
R=math.radians

def obj():return bpy.context.object
def box(loc,scale,mat,rot=(0,0,0),bevel=.03):bpy.ops.mesh.primitive_cube_add(size=1,location=loc,rotation=rot);o=obj();o.scale=scale;hd.finish(o,mat,bevel=bevel);return o
def cyl(loc,r,depth,mat,rot=(0,0,0),v=64,bevel=.02):bpy.ops.mesh.primitive_cylinder_add(vertices=v,radius=r,depth=depth,location=loc,rotation=rot);o=obj();hd.finish(o,mat,bevel=bevel);return o
def cone(loc,r1,r2,depth,mat,rot=(0,0,0)):bpy.ops.mesh.primitive_cone_add(vertices=64,radius1=r1,radius2=r2,depth=depth,location=loc,rotation=rot);o=obj();hd.finish(o,mat,bevel=.01);return o
def ball(loc,r,mat):bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,radius=r,location=loc);o=obj();hd.finish(o,mat);return o
def torus(loc,R1,r,mat,rot=(0,0,0)):bpy.ops.mesh.primitive_torus_add(major_radius=R1,minor_radius=r,major_segments=64,minor_segments=12,location=loc,rotation=rot);o=obj();hd.finish(o,mat);return o
def platform(mat,rim):cyl((0,0,.1),1.25,.2,mat,v=96,bevel=.05);torus((0,0,.2),1.2,.05,rim)

def sword(x,angle,metal,grip,gold):
    s=bpy.data.objects.new('Sword',None);bpy.context.collection.objects.link(s)
    parts=[box((0,0,.95),(.11,.035,1.25),metal),cone((0,0,1.65),.075,0,.18,metal),box((0,0,.3),(.42,.08,.08),gold),cyl((0,0,.12),.045,.3,grip),ball((0,0,-.05),.07,gold)]
    for p in parts:p.parent=s
    s.location=(x,0,.25);s.rotation_euler=(0,R(angle),0);return s

def scene(name):
    hd.reset();gold=hd.solid('Gold','#F2C14E',.18,metal=1.);teal=hd.solid('Teal','#1FC3D3',.35,coat=.6);moss=hd.solid('Moss','#3E6B3A',.8);stone=hd.solid('Stone','#8C8064',.7)
    if name=='duel':  # crossed swords above an arena disc
        platform(stone,teal);sword(-.18,32,hd.solid('Steel','#C9D2DA',.2,metal=1.),hd.solid('Grip','#5A3A22',.6),gold);sword(.18,-32,hd.solid('Steel2','#C9D2DA',.2,metal=1.),hd.solid('Grip2','#7A2E2E',.6),gold)
        hd.stage(5.2,1.6,1.0,lens=50,yaw=-20,ground=False)
    elif name=='beker':  # weekly cup trophy
        cyl((0,0,.12),.6,.24,stone,v=8,bevel=.04);cyl((0,0,.32),.42,.16,gold);cyl((0,0,.62),.09,.5,gold);cone((0,0,1.25),.28,.62,.9,gold);torus((0,0,1.7),.6,.05,gold)
        for s in (-1,1):torus((s*.68,0,1.3),.24,.055,gold,rot=(R(90),0,0))
        ball((0,-.05,1.15),.12,hd.solid('Gem','#F0476B',.05))
        hd.stage(5.0,1.5,1.0,lens=50,yaw=-15,ground=False)
    elif name=='dag':  # daily: sun with rays over a small shield
        sun=hd.solid('Sun','#FFC94A',.3,emit=1.5);ball((0,0,1.25),.45,sun)
        for i in range(12):a=i/12*math.pi*2;box((math.cos(a)*.78,0,1.25+math.sin(a)*.78),(.09,.05,.32),sun,rot=(0,-a+R(90),0),bevel=.02)
        me=bpy.data.meshes.new('Shield');bm=bmesh.new();pts=[(-.38,.75),(.38,.75),(.38,.35),(0,-.05),(-.38,.35)];f=bm.faces.new([bm.verts.new((x,-.55,z)) for x,z in pts]);r=bmesh.ops.extrude_face_region(bm,geom=[f]);bmesh.ops.translate(bm,vec=(0,-.14,0),verts=[e for e in r['geom'] if isinstance(e,bmesh.types.BMVert)]);bm.to_mesh(me);bm.free()
        o=bpy.data.objects.new('Shield',me);bpy.context.collection.objects.link(o);hd.finish(o,teal,bevel=.04,smooth=False)
        hd.stage(5.0,1.3,.9,lens=50,yaw=-10,ground=False)
    elif name=='live':  # two trainers' pins on a little globe, linked by an arc
        ball((0,0,.75),.75,hd.solid('Globe','#3C8FC4',.4,coat=.5));
        for (x,z,c) in [(-.45,1.3,'#F0476B'),(.5,1.25,'#F2C14E')]:
            m=hd.solid('Pin'+c,c,.3);cone((x,-.2,z+.18),.12,0,.36,m,rot=(R(180),0,0));ball((x,-.2,z+.42),.15,m)
        bpy.ops.mesh.primitive_torus_add(major_radius=.55,minor_radius=.025,major_segments=64,minor_segments=8,location=(0,-.2,1.55),rotation=(R(90),0,0));o=obj();hd.finish(o,hd.solid('Arc','#FFF2C4',.3,emit=1.))
        hd.stage(4.8,1.6,.95,lens=50,yaw=-20,ground=False)
    elif name=='arcade':  # small arcade cabinet
        body=hd.solid('Cab','#5B4BD8',.35,coat=.5);box((0,0,.85),(.9,.7,1.7),body);box((0,-.32,1.25),(.7,.1,.55),hd.solid('Screen','#6BEFF2',.1,emit=2.2),rot=(R(-12),0,0));box((0,-.42,.72),(.86,.4,.1),body,rot=(R(10),0,0))
        cyl((-.2,-.48,.84),.035,.2,hd.solid('Stick','#222831',.4));ball((-.2,-.48,.96),.08,hd.solid('Knob','#F0476B',.2))
        for i,c in enumerate(['#F2C14E','#1FC3D3']):cyl((.12+i*.18,-.5,.8),.06,.05,hd.solid('B'+c,c,.2))
        box((0,0,1.78),(.92,.72,.16),hd.solid('Top','#F2C14E',.3,emit=.6))
        hd.stage(5.0,1.7,1.0,lens=50,yaw=-28,ground=False)
    elif name=='wedstrijd':  # arcade versus: podium 1-2 with a star
        box((-.42,0,.3),(.75,.7,.6),hd.solid('P2','#C9D2DA',.3,metal=.6));box((.42,0,.45),(.75,.7,.9),gold)
        me=bpy.data.meshes.new('Star');bm=bmesh.new();pts=[(math.cos(R(90+i*36))*(.42 if i%2==0 else .18)+.42,math.sin(R(90+i*36))*(.42 if i%2==0 else .18)+1.45) for i in range(10)];f=bm.faces.new([bm.verts.new((x,0,z)) for x,z in pts]);r=bmesh.ops.extrude_face_region(bm,geom=[f]);bmesh.ops.translate(bm,vec=(0,-.15,0),verts=[e for e in r['geom'] if isinstance(e,bmesh.types.BMVert)]);bm.to_mesh(me);bm.free()
        o=bpy.data.objects.new('Star',me);bpy.context.collection.objects.link(o);hd.finish(o,gold,bevel=.03,smooth=False)
        for x,t in [(-.42,'2'),(.42,'1')]:
            bpy.ops.object.text_add(location=(x,-.36,.35 if t=='2' else .5),rotation=(R(90),0,0));o=obj();o.data.body=t;o.data.align_x='CENTER';o.data.size=.42;o.data.extrude=.03;bpy.ops.object.convert(target='MESH');o=obj();hd.finish(o,hd.solid('Num'+t,'#0E2828',.4),smooth=False)
        hd.stage(5.0,1.4,.9,lens=50,yaw=-15,ground=False)
    hd.render(os.path.join(OUT,'mode-%s.png'%name))

for n in (ONLY or ['duel','beker','dag','live','arcade','wedstrijd']):scene(n)
print('MODES_OK',sorted(os.listdir(OUT)))
