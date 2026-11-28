# A MONTAGEM do trailer: [nome, arquivo (ou None = preto), entrada (s), saída (s), fade de entrada (s), fade de saída (s), legenda]
# Os tempos da abertura (intro.mp4) são o tempo do jogo na gravação em 1080p; as quatro primeiras falas vêm de intro_nt.mp4 (a mesma
# abertura sem a tira de pensamento: a fala vira legenda), alinhada pelo começo da 1ª fala. Durações em quadros inteiros (24 por segundo),
# para a trilha cair no corte. Gera edl.json com o começo de cada corte no trailer.
import json, os
T = os.environ.get('TRAILER_OUT', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', ''))
I = 'intro.mp4'
OFF = 65 / 24  # os tempos abaixo foram medidos na passada em baixa, que começou 65 quadros depois
def first_dlg(f):
  for r in json.load(open(T + f)):
    if r.get('dlg'): return r['f'] / 24
NT = first_dlg('intro_nt.json') - first_dlg('intro.json')  # quanto a gravação sem pensamentos está adiantada/atrasada
EDL = [
  ['preto0', None, 0, 1.6, 0, 0, None],
  ['poco', 'poco.mp4', 0.3, 6.5, 1.4, 0.35, None],          # do chão, o olhar sobe até a luz do poço
  ['acorda', 'nt', 2.0, 4.6, 0.35, 0.25, 'Caí? Ou me jogaram?'],
  ['luz', 'nt', 9.6, 12.2, 0.2, 0.25, 'Luz, lá em cima. Alto demais.'],
  ['porta', 'nt', 16.3, 18.3, 0.15, 0.2, 'Trancada.'],
  ['alguem', 'nt', 21.0, 23.6, 0.2, 0.4, '...Tem alguém aí?'],
  ['escrivao', I, 30.0, 35.2, 0.5, 0.0, None],              # lá fora: o Escrivão chega ao poço e se debruça
  ['viver', I, 36.6, 40.6, 0.0, 0.2, None],                 # de baixo: VOCÊ VIVER ?
  ['dar', I, 42.2, 45.2, 0.2, 0.2, None],                   # EU DAR DADO
  ['ler', I, 46.6, 48.5, 0.2, 0.0, None],                   # VOCÊ LER
  ['mao', I, 48.6, 53.2, 0.0, 0.0, None],                   # a mão com o dado; ele solta
  ['cai', I, 53.2, 57.55, 0.0, 0.0, None],                  # a câmera embaixo do dado caindo; o baque
  ['preto1', None, 0, 0.7, 0, 0, None],
  ['chao', I, 70.0, 74.0, 0.4, 0.25, None],                 # o dado no chão, de olhos abertos, falando em glifos
  ['rosto', I, 84.2, 88.6, 0.25, 0.25, None],               # o rosto do dado, grande, explicando
  ['fogo1', 'brasa.mp4', 0.4, 3.9, 0.15, 0.0, None],        # o 1º fogo, de perto: o dado cai no braseiro e a chama sobe
  ['m_fogo', 'fogo.mp4', 1.0, 3.6, 0.0, 0.0, None],         # montagem: o fogo corre pelas canaletas
  ['m_balanca', 'balanca.mp4', 0.3, 3.3, 0.0, 0.0, None],   # a corda queima, o peso cai no prato
  ['m_vento', 'vento.mp4', 1.2, 4.2, 0.0, 0.0, None],       # as fagulhas no vento queimam o estandarte do boato
  ['m_sobe', 'ponte_sobe.mp4', 0.6, 3.6, 0.0, 0.0, None],   # a frase acende em ouro e a laje sobe
  ['m_cai', 'ponte_cai.mp4', 0.3, 2.5, 0.0, 0.0, None],     # a ponte de quem veio antes desaba no fosso
  ['preto2', None, 0, 1.0, 0, 0, None],
  ['titulo', 'titulo.mp4', 0.0, 9.6, 0.0, 0.0, None],
]
fr = 0
out = []
for name, f, a, b, fi, fo, sub in EDL:
  if f == I: a, b = a + OFF, b + OFF
  if f == 'nt': f, a, b = 'intro_nt.mp4', a + OFF + NT, b + OFF + NT
  n = round((b - a) * 24)
  out.append({'name': name, 'file': f, 'in': round(a, 4), 'frames': n, 'fi': fi, 'fo': fo, 'sub': sub, 'start': round(fr / 24, 4), 'dur': round(n / 24, 4)})
  fr += n
json.dump(out, open(T + 'edl.json', 'w'), indent=1, ensure_ascii=False)
for o in out: print(f"{o['start']:6.2f}  {o['dur']:5.2f}  {o['name']:10s} {o['file'] or '-':16s} {o['in']:.2f}")
print('total', round(fr / 24, 2), 's,', fr, 'quadros; NT', round(NT, 3))
