"""Shared HD look for BugBaas Blender renders (props, items, bug portraits).
Style: docs/concepts/combat-20261102 (warm forest light, mossy stone, bark, gold) + simple PoGO framing.
Inputs: CC0 Poly Haven files in .local/polyhaven/<asset>/ (forest_slope HDRI; mossy_rock, bark_willow_02, forest_ground_04 textures)."""
import bpy,math,os,random
from mathutils import Vector

def lin(h):h=h.lstrip('#');return tuple((int(h[i:i+2],16)/255)**2.2 for i in (0,2,4))

class HD:
    def __init__(self,repo,size=768,samples=96):
        self.repo=repo;self.ph=os.path.join(repo,'.local','polyhaven');self.size=size;self.samples=samples
    # ---------- scene ----------
    def reset(self):
        bpy.ops.wm.read_factory_settings(use_empty=True);random.seed(7)
    def gpu(self):
        prefs=bpy.context.preferences.addons['cycles'].preferences
        for kind in ('OPTIX','CUDA'):
            try:
                prefs.compute_device_type=kind;prefs.get_devices()
                ok=False
                for d in prefs.devices:d.use=d.type==kind;ok=ok or d.use
                if ok:return kind
            except Exception:pass
        return 'CPU'
    def stage(self,dist,height,target,lens=50,yaw=-42,hdri_strength=1.0,ground=True):
        sc=bpy.context.scene;sc.render.engine='CYCLES';dev=self.gpu();sc.cycles.device='GPU' if dev!='CPU' else 'CPU'
        sc.cycles.samples=self.samples;sc.cycles.use_denoising=True;sc.render.resolution_x=sc.render.resolution_y=self.size
        sc.render.film_transparent=True;sc.cycles.max_bounces=6
        try:sc.view_settings.view_transform='AgX';sc.view_settings.look='AgX - Medium High Contrast'
        except Exception:pass
        w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;nt=w.node_tree;bg=nt.nodes['Background']
        env=nt.nodes.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(os.path.join(self.ph,'forest_slope','hdri.hdr'))
        mp=nt.nodes.new('ShaderNodeMapping');tc=nt.nodes.new('ShaderNodeTexCoord');mp.inputs['Rotation'].default_value[2]=math.radians(120)
        nt.links.new(tc.outputs['Generated'],mp.inputs['Vector']);nt.links.new(mp.outputs['Vector'],env.inputs['Vector']);nt.links.new(env.outputs['Color'],bg.inputs['Color']);bg.inputs['Strength'].default_value=hdri_strength
        def light(loc,energy,color,size):
            bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=energy;l.data.color=lin(color);l.data.size=size
            l.rotation_euler=(Vector((0,0,target))-l.location).to_track_quat('-Z','Y').to_euler()
        light((4.5,-3.5,6.5),650,'#FFD9A0',3.5);light((-4.5,4,4),900,'#A8DCFF',2.5)
        if ground:
            bpy.ops.mesh.primitive_plane_add(size=30,location=(0,0,0));g=bpy.context.object;g.name='ShadowCatcher';g.is_shadow_catcher=True
        a=math.radians(yaw);bpy.ops.object.camera_add(location=(math.sin(-a)*dist*-1,-math.cos(a)*dist,height));c=bpy.context.object;sc.camera=c;c.data.lens=lens
        c.rotation_euler=(Vector((0,0,target))-c.location).to_track_quat('-Z','Y').to_euler()
        return c
    def render(self,path):
        os.makedirs(os.path.dirname(path),exist_ok=True);bpy.context.scene.render.filepath=path;bpy.ops.render.render(write_still=True)
    # ---------- materials ----------
    def pbr(self,name,asset,scale=1.,tint=None,rough_add=0.,bump=1.):
        """Photo material with box projection (no UVs needed). `tint` multiplies the colour."""
        m=bpy.data.materials.new(name);m.use_nodes=True;nt=m.node_tree;b=nt.nodes['Principled BSDF']
        tc=nt.nodes.new('ShaderNodeTexCoord');mp=nt.nodes.new('ShaderNodeMapping');mp.inputs['Scale'].default_value=(scale,scale,scale);nt.links.new(tc.outputs['Object'],mp.inputs['Vector'])
        def img(file,color):
            t=nt.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(os.path.join(self.ph,asset,file),check_existing=True)
            t.image.colorspace_settings.name='sRGB' if color else 'Non-Color';t.projection='BOX';t.projection_blend=.35;nt.links.new(mp.outputs['Vector'],t.inputs['Vector']);return t
        diff=img('Diffuse.jpg',True);col=diff.outputs['Color']
        ao=img('AO.jpg',False);mix=nt.nodes.new('ShaderNodeMix');mix.data_type='RGBA';mix.blend_type='MULTIPLY';mix.inputs['Factor'].default_value=.8
        nt.links.new(col,mix.inputs[6]);nt.links.new(ao.outputs['Color'],mix.inputs[7]);col=mix.outputs[2]
        if tint:
            tm=nt.nodes.new('ShaderNodeMix');tm.data_type='RGBA';tm.blend_type='MULTIPLY';tm.inputs['Factor'].default_value=1;tm.inputs[7].default_value=(*lin(tint),1)
            nt.links.new(col,tm.inputs[6]);col=tm.outputs[2]
        nt.links.new(col,b.inputs['Base Color'])
        r=img('Rough.jpg',False)
        if rough_add:
            ad=nt.nodes.new('ShaderNodeMath');ad.operation='ADD';ad.use_clamp=True;ad.inputs[1].default_value=rough_add;nt.links.new(r.outputs['Color'],ad.inputs[0]);nt.links.new(ad.outputs[0],b.inputs['Roughness'])
        else:nt.links.new(r.outputs['Color'],b.inputs['Roughness'])
        n=img('nor_gl.jpg',False);nm=nt.nodes.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=bump;nt.links.new(n.outputs['Color'],nm.inputs['Color']);nt.links.new(nm.outputs['Normal'],b.inputs['Normal'])
        m['flat']=self._avg(asset,tint);return m
    def _avg(self,asset,tint):
        im=bpy.data.images.load(os.path.join(self.ph,asset,'Diffuse.jpg'),check_existing=True);px=im.pixels[:];n=len(px)//4;st=max(1,n//4000)
        c=[sum(px[i*4+k] for i in range(0,n,st))/len(range(0,n,st)) for k in range(3)]
        if tint:t=lin(tint);c=[c[i]*t[i] for i in range(3)]
        return c
    def solid(self,name,hexcol,rough=.5,metal=0.,emit=0.,coat=0.,transmission=0.,sheen=0.):
        m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes['Principled BSDF'];col=(*lin(hexcol),1)
        b.inputs['Base Color'].default_value=col;b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
        if coat:b.inputs['Coat Weight'].default_value=coat;b.inputs['Coat Roughness'].default_value=.05
        if emit:b.inputs['Emission Color'].default_value=col;b.inputs['Emission Strength'].default_value=emit
        if transmission:b.inputs['Transmission Weight'].default_value=transmission;b.inputs['IOR'].default_value=1.5
        if sheen:b.inputs['Sheen Weight'].default_value=sheen
        m['flat']=list(lin(hexcol));return m
    def recolor(self,name,hexcol,emit=None):
        m=bpy.data.materials[name];b=m.node_tree.nodes['Principled BSDF'];col=(*lin(hexcol),1);b.inputs['Base Color'].default_value=col;m['flat']=list(lin(hexcol))
        for nd in m.node_tree.nodes:
            if nd.type=='VALTORGB':nd.color_ramp.elements[0].color=col
        if emit is not None:b.inputs['Emission Color'].default_value=col;b.inputs['Emission Strength'].default_value=emit
    # ---------- geometry ----------
    @staticmethod
    def finish(o,m,sub=0,disp=0.,disp_scale=1.,bevel=0.,smooth=True):
        o.data.materials.append(m)
        if bevel:mo=o.modifiers.new('bv','BEVEL');mo.width=bevel;mo.segments=3;mo.limit_method='ANGLE'
        if sub:mo=o.modifiers.new('sub','SUBSURF');mo.levels=sub;mo.render_levels=sub
        if disp:t=bpy.data.textures.new(o.name+'n','CLOUDS');t.noise_scale=disp_scale;mo=o.modifiers.new('dp','DISPLACE');mo.texture=t;mo.strength=disp;mo.mid_level=.5
        if smooth:
            for p in o.data.polygons:p.use_smooth=True
        return o
    def cyl(self,name,r,depth,z,m,verts=48,r2=None,**kw):
        if r2 is None:bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=(0,0,z))
        else:bpy.ops.mesh.primitive_cone_add(vertices=verts,radius1=r,radius2=r2,depth=depth,location=(0,0,z))
        o=bpy.context.object;o.name=name;return self.finish(o,m,**kw)
    def blob(self,name,loc,scale,m,rot=(0,0,0),seg=24,**kw):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=seg//2,radius=1,location=loc,rotation=rot);o=bpy.context.object;o.name=name;o.scale=scale;return self.finish(o,m,**kw)
    def ring(self,name,R,r,z,m,rot=(0,0,0)):
        bpy.ops.mesh.primitive_torus_add(major_radius=R,minor_radius=r,major_segments=72,minor_segments=14,location=(0,0,z),rotation=rot);o=bpy.context.object;o.name=name;return self.finish(o,m)
    def curve_twig(self,name,p0,p1,bend,radius,m):
        """Curved tapered twig along a bezier."""
        cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=radius;cu.bevel_resolution=3;cu.resolution_u=8
        sp=cu.splines.new('BEZIER');sp.bezier_points.add(1);a,b=Vector(p0),Vector(p1);mid=(a+b)/2+Vector(bend)
        for pt,co in zip(sp.bezier_points,(a,b)):pt.co=co;pt.handle_left_type=pt.handle_right_type='AUTO'
        sp.bezier_points[0].handle_right=mid;sp.bezier_points[1].handle_left=mid;sp.bezier_points[0].radius=1;sp.bezier_points[1].radius=.45
        o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);cu.materials.append(m);return o
    def branch(self,name,pts,radius,m,taper=.35):
        """Smooth tapered branch through a list of points (auto handles)."""
        cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=radius;cu.bevel_resolution=4;cu.resolution_u=12
        sp=cu.splines.new('BEZIER');sp.bezier_points.add(len(pts)-1)
        for i,(pt,co) in enumerate(zip(sp.bezier_points,pts)):
            pt.co=Vector(co);pt.handle_left_type=pt.handle_right_type='AUTO';pt.radius=1-(1-taper)*i/(len(pts)-1)
        o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);cu.materials.append(m);return o
    def leaf_mat(self,name,hexcol='#5DAA3A'):
        """Leaf: darker edge, lighter midrib and veins, translucent."""
        m=bpy.data.materials.new(name);m.use_nodes=True;nt=m.node_tree;b=nt.nodes['Principled BSDF']
        tc=nt.nodes.new('ShaderNodeTexCoord');sep=nt.nodes.new('ShaderNodeSeparateXYZ');nt.links.new(tc.outputs['UV'],sep.inputs[0])
        mid=nt.nodes.new('ShaderNodeMath');mid.operation='ABSOLUTE';sub=nt.nodes.new('ShaderNodeMath');sub.operation='SUBTRACT';sub.inputs[1].default_value=.5
        nt.links.new(sep.outputs['Y'],sub.inputs[0]);nt.links.new(sub.outputs[0],mid.inputs[0])
        wave=nt.nodes.new('ShaderNodeTexWave');wave.inputs['Scale'].default_value=9;wave.inputs['Distortion'].default_value=.4;nt.links.new(tc.outputs['UV'],wave.inputs['Vector'])
        ramp=nt.nodes.new('ShaderNodeValToRGB');e=ramp.color_ramp.elements;c=lin(hexcol)
        e[0].position=0;e[0].color=(*[min(1,x*1.9+.05) for x in c],1);e[1].position=.06;e[1].color=(*c,1);e.new(.48).color=(*[x*.55 for x in c],1)
        nt.links.new(mid.outputs[0],ramp.inputs['Fac'])
        mix=nt.nodes.new('ShaderNodeMix');mix.data_type='RGBA';mix.blend_type='MULTIPLY';mix.inputs['Factor'].default_value=.18
        nt.links.new(ramp.outputs['Color'],mix.inputs[6]);nt.links.new(wave.outputs['Color'],mix.inputs[7]);nt.links.new(mix.outputs[2],b.inputs['Base Color'])
        b.inputs['Roughness'].default_value=.42;b.inputs['Subsurface Weight'].default_value=.5;b.inputs['Coat Weight'].default_value=.3;b.inputs['Sheen Weight'].default_value=.2
        m['flat']=list(c);return m
    def leaf(self,name,loc,length,yaw,pitch,m,curl=.25,roll=0.):
        """Leaf with a pointed tip and a soft midrib bend."""
        bpy.ops.mesh.primitive_plane_add(size=1,location=(0,0,0));o=bpy.context.object;o.name=name
        bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.subdivide(number_cuts=10);bpy.ops.object.mode_set(mode='OBJECT')
        for v in o.data.vertices:
            x,y=v.co.x+.5,v.co.y;w=math.sin(math.pi*x)**.65*(1-.3*x)*1.15
            v.co.y=y*w*.9;v.co.z=-curl*(y*2)**2*.3+curl*.15*math.sin(math.pi*x)-.12*x*x;v.co.x=x
        o.scale=(length,length*.62,length);o.location=loc;o.rotation_mode='ZYX';o.rotation_euler=(roll,pitch,yaw)
        mod=o.modifiers.new('sol','SOLIDIFY');mod.thickness=.012;return self.finish(o,m)
    # ---------- export ----------
    def export_glb(self,path,keep=('MESH','EMPTY','CURVE'),max_faces=900):
        """Bake to a light GLB: apply modifiers, convert curves, replace node materials by their flat colour."""
        for o in list(bpy.data.objects):
            if o.type=='CURVE':
                bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
        for o in bpy.data.objects:
            if o.type!='MESH' or o.name=='ShadowCatcher':continue
            bpy.context.view_layer.objects.active=o
            for mo in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mo.name)
            faces=len(o.data.polygons)
            if faces>max_faces:  # keep map models light for phones
                d=o.modifiers.new('dec','DECIMATE');d.ratio=max_faces/faces;bpy.ops.object.modifier_apply(modifier='dec')
        for m in bpy.data.materials:
            if 'flat' not in m:continue
            b=m.node_tree.nodes['Principled BSDF']
            for l in list(m.node_tree.links):
                if l.to_node==b and l.to_socket.name in ('Base Color','Roughness','Normal'):m.node_tree.links.remove(l)
            b.inputs['Base Color'].default_value=(*m['flat'][:3],1)
        bpy.ops.object.select_all(action='DESELECT')
        for o in bpy.data.objects:
            if o.type in keep and o.name!='ShadowCatcher':o.select_set(True)
        os.makedirs(os.path.dirname(path),exist_ok=True)
        bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
