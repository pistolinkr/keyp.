# Keyp.

Keyp. is a bilingual knowledge community UI prototype focused on long-form posts, structured discussion, and season-based content curation.

## Features

- Bilingual interface (`KO` / `EN`) with global language synchronization
- Light/Dark theme support with design tokens
- Feed sorting (`latest`, `trending`, `top`) and category/season filters
- Post detail pages with threaded comments and AI assistant panel
- Profile, search, season archive, and editor screens

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Wouter for routing
- Radix UI primitives

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Install

```bash
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

### Type Check

```bash
pnpm check
```

### Build

```bash
pnpm build
```

## Project Structure

- `client/`: frontend app
- `server/`: backend entrypoint
- `shared/`: shared constants/types
- `supabase/`: Supabase local metadata/config

## License

This project is licensed under the MIT License. See `LICENSE` for details.
