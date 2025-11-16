# KeepWatching Admin Dashboard

A React-based administrative dashboard for managing the KeepWatching media tracking service. This application provides comprehensive interfaces for managing user accounts, notifications, email templates, and viewing content metadata including shows, movies, and people.

## Technology Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit with entity adapters
- **UI Framework**: Material-UI (MUI) v6
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Date Handling**: date-fns with MUI Date Pickers

## Prerequisites

- Node.js (v18 or higher recommended)
- Yarn package manager
- Backend API server running on `localhost:3001`

## Installation

```bash
# Install dependencies
yarn install
```

## Development

```bash
# Start development server (runs on port 3005)
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview

# Run linter
yarn lint

# Format code with Prettier
yarn format
```

The development server will be available at `http://localhost:3005`.

## Backend Integration

The application connects to a backend API running on `localhost:3001`. The Vite dev server automatically proxies the following routes:
- `/api/*` - Main API endpoints
- `/uploads/*` - Static file uploads

All API calls follow the pattern `/api/v1/{resource}`.

## Project Structure

```
src/
├── app/                    # Redux store configuration
│   ├── store.ts           # Store setup
│   ├── hooks.ts           # Typed Redux hooks
│   ├── withTypes.ts       # Redux type utilities
│   └── slices/            # Redux slices
│       └── accountsSlice.ts
├── components/            # Reusable UI components
│   ├── layout.tsx
│   ├── logEntryViewer.tsx
│   ├── truncatedLogContent.tsx
│   └── statistics/
├── pages/                 # Route-based page components
│   ├── dashboard.tsx
│   ├── accounts.tsx
│   ├── accountDetails.tsx
│   ├── email.tsx
│   ├── weeklyEmail.tsx
│   ├── notifications.tsx
│   ├── logs.tsx
│   ├── shows.tsx
│   ├── showDetails.tsx
│   ├── movies.tsx
│   ├── movieDetails.tsx
│   ├── people.tsx
│   ├── personDetails.tsx
│   └── statistics.tsx
├── types/                 # TypeScript type definitions
│   └── contentTypes.ts
└── utils/                 # Utility functions
```

## Key Features

### Dashboard
- Real-time service health monitoring
- System status overview

### Account Management
- View and manage user accounts
- Profile management with local storage caching
- Account statistics and analytics

### Email Management
- Email template editor
- Weekly email configuration
- Email recipient management

### Notifications
- Notification system management
- Account notification preferences

### Content Browser
- **Shows**: Paginated TV show listings with detailed views
- **Movies**: Paginated movie listings with detailed views
- **People**: Browse cast and crew with letter-based navigation

### System Logs
- Comprehensive log viewing
- Truncated log content display

## State Management

The application uses Redux Toolkit for state management with the following patterns:
- Entity adapters for normalized state with automatic CRUD reducers
- Async thunks with condition checking to prevent duplicate requests
- Local storage persistence for improved performance
- Memoized selectors to prevent unnecessary re-renders

## Routing

The application uses React Router v7 with nested routing and a shared Layout component. Available routes:

- `/` - Dashboard (service health)
- `/accounts` - Account management
- `/email` - Email templates
- `/weeklyEmail` - Weekly email configuration
- `/notifications` - Notification management
- `/logs` - System logs
- `/shows` - TV shows (paginated)
- `/shows/:id` - Show details
- `/movies` - Movies (paginated)
- `/movies/:id` - Movie details
- `/people` - People (letter navigation + pagination)
- `/people/:id` - Person details

## Code Style

- ESLint configured with TypeScript and React rules
- Prettier with custom import sorting (`@trivago/prettier-plugin-sort-imports`)
- Strict TypeScript mode enabled
- React 19 automatic JSX runtime (no need to import React in components)

## Image Handling

The application uses utility functions to handle TMDB (The Movie Database) images:
- `buildTMDBImagePath()` - Constructs TMDB image URLs with specified sizes
- Automatic fallback to placeholder images via placehold.co when images are unavailable

## Dependencies

### Shared Packages
- `@ajgifford/keepwatching-types` - Shared TypeScript types between frontend and backend

### Key Libraries
- `@mui/material` - Material-UI components
- `@reduxjs/toolkit` - State management
- `react-router` - Routing
- `axios` - HTTP client
- `date-fns` - Date manipulation

## License

Private repository - All rights reserved
