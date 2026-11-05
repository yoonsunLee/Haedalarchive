import bpy, sys, collections
argv=sys.argv[sys.argv.index("--")+1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=argv[0])
area=collections.Counter()
for o in bpy.context.scene.objects:
    if o.type!='MESH': continue
    s=sum(p.area for p in o.data.polygons)*max(o.scale)**2
    for m in o.data.materials:
        if m: area[m.name]+=s
for name,a in area.most_common(25):
    m=bpy.data.materials[name]; b=m.node_tree.nodes.get("Principled BSDF")
    img=None; col=None
    if b:
        bc=b.inputs["Base Color"]
        col=tuple(round(v,3) for v in bc.default_value[:3])
        if bc.is_linked:
            n=bc.links[0].from_node
            if n.type=='TEX_IMAGE' and n.image:
                px=list(n.image.pixels[:]); k=len(px)//4
                img=(n.image.name, tuple(round(sum(px[i::4][:k])/k,3) for i in range(3)))
        cc=b.inputs.get("Coat Weight"); cw=cc.default_value if cc else None
    print("MAT",name,int(a),col,img,"coat",cw)
