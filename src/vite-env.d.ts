/// <reference types="vite/client" />

// GĐ6.5 — minimal ambient shapes for the few Node builtins the CSS-invariant
// test (App.storybook.test.tsx) uses to read the SHIPPED stylesheet. Declared
// here (rather than installing @types/node) so the app tsconfig — which doesn't
// ship Node types — type-checks the test without a new dependency. Vitest runs
// on Node, so these resolve to the real builtins at runtime.
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf-8'): string;
}
declare module 'node:url' {
  export function fileURLToPath(url: string): string;
}
declare module 'node:path' {
  export function dirname(p: string): string;
  export function resolve(...segments: string[]): string;
}
