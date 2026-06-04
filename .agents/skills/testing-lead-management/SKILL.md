---
name: testing-lead-management
description: Test the CRM Lead Management module end-to-end via browser UI. Use when verifying lead CRUD, search, filters, sorting, notes, or status management changes.
---

# Testing Lead Management Module

## Prerequisites

- PostgreSQL running locally with seeded data (`npm run db:seed`)
- Dev server running (`npm run dev`) on `http://localhost:3000`
- Clerk auth bypassed (see below)

## Clerk Auth Bypass for Testing

Clerk validates the publishable key in edge middleware BEFORE checking route matchers. With placeholder test keys (`pk_test_placeholder`), ALL routes return 500 — even routes marked as public.

**Workaround:** Temporarily replace three files for testing:

1. **`src/middleware.ts`** — Replace Clerk middleware with a passthrough:
   ```ts
   import { NextResponse } from 'next/server';
   export default function middleware() { return NextResponse.next(); }
   export const config = { matcher: [/* keep existing matcher */] };
   ```

2. **`src/app/layout.tsx`** — Remove `<ClerkProvider>` wrapper, keep `<QueryProvider>`

3. **`src/components/layout/header.tsx`** — Remove `<UserButton />`, replace with placeholder text

**Important:** Back up originals before modifying (e.g., `cp file file.bak`). Restore after testing. Do NOT commit these temporary changes.

Alternatively, if real Clerk test keys are available as Devin secrets, use those instead of bypassing.

## Devin Secrets Needed

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Real Clerk publishable key (avoids needing auth bypass)
- `CLERK_SECRET_KEY` — Real Clerk secret key

If these are not available, use the bypass method above.

## Test Data

The seed script (`prisma/seed.ts`) creates 3 leads:

| Title | Status | Source | Value | Contact |
|-------|--------|--------|-------|---------|
| GreenEnergy platform evaluation | QUALIFIED | REFERRAL | 75000 | Carla Davis |
| Consulting partnership opportunity | CONTACTED | SOCIAL_MEDIA | 15000 | Dan Wilson |
| Inbound demo request — unknown company | NEW | WEBSITE | 50000 | (none) |

To reset test data: `npx prisma db push --force-reset && npm run db:seed`

## Key Test Flows

1. **List page** (`/leads`): Verify 3 leads, columns (title, status badge, source, contact, value, date, actions)
2. **Create**: Click "New Lead" button → fill form → submit → verify new row in table
3. **Search**: Type in search box, wait 300ms+ for debounce, verify filtered results and URL param
4. **Filters**: Status and Source dropdowns filter leads, URL params update
5. **Detail page** (`/leads/[id]`): Click lead title → verify all fields, sidebar sections
6. **Status change**: On detail page, use status dropdown → verify badge updates
7. **Notes**: On detail page, type note → click Send → note might not auto-refresh (see known issues) → reload to verify
8. **Edit**: Click Edit button/menu → dialog pre-fills → change fields → save → verify updates
9. **Delete**: Click Delete → confirmation dialog with lead name → confirm → redirects to list
10. **Sorting**: Click column headers (Title, Status, Value, Created) → verify order toggles

## Known Issues / Quirks

- **Notes don't auto-refresh:** After adding a note via the Send button, the notes list and count don't update until page reload. The POST succeeds (check server logs), but the client state doesn't re-fetch. This might be fixed in a future update.
- **React form value setting:** When using browser automation to edit form fields, the native `input` event with React's internal value setter is needed to update React-controlled inputs. Simple `.value = x` assignment won't propagate to React state. Use:
  ```js
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, newValue);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  ```
- **Search debounce:** The search input has a 300ms debounce. When testing, wait at least 300ms after typing before checking results.
- **Empty value field on edit:** Clearing the Value (USD) field and saving should store null (displayed as "-"). This was a previous bug (parseFloat("") = NaN) that has been fixed.
