import test from 'node:test';
import assert from 'node:assert/strict';

import { extractJson, findFirstJsonBlock } from '../public/js/components/subabas/parser.js';
import { validateContexto, validateCalendario } from '../public/js/components/subabas/validator.js';

test('findFirstJsonBlock encontra objeto JSON', () => {
  const block = findFirstJsonBlock('abc {"a":1,"b":"x"} def');
  assert.equal(block, '{"a":1,"b":"x"}');
});

test('extractJson faz parse de JSON puro', () => {
  const res = extractJson('{"ok":true}');
  assert.equal(res.success, true);
  assert.equal(res.data.ok, true);
});

test('extractJson faz parse de JSON em fence', () => {
  const res = extractJson('```json\n{"x":1}\n```');
  assert.equal(res.success, true);
  assert.equal(res.data.x, 1);
});

test('validateContexto aceita payload válido', () => {
  const v = validateContexto({ materias: 'Matemática', cargaSemanal: 2 });
  assert.equal(v.ok, true);
});

test('validateCalendario rejeita eventos não-array', () => {
  const v = validateCalendario({ inicio: '2026-01-01', eventos: 'x' });
  assert.equal(v.ok, false);
});

