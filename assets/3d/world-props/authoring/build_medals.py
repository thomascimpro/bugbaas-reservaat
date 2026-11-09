"""BugBaas trainer medals (profile medal case): 8 categories x 4 tiers, own geometry, same HD stage as the rank medals.
Metal = tier (brons/zilver/goud/platina), ribbon colour + raised emblem = category. Display only; no rewards are attached.
Run low priority: blender --background --factory-startup --python build_medals.py -- <repo-with-.local/polyhaven> <out-dir> [preview] [category ...]
Outputs <out-dir>/medal-<category>-<tier>.png (512 px, transparent)."""
import bpy,math,sys,os,bmesh
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from hd_lib import HD
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
REPO=args[0];OUT=os.path.abspath(args[1]);rest=args[2:];PREVIEW='preview' in rest;ONLY=[a for a in rest if a!='preview']
os.makedirs(OUT,exist_ok=True)
hd=HD(REPO,size=300 if PREVIEW else 512,samples=24 if PREVIEW else 72)
TIERS={'brons':('#C07A3E',.24),'zilver':('#C9D2DA',.18),'goud':('#F2C14E',.16),'platina':('#DCE9F5',.08)}
RIBBON={'jager':'#3BA55C','wandelaar':'#3C8FC4','verzamelaar':'#B45BEB','broeder':'#E7A63B','strijder':'#E2475F','scherpschutter':'#1FC3D3','shinyjager':'#E8559B','arcade':'#5B4BD8'}
Y=-.09;CZ=.75

def prism(name,pts,mat,depth=.1,y=Y,bevel=.02):
    """Extrude a 2D outline (x,z) toward the camera (-y)."""
    me=bpy.data.meshes.new(name);bm=bmesh.new();f=bm.faces.new([bm.verts.new((x,y,z)) for x,z in pts])
    r=bmesh.ops.extrude_face_region(bm,geom=[f]);bmesh.ops.translate(bm,vec=(0,-depth,0),verts=[e for e in r['geom'] if isinstance(e,bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);hd.finish(o,mat,bevel=bevel,smooth=False);return o
def circle(cx,cz,r,n=40,rz=None):return [(cx+math.cos(i/n*math.pi*2)*r,cz+math.sin(i/n*math.pi*2)*(rz or r)) for i in range(n)]
def bar(name,cx,cz,length,width,angle,mat,depth=.1):
    a=math.radians(angle);dx,dz=math.cos(a)*length/2,math.sin(a)*length/2;nx,nz=-math.sin(a)*width/2,math.cos(a)*width/2
    return prism(name,[(cx-dx-nx,cz-dz-nz),(cx+dx-nx,cz+dz-nz),(cx+dx+nx,cz+dz+nz),(cx-dx+nx,cz-dz+nz)],mat,depth)
def ring(name,cx,cz,r,thick,mat):
    bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=thick,major_segments=72,minor_segments=10,location=(cx,Y-.05,cz),rotation=(math.radians(90),0,0));hd.finish(bpy.context.object,mat)
def star(cx,cz,ro,ri,points):return [(cx+math.cos(math.radians(90+i*180/points))*(ro if i%2==0 else ri),cz+math.sin(math.radians(90+i*180/points))*(ro if i%2==0 else ri)) for i in range(points*2)]

def emblem(cat,m):
    if cat=='jager':  # butterfly net: hoop + mesh bars + handle
        ring('Hoop',-.07,CZ+.1,.2,.035,m)
        for i,dx in enumerate((-.14,-.07,0)):bar('Mesh%d'%i,-.07+dx+.07,CZ+.1,.34,.018,90,m,.05)
        bar('Handle',.17,CZ-.2,.42,.06,-50,m)
    elif cat=='wandelaar':  # footprint
        prism('Sole',circle(0,CZ-.07,.14,40,.23),m)
        for i,(x,z,r) in enumerate([(-.12,CZ+.25,.05),(-.04,CZ+.29,.05),(.04,CZ+.29,.045),(.11,CZ+.25,.04),(.16,CZ+.19,.035)]):prism('Toe%d'%i,circle(x,z,r,20),m)
    elif cat=='verzamelaar':  # open book
        prism('PageL',[(-.36,CZ+.17),(-.03,CZ+.11),(-.03,CZ-.23),(-.36,CZ-.17)],m)
        prism('PageR',[(.03,CZ+.11),(.36,CZ+.17),(.36,CZ-.17),(.03,CZ-.23)],m)
        for i in range(3):bar('LineL%d'%i,-.2,CZ+.06-i*.09,.22,.018,-8,m,.13);bar('LineR%d'%i,.2,CZ+.06-i*.09,.22,.018,8,m,.13)
    elif cat=='broeder':  # hanging cocoon on a twig
        prism('Cocoon',[(math.sin(t/36*math.pi*2)*(.17*(1-((math.cos(t/36*math.pi*2)+1)/2)**3)+.06*abs(math.sin(t/36*math.pi*2))),CZ-.02+math.cos(t/36*math.pi*2)*.3) for t in range(36)],m)
        bar('Twig',0,CZ+.33,.5,.04,4,m);bar('Thread',0,CZ+.3,.06,.02,90,m)
    elif cat=='strijder':  # crossed swords
        for s in (-1,1):
            bar('Blade%d'%s,s*.02,CZ+.03,.62,.07,90+s*42,m);bar('Guard%d'%s,s*-.2,CZ-.2,.2,.05,s*42,m);bar('Grip%d'%s,s*-.26,CZ-.26,.12,.05,90+s*42,m)
    elif cat=='scherpschutter':  # target
        ring('R1',0,CZ,.32,.035,m);ring('R2',0,CZ,.19,.035,m);prism('Bull',circle(0,CZ,.075),m)
    elif cat=='shinyjager':  # sparkles
        prism('Spark',star(-.06,CZ-.02,.34,.11,4),m);prism('Spark2',star(.22,CZ+.24,.14,.05,4),m);prism('Spark3',star(.21,CZ-.24,.1,.035,4),m)
    elif cat=='arcade':  # gamepad
        body=[];w,h,r=.36,.17,.12
        for cx,cz,a0 in [(w-r,h-r,0),(-w+r,h-r,90),(-w+r,-h+r,180),(w-r,-h+r,270)]:body+= [(cx+math.cos(math.radians(a0+i*9))*r,CZ+cz+math.sin(math.radians(a0+i*9))*r) for i in range(11)]
        prism('Pad',body,m,.07)
        bar('DpadH',-.19,CZ,.16,.05,0,m,.14);bar('DpadV',-.19,CZ,.16,.05,90,m,.14)
        for i,(x,z) in enumerate([(.15,CZ+.05),(.24,CZ-.04)]):prism('Btn%d'%i,circle(x,z,.04,20),m,.14)

def medal(cat,tier):
    metal,rough=TIERS[tier];hd.reset()
    mm=hd.solid('Metal',metal,rough,metal=1.);em=hd.solid('Emblem',metal,max(.05,rough-.08),metal=1.);rb=hd.solid('Ribbon',RIBBON[cat],.6,sheen=.5)
    for s in (-1,1):
        bpy.ops.mesh.primitive_cube_add(size=1,location=(s*.28,0,1.35));o=bpy.context.object;o.scale=(.32,.04,1.0);o.rotation_euler=(0,math.radians(-s*18),0);hd.finish(o,rb,bevel=.02)
    bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=.75,depth=.16,location=(0,0,CZ),rotation=(math.radians(90),0,0));hd.finish(bpy.context.object,mm,bevel=.04)
    bpy.ops.mesh.primitive_torus_add(major_radius=.62,minor_radius=.05,major_segments=96,minor_segments=12,location=(0,-.09,CZ),rotation=(math.radians(90),0,0));hd.finish(bpy.context.object,mm)
    if tier=='platina':  # platinum gets a laurel of small gems around the rim
        gem=hd.solid('Gem','#8FE3FF',.05,metal=0.)
        for i in range(12):
            a=i/12*math.pi*2;bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=.045,location=(math.cos(a)*.69,-.1,CZ+math.sin(a)*.69));hd.finish(bpy.context.object,gem)
    # Coloured enamel inset so the metal emblem reads at small sizes; emblem scaled up around the medal centre.
    r,g,b=[int(RIBBON[cat][i:i+2],16) for i in (1,3,5)];enamel=hd.solid('Enamel','#%02X%02X%02X'%(int(r*.45),int(g*.45),int(b*.45)),.25,coat=1.)
    bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=.58,depth=.02,location=(0,-.085,CZ),rotation=(math.radians(90),0,0));hd.finish(bpy.context.object,enamel)
    before=set(bpy.data.objects);emblem(cat,em)
    for o in set(bpy.data.objects)-before:
        o.scale=(1.15,1.15,1.15);o.location.x=o.location.x*1.15;o.location.z=CZ+(o.location.z-CZ)*1.15
    hd.stage(4.6,1.4,.95,lens=55,yaw=-15,ground=False)
    hd.render(os.path.join(OUT,'medal-%s-%s.png'%(cat,tier)))

for cat in (ONLY or list(RIBBON)):
    for tier in TIERS:
        medal(cat,tier)
        if PREVIEW:break
print('MEDALS_OK',sorted(os.listdir(OUT)))
