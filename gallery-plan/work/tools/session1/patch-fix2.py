for x, y in [
  ("new THREE.MeshStandardMaterial({ color: 0x2a3566, roughness: .9 }), 2.4);", "new THREE.MeshStandardMaterial({ color: 0x3d4f96, roughness: .9 }), 2.4);"),
  ("g.fillStyle = '#18234a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 7000, 2, ['#1f2c5a', '#121a3a', '#26346a'], .4, r);", "g.fillStyle = '#26377a'; g.fillRect(0, 0, w, h); speckle(g, w, h, 7000, 2, ['#2d3f88', '#1f2d66', '#33469a'], .4, r);"),
  ("const warm1 = new THREE.PointLight(0xffd7a0, 14, 14, 2);", "const warm1 = new THREE.PointLight(0xffd7a0, 45, 20, 2);"),
  ("const warm2 = new THREE.PointLight(0xffd7a0, 12, 14, 2);", "const warm2 = new THREE.PointLight(0xffd7a0, 40, 20, 2);"),
]:
    assert x in s, x[:50]; s = s.replace(x, y)
