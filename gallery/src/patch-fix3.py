for x, y in [
  ("const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = Math.atan2(nx, nz); scene.add(grp);",
   "const PS = 1.35;   // 책을 사람보다 크게: 그림책 속으로 들어온 느낌\n  const grp = new THREE.Group(); grp.position.set(x, 0, z); grp.rotation.y = Math.atan2(nx, nz); grp.scale.setScalar(PS); scene.add(grp);"),
  ("ex = Math.abs(c) * 1.7 + Math.abs(s) * 1.25, ez = Math.abs(s) * 1.7 + Math.abs(c) * 1.25;", "ex = (Math.abs(c) * 1.7 + Math.abs(s) * 1.25) * PS, ez = (Math.abs(s) * 1.7 + Math.abs(c) * 1.25) * PS;"),
  ("const ipStampSpot = { x: 15.0, z: 3.6 };", "stampMark('ip', 13.4, 3.4);"),
  ("focus: { pos: [14.6, 3.9], look: [17.4, .8, 1.2] }", "focus: { pos: [13.2, 4.4], look: [17.4, 1, 1.2] }"),
]:
    assert x in s, x[:50]; s = s.replace(x, y)
