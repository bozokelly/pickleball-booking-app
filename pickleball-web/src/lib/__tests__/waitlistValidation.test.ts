import { describe, expect, it } from 'vitest';
import { validateWaitlistSubmission } from '../waitlistValidation';

describe('validateWaitlistSubmission', () => {
  it('normalizes names and email addresses before persistence', () => {
    expect(validateWaitlistSubmission({
      name: '  Brayden   Kelly  ',
      email: '  Player@Example.COM ',
    })).toEqual({
      valid: true,
      value: {
        name: 'Brayden Kelly',
        email: 'player@example.com',
      },
    });
  });

  it.each([
    ['', 'player@example.com', 'name'],
    ['Player', 'not-an-email', 'email'],
    ['Player', 'player@example', 'email'],
    ['Player', 'player @example.com', 'email'],
  ])('rejects invalid input', (name, email, field) => {
    const result = validateWaitlistSubmission({ name, email });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.field).toBe(field);
  });

  it('rejects control characters in a name', () => {
    expect(validateWaitlistSubmission({
      name: 'Player\u0000Name',
      email: 'player@example.com',
    })).toMatchObject({ valid: false, field: 'name' });
  });

  it('does not coerce non-string fields', () => {
    expect(validateWaitlistSubmission({
      name: { toString: () => 'Player' },
      email: 'player@example.com',
    })).toMatchObject({ valid: false, field: 'name' });
  });
});
