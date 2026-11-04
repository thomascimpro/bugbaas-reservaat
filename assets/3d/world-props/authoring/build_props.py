"""BugBaas map props in HD (style: docs/concepts/combat-20261102). Own geometry, CC0 Poly Haven materials.
Run low priority: blender --background --factory-startup --python build_props.py -- <repo> [egg|gym|post ...]
Outputs: assets/v2/props/*.png (HD UI renders) and public/models/props/*.glb (map; flat colours, runtime recolour of
'EggShell' / 'TeamColor' / 'PostDisc')."""
import bpy,math,sys,os,random
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from hd_lib import HD,lin
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
REPO=args[0] if args else os.getcwd();ONLY=set(args[1:]) or {'egg','gym','post'}
ART=os.path.join(REPO,'assets','v2','props');GLB=os.path.join(REPO,'public','models','props')
PREVIEW='preview' in ONLY;ONLY.discard('preview');ONLY=ONLY or {'egg','gym','post'}
hd=HD(REPO,size=420 if PREVIEW else 768,samples=24 if PREVIEW else 128)

def cocoon_shell(name):
    """Silk chrysalis: cream silk with a tier-coloured glow shining through the grooves between the rings."""
    m=bpy.data.materials.new(name);m.use_nodes=True;nt=m.node_tree;b=nt.nodes['Principled BSDF']
    tc=nt.nodes.new('ShaderNodeTexCoord');wave=nt.nodes.new('ShaderNodeTexWave');wave.wave_type='BANDS';wave.bands_direction='Z'
    wave.inputs['Scale'].default_value=1.6;wave.inputs['Distortion'].default_value=2.5;wave.inputs['Detail'].default_value=3;nt.links.new(tc.outputs['Object'],wave.inputs['Vector'])
    band=nt.nodes.new('ShaderNodeValToRGB');band.color_ramp.elements[0].position=.0;band.color_ramp.elements[1].position=.2;nt.links.new(wave.outputs['Fac'],band.inputs['Fac'])
    silk=nt.nodes.new('ShaderNodeTexNoise');silk.inputs['Scale'].default_value=40;silk.inputs['Detail'].default_value=10;nt.links.new(tc.outputs['Object'],silk.inputs['Vector'])
    base=nt.nodes.new('ShaderNodeMix');base.data_type='RGBA';base.inputs['Factor'].default_value=.25;base.inputs[6].default_value=(*lin('#EADBB8'),1);base.inputs[7].default_value=(*lin('#B89F74'),1)
    tint=nt.nodes.new('ShaderNodeMix');tint.name='Tint';tint.data_type='RGBA';tint.blend_type='MULTIPLY';tint.inputs['Factor'].default_value=1.0
    nt.links.new(silk.outputs['Fac'],base.inputs['Factor']);nt.links.new(base.outputs[2],tint.inputs[6]);nt.links.new(tint.outputs[2],b.inputs['Base Color'])
    bp=nt.nodes.new('ShaderNodeBump');bp.inputs['Strength'].default_value=.25;nt.links.new(silk.outputs['Fac'],bp.inputs['Height']);nt.links.new(bp.outputs['Normal'],b.inputs['Normal'])
    inv=nt.nodes.new('ShaderNodeMath');inv.operation='SUBTRACT';inv.inputs[0].default_value=1;nt.links.new(band.outputs['Color'],inv.inputs[1])
    em=nt.nodes.new('ShaderNodeMath');em.operation='MULTIPLY';em.inputs[1].default_value=3.5;nt.links.new(inv.outputs[0],em.inputs[0]);nt.links.new(em.outputs[0],b.inputs['Emission Strength'])
    b.inputs['Roughness'].default_value=.42;b.inputs['Sheen Weight'].default_value=.3;b.inputs['Sheen Tint'].default_value=(1,1,1,1)
    b.inputs['Subsurface Weight'].default_value=.35;b.inputs['Coat Weight'].default_value=.25;b.inputs['Coat Roughness'].default_value=.15
    m['flat']=list(lin('#F3E7C8'));return m
def tint_cocoon(m,hexcol):
    b=m.node_tree.nodes['Principled BSDF'];c=lin(hexcol);m.node_tree.nodes['Tint'].inputs[7].default_value=(*[.08+.92*x for x in c],1);b.inputs['Emission Color'].default_value=(*c,1);b.inputs['Subsurface Radius'].default_value=c;m['flat']=[.55+.45*x for x in c]
def chrysalis(name,m,top=2.35,length=1.55,r=.42):
    """Lathed chrysalis: pointed tail, bulging body with rings, tapered head with a silk stalk."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=64,radius=1,location=(0,0,0));o=bpy.context.object;o.name=name
    for v in o.data.vertices:
        t=(1-v.co.z)/2;xy=math.hypot(v.co.x,v.co.y)  # t: 0 head .. 1 tail
        tt=min(1,max(0,t));prof=(tt**.55)*((1-tt)**1.25)*2.25*(1+.07*math.cos(tt*math.pi*14)*(.22<tt<.9))*r
        if xy>1e-6:v.co.x,v.co.y=v.co.x/xy*prof,v.co.y/xy*prof
        v.co.z=top-t*length;v.co.x+=.22*t**2.2  # tail curls
    return hd.finish(o,m,sub=1)

if 'egg' in ONLY:
    hd.reset()
    rock=hd.pbr('Rock','mossy_rock',1.4);bark=hd.pbr('Branch','bark_willow_02',2.4,tint='#B08A64');ground=hd.pbr('Moss','forest_ground_04',1.6)
    leafm=hd.leaf_mat('Leaf','#5DAA3A')
    silkm=hd.solid('Silk','#FBF4E2',.35,sheen=1.)
    shell=cocoon_shell('EggShell')
    hd.blob('Rock',(0,0,.15),(1.25,1.1,.42),rock,seg=32,sub=1,disp=.14,disp_scale=.7)
    hd.blob('MossCap',(0,0,.38),(1.02,.95,.16),ground,seg=32,sub=1,disp=.05,disp_scale=.25)
    # arching branch from the rock over the top, the chrysalis hangs from it
    hd.branch('Branch',[(-.95,.15,.3),(-1.05,.05,1.3),(-.75,0,2.55),(-.15,0,3.25),(.55,0,3.2),(1.0,.1,2.85)],.1,bark,.3)
    hd.branch('Twiglet',[(-.55,0,2.9),(-.6,-.25,3.35),(-.35,-.4,3.6)],.035,bark,.3)
    for i,(x,y,z,yaw,pitch) in enumerate([(-1.0,.1,1.6,2.9,-30),(.95,.12,2.9,-.3,-35),(.7,-.1,3.15,.9,-20),(-.35,-.42,3.55,2.0,-15),(-.55,.1,2.6,3.6,-28)]):hd.leaf('Leaf%d'%i,(x,y,z),1.0,yaw,math.radians(pitch),leafm,roll=math.radians(-55 if i%2 else 50))
    for i in range(6):a=i/6*math.tau+.4;hd.leaf('GLeaf%d'%i,(math.cos(a)*.8,math.sin(a)*.8,.5),.55,a,math.radians(-18),leafm,roll=math.radians(25))
    chrysalis('Cocoon',shell,top=3.12,length=2.05,r=.52)
    hd.branch('Stalk',[(.05,0,3.2),(.04,0,3.05),(0,0,2.95)],.035,silkm,.6)
    for i in range(5):  # silk stalk + a few loose silk threads around the cocoon
        hd.curve_twig('Silk%d'%i,(random.uniform(-.06,.06),0,2.92),(random.uniform(-.25,.25),random.uniform(-.25,.25),random.uniform(1.5,2.4)),(random.uniform(-.3,.3),random.uniform(-.3,.3),0),.006,silkm)
    bpy.ops.object.light_add(type='POINT',location=(0,0,1.7));glow=bpy.context.object;glow.data.energy=40;glow.data.shadow_soft_size=.8
    hd.stage(6.8,2.7,1.8,lens=50)
    for tier,col in ([(4,'#B45BEB')] if PREVIEW else [(1,'#5CC23A'),(3,'#3A9BEF'),(4,'#B45BEB'),(5,'#F2A33A')]):
        tint_cocoon(shell,col);glow.data.color=lin(col);hd.render(os.path.join(REPO,'.local','props','preview-cocoon.png') if PREVIEW else os.path.join(ART,'raid-egg-%d.png'%tier))
    if PREVIEW:raise SystemExit
    tint_cocoon(shell,'#FFFFFF');bpy.data.objects.remove(glow);hd.export_glb(os.path.join(GLB,'RaidEgg.glb'))

def banner(name,a,R,z,h,m):
    """Hanging cloth banner with a soft wave and a pointed tail."""
    bpy.ops.mesh.primitive_plane_add(size=1);o=bpy.context.object;o.name=name
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.subdivide(number_cuts=12);bpy.ops.object.mode_set(mode='OBJECT')
    for v in o.data.vertices:
        u,w=v.co.x+.5,v.co.y+.5          # u across, w down
        v.co.x=(u-.5)*.66;v.co.z=-w*h+(.12*h if w>.86 and abs(u-.5)<.5-(w-.86)*3.4 else 0)*0
        if w>.82:v.co.x*=max(0,1-(w-.82)*3.6)  # pointed tail
        v.co.y=.035*math.sin(u*math.pi*2+w*3)+.05*w
    o.rotation_euler=(0,0,a+math.pi/2);o.location=(math.cos(a)*R,math.sin(a)*R,z)
    mod=o.modifiers.new('sol','SOLIDIFY');mod.thickness=.02;return hd.finish(o,m,sub=1)

DEEP={'fern':'#2E8A4A','amber':'#D0821C','tidal':'#2C7FB8','neutral':'#A89A6A'}
if 'gym' in ONLY:
    hd.reset()
    rock=hd.pbr('Rock','mossy_rock',1.1);stone=hd.pbr('Stone','mossy_rock',2.2,tint='#E8E2D2',rough_add=.05,bump=.6)
    bark=hd.pbr('Wood','bark_willow_02',2.6,tint='#B08A64');ground=hd.pbr('Ground','forest_ground_04',1.4)
    gold=hd.solid('Gold','#E8B84A',.25,metal=1.);arena=hd.solid('Arena','#EFE8D6',.55)
    cloth=hd.solid('TeamColor','#72C68A',.75,sheen=.15);crystal=hd.solid('Crystal','#72C68A',.12,emit=1.2,coat=1.)
    leafm=hd.leaf_mat('Leaf','#5DAA3A')
    hd.blob('Ground',(0,0,.05),(2.0,1.9,.18),ground,seg=40,sub=1,disp=.08,disp_scale=.35)
    hd.cyl('Plinth',1.55,.7,.42,rock,36,r2=1.3,sub=2,disp=.14,disp_scale=.6)
    hd.cyl('Step',1.18,.2,.86,stone,48,r2=1.08,sub=1,bevel=.04)
    hd.cyl('Pillar',.62,1.7,1.78,stone,40,r2=.48,sub=1,bevel=.05)
    hd.ring('Band1',.6,.06,1.05,gold);hd.ring('Band2',.5,.055,2.45,gold)
    for i in range(4):
        a=i/4*math.tau+.35
        hd.branch('Pole%d'%i,[(math.cos(a)*.52,math.sin(a)*.52,2.4),(math.cos(a)*.95,math.sin(a)*.95,2.42)],.04,bark,.8)
        banner('Banner%d'%i,a,.9,2.38,1.15,cloth)
    hd.cyl('Crown',.5,.38,2.7,stone,40,r2=.95,sub=1,bevel=.04)
    hd.cyl('Arena',1.12,.18,2.97,arena,64,bevel=.05)
    hd.ring('ArenaRim',1.12,.07,3.03,gold)
    for i in range(6):
        a=i/6*math.tau+math.pi/6;bpy.ops.mesh.primitive_cone_add(vertices=6,radius1=.17,radius2=0,depth=random.uniform(.62,.85),location=(math.cos(a)*1.1,math.sin(a)*1.1,3.3));hd.finish(bpy.context.object,crystal,smooth=False)
    for i in range(7):  # ivy leaves climbing the plinth and pillar
        a=i/7*math.tau+.2;z=.75+random.uniform(0,.9);R=1.3 if z<.9 else .62
        hd.leaf('Ivy%d'%i,(math.cos(a)*R,math.sin(a)*R,z),.45,a,math.radians(-40),leafm,roll=math.radians(70))
    hd.stage(9.6,4.6,1.8,lens=50)
    for team,col in ([('fern','#72C68A')] if PREVIEW else [('fern','#72C68A'),('amber','#EDB65F'),('tidal','#69BCE0'),('neutral','#C6B98C')]):
        hd.recolor('TeamColor',DEEP.get(team,col));hd.recolor('Crystal',DEEP.get(team,col),1.2 if team!='neutral' else .2)
        hd.render(os.path.join(REPO,'.local','props','preview-gym.png') if PREVIEW else os.path.join(ART,'gym-'+team+'.png'))
    if not PREVIEW:hd.recolor('TeamColor','#C6B98C');hd.recolor('Crystal','#E8F4FF',.4);hd.export_glb(os.path.join(GLB,'Gym.glb'))

if 'post' in ONLY:
    hd.reset()
    rock=hd.pbr('Rock','mossy_rock',1.6);bark=hd.pbr('Wood','bark_willow_02',3.0,tint='#B08A64');gold=hd.solid('Gold','#E8B84A',.25,metal=1.)
    disc=hd.solid('PostDisc','#43D7C0',.25,emit=.6,coat=1.);mark=hd.solid('LeafMark','#FFF4CF',.4,emit=.4);leafm=hd.leaf_mat('Leaf','#5DAA3A')
    hd.blob('Foot',(0,0,.14),(.95,.9,.32),rock,seg=32,sub=1,disp=.12,disp_scale=.6)
    hd.branch('Pole',[(0,0,.3),(.03,0,1.4),(0,0,2.1)],.15,bark,.7)
    bpy.ops.mesh.primitive_cylinder_add(vertices=72,radius=.8,depth=.16,location=(0,0,2.85),rotation=(math.radians(90),0,0));hd.finish(bpy.context.object,disc,bevel=.05)
    hd.ring('DiscRim',.8,.07,2.85,gold,rot=(math.radians(90),0,0))
    bpy.ops.mesh.primitive_torus_add(major_radius=.52,minor_radius=.03,major_segments=64,minor_segments=10,location=(0,-.09,2.85),rotation=(math.radians(90),0,0));hd.finish(bpy.context.object,gold)
    hd.blob('Knob',(0,0,3.72),(.13,.13,.13),gold);hd.cyl('Neck',.06,.25,3.6,gold,16)
    for s,y in ((1,-.1),(-1,.1)):hd.leaf('Mark%d'%s,(-.34*s,y,2.78),.68,0 if s>0 else math.pi,math.radians(-35*s) if s>0 else math.radians(35),mark,curl=.0,roll=math.radians(90))
    bpy.ops.object.empty_add(location=(0,0,0));turn=bpy.context.object
    for o in bpy.data.objects:
        if o is not turn and o.parent is None and o.type in ('MESH','CURVE'):o.parent=turn
    turn.rotation_euler[2]=math.radians(-42)
    for i in range(4):a=i/4*math.tau+.3;hd.leaf('GLeaf%d'%i,(math.cos(a)*.75,math.sin(a)*.75,.32),.5,a,math.radians(-15),leafm,roll=math.radians(25))
    hd.stage(7.2,3.4,1.75,lens=50)
    for state,col in ([('ready','#43D7C0')] if PREVIEW else [('ready','#43D7C0'),('visited','#AAA1CA')]):
        hd.recolor('PostDisc',col,.6);hd.render(os.path.join(REPO,'.local','props','preview-post.png') if PREVIEW else os.path.join(ART,'post-'+state+'.png'))
    if not PREVIEW:hd.recolor('PostDisc','#43D7C0',.6);hd.export_glb(os.path.join(GLB,'Post.glb'))

if 'arena' in ONLY:  # D2: battle platform under the bugs (background painting is Codex')
    hd.reset()
    rock=hd.pbr('Rock','mossy_rock',1.0);ground=hd.pbr('Moss','forest_ground_04',1.2,tint='#A9D27A');gold=hd.solid('Gold','#E8B84A',.25,metal=1.);leafm=hd.leaf_mat('Leaf','#5DAA3A')
    hd.cyl('Base',2.2,.5,.25,rock,48,r2=2.0,sub=2,disp=.16,disp_scale=.7)
    hd.cyl('Top',1.95,.12,.52,ground,64,sub=1,disp=.03,disp_scale=.3)
    hd.ring('Rim',1.97,.05,.56,gold)
    for i in range(10):a=i/10*math.tau+random.uniform(-.1,.1);hd.leaf('L%d'%i,(math.cos(a)*2.05,math.sin(a)*2.05,.4),.6,a,math.radians(-20),leafm,roll=math.radians(30))
    hd.stage(8.5,4.2,.4,lens=45)
    hd.render(os.path.join(REPO,'.local','props','preview-arena.png') if PREVIEW else os.path.join(ART,'arena-platform.png'))
    if not PREVIEW:hd.export_glb(os.path.join(GLB,'ArenaPlatform.glb'))

if 'medals' in ONLY:  # E2: rank medals bronze / silver / gold for the battle result and rank screen
    for tier,(metal,ribbon) in {'brons':('#C07A3E','#3C8FC4'),'zilver':('#C9D2DA','#2E8A4A'),'goud':('#F2C14E','#B45BEB')}.items():
        hd.reset();mm=hd.solid('Metal',metal,.22,metal=1.);rb=hd.solid('Ribbon',ribbon,.6,sheen=.5);leafm=hd.leaf_mat('Leaf','#5DAA3A')
        for s in (-1,1):
            bpy.ops.mesh.primitive_cube_add(size=1,location=(s*.28,0,1.35));o=bpy.context.object;o.scale=(.32,.04,1.0);o.rotation_euler=(0,math.radians(-s*18),0);hd.finish(o,rb,bevel=.02)
        bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=.75,depth=.16,location=(0,0,.75),rotation=(math.radians(90),0,0));hd.finish(bpy.context.object,mm,bevel=.04)
        bpy.ops.mesh.primitive_torus_add(major_radius=.62,minor_radius=.05,major_segments=96,minor_segments=12,location=(0,-.09,.75),rotation=(math.radians(90),0,0));hd.finish(bpy.context.object,mm)
        import bmesh
        me=bpy.data.meshes.new('Star');bm=bmesh.new();pts=[(math.cos(math.radians(90+i*36))*(.42 if i%2==0 else .18),math.sin(math.radians(90+i*36))*(.42 if i%2==0 else .18)+.75) for i in range(10)]
        f=bm.faces.new([bm.verts.new((x,-.09,z)) for x,z in pts]);r=bmesh.ops.extrude_face_region(bm,geom=[f]);bmesh.ops.translate(bm,vec=(0,-.1,0),verts=[e for e in r['geom'] if isinstance(e,bmesh.types.BMVert)])
        bm.to_mesh(me);bm.free();o=bpy.data.objects.new('Star',me);bpy.context.collection.objects.link(o);hd.finish(o,mm,bevel=.025,smooth=False)
        hd.stage(4.6,1.4,.95,lens=55,yaw=-15,ground=False)
        hd.render(os.path.join(REPO,'.local','props','preview-medal.png') if PREVIEW else os.path.join(REPO,'assets','v2','props','medal-'+tier+'.png'))
        if PREVIEW:break
print('PROPS_OK',sorted(os.listdir(ART)))
