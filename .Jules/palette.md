## 2024-03-24 - Missing Form Accessibility Basics
**Learning:** The authentication forms in `ShogunButton` were missing fundamental accessibility attributes like `role="alert"` for error messages and `autoComplete` attributes for inputs. This prevents screen readers from announcing errors and hinders password managers.
**Action:** When working on Shogun UI components, always check for and add these basic accessibility attributes first.
