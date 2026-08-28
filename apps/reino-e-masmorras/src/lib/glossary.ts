export interface GlossaryEntry {
  id: string;
  title: string;
  aliases: string[];
  shortDescription: string;
  fullDescription: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  { id: 'atk', title: 'ATK', aliases: ['ATK'], shortDescription: 'Poder usado por ataques e habilidades físicas.', fullDescription: 'ATK é o poder de ataque físico. O dano bruto usa o ATK atual e o multiplicador da habilidade antes de defesa, crítico e outros modificadores.' },
  { id: 'matk', title: 'MATK', aliases: ['MATK'], shortDescription: 'Poder usado por habilidades mágicas.', fullDescription: 'MATK é o poder de ataque mágico. O dano bruto usa o MATK atual e o multiplicador da habilidade antes de defesa mágica, crítico e outros modificadores.' },
  { id: 'def', title: 'DEF', aliases: ['DEF'], shortDescription: 'Reduz dano físico recebido.', fullDescription: 'DEF é a defesa física. Ela reduz dano físico depois que o atacante calcula o dano bruto.' },
  { id: 'mdef', title: 'MDEF', aliases: ['MDEF'], shortDescription: 'Reduz dano mágico recebido.', fullDescription: 'MDEF é a defesa mágica. Ela reduz dano mágico depois que o atacante calcula o dano bruto.' },
  { id: 'hp', title: 'HP / Vida', aliases: ['HP', 'Vida', 'vida'], shortDescription: 'Vida atual do personagem.', fullDescription: 'Quando a Vida chega a zero, o personagem é derrotado, salvo por um efeito que evite a morte.' },
  { id: 'base-hp', title: 'Base de Cura', aliases: ['Base de Cura', 'Vida Base'], shortDescription: 'Base definida apenas pela classe e pelo nível.', fullDescription: 'A Base de Cura é o HP inicial da classe + 10 por nível após o primeiro. Não inclui VIT, equipamento, talentos ou bônus temporários.' },
  { id: 'max-hp', title: 'Vida Máxima', aliases: ['Vida Máxima', 'vida máxima'], shortDescription: 'Maior quantidade de Vida que pode ser mantida.', fullDescription: 'Vida Máxima inclui a Vida Base e os bônus permanentes aplicáveis. Reduções temporárias podem diminuir o limite efetivo durante o combate.' },
  { id: 'accuracy', title: 'Precisão', aliases: ['Precisão', 'precisão'], shortDescription: 'Aumenta a chance de acertar ataques.', fullDescription: 'Precisão é comparada à Evasão do alvo para determinar se um golpe direto acerta.' },
  { id: 'evasion', title: 'Evasão', aliases: ['Evasão', 'evasão'], shortDescription: 'Aumenta a chance de evitar golpes diretos.', fullDescription: 'Evasão pode fazer um ataque direto errar completamente. Não evita efeitos que não realizam uma rolagem de acerto.' },
  { id: 'crit', title: 'Crítico', aliases: ['Crítico', 'crítico'], shortDescription: 'Chance de um golpe causar dano crítico.', fullDescription: 'Um acerto crítico multiplica o dano direto pelo Dano Crítico atual.' },
  { id: 'crit-dmg', title: 'Dano Crítico', aliases: ['Dano Crítico', 'dano crítico'], shortDescription: 'Multiplicador aplicado quando ocorre um crítico.', fullDescription: 'Dano Crítico define quanto um acerto crítico aumenta o dano direto.' },
  { id: 'block', title: 'Bloqueio', aliases: ['Bloqueio', 'bloqueio'], shortDescription: 'Chance de reduzir um golpe direto pela metade.', fullDescription: 'Bloqueio tem teto de 60% e reduz em 50% o dano direto de um golpe bloqueado.' },
  { id: 'tenacity', title: 'Tenacidade', aliases: ['Tenacidade', 'tenacidade'], shortDescription: 'Chance de resistir a efeitos negativos.', fullDescription: 'Tenacidade pode impedir a aplicação de dano contínuo, penalidades, silêncio, sono e atordoamento. Não reduz o dano do golpe.' },
  { id: 'speed', title: 'Velocidade', aliases: ['Velocidade', 'velocidade'], shortDescription: 'Reduz o intervalo entre suas ações.', fullDescription: 'Velocidade faz o personagem agir com maior frequência, respeitando o teto global.' },
  { id: 'healing', title: 'Poder de Cura', aliases: ['Poder de Cura', 'poder de cura'], shortDescription: 'Aumenta curas explicitamente escaláveis.', fullDescription: 'Poder de Cura vem de SAB e de afixos compatíveis. Ele afeta apenas curas marcadas para usar este canal; não altera Roubo de Vida, poções, regeneração de Vida Máxima ou prevenções de morte.' },
  { id: 'barrier', title: 'Poder de Barreira', aliases: ['Poder de Barreira', 'poder de barreira'], shortDescription: 'Aumenta barreiras explicitamente escaláveis.', fullDescription: 'Poder de Barreira vem de SAB e de afixos compatíveis. A barreira é calculada após seus próprios escalamentos e respeita o teto da habilidade. Égide não é uma barreira e não usa este poder.' },
  { id: 'lifesteal', title: 'Roubo de Vida', aliases: ['Roubo de Vida', 'roubo de vida'], shortDescription: 'Recupera Vida a partir do dano direto causado.', fullDescription: 'Roubo de Vida recupera uma fração do dano direto efetivamente causado. Não é uma cura direta ativa.' },
  { id: 'cooldown', title: 'Recarga', aliases: ['Recarga', 'recarga'], shortDescription: 'Ciclos necessários para usar a habilidade novamente.', fullDescription: 'A Recarga começa quando a habilidade é usada e pode ser reduzida por efeitos de redução de recarga.' },
  { id: 'str', title: 'FOR', aliases: ['FOR'], shortDescription: 'Força.', fullDescription: 'FOR aumenta principalmente o poder físico.' },
  { id: 'dex', title: 'DES', aliases: ['DES'], shortDescription: 'Destreza.', fullDescription: 'DES aumenta principalmente Precisão e atributos ligados a ataques precisos.' },
  { id: 'agi', title: 'AGI', aliases: ['AGI'], shortDescription: 'Agilidade.', fullDescription: 'AGI aumenta principalmente Velocidade e Evasão.' },
  { id: 'vit', title: 'VIT', aliases: ['VIT'], shortDescription: 'Vitalidade.', fullDescription: 'VIT aumenta principalmente Vida Máxima e defesa física.' },
  { id: 'int', title: 'INT', aliases: ['INT'], shortDescription: 'Inteligência.', fullDescription: 'INT aumenta principalmente MATK. Não aumenta diretamente as curas do Clérigo.' },
  { id: 'wis', title: 'SAB', aliases: ['SAB'], shortDescription: 'Sabedoria.', fullDescription: 'SAB aumenta principalmente MDEF, Poder de Cura, Poder de Barreira e Tenacidade.' },
  { id: 'luk', title: 'SOR', aliases: ['SOR'], shortDescription: 'Sorte.', fullDescription: 'SOR aumenta principalmente Crítico e bônus de descoberta de itens.' },
];

export function getGlossaryEntry(id: string): GlossaryEntry | undefined {
  return GLOSSARY.find((entry) => entry.id === id);
}
