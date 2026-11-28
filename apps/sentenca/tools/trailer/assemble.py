# Monta o trailer: cada corte vira um trecho em 1080p/24 com fade, a faixa de cinema (as barras de 120 px que o jogo usa nas cenas) e a
# legenda na fonte do jogo; junta tudo e põe a trilha.
import json, subprocess, os, sys
T = os.environ.get('TRAILER_OUT', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', ''))
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'fonts', 'mdd-pixel.otf')
BAR = 120
os.makedirs(T + 'seg', exist_ok=True)
E = json.load(open(T + 'edl.json'))
lst = []
for k, e in enumerate(E):
  out = T + f"seg/{k:02d}_{e['name']}.mp4"
  n, d = e['frames'], e['dur']
  vf = ['fps=24', 'scale=1920:1080:flags=lanczos', 'setsar=1']
  if e['fi'] > 0: vf.append(f"fade=t=in:st=0:d={e['fi']}")
  if e['fo'] > 0: vf.append(f"fade=t=out:st={d - e['fo']:.3f}:d={e['fo']}")
  # (as cenas da abertura já têm as barras do próprio jogo, com a caixa de fala e os balões por cima: ali não se desenha nada)
  if e['file'] != 'intro.mp4':
    vf.append(f'drawbox=x=0:y=0:w=iw:h={BAR}:color=black:t=fill')
    vf.append(f'drawbox=x=0:y=ih-{BAR}:w=iw:h={BAR}:color=black:t=fill')
  if e['sub']:
    tf = T + f"seg/{k:02d}.txt"
    open(tf, 'w', encoding='utf-8').write(e['sub'])
    a0, a1 = 0.2, d - 0.15
    al = f"if(lt(t,{a0}),0,if(lt(t,{a0 + 0.25}),(t-{a0})/0.25,if(lt(t,{a1 - 0.25}),1,if(lt(t,{a1}),({a1}-t)/0.25,0))))"
    vf.append(f"drawtext=fontfile={FONT}:textfile={tf}:fontsize=44:fontcolor=0xE9E1CF:x=(w-tw)/2:y=h-{BAR}+({BAR}-th)/2:alpha='{al}'")
  if e['file']:
    cmd = ['ffmpeg', '-v', 'error', '-y', '-ss', str(e['in']), '-i', T + 'clips/' + e['file']]
  else:
    cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=1920x1080:r=24']
  cmd += ['-frames:v', str(n), '-vf', ','.join(vf), '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', '24', out]
  subprocess.run(cmd, check=True)
  lst.append(f"file '{out}'")
  print(k, e['name'], n)
open(T + 'seg/list.txt', 'w').write('\n'.join(lst) + '\n')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', T + 'seg/list.txt', '-c', 'copy', T + 'video.mp4'], check=True)
if os.path.exists(T + 'trilha.wav'):
  subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', T + 'video.mp4', '-i', T + 'trilha.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'volume=2.5dB,alimiter=limit=0.89:level=false', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', T + 'trailer.mp4'], check=True)
print('pronto')
