for x, y in [
  ("ip: { pos: [11.4, -4.5], yaw: -Math.PI / 2 }", "ip: { pos: [14.4, -4.5], yaw: 0 }"),
]:
    assert x in s, x[:50]; s = s.replace(x, y)
