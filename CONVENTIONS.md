# Vue 3 & TypeScript Project Architecture & Standards

## Tech Stack & Standards
- **Framework:** Vue 3 (Composition API with `<script setup lang="ts">`)
- **Language:** TypeScript in strict mode. **STRICTLY NO `any` TYPE.** Use generics, unknown, or explicit interfaces.
- **State Management:** Pinia (Setup Store syntax)
- **Routing:** Vue Router 4
- **HTTP Layer:** Axios with generic response wrappers and Mock Adapter (localStorage + 200ms delay)
- **Styling:** SCSS (Scoped in components or modular utility classes)
- **Validation:** Zod + Vee-Validate
- **DnD:** vuedraggable (vuedraggable@next)

## Project Architecture Structure
- `src/types/` — Single source of truth for all Data Interfaces and Enums (`project.ts`, `task.ts`, `api.ts`).
- `src/api/` — Generic Axios client + Mock Adapters + Global API error handling (NO direct handling in components).
- `src/stores/` — Pinia modules (`useProjectStore.ts`, `useTaskStore.ts`).
- `src/composables/` — Encapsulated reusable UI/business logic (`useTableSort.ts`, `useTaskDrag.ts`, `useColumnResize.ts`).
- `src/components/` — Atomic component structure split by domain (`common/`, `projects/`, `tasks/`). No God components.

## Development Rules for AI Agent
1. Never put API calls or direct localStorage logic inside Vue components.
2. Form validation must validate on blur and submit using Zod schema.
3. Table logic (sorting, resizing) MUST be placed into reusable Composables.
4. Always handle `loading`, `error`, and `empty` states gracefully.
5. All mock data must persist in `localStorage` and simulate API latency (150–300ms).