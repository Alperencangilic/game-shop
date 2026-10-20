// Client-side checks (the server checks again)
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  if (!value.trim()) return 'Enter your email address.';
  if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address, like name@example.com.';
  return '';
}

export function validateName(value) {
  if (value.trim().length < 2) return 'Enter at least 2 characters.';
  if (value.trim().length > 60) return 'Use at most 60 characters.';
  return '';
}

export function validatePassword(value) {
  if (value.length < 8) return 'Use at least 8 characters.';
  if (value.length > 72) return 'Use at most 72 characters.';
  if (!/[a-z]/i.test(value) || !/\d/.test(value)) return 'Use at least one letter and one number.';
  return '';
}

export function passwordStrength(value) {
  if (!value) return { score: 0, label: '' };
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value) && /[^a-z0-9]/i.test(value)) score++;
  if (/^(password|12345678|qwerty)/i.test(value)) score = 1;
  score = Math.max(1, score);
  return { score, label: ['', 'Weak', 'Fair', 'Good', 'Strong'][score] };
}
