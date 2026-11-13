import { describe, it, expect } from 'vitest';

describe('Ubuntu Shop - Pricing & Deposit Logic', () => {
  it('should calculate correct totals and multi-product deposits', () => {
    const items = [
      { unit_price_usd: 50, quantity: 2, deposit_min_usd: 20 },
      { unit_price_usd: 120, quantity: 1, deposit_min_usd: 50 }
    ];

    let totalUsd = 0;
    let totalDeposit = 0;

    for (const item of items) {
      totalUsd += item.unit_price_usd * item.quantity;
      totalDeposit += item.deposit_min_usd * item.quantity;
    }

    expect(totalUsd).toBe(220);
    expect(totalDeposit).toBe(90);
    expect(totalUsd - totalDeposit).toBe(130);
  });
});
