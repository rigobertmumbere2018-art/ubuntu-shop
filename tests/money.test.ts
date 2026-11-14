import { describe, it, expect } from 'vitest';
import { calculateLineDepositCents, convertUsdCentsToCdf, formatUsd, formatCdf } from '../src/utils/money';

describe('Money helpers', () => {
  it('calculates percentage deposits in integer cents', () => {
    expect(calculateLineDepositCents(1250, 3, { type: 'percentage', value: 2500 })).toBe(938);
  });
  it('caps fixed deposits at the line total', () => {
    expect(calculateLineDepositCents(500, 2, { type: 'fixed', value: 900 })).toBe(1000);
  });
  it('rejects invalid quantities and rates', () => {
    expect(() => calculateLineDepositCents(1000, 0, { type: 'fixed', value: 100 })).toThrow();
    expect(convertUsdCentsToCdf(10000, null)).toBeNull();
  });
  it('formats USD and CDF values', () => {
    expect(formatUsd(12345)).toBe('$123.45');
    expect(formatCdf(2500)).toContain('2');
  });
});
