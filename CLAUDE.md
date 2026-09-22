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

### Git and `gh` operations

Any write under `.git` (`git init`, `git add`, `git commit`, ...) is blocked in this sandbox with `Operation not permitted` — and this is *not* limited to the Bash tool: the user re-ran the same command with a `!` prefix (which normally executes outside the sandbox) and hit the identical error, so `.git` writes are blocked for this session no matter how the command is invoked. `gh` calls that touch the network/Keychain (e.g. `gh api`, `gh repo view`) fail from the Bash tool too, with `tls: failed to verify certificate: x509: OSStatus -26276` — that one *does* work via `!`, since it's Keychain access, not a `.git` write.

Practical upshot: don't attempt `git init`/`add`/`commit`/`push` or `gh repo create` yourself, even via `!`. Ask the user to open a plain terminal window that isn't running Claude Code at all (Terminal.app, iTerm2, ...) and run the commands there. Afterwards, `git status` / `git log` / `git remote -v` all read fine from the Bash tool — use those to verify what the user did rather than re-running write commands to check.

## Deployment

Deployed as a static site to GitHub Pages via `.github/workflows/deploy-pages.yml`, which builds on every push to `master` and publishes through the standard `actions/upload-pages-artifact` + `actions/deploy-pages` flow (no `gh-pages` branch).

- `next.config.ts` sets `output: "export"` (the app is 100% client-side — no API routes, no Server Actions — so static export is a clean fit) plus `basePath`/`assetPrefix` of `/todo`, gated behind a `GITHUB_PAGES` env var the workflow sets before building. Local `npm run dev`/`npm run build` are unaffected (no basePath) since that var isn't set outside CI.
- `public/.nojekyll` exists so GitHub Pages' Jekyll processing doesn't swallow the `_next/` output directory (Jekyll ignores underscore-prefixed paths by default). It gets copied into `out/` automatically since Next.js copies `public/` verbatim into the export root.
- **GitHub Pages requires GitHub Pro/Team/Enterprise for a private repository.** If the repo is on the Free plan and private, Pages must be enabled by making the repo public first (Settings → General → Danger Zone), or the account needs to upgrade.
- One-time manual step (can't be done from here — needs the GitHub UI or `gh` run by the user outside this session): Settings → Pages → Build and deployment → Source → "GitHub Actions".

## Architecture

- `src/app/page.tsx` — server component; renders `<TodoApp />`.
- `src/components/todo-app.tsx` — top-level UI (`"use client"`): add form, filter tabs (All/Active/Completed), items-left counter, clear-completed. Renders one `<TodoItem>` per visible todo.
- `src/components/todo-item.tsx` — a single row: checkbox, double-click-to-edit text, delete button. Owns its own edit-mode state (`isEditing`/`draft`) locally; committing/cancelling calls into `src/lib/todos.ts`. The `skipNextBlurCommit` ref exists because pressing Escape unmounts the input, which the browser follows with a native blur — without the flag, that blur would silently re-commit the draft right after a cancel.
- `src/lib/todos.ts` — the data layer and the only place that mutates todos. Todos live in a module-level array acting as an external store (subscribe/getSnapshot/getServerSnapshot), read from and written straight through to `localStorage`. Components read it via `useSyncExternalStore` rather than `useState` + `useEffect`, which avoids both a hydration mismatch (server has no `localStorage`) and the `react-hooks/set-state-in-effect` lint error from calling `setState` synchronously inside a mount effect. `editTodo` deletes the item instead of saving blank text, matching the standard TodoMVC convention.
- No custom web font: `next/font/google` needs network access at build time, which the sandbox doesn't allow, so the app uses the system font stack.

If real persistence (e.g. sync across devices) is added later, `src/lib/todos.ts` is the module to replace — its exported function signatures (`addTodo`, `toggleTodo`, `deleteTodo`, `editTodo`, `clearCompleted`, `subscribe`/`getSnapshot`) are what the components depend on.
