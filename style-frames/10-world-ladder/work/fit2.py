import numpy as np
from scipy.optimize import minimize
F, CY, CAMH = 1400, 780, 0.7
tx = np.array([0,120,240,360,480,600,720,840,960,1080,1200,1320,1440,1560,1680,1800,1920])
ty = np.array([738,718,703,698,700,706,700,682,648,610,584,602,652,712,760,776,780])
zs = np.linspace(2.5, 60, 1200)
K = 4
def H(p, x, z):
    h = 0*x
    for k in range(K):
        a, cx, cz, sx, sz = p[5*k:5*k+5]
        h = h + a*np.exp(-(((x-cx)/sx)**2 + ((z-cz)/sz)**2))
    return h
def ridge(p):
    out = []
    for px in tx:
        x = (px-960)*zs/F
        sy = CY - F*(H(p, x, zs)-CAMH)/zs
        out.append(sy.min())
    return np.array(out)
floor_pts = [(2.3, 3.4), (3.2, 4.2), (3.6, 5.5), (4.6, 7.0), (5.8, 9.0), (7, 12), (8.5, 16)]
def loss(p):
    if np.any(p[3::5] < 0.6) or np.any(p[4::5] < 0.6): return 1e9
    r = ridge(p)
    e = np.mean((r-ty)**2)
    hc = H(p, np.array(1.51), np.array(9.6)); hh = H(p, np.array(-1.37), np.array(5.2)); ht = H(p, np.array(-4.1), np.array(9.2))
    e += 400*(hc-2.0)**2 + 400*(hh-0.48)**2 + 200*(ht-1.2)**2
    for (x, z) in floor_pts:
        e += 3000*max(H(p, np.array(x), np.array(z)) - 0.03, 0)**2
    g = (H(p, np.array(1.56), np.array(9.6)) - H(p, np.array(1.46), np.array(9.6)))**2 + (H(p, np.array(1.51), np.array(9.65)) - H(p, np.array(1.51), np.array(9.55)))**2
    e += 2e5*g
    return float(e)
p0 = np.array([1.618,1.621,12.597,1.657,4.959, 0.935,-5.269,10.239,4.032,1.825, 1.138,0.37,7.926,6.181,3.047, 0.3,-3,6,3,2])
best = None
for seed in range(4):
    rng = np.random.default_rng(seed)
    x0 = p0 * (1 + (rng.random(p0.size)-0.5)*0.1) if seed else p0
    res = minimize(loss, x0, method='Nelder-Mead', options=dict(maxiter=12000, xatol=1e-4, fatol=1e-3, adaptive=True))
    if best is None or res.fun < best.fun: best = res
p = best.x
print(best.fun)
print(np.round(p, 3).reshape(K, 5).tolist())
print(np.round(ridge(p)).astype(int).tolist())
for name, (x, z) in dict(clawd=(1.51, 9.6), human=(-1.37, 5.2), tree=(-4.1, 9.2)).items():
    y = H(p, np.array(x), np.array(z)); print(name, round(float(y), 3))
for (x, z) in floor_pts: print((x, z), round(float(H(p, np.array(x), np.array(z))), 3))
