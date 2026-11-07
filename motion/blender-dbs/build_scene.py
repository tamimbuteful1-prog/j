# بناء مشهد «الجندي الرقمي» — اختبار 8 ثوانٍ: مكتب التحقيق ← شاشة الجوال ← موجز الأخبار
# التشغيل: python build_scene.py [--preview] [--render] [--frames a-b]
import bpy, bmesh, math, json, os, sys, random
from mathutils import Vector, Matrix, Quaternion
import arabic_reshaper
try: from bidi import get_display
except ImportError: from bidi.algorithm import get_display

HERE=os.path.dirname(os.path.abspath(__file__)); C=json.load(open(os.path.join(HERE,'content.json'),encoding='utf-8'))
ARGS=sys.argv[1:]; PREVIEW='--preview' in ARGS
FPS=30; NF=240
import unicodedata
from fontTools.ttLib import TTFont
CMAP=set(TTFont(os.path.join(HERE,'fonts/Tajawal-900.ttf')).getBestCmap())
def _fix(ch):
    if ord(ch) in CMAP: return ch
    d=unicodedata.decomposition(ch).split()      # مثال: '<isolated> 0627' → الحرف الأساسي
    cps=[int(x,16) for x in d if not x.startswith('<')]
    return ''.join(chr(c) for c in cps) if cps and all(c in CMAP for c in cps) else ch
def ar(s): return ''.join(_fix(c) for c in get_display(arabic_reshaper.reshape(s)))
def t2f(t): return 1+round(t*FPS)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene; sc.render.fps=FPS; sc.frame_start=1; sc.frame_end=NF
FONT={w:bpy.data.fonts.load(os.path.join(HERE,f'fonts/Tajawal-{w}.ttf')) for w in (500,700,900)}
FONT['lat']=bpy.data.fonts.load(os.path.join(HERE,'fonts/Tajawal-Latin-700.ttf'))
def col(name):
    c=bpy.data.collections.new(name); sc.collection.children.link(c); return c
CO={k:col(k) for k in ('Room','Desk','Board','Lamp','Phone','Feed','Lights','Camera')}
def link(o,c): CO[c].objects.link(o); return o
def srgb(h):
    h=h.lstrip('#'); v=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(((x+0.055)/1.055)**2.4 if x>0.04045 else x/12.92 for x in v)+(1,)

# ---------- خامات ----------
def mat(name,color,rough=.5,metal=0,coat=0,spec=.5,emit=None,es=0):
    m=bpy.data.materials.new(name); m.use_nodes=True; b=m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=srgb(color) if isinstance(color,str) else color
    b.inputs['Roughness'].default_value=rough; b.inputs['Metallic'].default_value=metal
    b.inputs['Coat Weight'].default_value=coat; b.inputs['Specular IOR Level'].default_value=spec
    if emit: b.inputs['Emission Color'].default_value=srgb(emit); b.inputs['Emission Strength'].default_value=es
    return m
def node(m,t,**kw):
    n=m.node_tree.nodes.new(t)
    for k,v in kw.items(): setattr(n,k,v)
    return n
def L(m,a,b): m.node_tree.links.new(a,b)
def wood():
    # عروق خشب مستقيمة على طول الطاولة + ألياف دقيقة + تفاوت في اللمعة
    m=mat('Wood','#3b2a1f',.42,coat=.18); nt=m.node_tree; b=nt.nodes['Principled BSDF']; b.inputs['Coat Roughness'].default_value=.28
    tc=node(m,'ShaderNodeTexCoord')
    mp=node(m,'ShaderNodeMapping'); mp.inputs['Scale'].default_value=(.35,6,1)
    nz0=node(m,'ShaderNodeTexNoise'); nz0.inputs['Scale'].default_value=2.2; nz0.inputs['Detail'].default_value=3
    add=node(m,'ShaderNodeVectorMath'); add.operation='ADD'
    w=node(m,'ShaderNodeTexWave'); w.wave_type='BANDS'; w.bands_direction='Y'; w.inputs['Scale'].default_value=4; w.inputs['Distortion'].default_value=1.6; w.inputs['Detail'].default_value=3
    mp2=node(m,'ShaderNodeMapping'); mp2.inputs['Scale'].default_value=(4,180,1)
    fib=node(m,'ShaderNodeTexNoise'); fib.inputs['Scale'].default_value=3; fib.inputs['Detail'].default_value=10
    mx=node(m,'ShaderNodeMix'); mx.data_type='FLOAT'; mx.inputs[0].default_value=.3
    cr=node(m,'ShaderNodeValToRGB'); cr.color_ramp.elements[0].color=srgb('#24170f'); cr.color_ramp.elements[1].color=srgb('#5b412f')
    bm=node(m,'ShaderNodeBump'); bm.inputs['Strength'].default_value=.06
    L(m,tc.outputs['Object'],mp.inputs['Vector']); L(m,mp.outputs['Vector'],nz0.inputs['Vector']); L(m,mp.outputs['Vector'],add.inputs[0]); L(m,nz0.outputs['Color'],add.inputs[1])
    L(m,add.outputs['Vector'],w.inputs['Vector']); L(m,tc.outputs['Object'],mp2.inputs['Vector']); L(m,mp2.outputs['Vector'],fib.inputs['Vector'])
    L(m,w.outputs['Fac'],mx.inputs[2]); L(m,fib.outputs['Fac'],mx.inputs[3]); L(m,mx.outputs[0],cr.inputs['Fac'])
    L(m,cr.outputs['Color'],b.inputs['Base Color']); L(m,fib.outputs['Fac'],bm.inputs['Height']); L(m,bm.outputs['Normal'],b.inputs['Normal'])
    rr=node(m,'ShaderNodeMapRange'); rr.inputs['To Min'].default_value=.34; rr.inputs['To Max'].default_value=.52; L(m,w.outputs['Fac'],rr.inputs['Value']); L(m,rr.outputs['Result'],b.inputs['Roughness'])
    return m
def noisy(name,c1,c2,scale=30,rough=.8,bump=.05):
    m=mat(name,c1,rough); b=m.node_tree.nodes['Principled BSDF']
    nz=node(m,'ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=scale; nz.inputs['Detail'].default_value=10
    cr=node(m,'ShaderNodeValToRGB'); cr.color_ramp.elements[0].color=srgb(c1); cr.color_ramp.elements[1].color=srgb(c2)
    bm=node(m,'ShaderNodeBump'); bm.inputs['Strength'].default_value=bump
    L(m,nz.outputs['Fac'],cr.inputs['Fac']); L(m,cr.outputs['Color'],b.inputs['Base Color']); L(m,nz.outputs['Fac'],bm.inputs['Height']); L(m,bm.outputs['Normal'],b.inputs['Normal'])
    return m
M={}
M['wood']=wood(); M['wall']=noisy('Wall','#1b2129','#252c36',18,.9,.08); M['cork']=noisy('Cork','#3a2c22','#55402f',140,.95,.25)
M['paper']=noisy('Paper','#cfc7b6','#ddd6c6',220,.85,.02); M['paper2']=noisy('PaperWarm','#d8cfbd','#e6dfd0',240,.85,.02)
M['ink']=mat('Ink','#1e2024',.7); M['inkblue']=mat('InkBlue','#3d4a5c',.7); M['red']=mat('PrintRed','#b3242c',.6)
M['cream']=mat('Cream','#f1e9dc',.7)
M['string']=mat('RedString','#9e1820',.75); M['pin']=mat('PinRed','#c0202a',.18,coat=.6); M['steel']=mat('Steel','#b8bcc2',.25,metal=1)
M['frame']=mat('BoardFrame','#15181c',.55)
M['lampmetal']=mat('LampMetal','#1f2328',.38,metal=.6); M['lampin']=mat('LampInside','#d9cfc0',.4)
M['bulb']=mat('Bulb','#fff2da',.3,emit='#ffd9a8',es=0)
M['phone']=mat('PhoneBody','#1a1c20',.32,metal=.85); M['bezel']=mat('Bezel','#050608',.25)
M['ceramic']=mat('Ceramic','#e8e4dc',.18,coat=.6); M['coffee']=mat('Coffee','#1b0f08',.05)
M['dust']=mat('Dust','#9a9a9a',.9)
# زجاج الجوال: انعكاس بحسب زاوية النظر فوق شفافية
g=bpy.data.materials.new('PhoneGlass'); g.use_nodes=True; nt=g.node_tree; nt.nodes.clear()
o=nt.nodes.new('ShaderNodeOutputMaterial'); mx=nt.nodes.new('ShaderNodeMixShader'); fr=nt.nodes.new('ShaderNodeFresnel'); fr.inputs['IOR'].default_value=1.52
tr=nt.nodes.new('ShaderNodeBsdfTransparent'); gl=nt.nodes.new('ShaderNodeBsdfGlossy'); gl.inputs['Roughness'].default_value=.04
nt.links.new(fr.outputs[0],mx.inputs[0]); nt.links.new(tr.outputs[0],mx.inputs[1]); nt.links.new(gl.outputs[0],mx.inputs[2]); nt.links.new(mx.outputs[0],o.inputs['Surface'])
M['glass']=g

# ---------- أدوات الأشكال ----------
def box(name,c,size,loc,m,rot=(0,0,0),bevel=0,parent=None):
    me=bpy.data.meshes.new(name); bm_=bmesh.new(); bmesh.ops.create_cube(bm_,size=1); bmesh.ops.scale(bm_,vec=size,verts=bm_.verts); bm_.to_mesh(me); bm_.free()
    o=bpy.data.objects.new(name,me); o.location=loc; o.rotation_euler=rot; link(o,c); o.data.materials.append(m)
    if bevel: md=o.modifiers.new('Bevel','BEVEL'); md.width=bevel; md.segments=3
    if parent: o.parent=parent
    return o
def plane(name,c,w,h,loc,m,rot=(0,0,0),parent=None,round_=0):
    me=bpy.data.meshes.new(name); me.from_pydata([(-w/2,-h/2,0),(w/2,-h/2,0),(w/2,h/2,0),(-w/2,h/2,0)],[],[(0,1,2,3)])
    o=bpy.data.objects.new(name,me); o.location=loc; o.rotation_euler=rot; link(o,c); o.data.materials.append(m)
    if round_: md=o.modifiers.new('Round','BEVEL'); md.affect='VERTICES'; md.width=round_; md.segments=6
    if parent: o.parent=parent
    return o
def cyl(name,c,r,d,loc,m,rot=(0,0,0),r2=None,verts=48,parent=None):
    me=bpy.data.meshes.new(name); bm_=bmesh.new()
    bmesh.ops.create_cone(bm_,cap_ends=True,segments=verts,radius1=r,radius2=r if r2 is None else r2,depth=d); bm_.to_mesh(me); bm_.free()
    o=bpy.data.objects.new(name,me); o.location=loc; o.rotation_euler=rot; link(o,c); o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth=True
    if parent: o.parent=parent
    return o
def sphere(name,c,r,loc,m,parent=None):
    me=bpy.data.meshes.new(name); bm_=bmesh.new(); bmesh.ops.create_uvsphere(bm_,u_segments=24,v_segments=16,radius=r); bm_.to_mesh(me); bm_.free()
    o=bpy.data.objects.new(name,me); o.location=loc; link(o,c); o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth=True
    if parent: o.parent=parent
    return o
def text(name,c,s,size,font,m,loc,rot=(0,0,0),align='RIGHT',parent=None,arabic=True,valign='CENTER'):
    cu=bpy.data.curves.new(name,'FONT'); cu.body=ar(s) if arabic else s; cu.font=FONT[font]; cu.size=size; cu.align_x=align; cu.align_y=valign
    cu['source_text']=s   # النص الأصلي القابل للتعديل
    o=bpy.data.objects.new(name,cu); o.location=loc; o.rotation_euler=rot; link(o,c); o.data.materials.append(m)
    if parent: o.parent=parent
    return o
def bars(name,c,x0,x1,y0,y1,step,th,m,seed,parent,z=0,cols=1,gap=0):
    random.seed(seed); vs=[];fs=[]; cw=(x1-x0-(cols-1)*gap)/cols
    for ci in range(cols):
        xr=x1-ci*(cw+gap); y=y0
        while y>y1:
            ln=cw*(.5+random.random()*.5); i=len(vs); vs+= [(xr-ln,y-th,z),(xr,y-th,z),(xr,y,z),(xr-ln,y,z)]; fs.append((i,i+1,i+2,i+3)); y-=step
    me=bpy.data.meshes.new(name); me.from_pydata(vs,[],fs); o=bpy.data.objects.new(name,me); link(o,c); o.data.materials.append(m); o.parent=parent; return o

# ---------- الغرفة والمكتب ----------
desk=box('Desk_Top','Desk',(1.7,0.95,0.04),(0,0.07,-0.02),M['wood'],bevel=.004)
box('Desk_Body','Desk',(1.66,0.9,0.7),(0,0.09,-0.39),mat('DeskDark','#120d0a',.6))
plane('Wall','Room',4,3,(0,0.56,0.7),M['wall'],rot=(math.pi/2,0,0))
plane('Floor','Room',4,4,(0,-0.5,-0.75),mat('Floor','#0e1013',.8))

# ---------- لوحة الأدلة ----------
BX,BZ,BW,BH=-0.06,0.86,0.66,0.46
board=box('Board','Board',(BW,0.016,BH),(BX,0.55,BZ),M['cork'])
for i,(s,l) in enumerate([((BW+.03,.024,.018),(BX,0.547,BZ+BH/2)),((BW+.03,.024,.018),(BX,0.547,BZ-BH/2)),((.018,.024,BH),(BX-BW/2,0.547,BZ)),((.018,.024,BH),(BX+BW/2,0.547,BZ))]):
    box(f'Board_Frame_{i}','Board',s,l,M['frame'])
CLIPS=[(-.21,1.0,-.05),(.07,1.01,.04),(-.07,.86,.02),(-.23,.74,.06),(.1,.78,-.04),(.24,.95,.05)]
pins=[]
for i,(cl,(cx,cz,r)) in enumerate(zip(C['board'],CLIPS)):
    p=plane(f'Clip_{cl["id"]}','Board',.135,.155,(BX+cx,0.5405,cz),M['paper'],rot=(math.pi/2,r,0))
    # المحتوى على وجه الورقة (محاور الورقة المحلية: x يمين، y أعلى)
    if cl.get('style')=='red':
        plane(f'Clip_{cl["id"]}_band','Board',.115,.045,(0,.035,.0004),M['red'],parent=p)
        text(f'Clip_{cl["id"]}_title','Board',cl['title'],.034,900,M['cream'],(0,.035,.0008),align='CENTER',parent=p)
        bars(f'Clip_{cl["id"]}_lines','Board',-.055,.055,-.002,-.07,.009,.0028,M['ink'],i,p,z=.0004,cols=2,gap=.008)
    else:
        plane(f'Clip_{cl["id"]}_rule','Board',.115,.007,(0,.064,.0004),M['inkblue'],parent=p)
        text(f'Clip_{cl["id"]}_title','Board',cl['title'],.022,900,M['ink'],(.057,.04,.0006),align='RIGHT',parent=p)
        bars(f'Clip_{cl["id"]}_lines','Board',-.055,.055,.012,-.07,.009,.0028,M['ink'],i,p,z=.0004,cols=2,gap=.008)
    pin=sphere(f'Pin_{cl["id"]}','Board',.0065,(BX+cx,0.533,cz+.065),M['pin']); pins.append(pin.location.copy())
def string(name,a,b,sag=.012):
    cu=bpy.data.curves.new(name,'CURVE'); cu.dimensions='3D'; cu.bevel_depth=.0012; cu.bevel_resolution=3
    sp=cu.splines.new('BEZIER'); sp.bezier_points.add(1)
    for k,(p,q) in enumerate([(a,b),(b,a)]):
        bp=sp.bezier_points[k]; bp.co=p; d=(q-p)*.33; bp.handle_left=p-d+Vector((0,0,-sag)); bp.handle_right=p+d+Vector((0,0,-sag))
    o=bpy.data.objects.new(name,cu); link(o,'Board'); o.data.materials.append(M['string']); return o
for k,(a,b) in enumerate([(0,2),(1,2),(2,3),(2,4),(1,5),(3,4),(0,3)]):
    string(f'String_{k}',pins[a]+Vector((0,-.003,0)),pins[b]+Vector((0,-.003,0)))

# ---------- المصباح ----------
LB=Vector((.36,.30,0)); LJ=Vector((.40,.34,.30)); LH=Vector((.16,.16,.40)); LT=Vector((.02,-.06,0))
cyl('Lamp_Base','Lamp',.075,.022,LB+Vector((0,0,.011)),M['lampmetal'])
def rod(name,a,b,r=.008):
    d=b-a; o=cyl(name,'Lamp',r,d.length,(a+b)/2,M['lampmetal']); o.rotation_mode='QUATERNION'; o.rotation_quaternion=Vector((0,0,1)).rotation_difference(d.normalized()); return o
rod('Lamp_Arm_Lower',LB+Vector((0,0,.02)),LJ); rod('Lamp_Arm_Upper',LJ,LH); sphere('Lamp_Joint','Lamp',.014,LJ,M['lampmetal'])
aim=(LT-LH).normalized(); q=Vector((0,0,-1)).rotation_difference(aim)
shade=cyl('Lamp_Shade','Lamp',.03,.085,LH+aim*.03,M['lampmetal'],r2=.012); shade.rotation_mode='QUATERNION'; shade.rotation_quaternion=q@Quaternion((1,0,0),math.pi)
sh=shade.modifiers.new('Shell','SOLIDIFY'); sh.thickness=.002
# فتح أسفل الغطاء
bm_=bmesh.new(); bm_.from_mesh(shade.data); low=[f for f in bm_.faces if f.normal.z<-0.9 or f.normal.z>0.9]
big=max(low,key=lambda f:f.calc_area()); bmesh.ops.delete(bm_,geom=[big],context='FACES'); bm_.to_mesh(shade.data); bm_.free()
shade.data.materials.append(M['lampin']); shade.modifiers['Shell'].material_offset=1
bulb=sphere('Lamp_Bulb','Lamp',.016,LH+aim*.05,M['bulb'])
spot=bpy.data.lights.new('Lamp_Spot','SPOT'); spot.energy=0; spot.spot_size=math.radians(78); spot.spot_blend=.45; spot.shadow_soft_size=.018; spot.color=(1,.74,.48)
so=bpy.data.objects.new('Lamp_Spot',spot); so.location=LH+aim*.062; so.rotation_mode='QUATERNION'; so.rotation_quaternion=q; link(so,'Lights')
# وميض التشغيل (نفس توقيت المرجع)
def lampv(t):
    v=0
    for a,b in [(0,0),(1.17,1),(1.24,.15),(1.31,.85),(1.39,.2),(1.55,1)]:
        if t>=a: v=b
    return v
for f in range(1,NF+1):
    v=lampv((f-1)/FPS); spot.energy=95*v; spot.keyframe_insert('energy',frame=f)
    bs=M['bulb'].node_tree.nodes['Principled BSDF'].inputs['Emission Strength']; bs.default_value=40*v; bs.keyframe_insert('default_value',frame=f)
for fc in list(spot.animation_data.action.fcurves if hasattr(spot.animation_data.action,'fcurves') else []):
    for k in fc.keyframe_points: k.interpolation='CONSTANT'
# ضوء القمر البارد من النافذة اليسرى + ضوء خلفي خافت
moon=bpy.data.lights.new('Moon_Fill','AREA'); moon.energy=26; moon.size=1.2; moon.color=(.62,.72,.92)
mo=bpy.data.objects.new('Moon_Fill',moon); mo.location=(-1.3,-.4,1.3); mo.rotation_euler=(math.radians(55),0,math.radians(-60)); link(mo,'Lights')
rim=bpy.data.lights.new('Wall_Bounce','AREA'); rim.energy=7; rim.size=1.5; rim.color=(.6,.68,.85)
ro=bpy.data.objects.new('Wall_Bounce',rim); ro.location=(0,-.9,1.4); ro.rotation_euler=(math.radians(40),0,0); link(ro,'Lights')
w=bpy.data.worlds.new('World'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs['Color'].default_value=(.014,.018,.026,1)

# ---------- الكوب ----------
CP=Vector((.24,.02,0))
cup=cyl('Cup','Desk',.037,.088,CP+Vector((0,0,.044)),M['ceramic'],r2=.041)
cs=cup.modifiers.new('Shell','SOLIDIFY'); cs.thickness=.004
bm_=bmesh.new(); bm_.from_mesh(cup.data); top=max(bm_.faces,key=lambda f:f.calc_center_median().z); bmesh.ops.delete(bm_,geom=[top],context='FACES'); bm_.to_mesh(cup.data); bm_.free()
cyl('Cup_Coffee','Desk',.036,.002,CP+Vector((0,0,.074)),M['coffee'])
hd=bpy.data.meshes.new('Cup_Handle'); bm_=bmesh.new(); bmesh.ops.create_circle(bm_,segments=32,radius=.024); bm_.to_mesh(hd); bm_.free()
ho=bpy.data.objects.new('Cup_Handle',hd); ho.location=CP+Vector((.044,0,.046)); ho.rotation_euler=(math.pi/2,0,0); link(ho,'Desk')
sk=ho.modifiers.new('Skin','SKIN'); ho.modifiers.new('Sub','SUBSURF').levels=2
for v in ho.data.skin_vertices[0].data: v.radius=(.0045,.0045)
ho.data.materials.append(M['ceramic'])
for v in ho.data.vertices:
    if v.co.x<-.012: v.select=True
bm_=bmesh.new(); bm_.from_mesh(ho.data); bmesh.ops.delete(bm_,geom=[v for v in bm_.verts if v.co.x<-.014],context='VERTS'); bm_.to_mesh(ho.data); bm_.free()

# ---------- الأوراق على المكتب ----------
PAPERS=[('news1',(-.17,-.07,.0006),.22,M['paper2']),('news2',(-.20,-.19,.0012),-.18,M['paper']),('notes',(-.04,.12,.0009),.4,M['paper'])]
for d,(pid,loc,rz,pm) in zip(C['desk'],PAPERS):
    p=plane(f'Paper_{pid}','Desk',.21,.297,loc,pm,rot=(0,0,rz))
    bd=p.modifiers.new('Curl','SIMPLE_DEFORM'); bd.deform_method='BEND'; bd.angle=math.radians(6); bd.deform_axis='X'
    sub=p.modifiers.new('Sub','SUBSURF'); sub.levels=0; p.modifiers.move(1,0); sub.subdivision_type='SIMPLE'; sub.levels=4
    z=.0003
    if d['id']=='notes':
        text(f'Paper_{pid}_kicker','Desk',d['kicker'],.018,900,M['ink'],(.09,.12,z),parent=p)
        plane(f'Paper_{pid}_rule','Desk',.18,.0016,(0,.105,z),M['ink'],parent=p)
        for k,l in enumerate(d['lines']):
            text(f'Paper_{pid}_line{k}','Desk',l,.016,700,M['ink'],(.07,.07-k*.034,z),parent=p)
            plane(f'Paper_{pid}_box{k}','Desk',.011,.011,(.083,.07-k*.034,z),M['inkblue'],parent=p)
    else:
        text(f'Paper_{pid}_kicker','Desk',d['kicker'],.009,700,M['ink'],(.09,.132,z),parent=p)
        plane(f'Paper_{pid}_rule','Desk',.18,.002,(0,.122,z),M['red'],parent=p)
        for k,l in enumerate(d['title']):
            text(f'Paper_{pid}_title{k}','Desk',l,.022,900,M['ink'],(.09,.1-k*.026,z),parent=p)
        plane(f'Paper_{pid}_photo','Desk',.075,.05,(-.05,.0,z),M['inkblue'],parent=p)
        bars(f'Paper_{pid}_lines','Desk',-.09,.09,-.035,-.135,.007,.0022,M['ink'],hash(pid)%99,p,z=z,cols=3,gap=.008)
        for m_ in p.children:
            if m_.type in('MESH','FONT'): pass

# ---------- الجوال ----------
PH=Vector((.035,-.06,0)); PR=math.radians(22); PW,PL,PT=.074,.156,.0085; SW,SL=.068,.148
phone=box('Phone','Phone',(PW,PL,PT),PH+Vector((0,0,PT/2)),M['phone'],rot=(0,0,PR),bevel=.006)
plane('Phone_Bezel','Phone',PW-.002,PL-.002,(0,0,PT/2+.00005),M['bezel'],parent=phone,round_=.009)
screen=plane('Phone_Screen','Phone',SW,SL,(0,0,PT/2+.0001),mat('ScreenBlack','#020203',.15),parent=phone,round_=.006)
plane('Phone_Glass','Phone',PW-.002,PL-.002,(0,0,PT/2+.0011),M['glass'],parent=phone,round_=.009)
box('Phone_Camera','Phone',(.012,.004,.0004),(0,SL/2-.006,PT/2+.0012),M['bezel'],parent=phone)

# ---------- موجز الأخبار على شاشة الجوال (عناصر ثلاثية الأبعاد قابلة للتعديل) ----------
PX=SW/390; SH_PX=SL/PX
# قناع الشاشة + قوة الإضاءة المشتركة
mask=bpy.data.node_groups.new('ScreenMask','ShaderNodeTree'); mask.interface.new_socket('Mask',in_out='OUTPUT',socket_type='NodeSocketFloat')
nt=mask.nodes; go=nt.new('NodeGroupOutput'); tc=nt.new('ShaderNodeTexCoord'); tc.object=screen; sep=nt.new('ShaderNodeSeparateXYZ'); mask.links.new(tc.outputs['Object'],sep.inputs[0])
def lt(inp,lim):
    a=nt.new('ShaderNodeMath'); a.operation='ABSOLUTE'; mask.links.new(inp,a.inputs[0]); c=nt.new('ShaderNodeMath'); c.operation='LESS_THAN'; c.inputs[1].default_value=lim; mask.links.new(a.outputs[0],c.inputs[0]); return c.outputs[0]
mu=nt.new('ShaderNodeMath'); mu.operation='MULTIPLY'; mask.links.new(lt(sep.outputs['X'],SW/2-.0004),mu.inputs[0]); mask.links.new(lt(sep.outputs['Y'],SL/2-.0004),mu.inputs[1]); mask.links.new(mu.outputs[0],go.inputs[0])
power=bpy.data.node_groups.new('ScreenPower','ShaderNodeTree'); power.interface.new_socket('Power',in_out='OUTPUT',socket_type='NodeSocketFloat')
pv=power.nodes.new('ShaderNodeValue'); pv.name='Power'; pg=power.nodes.new('NodeGroupOutput'); power.links.new(pv.outputs[0],pg.inputs[0])
def ui(name,hexc,k=1.0):
    m=bpy.data.materials.new('UI_'+name); m.use_nodes=True; n=m.node_tree.nodes; n.clear(); l=m.node_tree.links
    o=n.new('ShaderNodeOutputMaterial'); e=n.new('ShaderNodeEmission'); e.inputs['Color'].default_value=srgb(hexc)
    pw=n.new('ShaderNodeGroup'); pw.node_tree=power; ms=n.new('ShaderNodeGroup'); ms.node_tree=mask
    mm=n.new('ShaderNodeMath'); mm.operation='MULTIPLY'; mm.inputs[1].default_value=k; l.new(pw.outputs[0],mm.inputs[0]); l.new(mm.outputs[0],e.inputs['Strength'])
    tr=n.new('ShaderNodeBsdfTransparent'); mx=n.new('ShaderNodeMixShader'); l.new(ms.outputs[0],mx.inputs[0]); l.new(tr.outputs[0],mx.inputs[1]); l.new(e.outputs[0],mx.inputs[2]); l.new(mx.outputs[0],o.inputs['Surface'])
    m.blend_method='BLEND' if hasattr(m,'blend_method') else None; return m
U={k:ui(k,v) for k,v in {'bg':'#0a0e14','card':'#141a23','line':'#232b36','white':'#eef2f6','dim':'#8d97a5','teal':'#4fc3c8','red':'#d4343c','redbg':'#3a1218',
  'th1':'#1f2b3a','th2':'#2e3d50','th3':'#4a5d73','lightw':'#f6f1e2','code':'#5fd3a3','codeb':'#0d1a17'}.items()}
def S(x,y): return (x*PX-SW/2, SL/2-y*PX)            # إحداثيات بكسل الشاشة → محلية
Z0=PT/2+.0003
plane('Feed_BG','Feed',SW,SL,(0,0,Z0),U['bg'],parent=phone)
scroll=bpy.data.objects.new('Feed_Scroll',None); link(scroll,'Feed'); scroll.parent=phone; scroll.location=(0,0,0)
def uplane(name,x,y,w,h,m,z,parent,round_=0):
    cx,cy=S(x+w/2,y+h/2); return plane(name,'Feed',w*PX,h*PX,(cx,cy,z),m,parent=parent,round_=round_*PX)
def utext(name,s,x,y,size,font,m,z,parent,align='RIGHT',arabic=True):
    cx,cy=S(x,y); return text(name,'Feed',s,size*PX,font,m,(cx,cy,z),align=align,parent=parent,arabic=arabic)
FD=C['feed']; CY0=96; CH=150; GAP=10
for i,cd in enumerate(FD['cards']):
    y=CY0+i*(CH+GAP); z=Z0+.00008; brk=cd.get('breaking')
    if brk: uplane(f'Card{i}_border',10,y-2,370,CH+4,U['red'],z,scroll,10)
    uplane(f'Card{i}',12,y,366,CH,U['redbg'] if False else U['card'],z+.00004,scroll,9)
    # الصورة المصغّرة (مرسومة من أشكال بسيطة)
    tx,ty,tw,th=22,y+12,118,CH-24; uplane(f'Card{i}_thumb',tx,ty,tw,th,U['th1'],z+.00008,scroll,6)
    kind=cd.get('thumb'); zz=z+.00012
    if kind=='stadium':
        for k in range(4): uplane(f'Card{i}_lt{k}',tx+14+k*26,ty+14,10,10,U['lightw'],zz,scroll,5)
        for k in range(6): uplane(f'Card{i}_net{k}',tx+8,ty+40+k*12,tw-16,2,U['th3'],zz,scroll)
    elif kind=='mic':
        uplane(f'Card{i}_mic',tx+40,ty+30,38,38,U['th3'],zz,scroll,19); uplane(f'Card{i}_stand',tx+57,ty+66,4,40,U['th2'],zz,scroll)
    elif kind=='code':
        uplane(f'Card{i}_cbg',tx+4,ty+4,tw-8,th-8,U['codeb'],zz,scroll,4)
        random.seed(i)
        for k in range(9): uplane(f'Card{i}_c{k}',tx+12+random.randint(0,20),ty+14+k*11,30+random.randint(0,50),4,U['code'],zz+.00004,scroll,2)
    elif kind=='chart':
        for k,hh in enumerate([30,52,40,70,58]): uplane(f'Card{i}_b{k}',tx+16+k*19,ty+th-14-hh,12,hh,U['th3'],zz,scroll,2)
    elif kind=='keys':
        for r_ in range(3):
            for c_ in range(4): uplane(f'Card{i}_k{r_}{c_}',tx+12+c_*25,ty+22+r_*30,20,22,U['th3'],zz,scroll,4)
    # التصنيف والوقت
    zt=z+.00012
    if brk:
        uplane(f'Card{i}_tag',318,y+14,50,24,U['red'],zt,scroll,4); utext(f'Card{i}_cat',cd['cat'],343,y+27,15,900,U['white'],zt+.00004,scroll,align='CENTER')
        xr=306
    else:
        utext(f'Card{i}_cat',cd['cat'],366,y+27,15,700,U['teal'],zt,scroll); xr=366-len(cd['cat'])*9-14
    uplane(f'Card{i}_sep',xr-2,y+18,1.5,16,U['dim'],zt,scroll); utext(f'Card{i}_time',cd['time'],xr-10,y+27,14,'lat',U['dim'],zt,scroll,arabic=False)
    uplane(f'Card{i}_rule',156,y+44,210,1.5,U['line'],zt,scroll)
    for k,l in enumerate(cd['title']): utext(f'Card{i}_title{k}',l,366,y+72+k*30,20,900,U['white'],zt,scroll)
# شريط التبويبات (ثابت فوق التمرير)
zt=Z0+.0005; uplane('Feed_TabBar',0,0,390,86,U['bg'],zt,phone)
for k,tb in enumerate(FD['tabs']):
    x=372-k*92; utext(f'Feed_Tab{k}',tb,x,58,15,700 if k else 900,U['white'] if k==0 else U['dim'],zt+.00004,phone)
uplane('Feed_TabLine',300,74,72,2.5,U['teal'],zt+.00004,phone); uplane('Feed_TabRule',0,84,390,1,U['line'],zt+.00004,phone)

# ---------- غبار داخل شعاع المصباح (يظهر فقط حيث يصله الضوء) ----------
random.seed(7); bm_=bmesh.new()
for k in range(170):
    t=random.random()*.62; c=LH+(LT-LH)*t; r=.02+t*.16
    p=c+Vector(((random.random()-.5)*2*r,(random.random()-.5)*2*r,(random.random()-.5)*.06))
    if p.z<.01: continue
    m_=bmesh.ops.create_icosphere(bm_,subdivisions=1,radius=.00028+random.random()*.00035); bmesh.ops.translate(bm_,verts=m_['verts'],vec=p)
dm=bpy.data.meshes.new('Dust'); bm_.to_mesh(dm); bm_.free(); dust=bpy.data.objects.new('Dust_In_Beam',dm); link(dust,'Lamp'); dust.data.materials.append(M['dust'])
dust.visible_shadow=False
for t,h in [(0,False),(5.4,True)]: dust.hide_render=h; dust.keyframe_insert('hide_render',frame=t2f(t))
for f in (1,NF): dust.location=(0,0,0) if f==1 else (.012,-.006,.03); dust.rotation_euler=(0,0,0) if f==1 else (0,0,math.radians(1.5)); dust.keyframe_insert('location',frame=f); dust.keyframe_insert('rotation_euler',frame=f)

# ---------- تحريك الشاشة والجوال ----------
pvn=power.nodes['Power']
for t,v in [(0,0),(3.70,0),(3.78,1.0),(8,1.0)]: pvn.outputs[0].default_value=v; pvn.outputs[0].keyframe_insert('default_value',frame=t2f(t))
base=phone.location.copy()
for f in range(1,NF+1):
    t=(f-1)/FPS; j=Vector((0,0,0))
    for b in (3.73,4.55,5.37):
        if b<=t<b+.32: j=Vector((math.sin(t*310)*.0006,math.cos(t*270)*.0005,0))
    phone.location=base+j; phone.keyframe_insert('location',frame=f)
for f,y in [(t2f(7.25),0.0),(t2f(8.0),118*PX)]:
    scroll.location=(0,y,0); scroll.keyframe_insert('location',frame=f)

# ---------- الكاميرا: لقطة واحدة متصلة ----------
cd_=bpy.data.cameras.new('Camera'); cd_.lens=32; cd_.sensor_fit='VERTICAL'; cd_.sensor_height=36; cd_.clip_start=.01
cam=bpy.data.objects.new('Camera',cd_); link(cam,'Camera'); sc.camera=cam; cam.rotation_mode='QUATERNION'
def look(pos,target,up):
    f=(target-pos).normalized(); r=f.cross(up).normalized(); u=r.cross(f)
    return Matrix((r,u,-f)).transposed().to_quaternion()
scr_w=phone.matrix_world.copy(); phone_axis=Vector((-math.sin(PR),math.cos(PR),0)); SC=PH+Vector((0,0,PT))
A=(Vector((.02,-1.12,.6)),Vector((-.02,.25,.34)),Vector((0,0,1)))
B=(Vector((.03,-.9,.52)),Vector((.0,.12,.24)),Vector((0,0,1)))
Cq=(SC+Vector((0,0,.152)),SC,phone_axis)
D=(SC+Vector((0,0,.098)),SC,phone_axis); E=(SC+Vector((0,0,.094)),SC+phone_axis*.004,phone_axis)
def ease_in_out(x): return 3*x*x-2*x*x*x
def ease_in(x): return x*x*(2.2-1.2*x)
mid=Vector((SC.x,SC.y-.42,.42))
for f in range(1,NF+1):
    t=(f-1)/FPS
    if t<=3.0:
        k=ease_in_out(t/3.0); pos=A[0].lerp(B[0],k); q=look(A[0],A[1],A[2]).slerp(look(B[0],B[1],B[2]),k)
    elif t<=6.6:
        k=ease_in((t-3.0)/3.6); pos=(1-k)**2*B[0]+2*(1-k)*k*mid+k*k*Cq[0]
        q=look(B[0],B[1],B[2]).slerp(look(Cq[0],Cq[1],Cq[2]),ease_in_out(k))
    elif t<=7.25:
        k=1-(1-(t-6.6)/.65)**2; pos=Cq[0].lerp(D[0],k); q=look(*Cq)
    else:
        k=ease_in_out((t-7.25)/.75); pos=D[0].lerp(E[0],k); q=look(*D).slerp(look(*E),k)
    cam.location=pos; cam.rotation_quaternion=q; cam.keyframe_insert('location',frame=f); cam.keyframe_insert('rotation_quaternion',frame=f)

# ---------- الرندر ----------
r=sc.render; r.engine='CYCLES'; sc.cycles.device='CPU'
r.resolution_x,r.resolution_y=1080,1920; r.resolution_percentage=50 if PREVIEW else 100
sc.cycles.samples=12 if PREVIEW else 14;
if '--samples' in ARGS: sc.cycles.samples=int(ARGS[ARGS.index('--samples')+1])
sc.cycles.use_adaptive_sampling=True; sc.cycles.adaptive_threshold=.03
sc.cycles.use_denoising=True; sc.cycles.denoiser='OPENIMAGEDENOISE'
sc.cycles.max_bounces=4; sc.cycles.diffuse_bounces=2; sc.cycles.glossy_bounces=2; sc.cycles.transmission_bounces=4; sc.cycles.transparent_max_bounces=16
sc.cycles.caustics_reflective=False; sc.cycles.caustics_refractive=False; sc.cycles.blur_glossy=1.0
r.use_motion_blur=True; r.motion_blur_shutter=.35
sc.view_settings.view_transform='AgX'; sc.view_settings.exposure=.3
try: sc.view_settings.look='AgX - Medium High Contrast'
except Exception: pass
r.image_settings.file_format='PNG'; r.use_persistent_data=True; r.use_overwrite=False; r.use_placeholder=True
os.makedirs(os.path.join(HERE,'render/frames'),exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE,'dbs_desk_feed.blend'))
if '--stills' in ARGS:
    ts=[float(x) for x in ARGS[ARGS.index('--stills')+1].split(',')]
    for t in ts:
        sc.frame_set(t2f(t)); r.filepath=os.path.join(HERE,f'render/still_{t:05.2f}.png'); bpy.ops.render.render(write_still=True)
if '--render' in ARGS:
    a,b=1,NF
    if '--frames' in ARGS: a,b=map(int,ARGS[ARGS.index('--frames')+1].split('-'))
    sc.frame_start,sc.frame_end=a,b; r.filepath=os.path.join(HERE,'render/frames/f_'); bpy.ops.render.render(animation=True)
print('OK')
