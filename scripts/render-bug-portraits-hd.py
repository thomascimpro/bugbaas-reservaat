"""HD bug portraits in Blender (Cycles, forest HDRI, warm key + cool rim, soft contact shadow).
Same framing as scripts/render-bug-portraits.mjs (orthographic, view dir from scripts/portrait-views.json, 85 % fill)
and the same shiny recolour as src/bugModelV2.ts (luminance -> shadow/body/accent palette).
Input: .local/portraits-hd/species.json (npx tsx .local/portraits-hd/export-species.mts), CC0 HDRI in .local/polyhaven/.
Run (low priority): blender --background --factory-startup --python scripts/render-bug-portraits-hd.py -- <repo> <outdir> [size] [ids...|all]"""
import bpy,json,math,os,sys
from mathutils import Vector
a=sys.argv[sys.argv.index('--')+1:]
REPO,OUT=a[0],a[1];SIZE=int(a[2]) if len(a)>2 else 1024;WANT=set(a[3:]) or {'all'}
os.makedirs(OUT,exist_ok=True)
LIST=os.environ.get('BB_LIST') or os.path.join(REPO,'.local','portraits-hd','species.json')
SPECIES=[s for s in json.load(open(LIST)) if 'all' in WANT or s['id'] in WANT]
def lin(h):h=h.lstrip('#');return tuple((int(h[i:i+2],16)/255)**2.2 for i in (0,2,4))

def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True);sc=bpy.context.scene
    prefs=bpy.context.preferences.addons['cycles'].preferences
    for kind in ('OPTIX','CUDA'):
        try:
            prefs.compute_device_type=kind;prefs.get_devices();ok=False
            for d in prefs.devices:d.use=d.type==kind;ok=ok or d.use
            if ok:sc.cycles.device='GPU';break
        except Exception:pass
    sc.render.engine='CYCLES';sc.cycles.samples=int(os.environ.get('BB_SAMPLES','64'));sc.cycles.use_denoising=True;sc.render.film_transparent=True
    sc.render.resolution_x=sc.render.resolution_y=SIZE;sc.view_settings.view_transform='AgX';sc.view_settings.look='AgX - Punchy'
    w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;nt=w.node_tree;bg=nt.nodes['Background']
    env=nt.nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(os.path.join(REPO,'.local','polyhaven','forest_slope','hdri.hdr'))
    nt.links.new(env.outputs['Color'],bg.inputs['Color']);bg.inputs['Strength'].default_value=.55
    bpy.ops.object.camera_add();cam=bpy.context.object;cam.data.type='ORTHO';sc.camera=cam
    lights=[]
    for name,energy,color,size in (('Key',6.5,'#FFE8C4',.5),('Rim',6,'#A8DCFF',.35)):
        bpy.ops.object.light_add(type='SUN');l=bpy.context.object;l.name=name;l.data.energy=energy;l.data.color=lin(color);l.data.angle=size;lights.append(l)
    bpy.ops.mesh.primitive_plane_add(size=1);ground=bpy.context.object;ground.name='Ground';ground.hide_render=True
    return cam,lights,ground

def shiny_nodes(mat,palette):
    """Insert the runtime shiny mapping in front of Base Color."""
    nt=mat.node_tree;b=next((n for n in nt.nodes if n.type=='BSDF_PRINCIPLED'),None)
    if not b:return
    sock=b.inputs['Base Color'];src=sock.links[0].from_socket if sock.is_linked else None
    if src is None:
        rgb=nt.nodes.new('ShaderNodeRGB');rgb.outputs[0].default_value=sock.default_value;src=rgb.outputs[0]
    def math_node(op,x,y=None):
        n=nt.nodes.new('ShaderNodeMath');n.operation=op;nt.links.new(x,n.inputs[0])
        if y is not None:
            if isinstance(y,(int,float)):n.inputs[1].default_value=y
            else:nt.links.new(y,n.inputs[1])
        return n.outputs[0]
    def smooth(e0,e1,x):
        n=nt.nodes.new('ShaderNodeMapRange');n.interpolation_type='SMOOTHSTEP';n.inputs['From Min'].default_value=e0;n.inputs['From Max'].default_value=e1;nt.links.new(x,n.inputs['Value']);return n.outputs['Result']
    sep=nt.nodes.new('ShaderNodeSeparateColor');nt.links.new(src,sep.inputs[0])
    lum=None
    for ch,wt in zip(sep.outputs,(0.2126,0.7152,0.0722)):
        part=math_node('MULTIPLY',math_node('SQRT',ch),wt);lum=part if lum is None else math_node('ADD',lum,part)
    def mix(fac,a,b):
        n=nt.nodes.new('ShaderNodeMix');n.data_type='RGBA'
        nt.links.new(fac,n.inputs['Factor'])
        for i,v in ((6,a),(7,b)):
            if isinstance(v,tuple):n.inputs[i].default_value=(*v,1)
            else:nt.links.new(v,n.inputs[i])
        return n.outputs[2]
    shadow,body,accent=(lin(c) for c in palette)
    col=mix(smooth(.04,.55,lum),shadow,body);col=mix(smooth(.55,.95,lum),col,accent)
    m1=smooth(.025,.085,lum);m2=nt.nodes.new('ShaderNodeMath');m2.operation='SUBTRACT';m2.inputs[0].default_value=1;nt.links.new(smooth(.88,.99,lum),m2.inputs[1])
    msk=math_node('MULTIPLY',m1,m2.outputs[0])
    out=mix(msk,src,col);nt.links.new(out,sock)


def add_detail(mode):
    """Portrait-only detail pass: smoother forms (subsurf or rounded bevels) and a fine chitin grain on opaque parts."""
    for o in [o for o in bpy.data.objects if o.type=='MESH' and o.name!='Ground']:
        size=max(o.dimensions) or 1
        if mode=='subsurf':m=o.modifiers.new('detail','SUBSURF');m.levels=m.render_levels=2;m.uv_smooth='PRESERVE_CORNERS'
        elif mode=='bevel':
            m=o.modifiers.new('detail','BEVEL');m.width=size*.012;m.segments=3;m.limit_method='ANGLE';m.angle_limit=math.radians(35);m.harden_normals=False
        for poly in o.data.polygons:poly.use_smooth=True
    for mat in {m for o in bpy.data.objects if o.type=='MESH' for m in o.data.materials if m}:
        nt=mat.node_tree;b=next((n for n in nt.nodes if n.type=='BSDF_PRINCIPLED'),None)
        if not b or mat.blend_method=='BLEND' or b.inputs['Normal'].is_linked:continue
        tc=nt.nodes.new('ShaderNodeTexCoord');nz=nt.nodes.new('ShaderNodeTexNoise');nz.inputs['Scale'].default_value=180;nz.inputs['Detail'].default_value=6
        nt.links.new(tc.outputs['Object'],nz.inputs['Vector']);bp=nt.nodes.new('ShaderNodeBump');bp.inputs['Strength'].default_value=.12;bp.inputs['Distance'].default_value=.002
        nt.links.new(nz.outputs['Fac'],bp.inputs['Height']);nt.links.new(bp.outputs['Normal'],b.inputs['Normal'])

def pose_idle():
    for arm in [o for o in bpy.data.objects if o.type=='ARMATURE']:
        acts=[ac for ac in bpy.data.actions if 'idle' in ac.name.lower()] or list(bpy.data.actions)
        if acts:
            arm.animation_data_create();arm.animation_data.action=acts[0]
            try:
                slot=acts[0].slots[0] if hasattr(acts[0],'slots') and len(acts[0].slots) else None
                if slot:arm.animation_data.action_slot=slot
            except Exception:pass
            bpy.context.scene.frame_set(int(acts[0].frame_range[0]))

def world_points():
    dg=bpy.context.evaluated_depsgraph_get();pts=[]
    for o in bpy.data.objects:
        if o.type!='MESH' or o.name=='Ground':continue
        ev=o.evaluated_get(dg);me=ev.to_mesh();mw=o.matrix_world
        step=max(1,len(me.vertices)//4000)
        pts+=[mw@me.vertices[i].co for i in range(0,len(me.vertices),step)];ev.to_mesh_clear()
    return pts

def fit_visible_alpha(cam, bug_id):
    """Targeted camera refit for thin/invisible geometry and previously clipped wings.
    Low-sample probes locate actual visible pixels; the final portrait is freshly
    rendered at SIZE, never enlarged from the probe or an old portrait.
    """
    sc=bpy.context.scene;resolution=(sc.render.resolution_x,sc.render.resolution_y);samples=sc.cycles.samples
    folder=os.path.join(OUT,'_framing');os.makedirs(folder,exist_ok=True)
    history=[]
    try:
        sc.render.resolution_x=sc.render.resolution_y=256;sc.cycles.samples=8
        for attempt in range(4):
            path=os.path.join(folder,bug_id+'-probe.png');sc.render.filepath=path;bpy.ops.render.render(write_still=True)
            image=bpy.data.images.load(path,check_existing=False);width,height=image.size;pixels=list(image.pixels)
            xs=[];ys=[]
            for y in range(height):
                for x in range(width):
                    if pixels[(y*width+x)*4+3]>=16/255:xs.append(x);ys.append(y)
            bpy.data.images.remove(image)
            if not xs:raise RuntimeError('No visible alpha for '+bug_id)
            box=(min(xs),min(ys),max(xs)+1,max(ys)+1);old_scale=cam.data.ortho_scale
            history.append({'bbox':box,'size':width,'orthoScale':old_scale})
            if min(box[0],box[1],width-box[2],height-box[3])<2:
                cam.data.ortho_scale=old_scale*1.5;continue
            center_x=(box[0]+box[2])/2/width-.5;center_y=(box[1]+box[3])/2/height-.5
            rotation=cam.rotation_euler.to_quaternion()
            cam.location+=(rotation@Vector((1,0,0)))*center_x*old_scale+(rotation@Vector((0,1,0)))*center_y*old_scale
            cam.data.ortho_scale=old_scale*max((box[2]-box[0])/width,(box[3]-box[1])/height)/.84
            bpy.context.view_layer.update()
            break
        else:raise RuntimeError('Could not unclip portrait '+bug_id)
    finally:
        sc.render.resolution_x,sc.render.resolution_y=resolution;sc.cycles.samples=samples
    with open(os.path.join(folder,bug_id+'.json'),'w') as f:json.dump({'history':history,'finalOrthoScale':cam.data.ortho_scale},f,indent=2)

cam,lights,ground=setup()
base=set(bpy.data.objects)|{cam,ground,*lights}
for s in SPECIES:
    if os.path.exists(os.path.join(OUT,s['id']+'-shiny.png')):print('HAVE',s['id']);continue
    for o in [o for o in bpy.data.objects if o not in base]:bpy.data.objects.remove(o,do_unlink=True)
    for coll in (bpy.data.meshes,bpy.data.materials,bpy.data.armatures,bpy.data.actions,bpy.data.images):
        for d in [d for d in coll if d.users==0]:coll.remove(d)
    alt=os.path.join(os.environ.get('BB_MODELS',''),s['model']+'.glb')
    bpy.ops.import_scene.gltf(filepath=alt if os.environ.get('BB_MODELS') and os.path.exists(alt) else os.path.join(REPO,'public','models',s['model']+'.glb'))
    for o in bpy.data.objects:
        if o.type=='MESH' and o.name!='Ground':
            for poly in o.data.polygons:poly.use_smooth=True
            try:o.data.set_sharp_from_angle(angle=math.radians(50))
            except Exception:pass
    if os.environ.get('BB_DETAIL'):add_detail(os.environ['BB_DETAIL'])
    pose_idle();pts=world_points()
    if not pts:print('SKIP',s['id']);continue
    lo=Vector((min(p.x for p in pts),min(p.y for p in pts),min(p.z for p in pts)));hi=Vector((max(p.x for p in pts),max(p.y for p in pts),max(p.z for p in pts)));ctr=(lo+hi)/2
    ground.location.z=lo.z
    d3=(s.get('view') or {}).get('dir') or [4,3.7,6];d=Vector((d3[0],-d3[2],d3[1])).normalized()   # three.js Y-up -> Blender Z-up
    cam.location=ctr+d*max(20,(hi-lo).length*4);cam.rotation_euler=(-d).to_track_quat('-Z','Y').to_euler();bpy.context.view_layer.update()
    inv=cam.matrix_world.inverted();ext=max(max(abs((inv@p).x),abs((inv@p).y)) for p in pts)
    cam.data.ortho_scale=2*ext/.85;cam.data.clip_end=cam.location.length*4+100
    key,rim=lights;key.rotation_euler=(Vector((-.45,.35,-1))).to_track_quat('-Z','Y').to_euler()
    rim.rotation_euler=(Vector((-d.x,-d.y,0)).normalized()*-1+Vector((0,0,-.5))).to_track_quat('-Z','Y').to_euler()
    if os.environ.get('BB_FIT_ALPHA')=='1':fit_visible_alpha(cam,s['id'])
    for shiny in (False,True):
        if shiny:
            if not s['palette']:continue
            for m in {m for o in bpy.data.objects if o.type=='MESH' for m in o.data.materials if m}:shiny_nodes(m,s['palette'])
        bpy.context.scene.render.filepath=os.path.join(OUT,s['id']+('-shiny' if shiny else '')+'.png');bpy.ops.render.render(write_still=True)
    print('DONE',s['id'],flush=True)
print('PORTRAITS_OK',len(SPECIES))
