const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { nextDate } = require('../utils/recurrence');

describe('recurrence date calculations', () => {
  it('advances daily and weekly schedules', () => {
    assert.equal(nextDate('2024-02-28', 'daily'), '2024-02-29');
    assert.equal(nextDate('2024-02-28', 'weekly'), '2024-03-06');
  });

  it('preserves a monthly 31st anchor across short months', () => {
    assert.equal(nextDate('2024-01-31', 'monthly', 31), '2024-02-29');
    assert.equal(nextDate('2024-02-29', 'monthly', 31), '2024-03-31');
    assert.equal(nextDate('2023-02-28', 'monthly', 31), '2023-03-31');
  });

  it('handles yearly leap-day schedules', () => {
    assert.equal(nextDate('2024-02-29', 'yearly', 29), '2025-02-28');
    assert.equal(nextDate('2025-02-28', 'yearly', 29), '2026-02-28');
  });

  it('rejects unsupported frequencies', () => {
    assert.throws(() => nextDate('2024-01-01', 'hourly'), /Unsupported recurrence frequency/);
  });
});
