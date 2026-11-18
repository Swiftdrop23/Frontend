import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transitions, validateUpdate, isComplete } from './statusRules.js';

test('only the defined next statuses are allowed', () => {
  const statuses = Object.keys(transitions);
  for (const status of statuses) for (const next of statuses) {
    const run = () => validateUpdate({ status, version: 3 }, { status: next, version: 3, recipientName: 'Recipient', failureReason: 'Wrong address' });
    if (transitions[status].includes(next)) assert.doesNotThrow(run);
    else assert.throws(run, /not allowed/);
  }
});
test('delivery requires recipient name or proof', () => {
  const d = { status: 'OUT_FOR_DELIVERY', version: 0 };
  assert.throws(() => validateUpdate(d, { status: 'DELIVERED', version: 0, recipientName: '  ' }), /recipient/);
  assert.doesNotThrow(() => validateUpdate(d, { status: 'DELIVERED', version: 0, proofId: 'proof' }));
});
test('failure requires a known reason and Other needs a note', () => {
  const d = { status: 'OUT_FOR_DELIVERY', version: 0 };
  assert.throws(() => validateUpdate(d, { status: 'FAILED', version: 0 }), /reason/);
  assert.throws(() => validateUpdate(d, { status: 'FAILED', version: 0, failureReason: 'Other' }), /note/);
  assert.doesNotThrow(() => validateUpdate(d, { status: 'FAILED', version: 0, failureReason: 'Other', note: 'Road inaccessible' }));
});
test('stale updates and excessive text are rejected', () => {
  const d = { status: 'PENDING', version: 1 };
  assert.throws(() => validateUpdate(d, { status: 'PICKED_UP', version: 0 }), /changed/);
  assert.throws(() => validateUpdate(d, { status: 'PICKED_UP', version: 1, note: 'x'.repeat(1001) }), /1,000/);
});
test('only final outcomes are completed', () => {
  assert.equal(isComplete('FAILED'), true); assert.equal(isComplete('DELIVERED'), true); assert.equal(isComplete('OUT_FOR_DELIVERY'), false);
});
