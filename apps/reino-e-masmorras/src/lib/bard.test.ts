import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { advanceAudienceChorus, appendBardNote, applyAudienceChorus, bardActionWritesNote, canEncore, chooseWildcardNote, classifyBardPhrase, consumeEcho, consumeOvation, countertempoEcho, createBardState, createEncorePayload, directHealAmount, healingBaseHp, gainEcho, prepareAccent, resetBardEnemy, resolveBardPhrase } from './bardo.ts';

test('Bardo preserva 3 paths, 45 IDs e topologia 7/3/5', () => {
  const source = readFileSync(new URL('./skills.ts', import.meta.url), 'utf8');
  assert.match(source, /SKILL_TREES\.bardo\s*=\s*\[/);
  for (const path of ['cancao-guerra','melodia-sombria','inspiracao']) {
    assert.equal((source.match(new RegExp(`buildPath\\('bardo','${path}'`,'g')) ?? []).length, 1);
  }
  assert.match(source, /Acorde de Impacto/); assert.match(source, /Bis!/);
});

test('Refrões, Harmonia e Contracanto classificam e carregam a minoria', () => {
  for (const n of [['marcato','marcato','marcato'],['dissonant','dissonant','dissonant'],['lyrical','lyrical','lyrical']] as const) {
    const out = appendBardNote(appendBardNote(appendBardNote(createBardState(),n[0]).state,n[1]).state,n[2]);
    assert.equal(out.phrase, 'refrain'); assert.equal(out.state.ovation, 1); assert.equal(out.state.notes.length,0);
  }
  const h = appendBardNote(appendBardNote(appendBardNote(createBardState(),'marcato').state,'dissonant').state,'lyrical');
  assert.equal(h.phrase,'harmony'); assert.equal(h.state.ovation,1);
  const c = appendBardNote(appendBardNote(appendBardNote(createBardState(),'marcato').state,'marcato').state,'dissonant');
  assert.equal(c.phrase,'counterpoint'); assert.deepEqual(c.state.notes,['dissonant']); assert.equal(c.state.impulse,true); assert.equal(c.state.ovation,0);
});

test('wildcards são determinísticos e não mudam o efeito da habilidade', () => {
  assert.equal(chooseWildcardNote(['marcato','dissonant'],'harmonyFirst'),'lyrical');
  assert.equal(chooseWildcardNote(['marcato','marcato'],'harmonyFirst'),'lyrical');
  assert.equal(chooseWildcardNote(['marcato','marcato'],'refrainFirst'),'marcato');
  assert.equal(chooseWildcardNote(['dissonant','lyrical'],'refrainFirst'),'marcato');
});

test('Contratempo converte ação real em Eco, respeitando caps e reset por inimigo', () => {
  let s = { ...createBardState(), countertempo:true };
  s = countertempoEcho(s,1,0,true); assert.equal(s.echo,2); assert.equal(s.countertempo,false);
  s = gainEcho(s,2); assert.equal(s.echo,2); s = consumeEcho(s,1); assert.equal(s.echo,1);
  s = resetBardEnemy(s); assert.equal(s.echo,0); assert.equal(s.outOfTune,false);
});

test('Ovação, Acento, Coro e Bis respeitam caps e payload sanitizado', () => {
  let s = createBardState(); s = prepareAccent(s); assert.equal(s.accent,true);
  s = consumeOvation({ ...s, ovation:1 }, true); assert.equal(s.ovation,0); assert.equal(s.pendingAudienceChorus,false); assert.deepEqual(s.notes,['lyrical']);
  assert.deepEqual(applyAudienceChorus(s).notes,['lyrical']);
  const payload = createEncorePayload({ dmgMult:1.3 }); assert.deepEqual(payload,{magicalHitMults:[0.715]});
  assert.deepEqual(createEncorePayload({ healPct:0.12 }), { healPct:0.066 });
  s = { ...s, encoreReady:true, encoreMemory:payload, ovation:1 }; assert.equal(canEncore(s),true);
  assert.equal(consumeOvation({ ...s, pendingAudienceChorus:false }, false).pendingAudienceChorus, false);
  assert.deepEqual(createEncorePayload({ bardMagicalHitMults:[1.2], bardPhysicalHitMults:[0.4] }), { magicalHitMults:[0.66], physicalHitMults:[0.22] });
});

test('Coro da Plateia dura três habilidades normais e entra após a próxima Frase', () => {
  let s = consumeOvation({ ...createBardState(), notes:['marcato','dissonant'], ovation: 1 }, true);
  assert.equal(s.pendingAudienceChorus, true);
  s = advanceAudienceChorus(s); assert.equal(s.audienceChorusUsesLeft, 2);
  s = advanceAudienceChorus(s); assert.equal(s.audienceChorusUsesLeft, 1);
  s = advanceAudienceChorus(s); assert.equal(s.pendingAudienceChorus, false);
  s = consumeOvation({ ...createBardState(), notes:['marcato','dissonant'], ovation: 1 }, true);
  const phrase = appendBardNote(s, 'lyrical');
  assert.equal(phrase.phrase, 'harmony');
  assert.deepEqual(phrase.state.notes, ['lyrical']);
});

test('performance atravessa inimigos, mas alvo e memória do Bis não', () => {
  const performance = { ...createBardState(), notes:['marcato' as const], ovation:1, accent:true, fortissimo:true, impulse:true, sustain:true, triumphalEntry:true, pendingAudienceChorus:true, audienceChorusUsesLeft:2, encoreReady:true, encoreMemory:{ magicalHitMults:[0.5] } };
  const next = resetBardEnemy(performance);
  assert.deepEqual(next.notes, ['marcato']); assert.equal(next.ovation, 1); assert.equal(next.accent, true); assert.equal(next.fortissimo, true); assert.equal(next.impulse, true); assert.equal(next.sustain, true); assert.equal(next.triumphalEntry, true); assert.equal(next.pendingAudienceChorus, true);
  assert.equal(next.echo, 0); assert.equal(next.countertempo, false); assert.equal(next.encoreReady, false); assert.equal(next.encoreMemory, null);
});

test('ação normal escreve uma Nota; básicos, DOT, Finale, Bis e ação negada não escrevem', () => {
  let s=createBardState(); const normal=appendBardNote(s,'marcato'); assert.equal(normal.state.notes.length,1);
  for (const kind of ['basic','dot','proc','passive','enemy','multiHitPerHit','finale','encore','stunned','silencedFallback'] as const) assert.equal(bardActionWritesNote(kind), false);
  assert.equal(bardActionWritesNote('normal'), true);
});

test('Base de Cura universal ignora equipamento/VIT e escala apenas suporte', () => {
  assert.equal(healingBaseHp(34,1),34); assert.equal(healingBaseHp(34,20),224); assert.equal(healingBaseHp(34,50),524); assert.equal(healingBaseHp(34,60),624);
  assert.equal(directHealAmount(34,50,0.12,0),63);
  assert.ok(directHealAmount(34,50,0.12,0.6)>directHealAmount(34,50,0.12,0));
});

test('Partitura permanece correta em luta longa e nunca gera cadeia recursiva', () => {
  let s=createBardState();
  for(let i=0;i<20;i++){ const out=appendBardNote(appendBardNote(appendBardNote(s,'marcato').state,'dissonant').state,'lyrical'); s=out.state; assert.ok(s.notes.length<=2); assert.ok(s.ovation<=1); }
  assert.equal(classifyBardPhrase(s.notes), null);
});
