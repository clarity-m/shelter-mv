import numpy as np
F, CY, CAMH = 1400, 780, 0.7
HILL = [
  [1.45, 1.6, 10.0, 3.2, 2.8],
  [0.72, -3.9, 9.2, 3.0, 2.6],
  [0.78, -0.9, 8.6, 7.8, 4.0],
]
def H(x, z):
    h = 0*x
    for a, cx, cz, sx, sz in HILL:
        h = h + a*np.exp(-(((x-cx)/sx)**2 + ((z-cz)/sz)**2))
    return h
for name, (x, z) in dict(clawd=(1.51, 9.6), human=(-1.37, 5.2), tree=(-4.24, 9.0), saddle=(-1.0, 9.6), near=(0, 3.6)).items():
    y = H(x, z); sy = CY - F*(y-CAMH)/z; sx = 960 + F*x/z
    print(f"{name:7s} H={y:.2f} screen=({sx:.0f},{sy:.0f})")
# crest max
xs, zs = np.meshgrid(np.linspace(-8, 8, 321), np.linspace(3, 20, 341))
h = H(xs, zs); i = np.unravel_index(h.argmax(), h.shape)
print("max", h.max().round(2), "at", xs[i].round(2), zs[i].round(2))
# screen ridge: for each column, min screen y over terrain samples
cols = {}
for px in range(0, 1921, 120):
    best = 2000
    for z in np.linspace(2.5, 40, 1500):
        x = (px-960)*z/F
        y = H(x, z); sy = CY - F*(y-CAMH)/z
        best = min(best, sy)
    cols[px] = round(best)
print(cols)
