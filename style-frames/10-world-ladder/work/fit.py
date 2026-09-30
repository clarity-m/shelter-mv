import numpy as np
from scipy.optimize import minimize
F, CY, CAMH = 1400, 780, 0.7
tx = np.array([0,120,240,360,480,600,720,840,960,1080,1200,1320,1440,1560,1680,1800,1920])
ty = np.array([738,718,703,698,700,706,700,682,648,610,584,602,650,700,742,770,792])
zs = np.linspace(2.5, 40, 900)
def H(p, x, z):
    h = 0*x
    for k in range(3):
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
def loss(p):
    r = ridge(p)
    e = np.mean((r-ty)**2)
    hc = H(p, np.array(1.51), np.array(9.6)); hh = H(p, np.array(-1.37), np.array(5.2)); ht = H(p, np.array(-4.1), np.array(9.2))
    e += 400*(hc-2.0)**2 + 400*(hh-0.48)**2 + 200*(ht-1.2)**2
    # clawd should stand at the local max
    g = (H(p, np.array(1.56), np.array(9.6)) - H(p, np.array(1.46), np.array(9.6)))**2 + (H(p, np.array(1.51), np.array(9.65)) - H(p, np.array(1.51), np.array(9.55)))**2
    e += 2e5*g
    return float(e)
p0 = np.array([1.75,1.5,10.0,2.9,2.6, 0.95,-4.3,9.4,2.6,2.4, 0.45,-0.9,8.0,7.5,3.6])
res = minimize(loss, p0, method='Nelder-Mead', options=dict(maxiter=6000, xatol=1e-4, fatol=1e-3))
p = res.x
print(res.fun)
print(np.round(p, 3).tolist())
print(np.round(ridge(p)).astype(int).tolist())
for name, (x, z) in dict(clawd=(1.51, 9.6), human=(-1.37, 5.2), tree=(-4.1, 9.2), near=(0, 3.6)).items():
    y = H(p, np.array(x), np.array(z)); print(name, round(float(y), 3), round(960 + F*x/z), round(float(CY - F*(y-CAMH)/z)))
