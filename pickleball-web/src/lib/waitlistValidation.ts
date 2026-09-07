export const WAITLIST_NAME_MAX_LENGTH = 80;
export const WAITLIST_EMAIL_MAX_LENGTH = 254;

export type WaitlistSubmission = {
  name: string;
  email: string;
};

export type WaitlistValidationResult =
  | { valid: true; value: WaitlistSubmission }
  | { valid: false; field: 'name' | 'email'; message: string };

export function validateWaitlistSubmission(input: unknown): WaitlistValidationResult {
  if (!isRecord(input)) {
    return { valid: false, field: 'name', message: 'Enter your name.' };
  }

  const name = normalizeName(input.name);
  const email = normalizeEmail(input.email);

  if (!name) {
    return { valid: false, field: 'name', message: 'Enter your name.' };
  }

  if (name.length > WAITLIST_NAME_MAX_LENGTH) {
    return {
      valid: false,
      field: 'name',
      message: `Name must be ${WAITLIST_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (containsControlCharacter(name)) {
    return { valid: false, field: 'name', message: 'Enter a valid name.' };
  }

  if (!email || email.length > WAITLIST_EMAIL_MAX_LENGTH || !isPlausibleEmail(email)) {
    return { valid: false, field: 'email', message: 'Enter a valid email address.' };
  }

  return { valid: true, value: { name, email } };
}

function normalizeName(value: unknown): string {
  if (typeof value !== 'string' || value.length > 500) return '';
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ');
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string' || value.length > 500) return '';
  return value.normalize('NFKC').trim().toLowerCase();
}

function isPlausibleEmail(email: string): boolean {
  if (/\s/u.test(email)) return false;

  const parts = email.split('@');
  if (parts.length !== 2) return false;

  const [localPart, domain] = parts;
  if (!localPart || localPart.length > 64 || !domain || domain.length > 253) return false;
  if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) return false;

  return true;
}

function containsControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint < 32 || codePoint === 127;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
