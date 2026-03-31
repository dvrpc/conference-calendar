# Agent Guidelines for conference-calendar-admin

This document provides guidelines and conventions for agents working on this codebase.

## CRITICAL: Always Run Commands in Dev Container

**You MUST execute all commands inside the devcontainer via WSL. Never run npm, git, or other commands directly on Windows.**

Always use this pattern for every command:

```bash
wsl docker exec -i conference-calendar-admin bash -c "cd /workspaces/conference-calendar-admin && <command>"
```

Or connect to the container interactively:

```bash
wsl docker exec -i conference-calendar-admin bash
# Then run commands inside the container
```

## Dev Container Setup

1. Open default WSL and connect to the running container: `wsl docker exec -i conference-calendar-admin bash`
2. Set workspace: `cd /workspaces/conference-calendar-admin`
3. Install dependencies if needed: `npm ci --legacy-peer-deps`

## Project Overview

- **Framework**: React Router v7 (Remix-based full-stack framework)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Bundler**: Vite
- **Runtime**: Node.js with SSR support

## Commands

### Development

```bash
npm run dev          # Start development server with HMR (http://localhost:5173)
```

### Building

```bash
npm run build        # Build for production
npm run start        # Start production server (after build)
```

### Type Checking

```bash
npm run typecheck    # Run TypeScript type checking + React Router type generation
```

### Formatting & Linting

```bash
npm run format       # Format all code with oxfmt
npm run format:check # Check formatting without modifying files
npm run lint         # Run oxlint to verify code quality
npm run lint:fix     # Auto-fix linting issues
```

### Testing

This project does not have a test suite configured. If adding tests:

- Use Vitest as the test runner (consistent with Vite)
- Place test files alongside source files with `.test.ts` or `.test.tsx` suffix
- Run single test: `npx vitest run path/to/test.test.ts`

### Recommended Workflow

```bash
npm run format && npm run lint && npm run typecheck  # Format, lint, then typecheck
```

## Code Style

### oxfmt Configuration

- **Print width**: 100 characters
- **Tab width**: 2 spaces (no tabs)
- **Quotes**: Double quotes
- **Semicolons**: Required
- **Trailing commas**: ES5 style
- **End of line**: LF (Unix style)

### Import Sorting

Imports are automatically sorted by oxfmt:

1. React Router packages (`react-router`, `@react-router/*`)
2. External packages (`@/*`, path aliases `~`)
3. Parent directory imports (`../`)
4. Current directory imports (`./`)

```typescript
// Sorted automatically
import { useState } from "react";
import { Link, Outlet } from "react-router";
import { SomeComponent } from "~/components/some-component";
import type { Route } from "./+types/home";
import "./styles.css";
```

### Tailwind CSS Class Sorting

Tailwind classes are automatically sorted by oxfmt following the official class order:

- Container modifiers (e.g., `container`, `mx-auto`)
- Box model (e.g., `p-4`, `m-2`, `w-full`)
- Layout (e.g., `flex`, `grid`, `hidden`)
- Typography (e.g., `text-sm`, `font-bold`)
- Borders, effects, filters, tables, transitions
- Dark mode variants (`dark:`) are sorted with their corresponding class

### TypeScript Conventions

1. **Strict Mode**: TypeScript strict mode is enabled. Avoid `any`, use proper types.
2. **Explicit Return Types**: Add return types to exported functions for clarity.
3. **Type Imports**: Use `import type` for type-only imports (required due to `verbatimModuleSyntax`).

```typescript
// Correct
import type { Route } from "./+types/root";
// Avoid
import { type Route } from "./+types/root";
import { SomeComponent } from "./component";
```

### Import Conventions

1. **Path Alias**: Use `~` to reference files within the `app` directory:

   ```typescript
   import { Welcome } from "~/welcome/welcome";
   ```

2. **Double Quotes**: Use double quotes for strings consistently.

### Naming Conventions

| Element          | Convention                  | Example                               |
| ---------------- | --------------------------- | ------------------------------------- |
| Files            | kebab-case                  | `home-page.tsx`, `api-utils.ts`       |
| React Components | PascalCase                  | `HomePage`, `ConferenceCard`          |
| Functions        | camelCase                   | `fetchConferences`, `handleSubmit`    |
| Hooks            | camelCase with `use` prefix | `useConferences`, `useAuth`           |
| Constants        | SCREAMING_SNAKE_CASE        | `MAX_ITEMS`, `API_BASE_URL`           |
| Types/Interfaces | PascalCase                  | `Conference`, `UserProfile`           |
| CSS Classes      | Tailwind utilities          | `className="flex items-center gap-4"` |

### oxlint Rules

- **No `any`**: `@typescript-eslint/no-explicit-any` is enforced
- **Unused Variables**: Allowed with underscore prefix (`_varName`) or caught errors
- **Console**: Only `warn` and `error` allowed (no `console.log`)
- **ts-expect-error**: Allowed with description comment

### React Router Patterns

1. **Route Files**: Each route should export:
   - `default` function for the page component
   - `meta` function for meta tags
   - `loader` function for server-side data loading
   - `action` function for form handling
   - `ErrorBoundary` for error handling

2. **Type Generation**: Routes auto-generate types. Import them:

   ```typescript
   import type { Route } from "./+types/home";
   ```

3. **Link Component**: Use React Router's `<Link>` component for client-side navigation.

### Styling with Tailwind CSS

1. **Utility Classes**: Use Tailwind utility classes in `className` props.
2. **Dark Mode**: Support dark mode with `dark:` prefix:
   ```tsx
   <div className="text-gray-700 dark:text-gray-200">
   ```
3. **Responsive Design**: Use breakpoints (`sm:`, `md:`, `lg:`, `xl:`).

### Error Handling

1. **ErrorBoundary**: Export an `ErrorBoundary` component in route files.
2. **Route Errors**: Use `isRouteErrorResponse` to check for 404/500 errors.
3. **Try/Catch**: Wrap async operations in try/catch blocks in loaders and actions.

```typescript
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return <div>{error.statusText}</div>;
  }
  return <div>Something went wrong</div>;
}
```

### File Structure

```
app/
├── auth/              # Authentication routes (login, logout, OAuth callbacks)
│   ├── login.tsx      # Login page with Google OAuth
│   ├── google/        # Google OAuth handlers
│   └── logout.ts      # Session destruction
├── lib/               # Utility functions and helpers
│   ├── session.server.ts  # Session management (getUser, requireUser, requireDvrpcEmail)
│   ├── google.server.ts   # Google OAuth URL & token handling
│   └── constants.ts       # App constants
├── routes/            # Route files (file-based routing via routes.ts)
│   ├── events.tsx           # Events layout (auth check)
│   ├── events._index.tsx   # Dashboard page (/)
│   ├── events.new.tsx       # Create event page (/new)
│   ├── events.$eventId.tsx # Edit event page (/:eventId)
│   └── api.tsx             # API routes (/api)
├── components/        # Shared React components
│   ├── tags-input.tsx # Tag input component
│   └── url-field.tsx  # URL input component
├── styles/            # Global CSS files
├── root.tsx           # Root layout component
└── routes.ts          # Route configuration
```

## Google Calendar Integration

Events use Google Calendar's extended properties to store custom data:

- **Tags**: Up to 4 tags (stored as `tag1` through `tag4`)
- **Committee**: Committee shortcode (stored as `committee`)

The tag input component enforces a maximum of 4 tags with an error message when exceeded.

## Authentication

This project uses Google OAuth for authentication with domain restriction to `@dvrpc.org`.

### Environment Variables

Set up Google OAuth credentials in `.env`:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./key.json
SESSION_SECRET=your-session-secret-at-least-32-characters
```

### Auth Utilities

- `lib/session.server.ts` - Session management with `getUser()`, `requireUser()`, `requireDvrpcEmail()`
- `lib/google.server.ts` - Google OAuth URL generation and token handling

### Protected Routes

To protect a route, use the `requireDvrpcEmail()` function in the loader:

```typescript
export async function loader({ request }: { request: Request }) {
  const user = await requireDvrpcEmail(request);
  return { user };
}
```

### Auth Routes

| Route                   | Purpose                             |
| ----------------------- | ----------------------------------- |
| `/login`                | Login page with Google OAuth button |
| `/auth/google/callback` | OAuth callback handler              |
| `/logout`               | Logout and session destruction      |

## Development Workflow

Always run commands inside the devcontainer using WSL:

```bash
wsl docker exec -i conference-calendar-admin bash -c "cd /workspaces/conference-calendar-admin && npm run format && npm run lint && npm run typecheck"
```

Or run them interactively:

```bash
wsl docker exec -i conference-calendar-admin bash
# Then run: npm run format && npm run lint && npm run typecheck
```

1. **Format**: Run `npm run format` to format code with oxfmt
2. **Lint**: Run `npm run lint` to verify code quality
3. **Type Check**: Run `npm run typecheck` to catch type errors
4. **Build**: Run `npm run build` to create production build

## Configuration Files

| File                     | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `tsconfig.json`          | TypeScript configuration (strict mode, path aliases) |
| `vite.config.ts`         | Vite bundler configuration                           |
| `react-router.config.ts` | React Router framework settings                      |
| `app/routes.ts`          | Route configuration                                  |
| `oxfmtrc.json`           | oxfmt formatting rules                               |
| `oxlintrc.json`          | oxlint linting rules                                 |
