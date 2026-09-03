// Druida — O Ciclo Vivo. Toda a matemática e transições puras do redesign
// vivem aqui; DungeonPanel/combatEngine só orquestram chamadas a essas
// funções. Nada de estado React ou de CombatState é lido/escrito diretamente
// neste arquivo.

export type DruidSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type DruidForm = 'none' | 'stag' | 'wolf' | 'bear' | 'owl';
export type DruidGardenStage = 'seed' | 'sprout' | 'fruit';
export type DruidPath = 'rebirth' | 'metamorphosis' | 'balance';

export interface DruidGardenUnit { id: number; stage: DruidGardenStage; age: number; }

export const DRUID_SEASONS: readonly DruidSeason[] = ['spring', 'summer', 'autumn', 'winter'];
export const DRUID_SEASON_LABELS: Record<DruidSeason, string> = { spring: 'Primavera', summer: 'Verão', autumn: 'Outono', winter: 'Inverno' };
export const DRUID_SEASON_SHORT_LABELS: Record<DruidSeason, string> = { spring: 'PRI', summer: 'VER', autumn: 'OUT', winter: 'INV' };
export const DRUID_FORM_BY_SEASON: Record<DruidSeason, DruidForm> = { spring: 'stag', summer: 'wolf', autumn: 'bear', winter: 'owl' };
export const DRUID_FORM_LABELS: Record<DruidForm, string> = { none: 'Nenhuma', stag: 'Cervo', wolf: 'Lobo', bear: 'Urso', owl: 'Coruja' };

export const DRUID_GARDEN_MAX_BASE = 2;
export const DRUID_GARDEN_MAX_UPGRADED = 3;
export const DRUID_INSTINCT_MAX = 3;
export const DRUID_DISSONANCE_MAX = 3;
export const DRUID_AVATAR_ACTIONS = 3;
export const DRUID_AVATAR_ACTIONS_RENEWED = 4;
export const DRUID_FRUIT_RESERVE_HP_THRESHOLD = 0.35;
export const DRUID_COPA_ANCESTRAL_ACTIONS = 4;
export const DRUID_COPA_ANCESTRAL_HEAL_BONUS_PCT = 0.25;

// ── Estações ──
export function nextDruidSeason(season: DruidSeason): DruidSeason {
  const idx = DRUID_SEASONS.indexOf(season);
  return DRUID_SEASONS[(idx + 1) % DRUID_SEASONS.length];
}
export function isDruidSeasonAligned(abilitySeason: string | undefined, currentSeason: DruidSeason): boolean {
  return abilitySeason === currentSeason;
}
export function isDruidCycleAbility(abilitySeason: string | undefined): boolean {
  return abilitySeason === 'cycle';
}
// Uma ação é "descompassada" quando NÃO é sazonalmente alinhada nem cycle —
// ataque básico (sem druidSeason) ou uma habilidade sazonal fora de sua
// própria Estação. Habilidades cycle são neutras.
export function isDruidActionMisaligned(abilitySeason: string | undefined, currentSeason: DruidSeason): boolean {
  if (abilitySeason === undefined) return true; // ataque básico
  if (abilitySeason === 'cycle') return false;
  return abilitySeason !== currentSeason;
}

// ── Seletor sazonal (usado por pickAbility, sem alterar outras classes) ──
// Passagem 1: primeira habilidade 'cycle' elegível, na ordem de prioridade
// do jogador. Toda habilidade cycle (Árvore Ancestral, Avatar Primordial,
// Eterno Retorno) já é presa a um recurso raro e caro (Renovo/Instinto/
// Descompasso) — sem essa passagem dedicada, ela nunca vence o empate contra
// uma habilidade sazonal "sempre disponível" da Estação atual quando esta
// aparece antes na lista de prioridade, o que a torna praticamente
// inutilizável mesmo com o recurso no máximo.
// Passagem 2: primeira habilidade cuja druidSeason bata com a Estação atual.
// Passagem 3: se nenhuma bater, primeira elegível na ordem tradicional.
export function pickDruidSeasonalAbility<T extends { effect?: { druidSeason?: string } }>(
  eligibleInPriorityOrder: T[],
  currentSeason: DruidSeason,
): T | null {
  const cycle = eligibleInPriorityOrder.find((ability) => ability.effect?.druidSeason === 'cycle');
  if (cycle) return cycle;
  const aligned = eligibleInPriorityOrder.find((ability) => ability.effect?.druidSeason === currentSeason);
  return aligned ?? eligibleInPriorityOrder[0] ?? null;
}

// ── Despertar Sazonal ──
// Quando uma nova Estação começa, toda habilidade EQUIPADA cuja druidSeason
// bata exatamente com a nova Estação tem seu cooldown zerado. Habilidades
// 'cycle' nunca são afetadas.
export function druidAbilityIdsToAwaken(
  equippedAbilities: readonly { id: string; effect?: { druidSeason?: string } }[],
  newSeason: DruidSeason,
): string[] {
  return equippedAbilities.filter((ability) => ability.effect?.druidSeason === newSeason).map((ability) => ability.id);
}

// ── Ano / Sintonias / Renovo ──
export interface DruidYearLedger { spring: boolean; summer: boolean; autumn: boolean; winter: boolean; }
export function emptyDruidYear(): DruidYearLedger { return { spring: false, summer: false, autumn: false, winter: false }; }
export function markDruidYear(ledger: DruidYearLedger, season: DruidSeason): DruidYearLedger {
  return ledger[season] ? ledger : { ...ledger, [season]: true };
}
export function isDruidYearPerfect(ledger: DruidYearLedger): boolean {
  return ledger.spring && ledger.summer && ledger.autumn && ledger.winter;
}
// Estação mais antiga, dentre as que já ocorreram neste Ano (até e incluindo
// a atual), que ainda não foi sintonizada. Nunca aponta para uma Estação
// futura. Usado por Lei do Retorno.
export function oldestUnsyncedDruidSeason(ledger: DruidYearLedger, currentSeason: DruidSeason): DruidSeason | null {
  const currentIndex = DRUID_SEASONS.indexOf(currentSeason);
  for (let i = 0; i <= currentIndex; i += 1) {
    const season = DRUID_SEASONS[i];
    if (!ledger[season]) return season;
  }
  return null;
}
export interface DruidYearEndResult { perfectYear: boolean; renewal: number; ledger: DruidYearLedger; }
// Chamado exatamente na transição Inverno -> Primavera.
export function evaluateDruidYearEnd(ledger: DruidYearLedger, currentRenewal: number): DruidYearEndResult {
  const perfect = isDruidYearPerfect(ledger);
  return { perfectYear: perfect, renewal: perfect ? 1 : currentRenewal, ledger: emptyDruidYear() };
}

// ── Jardim Vivo ──
export function druidGardenMax(hasJardimVivo: boolean): number {
  return hasJardimVivo ? DRUID_GARDEN_MAX_UPGRADED : DRUID_GARDEN_MAX_BASE;
}
// Crescimento de TODAS as unidades existentes em uma estação. Chamado antes
// de resolver qualquer habilidade Sintonizada (independente do caminho).
export function growDruidGarden(garden: readonly DruidGardenUnit[]): DruidGardenUnit[] {
  return garden.map((unit) => ({
    ...unit,
    stage: unit.stage === 'seed' ? 'sprout' : 'fruit',
    age: unit.age + 1,
  }));
}
export function plantDruidSeeds(
  garden: readonly DruidGardenUnit[], nextId: number, count: number, max: number,
): { garden: DruidGardenUnit[]; nextId: number } {
  const out = [...garden];
  let id = nextId;
  for (let i = 0; i < count && out.length < max; i += 1) { out.push({ id, stage: 'seed', age: 0 }); id += 1; }
  return { garden: out, nextId: id };
}
// Ano Perfeito com Jardim Vivo: toda unidade imatura avança +1 estágio.
export function maturateDruidGardenOneStage(garden: readonly DruidGardenUnit[]): DruidGardenUnit[] {
  return garden.map((unit) => ({ ...unit, stage: unit.stage === 'seed' ? 'sprout' : 'fruit' }));
}
export function forceDruidGardenToFruit(garden: readonly DruidGardenUnit[]): DruidGardenUnit[] {
  return garden.map((unit) => ({ ...unit, stage: 'fruit' as const }));
}
export function druidFruitCount(garden: readonly DruidGardenUnit[]): number {
  return garden.filter((unit) => unit.stage === 'fruit').length;
}
// Consome até `maxCount` Frutos, do mais antigo para o mais novo.
export function consumeDruidFruits(
  garden: readonly DruidGardenUnit[], maxCount: number,
): { garden: DruidGardenUnit[]; consumedCount: number } {
  const fruitIds = garden.filter((unit) => unit.stage === 'fruit').sort((a, b) => b.age - a.age).slice(0, maxCount).map((unit) => unit.id);
  return { garden: garden.filter((unit) => !fruitIds.includes(unit.id)), consumedCount: fruitIds.length };
}
export function consumeOldestDruidFruit(garden: readonly DruidGardenUnit[]): { garden: DruidGardenUnit[]; consumed: boolean } {
  const result = consumeDruidFruits(garden, 1);
  return { garden: result.garden, consumed: result.consumedCount > 0 };
}

// ── Formas / Metamorfose ──
export function druidFormForSeason(season: DruidSeason): DruidForm { return DRUID_FORM_BY_SEASON[season]; }
export interface DruidFormBonuses {
  healEffPct: number; mdefPct: number; speedPct: number; critChancePct: number;
  magicDmgPct: number; dmgTakenPct: number; accuracyPct: number; mdefPenPct: number;
}
const DRUID_FORM_BONUS_TABLE: Record<DruidForm, DruidFormBonuses> = {
  none: { healEffPct: 0, mdefPct: 0, speedPct: 0, critChancePct: 0, magicDmgPct: 0, dmgTakenPct: 0, accuracyPct: 0, mdefPenPct: 0 },
  stag: { healEffPct: 0.05, mdefPct: 0.04, speedPct: 0, critChancePct: 0, magicDmgPct: 0, dmgTakenPct: 0, accuracyPct: 0, mdefPenPct: 0 },
  wolf: { healEffPct: 0, mdefPct: 0, speedPct: 0.05, critChancePct: 0.02, magicDmgPct: 0, dmgTakenPct: 0, accuracyPct: 0, mdefPenPct: 0 },
  bear: { healEffPct: 0, mdefPct: 0, speedPct: 0, critChancePct: 0, magicDmgPct: 0.05, dmgTakenPct: -0.05, accuracyPct: 0, mdefPenPct: 0 },
  owl: { healEffPct: 0, mdefPct: 0, speedPct: 0, critChancePct: 0, magicDmgPct: 0, dmgTakenPct: 0, accuracyPct: 0.04, mdefPenPct: 0.08 },
};
export function druidFormBonuses(form: DruidForm): DruidFormBonuses { return DRUID_FORM_BONUS_TABLE[form]; }
// Soma os bônus das quatro Formas simultaneamente (Avatar Primordial), sem
// somar a Forma-base normal por cima.
export function druidAvatarCombinedBonuses(): DruidFormBonuses {
  return (['stag', 'wolf', 'bear', 'owl'] as const).reduce<DruidFormBonuses>((total, form) => {
    const b = DRUID_FORM_BONUS_TABLE[form];
    return {
      healEffPct: total.healEffPct + b.healEffPct, mdefPct: total.mdefPct + b.mdefPct,
      speedPct: total.speedPct + b.speedPct, critChancePct: total.critChancePct + b.critChancePct,
      magicDmgPct: total.magicDmgPct + b.magicDmgPct, dmgTakenPct: total.dmgTakenPct + b.dmgTakenPct,
      accuracyPct: total.accuracyPct + b.accuracyPct, mdefPenPct: total.mdefPenPct + b.mdefPenPct,
    };
  }, DRUID_FORM_BONUS_TABLE.none);
}
// Instinto Ancestral: a primeira Forma assumida (none -> X) não gera; trocar
// para uma Forma DIFERENTE gera +1 (máx. +1 por cast); repetir a mesma Forma
// não gera. Durante o Avatar, transformações não geram Instinto (o chamador
// simplesmente não invoca esta função nesse caso).
export function gainDruidInstinctOnFormChange(previousForm: DruidForm, newForm: DruidForm, current: number): number {
  if (previousForm === 'none' || previousForm === newForm) return current;
  return Math.min(DRUID_INSTINCT_MAX, current + 1);
}

// ── Avatar Primordial ──
export function activateDruidAvatarActions(renewed: boolean): number {
  return renewed ? DRUID_AVATAR_ACTIONS_RENEWED : DRUID_AVATAR_ACTIONS;
}
export function tickDruidAvatar(actionsLeft: number): number { return Math.max(0, actionsLeft - 1); }

// ── Descompasso / Reequilíbrio ──
export function gainDruidDissonance(current: number, misaligned: boolean): number {
  return misaligned ? Math.min(DRUID_DISSONANCE_MAX, current + 1) : current;
}
// Só reduz naturalmente quando está em 1 ou 2; em 3 fica travado até o
// Reequilíbrio consumir.
export function reduceDruidDissonanceOnAligned(current: number): number {
  return current >= 1 && current <= 2 ? current - 1 : current;
}
export function isDruidReequilibriumReady(dissonance: number): boolean { return dissonance >= DRUID_DISSONANCE_MAX; }

// ── Testes de topologia auxiliares ──
export function druidSeasonForAbilityId(id: string): DruidSeason | 'cycle' | undefined {
  const n = Number(id.split(':').pop());
  return n === 4 ? 'spring' : n === 9 ? 'summer' : n === 10 ? 'autumn' : n === 12 ? 'winter' : n === 13 ? 'cycle' : undefined;
}
