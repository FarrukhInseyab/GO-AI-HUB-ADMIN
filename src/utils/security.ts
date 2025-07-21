
// Security utilities

/**
 * Generates a random token of specified length
 * @param length Length of the token to generate
 * @returns Random token string
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  
  // Use crypto.getRandomValues for better randomness if available
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(randomValues[i] % chars.length);
    }
  } else {
    // Fallback to Math.random if crypto is not available
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  
  return result;
}

/**
 * Sanitizes a string to prevent XSS attacks
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates that a token matches expected format (alphanumeric)
 * @param token Token to validate
 * @returns Whether token is valid
 */
export function validateToken(token: string): boolean {
  if (!token) return false;
  
  // Token should be alphanumeric and reasonable length
  return /^[A-Za-z0-9]{16,128}$/.test(token);
}