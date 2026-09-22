# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A minimal To-Do list app: Next.js (App Router) + TypeScript + Tailwind CSS v4. Todos persist to the browser's `localStorage` — there is no backend or database.

## Commands

```bash
npm run dev      # start the dev server (http://localhost:3000)
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint (flat config, eslint.config.mjs)
```

There is no test suite configured yet.

### Turbopack vs webpack

`next dev` / `next build` default to Turbopack (Next.js 16 default). Turbopack evaluates the PostCSS/Tailwind loader in a subprocess that binds a local port; inside the Claude Code Bash sandbox this fails with `Operation not permitted (os error 1)` (build) or `listen EPERM` (dev — the sandbox blocks *any* port listen, not just Turbopack's). If you hit either of these, it's the sandbox, not the code:

- For `next build`, fall back with `npx next build --webpack` to verify the app compiles.
- `next dev` cannot bind a port inside the sandbox at all. Ask the user to run it themselves (e.g. `!npm run dev`, which runs outside the sandbox) rather than trying to start it from the Bash tool.

Outside the sandbox (the user's own terminal, or a Vercel build) Turbopack works normally — don't change the default scripts to work around this.

## Architecture

- `src/app/page.tsx` — server component; renders `<TodoApp />`.
- `src/components/todo-app.tsx` — top-level UI (`"use client"`): add form, filter tabs (All/Active/Completed), items-left counter, clear-completed. Renders one `<TodoItem>` per visible todo.
- `src/components/todo-item.tsx` — a single row: checkbox, double-click-to-edit text, delete button. Owns its own edit-mode state (`isEditing`/`draft`) locally; committing/cancelling calls into `src/lib/todos.ts`. The `skipNextBlurCommit` ref exists because pressing Escape unmounts the input, which the browser follows with a native blur — without the flag, that blur would silently re-commit the draft right after a cancel.
- `src/lib/todos.ts` — the data layer and the only place that mutates todos. Todos live in a module-level array acting as an external store (subscribe/getSnapshot/getServerSnapshot), read from and written straight through to `localStorage`. Components read it via `useSyncExternalStore` rather than `useState` + `useEffect`, which avoids both a hydration mismatch (server has no `localStorage`) and the `react-hooks/set-state-in-effect` lint error from calling `setState` synchronously inside a mount effect. `editTodo` deletes the item instead of saving blank text, matching the standard TodoMVC convention.
- No custom web font: `next/font/google` needs network access at build time, which the sandbox doesn't allow, so the app uses the system font stack.

If real persistence (e.g. sync across devices) is added later, `src/lib/todos.ts` is the module to replace — its exported function signatures (`addTodo`, `toggleTodo`, `deleteTodo`, `editTodo`, `clearCompleted`, `subscribe`/`getSnapshot`) are what the components depend on.
