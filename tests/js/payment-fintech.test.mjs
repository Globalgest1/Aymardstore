import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Fintech & Payment Gateway Integration Test Suite', () => {
  function prepareLeekPayPayload({ orderId, amount, currency = 'XOF', email, name }) {
    if (!orderId || !amount || amount <= 0) {
      throw new Error('Paramètres de commande invalides pour LeekPay');
    }

    const isoCurrency = (currency === 'FCFA' || currency === 'XOF') ? 'XOF' : 'EUR';
    // Minimum amount in XOF is 100 FCFA
    const sanitizedAmount = Math.max(100, Math.round(amount));

    return {
      amount: sanitizedAmount,
      currency: isoCurrency,
      order_id: orderId,
      customer_email: email ? email.trim().toLowerCase() : null,
      customer_name: name ? name.trim() : null,
      description: `Commande AYMARD STORE #${orderId}`,
    };
  }

  function prepareSasPayPayload({ orderId, amount, currency = 'XOF', email, phone, returnUrl }) {
    if (!orderId || !amount || amount <= 0) {
      throw new Error('Paramètres invalides pour SasPay');
    }

    const isoCurrency = (currency === 'FCFA' || currency === 'XOF') ? 'XOF' : 'EUR';

    return {
      amount: Number(amount).toFixed(2),
      currency: isoCurrency,
      country: 'BJ',
      customer_email: email || 'client@aymardstore.com',
      customer_phone: phone || '',
      return_url: returnUrl || 'https://aymardstore.com/account?tab=orders',
      metadata: {
        order_id: orderId,
      },
    };
  }

  test('LeekPay payload sanitizes amount and defaults to XOF in Benin', () => {
    const payload = prepareLeekPayPayload({
      orderId: 'AYM-12345',
      amount: 65595.7,
      currency: 'FCFA',
      email: 'Client@Gmail.Com ',
      name: '  Aymard Client ',
    });

    assert.strictEqual(payload.order_id, 'AYM-12345');
    assert.strictEqual(payload.currency, 'XOF');
    assert.strictEqual(payload.amount, 65596);
    assert.strictEqual(payload.customer_email, 'client@gmail.com');
    assert.strictEqual(payload.customer_name, 'Aymard Client');
  });

  test('LeekPay payload enforces minimum amount of 100', () => {
    const payload = prepareLeekPayPayload({
      orderId: 'AYM-MIN',
      amount: 10,
      currency: 'XOF',
    });

    assert.strictEqual(payload.amount, 100);
  });

  test('SasPay payload formats metadata and return url properly', () => {
    const payload = prepareSasPayPayload({
      orderId: 'AYM-SAS-99',
      amount: 150.00,
      currency: 'EUR',
      email: 'saspay@test.com',
      phone: '+22997362906',
    });

    assert.strictEqual(payload.currency, 'EUR');
    assert.strictEqual(payload.amount, '150.00');
    assert.strictEqual(payload.country, 'BJ');
    assert.strictEqual(payload.metadata.order_id, 'AYM-SAS-99');
    assert.strictEqual(payload.customer_phone, '+22997362906');
  });

  test('Payment payloads reject non-positive amounts', () => {
    assert.throws(() => {
      prepareLeekPayPayload({ orderId: 'AYM-ZERO', amount: 0 });
    }, /Paramètres de commande invalides/);

    assert.throws(() => {
      prepareSasPayPayload({ orderId: 'AYM-ZERO', amount: -50 });
    }, /Paramètres invalides/);
  });
});
