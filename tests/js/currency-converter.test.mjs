import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Currency Conversion & Pricing Logic Test Suite', () => {
  const EUR_TO_FCFA_RATE = 655.957;

  function convertEurToFcfa(priceEur, rate = EUR_TO_FCFA_RATE) {
    if (typeof priceEur !== 'number' || isNaN(priceEur)) return 0;
    return Math.round(priceEur * rate);
  }

  function formatPrice(amount, currency = 'EUR') {
    if (currency === 'FCFA' || currency === 'XOF') {
      return `${amount.toLocaleString('fr-FR')} FCFA`;
    }
    return `${amount.toFixed(2).replace('.', ',')} €`;
  }

  function applyDiscount(subtotal, discountType, discountValue, rate = EUR_TO_FCFA_RATE, currency = 'EUR') {
    if (discountType === 'percent') {
      const discount = (subtotal * discountValue) / 100;
      return Math.max(0, subtotal - discount);
    }
    // Fixed amount
    let fixedVal = discountValue;
    if (currency === 'FCFA') {
      fixedVal = Math.round(discountValue * rate);
    }
    return Math.max(0, subtotal - fixedVal);
  }

  function isEligibleForFreeShipping(subtotalEur, thresholdEur = 150) {
    return subtotalEur >= thresholdEur;
  }

  test('EUR to FCFA converts exactly with rounding', () => {
    assert.strictEqual(convertEurToFcfa(100), 65596);
    assert.strictEqual(convertEurToFcfa(150), 98394);
    assert.strictEqual(convertEurToFcfa(0), 0);
  });

  test('Price formatting matches European and West African standards', () => {
    assert.strictEqual(formatPrice(120.5, 'EUR'), '120,50 €');
    assert.ok(formatPrice(65596, 'FCFA').includes('FCFA'));
  });

  test('Percentage discount calculation produces correct totals', () => {
    // 200 EUR with 20% discount = 160 EUR
    const discounted = applyDiscount(200, 'percent', 20);
    assert.strictEqual(discounted, 160);
  });

  test('Fixed discount calculation produces correct totals without going below 0', () => {
    // 50 EUR with 60 EUR discount = 0 EUR
    const discounted = applyDiscount(50, 'fixed', 60);
    assert.strictEqual(discounted, 0);
  });

  test('Free shipping eligibility threshold is respected', () => {
    assert.strictEqual(isEligibleForFreeShipping(149.99), false);
    assert.strictEqual(isEligibleForFreeShipping(150.00), true);
    assert.strictEqual(isEligibleForFreeShipping(300.00), true);
  });
});
