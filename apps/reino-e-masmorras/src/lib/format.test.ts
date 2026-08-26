import assert from 'node:assert/strict';
import test from 'node:test';
import { formatGameNumber } from './format.ts';

test('formatGameNumber limita ruído flutuante e usa pt-BR', () => {
  assert.equal(formatGameNumber(109.39999999999998), '109,4');
  assert.equal(formatGameNumber(109), '109');
  assert.equal(formatGameNumber(109.04), '109');
  assert.equal(formatGameNumber(109.05), '109,1');
  assert.equal(formatGameNumber(17.999999999), '18');
  assert.equal(formatGameNumber(0.30000000000000004), '0,3');
  assert.equal(formatGameNumber(-0.00000001), '0');
});

test('formatGameNumber usa fallback seguro para valores inválidos', () => {
  const original = console.error;
  console.error = () => undefined;
  try {
    assert.equal(formatGameNumber(Number.NaN), '0');
    assert.equal(formatGameNumber(Number.POSITIVE_INFINITY), '0');
  } finally {
    console.error = original;
  }
});
