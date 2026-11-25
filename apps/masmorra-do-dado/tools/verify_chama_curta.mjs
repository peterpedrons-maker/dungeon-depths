// Verifica a proposta «A Chama Curta» refeita (sala 6, nível 4; ver PUZZLES_PROPOSTAS.md §5).
// Galeria comprida. As chamas se apagam sozinhas; o tamanho do braseiro diz quanto duram. A porta abre quando os QUATRO estão acesos ao
// mesmo tempo. Novidade: perto da porta, entre o braseiro MÉDIO e um braseiro MÍNIMO, o chão tem um desenho de labirinto talhado que é na
// verdade uma CANALETA longa (um pavio): acender o médio faz o fogo andar pelo labirinto e acender o mínimo de lá D segundos depois.
// Os dois mínimos (2,5 s) ficam um em cada ponta da galeria. A ideia: a mão não chega a tempo; o pavio "espera" por você.
// O que se prova (simulação de caminho, com espera livre entre as ações):
//  1) com o jogador ANDANDO (4,2 m/s, a velocidade do motor), chegando a 2 m de cada braseiro, há planos que funcionam, e TODOS
//     deixam o mínimo do fundo para o pavio;
//  2) acender os dois mínimos à mão é impossível mesmo CORRENDO (5,67 m/s, o Shift do PC) e arremessando de 5 m;
//  3) o hábito da sala antiga ("o que dura mais primeiro, tudo à mão") falha.
// Uso: node tools/verify_chama_curta.mjs
const B = {
  G: { nome: 'grande', s: 13, x: -3, dura: 25 },
  M: { nome: 'médio (pavio)', s: 26, x: 3, dura: 12 },
  P1: { nome: 'mínimo da entrada', s: 8, x: 3, dura: 2.5 },
  P2: { nome: 'mínimo do fundo', s: 27, x: -2, dura: 2.5 },
};
// Dois labirintos no chão. O de verdade leva fogo do médio ao mínimo do fundo (as setinhas talhadas apontam do médio para o mínimo). O outro,
// entre o grande e o mínimo do fundo, tem as setinhas AO CONTRÁRIO: o fogo só correria do mínimo para o grande, o que não ajuda em nada.
const PAVIOS = [{ de: 'M', para: 'P2', atraso: 6.5 }, { de: 'P2', para: 'G', atraso: 7 }];
const PAVIO = PAVIOS[0];
const INICIO = { s: 7.5, x: 0 }; // o jogador entra pelo portão da antecâmara
const ANDANDO = { v: 4.2, alcance: 2, acao: 0.8 };
const CORRENDO = { v: 4.2 * 1.35, alcance: 5, acao: 0.6 };

const dist = (a, b) => Math.hypot(a.s - b.s, a.x - b.x);
const perms = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
// um plano = ordem das ignições à mão. Entre ações o jogador pode ESPERAR. Busca em grade de espera (0,25 s).
// Sem pavio, esperar nunca ajuda (só afasta a primeira chama da última): nesses planos a espera é zero, que é o melhor caso.
function funciona(ordem, cfg) {
  const passos = 0.25, maxEspera = ordem.includes(PAVIO.para) ? 0 : 14;
  const viagem = ordem.map((k, i) => {
    const de = i === 0 ? INICIO : B[ordem[i - 1]];
    return Math.max(0, dist(de, B[k]) - cfg.alcance) / cfg.v + cfg.acao;
  });
  const n = ordem.length;
  const esperas = new Array(n).fill(0);
  const teste = () => {
    let t = 0;
    const acende = {};
    ordem.forEach((k, i) => {
      t += viagem[i] + esperas[i];
      acende[k] = t;
    });
    for (let ch = true; ch; ) {
      ch = false;
      for (const pv of PAVIOS) if (acende[pv.de] != null && (acende[pv.para] == null || acende[pv.para] > acende[pv.de] + pv.atraso)) {
        if (acende[pv.para] == null) { acende[pv.para] = acende[pv.de] + pv.atraso; ch = true; }
      }
    }
    if (Object.keys(acende).length < 4) return false;
    const ini = Math.max(...Object.values(acende));
    const fim = Math.min(...Object.entries(acende).map(([k, t0]) => t0 + B[k].dura));
    return ini < fim;
  };
  const rec = (i) => {
    if (i === n) return teste();
    for (let w = 0; w <= maxEspera; w += passos) {
      esperas[i] = w;
      if (rec(i + 1)) return true;
    }
    return false;
  };
  return rec(0);
}
const planos = [];
for (const usaPavio of [true, false]) {
  const mao = usaPavio ? ['G', 'M', 'P1'] : ['G', 'M', 'P1', 'P2'];
  for (const o of perms(mao)) planos.push({ o, usaPavio });
}
let ok = true;
const check = (c, m) => {
  console.log(`${c ? '✓' : '✗'} ${m}`);
  ok = ok && c;
};
const txt = (p) => p.o.map((k) => B[k].nome).join(' → ') + (p.usaPavio ? ' (o mínimo do fundo pelo pavio)' : ' (tudo à mão)');

const bonsAndando = planos.filter((p) => funciona(p.o, ANDANDO));
console.log('Planos que funcionam ANDANDO:');
bonsAndando.forEach((p) => console.log('   ' + txt(p)));
check(bonsAndando.length >= 1, `há ${bonsAndando.length} plano(s) que funcionam andando`);
check(bonsAndando.every((p) => p.usaPavio), 'todos eles deixam o mínimo do fundo para o pavio');
const maoCorrendo = planos.filter((p) => !p.usaPavio && funciona(p.o, CORRENDO));
check(maoCorrendo.length === 0, `acender os dois mínimos à mão: ${maoCorrendo.length} plano(s) funcionam, mesmo correndo e arremessando de ${CORRENDO.alcance} m`);
const habito = { o: ['G', 'M', 'P2', 'P1'], usaPavio: false }; // do que dura mais para o que dura menos, tudo à mão
check(!funciona(habito.o, CORRENDO), `o hábito da sala antiga (${txt(habito)}) falha`);
const t = (Math.max(0, dist(B.P1, B.P2) - CORRENDO.alcance) / CORRENDO.v + CORRENDO.acao).toFixed(1);
console.log(`   (de um mínimo ao outro, correndo e arremessando de longe: ${t} s; a chama mínima dura ${B.P1.dura} s)`);
// o labirinto falso: quem acha que ele leva fogo do grande ao mínimo do fundo (lendo as setinhas ao contrário) não resolve
check(PAVIOS[1].de === 'P2' && PAVIOS[1].para === 'G', 'o labirinto falso corre do mínimo para o grande (setinhas ao contrário): acender o grande não acende o mínimo do fundo');
console.log(ok ? '\nOK: a sala só se resolve usando o pavio certo.' : '\nFALHOU.');
process.exit(ok ? 0 : 1);
