import { describe, expect, it } from 'vitest';
import {
  assertAmountMinor,
  assertPositiveAmountMinor,
  formatMoneyMinor
} from '../src/utils/money.js';
import {
  assertDateRange,
  assertUtcDate,
  startOfUtcDay,
  toUtcIso
} from '../src/utils/dates.js';

describe('money utilities', () => {
  it('accepts safe non-negative minor units and formats explicit currency', () => {
    expect(assertAmountMinor(1234)).toBe(1234);
    expect(assertPositiveAmountMinor(1)).toBe(1);
    expect(formatMoneyMinor(1234, 'USD')).toBe('$12.34');
  });

  it('rejects invalid monetary values and currencies', () => {
    expect(() => assertAmountMinor(-1)).toThrow();
    expect(() => assertPositiveAmountMinor(0)).toThrow();
    expect(() => formatMoneyMinor(100, 'US')).toThrow();
  });
});

describe('UTC date utilities', () => {
  it('validates ranges and normalizes to UTC day boundaries', () => {
    const { startDate, endDate } = assertDateRange(
      '2026-01-01T00:00:00.000Z',
      '2026-01-02T00:00:00.000Z'
    );
    expect(startDate.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(endDate.toISOString()).toBe('2026-01-02T00:00:00.000Z');
    expect(startOfUtcDay('2026-01-01T23:59:59.000Z').toISOString())
      .toBe('2026-01-01T00:00:00.000Z');
    expect(toUtcIso(startDate)).toBe('2026-01-01T00:00:00.000Z');
  });

  it('rejects invalid dates and reversed ranges', () => {
    expect(() => assertUtcDate('not-a-date')).toThrow();
    expect(() => assertDateRange(
      '2026-01-02T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z'
    )).toThrow();
  });
});
