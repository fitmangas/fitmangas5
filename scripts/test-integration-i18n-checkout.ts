import assert from 'node:assert/strict';

import { COURSE_CHECKOUT_MODE, COURSE_STRIPE_PRICE_ENV } from '../src/lib/checkout-courses';
import { compteNavLabels, isClientLang, localeFromClientLang, resolveFirstName } from '../src/lib/compte/i18n';

function testLanguageConsistency() {
  assert.equal(isClientLang('fr'), true);
  assert.equal(isClientLang('en'), true);
  assert.equal(isClientLang('es'), true);
  assert.equal(isClientLang('de'), false);

  assert.equal(localeFromClientLang('fr'), 'fr-FR');
  assert.equal(localeFromClientLang('en'), 'en-US');
  assert.equal(localeFromClientLang('es'), 'es-ES');

  for (const lang of ['fr', 'en', 'es'] as const) {
    assert.ok(compteNavLabels[lang].dashboard.length > 0);
    assert.ok(compteNavLabels[lang].invoices.length > 0);
  }
}

function testFirstNameResolution() {
  assert.equal(resolveFirstName('Alejandra', {}), 'Alejandra');
  assert.equal(resolveFirstName(null, { given_name: 'Maria' }), 'Maria');
  assert.equal(resolveFirstName('', { name: 'Lucia Gomez' }), 'Lucia');
  assert.equal(resolveFirstName(null, {}), 'Alejandra');
}

function testCheckoutMappingCoherence() {
  const courseIds = Object.keys(COURSE_STRIPE_PRICE_ENV);
  assert.ok(courseIds.length > 0);
  for (const id of courseIds) {
    assert.ok(COURSE_CHECKOUT_MODE[id], `Missing checkout mode for ${id}`);
  }
}

function main() {
  testLanguageConsistency();
  testFirstNameResolution();
  testCheckoutMappingCoherence();
  console.log('Integration checks passed: i18n + checkout coherence.');
}

main();
