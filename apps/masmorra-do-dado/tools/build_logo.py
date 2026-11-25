# O LOGO «SENTENÇA» em pixel e o ÍCONE DO APP (INTERFACE.md §7).
# - letras desenhadas à mão numa grade de 11 linhas, hastes de 2 pixels; o Ç com a cedilha desenhada (os geradores erram a cedilha);
# - o último A é o glifo ACENDER de verdade: um ponto em cada vértice (o de cima é a brasa), ligados por três linhas, com a grossura das hastes;
#   nada de pontos dentro nem soltos;
# - ícone do app: a face do dado (pedra escura, moldura de ouro, as cantoneiras) com o triângulo ACENDER no meio e a brasa no ponto de cima.
# Gera src/ui/logo.ts (a grade do logo; a tela inicial desenha em pedra talhada) e public/icons/*.png.
# Rodar: python3 tools/build_logo.py
import os, zlib, struct

H = 11
L = {
    'S': [
        '.oooooo.',
        'oooooooo',
        'oo....oo',
        'oo......',
        'ooooooo.',
        '.ooooooo',
        '......oo',
        '......oo',
        'oo....oo',
        'oooooooo',
        '.oooooo.',
    ],
    'E': [
        'ooooooo',
        'ooooooo',
        'oo.....',
        'oo.....',
        'oooooo.',
        'oooooo.',
        'oo.....',
        'oo.....',
        'oo.....',
        'ooooooo',
        'ooooooo',
    ],
    'N': [
        'ooo...oo',
        'oooo..oo',
        'oooo..oo',
        'oo.oo.oo',
        'oo.oo.oo',
        'oo..oooo',
        'oo..oooo',
        'oo...ooo',
        'oo....oo',
        'oo....oo',
        'oo....oo',
    ],
    'T': [
        'oooooooo',
        'oooooooo',
        '...oo...',
        '...oo...',
        '...oo...',
        '...oo...',
        '...oo...',
        '...oo...',
        '...oo...',
        '...oo...',
        '...oo...',
    ],
    # o Ç: o C com a cedilha desenhada à mão (um gancho que sai do meio de baixo e volta para a esquerda)
    'Ç': [
        '..ooooo.',
        '.ooooooo',
        'oo....oo',
        'oo......',
        'oo......',
        'oo......',
        'oo......',
        'oo......',
        'oo....oo',
        '.ooooooo',
        '..ooooo.',
        '....oo..',
        '.....oo.',
        '..oooo..',
    ],
}


def triangle():
    # 13 x 11: três linhas de 2 pixels ligando os vértices; um ponto 3 x 3 em cada vértice (o de cima é a brasa 'r')
    W = 13
    g = [['.'] * W for _ in range(H)]

    def put(x, y, c='g'):
        if 0 <= x < W and 0 <= y < H and g[y][x] in '.g':
            g[y][x] = c

    for y in range(1, 10):
        t = (y - 1) / 8
        xl = round(6 - t * 5)
        xr = round(6 + t * 5)
        put(xl, y)
        put(xl + 1, y)
        put(xr, y)
        put(xr - 1, y)
    for x in range(1, 12):
        put(x, 9)
        put(x, 10)
    for dx in range(3):
        for dy in range(3):
            g[dy][5 + dx] = 'r'
            g[8 + dy][dx] = 'y'
            g[8 + dy][10 + dx] = 'y'
    return [''.join(r) for r in g]


def logo_grid(word='SENTENÇ'):
    rows = [''] * 14
    for i, ch in enumerate(word):
        gl = L[ch]
        w = len(gl[0])
        for y in range(14):
            rows[y] += (gl[y] if y < len(gl) else '.' * w) + ('..' if True else '')
    tri = triangle()
    for y in range(14):
        rows[y] += tri[y] if y < H else '.' * len(tri[0])
    return rows


def ts(rows):
    return (
        "// GERADO por tools/build_logo.py: o logo «SENTENÇA» em pixel (INTERFACE.md §7). 'o' = letra (pedra talhada), 'g' = traço do triângulo\n"
        "// ACENDER (ouro), 'y' = ponto de ouro nos vértices de baixo, 'r' = a brasa no vértice de cima.\n"
        "export const LOGO: readonly string[] = [\n" + ''.join(f"  '{r}',\n" for r in rows) + "];\n"
    )


# ── ícone do app: 32 x 32 ──
def app_icon():
    N = 32
    g = [['.'] * N for _ in range(N)]
    for y in range(N):
        for x in range(N):
            cx, cy = min(x, N - 1 - x), min(y, N - 1 - y)
            if cx + cy < 3:
                continue  # cantos redondos do dado
            d = min(cx, cy)
            g[y][x] = 'D' if d >= 3 else ('B' if d == 0 else ('G' if d == 2 else 'K'))
    # cantoneiras de ouro
    for (ox, oy) in ((3, 3), (25, 3), (3, 25), (25, 25)):
        for i in range(4):
            for j in range(4):
                if i + j < 6:
                    g[oy + j][ox + i] = 'G' if (i == 0 or j == 0) else g[oy + j][ox + i]
    # o triângulo ACENDER no meio (traço de 2, pontos de 3 nos vértices)
    tri = []
    T = 20
    for y in range(T):
        tri.append(['.'] * T)

    def put(x, y, c):
        if 0 <= x < T and 0 <= y < T:
            tri[y][x] = c

    for y in range(2, 17):
        t = (y - 2) / 14
        xl = round(9.5 - t * 8)
        xr = round(9.5 + t * 8)
        for k in (0, 1):
            put(xl + k, y, 'G')
            put(xr - k, y, 'G')
    for x in range(2, 18):
        put(x, 16, 'G')
        put(x, 17, 'G')
    for dx in range(4):
        for dy in range(4):
            put(8 + dx, 0 + dy, 'R')
            put(0 + dx, 15 + dy, 'Y')
            put(16 + dx, 15 + dy, 'Y')
    for y in range(T):
        for x in range(T):
            if tri[y][x] != '.':
                g[y + 6][x + 6] = tri[y][x]
    return g


COL = {
    'D': (29, 25, 34, 255),  # pedra escura (a face do dado)
    'K': (14, 11, 18, 255),
    'B': (5, 4, 10, 255),
    'G': (201, 163, 90, 255),  # ouro velho
    'Y': (255, 211, 107, 255),  # ouro
    'R': (255, 138, 58, 255),  # brasa
}


def png(w, h, pix):
    raw = b''.join(b'\x00' + b''.join(bytes(pix(x, y)) for x in range(w)) for y in range(h))

    def ch(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)

    return b'\x89PNG\r\n\x1a\n' + ch(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + ch(b'IDAT', zlib.compress(raw, 9)) + ch(b'IEND', b'')


def write_icon(path, size, scale, bg=(11, 9, 18, 255)):
    g = app_icon()
    n = len(g)
    off = (size - n * scale) // 2

    def pix(x, y):
        gx, gy = (x - off) // scale, (y - off) // scale
        if 0 <= gx < n and 0 <= gy < n and x >= off and y >= off and g[gy][gx] != '.':
            return COL[g[gy][gx]]
        return bg

    open(path, 'wb').write(png(size, size, pix))


here = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(here, '..')
rows = logo_grid()
open(os.path.join(root, 'src', 'ui', 'logo.ts'), 'w').write(ts(rows))
icons = os.path.join(root, 'public', 'icons')
write_icon(os.path.join(icons, 'icon-512.png'), 512, 16)
write_icon(os.path.join(icons, 'icon-192.png'), 192, 6)
write_icon(os.path.join(icons, 'apple-touch-icon.png'), 180, 5)
write_icon(os.path.join(icons, 'icon-maskable-512.png'), 512, 12)  # (cabe na área segura de 80%)
print('logo', len(rows[0]), 'x', len(rows))
