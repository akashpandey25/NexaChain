/**
 * Token Storage Utility & Security Architecture
 * 
 * Manages client-side access token persistence.
 * 
 * SECURITY TRADE-OFFS & CONSIDERATIONS:
 * 
 * 1. LocalStorage (Current Implementation):
 *    - Pros: Simple to implement in single-page apps (SPA); works across origins without
 *      complex CORS credential configuration; unaffected by CSRF (Cross-Site Request Forgery)
 *      because tokens are explicitly attached in Authorization headers rather than automatically
 *      sent by browsers.
 *    - Cons: Vulnerable to Cross-Site Scripting (XSS). If malicious JavaScript runs on the origin,
 *      it can access and exfiltrate tokens from localStorage. LocalStorage is NOT immune to XSS.
 * 
 * 2. HttpOnly SameSite Cookies (Recommended Production Alternative):
 *    - Pros: Inaccessible to client-side JavaScript (`document.cookie`), completely mitigating
 *      token theft via XSS.
 *    - Cons: Requires backend cookie issuance; susceptible to CSRF unless guarded by SameSite=Strict
 *      or anti-CSRF synchronizer tokens; complicates cross-domain API architecture.
 * 
 * To mitigate XSS risks in the current design:
 * - Content Security Policy (CSP) headers are enforced by Helmet on the backend.
 * - Strict input validation and sanitization are applied across all forms.
 */

const TOKEN_KEY = 'nexachain_access_token';

/**
 * Retrieve the persisted JWT access token from localStorage.
 * @returns {string|null}
 */
export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('[TokenStorage] Error reading token from localStorage:', error);
    return null;
  }
};

/**
 * Persist the JWT access token in localStorage.
 * @param {string} token
 */
export const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    console.error('[TokenStorage] Error writing token to localStorage:', error);
  }
};

/**
 * Remove the access token from localStorage upon logout or session invalidation.
 */
export const removeStoredToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('[TokenStorage] Error removing token from localStorage:', error);
  }
};

