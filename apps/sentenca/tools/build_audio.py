#!/usr/bin/env python3
"""Monta os sons REAIS do jogo em public/audio (mp3 mono, leves).

Fontes (todas livres; ver public/audio/CREDITS.txt):
  - efeitos: OpenGameArt (CC0) — Kenney, rubberduck, qubodup, Fantozzi, LEGIT Audio, AntumDeluge, Tsorthan Grove, NenadSimic etc.
  - instrumentos: amostras de instrumentos reais do FluidR3_GM (CC BY 3.0), via midi-js-soundfonts.
Uso:  python3 tools/build_audio.py <pasta com os pacotes baixados> <pasta de saída> [nomes...]
(Os downloads estão descritos em fetch_audio.sh. Com nomes, refaz só esses arquivos de sfx, sem tocar nos instrumentos; `inst:<nome>` refaz
um instrumento e atualiza o manifesto. As notas do FluidR3_GM baixadas ficam em <pasta dos pacotes>/sf.)
"""
import os, re, subprocess, sys, json
import numpy as np

SRC = sys.argv[1]
OUT = sys.argv[2]
ONLY = set(sys.argv[3:])  # vazio = tudo
want = lambda n: not ONLY or n in ONLY
os.makedirs(OUT + '/sfx', exist_ok=True)
os.makedirs(OUT + '/inst', exist_ok=True)


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


def peak_db(path):
    r = run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'volumedetect', '-f', 'null', '-'])
    m = re.search(r'max_volume: (-?[\d.]+) dB', r.stderr)
    return float(m.group(1)) if m else 0.0


def make(src, dst, start=0.0, dur=None, rev=False, peak=-3.0, br='64k', trim_sil=True, fade=0.04, lp=None):
    filt = []
    if trim_sil:
        filt.append('silenceremove=start_periods=1:start_threshold=-48dB')
    if rev:
        filt.append('areverse')
        if trim_sil:
            filt.append('silenceremove=start_periods=1:start_threshold=-48dB')
    if lp:
        filt.append(f'lowpass=f={lp}')
    f1 = ','.join(filt) if filt else 'anull'
    tmp = dst + '.tmp.wav'
    args = ['ffmpeg', '-y', '-v', 'error', '-ss', str(start)]
    if dur:
        args += ['-t', str(dur)]
    args += ['-i', src, '-ac', '1', '-ar', '44100', '-af', f1, tmp]
    run(args)
    if not os.path.exists(tmp):
        print('FALHOU', src)
        return
    g = peak - peak_db(tmp)
    run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', f'volume={g}dB,afade=t=out:st=0:d=0.0001' if False else f'volume={g}dB', '-ac', '1', '-b:a', br, dst])
    os.remove(tmp)


def p(*a):
    return os.path.join(SRC, *a)

K = p('x', 'RPGsounds_Kenney', 'OGG')
C1 = p('x', '100-CC0-SFX_0')
C2 = p('x', 'sfx_100_v2')
MS = p('metal_steps.ogg')  # passos de bota em concreto (OpenGameArt, CC0)

SFX = {
    # passos por piso (um som fixo cada): pedra, degrau e entulho vêm da 2ª leva, mais abaixo
    'step_rug': (K + '/footstep05.ogg', {}),          # tapete: passo abafado
    'step_plate': (C2 + '/sfx100v2_footstep_wood_01.ogg', {}),  # placa: baque oco
    'step_water': (C2 + '/sfx100v2_footstep_wet_01.ogg', {}),   # poça: passo molhado
    'land': (K + '/dropLeather.ogg', {}),
    # dado
    'throw1': (C2 + '/sfx100v2_air_03.ogg', {}),
    'throw2': (K + '/knifeSlice.ogg', {'lp': 5000}),
    'recall': (C2 + '/sfx100v2_air_02.ogg', {'dur': 0.55, 'rev': True}),
    'catch': (K + '/handleSmallLeather.ogg', {}),
    'put1': (K + '/bookPlace1.ogg', {}),
    'put2': (K + '/bookPlace2.ogg', {}),
    'bounce1': (C2 + '/sfx100v2_stones_01.ogg', {}),
    'bounce2': (C2 + '/sfx100v2_stones_02.ogg', {}),
    'bounce3': (C2 + '/sfx100v2_stones_03.ogg', {}),
    'bounce4': (C2 + '/sfx100v2_hit_03.ogg', {}),
    'roll': (p('x', 'qubodup-bowling-roll', 'qubodup-bowling-roll', 'qubodup-bowling_roll-nofadeout.ogg'), {'trim_sil': False}),
    # interface / giz
    'locked': (C1 + '/wooden_01.ogg', {}),
    'swap1': (K + '/cloth1.ogg', {}),
    'swap2': (K + '/cloth3.ogg', {}),
    'sweep': (K + '/clothBelt.ogg', {}),
    # interface com som de coisa (DESIGN.md §86, pedido do Pedro: nada de celesta nos cliques): o caderno de verdade (abrir, fechar, virar
    # página) e o fecho de metal dele
    'book_open': (K + '/bookOpen.ogg', {}),
    'book_close': (K + '/bookClose.ogg', {}),
    'book_flip1': (K + '/bookFlip1.ogg', {}),
    'book_flip2': (K + '/bookFlip2.ogg', {}),
    'book_flip3': (K + '/bookFlip3.ogg', {}),
    'latch': (K + '/metalLatch.ogg', {}),
    'chalk1': (p('chalk_drawing_01.mp3'), {}),
    'chalk2': (p('chalk_drawing_02.mp3'), {}),
    'erase': (p('pencil_erase.ogg'), {}),
    # mundo
    'plate1': (C1 + '/slam_04.ogg', {}),
    'plate2': (C1 + '/switch_02.ogg', {}),
    'gem1': (C1 + '/bell_02.ogg', {}),
    'gem2': (C1 + '/glass_01.ogg', {}),
    'bell': (C1 + '/bell_03.ogg', {}),
    'gong': (C1 + '/gong_01.ogg', {}),
    'doorclose1': (C1 + '/slam_07.ogg', {}),
    'error': (C1 + '/wooden_03.ogg', {'lp': 1200}),
}
for name, (src, kw) in SFX.items():
    if want(name):
        make(src, f'{OUT}/sfx/{name}.mp3', **kw)


# ══ 2ª leva (DESIGN.md §60): passos, fogo, pedra e AMBIENTE ═══════════════════════════════════════════════════════════════
# Tudo continua nascendo de gravações reais; aqui só se recorta, filtra, sobrepõe, inverte e emenda (numpy + ffmpeg).
SR = 44100


def rd(src, ss=0.0, t=None, af=None):
    """lê um trecho como mono float32 (com uma cadeia de filtros do ffmpeg, se houver)"""
    a = ['ffmpeg', '-v', 'error', '-ss', str(ss)]
    if t:
        a += ['-t', str(t)]
    a += ['-i', src]
    if af:
        a += ['-af', af]
    a += ['-f', 'f32le', '-ac', '1', '-ar', str(SR), '-']
    x = np.frombuffer(subprocess.run(a, capture_output=True).stdout, dtype=np.float32).copy()
    if len(x) == 0:
        raise SystemExit(f'sem áudio: {src}')
    return x


def fade(x, fin=0.0, fout=0.0):
    x = x.copy()
    if fin > 0:
        n = min(len(x), int(fin * SR))
        x[:n] *= np.linspace(0, 1, n) ** 2
    if fout > 0:
        n = min(len(x), int(fout * SR))
        x[-n:] *= np.linspace(1, 0, n) ** 2
    return x


def db(v):
    return 10 ** (v / 20)


def nrm(x):
    """pico em 1 (para os ganhos de mix() serem relativos ao pico de cada parte)"""
    return x / (np.abs(x).max() + 1e-9)


def mix(*parts):
    """parts = (sinal, início em s, ganho em dB)"""
    n = max(int(at * SR) + len(x) for x, at, _ in parts)
    out = np.zeros(n, dtype=np.float32)
    for x, at, g in parts:
        i = int(at * SR)
        out[i:i + len(x)] += x * db(g)
    return out


def trim(x, thr_db=-50):
    """tira o silêncio do começo (para o som começar no ataque)"""
    i = int(np.argmax(np.abs(x) > db(thr_db) * np.abs(x).max()))
    return x[max(0, i - int(0.004 * SR)):]


def loop(x, L, X):
    """laço sem emenda de L s: os últimos X s cruzam com os primeiros (potência constante); precisa de len(x) >= L + X"""
    n, m = int(L * SR), int(X * SR)
    assert len(x) >= n + m, (len(x) / SR, L, X)
    out = x[:n].copy()
    k = np.linspace(0, 1, m)
    out[:m] = x[:m] * np.sin(k * np.pi / 2) + x[n:n + m] * np.cos(k * np.pi / 2)
    return out


def wr(x, name, peak=-3.0, br='64k'):
    if not want(name):
        return
    x = x / (np.abs(x).max() + 1e-9) * db(peak)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-ac', '1', '-b:a', br, f'{OUT}/sfx/{name}.mp3'],
                   input=x.astype(np.float32).tobytes())


FZ = p('x', 'Fantozzi-footsteps', 'Fantozzi-footsteps', 'flac')  # passos de sapato em pedra (Fantozzi via qubodup, CC0)
FS = p('x', 'fire_staff', 'LEGIT Audio_FIRE STAFF - FREE', 'Wavs')  # fogo de verdade (LEGIT Audio, CC0)
BF = p('x', 'sfx_breaking_and_falling')  # pedras caindo (rubberduck, CC0)
fst = lambda i: f'{FS}/LEGIT_FIR_Fire_Staff {i}-Audio.wav'


def concrete_step():
    """o 'corpo' de um passo de bota em concreto (metal_steps.ogg): o mesmo recorte que o passo de pedra antigo usava"""
    a = rd(MS)
    w = int(0.004 * SR)
    e = np.array([np.abs(a[i:i + w]).max() for i in range(0, len(a) - w, w)])
    thr = 0.25 * e.max()
    ons = [i for i, v in enumerate(e) if v > thr and (i == 0 or e[max(0, i - 25):i].max() < 0.5 * thr)]
    for k, o in enumerate(ons):
        s = max(0, o * w - int(0.01 * SR))
        nxt = ons[k + 1] * w if k + 1 < len(ons) else len(a)
        if (nxt - s) / SR < 0.28:
            continue
        core = a[s + int(0.01 * SR):s + int(0.13 * SR)]
        sp = np.abs(np.fft.rfft(core * np.hanning(len(core))))
        fr = np.fft.rfftfreq(len(core), 1 / SR)
        if 1600 < (sp * fr).sum() / sp.sum() < 2200:
            return rd(MS, s / SR, 0.3, 'lowpass=f=900')
    raise SystemExit('sem passo de concreto')


# ── passos: UM som fixo por piso, pé esquerdo e pé direito (sempre na mesma ordem; decisão do Pedro: sem sorteio) ──
STEP = 'highpass=f=70,lowpass=f=6000'
# (cada som só lê as gravações dele quando é pedido: refazer alguns arquivos não exige ter baixado todos os pacotes)
for foot, take in (('l', 'L2'), ('r', 'R2')):
    # pedra: sapato de couro em pedra (Fantozzi), sem o "toque-toque" de bota
    if want(f'step_stone_{foot}'):
        wr(fade(trim(rd(f'{FZ}/Fantozzi-Stone{take}.flac', af=STEP))[:int(0.34 * SR)], 0, 0.08), f'step_stone_{foot}', peak=-4)
if want('step_stair_l') or want('step_stair_r'):
    body = fade(trim(concrete_step()), 0, 0.1)
    for foot, take in (('l', 'L3'), ('r', 'R3')):
        # degrau (subindo ou descendo): o mesmo sapato, com o peso do corpo (o baque grave de um passo em concreto)
        x = trim(rd(f'{FZ}/Fantozzi-Stone{take}.flac', af=STEP))[:int(0.34 * SR)]
        wr(fade(mix((nrm(x), 0, -3), (nrm(body), 0.004, 0)), 0, 0.08), f'step_stair_{foot}', peak=-4)
for foot, take, peb in (('l', 'L1', 'bfh1_rock_falling_04'), ('r', 'R1', 'bfh1_rock_falling_07')):
    # entulho: o passo de pedra e pedrinhas soltas que rolam sob o sapato
    if not want(f'step_rubble_{foot}'):
        continue
    x = trim(rd(f'{FZ}/Fantozzi-Stone{take}.flac', af=STEP))[:int(0.34 * SR)]
    pe = trim(rd(f'{BF}/{peb}.ogg', af='highpass=f=400,lowpass=f=7000'))[:int(0.3 * SR)]
    wr(fade(mix((nrm(x), 0, 0), (nrm(pe), 0.025, -8)), 0, 0.08), f'step_rubble_{foot}', peak=-4)

# ── fogo ──
# acender: a chama pegando ("fff") com o corpo grave dela, de um bastão de fogo de verdade
if want('ignite'):
    wr(fade(trim(rd(fst(20), 0, 1.5, 'highpass=f=40')), 0.0, 0.5), 'ignite', peak=-2)
# tocha: a chama menor e mais curta
if want('ignite_small'):
    wr(fade(trim(rd(fst(11), 0, 1.1, 'highpass=f=60')), 0.0, 0.35), 'ignite_small', peak=-3)
# pano pegando fogo: a lufada e o estalar do tecido queimando
if want('ignite_cloth'):
    puff = trim(rd(fst(11), 0, 1.1, 'highpass=f=60'))
    crk = fade(rd(fst(21), 0.05, 2.4, 'highpass=f=150'), 0.15, 0.9)
    wr(mix((nrm(puff), 0, -1), (nrm(crk), 0.12, -3)), 'ignite_cloth', peak=-3)
# a chama que se apaga: a lufada AO CONTRÁRIO (o fogo é "sugado") e um chiado curto de brasa
if want('burnout'):
    suck = fade(rd(fst(11), 0, 0.7, 'highpass=f=80')[::-1].copy(), 0.25, 0.02)
    hiss = fade(rd(p('x', 'steam_hisses', 'steam hisses - Marker #3.wav'), 0.05, 0.7, 'highpass=f=1500,lowpass=f=7000'), 0.02, 0.5)
    wr(mix((nrm(suck), 0, 0), (nrm(hiss), len(suck) / SR - 0.03, -14)), 'burnout', peak=-3)
# o fogo aceso (laço): a chama de um bastão de fogo queimando parada, emendada sem estalo (~10 s)
if want('fire'):
    wr(loop(rd(fst(22), 0.3, 11.3, 'highpass=f=60,lowpass=f=7000'), 9.6, 1.4), 'fire', peak=-4, br='48k')
# os ESTALOS (o motor toca pedacinhos ao acaso perto do fogo, para o laço nunca se repetir igual): faíscas do bastão + estalos de lareira
if want('crackle'):
    a = rd(fst(21), 0.0, 2.6, 'highpass=f=900')
    b = rd(p('fire-1.wav'), 0, None, 'highpass=f=700')
    wr(np.concatenate([fade(a, 0.01, 0.05), fade(b / (np.abs(b).max() + 1e-9) * np.abs(a).max(), 0.01, 0.05)]), 'crackle', peak=-3, br='48k')

# ── pedra ──
# porta de pedra que SOBE: o arrasto grave, o raspar na pedra, o baque ao travar lá em cima e um pouco de pó e pedrinhas caindo
if want('door_open'):
    grind = rd(p('stone_door.ogg'), af='highpass=f=40')
    scr = rd(p('scrape-5.ogg'), af='lowpass=f=3000')
    clunk = trim(rd(C1 + '/slam_02.ogg', af='lowpass=f=1500'))
    dust = trim(rd(f'{BF}/bfh1_rock_falling_09.ogg', af='highpass=f=300'))
    wr(fade(mix((nrm(grind), 0, 0), (nrm(scr), 0.45, -10), (nrm(clunk), 1.32, -5), (nrm(dust), 1.42, -18)), 0, 0.3), 'door_open', peak=-3)
# porta de pedra que DESCE: o raspar acelerando e o baque pesado no chão
if want('door_shut'):
    scr = fade(rd(p('scrape-2.ogg'))[::-1].copy(), 0.3, 0.05)
    thud = trim(rd(p('boulder_drop.ogg')))
    dust = trim(rd(f'{BF}/bfh1_rock_falling_06.ogg', af='highpass=f=300'))
    t = len(scr) / SR - 0.06
    wr(fade(mix((nrm(scr), 0, -5), (nrm(thud), t, 0), (nrm(dust), t + 0.08, -18)), 0, 0.25), 'door_shut', peak=-3)
# pilar que sobe do chão (2,2 s): a pedra arrastando mais devagar e mais grave, pedrinhas soltando e o baque no fim
if want('rise'):
    grind = rd(p('stone_door.ogg'), af='asetrate=44100*0.8,aresample=44100,atempo=1.05,highpass=f=35')
    mv = rd(p('move_boulder.ogg'), af='asetrate=44100*0.85,aresample=44100')
    peb = trim(rd(f'{BF}/bfh1_rock_falling_01.ogg', af='highpass=f=250'))
    thud = trim(rd(p('boulder_drop.ogg'), af='lowpass=f=800'))
    wr(fade(mix((nrm(grind), 0, 0), (nrm(grind), 0.8, -4), (nrm(mv), 0.25, -8), (nrm(peb), 0.7, -18), (nrm(thud), 2.05, -4)), 0.05, 0.3), 'rise', peak=-3)

# ── ambiente ──
# vento: um trecho calmo da tempestade Arwen (gravada de uma janela), sem o ronco do microfone, emendado em laço de 16 s
if want('wind'):
    wr(loop(rd(p('storm_arwen_2022.flac'), 28, 18.5, 'highpass=f=110,lowpass=f=6500'), 16, 2.2), 'wind', peak=-3, br='48k')
# rajada: um pedaço forte da mesma tempestade, que cresce e passa
if want('gust'):
    wr(fade(rd(p('storm_arwen_2022.flac'), 51.5, 4.5, 'highpass=f=150,lowpass=f=7000'), 1.4, 1.8), 'gust', peak=-3, br='48k')
# gotas (seis): pingos caindo numa poça de um porão; o zumbido do porão sai no filtro. Ficam em 0, 0,6, 1,2 ... 3,0 s do arquivo
# (as três primeiras são as de antes; as outras três vieram em DESIGN.md §79, para as gotas expostas no silêncio da música não se repetirem.
# Na revisão do §79 as três novas foram trocadas: as primeiras escolhidas, em 2,66, 9,52 e 15,58 s, eram estalos secos com o brilho em 4 a
# 5 kHz, não gotas; estas três têm o "plim" das antigas, com o corpo entre 1 e 3 kHz)
if want('drip'):
    drops = [fade(rd(p('atmosbasement.flac'), t, 0.55, 'highpass=f=900,lowpass=f=9000'), 0.004, 0.25) for t in (1.505, 6.795, 19.025, 8.43, 5.545, 2.285)]
    # (as três de antes ficam como eram; as novas, que no porão são bem mais fortes, descem até o "corpo" médio delas, sem passar do pico)
    rms = lambda d: float(np.sqrt(np.mean(d ** 2))) + 1e-9
    ref_pk = max(float(np.abs(d).max()) for d in drops[:3])
    ref_rms = float(np.mean([rms(d) for d in drops[:3]]))
    drops = drops[:3] + [d * min(ref_rms / rms(d), ref_pk / float(np.abs(d).max())) for d in drops[3:]]
    wr(mix(*[(d, 0.6 * i, 0) for i, d in enumerate(drops)]), 'drip', peak=-3)
# a Casa respira (1): um tambor de tronco ao longe, abafado (NenadSimic)
if want('boom'):
    wr(fade(rd(p('distant_log_drum.wav'), 0, 4.6, 'lowpass=f=500'), 0, 1.2), 'boom', peak=-3, br='48k')
# a Casa respira (2): pedra rangendo, longe (um bloco arrastado num tijolo, uma oitava abaixo)
if want('creak'):
    wr(fade(rd(p('scrape-1.ogg'), af='asetrate=44100*0.5,aresample=44100,lowpass=f=1200,highpass=f=50'), 0.3, 0.8), 'creak', peak=-3, br='48k')
# a Casa respira (3, DESIGN.md §79): pedrinhas e pó caindo em outra sala, a Casa assentando (três quedas de pedra do rubberduck, em cascata)
if want('settle'):
    a = trim(rd(f'{BF}/bfh1_rock_falling_01.ogg', af='highpass=f=200,lowpass=f=5000'))
    b = trim(rd(f'{BF}/bfh1_rock_falling_03.ogg', af='highpass=f=200,lowpass=f=5000'))
    c = trim(rd(f'{BF}/bfh1_rock_falling_09.ogg', af='highpass=f=200,lowpass=f=4000'))
    wr(fade(mix((nrm(a), 0, 0), (nrm(b), 0.38, -5), (nrm(c), 0.9, -9)), 0, 0.3), 'settle', peak=-3, br='48k')


# ══ 4ª leva: A PONTE DE FRASES (sala 14, DESIGN.md §94) ════════════════════════════════════════════════════════════════════
# A ponte é UMA peça: cada laje que sobe trava nas outras com um grampo de ferro; a Casa a pesa (os grampos mordem e a pedra range) e, se há
# mentira acesa, os grampos estalam e tudo cai no fosso. Só pedra, ferro e mecanismo (o Pedro: nada de "mágico" nos efeitos, §79 e §86), e só
# dos pacotes que o jogo já baixa: rubberduck (100 CC0 SFX, 100 CC0 SFX #2, 75 breaking/falling/hit), o trinco da Kenney, os arrastos de
# AntumDeluge, a porta de pedra de bonebrah e o pedregulho de themightyglider. Recortes, altura (asetrate), filtros, envelope e emendas.
def rate(r, extra=''):
    """muda a altura junto com a duração (como uma fita mais lenta), e uma cadeia de filtros depois"""
    return f'asetrate={SR}*{r},aresample={SR}' + (',' + extra if extra else '')


def tremolo(x, f, depth, ph=0.0):
    """a pedra trepidando: o volume pulsa a f Hz (depth 0..1); é só processamento de uma gravação"""
    t = np.arange(len(x)) / SR
    return (x * (1 - depth * 0.5 * (1 + np.sin(2 * np.pi * f * t + ph)))).astype(np.float32)


def cut(x, L, fo):
    """corta em L s e some nos últimos fo s"""
    return fade(x[:int(L * SR)], 0, fo)


# a laje chega em cima e TRAVA (~0,5 s; toca quando ela termina de subir): a pedra assenta (o baque da porta de pedra travando, mais grave,
# porque a laje é enorme, com o peso do pedregulho por baixo) e, um instante depois, o grampo de ferro fecha (o trinco uma quinta abaixo, com
# o corpo de um ferro batido); um grão de pedrisco
if want('bridge_lock'):
    seat = fade(trim(rd(C1 + '/slam_02.ogg', af=rate(0.85, 'lowpass=f=1500,highpass=f=40'))), 0, 0.15)
    weight = fade(trim(rd(p('boulder_drop.ogg'), af='lowpass=f=700'))[:int(0.16 * SR)], 0, 0.08)
    clamp = fade(trim(rd(K + '/metalLatch.ogg', af=rate(0.62, 'lowpass=f=6000'))), 0, 0.06)
    iron = fade(trim(rd(C1 + '/metal_03.ogg', af=rate(0.85, 'lowpass=f=3500,highpass=f=90'))), 0, 0.08)
    grit = fade(trim(rd(f'{BF}/bfh1_rock_falling_06.ogg', af='highpass=f=500,lowpass=f=6000')), 0, 0.1)
    wr(cut(mix((nrm(seat), 0, 0), (nrm(weight), 0, -7), (nrm(clamp), 0.11, -5), (nrm(iron), 0.11, -9), (nrm(grit), 0.03, -24)), 0.55, 0.12),
       'bridge_lock', peak=-3)
# a Casa PESA a ponte (~0,8 s; o tremor de 0,7 s em que ela prende o pé): os grampos mordem (dois ferros quase juntos e a catraca apertando),
# a pedra range nas juntas (o bloco arrastado no tijolo, quase uma oitava abaixo, como o 'creak') sobre o peso do arrasto da porta, e tudo
# trepida a 9,7 Hz, o tremor da imagem (sin(t·61) em chapter1c.ts). A tensão sobe até ~0,45 s e alivia: serve se a ponte cede e se aguenta
if want('bridge_hold'):
    bite = fade(trim(rd(f'{BF}/bfh1_metal_hit_04.ogg', af=rate(0.72, 'lowpass=f=4000,highpass=f=60'))), 0, 0.1)
    bite2 = fade(trim(rd(C1 + '/metal_03.ogg', af=rate(0.7, 'lowpass=f=3000,highpass=f=60'))), 0, 0.1)
    groan = rd(p('scrape-1.ogg'), 0.1, 0.9, rate(0.55, 'highpass=f=70,lowpass=f=1400'))
    groan = tremolo(groan * np.interp(np.arange(len(groan)) / SR, [0, 0.05, 0.45, 0.8, 9], [0, 0.6, 1, 0.25, 0.25]), 9.7, 0.55)
    mass = rd(p('stone_door.ogg'), 0.15, 1.0, rate(0.75, 'lowpass=f=500,highpass=f=35'))
    mass = fade(tremolo(mass, 9.7, 0.35, 1.3), 0.06, 0.3)
    ratchet = rd(C2 + '/sfx100v2_lock_open_01.ogg', af=rate(0.6, 'highpass=f=300,lowpass=f=5000'))
    dust = fade(trim(rd(f'{BF}/bfh1_rock_falling_04.ogg', af='highpass=f=600')), 0, 0.1)
    wr(cut(mix((nrm(bite), 0, 0), (nrm(bite2), 0.025, -4), (nrm(groan), 0.03, -6), (nrm(mass), 0.02, -7), (nrm(ratchet), 0.1, -16),
               (nrm(dust), 0.34, -22)), 0.85, 0.25), 'bridge_hold', peak=-3)
# a ponte CEDE (~1,7 s): os grampos estalam e soltam em cascata (cada um, o corpo de um ferro batido com o estalo agudo por cima, cada vez mais
# fraco), a pedra raspa na parede do fosso acelerando, as lajes batem lá embaixo aos 0,44 s (2,5 m a 6 m/s, como em chapter1c.ts) e racham,
# mais duas batem logo depois, e o entulho e um grampo solto assentam no fundo (já no escuro: o som conta o que a imagem não mostra)
if want('bridge_break'):
    def snap(body, br, crack, cr, g):
        b = fade(trim(rd(body, af=rate(br, 'lowpass=f=3500,highpass=f=60'))), 0, 0.1)
        c = fade(trim(rd(crack, af=rate(cr, 'highpass=f=400,lowpass=f=8000'))), 0, 0.06)
        return mix((nrm(b), 0, 0), (nrm(c), 0, g))
    s1 = snap(C1 + '/metal_03.ogg', 0.6, f'{BF}/bfh1_metal_hit_03.ogg', 0.7, -3)
    s2 = snap(f'{BF}/bfh1_metal_hit_04.ogg', 0.62, C1 + '/metal_11.ogg', 0.6, -6)
    s3 = snap(C1 + '/metal_01.ogg', 0.7, f'{BF}/bfh1_metal_hit_01.ogg', 0.6, -6)
    s4 = snap(f'{BF}/bfh1_metal_hit_05.ogg', 0.7, C1 + '/metal_02.ogg', 0.65, -8)
    slide = rd(p('scrape-2.ogg'), 0.2, 0.44, 'lowpass=f=3000,highpass=f=60')
    slide = slide * np.linspace(0.12, 1, len(slide)) ** 1.6  # (a laje cai cada vez mais depressa)
    crash = fade(trim(rd(p('boulder_drop.ogg'))), 0, 0.3)
    deep = fade(trim(rd(f'{BF}/bfh1_hit_02.ogg', af='lowpass=f=1500')), 0, 0.2)
    crack = fade(trim(rd(f'{BF}/bfh1_rock_breaking_02.ogg', af='highpass=f=200,lowpass=f=7000')), 0, 0.2)
    hit2 = fade(trim(rd(C1 + '/slam_02.ogg', af=rate(0.8, 'lowpass=f=1800'))), 0, 0.12)
    hit3 = fade(trim(rd(p('boulder_drop.ogg'), af=rate(1.15, 'lowpass=f=2000'))), 0, 0.2)
    rub1 = fade(trim(rd(f'{BF}/bfh1_rock_falling_01.ogg', af='highpass=f=200,lowpass=f=5000')), 0, 0.2)
    rub2 = fade(trim(rd(f'{BF}/bfh1_rock_falling_03.ogg', af='highpass=f=200,lowpass=f=4500')), 0, 0.2)
    pin = fade(trim(rd(f'{BF}/bfh1_metal_falling_02.ogg', af=rate(0.85, 'highpass=f=300,lowpass=f=6000'))), 0, 0.15)
    T = 0.44
    wr(cut(mix((nrm(s1), 0, 0), (nrm(s2), 0.06, -3), (nrm(s3), 0.13, -6), (nrm(s4), 0.19, -9),
               (nrm(slide), 0.02, -8),
               (nrm(crash), T, 0), (nrm(deep), T + 0.005, -3), (nrm(crack), T + 0.02, -10),
               (nrm(hit2), T + 0.12, -6), (nrm(hit3), T + 0.24, -10),
               (nrm(rub1), T + 0.2, -14), (nrm(rub2), T + 0.5, -17), (nrm(pin), T + 0.42, -17)), 1.7, 0.4), 'bridge_break', peak=-3)

# instrumentos reais: uma nota a cada 3 semitons, tocada com playbackRate pra cobrir o resto
NOTE = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
def name(m):
    return f'{NOTE[m % 12]}{m // 12 - 1}'
INST = {
    'cello': (36, 60),          # C2..C4  graves longos
    'string_ensemble_1': (48, 72),
    'choir_aahs': (48, 72),
    'orchestral_harp': (48, 84),
    'celesta': (72, 96),
    'glockenspiel': (72, 96),
    'flute': (60, 84),
    'timpani': (36, 48),
    'tubular_bells': (60, 84),
    # a música da tela inicial (DESIGN.md §79): o contrabaixo, o coro "oohs" (mais macio que o "aahs") e a garrafa soprada (o ar na boca do poço)
    'contrabass': (24, 48),     # C1..C3
    'voice_oohs': (48, 72),
    'blown_bottle': (60, 75),   # só as poucas notas que a peça usa
}
# com nomes: só os sfx pedidos; `inst:<nome>` refaz um instrumento (o manifesto é atualizado, os outros ficam como estão)
ONLY_INST = {n[5:] for n in ONLY if n.startswith('inst:')}
if ONLY and not ONLY_INST:
    sys.exit(0)  # só alguns arquivos de sfx: os instrumentos ficam como estão
manifest = {}
if ONLY_INST and os.path.exists(f'{OUT}/inst/manifest.json'):
    manifest = json.load(open(f'{OUT}/inst/manifest.json'))
base = 'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM'
os.makedirs(os.path.join(SRC, 'sf'), exist_ok=True)  # as notas baixadas ficam junto dos outros downloads
for inst, (lo, hi) in INST.items():
    if ONLY_INST and inst not in ONLY_INST:
        continue
    notes = list(range(lo, hi + 1, 3))
    manifest[inst] = notes
    os.makedirs(f'{OUT}/inst/{inst}', exist_ok=True)
    for m in notes:
        raw = os.path.join(SRC, 'sf', f'sf_{inst}_{m}.mp3')
        if not os.path.exists(raw):
            r = run(['curl', '-s', '-m', '60', '-o', raw, '-w', '%{http_code}', f'{base}/{inst}-mp3/{name(m)}.mp3'])
            if r.stdout.strip() != '200':
                print('sem nota', inst, name(m), r.stdout)
                continue
        make(raw, f'{OUT}/inst/{inst}/{m}.mp3', peak=-4.0, br='56k', trim_sil=False)
json.dump(manifest, open(f'{OUT}/inst/manifest.json', 'w'))
print('ok')
