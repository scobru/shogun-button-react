## 2024-02-12 - [Inaccessible Dropdown Items]
**Learning:** The dropdown menu in `ShogunButton.tsx` used `div` elements with `onClick` handlers for interactive items, rendering them inaccessible to keyboard users and screen readers.
**Action:** Convert interactive `div` elements to `button` elements and apply CSS resets (`background: none; border: none; width: 100%; text-align: left;`) to maintain visual design while fixing accessibility.
