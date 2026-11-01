#!/usr/bin/env python3
"""Oerbugs: the three legendary raid bosses (dex 151-153). Original BugBaas authored anatomy.

Pure Python 3.10+, no Blender and no external source geometry. Reuses the GLB writer of the
evolution-150 pipeline (geometry_core.py) and adds smoother body shapes, faceted crystals,
thick blades and glowing ribbons. Output: .local/oerbugs/authored/<Model>.glb, then run
skin-and-optimize.mjs (same single-mesh articulated skin as the 150 forms).

Run from the repository root:
  python assets/3d/oerbugs/authoring/produce_oerbugs.py
  node assets/3d/oerbugs/authoring/skin-and-optimize.mjs
"""
from __future__ import annotations
import sys, json, math, hashlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent / 'evolution-150' / 'authoring'))
from geometry_core import GLB, color, qaxis, quat_y_to, ellipsoid, tapered_tube, norm  # noqa: E402

REPO = next(p for p in HERE.parents if (p / 'package.json').exists())
OUT = REPO / '.local' / 'oerbugs' / 'authored'
TAU = math.tau
TAPERS = {'Cyl': 1.0, 'Taper80': .8, 'Taper60': .6, 'Taper40': .4, 'Tube': .26}


def add(a, b): return tuple(a[i] + b[i] for i in range(3))
def sub(a, b): return tuple(a[i] - b[i] for i in range(3))
def mul(a, k): return tuple(x * k for x in a)
def lerp(a, b, t): return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def mirror(side, pts): return [(side * x, y, z) for x, y, z in pts]


def crystal_shape(sides=6, shoulder=.7):
    """Flat-shaded gem: narrow base ring, wide shoulder ring, pointed tip. Height 1, radius 1 (+y)."""
    verts, idx = [], []

    def tri(a, b, c):
        n = len(verts) // 3
        verts.extend((*a, *b, *c))
        idx.extend((n, n + 1, n + 2))
    r0 = [(math.cos(TAU * i / sides) * .72, 0., math.sin(TAU * i / sides) * .72) for i in range(sides)]
    r1 = [(math.cos(TAU * i / sides), shoulder, math.sin(TAU * i / sides)) for i in range(sides)]
    for i in range(sides):
        j = (i + 1) % sides
        tri(r0[i], r1[i], r0[j]); tri(r0[j], r1[i], r1[j]); tri(r1[i], (0., 1., 0.), r1[j]); tri(r0[j], (0., 0., 0.), r0[i])
    return verts, idx


class Oerbug:
    """Part builder. Glow and metal are per colour (one material per colour keeps draw calls low)."""

    def __init__(self, name, glow=None, metal=None):
        self.name = name
        b = self.b = GLB(name)
        b.add_shape('SphereHD', *ellipsoid(12, 20))
        for shape, ratio in TAPERS.items():
            if shape != 'Tube': b.add_shape(shape, *tapered_tube(12, 1., ratio))
        b.add_shape('Crystal', *crystal_shape())
        self.legs, self.wings, self.pincers, self.scythes, self.pulse, self.bodies, self.features = [], [], [], [], [], [], []
        self.custom, self.idle_wing = 0, .05
        self.glow, self.metal = glow or {}, metal or {}

    def material(self, c):
        return color(c), self.glow.get(c, False), self.metal.get(c, 0.)

    # --- primitives -------------------------------------------------------------------------
    def ell(self, n, p, s, c, par=None, hd=False, shell=False):
        if shell: self.bodies.append((p, s))
        col, glow, metal = self.material(c)
        return self.b.part('SphereHD' if hd else 'Sphere', col, n, p, s, par, emissive=glow, metal=metal)

    def tube(self, n, a, z, r0, r1, c, par=None):
        d = sub(z, a); length = math.sqrt(sum(x * x for x in d))
        if length < 1e-5: return None
        ratio = r1 / r0 if r0 else 0
        shape = 'Needle' if r1 < 1e-5 else min(TAPERS, key=lambda k: abs(TAPERS[k] - ratio))
        col, glow, metal = self.material(c)
        return self.b.part(shape, col, n, a, (r0, length, r0), par, quat_y_to(d), emissive=glow, metal=metal)

    def curve(self, n, pts, r0, r1, c, par=None, joints=True):
        k = len(pts) - 1
        for i in range(k):
            ra = r0 + (r1 - r0) * i / k; rb = r0 + (r1 - r0) * (i + 1) / k
            self.tube(n, pts[i], pts[i + 1], ra, rb, c, par)
            if i and joints: self.ell(n + 'Joint', pts[i], (ra,) * 3, c, par)

    def crystal(self, n, base, direction, length, radius, c, par=None, pulse=False):
        col, glow, metal = self.material(c)
        node = self.b.part('Crystal', col, n, base, (radius, length, radius), par, quat_y_to(direction), emissive=glow, metal=metal)
        if pulse: self.pulse.append(node)
        return node

    def mesh(self, n, verts, idx, c, par=None):
        shape = n + 'Shape' + str(self.custom); self.custom += 1
        self.b.add_shape(shape, verts, idx)
        col, glow, metal = self.material(c)
        return self.b.part(shape, col, n, (0, 0, 0), (1, 1, 1), par, emissive=glow, metal=metal)

    def fan(self, n, points, c, par=None, center=None):
        """Polygon fan from its centre (or a given root): wings, crests, flames."""
        ctr = center or tuple(sum(p[i] for p in points) / len(points) for i in range(3))
        verts = [*ctr] + [v for p in points for v in p]; idx = []
        for i in range(len(points)): idx.extend((0, i + 1, (i + 1) % len(points) + 1))
        return self.mesh(n, verts, idx, c, par)

    def ribbon(self, n, pts, width, normal, c, par=None):
        """Flat strip of constant width along a polyline lying in the plane with this normal."""
        verts, idx = [], []
        for i, p in enumerate(pts):
            t = norm(sub(pts[min(i + 1, len(pts) - 1)], pts[max(i - 1, 0)])); side = mul(norm(cross(t, normal)), width / 2)
            verts.extend((*add(p, side), *sub(p, side)))
        for i in range(len(pts) - 1):
            k = i * 2; idx.extend((k, k + 1, k + 2, k + 1, k + 3, k + 2))
        return self.mesh(n, verts, idx, c, par)

    def slab(self, n, pairs, normal, thick, c, par=None):
        """Thick blade from (inner, outer) edge pairs; top/bottom faces plus walls, flat-shaded."""
        off = mul(norm(normal), thick / 2); verts, idx = [], []

        def quad(a, b, cc, d):
            k = len(verts) // 3; verts.extend((*a, *b, *cc, *d)); idx.extend((k, k + 1, k + 2, k, k + 2, k + 3))
        top = [(add(i, off), add(o, off)) for i, o in pairs]; bot = [(sub(i, off), sub(o, off)) for i, o in pairs]
        for k in range(len(pairs) - 1):
            quad(top[k][0], top[k][1], top[k + 1][1], top[k + 1][0]); quad(bot[k][0], bot[k + 1][0], bot[k + 1][1], bot[k][1])
            quad(top[k][1], bot[k][1], bot[k + 1][1], top[k + 1][1]); quad(top[k][0], top[k + 1][0], bot[k + 1][0], bot[k][0])
        quad(top[0][0], bot[0][0], bot[0][1], top[0][1]); quad(top[-1][0], top[-1][1], bot[-1][1], bot[-1][0])
        return self.mesh(n, verts, idx, c, par)

    def top(self, x, z):
        """Highest point of the registered body shells at (x, z): crystals, plates and veins sit on the real surface."""
        best = None
        for p, s in self.bodies:
            u = ((x - p[0]) / s[0]) ** 2 + ((z - p[2]) / s[2]) ** 2
            if u < 1:
                y = p[1] + s[1] * math.sqrt(1 - u); best = y if best is None or y > best else best
        if best is None: raise ValueError('point outside the body shells: ' + str((x, z)))
        return best

    def leg(self, side, i, hip, knee, foot, r, c, knee_c, foot_c=None):
        """Hip pivot (animated) + femur/tibia. knee and foot are relative to the hip."""
        pivot = self.b.node('LegJoint_' + str(side) + '_' + str(i), self.b.root, hip); self.legs.append((pivot, side, i))
        self.ell('LegHip', (0, 0, 0), (r * 1.2,) * 3, c, pivot)
        self.tube('LegFemur', (0, 0, 0), knee, r, r * .8, c, pivot)
        self.ell('LegKnee', knee, (r * 1.15,) * 3, knee_c, pivot)
        self.tube('LegTibia', knee, foot, r * .8, r * .45, c, pivot)
        self.ell('LegFoot', foot, (r * .6,) * 3, foot_c or knee_c, pivot)
        return pivot, knee, foot

    def wing_mount(self, side, pos, lift):
        pivot = self.b.node('WingJoint_' + str(len(self.wings)), self.b.root, pos, qaxis((0, 0, 1), side * lift)); self.wings.append((pivot, side))
        return pivot

    # --- animation & export (same clip names and motion scheme as the 150 forms) ---------------
    def finish(self):
        b = self.b
        motion = b.node('Motion', b.root); children = list(b.nodes[b.root]['children']); b.nodes[b.root]['children'] = [motion]
        b.nodes[motion]['children'] = [n for n in children if n != motion]
        t = [0, .2, .4, .6, .8, 1.0]
        for kind in ['idle', 'walk', 'attack', 'hit', 'dead'] + (['fly'] if self.wings else []):
            ch = []
            values = [(0, .022 * math.sin(i * TAU / 5), 0) for i in range(6)]
            if kind == 'fly': values = [(0, .06 + .05 * math.sin(i * TAU / 5), 0) for i in range(6)]
            if kind == 'attack': values = [(0, 0, 0), (0, .05, -.1), (0, .03, .26), (0, 0, .14), (0, 0, .04), (0, 0, 0)]
            if kind == 'hit': values = [(0, 0, 0), (0, .08, -.16), (0, -.03, -.1), (0, 0, -.03), (0, 0, 0), (0, 0, 0)]
            if kind == 'dead': values = [(0, -i * .035, -i * .015) for i in range(6)]
            ch.append((motion, 'translation', t, values))
            for node, side, i in self.legs:
                angle = .26 if kind == 'walk' else .05 if kind in ('idle', 'fly') else .12
                ch.append((node, 'rotation', t, [qaxis((0, 1, 0), side * angle * math.sin(j * TAU / 5 + i * math.pi)) for j in range(6)]))
            for node, side in self.wings:
                base = b.nodes[node].get('rotation', [0, 0, 0, 1]); lift = 2 * math.atan2(base[2], base[3])
                amp = .7 if kind == 'fly' else self.idle_wing if kind == 'idle' else .14 if kind == 'walk' else .3 if kind == 'attack' else .06
                speed = 2 if kind in ('fly', 'idle') and self.idle_wing > .1 else 1
                ch.append((node, 'rotation', t, [qaxis((0, 0, 1), lift + side * amp * math.sin(j * TAU / 5 * speed)) for j in range(6)]))
            for node, side in self.pincers:
                ch.append((node, 'rotation', t, [qaxis((0, 1, 0), side * (.32 if kind == 'attack' else .03) * math.sin(j * math.pi / 5)) for j in range(6)]))
            for node, side in self.scythes:
                amp = .75 if kind == 'attack' else .06 if kind == 'idle' else .12
                ch.append((node, 'rotation', t, [qaxis((1, 0, 0), amp * math.sin(j * math.pi / 5)) for j in range(6)]))
            for k, node in enumerate(self.pulse):
                s = .07 if kind in ('idle', 'attack') else .03
                ch.append((node, 'scale', t, [mul(b.nodes[node]['scale'], 1 + s * math.sin(j * TAU / 5 + k)) for j in range(6)]))
            b.anim(kind, ch)
        raw = b.export()
        return raw, {'features': self.features, 'partNodes': len(b.nodes), 'animations': [a['name'] for a in b.animations]}


# ------------------------------------------------------------------------------------------------
def kristalkoning():
    """Ancient crystal king beetle: purple stone armour, glowing crystal crown, horn and back cluster."""
    dark, stone, gold, cyan, violet, vein = '#1E1833', '#4A3A86', '#E2AE44', '#22D3EE', '#9B5CFF', '#5EEBFF'
    o = Oerbug('Kristalkoning', glow={cyan: .45, violet: .45, vein: .9}, metal={stone: .45, gold: .8, dark: .3, cyan: .2, violet: .2})
    yy = .5
    o.ell('AbdomenCore', (0, yy - .04, -.36), (.6, .34, .82), dark, hd=True, shell=True)
    for side in [-1, 1]:
        o.ell('StoneElytron', (side * .29, yy + .06, -.4), (.37, .34, .84), stone, hd=True, shell=True)
    o.ell('Pronotum', (0, yy + .06, .4), (.5, .3, .36), stone, hd=True, shell=True)
    o.ell('Head', (0, yy - .02, .8), (.28, .22, .22), dark, hd=True, shell=True)
    for side in [-1, 1]:
        # Gold rim and glowing crystal veins run over the stone wing covers.
        o.curve('GoldElytralRim', [(side * .62, yy - .02, .2), (side * .66, yy - .02, -.35), (side * .52, yy - .04, -.92), (side * .16, yy - .06, -1.22)], .035, .03, gold)
        for k, x in enumerate([.17, .4]):
            pts = [(side * (x + (.04 if j % 2 else 0)), 0, .12 - j * .22) for j in range(6)]
            o.curve('CrystalVein', [(px, o.top(px, pz) + .006, pz) for px, _, pz in pts], .02, .016, vein, joints=False)
    o.curve('GoldElytralSeam', [(0, o.top(0, z) + .012, z) for z in [.18, -.1, -.4, -.7, -.98, -1.12]], .032, .026, gold)
    for i in range(17):
        a = math.pi * i / 16; o.ell('GoldPronotalRim', (math.cos(a) * .5, yy + .0, .4 + math.sin(a) * .36), (.055, .045, .055), gold)
    for side in [-1, 1]:
        o.ell('CrystalEye', (side * .2, yy + .06, .9), (.08, .085, .08), vein)
        o.curve('ClubbedAntenna', [(side * .12, yy + .12, .94), (side * .3, yy + .28, 1.08), (side * .4, yy + .32, 1.22)], .022, .016, gold, joints=False)
        o.ell('AntennaClub', (side * .41, yy + .33, 1.25), (.055, .055, .075), gold)
        pivot = o.b.node('MandibleJoint_' + str(side), o.b.root, (side * .14, yy - .1, .94)); o.pincers.append((pivot, side))
        o.curve('GoldMandible', [(0, 0, 0), (side * .2, -.01, .2), (side * .12, -.02, .38), (side * -.02, -.03, .45)], .065, .025, gold, pivot)
    # Crystal horn and crown: the king's silhouette.
    o.crystal('CrystalHorn', (0, yy + .06, .9), (0, .7, .72), 1.0, .14, cyan, pulse=True)
    for side in [-1, 1]: o.crystal('HornSideCrystal', (side * .12, yy + .1, .86), (side * .55, .8, .45), .36, .065, violet)
    o.crystal('CrownCrystal', (0, o.top(0, .4) - .06, .4), (0, 1, -.15), .7, .14, violet, pulse=True)
    for side in [-1, 1]:
        o.crystal('CrownCrystal', (side * .22, o.top(side * .22, .38) - .05, .38), (side * .45, 1, -.08), .5, .1, cyan, pulse=True)
        o.crystal('CrownCrystal', (side * .38, o.top(side * .38, .32) - .04, .32), (side * .9, .8, 0), .3, .07, violet)
    # Back cluster: crystals growing out of the stone wing covers, larger toward the middle.
    for k, (x, z, length, rad, c) in enumerate([(-.22, -.18, .7, .12, cyan), (.24, -.22, .62, .11, violet), (0, -.46, .9, .15, cyan),
                                                (-.38, -.55, .5, .09, violet), (.4, -.6, .55, .1, cyan), (-.14, -.8, .58, .1, violet),
                                                (.18, -.88, .48, .09, cyan), (0, -1.08, .34, .07, violet), (-.46, -.18, .32, .065, cyan), (.47, -.24, .34, .065, violet)]):
        o.crystal('BackCrystal', (x, o.top(x, z) - .07, z), (x * 1.3, 1, -.3 - k * .02), length, rad, c, pulse=k in (2, 5))
    for side in [-1, 1]:
        for i, z in enumerate([.44, .04, -.38]):
            pivot, knee, foot = o.leg(side, i, (side * .34, yy - .16, z), (side * .42, .2, .14 - i * .14), (side * .72, -yy + .2, .3 - i * .32), .085, dark, gold)
            for tt in [.3, .62]:
                o.crystal('TibiaCrystal', lerp(knee, foot, tt), (side * .8, .6, -.2), .16, .035, cyan, pivot)
    o.features += ['purple stone wing covers with gold rims, gold seam and glowing crystal veins', 'faceted crystal horn, crown and ten-crystal back cluster that pulse in idle',
                   'golden mandibles, clubbed antennae and crystal-spiked legs']
    return o


def donderwiek():
    """Storm moth: indigo storm wings with lightning bolts, silver fur collar, glowing eyes and bands."""
    body, fur, wing, hind, bolt, eye, band, leg, cloud = '#2E3358', '#D6DEF0', '#25318A', '#4B2BA6', '#FFD21F', '#1EC8FF', '#F5B700', '#1E2036', '#EEF2FF'
    o = Oerbug('Donderwiek', glow={bolt: .75, eye: .55, band: .35}, metal={eye: .3})
    yy = .5; o.idle_wing = .3
    o.ell('FurryThorax', (0, yy, .14), (.36, .33, .4), body, hd=True, shell=True)
    for i in range(18):
        a = i / 18 * TAU; o.ell('SilverFurCollar', (math.cos(a) * .31, yy + .04 + math.sin(a) * .27, .46), (.11, .11, .1), fur)
    for i in range(12):
        a = i / 12 * TAU; o.ell('ThoraxTuft', (math.cos(a) * .22, yy + .3 + math.sin(a) * .03, .1 + math.sin(a) * .16), (.1, .08, .1), fur)
    o.ell('Head', (0, yy + .02, .62), (.23, .21, .2), body, hd=True)
    for side in [-1, 1]:
        o.ell('StormEye', (side * .17, yy + .07, .7), (.12, .135, .12), eye, hd=True)
        stem = [(side * .08, yy + .19, .7), (side * .24, yy + .46, .88), (side * .4, yy + .64, 1.0), (side * .5, yy + .74, 1.04)]
        o.curve('FeatherAntenna', stem, .024, .015, band, joints=False)
        for k in range(8):
            at = lerp(stem[1], stem[3], k / 7); o.tube('AntennaComb', at, add(at, (side * .14, .05, -.09)), .013, .006, band)
        o.ell('AntennaSpark', stem[-1], (.05,) * 3, bolt)
    for i in range(7):
        z = -.16 - i * .13; r = .31 * (1 - i / 9)
        o.ell('FuzzyAbdomen', (0, yy - .04 - i * .022, z), (r, r * .9, .17), body, hd=i < 3)
        if i in (2, 4): o.ell('ThunderBand', (0, yy - .04 - i * .022, z), (r * 1.04, r * .93, .05), band)
    o.ell('AbdomenTip', (0, yy - .16, -1.12), (.08, .08, .1), fur)
    for side in [-1, 1]:
        for i, z in enumerate([.36, .18, 0]):
            o.leg(side, i, (side * .16, yy - .2, z), (side * .32, -.08, .16 - i * .04), (side * .4, -.3, .3 - i * .1), .036, leg, fur)
    for side in [-1, 1]:
        # Forewing: wide storm sail with a lightning bolt, cloud edge and an eye of the storm.
        pv = o.wing_mount(side, (side * .22, yy + .2, .24), .62)
        outline = [(0, 0, .08), (.45, .02, .38), (1.05, .04, .56), (1.62, .03, .5), (1.85, .02, .18), (1.62, .01, -.32), (1.05, 0, -.6), (.45, 0, -.5), (.08, 0, -.16)]
        o.fan('StormForewing', mirror(side, outline), wing, pv, center=(side * .6, .01, 0))
        for k in range(10):
            x, y, z = lerp(outline[1], outline[3], k / 9); o.ell('CloudEdge', (side * x, y + .02, z), (.13, .035, .1), cloud, pv)
        zig = [(.12, .03, .08), (.62, .03, .26), (.54, .03, .04), (1.1, .03, .22), (1.0, .03, -.04), (1.6, .03, .14)]
        o.ribbon('LightningBolt', mirror(side, zig), .11, (0, 1, 0), bolt, pv)
        o.ell('StormEyeRing', (side * 1.15, .025, -.3), (.19, .02, .15), bolt, pv)
        o.ell('StormEyeCore', (side * 1.15, .04, -.3), (.1, .02, .08), body, pv)
        # Hindwing with a long storm tail.
        pv = o.wing_mount(side, (side * .2, yy + .12, -.06), .48)
        outline = [(0, 0, .02), (.52, .01, .04), (1.12, .01, -.18), (1.18, 0, -.52), (.8, 0, -.76), (.46, 0, -1.32), (.32, 0, -.66), (.06, 0, -.24)]
        o.fan('StormHindwing', mirror(side, outline), hind, pv, center=(side * .48, .01, -.32))
        o.ribbon('HindBolt', mirror(side, [(.16, .02, -.06), (.58, .02, -.24), (.45, .02, -.38), (.9, .02, -.54)]), .08, (0, 1, 0), bolt, pv)
        o.ell('TailSpark', (side * .46, .02, -1.28), (.08, .035, .08), bolt, pv)
    o.features += ['four storm wings with glowing lightning bolts, cloud edges and storm eyes', 'silver fur collar and thorax tufts on a fuzzy body',
                   'feathered golden antennae with sparks, glowing eyes and thunder bands']
    return o


def lavaklauw():
    """Magma mantis: basalt body with lava veins, obsidian scythes with glowing edges, flame crest and flame wings."""
    basalt, lava, ember, flame, obsidian, rock = '#33221C', '#FF4A0A', '#FF8A1E', '#FFC21F', '#2A2030', '#56443B'
    o = Oerbug('Lavaklauw', glow={lava: .7, ember: .45, flame: .55}, metal={obsidian: .65, basalt: .15})
    yy = .58; o.idle_wing = .12
    o.ell('MagmaAbdomen', (0, yy + .02, -.68), (.3, .23, .7), basalt, hd=True, shell=True)
    o.ell('Mesothorax', (0, yy, 0), (.18, .17, .32), basalt, hd=True, shell=True)
    for i in range(5):
        z = -.3 - i * .18; o.ell('MagmaPlate', (0, o.top(0, z) - .04, z), (.26 - i * .03, .07, .075), ember)
    for side in [-1, 1]:
        for k in range(2):
            pts = []
            for j in range(7):
                z = -.12 - k * .16 - j * .14; x = side * (.13 + .06 * k + (.04 if j % 2 else 0)) * (1 - j * .06)
                pts.append((x, o.top(x, z) + .004, z))
            o.curve('LavaVein', pts, .024, .016, lava, joints=False)
    for i in range(4):
        z = .22 - i * .13; base = o.top(0, z) - .03
        o.tube('BasaltSpike', (0, base, z), (0, base + .24 - i * .04, z - .12), .06, 0, rock)
    o.curve('Prothorax', [(0, yy, .16), (0, yy + .24, .34), (0, yy + .5, .52)], .09, .07, basalt)
    o.fan('ObsidianShield', [(-.04, yy + .26, .26), (-.24, yy + .38, .38), (-.09, yy + .55, .53), (.09, yy + .55, .53), (.24, yy + .38, .38), (.04, yy + .26, .26)], obsidian)
    o.curve('ShieldLavaEdge', [(-.23, yy + .39, .39), (-.09, yy + .56, .54), (.09, yy + .56, .54), (.23, yy + .39, .39)], .018, .018, lava, joints=False)
    hy, hz = yy + .62, .6
    o.ell('TriangularHead', (0, hy, hz), (.26, .14, .12), basalt, hd=True)
    o.ell('Jaws', (0, hy - .12, hz + .05), (.085, .075, .065), lava)
    for side in [-1, 1]:
        o.ell('MagmaEye', (side * .23, hy + .05, hz), (.1, .13, .1), flame, hd=True)
        o.curve('EmberAntenna', [(side * .05, hy + .08, hz + .06), (side * .2, hy + .32, hz + .3), (side * .3, hy + .4, hz + .56)], .016, .011, ember, joints=False)
    # Flame crest on the head (x = 0 plane): an outer orange flame and an inner yellow flame.
    crest = [(0, hy + .06, hz - .08), (0, hy + .32, hz), (0, hy + .24, hz - .13), (0, hy + .56, hz - .14), (0, hy + .38, hz - .27), (0, hy + .66, hz - .38), (0, hy + .32, hz - .38), (0, hy + .1, hz - .3)]
    o.fan('FlameCrest', crest, ember, center=(0, hy + .15, hz - .2))
    o.fan('FlameCrestCore', [(.014, hy + (y - hy) * .62, z + .02) for _, y, z in crest], flame, center=(.014, hy + .12, hz - .18))
    # Raptorial forelegs: basalt femur with a lava edge, curved obsidian scythe with a glowing inner edge.
    for side in [-1, 1]:
        pivot = o.b.node('ScytheJoint_' + str(side), o.b.root, (side * .1, yy + .36, .44)); o.scythes.append((pivot, side))
        coxa, femur = (side * .14, -.16, .16), (side * .18, .26, .5)
        o.tube('RaptorialCoxa', (0, 0, 0), coxa, .07, .06, basalt, pivot); o.ell('LavaElbow', coxa, (.07,) * 3, lava, pivot)
        o.tube('RaptorialFemur', coxa, femur, .085, .06, basalt, pivot); o.ell('LavaElbow', femur, (.065,) * 3, lava, pivot)
        for k in range(4):
            at = lerp(coxa, femur, .2 + k * .2); o.tube('FemurSpine', at, add(at, (side * .02, -.1, .05)), .022, 0, ember, pivot)
        pairs, ctr = [], add(femur, (side * .02, -.04, -.02))
        for k in range(9):
            t = k / 8; a = .1 - t * 2.3; r_out = .55 - t * .1; r_in = r_out - (.15 * math.sin(math.pi * min(1, t * 1.15)) + .01)
            inner = add(ctr, (0, math.sin(a) * r_in, math.cos(a) * r_in * .7)); outer = add(ctr, (0, math.sin(a) * r_out, math.cos(a) * r_out * .7))
            pairs.append((inner, outer))
        o.slab('ObsidianScythe', pairs, (1, 0, 0), .055, obsidian, pivot)
        o.curve('ScytheLavaEdge', [add(i, (side * .03, 0, 0)) for i, _ in pairs], .02, .012, lava, pivot, joints=False)
    for side in [-1, 1]:
        for i, z in [(1, -.04), (2, -.32)]:
            o.leg(side, i, (side * .14, yy - .1, z), (side * .48, .16, .04 - i * .08), (side * .76, -yy + .12, .14 - i * .24), .058, basalt, lava, rock)
    # Flame wings raised in display.
    for side in [-1, 1]:
        pv = o.wing_mount(side, (side * .1, yy + .18, -.22), .95)
        outline = [(0, 0, 0), (.42, .01, .34), (.62, .02, .2), (.92, .02, .54), (1.02, .02, .16), (1.26, .02, .32), (1.16, .01, -.12), (.88, 0, -.52), (.44, 0, -.66), (.1, 0, -.3)]
        o.fan('FlameWing', mirror(side, outline), lava, pv, center=(side * .4, .01, -.08))
        o.fan('FlameWingCore', [(side * x * .64, y + .02, z * .64 - .05) for x, y, z in outline], flame, pv, center=(side * .26, .03, -.1))
    o.features += ['basalt body with glowing lava veins, magma plates and basalt spikes', 'curved obsidian scythe forelegs with glowing edges and ember spines',
                   'flame crest and raised flame wings, glowing eyes and jaws']
    return o


MODELS = [('kristalkoning', kristalkoning), ('donderwiek', donderwiek), ('lavaklauw', lavaklauw)]

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True); rows = []
    for species, make in MODELS:
        o = make(); raw, proof = o.finish(); (OUT / (o.name + '.glb')).write_bytes(raw)
        rows.append({'id': species, 'model': o.name, 'file': o.name + '.glb', 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw), **proof})
        print(species, o.name, len(raw), proof['partNodes'], proof['animations'])
    (OUT.parent / 'authored-manifest.json').write_text(json.dumps({'models': rows}, indent=2))
