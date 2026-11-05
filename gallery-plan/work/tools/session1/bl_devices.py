import bpy
prefs = bpy.context.preferences.addons['cycles'].preferences
for kind in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI', 'METAL'):
    try:
        prefs.compute_device_type = kind
        prefs.get_devices()
        devs = [(d.name, d.type) for d in prefs.devices if d.type != 'CPU']
        if devs:
            print(kind, devs)
    except Exception as e:
        pass
print('CPU threads', bpy.context.scene.render.threads)
