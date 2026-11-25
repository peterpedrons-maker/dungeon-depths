# Gera src/ui/icons.ts: os ícones da interface, PIXEL A PIXEL, em 16 x 16 (HUD) e 24 x 24 (menus) (INTERFACE.md §6).
# Regras (§6, "Formas proibidas" e "Revisão da 1ª folha"):
#   - os glifos são retos e geométricos (pontos e retas numa grade 3 x 3); os ÍCONES são figurativos e CURVOS. Nenhum ícone pode ser só retas
#     ligando pontos de uma grade 3 x 3: X, +, setas retas, =, duas barras verticais, losango, diagonal solta, V, T, Z, linha com ponto e pontos
#     soltos em grade são PALAVRAS. Setas só curvas; fechar é uma tampa de pedra descendo; voltar é um arco curvo para a esquerda.
#   - traço para ações e menus; pintado só para o que se coleta (gema, página). Mesma grossura de traço (1 pixel) em todos.
#   - cores: o ouro e o laranja da brasa, além da pedra.
# Rodar: python3 tools/build_icons.py   (também escreve uma folha de conferência em PNG se receber um caminho: python3 tools/build_icons.py folha.png)
import math, os, sys, zlib, struct

PAL = {
    'o': '#ffd36b',  # ouro
    'b': '#c9a35a',  # ouro velho (sombra do traço)
    'r': '#ff8a3a',  # brasa
    'l': '#b8b0a0',  # pedra clara
    's': '#6e6862',  # pedra
    'd': '#2a2628',  # pedra escura
}


class G:
    def __init__(self, n):
        self.n = n
        self.p = [['.'] * n for _ in range(n)]

    def set(self, x, y, c='o'):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.n and 0 <= y < self.n:
            self.p[y][x] = c

    def arc(self, cx, cy, rx, ry, a0, a1, c='o', step=None):
        # arco de elipse de a0 a a1 (graus; 0 = direita, 90 = baixo), um pixel de traço
        steps = step or int(max(rx, ry) * 12 + 24)
        last = None
        for i in range(steps + 1):
            a = math.radians(a0 + (a1 - a0) * i / steps)
            pt = (int(round(cx + math.cos(a) * rx)), int(round(cy + math.sin(a) * ry)))
            if pt != last:
                self.set(*pt, c)
                last = pt
        self.thin(c)

    def thin(self, c):
        # tira os "cotovelos" (pixel que só serve de canto entre dois vizinhos diagonais): traço de 1 pixel limpo
        for _ in range(2):
            for y in range(1, self.n - 1):
                for x in range(1, self.n - 1):
                    if self.p[y][x] != c:
                        continue
                    nb = lambda dx, dy: self.p[y + dy][x + dx] == c
                    for (ax, ay), (bx, by) in (((1, 0), (0, 1)), ((1, 0), (0, -1)), ((-1, 0), (0, 1)), ((-1, 0), (0, -1))):
                        if nb(ax, ay) and nb(bx, by) and not nb(-ax, -ay) and not nb(-bx, -by) and not nb(ax + bx, ay + by):
                            # mantém se for ponta de traço
                            cnt = sum(nb(dx, dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy)
                            if cnt == 2:
                                self.p[y][x] = '.'
                                break

    def line(self, x0, y0, x1, y1, c='o'):
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        e = dx + dy
        while True:
            self.set(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * e
            if e2 >= dy:
                e += dy
                x0 += sx
            if e2 <= dx:
                e += dx
                y0 += sy

    def dot(self, x, y, c='r', s=2):
        for i in range(s):
            for j in range(s):
                self.set(x + i, y + j, c)

    def fill(self, x, y, w, h, c):
        for j in range(h):
            for i in range(w):
                self.set(x + i, y + j, c)

    def draw(self, rows, ox=0, oy=0):
        for j, r in enumerate(rows):
            for i, ch in enumerate(r):
                if ch != '.':
                    self.set(ox + i, oy + j, ch)

    def rows(self):
        return [''.join(r) for r in self.p]


def hand(g, ox, oy, holding):
    # mão aberta de frente (três dedos, o polegar à esquerda), contorno curvo
    g.draw([
        '.....o.o.o.....',
        '....o.o.o.o....',
        '....o.o.o.o....',
        '....o.o.o.o....',
        '.oo.o.o.o.o....',
        'o..oo.....o....',
        'o..........o...',
        '.o.........o...',
        '..o........o...',
        '...o......o....',
        '....o....o.....',
        '.....oooo......',
    ], ox, oy)
    if holding:
        g.dot(ox + 6, oy + 7, 'r', 2)


def eye(g, cx, cy, w, h, pupil=2):
    # olho em AMÊNDOA: duas curvas (pálpebras) que se encontram nas pontas; íris redonda com a brasa no meio
    g.arc(cx, cy + h * 0.55, w, h * 1.25, 200, 340)
    g.arc(cx, cy - h * 0.55, w, h * 1.25, 20, 160)
    g.arc(cx, cy, pupil + 0.6, pupil + 0.6, 0, 360, 'b')
    g.dot(cx - (1 if pupil >= 2 else 0) + 0.5, cy - (1 if pupil >= 2 else 0) + 0.5, 'r', 2 if pupil >= 2 else 1)


ICONS16 = {}
ICONS24 = {}


def icon16(name):
    def deco(f):
        g = G(16)
        f(g)
        ICONS16[name] = g.rows()
        return f
    return deco


def icon24(name):
    def deco(f):
        g = G(24)
        f(g)
        ICONS24[name] = g.rows()
        return f
    return deco


# ── AÇÕES (16) ──
@icon16('agir')
def _(g):
    hand(g, 0, 2, False)
    g.arc(13, 3, 2, 2, 200, 340, 'r')  # um brilho curvo: "aqui dá para fazer algo"


@icon16('pegar')
def _(g):
    hand(g, 0, 2, True)  # mão com ponto (aprovado na revisão)


@icon16('abrir')
def _(g):
    # porta em ARCO entreaberta: o batente em arco, a folha virada para dentro, a fresta com luz
    g.arc(7.5, 6, 6, 5, 180, 360)
    g.line(1, 6, 1, 14)
    g.line(14, 6, 14, 14)
    g.draw(['....r.....', '....r.....'], 0, 0)
    g.p = [r[:] for r in g.p]
    for y in range(5, 14):
        g.set(4, y, 'r')
    g.line(6, 4, 6, 14, 'b')
    g.line(6, 4, 11, 6, 'b')
    g.line(11, 6, 11, 13, 'b')
    g.line(6, 14, 11, 13, 'b')
    g.set(9, 9, 'o')
    g.line(0, 15, 15, 15, 's')


@icon16('ler')
def _(g):
    eye(g, 7.5, 7.5, 7, 3.2)


@icon16('olhar')
def _(g):
    eye(g, 7.5, 7.5, 7, 3.2)
    g.arc(7.5, 7.5, 7.5, 6.5, 230, 310, 'b')  # o olhar "varrendo": um arco em cima


@icon16('arremessar')
def _(g):
    # arco com seta curva (aprovado): o dado sai de baixo, sobe e cai à direita
    g.arc(8, 10, 6, 7, 190, 355)
    g.set(13, 10)
    g.set(13, 11)
    g.draw(['o...o', '.o.o.', '..o..'], 11, 9)
    g.draw(['obb', 'bbb', 'bbs'], 0, 12)  # (dadinho pintado, SEM ponto: um quadrado com ponto no meio é o número UM)


@icon16('recolher')
def _(g):
    # o dado volta: arco que vem da direita e desce até a mão (ponta curva)
    g.arc(8, 11, 6, 7, 185, 350)
    g.draw(['..o..', '.o.o.', 'o...o'], 0, 9)
    g.draw(['obb', 'bbb', 'bbs'], 12, 12)


@icon16('posicionar')
def _(g):
    # o dado pequeno descendo numa CURVA até um chão ondulado
    g.draw(['.obb.', 'obbbb', 'bbbbs', '.bss.'], 0, 0)
    for x, y in ((5, 3), (7, 4), (8, 6), (9, 8), (10, 10)):
        g.set(x, y, 'o')
    g.dot(10, 11, 'r', 2)
    g.draw(['.oo....oo....oo.', 'o..oooo..oooo..o'], 0, 14)


@icon16('girar')
def _(g):
    # setas curvas em volta de um ponto (aprovado)
    g.arc(7.5, 7.5, 6, 6, 200, 330)
    g.arc(7.5, 7.5, 6, 6, 20, 150)
    g.draw(['o.o', '.oo', 'ooo'], 11, 2)
    g.draw(['ooo', 'oo.', 'o.o'], 2, 11)
    g.dot(7, 7, 'r', 2)


@icon16('desenhar')
def _(g):
    # um toco de giz inclinado deixando uma linha ONDULADA
    g.draw([
        '...........bb..',
        '..........b..b.',
        '.........b..b..',
        '........b..b...',
        '.......b..b....',
        '......l..b.....',
        '.....ll.b......',
        '.....lll.......',
    ], 1, 0)
    g.draw(['.oo.....', 'o..o..o.', '....oo..'], 0, 9)


@icon16('apagar')
def _(g):
    # uma mancha BORRADA (pontilhada) com o toco de giz deitado por cima
    g.draw([
        '....bbbbbbb....',
        '...b.......b...',
        '...b.......b...',
        '....bbbbbbb....',
    ], 0, 2)
    g.draw([
        '..l.l.l.l.l....',
        '.l.l.l.l.l.l.l.',
        'l.l.l.l.l.l.l..',
        '.l.l.l.l.l.l.l.',
        '...l.l.l.l.l...',
    ], 0, 8)


@icon16('limpar')
def _(g):
    g.draw([
        '...l.l.l.l.l...',
        '.l.l.l.l.l.l.l.',
        'l.l.l.l.l.l.l.l',
        '.l.l.l.l.l.l.l.',
        'l.l.l.l.l.l.l.l',
        '.l.l.l.l.l.l.l.',
        '...l.l.l.l.l...',
    ], 0, 6)
    g.draw(['bbbbbbb', 'b.....b', 'bbbbbbb'], 4, 1)


@icon16('trocar')
def _(g):
    # dois quadradinhos trocando de lugar, com setas curvas (só depois do capítulo 2)
    g.draw(['obbb', 'bbbb', 'bbbb', 'bbbs'], 0, 0)
    g.draw(['llll', 'llll', 'llll', 'llls'], 12, 12)
    g.arc(8, 8, 6, 6, 280, 350)
    g.arc(8, 8, 6, 6, 100, 170)
    g.draw(['o.o', '.o.'], 13, 7)
    g.draw(['.o.', 'o.o'], 0, 7)


@icon16('giz')
def _(g):
    g.draw([
        '........bb.',
        '.......b..b',
        '......b..b.',
        '.....b..b..',
        '....b..b...',
        '...l..b....',
        '..ll.b.....',
        '..lll......',
    ], 2, 3)


@icon16('dado')
def _(g):
    # o dado em PERSPECTIVA, sem pontos (pontos numa face são os NÚMEROS da língua): três faces, cantos redondos, um rebite de ouro
    g.draw([
        '.....oooooo.....',
        '...oo......oo...',
        '.oo..........oo.',
        'o..............o',
        'oo............oo',
        'o.oo........oo.o',
        'o...oo....oo...o',
        'o.....oooo.....o',
        'o.......o......o',
        'o.......o......o',
        'o.......o......o',
        'o.......o......o',
        '.o......o.....o.',
        '..oo....o...oo..',
        '....oo..o.oo....',
        '......ooooo.....',
    ], 0, 0)
    g.dot(7, 7, 'r', 2)


@icon16('toque')
def _(g):
    # um dedo tocando, com as ondas (arcos) do toque
    g.draw([
        '......oo......',
        '.....o..o.....',
        '.....o..o.....',
        '.....o..ooo...',
        '..oo.o..o..o..',
        '.o..oo.....o..',
        '.o.........o..',
        '..o.......o...',
        '...o.....o....',
        '....ooooo.....',
    ], 1, 6)
    g.arc(7.5, 6, 4, 3, 200, 340, 'r')


@icon16('fogo')
def _(g):
    # o glifo ACENDER (permitido: é o fogo, ensinado no 1º minuto): pontos nos vértices ligados por três linhas; o de cima é a brasa
    g.line(7, 2, 1, 13)
    g.line(8, 2, 14, 13)
    g.line(1, 13, 14, 13)
    g.dot(7, 1, 'r', 2)
    g.dot(0, 12, 'o', 2)
    g.dot(14, 12, 'o', 2)


# ── MENUS E ESTADO (16, HUD) ──
@icon16('pausa')
def _(g):
    # PAUSA = uma AMPULHETA de bulbos redondos (duas barras verticais seria a palavra ABRIR)
    g.line(2, 1, 13, 1, 'b')
    g.line(2, 14, 13, 14, 'b')
    g.arc(7.5, 2, 5, 5.5, 0, 180)
    g.arc(7.5, 13, 5, 5.5, 180, 360)
    g.draw(['rrrr', '.rr.'], 6, 5)
    g.draw(['.rr.', 'rrrr', 'rrrr'], 6, 10)
    g.set(7, 8, 'r')


@icon16('diario')
def _(g):
    # o livro, SÓ EM TRAÇO: capa de cantos redondos, a lombada curva, a presilha (brasa)
    g.draw([
        '..ooooooooooo..',
        '.o...........o.',
        '.o.b.........o.',
        '.o.b..bbbbb..o.',
        '.o.b.........o.',
        '.o.b.........o.',
        '.o.b.......rrrr',
        '.o.b.......rrrr',
        '.o.b.........o.',
        '.o.b.........o.',
        '.o.b.........o.',
        '.o..bbbbbbbbbo.',
        '.o...........o.',
        '..ooooooooooo..',
    ], 0, 1)


@icon16('gema')
def _(g):
    # pintada (é um objeto que se coleta)
    g.draw([
        '...oooooooooo...',
        '..oooooooobbbo..',
        '.ooroooooobbbbo.',
        'oorrooooobbbbbbo',
        'obbbbbbbbbbbbbbo',
        '.obbbbbbbbbbrbo.',
        '..obbbbbbbbrbo..',
        '...obbbbbbbbo...',
        '....obbbbbbo....',
        '.....obbbbo.....',
        '......obbo......',
        '.......oo.......',
    ], 0, 2)


@icon16('pagina')
def _(g):
    # página arrancada, pintada: papel (pedra clara), a borda rasgada à direita, linhas de escrita em ouro velho
    g.draw([
        'lllllllllll.....',
        'llllllllllll....',
        'llbbbbbbblll....',
        'lllllllllllll...',
        'llbbbbbbbbll....',
        'llllllllllll....',
        'llbbbbbbblllll..',
        'lllllllllllll...',
        'llbbbbbbbbbl....',
        'llllllllllll....',
        'llbbbbblllllll..',
        'llllllllllllll..',
        'lllllllllllll...',
        'llllllllllll....',
    ], 0, 1)


@icon16('tecla')
def _(g):
    # tecla de pedra em branco, só em traço (a letra vem por cima, na fonte do jogo)
    g.draw([
        '..oooooooooooo..',
        '.o............o.',
        'o..............o',
        'o..............o',
        'o..............o',
        'o..............o',
        'o..............o',
        'o..............o',
        'o..............o',
        'ob............bo',
        '.obbbbbbbbbbbbo.',
        '..oooooooooooo..',
    ], 0, 2)


# ── MENUS (24) ──
@icon24('pausa')
def _(g):
    g.line(4, 1, 19, 1, 'b')
    g.line(4, 22, 19, 22, 'b')
    g.arc(11.5, 2, 7, 8.5, 0, 180)
    g.arc(11.5, 21, 7, 8.5, 180, 360)
    g.draw(['rrrrrr', '.rrrr.', '..rr..'], 9, 6)
    g.set(11, 11, 'r')
    g.set(12, 13, 'r')
    g.draw(['..rr..', '.rrrr.', 'rrrrrr', 'rrrrrr'], 9, 17)


@icon24('config')
def _(g):
    # a engrenagem feita de PONTOS e ARCOS: um anel, oito dentes redondos (pontos) em volta, o eixo é a brasa
    g.arc(11.5, 11.5, 6, 6, 0, 360)
    for k in range(8):
        a = math.radians(k * 45 + 22.5)
        g.dot(11.5 + math.cos(a) * 9.2 - 0.5, 11.5 + math.sin(a) * 9.2 - 0.5, 'o', 2)
    g.arc(11.5, 11.5, 2.4, 2.4, 0, 360, 'b')
    g.dot(11, 11, 'r', 2)


@icon24('voltar')
def _(g):
    # voltar = um ARCO curvo para a esquerda, com a ponta
    g.arc(13, 13, 8, 7, 200, 450)
    g.draw(['..o', '.o.', 'ooo', '.o.', '..o'], 2, 6)
    g.set(5, 8)


@icon24('fechar')
def _(g):
    # fechar = uma TAMPA DE PEDRA descendo sobre a abertura (um nicho em arco), com o rastro curvo do movimento
    g.arc(11.5, 13, 8, 6, 180, 360, 'b')
    g.line(3, 13, 3, 22, 'b')
    g.line(20, 13, 20, 22, 'b')
    g.line(2, 22, 21, 22, 's')
    g.draw([
        '.oooooooooooooo.',
        'o..............o',
        'o..............o',
        '.oooooooooooooo.',
    ], 4, 9)
    g.arc(11.5, 6, 6, 3, 200, 340, 'r')
    g.arc(11.5, 4, 4, 2, 200, 340, 'r')


@icon24('confirmar')
def _(g):
    # confirmar: ✓ bem ASSIMÉTRICO, o braço esquerdo curto e curvo (um V simétrico seria PEGAR)
    g.arc(7, 12, 3, 4, 120, 250)
    g.arc(9, 6, 4, 11, 95, 150)
    g.line(9, 17, 13, 11)
    g.line(13, 11, 21, 3)
    g.set(8, 17)


@icon24('audio')
def _(g):
    # um SINO (os sinos da música), o badalo em brasa e as ondas curvas do som
    g.arc(10, 11, 6, 8, 180, 360)
    g.line(4, 11, 3, 16)
    g.line(16, 11, 17, 16)
    g.arc(10, 16, 7, 1.5, 0, 180)
    g.set(10, 2)
    g.dot(9, 18, 'r', 2)
    g.arc(10, 10, 11, 9, -40, 10, 'b')
    g.arc(10, 10, 13.5, 11, -35, 5, 'b')


@icon24('imagem')
def _(g):
    # uma janela em arco com o sol e um morro ondulado
    g.arc(11.5, 9, 9, 7, 180, 360)
    g.line(2, 9, 2, 21)
    g.line(21, 9, 21, 21)
    g.line(2, 21, 21, 21)
    g.arc(15, 8, 2.5, 2.5, 0, 360, 'r')
    g.arc(8, 21, 7, 5, 200, 340, 'b')
    g.arc(17, 21, 5, 3, 190, 350, 'b')


@icon24('controles')
def _(g):
    # um controle de mão, todo em curvas; um disco (direcional) e um botão redondo
    g.arc(11.5, 11, 9, 5, 180, 360)
    g.arc(5, 15, 3.5, 5, 90, 220)
    g.arc(18, 15, 3.5, 5, -40, 90)
    g.arc(11.5, 19, 4, 3, 200, 340)
    g.line(5, 20, 8, 17)
    g.line(18, 20, 15, 17)
    g.arc(7, 12, 2, 2, 0, 360, 'b')
    g.dot(15, 11, 'r', 2)


@icon24('acess')
def _(g):
    # uma pessoa de braços abertos (cabeça redonda, braços e pernas em curva)
    g.arc(11.5, 4, 2.5, 2.5, 0, 360)
    g.arc(11.5, 14, 9, 6, 200, 340)
    g.line(11, 8, 11, 15, 'o')
    g.line(12, 8, 12, 15, 'o')
    g.arc(8, 22, 3.5, 7, 280, 350)
    g.arc(15, 22, 3.5, 7, 190, 260)
    g.dot(11, 10, 'r', 2)


@icon24('idioma')
def _(g):
    # um balão de fala curvo, com uma linha de escrita ONDULADA (escrita de gente, não glifo) e o rabinho curvo
    g.arc(11.5, 10, 10, 7, 0, 360)
    g.arc(6, 20, 3, 4, 270, 360)
    g.line(6, 16, 3, 22)
    g.draw(['.oo...oo...oo.', 'o..o.o..o.o..o', '....o....o....'], 5, 9)


@icon24('diario')
def _(g):
    g.draw([
        '..oooooooooooooooooo..',
        '.o..................o.',
        '.o.b................o.',
        '.o.b................o.',
        '.o.b...bbbbbbbb.....o.',
        '.o.b................o.',
        '.o.b...bbbbbb.......o.',
        '.o.b................o.',
        '.o.b................o.',
        '.o.b...............rrrr',
        '.o.b...............rrrr',
        '.o.b...............rrrr',
        '.o.b................o.',
        '.o.b................o.',
        '.o.b................o.',
        '.o.b................o.',
        '.o..bbbbbbbbbbbbbbbbo.',
        '.o..................o.',
        '..oooooooooooooooooo..',
    ], 0, 2)


def png(w, h, pix):
    raw = b''.join(b'\x00' + b''.join(bytes(pix.get((x, y), (11, 9, 18, 255))) for x in range(w)) for y in range(h))

    def ch(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)

    return b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw, 9)) + ch(b'IEND', b'')


def rgb(c):
    c = c.lstrip('#')
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), 255)


def sheet(path):
    items = [(k, v) for k, v in ICONS16.items()] + [(k + '24', v) for k, v in ICONS24.items()]
    S = 6
    cell = 26 * S
    cols = 8
    rowsn = (len(items) + cols - 1) // cols
    pix = {}
    for i, (k, rows) in enumerate(items):
        ox = (i % cols) * cell + S
        oy = (i // cols) * cell + S
        n = len(rows)
        for y in range(n * S + 2 * S):
            for x in range(n * S + 2 * S):
                pix[(ox - S + x, oy - S + y)] = (29, 25, 34, 255)
        for y, r in enumerate(rows):
            for x, ch in enumerate(r):
                if ch == '.':
                    continue
                for j in range(S):
                    for q in range(S):
                        pix[(ox + x * S + q, oy + y * S + j)] = rgb(PAL[ch])
    open(path, 'wb').write(png(cols * cell, rowsn * cell, pix))


def ts():
    def block(d):
        out = []
        for k, rows in d.items():
            out.append(f"  {k}: [\n" + ''.join(f"    '{r}',\n" for r in rows) + "  ],\n")
        return ''.join(out)
    pal = ''.join(f"  {k}: '{v}',\n" for k, v in PAL.items())
    return (
        "// GERADO por tools/build_icons.py (não editar à mão): os ícones da interface, pixel a pixel (INTERFACE.md §6).\n"
        "// 16 x 16 para o HUD (avisos de ação, botões de toque), 24 x 24 para os menus. '.' = vazio; as letras são cores de ICON_PAL.\n"
        f"export const ICON_PAL: Record<string, string> = {{\n{pal}}};\n"
        f"export const ICONS16 = {{\n{block(ICONS16)}}} as const;\n"
        f"export const ICONS24 = {{\n{block(ICONS24)}}} as const;\n"
    )


here = os.path.dirname(os.path.abspath(__file__))
open(os.path.join(here, '..', 'src', 'ui', 'icons.ts'), 'w').write(ts())
if len(sys.argv) > 1:
    sheet(sys.argv[1])
print(len(ICONS16), 'ícones 16', len(ICONS24), 'ícones 24')
