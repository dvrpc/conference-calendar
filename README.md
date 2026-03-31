# DVRPC Events Calendar

This application provides an admin interface to add extended properties (committee and tags) to two Google Calendars: DVRPC Public Events and DVRPC Partner Events. Google OAuth is required to access the applications. In order to use this application, users must be granted permissions to Make Changes to Events on both calendars.

The application also provides a public API to each Google Calendar separately or combined. The API uses a service account API key with Read-Only Google Calendar permissions. The Google Calendars must have the service account with View Event Details permissions.

## Public API Endpoints

_GET /api_

| Param        | Type   | Default   | Description                                                      |
| ------------ | ------ | --------- | ---------------------------------------------------------------- |
| `calendar`   | string | "primary" | Which calendar to fetch: `primary`, `partners`, or `combined`    |
| `maxResults` | number | 1000      | Limit of events to return. If `combined`, this value is doubled. |
| `timeMin`    | string | -         | Filter events after this date (ISO 8601 format)                  |
| `timeMax`    | string | -         | Filter events before this date (ISO 8601 format)                 |
| `committee`  | string | -         | Filter by committee field (stored as committee shortcodes)       |
| `tags`       | string | -         | Filter by comma-separated list of tags                           |

## Set up

This project uses a devcontainer running in WSL Docker. All commands must be executed inside the container.

### Prerequisites

- Windows with WSL2 installed
- Docker Desktop with WSL2 integration enabled (if Docker is not installed by VS Code)
- Visual Studio Code with Dev Containers extension

### Quick Start (VSCode)

1. Open the project folder in VSCode
2. Install the **Dev Containers** extension (ms-vscode-remote.remote-containers)
3. Click "Reopen in Container" when prompted (or press `F1` → "Dev Containers: Reopen in Container")
4. Wait for the container to build and start (this runs `npm ci` automatically)
5. **Reload the window** if the oxc extension shows errors (known issue: extension doesn't auto-activate until reload)

> **Tip**: If you see "No valid oxlint binary found", press `F1` → "Developer: Reload Window"

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the required environment variables (see below)

### Build & Run

```bash
# Build the application
npm run build

# Start production server
npm run start
```

For development with HMR:

```bash
npm run typecheck
npm run dev
```

## Environment Variables

| Variable                          | Description                                                           |
| --------------------------------- | --------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`                | Google OAuth Client ID                                                |
| `GOOGLE_CLIENT_SECRET`            | Google OAuth Client Secret                                            |
| `GOOGLE_REDIRECT_URI`             | OAuth redirect URI (e.g., http://localhost:5173/auth/google/callback) |
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Path to Google service account key file (e.g., ./key.json)            |
| `SESSION_SECRET`                  | Random 32+ character string for session encryption                    |
| `VITE_BASE`                       | Base URL for the application (optional, defaults to "/")              |

## Development

### VSCode Development

1. Open the project in VSCode (already opened in devcontainer)
2. Press `F1` → "Dev Containers: Reopen in Container" if needed
3. Run the recommended workflow in the integrated terminal

### Recommended Workflow

Run these commands in the container terminal before committing:

```bash
npm run format && npm run typecheck && npm run lint:fix
```

### Available Scripts

| Command                | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | Start development server with HMR (http://localhost:5173)   |
| `npm run build`        | Build for production                                        |
| `npm run start`        | Start production server                                     |
| `npm run typecheck`    | Run TypeScript type checking + React Router type generation |
| `npm run format`       | Format code with oxfmt                                      |
| `npm run format:check` | Check formatting without modifying                          |
| `npm run lint`         | Run oxlint to verify code quality                           |
| `npm run lint:fix`     | Auto-fix linting issues                                     |

### AI Agents

Detailed project structure and rules for development are provided in AGENTS.md.

> **Important**: When working with AI agents, always ensure commands are run inside the devcontainer using WSL. Never run npm, git, or other commands directly on Windows.
