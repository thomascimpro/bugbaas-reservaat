"""BugBaas anatomy-specific original candidate production. No source GLBs are morphed.

Authoring uses explicit species body plans, independent limb/wing joints and
natural appendages. Imported CC0 source models are selected separately.
"""
from pathlib import Path
import json,math,hashlib
from geometry_core import GLB,color,qaxis
ASSETS=Path(__file__).resolve().parent.parent
REPO=next(p for p in ASSETS.parents if (p/'package.json').exists())
ROOT=REPO/'.local/evolution150';ROOT.mkdir(parents=True,exist_ok=True)
PLAN=json.loads((ASSETS/'model-plan.json').read_text())['mappedAssets']
OUTPUT=ROOT/'authored';OUTPUT.mkdir(exist_ok=True)
PALETTES={
 'beetle':('#243B3B','#55725E','#A7B7A1'), 'ant':('#48372A','#8E583B','#C18D58'),
 'aphid':('#78A54C','#B7D980','#E4EDB5'),'weevil':('#633F2B','#A4794E','#D3B783'),
 'moth':('#87AD71','#CBDC9C','#EEDEA3'),'earwig':('#352E29','#906148','#D39B69'),
 'grasshopper':('#6F913C','#B3C776','#E3D599'),'lacewing':('#6CA37D','#A6D2B6','#E5EED0'),
 'dungbeetle':('#273A3C','#597267','#A8B892'),'mantis':('#9B7947','#C3AD75','#E7D19D'),
 'butterfly':('#22426B','#367DB3','#7ECDE2'),'divingbeetle':('#27352D','#736C42','#B2AC7C'),
 'waterstrider':('#26373A','#5C776F','#A8BBB0'),'hoverfly':('#303333','#D6AA42','#F1D57A'),
 'leafhopper':('#456743','#92AD62','#C4D3A1'),'cricket':('#5B4132','#98704C','#C9A572'),
 'stick':('#665D37','#A48D50','#CCBA86'),'leaf':('#5F8C3B','#A5BD65','#D5DDA1'),
 'silverfish':('#758894','#B2C2C7','#E5E8E1'),'hercules':('#3C3431','#7A623F','#C7AC70'),
 'antlion':('#66764B','#A2B17A','#D9D7AC'),'cockroach':('#4A3428','#96754F','#D1AB73'),
 'cranefly':('#71664B','#B7A986','#E1DCC4'),'flea':('#4F322B','#9D5943','#D69765'),
 'giantwaterbug':('#4D4C32','#929665','#C9C89A'),'mayfly':('#A1AE7F','#D4DCA8','#F3EDD6'),
 'termite':('#A38059','#D5B78E','#EEE0B7'),'tigerbeetle':('#265A58','#50A4A1','#9ED1AF'),
 'tortoisebeetle':('#7C752D','#C3B859','#E7D68E'),'bee':('#473B2C','#BC8B35','#E3C25F'),
 'armabee':('#395160','#9BB9AA','#E8D08C'),'scorpion':('#3E3634','#8C6C53','#C7A574'),
 'centipede':('#5F3730','#B36944','#DCAC62'),'wasp':('#2B2D2A','#D0A33D','#E8CC71'),
 'dragonfly':('#274D61','#5899A5','#ABCFCA'),'firefly':('#303B30','#8BA259','#D5E798'),
 'cicada':('#51442E','#A3854C','#D6BF82'),'mosquito':('#49403B','#968778','#D0BA99'),
 'snail':('#7C7557','#B49561','#E3CA93'),
}

# Evolution upgrade 2026-10-29: every stage must read as a visible evolution.
# Final forms (stage 3) of these families get a deeper/brighter palette (dark, accent, light, polished plate)
# plus family-specific armour, horns, glow or wing patterns. Selected earlier stages get their own palette so
# sibling families (beetle vs dung beetle) and nymph vs adult (cicada) no longer share one look.
STAGE_PALETTES={
 ('dungbeetle',2):('#2E2620','#7A5634','#D2AE72'),
 ('cicada',1):('#6B4E2E','#A57B4B','#D9BC8C'),
 ('cicada',2):('#2E4A2C','#7FA54C','#D8E6A6'),
 ('beetle',3):('#16483A','#22925F','#F3C64F','#D9A62E'),
 ('dungbeetle',3):('#262E78','#4659D0','#A8E6FF','#6E7BFF'),
 ('mantis',3):('#1E5A2C','#4CC25E','#F7A8D8','#E06AB0'),
 ('hoverfly',3):('#1B1712','#F2B01E','#FFE58A','#D49A1C'),
 ('divingbeetle',3):('#10241C','#2E6A44','#F4D03F','#C9A227'),
 ('leaf',3):('#1F6A2C','#55C24E','#F0E870','#E0C341'),
 ('stick',3):('#14306A','#2F74E8','#FF8A2A','#3A7BF0'),
 ('cricket',3):('#2E1C12','#A8582E','#F4BC72','#C8782E'),
 ('cockroach',3):('#2C1009','#953419','#F2A04E','#BE5A22'),
 ('flea',3):('#2C0C0C','#AE2A1E','#F6AA5E','#C8402F'),
 ('bee',3):('#21160A','#EBA81A','#FFF2AC','#E3A60C'),
 ('tigerbeetle',3):('#0E5C4E','#16B89D','#FFF4B4','#1CC9A3'),
 ('tortoisebeetle',3):('#6E4C00','#E9B826','#FFF2A6','#F2C232'),
 ('waterstrider',3):('#10202C','#2F74A6','#D2EAFF','#A9C3D4'),
 ('cranefly',3):('#3C2610','#E58020','#FFE2A6','#D58A2A'),
 ('mayfly',3):('#2E3A12','#F2C230','#FFF0B0','#E0A82A'),
 ('firefly',3):('#151B11','#E2482C','#F6FF7C','#D9472A'),
 ('cicada',3):('#141010','#2C211C','#FFB04A','#E2601C'),
 ('aphid',3):('#2F5A1E','#7BC043','#FFFFFF','#B8E05A'),
 ('weevil',3):('#16233F','#2E9BC9','#A8F0FF','#3FD0E0'),
 ('earwig',3):('#2A0F0A','#C0392B','#F5B041','#D35400'),
 ('grasshopper',3):('#1E4D1A','#5CBF2A','#FFB43A','#F25C1C'),
 ('lacewing',3):('#0F4D3A','#3DDC97','#E8FFF4','#FFD84D'),
 ('leafhopper',3):('#3A1450','#E0408A','#FFE07A','#FF7A2E'),
 ('silverfish',3):('#3A4A5C','#9FC3E0','#FFFFFF','#C9D9E8'),
 ('antlion',3):('#3A2A10','#C08A30','#FFE9B0','#D9A030'),
 ('giantwaterbug',3):('#2A2010','#7A5A20','#E8C870','#B08A30'),
 ('scorpion',3):('#0E1A24','#24465E','#7FF7E8','#3FE0D0'),
 ('dragonfly',3):('#0B2A4A','#1E88E5','#BFF3FF','#29B6F6'),
 ('mosquito',3):('#141414','#EDEDED','#FFFFFF','#BFE6FF'),
 ('snail',2):('#5A3A22','#E8B83A','#FFF0B8'),
}
EVOLVED={f for f,s in STAGE_PALETTES if s==3}
EYES3={'hoverfly':('#B8241C',2.0),'cicada':('#E0261C',1.6),'tigerbeetle':('#1A2A30',1.4),'bee':('#1A1410',1.35),'firefly':('#101410',1.3),'lacewing':('#E8B820',1.35),'antlion':('#2A2010',1.25),'dragonfly':('#19C3E6',1.8)}
WING_SPOTS3={'antlion':3,'lacewing':1,'dragonfly':1}
LEGS3={'flea':1.04,'waterstrider':1.3,'cranefly':1.22,'tigerbeetle':1.15,'stick':1.12}

def anatomy(f):
 if f in ['moth','butterfly']:return 'butterfly'
 if f in ['antlion','lacewing','dragonfly']:return 'lacewing'
 if f in ['cranefly','mosquito','mayfly','waterstrider']:return 'longfly'
 if f in ['bee','armabee','wasp','hoverfly','firefly','ant']:return 'waist'
 if f in ['aphid','leafhopper','cicada']:return 'sap'
 if f in ['earwig','cockroach','silverfish','termite','flea']:return 'segmented'
 if f in ['grasshopper','cricket','stick','leaf','mantis']:return 'orthopteran'
 return f if f in ['scorpion','centipede','snail'] else 'beetle'

def generate(name,family,stage):
 def evolve():
  if family=='hoverfly':
   sphere('PolishedScutum',(0,yy+.1,.24),(.25,.13,.28),plate)
   for side in [-1,1]:
    for i in range(3):sphere('AbdominalLunule',(side*.2*(1-i*.15),yy+.06,-.2-i*.24),(.07,.05,.09),light)
  elif family=='divingbeetle':
   for i in range(20):
    a=i/20*math.tau;sphere('GoldenElytralRim',(.56*math.sin(a),yy+.04,-.2+.8*math.cos(a)),(.11,.06,.13),plate)
   mandibles(yy,.18,.3)
   for pv,side,i,kind,kn,end in limbs:
    if i==2:sheet('PowerPaddle',[(end[0]-.2,end[1],end[2]-.4),(end[0]+.2,end[1],end[2]-.4),(end[0]+.26,end[1],end[2]+.15),(end[0]-.22,end[1],end[2]+.15)],plate,pv)
  elif family=='leaf':
   for side in [-1,1]:
    sheet('LeafTegmen',[(side*.04,yy+.1,.15),(side*.42,yy+.12,-.15),(side*.5,yy+.13,-.6),(side*.28,yy+.14,-1.0),(side*.04,yy+.12,-1.15)],light)
    rod('GoldenMidrib',(side*.06,yy+.15,.1),(side*.2,yy+.16,-1.0),.016,plate)
    for i in range(3):rod('TegmenVein',(side*.12,yy+.16,-.2-i*.25),(side*.42,yy+.16,-.32-i*.25),.009,plate)
   sheet('ThoracicLeafCollar',[(-.38,yy,.42),(-.2,yy+.05,.62),(.2,yy+.05,.62),(.38,yy,.42),(.2,yy+.02,.1),(-.2,yy+.02,.1)],accent)
   sheet('HeadLeafCrest',[(0,yy+.2,.7),(.12,yy+.42,.62),(0,yy+.56,.55),(-.12,yy+.42,.62)],light)
   for pv,side,i,kind,kn,end in limbs:sheet('LeafyTibiaLobe',[kn,(kn[0]+(end[0]-kn[0])*.5+side*.12,kn[1]+(end[1]-kn[1])*.5,kn[2]+(end[2]-kn[2])*.5+.08),end,(kn[0]+(end[0]-kn[0])*.5,kn[1]+(end[1]-kn[1])*.5,kn[2]+(end[2]-kn[2])*.5-.06)],accent,pv)
  elif family=='stick':
   sphere('AbdomenExtension',(0,yy,-1.2),(.08,.08,.38),dark);rod('Cercus',(0,yy,-1.55),(0,yy+.08,-1.8),.03,light)
   for k in range(5):rod('ThornCrown',((k-2)*.05,yy+.2,.75),((k-2)*.11,yy+.44,.7-abs(k-2)*.04),.025,light)
   for pv,side,i,kind,kn,end in limbs:
    for t in [.35,.7]:at=tuple(v*t for v in kn);rod('LegThorn',at,(at[0],at[1]+.12,at[2]+.03),.02,light,pv)
   for side in [-1,1]:wing(side,-.1,.75,.9,'fan',membrane=color('#FF4F8B'),rib=light)
  elif family=='cricket':
   sphere('ArmouredPronotum',(0,yy+.1,.28),(.34,.22,.36),plate)
   for side in [-1,1]:rod('Cercus',(side*.08,yy,-.88),(side*.32,yy+.1,-1.4),.035,light)
   for pv,side,i,kind,kn,end in limbs:
    if kind=='digger':
     for k in range(4):rod('ShovelClaw',end,(end[0]+side*.2,end[1]-.03,end[2]+(k-1.5)*.1),.045,plate,pv)
  elif family=='cockroach':
   for side in [-1,1]:curve('PronotalHorn',[(side*.13,yy+.26,.46),(side*.17,yy+.38,.62),(side*.15,yy+.44,.8)],.07,.025,plate,tip=light)
   sphere('ArmouredPronotalShield',(0,yy+.17,.4),(.42,.14,.34),plate)
   for side in [-1,1]:rod('Cercus',(side*.1,yy,-.7),(side*.3,yy+.06,-1.05),.03,light)
   for pv,side,i,kind,kn,end in limbs:
    for t in [.4,.75]:at=tuple(kn[j]+(end[j]-kn[j])*t for j in range(3));rod('TibialSpine',at,(at[0]+side*.06,at[1]+.08,at[2]),.016,light,pv)
  elif family=='flea':
   sphere('PolishedCarapace',(0,yy+.24,-.1),(.21,.44,.52),plate)
   for i in range(7):
    a=-.2+i*.45;rod('DorsalSpine',(0,yy+.2+.44*math.cos(a)*.95,-.1+.52*math.sin(a)*.95),(0,yy+.2+.62*math.cos(a),-.1+.7*math.sin(a)),.035,light)
   for pv,side,i,kind,kn,end in limbs:
    if kind=='jump':sphere('JumpMuscle',tuple(v*.5 for v in kn),(.12,.1,.14),accent,pv)
  elif family=='bee':
   for i in range(12):
    a=i/12*math.tau;sphere('FuzzyCollar',(.27*math.cos(a),yy+.06+.2*math.sin(a),.4),(.09,.09,.09),light)
   sphere('QueenAbdomen',(0,yy-.03,-.62),(.26,.2,.5),plate)
   for pv,side,i,kind,kn,end in limbs:
    if i==2:sphere('PollenBasket',tuple(kn[j]+(end[j]-kn[j])*.45 for j in range(3)),(.1,.09,.12),light,pv)
  elif family=='tigerbeetle':
   for side in [-1,1]:
    for i in range(3):sphere('ElytralMaculation',(side*.33,yy+.2,-.82+i*.3),(.09,.04,.07),light)
    rod('HumeralLunule',(side*.3,yy+.22,-.05),(side*.4,yy+.18,-.3),.04,light)
  elif family=='tortoisebeetle':
   for i in range(16):
    a=i/16*math.tau;rod('ShieldSpike',(.62*math.sin(a),yy+.12,-.22+.74*math.cos(a)),(.82*math.sin(a),yy+.1,-.22+.95*math.cos(a)),.04,light)
   for k in range(5):sphere('CarapaceSpot',(((k%3)-1)*.25,yy+.42,-.5+k*.2),(.08,.03,.08),dark)
  elif family=='waterstrider':
   for side in [-1,1]:wing(side,.05,.5,1.0,'clear',membrane=dark,rib=plate)
   for side in [-1,1]:rod('LateralStripe',(side*.15,yy+.08,.4),(side*.1,yy+.06,-.9),.025,light)
   for pv,side,i,kind,kn,end in limbs:sphere('HydrophobicTuft',end,(.045,.022,.09),plate,pv)
  elif family=='cranefly':
   for side in [-1,1]:rod('Haltere',(side*.12,yy+.1,.02),(side*.3,yy+.2,-.1),.016,dark);sphere('HaltereKnob',(side*.3,yy+.2,-.1),(.05,)*3,plate)
  elif family=='firefly':
   for side in [-1,1]:sphere('LanternGlowSide',(side*.17,yy-.08,-.66),(.09,.08,.18),light,glow=1.2)
  elif family=='dragonfly':
   sphere('MetallicThorax',(0,yy+.06,.24),(.2,.2,.3),plate)
   for side in [-1,1]:rod('ThoracicStripe',(side*.12,yy+.18,.45),(side*.16,yy+.1,.02),.03,light)
  elif family=='mosquito':
   for pv,side,i,kind,kn,end in limbs:
    for t in [.25,.5,.75]:sphere('WhiteLegBand',tuple(kn[j]+(end[j]-kn[j])*t for j in range(3)),(.035,)*3,light,pv)
   for side in [-1,1]:rod('ScutalLyre',(side*.06,yy+.19,.45),(side*.1,yy+.2,.05),.025,light)
  elif family=='aphid':
   for i in range(10):
    a=i/10*math.tau;rod('WaxFilament',(.22*math.cos(a),yy+.2,-.29+.16*math.sin(a)),(.42*math.cos(a),yy+.62,-.29+.34*math.sin(a)),.035,light)
   for side in [-1,1]:rod('PolishedCornicle',(side*.17,yy+.18,-.53),(side*.27,yy+.52,-.58),.05,plate)
  elif family=='weevil':
   for side in [-1,1]:
    for k in range(3):sphere('JewelBand',(side*.22,yy+.3,-.1-k*.28),(.16,.06,.06),dark)
   sphere('JewelPronotum',(0,yy+.06,.29),(.33,.25,.32),plate)
  elif family=='earwig':
   for side in [-1,1]:curve('GiantForceps',[(side*.1,yy,-1.0),(side*.45,yy+.08,-1.35),(side*.32,yy+.1,-1.75),(side*.06,yy+.1,-1.9)],.09,.03,plate)
   sphere('ArmouredPronotum',(0,yy+.08,.32),(.24,.14,.2),plate)
  elif family=='grasshopper':
   sheet('PronotalCrest',[(0,yy+.12,.45),(0,yy+.42,.3),(0,yy+.4,-.05),(0,yy+.14,-.15)],plate)
   for pv,side,i,kind,kn,end in limbs:
    if kind=='jump':sphere('KneeShield',kn,(.1,.1,.1),plate,pv)
  elif family=='leafhopper':
   sphere('HelmetPronotum',(0,yy+.22,.15),(.3,.18,.48),plate)
   for side in [-1,1]:
    for k in range(3):sphere('HelmetSpot',(side*.2,yy+.34,.3-k*.25),(.07,.03,.07),light)
  elif family=='silverfish':
   for i in range(8):sphere('SilverScale',(0,yy+.08,.15-i*.15),(.14*(1-i/12),.07,.1),plate)
   for side in [-1,1]:rod('LongCercus',(side*.04,yy,-1.24),(side*.6,yy+.1,-1.9),.016,light)
  elif family=='antlion':
   for side in [-1,1]:sphere('ClubbedAntennaTip',(side*.252,yy+.35,.99),(.07,.07,.09),plate)
  elif family=='giantwaterbug':
   for k in range(18):sphere('BroodEgg',(-.25+(k%5)*.125,yy+.36,-.75+(k//5)*.2),(.07,.07,.09),light)
   for pv,side,i,kind,kn,end in limbs:
    if kind=='raptorial':curve('RaptorialClaw',[end,(end[0]+side*.05,end[1]+.12,end[2]+.18),(end[0]-side*.05,end[1]+.1,end[2]+.3)],.05,.02,plate,par=pv)
  elif family=='cicada':
   sphere('CrownPlate',(0,yy+.2,.4),(.24,.08,.18),plate)
   for side in [-1,1]:rod('OrangeWingBase',(side*.12,yy+.2,.25),(side*.3,yy+.22,.15),.04,plate)
 b=GLB(name);cat=anatomy(family);pal=STAGE_PALETTES.get((family,stage),PALETTES[family]);dark,accent,light=map(color,pal[:3]);plate=color(pal[3]) if len(pal)>3 else accent;evolved=stage==3 and family in EVOLVED;custom=False;black=color('#131E21');glass=color('#B3C7AC');gold=color('#7C6A42');detail=[];legs=[];wings=[];pincers=[];limbs=[]
 def shine(c,m):return m if m is not None else .3 if evolved and c is accent else .72 if evolved and c is plate else 0.
 def sphere(n,p,s,c=dark,par=None,m=None,glow=False):return b.sphere(n,p,s,c,par,emissive=glow,metal=shine(c,m))
 def rod(n,a,z,r=.025,c=dark,par=None,m=None,glow=False):return b.tube(n,a,z,r,r*.55,c,par,metal=shine(c,m),emissive=glow)
 def curve(n,pts,r0,r1,c=dark,tip=None,par=None,m=None):
  # Smooth tapered horn/limb along control points (joint spheres hide the seams).
  for k in range(len(pts)-1):
   ra=r0+(r1-r0)*k/(len(pts)-1);rb=r0+(r1-r0)*(k+1)/(len(pts)-1);b.tube(n,pts[k],pts[k+1],ra,rb,c,par,metal=shine(c,m))
   if k:sphere(n+'Joint',pts[k],(ra,)*3,c,par,m)
  if tip is not None:sphere(n+'Tip',pts[-1],(r1*1.5,)*3,tip,par,m)
 def sheet(n,points,c,par=None,transparent=False):
  shape=n+'shape';center=tuple(sum(p[i] for p in points)/len(points) for i in range(3));verts=[*center]+[v for point in points for v in point];indices=[]
  for i in range(len(points)):indices.extend((0,i+1,(i+1)%len(points)+1))
  b.add_shape(shape,verts,indices);return b.part(shape,c,n,(0,0,0),(1,1,1),par,alpha=.64 if transparent else None)
 def wing(side,z,span,chord,kind='clear',tail=0,membrane=None,rib=None,spots=0,mount=None):
  if evolved and kind not in ['round','luna','leaf']:membrane=membrane or light;rib=rib or plate;spots=spots or WING_SPOTS3.get(family,0)
  pivot=b.node('WingJoint_'+str(len(wings)),mount if mount is not None else b.root,(side*.1,yy+.14,z) if mount is None else (0,0,0));wings.append((pivot,side))
  if kind=='round':outline=[(0,0),(.25,.3),(.8,.42),(1.22,.3),(1.38,-.04),(1.1,-.48),(.55,-.75),(.12,-.43)]
  elif kind=='luna':outline=[(0,0),(.4,.45),(1.12,.5),(1.35,.13),(1.0,-.35),(.55,-.48),(.21,-1.2-tail),(.08,-.4)]
  elif kind=='leaf':outline=[(0,0),(.48,.25),(1.1,.2),(1.3,-.12),(.85,-.5),(.2,-.48)]
  elif kind=='fan':outline=[(0,0),(.5,.6),(1.05,.4),(1.2,0),(.95,-.5),(.45,-.72),(.04,-.33)]
  elif kind=='upright':outline=[(0,0),(.45,.36),(1.1,.22),(1.25,-.15),(.8,-.52),(.18,-.4)]
  elif kind=='spoon':outline=[(0,0),(.7,.06),(.94,.25),(1.24,.28),(1.4,.06),(1.2,-.24),(.93,-.25),(.65,-.04)]
  else:outline=[(0,0),(.35,.16),(.95,.11),(1.25,-.12),(.85,-.32),(.12,-.22)]
  points=[(side*x*span,(.16*x if kind=='upright' else .025*math.sin(x*2)),v*chord) for x,v in outline]
  sheet('WingMembrane_'+str(len(wings)),points,membrane or (light if kind in ['round','luna','leaf'] else glass),pivot,kind not in ['round','luna','leaf'])
  for u in [.3,.55,.78,1.0]:rod('WingRib',(0,0,0),(side*u*span,.015,(-.32 if kind!='round' else -.48)*chord),.007 if rib is None else .012,rib or (gold if kind not in ['round','luna'] else dark),pivot)
  for k in range(spots):sphere('WingSpot',(side*(.45+k*.3)*span,.03,(-.08-k*.05)*chord),(.075*span,.012,.06*chord),dark,pivot)
  if kind in ['round','luna']:
   sphere('WingEye',(side*.83*span,.026,-.12*chord),(.12,.018,.16),accent,pivot);sphere('WingEyeCenter',(side*.83*span,.044,-.12*chord),(.058,.012,.07),dark,pivot)
   for k in range(4):sphere('WingEdgeDot',(side*(.5+k*.18)*span,.03,-.34*chord),(.03,.012,.05),light if family=='moth' else accent,pivot)
 def antenna(yy,span=.32,length=.5,feather=False):
  for side in [-1,1]:
   start=(side*.1,yy+.14,.59);mid=(side*span,yy+.3,.72);end=(side*span*1.2,yy+.35,.72+length);rod('AntennaStem',start,mid,.018);rod('AntennaTip',mid,end,.012)
   if feather:
    for k in range(5):
     t=k/5;at=tuple(mid[i]+(end[i]-mid[i])*t for i in range(3));rod('AntennaComb',at,(at[0]+side*.12,at[1]+.03,at[2]-.06),.008,accent)
 def mandibles(yy,width=.2,length=.25):
  for side in [-1,1]:
   pivot=b.node('MandibleJoint_'+str(side),b.root,(side*.12,yy,.65));pincers.append((pivot,side));rod('MandibleArm',(0,0,0),(side*width,-.02,length*.65),.05,accent,pivot);rod('MandibleHook',(side*width,-.02,length*.65),(side*width*.4,-.03,length),.032,light,pivot)
 def leg(side,i,z,kind='normal',length=1):
  nonlocal yy
  hip=(side*.18,yy-.05,z);pivot=b.node('LegJoint_'+str(side)+'_'+str(i),b.root,hip);legs.append((pivot,side,i));sign=side
  if kind=='jump':knee=(sign*.55,.1,-.26);end=(sign*.82,-yy+.07,-.62);thick=.085
  elif kind=='long':knee=(sign*.65,-.1,.04-i*.13);end=(sign*1.18,-yy+.05,.3-i*.26);thick=.018
  elif kind=='digger':knee=(sign*.44,-.03,.19);end=(sign*.72,-yy+.12,.38);thick=.08
  elif kind=='raptorial':knee=(sign*.42,.48,.35);end=(sign*.25,.12,.72);thick=.055
  else:knee=(sign*.49,-.08,.08-i*.07);end=(sign*.75,-yy+.06,.22-i*.18);thick=.035 if cat!='scorpion' else .045
  knee=tuple(v*length for v in knee);end=tuple(v*length if j!=1 else v for j,v in enumerate(end));rod('LegFemur',(0,0,0),knee,thick,dark,pivot);sphere('LegKnee',knee,(thick*1.15,)*3,accent,pivot);rod('LegTibia',knee,end,thick*.6,dark,pivot)
  if kind=='digger':
   for k in range(3):rod('DiggingClaw',end,(end[0]+sign*.13,end[1]-.02,end[2]+(k-1)*.1),.03,light,pivot)
  if kind=='raptorial':
   for k in range(5):rod('ForearmSpur',(knee[0]*(1-k*.12),knee[1]-.03,knee[2]+k*.065),(knee[0]*(1-k*.12)+side*.1,knee[1]-.06,knee[2]+k*.065),.018,light,pivot)
  limbs.append((pivot,side,i,kind,knee,end))
  if family in ['divingbeetle','giantwaterbug'] and i==2:sheet('SwimmingPaddle',[(end[0]-.12,end[1],end[2]-.25),(end[0]+.12,end[1],end[2]-.25),(end[0]+.17,end[1],end[2]+.1),(end[0]-.15,end[1],end[2]+.1)],accent,pivot)
 yy=.52
 if family=='mosquito' and stage==1:
  yy=.27
  for i in range(10):sphere('AquaticLarvalSegment',(math.sin(i*.4)*.11,.26,-i*.12),(.12-i*.006,.11-i*.004,.11),accent if i%2 else dark)
  sphere('LarvalHead',(0,.27,.18),(.18,.17,.17),dark);rod('BreathingSiphon',(.07,.28,-1.05),(.1,.68,-1.17),.025,light)
  detail.append('aquatic mosquito larva with segmented wriggling trunk and breathing siphon')
 elif stage==1 and family in ['wasp','firefly','dragonfly']:
  yy=.31;count=8 if family=='wasp' else 10
  for i in range(count):
   z=.32-i*.13;r=.22*(1-i/count*.35);sphere('LarvalTrunkSegment',(0,yy,z),(r,.15,.11),light if family=='wasp' else dark if i%2 else accent)
   if family=='firefly':
    for side in [-1,1]:sheet('LarvalTergiteFlange',[(side*r*.65,yy+.06,z+.1),(side*(r+.13),yy+.08,z),(side*r*.85,yy+.06,z-.1)],accent)
  sphere('LarvalHead',(0,yy,.57),(.2,.18,.2),dark);mandibles(yy,.12,.19)
  if family!='wasp':
   for side in [-1,1]:
    for i,z in enumerate([.34,.12,-.1]):leg(side,i,z,'normal',.48)
  if family=='dragonfly':
   for side in [-1,1]:sheet('NymphWingBud',[(side*.13,yy+.13,.1),(side*.31,yy+.15,-.27),(side*.09,yy+.12,-.36)],accent)
   for side in [-1,0,1]:rod('CaudalGills',(side*.07,yy,-.75),(side*.23,yy+.04,-1.15),.027,accent)
   rod('ExtendableLabium',(0,yy-.12,.56),(0,yy-.12,.91),.045,light)
  if family=='firefly':sphere('LarvalLantern',(0,yy-.07,-.7),(.16,.08,.1),light)
  detail.append('genuine wingless larval anatomy, segmented trunk and family-specific feeding appendages')
 elif cat=='snail':
  yy=.25;sphere('SlimeFoot',(0,.18,-.08),(.29,.17,.72),dark);sphere('SnailHead',(0,.29,.57),(.2,.19,.24),accent)
  turns=2.3 if stage==1 else 3.2
  last=None
  for i in range(65):
   t=i/64*turns*math.tau;r=(.58 if stage==2 else .49)*math.exp(-.12*t);at=(.06+t*.013,.62+r*math.cos(t),-.2+r*math.sin(t));
   if last:rod('SpiralShell',last,at,max(.035,(.19 if stage==2 else .16)*math.exp(-.09*t)),(dark if (i//4)%3==0 else accent) if stage==2 else accent if (i//7)%2 else light)
   last=at
  for side in [-1,1]:rod('EyeStalk',(side*.1,.39,.66),(side*.23,.75,.89),.025,dark);sphere('Eye',(side*.23,.75,.89),(.045,)*3,black)
  detail.append('coiled continuous shell, muscular foot and long eye stalks')
 elif cat=='centipede':
  yy=.29;count=11 if stage==1 else 15 if stage==2 else 19
  sphere('CentipedeHead',(0,yy,.58),(.26,.2,.25),accent)
  for i in range(count):
   z=.29-i*.17;sphere('BodySegment_'+str(i),(math.sin(i*.16)*.08,yy,z),(.25-i*.004,.16,.13),dark if i%3 else accent)
   for side in [-1,1]:leg(side,i,z,'normal',.7)
  antenna(yy,.24,.5);mandibles(yy,.21,.28);detail.append(str(count)+' articulating trunk plates with paired legs and venom claws')
 elif cat=='scorpion':
  yy=.34;sphere('ScorpionAbdomen',(0,yy,-.28),(.33,.22,.55),dark);sphere('Cephalothorax',(0,yy,.34),(.31,.18,.3),accent)
  for side in [-1,1]:
   for i,z in enumerate([.4,.16,-.1,-.37]):leg(side,i,z,length=1 if stage==2 else 1.18)
   pivot=b.node('ClawJoint_'+str(side),b.root,(side*.2,yy,.4));pincers.append((pivot,side));rod('Pedipalp',(0,0,0),(side*.52,.04,.35),.065,dark,pivot);sphere('Claw',(side*.58,.05,.46),(.36 if stage==3 else .15,.18 if stage==3 else .12,.36 if stage==3 else .22),accent,pivot)
   for claw in [-1,1]:rod('Pincer',(side*.58+claw*.13,.05,.52),(side*.58+claw*.08,.05,.83),.045,light,pivot)
  last=(0,yy,-.75)
  for i in range(6):
   a=i/5*math.pi;at=(0,yy+.2+math.sin(a)*(1.3 if stage==3 else .65),-.85+(.8 if stage==3 else .55)*(1-math.cos(a)));rod('TailSegment',last,at,.09,dark);sphere('TailJoint',at,(.095,)*3,accent);last=at
  rod('Sting',last,(0,last[1]-.22,last[2]+.2),.06,light,glow=1.2 if evolved else False)
  if evolved:
   sphere('VenomBulb',last,(.16,.14,.18),plate,glow=.5)
   for i in range(6):sphere('MesosomaPlate',(0,yy+.17,.05-i*.15),(.3-i*.02,.07,.08),plate)
   for pv,side in pincers:sphere('FluorescentClawEdge',(side*.72,.08,.5),(.2,.08,.26),light,pv,glow=.9)
  detail.append('eight legs, articulated pincers and six-segment over-body sting')
 else:
  if cat in ['lacewing','longfly']:yy=.7
  if family in ['stick','leaf','mantis']:yy=.7
  if cat=='beetle':
   width=.38 if family not in ['tortoisebeetle','giantwaterbug','divingbeetle'] else .48
   if family=='weevil':width=.43
   sphere('ElytraBase',(0,yy,-.33),(width,.3,.62),dark);sphere('Pronotum',(0,yy,.29),(.31,.24,.31),accent);sphere('Head',(0,yy,.61),(.21,.18,.23),dark)
   if evolved and family=='divingbeetle':width=.56
   for side in [-1,1]:sphere('HardenedWingCover',(side*width*.4,yy+.13,-.38),(width*.56,.23,.6),accent if family=='tortoisebeetle' else dark,m=.35 if evolved else None)
   for row in range(3):rod('ElytralRidge',(-.2+row*.2,yy+.29,-.75),(-.18+row*.18,yy+.3,.02),.009,light)
   if family=='beetle':
    # Rhinoceros line: one curved head horn (elite), Atlas-style forked horn plus two thoracic horns (final).
    if stage==2:curve('CephalicHorn',[(0,yy+.06,.7),(0,yy+.28,.92),(0,yy+.58,1.02),(0,yy+.82,.92)],.13,.04,accent)
    else:
     curve('CephalicHorn',[(0,yy+.06,.72),(0,yy+.36,1.0),(0,yy+.8,1.12),(0,yy+1.1,.98)],.18,.06,dark)
     for side in [-1,1]:rod('HornFork',(0,yy+1.1,.98),(side*.16,yy+1.22,1.06),.05,plate);curve('ThoracicHorn',[(side*.2,yy+.28,.36),(side*.3,yy+.44,.72),(side*.27,yy+.5,1.06)],.085,.03,plate,tip=light)
     for side in [-1,1]:
      rod('GoldElytralRidge',(side*.2,yy+.37,-.92),(side*.19,yy+.4,-.08),.045,plate)
   if family=='hercules':
    horn=1 if stage==2 else 3
    for i in range(horn):
     x=(i-(horn-1)/2)*.19;rod('CephalicHorn',(x,yy+.15,.59),(x*1.25,yy+.5,.98),.075,dark);rod('HornFork',(x*1.25,yy+.5,.98),(x*1.25+.1,yy+.55,1.09),.028,light)
   if family=='dungbeetle':
    sphere('DungBeetleBroadPronotum',(0,yy+.11,.27),(.39,.29,.36),accent)
    for side in [-1,1]:rod('PronotalDiggingTooth',(side*.28,yy+.24,.4),(side*.44,yy+.39,.6),.055,light)
    if stage==2:rod('CurvedDiggerHorn',(0,yy+.28,.65),(0,yy+.6,.76),.07,dark);rod('DiggerHornTip',(0,yy+.6,.76),(0,yy+.63,1.02),.04,light)
    else:
     # Moon-horned scarab: tall backward-curving head horn, pronotal horn pair, shovel clypeus, polished plates.
     curve('MoonHorn',[(0,yy+.2,.68),(0,yy+.58,.82),(0,yy+1.0,.72),(0,yy+1.2,.44)],.15,.045,dark)
     sphere('PronotalCrest',(0,yy+.36,.28),(.4,.15,.2),plate)
     for side in [-1,1]:curve('PronotalHorn',[(side*.28,yy+.32,.36),(side*.4,yy+.62,.52),(side*.36,yy+.84,.6)],.09,.03,plate)
     sphere('ClypealShovel',(0,yy-.03,.78),(.3,.06,.17),plate)
   if family=='hercules':
    sphere('HerculesLongAbdomen',(0,yy,-.51),(.37,.3,.7),dark)
    rod('UpperHerculesHorn',(0,yy+.28,.31),(0,yy+.56,1.22),.105,accent)
    for side in [-1,1]:rod('HerculesHornFork',(0,yy+.56,1.22),(side*.21,yy+.56,1.48),.055,light)
    rod('LowerHerculesHorn',(0,yy-.06,.62),(0,yy+.02,1.13),.07,dark)
   if family=='weevil':
    last=(0,yy+.02,.69)
    for i in range(5 if stage==2 else 9):at=(0,yy-.025*i,.81+i*.11);rod('CurvedRostrum',last,at,.06,accent);last=at
   if family=='tortoisebeetle':sphere('TransparentCarapace',(0,yy+.13,-.22),(.65,.33,.78),plate if evolved else light)
   if family=='tigerbeetle':
    mandibles(yy,.23 if stage==2 else .33,.42 if stage==2 else .67)
    if stage==3:
     for side in [-1,1]:
      for i in range(5):sphere('ElytralOcello',(side*.3,yy+.2,-.72+i*.15),(.05,.025,.04),light)
   if stage==3 and family=='divingbeetle':
    for side in [-1,1]:
     for i in range(9):rod('SwimmingFringe',(side*.75,.11,-.4+i*.05),(side*.99,.1,-.4+i*.05),.01,light)
    sphere('HydrodynamicPronotalShield',(0,yy+.1,.34),(.42,.2,.36),accent)
   if stage==3 and family=='giantwaterbug':
    for side in [-1,1]:
     for i in range(5):sphere('RespiratoryPlate',(side*.43,yy,-.68+i*.18),(.1,.08,.13),light)
    for side in [-1,1]:rod('RespiratorySiphon',(side*.06,yy,-.87),(side*.08,yy,-1.26),.025,dark)
   if stage==3 and family=='tortoisebeetle':
    for i in range(12):
     a=i/12*math.tau;sphere('ScallopedShieldRim',(.61*math.sin(a),yy+.12,-.22+.73*math.cos(a)),(.12,.09,.13),light)
   detail.append('two hardened wing covers, sculpted pronotum and family-specific feeding anatomy')
  elif cat=='segmented':
   narrow=.14 if family=='silverfish' else .23 if family=='earwig' else .39 if family=='cockroach' else .26
   yy=.32 if family=='silverfish' else .43
   count=(11 if stage==2 else 15) if family=='silverfish' else 8 if family=='earwig' else 6
   if family=='termite' and stage==3:count=13;narrow=.36
   if family=='flea':sphere('ArchedCompressedCarapace',(0,yy+.2,-.1),(.19,.47,.56),dark)
   else:
    for i in range(count):
     z=.18-i*.14;scale=1-i/count*.58;sphere('Segment_'+str(i),(0,yy,z),(narrow*scale,.13 if family=='silverfish' else .19,.12),accent if i%3==0 else dark)
   sphere('Head',(0,yy,.54),(.17,.17,.2),dark)
   if family=='cockroach':
    sphere('PronotalShield',(0,yy+.16,.38),(.38,.13,.3),accent)
    for side in [-1,1]:sphere('LongWingCover',(side*.14,yy+.18,-.26),(.2,.09,.6),dark)
   if family=='earwig':
    for side in [-1,1]:rod('CaudalPincer',(side*.1,yy,-1.02),(side*.4,yy+.05,-1.32),.06,accent);rod('PincerHook',(side*.4,yy+.05,-1.32),(side*.18,yy+.04,-1.6),.04,dark)
   if family=='silverfish':
    for i in [-1,0,1]:rod('CaudalFilament',(i*.06,yy,-1.24),(i*.32,yy+.06,-1.95),.018,light)
   if family=='cockroach' and stage==3:
    for side in [-1,1]:wing(side,.05,.72,1.04,'fan')
   if family=='flea' and stage==3:
    for i in range(7):
     for side in [-1,1]:rod('GenalComb',(side*.14,yy+.32-i*.07,.51),(side*.29,yy+.39-i*.07,.63),.014,accent)
   if family=='termite':sphere('TermiteHead',(0,yy,.49),(.26,.2,.28),accent);mandibles(yy,.19,.33)
   detail.append('anatomical trunk segmentation with authentic cerci, pincers or queen abdomen')
  elif family=='mantis' and stage==3:
   yy=.62;custom=True
   sphere('Mesothorax',(0,yy,0),(.13,.12,.26),dark);sphere('LongAbdomen',(0,yy+.02,-.62),(.21,.15,.56),accent)
   for i in range(4):sphere('AbdominalBand',(0,yy+.04,-.36-i*.17),(.2-i*.02,.15,.03),light)
   curve('Prothorax',[(0,yy,.14),(0,yy+.22,.32),(0,yy+.46,.5)],.08,.06,dark)
   sheet('ProthoracicShield',[(-.04,yy+.26,.24),(-.2,yy+.36,.36),(-.07,yy+.5,.5),(.07,yy+.5,.5),(.2,yy+.36,.36),(.04,yy+.26,.24)],light)
   hy,hz=yy+.58,.58
   sphere('TriangularHead',(0,hy,hz),(.21,.12,.1),dark);sphere('Mouthparts',(0,hy-.1,hz+.04),(.07,.07,.06),accent)
   for side in [-1,1]:sphere('CompoundEye',(side*.2,hy+.05,hz),(.085,.11,.085),black)
   curve('VertexCrest',[(0,hy+.06,hz-.02),(0,hy+.24,hz-.06),(0,hy+.4,hz-.14)],.06,.02,plate,tip=light)
   for side in [-1,1]:rod('AntennaStem',(side*.05,hy+.06,hz+.06),(side*.22,hy+.36,hz+.48),.013)
   for side in [-1,1]:
    pivot=b.node('RaptorialJoint_'+str(side),b.root,(side*.07,yy+.36,.42));pincers.append((pivot,side))
    coxa=(side*.1,-.2,.16);femur=(side*.13,.16,.4);tibia=(side*.08,-.06,.26)
    rod('RaptorialCoxa',(0,0,0),coxa,.06,accent,pivot);sphere('RaptorialKnee',coxa,(.055,)*3,dark,pivot)
    b.tube('RaptorialFemur',coxa,femur,.075,.05,accent,pivot,metal=shine(accent,None));sphere('RaptorialElbow',femur,(.05,)*3,dark,pivot);rod('RaptorialTibia',femur,tibia,.04,dark,pivot)
    for k in range(5):
     t=(k+1)/6;at=tuple(coxa[j]+(femur[j]-coxa[j])*t for j in range(3));rod('FemoralSpine',at,(at[0]-side*.02,at[1]-.08,at[2]+.05),.018,light,pivot)
    sheet('FemoralPetal',[coxa,(coxa[0]+side*.16,coxa[1]+.12,coxa[2]+.1),(femur[0]+side*.12,femur[1]-.02,femur[2]-.06),femur],light,pivot)
   for side in [-1,1]:
    for i,z in [(1,-.02),(2,-.26)]:
     leg(side,i,z,'normal',1.18);pv,_,_,_,kn,_=limbs[-1];sheet('LegPetal',[(0,0,0),(kn[0]*.5,kn[1]*.5+.09,kn[2]*.5),kn,(kn[0]*.5,kn[1]*.5-.05,kn[2]*.5)],light,pv)
   for side in [-1,1]:sheet('FoldedTegmen',[(side*.02,yy+.15,.02),(side*.21,yy+.17,-.3),(side*.18,yy+.18,-.92),(side*.03,yy+.17,-1.14)],accent)
   for side in [-1,1]:
    mount=b.node('DisplayWingMount_'+str(side),b.root,(side*.08,yy+.16,-.22),qaxis((0,0,1),side*.95));wing(side,0,.78,.95,'fan',membrane=light,rib=plate,mount=mount)
    pv=wings[-1][0];sphere('DisplayEyespot',(side*.55,.03,-.05),(.15,.02,.15),plate,pv);sphere('DisplayEyespotCore',(side*.55,.05,-.05),(.07,.02,.07),dark,pv)
   detail.append('upright prothorax with vertex crest, folded spined raptorial forelegs, four walking legs and raised eyespot display wings')
  elif cat=='orthopteran':
   thin=.09 if family=='stick' else .17 if family=='mantis' else .27
   sphere('Thorax',(0,yy,.2),(thin,.15,.57 if family in ['stick','mantis'] else .32),dark);sphere('Abdomen',(0,yy,-.5),(.13 if family=='stick' else .35 if family=='leaf' else .21,.12,.65 if family in ['stick','leaf'] else .44),accent);sphere('TriangularHead',(0,yy+.12,.75),(.21,.14,.16),dark)
   if family=='leaf':
    sheet('VeinedLeafAbdomen',[(-.45,yy,-.1),(-.55,yy,-.6),(-.3,yy,-1.1),(0,yy,-1.3),(.3,yy,-1.1),(.55,yy,-.6),(.45,yy,-.1)],accent)
    for side in [-1,1]:
     for i in range(4):rod('LeafVein',(0,yy+.02,-.25-i*.2),(side*(.42-i*.04),yy+.02,-.4-i*.2),.007,light)
   if family=='stick':
    for i in range(6 if stage==2 else 12):rod('TwigSpine',(((-1)**i)*.07,yy+.07,.5-i*.12),(((-1)**i)*.2,yy+.18,.52-i*.12),.02,light)
   if stage==3 and family=='leaf':
    for side in [-1,1]:
     for i in range(3):sheet('FoliateLimbLobe',[(side*.4,yy-.05,.3-i*.3),(side*.83,yy-.08,.42-i*.3),(side*.77,yy-.1,.02-i*.3),(side*.4,yy-.06,.05-i*.3)],accent)
   if family=='cricket' and stage==3:
    for side in [-1,1]:wing(side,.02,.6,.85,'fan')
   if family=='mantis':
    for side in [-1,1]:sheet('ViolinThoraxFlange',[(side*.08,yy,.5),(side*.39,yy+.06,.23),(side*.2,yy,-.06)],accent)
   detail.append('jumping, raptorial, digging or leaf-adapted limbs and species-specific body proportions')
  elif cat=='sap':
   yy=.46;width=.39 if family=='aphid' else .35
   sphere('PearAbdomen',(0,yy,-.22),(width,.29,.5),accent);sphere('Thorax',(0,yy,.25),(.24,.2,.25),dark);sphere('BroadHead',(0,yy+.08,.56),(.33 if family=='cicada' else .22,.18,.2),dark)
   if family=='aphid':
    for side in [-1,1]:rod('Cornicle',(side*.17,yy+.18,-.53),(side*.24,yy+.46,-.56),.04,dark)
    if stage==3:
     for i in range(8):sphere('WoollyAbdomen',(.25*math.cos(i*math.pi/4),yy+.15,-.29+.18*math.sin(i*math.pi/4)),(.12,.13,.12),light)
   if family=='leafhopper':
    crest=1 if stage==2 else 3
    for k in range(crest):x=(k-(crest-1)/2)*.18;rod('PronotalThorn',(x,yy+.12,.35),(x*1.9,yy+.68,.5),.08,dark)
   if family=='cicada' and stage==1:
    for i in range(4):sphere('NymphAbdominalRing',(0,yy,-.3-i*.13),(.33-i*.04,.27-i*.02,.04),dark)
    for side in [-1,1]:sheet('NymphWingPad',[(side*.12,yy+.2,.3),(side*.36,yy+.18,.05),(side*.3,yy+.15,-.2),(side*.1,yy+.2,.05)],light)
   if family=='cicada' and stage==3:
    for i in range(5):sphere('ResonantAbdominalPlate',(0,yy,-.42-i*.15),(.31-i*.025,.23,.12),dark if i%2 else accent)
   if family=='cicada' and stage>1:
    for side in [-1,1]:sphere('TymbalPlate',(side*.24,yy,-.19),(.15,.2,.25),light)
   detail.append('piercing-mouth sap feeder with pear abdomen, cornicles, tymbals or pronotal crest')
  else:
   yy=.64 if cat in ['lacewing','longfly'] else .53
   slender=cat in ['lacewing','longfly'];segments=6+stage*2 if slender else 3+stage*2
   sphere('Thorax',(0,yy,.23),(.16 if slender else .28,.19,.3),dark);sphere('Head',(0,yy+.04,.61),(.18 if slender else .23,.18,.19),accent)
   if family=='ant':
    sphere('QueenPearAbdomen',(0,yy-.03,-.77),(.38,.29,.56),dark);sphere('Petiole',(0,yy,-.14),(.085,.095,.13),accent);sphere('Postpetiole',(0,yy,-.32),(.11,.11,.13),accent)
   else:
    for i in range(segments):
     z=(-.33 if family=='wasp' else -.06)-i*(.13 if slender else .12);scale=1-i/segments*.48;r=.09 if slender else .29
     sphere('AbdominalTergite_'+str(i),(0,yy-.02,z),(r*scale,.11 if slender else .2,.09),accent if (family in ['bee','wasp','hoverfly','firefly'] or evolved) and i%2 else dark)
    if family=='wasp':rod('NarrowPetiole',(0,yy,-.05),(0,yy,-.35),.045,dark)
   if family=='mosquito':
    if stage==2:rod('FeedingProboscis',(0,yy,.74),(0,yy-.12,1.22),.025,dark)
    else:
     last=(0,yy,.74)
     for i in range(5):at=(0,yy-.025*i*i,.83+i*.12);rod('CurvedProboscis',last,at,.028,accent);last=at
   if family in ['bee','wasp','armabee']:rod('Stinger',(0,yy,-.88),(0,yy-.04,-1.16),.06,accent)
   if family=='firefly':
    if stage==3:
     for i in range(3):sphere('LanternOrgan',(0,yy-.05,-.55-i*.16),(.29-i*.03,.17,.12),light,glow=1.6)
     sphere('PronotalHood',(0,yy+.13,.48),(.3,.08,.25),accent)
     for side in [-1,1]:sphere('PronotalSpot',(side*.1,yy+.2,.5),(.06,.025,.07),dark)
    else:
     for i in range(stage):sphere('LanternOrgan',(0,yy-.11,-.52-i*.12),(.16,.08,.08),light,glow=True if stage>1 else False)
    if stage>1:
     for side in [-1,1]:
      sphere('ProtectiveLanternElytron',(side*.18,yy+.15,-.36),(.16,.1,.42 if stage==2 else .6),dark)
      if stage==3:rod('ElytralMargin',(side*.32,yy+.17,0),(side*.3,yy+.17,-.9),.03,light,glow=.8)
   if family=='mayfly':
    for i in [-1,0,1]:rod('CaudalTail',(i*.04,yy,-1),(i*.28,yy+.04,-1.9) if not evolved else (i*.36,yy+.12,-2.2),.012 if not evolved else .022,light)
    if evolved:
     for side in [-1,1]:sphere('TurbinateEye',(side*.08,yy+.27,.6),(.11,.1,.11),accent)
   detail.append('distinct narrow-waisted or long segmented aerial body with genuine wing plan')
  # True eye and leg counts, with class-specific tools rather than random crowns.
  if (family!='mosquito' or stage!=1) and not custom:
   if evolved and family in EYES3:
    ec,es=EYES3[family]
    for side in [-1,1]:sphere('CompoundEye',(side*(.26 if family=='cicada' else .2),yy+.11,.64),(.09*es,.1*es,.1*es),color(ec),m=.35)
   else:
    for side in [-1,1]:sphere('CompoundEye',(side*(.26 if family in ['cicada','dragonfly'] else .18),yy+.11,.64),(.09 if family!='dragonfly' else .145,.1,.1),black)
   antenna(yy,.21 if family not in ['stick','cricket'] else .36,.27 if family not in ['cockroach','cranefly','cricket'] else .75,family in ['moth','mosquito'])
   for side in [-1,1]:
    for i,z in enumerate([.36,.02,-.32]):
     kind='long' if family in ['waterstrider','cranefly','mosquito','mayfly'] else 'jump' if i==2 and family in ['grasshopper','cricket','flea'] else 'raptorial' if i==0 and family in ['mantis','giantwaterbug'] else 'digger' if i==0 and (family=='cricket' or (family=='dungbeetle' and stage>1) or (family=='cicada' and stage==1)) else 'normal'
     leg(side,i,z,kind,(1.1*LEGS3.get(family,1)*(1.12 if family=='flea' and i==2 else 1)) if evolved else 1.1 if stage==3 else .96)
   if family in ['moth','butterfly']:
    for side in [-1,1]:wing(side,.28,1.05 if family=='butterfly' else .95,.95,'round' if family=='butterfly' else 'luna',.25);wing(side,-.08,.76,.85,'round' if family=='butterfly' else 'luna',.42)
   elif family in ['lacewing','antlion','dragonfly']:
    for side in [-1,1]:
     wing(side,.3,.65+stage*.2,.6+stage*.12)
     wing(side,-.02,.7+stage*.15,.7+stage*.12 if family!='lacewing' else 1.2+stage*.25,'spoon' if family in ['lacewing','antlion'] and stage==3 else 'clear')
   elif family=='termite' and stage==2:
    for side in [-1,1]:wing(side,.2,.93,.66);wing(side,-.04,.88,.7)
   elif family=='mayfly':
    for side in [-1,1]:wing(side,.23,1.15 if evolved else .88,1.35 if evolved else 1.08,'upright',spots=2 if evolved else 0,membrane=accent if evolved else None,rib=dark if evolved else None);wing(side,-.05,.35,.46)
   elif family in ['mosquito','cranefly','hoverfly']:
    for side in [-1,1]:wing(side,.23,(1.2 if family=='cranefly' else 1.0) if evolved else .92 if family=='cranefly' else .7,.95 if evolved else .75,spots=(3 if family=='cranefly' else 1) if evolved else 0)
   elif family in ['bee','armabee','wasp','firefly','ant']:
    for side in [-1,1]:wing(side,.24,.5+stage*.16,.5+stage*.1);wing(side,.02,.35+stage*.1,.4+stage*.08)
   elif family in ['aphid','cicada','leafhopper'] and not (family=='cicada' and stage==1):
    if family=='cicada':
     for side in [-1,1]:wing(side,.22,.9+(stage-2)*.25,1.2+(stage-2)*.3,'clear',membrane=glass,rib=plate if stage==3 else dark);wing(side,-.02,.55,.8,'clear',membrane=glass,rib=plate if stage==3 else dark)
    else:
     for side in [-1,1]:wing(side,.22,.68,.95,'leaf' if family=='leafhopper' else 'clear');wing(side,-.02,.42,.65)
   elif family=='grasshopper' and stage==3:
    for side in [-1,1]:wing(side,.15,.87,.95,'fan')
   elif family=='earwig' and stage==3:
    for side in [-1,1]:wing(side,-.1,.8,.87,'fan')
   elif stage==3 and family=='leaf':
    for side in [-1,1]:
     for i in range(3):sheet('FoliateLimbLobe',[(side*.4,yy-.05,.3-i*.3),(side*.83,yy-.08,.42-i*.3),(side*.77,yy-.1,.02-i*.3),(side*.4,yy-.06,.05-i*.3)],accent)
   if family=='cricket' and stage==3:
    for side in [-1,1]:wing(side,.02,.6,.85,'fan')
   if family=='mantis':
    for side in [-1,1]:wing(side,.06,.5,.8,'leaf');wing(side,-.08,.35,.6)
   if evolved:evolve()
   if family=='armabee':
    for side in [-1,1]:sphere('ForearmArmour',(side*.5,yy+.02,.48),(.23,.22,.25),accent);rod('ShoulderHorn',(side*.2,yy+.14,.29),(side*.49,yy+.48,.33),.06,light)
 # Dedicated node channels are subsequently converted to a single skinned mesh.
 motion=b.node('Motion',b.root);children=list(b.nodes[b.root]['children']);b.nodes[b.root]['children']=[motion];b.nodes[motion]['children']=[n for n in children if n!=motion]
 for kind in ['idle','walk','attack','hit','dead']+(['fly'] if wings else []):
  t=[0,.2,.4,.6,.8,1.0];channels=[]
  values=[(0,.018*math.sin(i*math.tau/5),0) for i in range(6)]
  if kind=='attack':values=[(0,0,0),(0,.035,-.07),(0,.02,.22),(0,0,.12),(0,0,.03),(0,0,0)]
  if kind=='hit':values=[(0,0,0),(0,.07,-.14),(0,-.03,-.09),(0,0,-.03),(0,0,0),(0,0,0)]
  if kind=='dead':values=[(0,-i*.035,-i*.015) for i in range(6)]
  channels.append((motion,'translation',t,values))
  for node,side,i in legs:
   angle=.28 if kind=='walk' else .05 if kind=='idle' else .14
   channels.append((node,'rotation',t,[qaxis((0,1,0),side*angle*math.sin(j*math.tau/5+i*math.pi)) for j in range(6)]))
  for node,side in wings:
   angle=.6 if kind=='fly' else .12 if kind=='walk' else .045
   channels.append((node,'rotation',t,[qaxis((0,0,1),side*angle*math.sin(j*math.tau/5*(2 if kind=='fly' else 1))) for j in range(6)]))
  for node,side in pincers:channels.append((node,'rotation',t,[qaxis((0,1,0),side*(.3 if kind=='attack' else .03)*math.sin(j*math.pi/5)) for j in range(6)]))
  b.anim(kind,channels)
 raw=b.export();return raw,{'family':family,'stage':stage,'anatomy':cat,'features':detail,'partNodes':len(b.nodes),'animations':[a['name'] for a in b.animations]}

if __name__=='__main__':
 results=[]
 for row in PLAN:
  if row['family']=='spider':continue # use the superior complete CC0 Insectoids line
  family=row['target_id'].rsplit('_',1)[0] if row['target_id'].endswith(('_elite','_ultimate')) else row['family']
  filename=row['asset_name'];raw,proof=generate(filename.removesuffix('.glb'),family,row['stage']);(OUTPUT/filename).write_bytes(raw);results.append({**row,**proof,'family':row['family'],'morphologyFamily':family,'file':filename,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'sourceGeometryReused':False,'source':'BugBaas original anatomy-specific production generator'})
 (ROOT/'authored-manifest.json').write_text(json.dumps({'models':results,'count':len(results),'status':'candidates pending visual selection/optimized skinning'},indent=2));print('Authored',len(results),'anatomy-specific candidate GLBs')
