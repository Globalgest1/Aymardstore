import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Order Tracking and Delivery Lifecycle Test Suite', () => {
  const TRACKING_STEPS = [
    { step: 1, label_fr: 'Commande confirmée', description: 'Paiement ou validation reçue' },
    { step: 2, label_fr: 'Préparation en cours', description: 'Emballage soigné de vos articles' },
    { step: 3, label_fr: 'En cours d\'acheminement', description: 'Pris en charge par notre coursier' },
    { step: 4, label_fr: 'Colis livré', description: 'Remis en mains propres au client' },
  ];

  function getStepInfo(stepNumber) {
    const clamped = Math.max(1, Math.min(4, stepNumber || 1));
    return TRACKING_STEPS.find((s) => s.step === clamped);
  }

  function isStepCompleted(currentStep, stepNumber) {
    return currentStep >= stepNumber;
  }

  function formatCarrierPhone(phone) {
    if (!phone) return null;
    const clean = phone.replace(/[^0-9+]/g, '');
    return clean;
  }

  test('Tracking step 1 returns initial confirmed status', () => {
    const step = getStepInfo(1);
    assert.strictEqual(step.step, 1);
    assert.strictEqual(step.label_fr, 'Commande confirmée');
  });

  test('Tracking step 4 indicates successful delivery', () => {
    const step = getStepInfo(4);
    assert.strictEqual(step.step, 4);
    assert.strictEqual(step.label_fr, 'Colis livré');
  });

  test('Progress completion flags are accurate', () => {
    assert.strictEqual(isStepCompleted(3, 1), true);
    assert.strictEqual(isStepCompleted(3, 2), true);
    assert.strictEqual(isStepCompleted(3, 3), true);
    assert.strictEqual(isStepCompleted(3, 4), false);
  });

  test('Carrier phone sanitization removes non-numeric characters while preserving plus sign', () => {
    const raw = '+229 01 97 36 29 06';
    const formatted = formatCarrierPhone(raw);
    assert.strictEqual(formatted, '+2290197362906');
  });
});
