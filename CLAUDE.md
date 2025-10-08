# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the KeepWatching Admin Dashboard, a React-based web application for managing a media tracking service. It provides administrative interfaces for managing accounts, notifications, emails, and viewing content metadata (shows, movies, people).

## Technology Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit with entity adapters
- **UI Framework**: Material-UI (MUI) v6
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Date Handling**: date-fns with MUI Date Pickers

## Development Commands

```bash
# Start development server (runs on port 3005)
yarn dev

# Build for production
yarn build

# Run linter
yarn lint

# Format code with Prettier
yarn format

# Preview production build
yarn preview
```

## Backend Integration

The application connects to a backend API running on `localhost:3001`. The Vite dev server proxies the following routes:
- `/api/*` - Main API endpoints
- `/uploads/*` - Static file uploads

All API calls use axios and follow the pattern `/api/v1/{resource}`.

## Architecture

### State Management

Redux store is configured in `src/app/store.ts` with the following structure:
- **Accounts Slice** (`src/app/slices/accountsSlice.ts`): Manages accounts and their profiles using Redux Toolkit's `createEntityAdapter`. Implements local storage caching to reduce unnecessary API calls. Includes thunks for CRUD operations on accounts and profiles.

Key patterns:
- Entity adapters provide normalized state with automatic CRUD reducers
- Async thunks with `condition` option prevent duplicate requests while loading
- Local storage persistence for accounts to improve performance
- Memoized selectors (`createSelector`) to prevent unnecessary re-renders

### Routing Structure

The app uses nested routing with a shared `Layout` component:
- `/` - Dashboard (service health monitoring)
- `/accounts` - Account management
- `/email` - Email template management
- `/weeklyEmail` - Weekly email configuration
- `/notifications` - Notification management
- `/logs` - System logs viewer
- `/shows` - TV shows list (paginated)
- `/shows/:id` - Show details
- `/movies` - Movies list (paginated)
- `/movies/:id` - Movie details
- `/people` - People list (letter-based navigation + pagination)
- `/people/:id` - Person details

### Component Organization

- `src/components/` - Reusable UI components (Layout, Loading, Error states, Log viewers)
- `src/pages/` - Route-based page components
- `src/app/` - Redux store, slices, hooks, and type utilities
- `src/utils/` - Utility functions (date formatting, image path builders, file size formatting)
- `src/types/` - TypeScript type definitions

### Shared Types

The project depends on `@ajgifford/keepwatching-types` package for shared type definitions between frontend and backend (e.g., `CombinedAccount`, `AdminProfile`, `ServiceHealth`).

### Image Handling

Utility functions in `src/utils/utils.ts` handle TMDB (The Movie Database) image URLs:
- `buildTMDBImagePath()` - Constructs TMDB image URLs with specified sizes
- Falls back to placeholder images via placehold.co when images are unavailable

### Common Patterns

1. **Loading States**: Use `LoadingComponent` from `src/components/loadingComponent.tsx`
2. **Error Handling**: Use `ErrorComponent` from `src/components/errorComponent.tsx`
3. **Data Fetching**: Most pages fetch data directly with axios in `useEffect` hooks
4. **Pagination**: Pages like Shows, Movies, and People handle query parameters for pagination
5. **Gender Formatting**: Use `formatGender()` and `getGenderColor()` from utils for consistent person data display

## Code Style

- ESLint configured with TypeScript and React rules
- Prettier with custom import sorting (`@trivago/prettier-plugin-sort-imports`)
- Strict TypeScript mode enabled
- React 19 uses automatic JSX runtime (no need to import React in components)

## Testing

No test configuration is currently present in the codebase. The eslint config includes jest rules but no test files exist yet.
