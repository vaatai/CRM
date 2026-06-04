# CRM SaaS

A production-grade CRM SaaS application built with modern web technologies.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) patterns
- **State Management**: [Zustand](https://zustand.docs.pmnd.rs/) (client) + [React Query](https://tanstack.com/query) (server)
- **Deployment**: Railway / Docker

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 16+ (or use Docker)
- Clerk account ([sign up](https://dashboard.clerk.com/))

### 1. Clone & Install

```bash
git clone https://github.com/vaatai/CRM.git
cd CRM
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your Clerk keys from [Clerk Dashboard](https://dashboard.clerk.com/).

### 3. Database Setup

**With Docker (recommended):**

```bash
docker compose up db -d
```

**Then generate Prisma client and push schema:**

```bash
npm run db:generate
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker

Run the full stack (app + PostgreSQL):

```bash
docker compose up --build
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/        # Protected dashboard pages
│   │   ├── dashboard/      # Main dashboard
│   │   └── profile/        # User profile management
│   ├── api/                # API route handlers
│   │   ├── health/         # Health check endpoint
│   │   └── users/me/       # Current user endpoint
│   ├── error.tsx           # Global error boundary
│   ├── loading.tsx         # Global loading state
│   ├── not-found.tsx       # 404 page
│   ├── layout.tsx          # Root layout (Clerk + React Query)
│   └── page.tsx            # Landing page
├── components/
│   ├── layout/             # Sidebar, Header
│   ├── providers/          # React Query provider
│   └── ui/                 # Reusable UI components
├── config/                 # App configuration
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities (Prisma, logger, errors, API helpers)
├── store/                  # Zustand stores
├── types/                  # TypeScript type definitions
└── middleware.ts           # Clerk auth middleware
prisma/
└── schema.prisma           # Database schema
```

## Scripts

| Command                | Description              |
| ---------------------- | ------------------------ |
| `npm run dev`          | Start dev server         |
| `npm run build`        | Production build         |
| `npm run start`        | Start production server  |
| `npm run lint`         | Run ESLint               |
| `npm run format`       | Format with Prettier     |
| `npm run format:check` | Check formatting         |
| `npm run typecheck`    | TypeScript type checking |
| `npm run db:generate`  | Generate Prisma client   |
| `npm run db:push`      | Push schema to database  |
| `npm run db:migrate`   | Run migrations           |
| `npm run db:studio`    | Open Prisma Studio       |

## API Endpoints

| Method | Path            | Auth | Description          |
| ------ | --------------- | ---- | -------------------- |
| GET    | `/api/health`   | No   | Health check         |
| GET    | `/api/users/me` | Yes  | Current user profile |

## Architecture

- **Authentication**: Clerk middleware protects all routes except `/`, `/sign-in`, `/sign-up`, and `/api/health`
- **Error handling**: Custom `AppError` hierarchy with structured JSON API responses
- **Logging**: Structured logger with configurable log levels (debug/info/warn/error)
- **API pattern**: Route handlers use `successResponse`/`errorResponse` helpers for consistent responses
- **State**: Zustand for client-side UI state (sidebar), React Query for server state
