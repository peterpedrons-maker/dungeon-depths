#!/usr/bin/env python3
"""Recorta passos individuais (botas em concreto) de metal_steps.ogg -> public/audio/sfx/step_stone.mp3
Uso: python3 tools/cut_steps.py <metal_steps.ogg> <pasta sfx>   (usa os passos de som mais "seco" e grave)"""
import subprocess, re, sys, numpy as np
src, out = sys.argv[1], sys.argv[2]
sr = 44100
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-'], capture_output=True).stdout
a = np.frombuffer(raw, dtype=np.float32)
w = int(0.004 * sr)
e = np.array([np.abs(a[i:i + w]).max() for i in range(0, len(a) - w, w)])
thr = 0.25 * e.max()
ons = [i for i, v in enumerate(e) if v > thr and (i == 0 or e[max(0, i - 25):i].max() < 0.5 * thr)]
good = []
for k, o in enumerate(ons):
    s = max(0, o * w - int(0.01 * sr))
    nxt = ons[k + 1] * w if k + 1 < len(ons) else len(a)
    if (nxt - s) / sr < 0.28:
        continue
    core = a[s + int(0.01 * sr):s + int(0.13 * sr)]
    sp = np.abs(np.fft.rfft(core * np.hanning(len(core))))
    fr = np.fft.rfftfreq(len(core), 1 / sr)
    cen = (sp * fr).sum() / sp.sum()
    if 1600 < cen < 2200:  # secos e graves; descarta os "chiados"
        good.append(s / sr)
for n, t0 in enumerate(good[:1], 1):  # um só passo: o som do piso de pedra é sempre o mesmo
    tmp = f'/tmp/_step{n}.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', str(t0), '-t', '0.30', '-i', src, '-ac', '1', '-ar', '44100', '-af', 'afade=t=out:st=0.2:d=0.1,lowpass=f=7000', tmp])
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True)
    g = -4.0 - float(re.search(r'max_volume: (-?[\d.]+) dB', r.stderr).group(1))
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', f'volume={g}dB', '-ac', '1', '-b:a', '64k', f'{out}/step_stone.mp3'])
print('passo de pedra gerado')
