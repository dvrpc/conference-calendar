# Agent Guidelines for conference-calendar-admin

## CRITICAL: Run All Commands in Dev Container

Never run `npm`, `git`, or other commands directly on Windows. Always execute inside the devcontainer via WSL:

```bash
wsl docker exec -i conference-calendar-admin bash -c "cd /workspaces/conference-calendar-admin && <command>"
```

Or connect interactively:

```bash
wsl docker exec -i conference-calendar-admin bash
cd /workspaces/conference-calendar-admin
npm ci --legacy-peer-deps  # install deps if needed
```

## Project Overview

- **Framework**: React Router v8 (Remix-based full-stack framework, SSR enabled)
- **Language**: TypeScript 7 (strict mode, `verbatimModuleSyntax`)
- **Styling**: Tailwind CSS v4 (CSS-first config with `@import "tailwindcss"`)
- **Bundler**: Vite 8
- **Formatter**: oxfmt (not Prettier)
- **Linter**: oxlint (not ESLint)

## Commands

All commands must run inside the devcontainer (see above). The full workflow:

```bash
npm run format && npm run lint && npm run typecheck
```

| Command                | Purpose                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| `npm run dev`          | Start dev server with HMR (`--host` flag, accessible on `localhost:5173`) |
| `npm run build`        | Production build                                                          |
| `npm run start`        | Production server (uses `node --env-file=.env`, requires build first)     |
| `npm run typecheck`    | React Router type generation + `tsc`                                      |
| `npm run format`       | Format all code with oxfmt (`--write .`)                                  |
| `npm run format:check` | Check formatting without modifying files                                  |
| `npm run lint`         | Run oxlint                                                                |
| `npm run lint:fix`     | Auto-fix linting issues                                                   |

## File Structure

```
app/
├── auth/
│   ├── login.tsx              # Login page with Google OAuth button
│   ├── google/callback.ts     # OAuth callback handler (server-only)
│   └── logout.ts              # Session destruction
├── components/
│   ├── tags-input.tsx         # Freeform tag input, max 4 tags
│   └── url-field.tsx          # URL input that parses <a> tags
├── lib/
│   ├── constants.ts           # baseUrl(), AVAILABLE_TAGS, AVAILABLE_COMMITTEES
│   ├── google.server.ts       # Google Calendar API + OAuth + Service Account (494 lines)
│   └── session.server.ts      # Cookie session management (User, getUser, requireDvrpcEmail)
├── routes/
│   ├── events.tsx             # Events layout (auth check via getUser, NOT requireDvrpcEmail)
│   ├── events._index.tsx      # Dashboard - event listing with pagination
│   ├── events.new.tsx         # Create event page
│   ├── events.$eventId.tsx    # Edit event page
│   └── api.tsx                # Public API (read-only, no auth, uses service account)
├── app.css                    # Tailwind v4 import + custom theme
├── root.tsx                   # Root layout + ErrorBoundary
└── routes.ts                  # Route configuration
```

## Key Architecture

### Routing & URL Prefix

All routes are served under the `VITE_BASE` prefix (default: `/events/`). The `baseUrl()` helper in `lib/constants.ts` constructs correct paths:

```typescript
import { baseUrl } from "~/lib/constants";
// baseUrl("/new") → "/events/new"
```

Route hierarchy: `events.tsx` is a layout wrapping `_index`, `new`, and `$eventId`. The `api` route is separate (no layout, no auth).

### Authentication Strategy

Two auth patterns are used:

1. **`events.tsx` layout**: Calls `getUser()` (non-enforcing). If no user, renders a login prompt instead of redirecting. Child routes handle their own auth.
2. **Child routes** (`_index`, `new`, `$eventId`): Each calls `requireDvrpcEmail()` in their loader, which redirects to `/login` if unauthenticated or enforces `@dvrpc.org` domain.
3. **`api.tsx`**: No user auth. Uses a Google service account for read-only calendar access.

### Google Calendar Integration

**Two calendars:**

- `primary`: Main Conference Room
- `partners`: External Partners

**Extended properties** (stored in Google Calendar's `private` extended properties):

- `tag1` through `tag4`: Event tags (max 4)
- `committee`: Committee shortcode

**Available committees** (from `lib/constants.ts`):

| Code     | Name                                      |
| -------- | ----------------------------------------- |
| `BOARD`  | The DVRPC Board                           |
| `RTC`    | Regional Technical Committee              |
| `PPTF`   | Public Participation Task Force           |
| `DVGMTF` | Delaware Valley Goods Movement Task Force |
| `IREG`   | Information Resources Exchange Group      |
| `TOTF`   | Transportation Operations Task Force      |
| `RSTF`   | Regional Safety Task Force                |

**`AVAILABLE_TAGS`** is currently an empty array (`[]`). The tags system is structurally present but has no predefined suggestions.

### Dual Auth in `lib/google.server.ts`

- **User OAuth**: For admin actions (create/update events). Access + refresh tokens stored in session cookie.
- **Service Account**: For the public API (read-only). Reads `key.json` from disk, signs JWT with RS256.

## Code Style

### oxfmt Configuration (`.oxfmtrc.json`)

- Print width: 100, tab width: 2, double quotes, semicolons required
- ES5 trailing commas, LF line endings
- Imports auto-sorted: React Router packages → external → parent → sibling → index → styles
- Tailwind classes auto-sorted (supports `clsx`, `cn`, `tw`, `cva`)

### TypeScript Conventions

1. **Strict mode** enabled. Avoid `any`.
2. **`verbatimModuleSyntax`** requires `import type` for type-only imports:
   ```typescript
   import type { Route } from "./+types/home"; // correct
   import { type Route } from "./+types/home"; // avoid
   ```
3. **Path alias**: Use `~` to reference files within `app/`:
   ```typescript
   import { SomeComponent } from "~/components/some-component";
   ```

### Naming Conventions

| Element          | Convention           | Example                            |
| ---------------- | -------------------- | ---------------------------------- |
| Files            | kebab-case           | `home-page.tsx`, `api-utils.ts`    |
| React Components | PascalCase           | `HomePage`, `ConferenceCard`       |
| Functions        | camelCase            | `fetchConferences`, `handleSubmit` |
| Hooks            | `use` prefix         | `useConferences`, `useAuth`        |
| Constants        | SCREAMING_SNAKE_CASE | `MAX_ITEMS`, `API_BASE_URL`        |
| Types            | PascalCase           | `Conference`, `UserProfile`        |

### oxlint Rules (`.oxlintrc.json`)

- **No `any`**: `@typescript-eslint/no-explicit-any` is enforced
- **Unused variables**: Allowed with `_` prefix or caught errors
- **Console**: Only `warn` and `error` allowed
- **`ts-expect-error`**: Allowed with description comment

## React Router Patterns

Route files export:

- `default` — Page component
- `meta` — Meta tags
- `loader` — Server-side data loading
- `action` — Form handling
- `ErrorBoundary` — Error handling

**Type generation**: Import auto-generated types from `./+types/<route>`:

```typescript
import type { Route } from "./+types/events.new";

export async function loader({ request }: Route.LoaderArgs) { ... }
export async function action({ request }: Route.ActionArgs) { ... }
```

**Error boundary pattern**:

```typescript
import { isRouteErrorResponse } from "react-router";

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return <div>{error.statusText}</div>;
  }
  return <div>Something went wrong</div>;
}
```

## Styling

- Use Tailwind utility classes in `className` props
- Dark mode with `dark:` prefix
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`

## Authentication

This project uses Google OAuth restricted to `@dvrpc.org`.

### Environment Variables (`.env`)

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./key.json
SESSION_SECRET=your-session-secret-at-least-32-characters
VITE_BASE=/events/
```

### Auth Utilities

- `lib/session.server.ts`: `getUser()`, `requireUser()`, `requireDvrpcEmail()`, `createUserSession()`, `logout()`
- `lib/google.server.ts`: `getGoogleAuthURL()`, `getGoogleUserFromCode()`, `refreshAccessToken()`

### Auth Routes

| Route                   | Purpose                                 |
| ----------------------- | --------------------------------------- |
| `/login`                | Login page with Google OAuth button     |
| `/auth/google/callback` | OAuth callback handler                  |
| `/logout`               | Destroys session, redirects to `/login` |

## Plugins

| Plugin | Source | Purpose |
| ------ | ------ | ------- |
| `superpowers` | `git+https://github.com/obra/superpowers.git` | Enhanced agent capabilities and skills |

## Configuration Files

| File                     | Purpose                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `tsconfig.json`          | TypeScript config (strict, `~/*` path alias)                                          |
| `vite.config.ts`         | Vite config (Tailwind v4 plugin, React Router plugin, polling-based watch for Docker) |
| `react-router.config.ts` | React Router config (`ssr: true`, `basename: VITE_BASE`)                              |
| `app/routes.ts`          | Route configuration (layout + flat routes)                                            |
| `.oxfmtrc.json`          | oxfmt formatting rules                                                                |
| `.oxlintrc.json`         | oxlint linting rules                                                                  |
| `.env.example`           | Template for environment variables                                                    |
