import numpy as np
F, CY, CAMH = 1400, 780, 0.7
HILL = [[1.618,1.621,12.597,1.657,4.959],[0.935,-5.269,10.239,4.032,1.825],[1.138,0.370,7.926,6.181,3.047],[-0.62,4.6,5.2,2.6,3.2]]
def H(x, z):
    h = 0*x
    for a, cx, cz, sx, sz in HILL:
        h = h + a*np.exp(-(((x-cx)/sx)**2 + ((z-cz)/sz)**2))
    return 0.5*(h + np.sqrt(h*h + 0.004))
zs = np.linspace(2.5, 60, 700)
r = []
for px in range(0, 1921, 120):
    x = (px-960)*zs/F
    r.append(int((CY - F*(H(x, zs)-CAMH)/zs).min()))
print(r)
for name, (x, z) in dict(clawd=(1.51, 9.6), human=(-1.37, 5.2), tree=(-4.1, 9.2)).items():
    print(name, round(float(H(np.array(x), np.array(z))), 3))
# bottom-right terrain heights along the lower frame
for sx, sy in [(1300,1000),(1500,1000),(1700,1000),(1850,1000),(1500,880),(1700,880),(1850,850),(1650,820)]:
    z = CAMH*F/(sy-CY); x = (sx-960)*z/F
    print((sx, sy), round(float(H(np.array(x), np.array(z))), 3))
