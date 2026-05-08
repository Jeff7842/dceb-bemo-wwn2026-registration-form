# DCEB Worship Event — Registration System

A full-stack web application for managing attendee registration for a worship event. Built with Next.js 16, React 19, and a Neon PostgreSQL database. The UI follows a **Celestial Minimalist** design language with full light/dark mode support.

---

## What This App Does

The system has three main areas:

1. **Registration Form** (`/`) — Anyone can register for the event by filling out their name, phone number, email, country/region, church, and role (Member, Pastor, or Staff). Staff members are additionally asked to select their serving area. Submissions are saved to a PostgreSQL database.

2. **Data Dashboard** (`/data`) — A password-protected page for staff/admins to see total registration stats (total members, pastors, and staff), a recent registrations table, and export the full list to **PDF** or **Excel**.

3. **Search & Manage** (`/search`) — A searchable, filterable view of all registrants. Admins can also **edit** or **soft-delete** records directly from this page.

---

## File Structure

```
registration-form/
│
├── app/                        # Next.js App Router pages and API routes
│   ├── page.tsx                # Main registration form (the homepage)
│   ├── layout.tsx              # Root layout: fonts, providers, dark mode init
│   ├── globals.css             # Full design system (CSS variables, utility classes)
│   │
│   ├── data/
│   │   ├── login/page.tsx      # Staff login page (password-protected)
│   │   └── page.tsx            # Admin dashboard: stats, recent registrations, export
│   │
│   ├── search/
│   │   └── page.tsx            # Search & manage registrants (filter, edit, delete)
│   │
│   └── api/                    # Backend API routes (Next.js Route Handlers)
│       ├── register/route.ts   # POST: submit a new registration (with duplicate guard)
│       ├── churches/route.ts   # GET: fetch the list of churches from the DB
│       ├── members/
│       │   ├── route.ts        # GET: fetch all members (with filters)
│       │   └── [id]/route.ts   # PATCH: edit a member | DELETE: soft-delete a member
│       ├── admin/route.ts      # POST: validate admin password, create session
│       ├── send-email/route.ts # POST: send confirmation email via Resend
│       ├── init/route.ts       # GET: initialize/seed the database tables
│       └── join/route.ts       # POST: alternate join endpoint (reserved)
│
├── components/                 # Reusable UI components
│   ├── Header.tsx              # Top nav bar: links, dark mode toggle, mobile menu
│   ├── ChurchDropdown.tsx      # Searchable church selector (fetches from API)
│   ├── PhoneInput.tsx          # Phone input with country code selector
│   ├── SearchableDropdown.tsx  # Generic searchable dropdown (used for country/region)
│   ├── DeleteModal.tsx         # Confirmation modal for deleting a record
│   └── Nav.tsx                 # Minimal nav (used in some inner pages)
│
├── lib/                        # Shared utilities and configuration
│   ├── db.ts                   # Neon serverless database client setup
│   ├── churches.ts             # Static lists: serving areas, East African countries
│   ├── theme-context.tsx       # React context for light/dark theme state
│   ├── providers.tsx           # Wraps app in QueryClient + ThemeProvider + Toaster
│   └── resend.ts               # Resend email client + email template
│
├── public/                     # Static assets and design reference files
│
├── .env.local                  # Environment variables (not committed to git)
├── package.json                # Dependencies and scripts
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── postcss.config.mjs          # Tailwind CSS v4 PostCSS setup
```

---

## How It Works

### Registration Flow
1. A user opens the homepage and fills out the form.
2. On submit, the form is validated client-side using **Zod** and **react-hook-form**.
3. The data is sent to `POST /api/register`, which checks for duplicates (by phone number) and inserts the record into the `members` table in Neon PostgreSQL.
4. A confirmation email is optionally sent via the **Resend** API.
5. **Offline support**: if the user has no internet, the submission is saved to `localStorage`. When the connection returns, queued submissions are automatically drained and sent.

### Admin Authentication
- Admins visit `/data/login` and enter the password defined in `NEXT_PUBLIC_ADMIN_PASSWORD`.
- On success, the session is saved to `localStorage` and the user is redirected to `/data`.
- The `/search` page also reads this session to enable edit/delete actions.

### Data Dashboard
- Stats (total members, pastors, staff) are calculated from the database.
- The recent registrations table is powered by **TanStack Query** for live data fetching.
- Export buttons generate a formatted **PDF** (via jsPDF + autoTable) or **Excel** file (via xlsx) directly in the browser.

### Search & Manage
- Registrants can be filtered by first-letter, role, country/region, and church.
- Admins can click any row to edit fields inline, with changes saved via `PATCH /api/members/[id]`.
- Deleting a record moves it to a `deleted_records` table and logs the action to `audit_log` (soft delete).

### Design System
- All colours, spacing, and component styles are defined as **CSS custom properties** in `globals.css`.
- Light and dark themes are toggled via `ThemeContext` and applied by adding/removing the `dark` class on `<html>`.
- The theme preference is persisted in `localStorage` so it survives page reloads.
- Utility classes like `card`, `input-base`, `btn-primary`, `badge`, `stat-card`, and `seg-btn` are used throughout for consistency.

---

## Database Tables

| Table | Purpose |
|---|---|
| `members` | All registered attendees |
| `churches` | List of churches shown in the dropdown |
| `admin_sessions` | Active admin login sessions |
| `audit_log` | Record of every edit/delete action |
| `deleted_records` | Soft-deleted member records |

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL=your_neon_postgres_connection_string
NEXT_PUBLIC_ADMIN_PASSWORD=Jesus@WWN2026
RESEND_API_KEY=your_resend_api_key        # optional, for confirmation emails
```

### 3. Initialize the database

With the app running, visit `http://localhost:3000/api/init` once to create all tables.

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the registration form.

---

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| Next.js | 16.2.6 | Framework (App Router) |
| React | 19 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| Zod | 4 | Schema validation |
| react-hook-form | 7 | Form state management |
| TanStack Query | 5 | Data fetching & caching |
| Neon Serverless | 1 | PostgreSQL database |
| jsPDF + autoTable | 4/5 | PDF export |
| xlsx | 0.18 | Excel export |
| Resend | 6 | Transactional email |
| Sonner | 2 | Toast notifications |
| date-fns | 4 | Date formatting |
| Iconify | 6 | Icons |

---

## Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Run production build
pnpm lint     # Run ESLint
```
