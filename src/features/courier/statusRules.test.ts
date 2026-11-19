import { describe, expect, it } from 'vitest';
import { isComplete, transitions, validateUpdate } from './statusRules';

describe('courier status rules', () => {
  it('allows only the defined next statuses', () => {
    const statuses = Object.keys(transitions);
    for (const status of statuses) {
      for (const next of statuses) {
        const run = () => validateUpdate({ status, version: 3 }, { status: next, version: 3, recipientName: 'Recipient', failureReason: 'Wrong address' });
        if ((transitions[status] ?? []).includes(next)) expect(run).not.toThrow();
        else expect(run).toThrow(/not allowed/);
      }
    }
  });

  it('requires a recipient name or proof for delivery', () => {
    const d = { status: 'OUT_FOR_DELIVERY', version: 0 };
    expect(() => validateUpdate(d, { status: 'DELIVERED', version: 0, recipientName: '  ' })).toThrow(/recipient/);
    expect(() => validateUpdate(d, { status: 'DELIVERED', version: 0, proofId: 'proof' })).not.toThrow();
  });

  it('requires a known failure reason, and Other needs a note', () => {
    const d = { status: 'OUT_FOR_DELIVERY', version: 0 };
    expect(() => validateUpdate(d, { status: 'FAILED', version: 0 })).toThrow(/reason/);
    expect(() => validateUpdate(d, { status: 'FAILED', version: 0, failureReason: 'Other' })).toThrow(/note/);
    expect(() => validateUpdate(d, { status: 'FAILED', version: 0, failureReason: 'Other', note: 'Road inaccessible' })).not.toThrow();
  });

  it('rejects stale updates and excessive text', () => {
    const d = { status: 'PENDING', version: 1 };
    expect(() => validateUpdate(d, { status: 'PICKED_UP', version: 0 })).toThrow(/changed/);
    expect(() => validateUpdate(d, { status: 'PICKED_UP', version: 1, note: 'x'.repeat(1001) })).toThrow(/1,000/);
  });

  it('treats only final outcomes as completed', () => {
    expect(isComplete('FAILED')).toBe(true);
    expect(isComplete('DELIVERED')).toBe(true);
    expect(isComplete('OUT_FOR_DELIVERY')).toBe(false);
  });
});
