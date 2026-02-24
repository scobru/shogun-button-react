## 2025-02-27 - Authentication Forms Need Explicit Autocomplete
**Learning:** Standard password inputs often lack `autoComplete` attributes, frustrating users with password managers.
**Action:** Always add `autoComplete="username"`, `autoComplete="current-password"`, and `autoComplete="new-password"` to authentication forms.

## 2025-02-27 - Error Messages Need ARIA Roles
**Learning:** Error messages in React components often lack `role="alert"` and `aria-live="assertive"`, making them invisible to screen reader users until focus is moved.
**Action:** Always add `role="alert"` and `aria-live="assertive"` to dynamic error message containers.
