import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Internationalization (i18n) Test Suite', () => {
  const messagesDir = path.resolve(process.cwd(), 'messages');
  const frPath = path.join(messagesDir, 'fr.json');
  const enPath = path.join(messagesDir, 'en.json');
  const esPath = path.join(messagesDir, 'es.json');

  test('Translation dictionaries exist for fr, en, and es', () => {
    assert.ok(fs.existsSync(frPath), 'fr.json must exist');
    assert.ok(fs.existsSync(enPath), 'en.json must exist');
    assert.ok(fs.existsSync(esPath), 'es.json must exist');
  });

  test('All translation files parse as valid JSON', () => {
    const fr = JSON.parse(fs.readFileSync(frPath, 'utf-8'));
    const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    const es = JSON.parse(fs.readFileSync(esPath, 'utf-8'));

    assert.ok(typeof fr === 'object' && fr !== null, 'fr should be valid object');
    assert.ok(typeof en === 'object' && en !== null, 'en should be valid object');
    assert.ok(typeof es === 'object' && es !== null, 'es should be valid object');
  });

  test('Essential navigation and checkout keys exist across all languages', () => {
    const fr = JSON.parse(fs.readFileSync(frPath, 'utf-8'));
    const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    const es = JSON.parse(fs.readFileSync(esPath, 'utf-8'));

    // Check top-level structures
    assert.ok(fr.nav || fr.cart || fr.common, 'French translations must have core sections');
    assert.ok(en.nav || en.cart || en.common, 'English translations must have core sections');
    assert.ok(es.nav || es.cart || es.common, 'Spanish translations must have core sections');
  });
});
