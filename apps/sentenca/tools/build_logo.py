# O LOGO «SENTENÇA» em pixel e o ÍCONE DO APP (INTERFACE.md §7).
# - letras desenhadas à mão numa grade de 11 linhas, hastes de 2 pixels; o Ç com a cedilha desenhada (os geradores erram a cedilha);
# - o último A é o glifo ACENDER de verdade: um ponto em cada vértice (o de cima é a brasa), ligados por três linhas, com a grossura das hastes;
#   nada de pontos dentro nem soltos;
# (o ÍCONE DO APP não sai mais daqui: agora é o dado 2D da tela de carregamento, tools/build_app_icon.mjs, DESIGN.md §90)
# Gera src/ui/logo.ts (a grade do logo; a tela inicial desenha em pedra talhada).
# Rodar: python3 tools/build_logo.py
import os

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


here = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(here, '..')
rows = logo_grid()
open(os.path.join(root, 'src', 'ui', 'logo.ts'), 'w').write(ts(rows))
print('logo', len(rows[0]), 'x', len(rows))
