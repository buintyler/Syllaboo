interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_DISPLAY_NAME_LENGTH = 20;

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Please enter your email address' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true, error: null };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Please enter a password' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { isValid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  return { isValid: true, error: null };
}

export function validateDisplayName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Please enter a first name' };
  }
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    return { isValid: false, error: `Name must be under ${MAX_DISPLAY_NAME_LENGTH} characters` };
  }
  return { isValid: true, error: null };
}

export function parseClerkError(err: unknown): string {
  if (err && typeof err === 'object' && 'errors' in err) {
    const clerkErr = err as { errors: Array<{ message: string; code: string }> };
    if (clerkErr.errors.length > 0) {
      const first = clerkErr.errors[0];
      switch (first.code) {
        case 'form_identifier_not_found':
          return 'No account found with this email';
        case 'form_password_incorrect':
          return 'Incorrect password';
        case 'form_identifier_exists':
          return 'An account with this email already exists';
        case 'form_code_incorrect':
          return 'Invalid code. Please try again.';
        case 'form_password_pwned':
          return 'This password is too common. Please choose a stronger password.';
        case 'form_password_length_too_short':
          return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
        default:
          return first.message;
      }
    }
  }
  return 'Something went wrong. Please try again.';
}
