# Bolt's Journal

## 2024-05-22 - [Ref-based Event Handlers in Provider]
**Learning:** React Context Providers often cause unnecessary re-renders when consumers pass inline callback functions as props. These callbacks change identity on every render, invalidating memoized context values.
**Action:** Use `useRef` to store the latest callback instances and access them via `ref.current` inside `useCallback` hooks. This allows removing the callbacks from the dependency array, stabilizing the context value.
