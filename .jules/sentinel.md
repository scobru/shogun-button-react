## 2025-02-23 - Critical Auth Vulnerabilities
**Vulnerability:** Debug logs in `handleAuth` were logging plaintext `args` which contained user passwords during login/signup.
**Learning:** Generic debug logs (e.g., "function called with args") are dangerous in sensitive flows like authentication.
**Prevention:** Never log function arguments in production code, especially in auth-related functions. Use strict lint rules or manual review for `console.log` in `src/`.

**Vulnerability:** `exportGunPair` failed open (exported plaintext keys) when encryption library (SEA) was missing.
**Learning:** Security features must fail closed (throw error), not warn and continue insecurely.
**Prevention:** Use explicit error handling for security-critical dependencies. If a security feature fails, the operation must fail.
