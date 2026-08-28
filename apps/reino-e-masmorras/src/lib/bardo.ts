import { HEALING_BASE_PER_LEVEL, healingBaseHp as sharedHealingBaseHp, directHealAmount as sharedDirectHealAmount, passiveHealAmount as sharedPassiveHealAmount } from './healing.ts';

/** Compositor do Combate — regras puras do Bardo.
 * O motor de combate usa este módulo como fonte de verdade; a UI apenas
 * espelha o estado. Nenhuma função depende de nomes de habilidades.
 */
export type BardNote = 'marcato' | 'dissonant' | 'lyrical';
export type BardPhraseKind = 'refrain' | 'counterpoint' | 'harmony' | null;
export type BardWildcardPolicy = 'harmonyFirst' | 'refrainFirst';

export interface BardEncorePayload {
  magicalHitMults?: number[];
  physicalHitMults?: number[];
  healPct?: number;
}
export interface BardScoreState {
  notes: BardNote[];
  ovation: number;
  accent: boolean;
  fortissimo: boolean;
  impulse: boolean;
  sustain: boolean;
  nextEnemyDamageReductionPct: number;
  countertempo: boolean;
  echo: number;
  outOfTune: boolean;
  encoreReady: boolean;
  pendingAudienceChorus: boolean;
  audienceChorusUsesLeft: number;
  bridgeActive: boolean;
  triumphalEntry: boolean;
  harmonyProtection: boolean;
  lyricTenacity: boolean;
  echoTenacity: boolean;
  accentSpeed: boolean;
  nextBasicPhysicalBonusPct: number;
  echoNotePending: boolean;
  encoreMemory: BardEncorePayload | null;
  accentRefundedThisEnemy: boolean;
}

export const BARD_NOTE_MAX = 3;
export const BARD_OVATION_MAX = 1;
export const BARD_ECHO_MAX = 2;
export const BARD_COUNTERTEMPO_MAX = 1;
export const BARD_FORTISSIMO_DAMAGE = 0.15;
export const BARD_FORTISSIMO_CRIT = 0.05;
export const BARD_ACCENT_PHYSICAL_BASE = 0.35;
export const BARD_HEALING_BASE_PER_LEVEL = HEALING_BASE_PER_LEVEL;

export function createBardState(): BardScoreState {
  return { notes: [], ovation: 0, accent: false, fortissimo: false, impulse: false,
    sustain: false, nextEnemyDamageReductionPct: 0, countertempo: false, echo: 0, outOfTune: false,
    encoreReady: false, pendingAudienceChorus: false, audienceChorusUsesLeft: 0,
    bridgeActive: false, triumphalEntry: false, harmonyProtection: false, lyricTenacity: false, echoTenacity: false, accentSpeed: false,
    nextBasicPhysicalBonusPct: 0, echoNotePending: false,
    encoreMemory: null, accentRefundedThisEnemy: false };
}
export function resetBardEnemy(s: BardScoreState): BardScoreState {
  return { ...s, countertempo: false, echo: 0, outOfTune: false, encoreReady: false,
    encoreMemory: null, accentRefundedThisEnemy: false, bridgeActive: false,
    nextEnemyDamageReductionPct: 0, nextBasicPhysicalBonusPct: 0, echoNotePending: false };
}
export function resetBardAttempt(): BardScoreState { return createBardState(); }
export function healingBaseHp(baseHp: number, level: number): number { return sharedHealingBaseHp(baseHp, level); }
export function directHealAmount(baseHp: number, level: number, healPct: number, supportPowerPct: number, efficiencyPct = 0): number {
  return sharedDirectHealAmount(baseHp, level, healPct, supportPowerPct, efficiencyPct);
}
export function passiveHealAmount(baseHp: number, level: number, healPct: number, supportPowerPct: number): number {
  return sharedPassiveHealAmount(baseHp, level, healPct, supportPowerPct);
}
export function appendBardNote(s: BardScoreState, note: BardNote): { state: BardScoreState; phrase: BardPhraseKind; dominant?: BardNote; carried?: BardNote; healPct?: number } {
  if (s.notes.length >= BARD_NOTE_MAX) return { state: s, phrase: null };
  const notes = [...s.notes, note];
  if (notes.length < BARD_NOTE_MAX) return { state: { ...s, notes }, phrase: null };
  const phrase = classifyBardPhrase(notes);
  const result = resolveBardPhrase({ ...s, notes });
  const post = result.state.pendingAudienceChorus && result.state.notes.length < 2
    ? { ...result.state, pendingAudienceChorus: false, audienceChorusUsesLeft: 0, notes: [...result.state.notes, 'lyrical' as BardNote] }
    : result.state;
  return { state: post, phrase, dominant: result.dominant, carried: result.carried, healPct: result.healPct };
}
export function classifyBardPhrase(notes: BardNote[]): BardPhraseKind {
  if (notes.length !== 3) return null;
  const unique = new Set(notes);
  if (unique.size === 1) return 'refrain';
  if (unique.size === 3) return 'harmony';
  return 'counterpoint';
}
export function counterpointMinority(notes: BardNote[]): { dominant: BardNote; minority: BardNote } | null {
  if (notes.length !== 3) return null;
  const counts = (['marcato','dissonant','lyrical'] as BardNote[]).map((n) => ({ n, c: notes.filter((x) => x === n).length }));
  const dominant = counts.find((x) => x.c === 2)?.n;
  const minority = counts.find((x) => x.c === 1)?.n;
  return dominant && minority ? { dominant, minority } : null;
}
export function resolveBardPhrase(s: BardScoreState): { state: BardScoreState; dominant?: BardNote; carried?: BardNote; healPct?: number } {
  const phrase = classifyBardPhrase(s.notes);
  if (phrase === 'refrain') {
    const voice = s.notes[0];
    const next = { ...s, notes: [], ovation: 1 };
    if (voice === 'marcato') return { state: { ...next, fortissimo: true, accent: true }, dominant: voice };
    if (voice === 'dissonant') return { state: { ...next, outOfTune: true }, dominant: voice };
    return { state: { ...next, sustain: true, lyricTenacity: true }, dominant: voice, healPct: 0.08 };
  }
  if (phrase === 'harmony') return { state: { ...s, notes: [], ovation: 1, harmonyProtection: true }, dominant: undefined, healPct: 0.05 };
  if (phrase === 'counterpoint') {
    const pair = counterpointMinority(s.notes)!;
    const base = { ...s, notes: [pair.minority] };
    if (pair.dominant === 'marcato') return { state: { ...base, impulse: true, bridgeActive: true }, dominant: pair.dominant, carried: pair.minority };
    if (pair.dominant === 'dissonant') return { state: { ...base, nextEnemyDamageReductionPct: Math.max(base.nextEnemyDamageReductionPct, 0.06) }, dominant: pair.dominant, carried: pair.minority };
    return { state: { ...base }, dominant: pair.dominant, carried: pair.minority, healPct: 0.04 };
  }
  return { state: s };
}
export function chooseWildcardNote(notes: BardNote[], policy: BardWildcardPolicy): BardNote {
  const voices: BardNote[] = ['marcato','dissonant','lyrical'];
  if (notes.length === 2) {
    if (policy === 'refrainFirst' && notes[0] === notes[1]) return notes[0];
    if (notes[0] === notes[1]) return 'lyrical';
    const missing = voices.find((v) => !notes.includes(v));
    return missing ?? 'lyrical';
  }
  return 'lyrical';
}
export function setOvation(s: BardScoreState, value: number): BardScoreState { return { ...s, ovation: Math.max(0, Math.min(BARD_OVATION_MAX, value)) }; }
export function consumeOvation(s: BardScoreState, audienceChorusUnlocked = false): BardScoreState {
  const next = { ...s, ovation: 0, pendingAudienceChorus: audienceChorusUnlocked, audienceChorusUsesLeft: audienceChorusUnlocked ? 3 : 0 };
  // With zero or one note, the phantom Lírica is inserted immediately after
  // the Finale. A two-note score must wait for the next completed phrase so
  // it cannot alter the phrase that is already being assembled.
  return audienceChorusUnlocked && next.notes.length < 2 ? applyAudienceChorus(next) : next;
}
export function prepareAccent(s: BardScoreState): BardScoreState { return { ...s, accent: true }; }
export function consumeAccent(s: BardScoreState): BardScoreState { return { ...s, accent: false }; }
export function createCountertempo(s: BardScoreState): BardScoreState { return { ...s, countertempo: true }; }
export function gainEcho(s: BardScoreState, amount: number): BardScoreState { return { ...s, echo: Math.min(BARD_ECHO_MAX, Math.max(0, s.echo + amount)) }; }
export function consumeEcho(s: BardScoreState, amount: number): BardScoreState { return { ...s, echo: Math.max(0, s.echo - amount) }; }
export function countertempoEcho(s: BardScoreState, directHitsAttempted: number, directHitsLanded: number, actionWasReal: boolean): BardScoreState {
  if (!s.countertempo || !actionWasReal) return s;
  const generated = directHitsAttempted === 0 ? 1 : directHitsLanded > 0 ? 1 : 2;
  return { ...s, countertempo: false, echo: Math.min(BARD_ECHO_MAX, s.echo + generated) };
}
export function chooseWildcardAndAppend(s: BardScoreState, policy: BardWildcardPolicy): { state: BardScoreState; phrase: BardPhraseKind; note: BardNote } {
  const note = chooseWildcardNote(s.notes, policy);
  const out = appendBardNote(s, note);
  return { ...out, note };
}
export function createEncorePayload(e: { dmgMult?: number; hitDmgMults?: number[]; dmgMultPerHit?: number; healPct?: number; bardMagicalHitMults?: number[]; bardPhysicalHitMults?: number[] }): BardEncorePayload {
  if (e.healPct !== undefined) return { healPct: e.healPct * 0.55 };
  const physicalHitMults = e.bardPhysicalHitMults?.map((n) => Number((n * 0.55).toFixed(6)));
  const magicalHitMults = e.bardMagicalHitMults?.map((n) => Number((n * 0.55).toFixed(6)));
  if (physicalHitMults?.length || magicalHitMults?.length) return { physicalHitMults, magicalHitMults };
  if (e.hitDmgMults?.length) return { magicalHitMults: e.hitDmgMults.map((n) => n * 0.55) };
  if (e.dmgMultPerHit !== undefined) return { magicalHitMults: [e.dmgMultPerHit * 0.55] };
  return { magicalHitMults: [Number(((e.dmgMult ?? 1) * 0.55).toFixed(6))] };
}
export function canEncore(s: BardScoreState): boolean { return s.ovation > 0 && s.encoreReady && !!s.encoreMemory; }
export type BardActionKind = 'normal' | 'basic' | 'dot' | 'proc' | 'passive' | 'enemy' | 'multiHitPerHit' | 'finale' | 'encore' | 'stunned' | 'silencedFallback';
export function bardActionWritesNote(kind: BardActionKind): boolean { return kind === 'normal'; }
export function advanceAudienceChorus(s: BardScoreState): BardScoreState {
  if (!s.pendingAudienceChorus || s.audienceChorusUsesLeft <= 0) return { ...s, pendingAudienceChorus: false, audienceChorusUsesLeft: 0 };
  const usesLeft = s.audienceChorusUsesLeft - 1;
  return usesLeft > 0 ? { ...s, audienceChorusUsesLeft: usesLeft } : { ...s, pendingAudienceChorus: false, audienceChorusUsesLeft: 0 };
}
export function applyAudienceChorus(s: BardScoreState): BardScoreState {
  if (!s.pendingAudienceChorus || s.audienceChorusUsesLeft <= 0 || s.notes.length >= 2) return s;
  return { ...s, pendingAudienceChorus: false, audienceChorusUsesLeft: 0, notes: [...s.notes, 'lyrical'] };
}
