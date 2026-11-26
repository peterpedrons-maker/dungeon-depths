# A PLANTA DO CAPÍTULO 1 (DESIGN.md §73; proposta da Etapa 1 do level design novo). Uso: python3 tools/planta/planta_cap1.py saida.png [faces]
# salas.json = a planta de cada sala hoje (window.__mdd.footprints(), no modo de desenvolvimento).
# A planta do capítulo 1, versão para o Pedro: térreo e subsolo, o caminho, os desvios, os atalhos e os furos (com e sem os desenhos das faces)
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from plan import Room, S, at, route
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
SHOW_FACES = len(sys.argv) > 2 and sys.argv[2] == 'faces'
R = {}
def put(r, fl='T'):
    r.fl = fl
    R[r.i] = r
    return r

# ── TÉRREO ──
put(at(1, 'N', 10, 106))
put(at(2, 'N', 10, 85, exit_side='R', exit_off=-11))
put(at(3, 'E', 27, 80.5, exit_side='L', exit_off=-7))
put(at(4, 'N', 29, 59))
put(at(5, 'E', 20, 26, ent_side='R', ent_off=-4))
put(at(6, 'E', 47, 17.5))
put(at(7, 'E', 75, 20, exit_side='R', exit_off=-24))
put(at(8, 'S', 96, 42))
put(at(9, 'S', 90, 78, exit_side='R', exit_off=-13))
put(at(10, 'W', 66, 70))
put(at(11, 'N', 50, 48))
put(at(12, 'S', 72, 40))
put(at(13, 'S', 76, 55.6), 'TS')
put(at(19, 'W', 43.5, 29.8, exit_side='L', exit_off=-3), 'TS')
put(at(21, 'S', 62, 110))
put(at(20, 'S', 68, 89, exit_side='B', exit_off=-4))
put(at(22, 'S', 74, 123.6, exit_side='R', exit_off=-2))
put(at(23, 'W', 49, 129.6, exit_side='R', exit_off=-9))
put(at(24, 'N', 46.1, 95))
# ── SUBSOLO ──
put(at(14, 'S', 76, 76.5), 'S')
put(at(15, 'W', 55, 95, ent_side='F'), 'S')
put(at(16, 'N', 33, 74), 'S')
put(at(17, 'N', 33, 56), 'S')
put(at(18, 'E', 48.5, 42.5), 'S')

# os furos (no plano) e a face de cada um
HOLES = {
    1: ((10.0, 104.0), 1),
    4: ((33.0, 67.0), 2), 3: ((22.2, 77.8), 2),
    5: ((24.0, 24.0), 3), 11: ((54.0, 54.0), 3), 9: ((84.0, 84.0), 3),
    20: ((74.0, 97.5), 4), 22: ((74.0, 122.5), 4), 23: ((49.0, 122.5), 4), 24: ((49.0, 97.5), 4),
}
# a passarela alta da Biblioteca (a Escadaria sai nela; ela leva, por uma ponte, ao Fogo que Corre)
WALK = [(44.7, 33.9), (44.7, 62.0)]
BRIDGE = [(44.7, 62.0), (44.7, 77.0), (68.0, 77.0), (68.0, 78.9)]
SHORTCUTS = [
    ([(39.8, 95.0), (27.0, 95.0), (27.0, 100.0), (13.9, 100.0)], 'atalho secreto: do Tribunal de volta ao Poço (abre no fim)'),
    ([(30.0, 66.0), (30.0, 70.8)], ''),
]
OPTIONAL = [
    ('T', (63.0, 2.0, 73.0, 10.0), (68.0, 10.0, 68.0, 14.6)),      # ao norte da Chama Curta
    ('S', (26.0, 92.0, 36.0, 101.0), (36.0, 96.5, 41.0, 96.5)),     # no subsolo, a oeste da Galeria
]
LINKS = [(1, 2), (2, 3), (3, 4), (4, 5), (5, 6), (6, 7), (7, 8), (8, 9), (9, 10), (10, 11), (11, 12), (12, 13), (13, 14), (14, 15), (15, 16), (16, 17), (17, 18), (18, 19), (20, 21), (21, 22), (22, 23), (23, 24)]

# ── checagens ──
rects = {i: r.rect() for i, r in R.items()}
def inter(a, b, m=0.2):
    return a[0] < b[2] - m and b[0] < a[2] - m and a[1] < b[3] - m and b[1] < a[3] - m
for fl in ('T', 'S'):
    ks = [i for i in R if fl in R[i].fl]
    for x in range(len(ks)):
        for y in range(x + 1, len(ks)):
            if inter(rects[ks[x]], rects[ks[y]]):
                print('SOBREPOSTAS', fl, ks[x], ks[y])
for i, ((hx, hy), f) in HOLES.items():
    x0, y0, x1, y1 = rects[i]
    m = min(hx - x0, x1 - hx, hy - y0, y1 - hy)
    if m < 1.5:
        print('furo perto da parede', i, round(m, 2))

# ── desenho ──
K = 7
PAD = 12
allr = list(rects.values())
X0 = min(v[0] for v in allr) - PAD
Y0 = min(v[1] for v in allr) - PAD
X1 = max(v[2] for v in allr) + PAD
Y1 = max(v[3] for v in allr) + PAD
PW, PH = int((X1 - X0) * K), int((Y1 - Y0) * K)
TOP = 70
TOP = 110
W, H = PW * 2 + 60, PH + TOP + 150
im = Image.new('RGB', (W, H), (232, 220, 190))
g = ImageDraw.Draw(im)
def font(sz):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/TTF/DejaVuSans.ttf']:
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
F, FB, FS = font(15), font(22), font(12)
INK = (52, 40, 28)
def T(panel, x, y):
    return (20 + panel * (PW + 20) + (x - X0) * K, TOP + (y - Y0) * K)
LEVEL = {'T': (247, 240, 222), 'U': (240, 230, 250), 'S': (222, 230, 238)}
for panel, (fl, title) in enumerate([('T', 'TÉRREO  (as salas 20 a 24 ficam 2,5 m acima)'), ('S', 'SUBSOLO  (8 m abaixo)')]):
    ox = 20 + panel * (PW + 20)
    g.rectangle([ox, TOP, ox + PW, TOP + PH], fill=(238, 228, 202), outline=(150, 130, 100), width=2)
    for x in range(int(X0) // 10 * 10, int(X1), 10):
        g.line([T(panel, x, Y0), T(panel, x, Y1)], fill=(226, 214, 186))
    for y in range(int(Y0) // 10 * 10, int(Y1), 10):
        g.line([T(panel, X0, y), T(panel, X1, y)], fill=(226, 214, 186))
    g.text((ox + 10, TOP - 34), title, fill=INK, font=FB)
    # os quartos do outro andar, apagados (para situar)
    for i, r in R.items():
        if fl in r.fl:
            continue
        x0, y0, x1, y1 = rects[i]
        g.rectangle([T(panel, x0, y0), T(panel, x1, y1)], outline=(205, 192, 165), width=1)
    # corredores
    for a, b in LINKS:
        if fl not in R[a].fl or fl not in R[b].fl:
            continue
        if (a, b) == (13, 14) and fl == 'T':
            continue
        pts = route(R[a], R[b])
        g.line([T(panel, *p) for p in pts], fill=(140, 100, 60), width=10)
        g.line([T(panel, *p) for p in pts], fill=(214, 190, 150), width=6)
    if fl == 'T':
        for seg in (BRIDGE,):
            g.line([T(panel, *p) for p in seg], fill=(110, 80, 150), width=8)
            g.line([T(panel, *p) for p in seg], fill=(200, 184, 226), width=4)
        for pts, label in SHORTCUTS[:1]:
            P = [T(panel, *p) for p in pts]
            for k in range(len(P) - 1):
                (ax, ay), (bx, by) = P[k], P[k + 1]
                n = int(math.hypot(bx - ax, by - ay) // 10)
                for j in range(0, n, 2):
                    g.line([(ax + (bx - ax) * j / n, ay + (by - ay) * j / n), (ax + (bx - ax) * (j + 1) / n, ay + (by - ay) * (j + 1) / n)], fill=(170, 40, 40), width=4)
    # salas
    for i, r in R.items():
        if fl not in r.fl:
            continue
        x0, y0, x1, y1 = rects[i]
        col = LEVEL['U'] if i >= 20 and fl == 'T' else LEVEL[fl]
        if i == 21:
            col = (226, 238, 214)
        g.rectangle([T(panel, x0, y0), T(panel, x1, y1)], fill=col, outline=INK, width=3)
        (dx, dy), _ = r.door()
        (nx, ny), _ = r.entrance()
        cx, cy = T(panel, (x0 + x1) / 2, (y0 + y1) / 2)
        name = S[i]['n']
        g.text((cx, cy - 10), str(i), fill=(150, 50, 30), font=FB, anchor='mm')
        words = name.split(' ')
        lines, cur = [], ''
        for w_ in words:
            if len(cur + ' ' + w_) > 14 and cur:
                lines.append(cur)
                cur = w_
            else:
                cur = (cur + ' ' + w_).strip()
        lines.append(cur)
        for k, ln in enumerate(lines[:3]):
            g.text((cx, cy + 12 + k * 15), ln, fill=INK, font=FS, anchor='mm')
        if not (i == 13 and fl == 'T') and not (i == 19 and fl == 'S'):
            g.ellipse([T(panel, dx - 1, dy - 1), T(panel, dx + 1, dy + 1)], fill=(210, 120, 40))
        if not (i == 13 and fl == 'S') and not (i == 19 and fl == 'T') and i != 1:
            g.ellipse([T(panel, nx - 1, ny - 1), T(panel, nx + 1, ny + 1)], fill=(60, 110, 190))
    # a passarela alta, por cima da Biblioteca (a Escadaria chega nela)
    if fl == 'T':
        (ex, ey), _ = R[19].door()
        for seg in ([(ex, ey), (44.7, 33.9)], WALK):
            g.line([T(panel, *p) for p in seg], fill=(110, 80, 150), width=8)
            g.line([T(panel, *p) for p in seg], fill=(200, 184, 226), width=4)
    # desvios opcionais (salas pequenas fora do caminho, para segredos futuros)
    for (dfl, (x0, y0, x1, y1), (cx0, cy0, cx1, cy1)) in OPTIONAL:
        if dfl != fl:
            continue
        a, b = T(panel, x0, y0), T(panel, x1, y1)
        g.rectangle([a, b], fill=(240, 232, 214), outline=(120, 100, 70), width=2)
        g.line([T(panel, cx0, cy0), T(panel, cx1, cy1)], fill=(150, 120, 80), width=4)
        g.text(((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), 'desvio', fill=(110, 90, 60), font=FS, anchor='mm')
    # furos
    if fl == 'T':
        for i, ((hx, hy), f) in HOLES.items():
            a, b = T(panel, hx - 1.3, hy - 1.3), T(panel, hx + 1.3, hy + 1.3)
            g.ellipse([a, b], fill=(255, 250, 225), outline=(150, 110, 30), width=3)
        if SHOW_FACES:
            groups = {}
            for i, ((hx, hy), f) in HOLES.items():
                groups.setdefault(f, []).append((hx, hy))
            for f, pts in groups.items():
                xs = [p[0] for p in pts]
                ys = [p[1] for p in pts]
                a, b = T(panel, min(xs) - 4, min(ys) - 4), T(panel, max(xs) + 4, max(ys) + 4)
                if len(pts) > 1:
                    P = [T(panel, *p) for p in sorted(pts)]
                    if f == 4:
                        P = [T(panel, *p) for p in [pts[0], pts[1], pts[2], pts[3], pts[0]]]
                    for k in range(len(P) - 1):
                        (ax, ay), (bx, by) = P[k], P[k + 1]
                        n = max(2, int(math.hypot(bx - ax, by - ay) // 8))
                        for j in range(0, n, 2):
                            g.line([(ax + (bx - ax) * j / n, ay + (by - ay) * j / n), (ax + (bx - ax) * (j + 1) / n, ay + (by - ay) * (j + 1) / n)], fill=(200, 140, 20), width=3)
                lx, ly_ = T(panel, min(xs), min(ys))
                g.text((lx - 8, ly_ - 34), f'face {f}', fill=(170, 100, 0), font=FB)
g.text((24, 18), 'Capítulo 1 · a planta nova (proposta da Etapa 1)' + ('  ·  com as faces marcadas' if SHOW_FACES else '  ·  como o jogador vê no caderno'), fill=INK, font=font(28))
# legenda
ly = TOP + PH + 24
items = [((240, 232, 214), 'desvio opcional'), ((60, 110, 190), 'entrada'), ((210, 120, 40), 'porta de saída'), ((214, 190, 150), 'corredor'), ((200, 184, 226), 'passarela e ponte altas'), ((170, 40, 40), 'atalho secreto (fechado)'), ((255, 250, 225), 'furo redondo de luz no teto')]
x = 30
for col, t in items:
    g.rectangle([x, ly, x + 22, ly + 16], fill=col, outline=INK)
    g.text((x + 30, ly), t, fill=INK, font=F)
    x += 70 + int(g.textlength(t, font=F))
g.text((30, ly + 34), 'O caminho segue os números. 13: o fosso desce do térreo ao subsolo. 19: a Escadaria sobe e sai na passarela alta da Biblioteca; dali uma ponte leva às salas 20 a 24, em volta do claustro (21).', fill=INK, font=F)
g.text((30, ly + 58), 'Cada furo fica no teto de uma sala, solto. Só no mapa, juntando as salas, eles formam as faces: 1 (o Poço), 2, 3 e 4. As faces 5 e 6 ficam para o capítulo 2.', fill=INK, font=F)
im.save(OUT)
print('ok', W, H)
