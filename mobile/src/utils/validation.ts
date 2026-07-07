const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type T = (key: string, params?: Record<string, string | number>) => string;

export function validateEmail(value: string, t: T): string | null {
  if (!value.trim()) return t('validation.emailRequired');
  if (!EMAIL_RE.test(value.trim())) return t('validation.emailInvalid');
  return null;
}

export function validatePassword(value: string, min: number, t: T): string | null {
  if (!value) return t('validation.passwordRequired');
  if (value.length < min) return t('validation.passwordMin', { min });
  return null;
}

export function validateRequired(value: string, field: string, t: T): string | null {
  if (!value.trim()) return t('validation.required', { field });
  return null;
}

export function validateName(value: string, t: T): string | null {
  if (!value.trim()) return t('validation.nameRequired');
  if (value.trim().length < 2) return t('validation.nameMin');
  return null;
}
