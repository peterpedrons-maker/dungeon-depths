# A planta do capítulo 1 (Etapa 1 do novo level design): cada sala com o tamanho real, girada, ligada pela porta à próxima por corredores
# (retos, em L ou em U), em dois andares; os furos de luz e os desenhos das faces que eles formam no mapa.
import json, math, sys
from PIL import Image, ImageDraw, ImageFont

D = json.load(open(__import__("os").path.join(__import__("os").path.dirname(__file__), "salas.json")))

S = {int(k): v for k, v in D.items()}

DIRS = {'N': (0, -1), 'E': (1, 0), 'S': (0, 1), 'W': (-1, 0)}  # para onde a sala "anda" (da entrada para o fundo), no plano (X leste, Y sul)


def rot(d, lx, lz):
    # coordenada local da sala (x à direita de quem anda, z para trás: a entrada fica em +z) -> deslocamento no plano
    if d == 'N':
        return (lx, lz)
    if d == 'E':
        return (-lz, lx)
    if d == 'S':
        return (-lx, -lz)
    return (lz, -lx)


class Room:
    def __init__(self, i, d, ox, oy, exit_side='B', exit_off=0.0, ent_side='F', ent_off=0.0):
        self.i, self.d, self.ox, self.oy = i, d, ox, oy
        s = S[i]
        self.s = s
        self.exit_side, self.exit_off, self.ent_side, self.ent_off = exit_side, exit_off, ent_side, ent_off

    def P(self, lx, lz):
        dx, dy = rot(self.d, lx, lz)
        return (self.ox + dx, self.oy + dy)

    def rect(self):
        s = self.s
        pts = [self.P(s['x0'], s['z0']), self.P(s['x1'], s['z1'])]
        return (min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts))

    def door(self):
        # (ponto da porta no plano, direção de saída)
        s = self.s
        if self.exit_side == 'B':
            return self.P(self.exit_off, s['door']), rot(self.d, 0, -1)
        if self.exit_side == 'L':
            return self.P(s['x0'], self.exit_off), rot(self.d, -1, 0)
        return self.P(s['x1'], self.exit_off), rot(self.d, 1, 0)

    def entrance(self):
        s = self.s
        if self.ent_side == 'F':
            return self.P(self.ent_off, s['ent']), rot(self.d, 0, -1)  # (entra andando para a frente)
        if self.ent_side == 'L':
            return self.P(s['x0'], self.ent_off), rot(self.d, 1, 0)
        return self.P(s['x1'], self.ent_off), rot(self.d, -1, 0)


def after(prev, i, d, a=1.6, b=1.6, jog=0.0, **kw):
    # a próxima sala, com a entrada no fim do corredor: `a` metros saindo da porta, vira (se preciso) e `b` metros até a entrada;
    # `jog` = deslocamento para o lado (corredor em Z ou em U)
    (ex, ey), (dx, dy) = prev.door()
    tmp = Room(i, d, 0, 0, **kw)
    (nx, ny), (fx, fy) = tmp.entrance()  # (entrada com origem em 0)
    # o corredor: a ao longo da saída, depois jog na perpendicular da direção de chegada, depois b ao longo da chegada
    px, py = ex + dx * a, ey + dy * a
    if (dx, dy) == (fx, fy) or (dx, dy) == (-fx, -fy):
        perp = (-fy, fx)
        px, py = px + perp[0] * jog, py + perp[1] * jog
    else:
        px, py = px + fx * jog, py + fy * jog
    # ponto de entrada = depois de b metros andando na direção da sala
    if (dx, dy) == (fx, fy) or (dx, dy) == (-fx, -fy):
        Nx, Ny = px + fx * b, py + fy * b
    else:
        # em L: anda na direção da saída até alinhar e então vira
        Nx, Ny = px + fx * b, py + fy * b
    tmp.ox, tmp.oy = Nx - nx, Ny - ny
    return tmp


def corridor(a, b, ra=1.6, rb=1.6):
    (ex, ey), (dx, dy) = a.door()
    (nx, ny), (fx, fy) = b.entrance()
    p0 = (ex, ey)
    p1 = (ex + dx * ra, ey + dy * ra)
    q1 = (nx - fx * rb, ny - fy * rb)
    q0 = (nx, ny)
    pts = [p0, p1]
    if abs(p1[0] - q1[0]) > 1e-6 and abs(p1[1] - q1[1]) > 1e-6:
        # um cotovelo: segue a direção da saída e vira
        if dx != 0:
            pts.append((q1[0], p1[1]))
        else:
            pts.append((p1[0], q1[1]))
    pts += [q1, q0]
    return pts


def at(i, d, cx, cy, **kw):
    # a sala com o centro do retângulo em (cx, cy)
    r = Room(i, d, 0, 0, **kw)
    x0, y0, x1, y1 = r.rect()
    r.ox, r.oy = cx - (x0 + x1) / 2, cy - (y0 + y1) / 2
    return r


CORRIDOR = 3.2  # o corredor que a própria sala faz atrás da porta (src/scene/kit.ts)
RB = 2.0  # o corredor de ligação chega reto na entrada por estes metros (src/scene/connector.ts)


def route(a, b, ra=CORRIDOR, rb=RB):
    # o corredor da porta de `a` até a entrada de `b`: sai reto `ra` (o corredor da própria sala), chega reto `rb`; no meio, um ou dois
    # cotovelos. A MESMA regra de src/scene/connector.ts (`route`), para o desenho e o jogo baterem.
    (ex, ey), (dx, dy) = a.door()
    (nx, ny), (fx, fy) = b.entrance()
    p1 = (ex + dx * ra, ey + dy * ra)
    q1 = (nx - fx * rb, ny - fy * rb)
    eq = lambda u, v: abs(u - v) < 0.05
    pts = [(ex, ey), p1]
    if not eq(p1[0], q1[0]) and not eq(p1[1], q1[1]):
        along_x = dx != 0
        if along_x == (fx != 0):
            # saída e chegada na mesma linha: em Z (o meio na perpendicular); em sentidos opostos, em U (o meio no ponto mais longe)
            if along_x:
                mx = (p1[0] + q1[0]) / 2 if dx == fx else (max(p1[0], q1[0]) if dx > 0 else min(p1[0], q1[0]))
                pts += [(mx, p1[1]), (mx, q1[1])]
            else:
                my = (p1[1] + q1[1]) / 2 if dy == fy else (max(p1[1], q1[1]) if dy > 0 else min(p1[1], q1[1]))
                pts += [(p1[0], my), (q1[0], my)]
        else:
            pts.append((q1[0], p1[1]) if along_x else (p1[0], q1[1]))
    pts += [q1, (nx, ny)]
    out = []
    for p in pts:
        if out and eq(out[-1][0], p[0]) and eq(out[-1][1], p[1]):
            continue
        if len(out) >= 2:
            k, l = out[-2], out[-1]
            if (eq(k[0], l[0]) and eq(l[0], p[0])) or (eq(k[1], l[1]) and eq(l[1], p[1])):
                out.pop()
        out.append(p)
    return out
