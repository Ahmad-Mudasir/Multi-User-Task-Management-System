## Multi‑User Task Management System

This repository contains my implementation of the **Multi‑User Task Management System** take‑home.  
The goal was to design and build a **simple but production‑grade collaborative task board** with:

- **Multi‑tenant companies/workspaces**
- **Projects** per company
- A **Kanban board** per project
- **Shared task timers** that support multiple concurrent users
- **Near real‑time updates** of task state and timers across users

My focus was on **correct shared state handling, clear architecture, and maintainable code**, rather than over‑engineering.

---

## How to run the app

### 1. Install dependencies

From the `task-manager` folder:

```bash
npm install
```

### 2. Configure environment

Create `.env.local` (or reuse the existing one) based on `.env.example`:

```bash
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=long_random_string_at_least_32_chars
```

- **`MONGODB_URI`**: any MongoDB instance (local or Atlas).  
  Mongo will **create the database automatically on first write**.
- **`JWT_SECRET`**: long random string used to sign session tokens.

### 3. Start the dev server

```bash
npm run dev
```

Then open `http://localhost:3000`.

### 4. Basic usage flow

1. Visit `/register` and create an account (name, email, password, company name).
2. You will be redirected to `/app` (company workspace).
3. Create a project and click into it to open the Kanban board.
4. Add tasks and use **drag & drop** and **Start timer / Stop** buttons.
5. Open another browser window and log in with another user in the same company to see **shared timers and updates**.

---

## High‑level architecture

### Frontend

- **Framework**: `Next.js 16` with the **App Router** and TypeScript.
- **Styling**: `Tailwind CSS v4` with a clean, minimal dark UI.
- **State**:
  - Server components for data fetching and routing.
  - Client components for interactive pieces (auth forms, Kanban board).
  - Local React state for optimistic updates on drag‑and‑drop and timers.
- **Real‑time behavior**:  
  A small **polling loop** refreshes the board every few seconds from the server to keep multiple users in sync.  
  (See “Real‑time synchronization approach” below for trade‑offs and evolution path to WebSockets.)

### Backend

- **Runtime**: Next.js API routes under `src/app/api`.
- **Database**: MongoDB via **Mongoose**.
- **Validation**: **Zod** for environment config and request payloads.
- **Auth**:
  - Simple **email/password** auth.
  - Passwords hashed with **bcrypt**.
  - Sessions stored as **signed JWTs in httpOnly cookies**.

---

## Project structure (frontend vs backend)

The app is intentionally organized so that **frontend UI** and **backend logic** are easy to find and reason about.

### Frontend‑focused folders

- **`src/app`**
  - `layout.tsx`: Root layout (fonts, global background shell).
  - `page.tsx`: Root route – immediately redirects to `/register` for new users, or `/app` for authenticated users.
  - `(auth)/`: Auth routes and layout.
    - `(auth)/layout.tsx`: Full‑screen marketing/auth layout (TaskFlow hero, login/register nav, two‑column design).
    - `(auth)/login/page.tsx`: Login page shell (heading + description, uses `LoginForm`).
    - `(auth)/register/page.tsx`: Register page shell (heading + description, uses `RegisterForm`).
  - `app/`: Authenticated application surface.
    - `app/page.tsx`: Company workspace (users list + projects list).
    - `app/projects/new/page.tsx`: New project form (client component).
    - `app/projects/[projectId]/page.tsx`: Project board page hosting the Kanban UI.

- **`src/components`**
  - `components/ui/`
    - `Button.tsx`: Shared button component (primary/secondary variants, pointer cursor, disabled states).
    - `Input.tsx`: Shared input styling.
    - `Field.tsx`: Label + input wrapper.
  - `components/auth/`
    - `LoginForm.tsx`: Client form that posts to `/api/auth/login`.
    - `RegisterForm.tsx`: Client form that posts to `/api/auth/register`.
  - `components/projects/`
    - `ProjectBoard.tsx`: Client‑side Kanban board with drag‑and‑drop, timer controls, and live display.
    - `ProjectCard.tsx`: Project card with “open board” and inline delete button.
    - `types.ts`: Shared TypeScript types for board state (`BoardTask`, `BoardUser`, etc.).

- **`src/app/globals.css`**
  - Tailwind entrypoint and small global styles (dark background, font variables).

### Backend‑focused folders

- **`src/app/api`** – All API routes (Next.js App Router).
  - `api/auth/`
    - `login/route.ts`: Validates credentials, verifies password, issues session cookie.
    - `register/route.ts`: Validates payload, creates `Company` + `User`, issues session cookie.
    - `logout/route.ts`: Clears session cookie and redirects to `/`.
  - `api/projects/`
    - `route.ts`: `POST` to create a new project.
    - `[projectId]/route.ts`: `DELETE` to remove a project (and all its tasks) within the same company.
    - `[projectId]/tasks/route.ts`: `GET`/`POST` to list and create tasks for a project.
    - `[projectId]/tasks/reorder/route.ts`: Persists column order and status changes after drag‑and‑drop.
  - `api/tasks/`
    - `[taskId]/route.ts`: Generic task updates (currently status).
    - `[taskId]/timer/start/route.ts`: Starts or joins an active timer interval.
    - `[taskId]/timer/stop/route.ts`: Stops working on a task and updates shared elapsed time when the last worker stops.

- **`src/lib/db`**
  - `mongoose.ts`: Single, cached Mongoose connection helper to avoid multiple connections in dev.
  - `models.ts`: Mongoose schemas/models for `Company`, `User`, `Project`, `Task`.

- **`src/lib/auth`**
  - `password.ts`: Password hashing and verification using bcrypt.
  - `session.ts`: JWT session creation, parsing, and cookie helpers.
  - `requireSession.ts`: Server‑side helper to enforce auth on page routes (redirects to `/login`).
  - `requireApiSession.ts`: API helper to ensure a valid session (returns 401 JSON instead of redirect).

- **`src/lib/validation`**
  - `auth.ts`: Zod schemas for login and register payloads.

- **`src/env.ts`**
  - Zod‑based validation for env vars (`MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`).

### Domain model

Defined in `src/lib/db/models.ts`:

- **`Company`**
  - `name`
- **`User`**
  - `companyId` (each user belongs to exactly one company)
  - `name`, `email`, `passwordHash`
- **`Project`**
  - `companyId`
  - `name`
  - `createdByUserId`
- **`Task`**
  - `companyId`, `projectId`
  - `title`, `description`
  - `status` (`"todo" | "in_progress" | "done"`)
  - `order` (for stable ordering inside a column)
  - **Shared timer fields**:
    - `accumulatedMs` – total time (in ms) that the task has had at least one active worker
    - `activeUserIds` – users currently “working on” the task
    - `lastStartAt` – when the current active interval started (null if nobody is active)

The models are written to be **reusable** and **testable**, with a single Mongoose connection helper in `src/lib/db/mongoose.ts` that uses a global cached connection to play nicely with hot‑reload in dev.

---

## Feature‑by‑feature mapping to requirements

### 1. User Registration

- Implemented in:
  - API: `src/app/api/auth/register/route.ts`
  - UI: `src/app/(auth)/register/page.tsx` + `src/components/auth/RegisterForm.tsx`
- Supports:
  - Name, email, password, company name.
  - Basic Zod validation (email format, password length, etc.).
  - Password hashing via bcrypt.
  - On success:
    - Creates a `Company`.
    - Creates a `User` attached to that company.
    - Issues a JWT session cookie and redirects to `/app`.

### 2. Company / Organization Association

- Each `User` has a required `companyId`.
  - On registration:
    - The app looks up a `Company` by **case-insensitive name**.
    - If it exists, the user joins that existing company.
    - If it does not exist yet, a new `Company` is created.
    - Users do **not** have a mechanism to switch companies.
- The `companyId` is embedded in the session token and used to **scope all queries and mutations** so users only ever see their own company’s data.

### 3. Company Visibility

- `/app` is the **company workspace**:
  - Lists **all users** in the current company.
  - Lists **all projects** in the current company.
  - Provides a “New project” button.
- Implementation:
  - Server component in `src/app/app/page.tsx`:
    - Uses `requireSession` to ensure the user is logged in.
    - Fetches `User`s and `Project`s filtered by `companyId`.

### 4. Projects

- Any authenticated user in a company can:
  - Create a project via `POST /api/projects`.
  - View all projects from `/app`.
  - Open a project board at `/app/projects/[projectId]`.
- `Project` documents are keyed by `_id` and scoped by `companyId`.

### 5. Tasks and Kanban Board

- Route: `/app/projects/[projectId]`
  - Server component: `src/app/app/projects/[projectId]/page.tsx`
  - Client board: `src/components/projects/ProjectBoard.tsx`
- Columns:
  - `To Do` → status `"todo"`
  - `In Progress` → status `"in_progress"`
  - `Done` → status `"done"`
- Drag & Drop:
  - Powered by `@hello-pangea/dnd`.
  - Dragging:
    - Reorders tasks **within** a column.
    - Moves tasks **across** columns.
  - State updates:
    - **Optimistic** update on the client for snappy UX.
    - Persisted via:
      - `POST /api/projects/[projectId]/tasks/reorder` (per column).
      - `PATCH /api/tasks/[taskId]` (for status changes).
- Task creation:
  - `POST /api/projects/[projectId]/tasks`
  - New tasks are added to `To Do` at the **end** of the column based on `order`.

### 6–7. Task Timers & Multi‑User Timer Logic

The timer is **shared per task**, not per user.

- Core idea:
  - The timer measures **total wall‑clock time** during which **at least one user** is working on the task.
- Data model:
  - `accumulatedMs`: total elapsed milliseconds from all prior active intervals.
  - `activeUserIds`: users currently working.
  - `lastStartAt`: when the current active interval began (if any).

#### Starting work on a task

- Endpoint: `POST /api/tasks/[taskId]/timer/start`
- Behavior:
  - If the task is in `"todo"`, it is automatically moved to `"in_progress"`.
  - If the user is not already in `activeUserIds`, they are appended.
  - If the task was previously idle (`activeUserIds` was empty), `lastStartAt` is set to **now**, beginning a new active interval.
  - If others were already active, `lastStartAt` is left unchanged – we’re in the same shared interval.

#### Stopping work on a task

- Endpoint: `POST /api/tasks/[taskId]/timer/stop`
- Behavior:
  - Removes the user from `activeUserIds`.
  - If **this user was the last active user**:
    - Compute `elapsed = now - lastStartAt`.
    - Increment `accumulatedMs` by `elapsed`.
    - Set `lastStartAt` to `null`.
  - If other users are still active:
    - We **do not** close the interval – the timer keeps running and will be closed only when the last active user stops.

#### Why this matches the spec

- Example from the brief:
  - User A works 5 min → timer shows 5 min.
  - User B joins for 1 min → timer shows 6 min.
- In this design:
  - There is no duplication of time across users; we count **continuous active time** once.
  - Multiple active users simply keep the task in an “active” state.

#### Displaying the timer in the UI

- On the client, `ProjectBoard` computes a **live display**:
  - If `activeUserIds` is empty or `lastStartAt` is null:
    - Show `accumulatedMs`.
  - If there is at least one active user:
    - Show `accumulatedMs + (now - lastStartAt)`.
- This keeps the timer ticking smoothly without hammering the server.

---

## Real‑time synchronization approach

The spec prefers WebSockets but allows other approaches with justification.

For this take‑home, I chose a **simple HTTP‑based polling strategy** backed by **server‑side authoritative state**:

- Every few seconds, the board calls:
  - `GET /api/projects/[projectId]/tasks`
  - and **replaces local task state** with the server version.
- All task changes (drag‑and‑drop, timer start/stop, new tasks) go through API routes that update Mongo.
- Any open browser pointing at the same project will see **near real‑time updates** (within a few seconds) without manual refresh.

### Why not WebSockets here?

- For production, I would absolutely consider:
  - A small **Socket.IO** or **native WebSocket** server bound to the same project.
  - An event model: `taskUpdated`, `taskMoved`, `timerStarted`, `timerStopped`.
  - Rooms per `companyId` / `projectId`.
- For this assessment, I optimized for:
  - **Simplicity** and **clarity of shared state logic**.
  - Avoiding extra deployment complexity around stateful WebSocket servers (especially on serverless hosts).
  - Making the timer model and Mongo updates **easy to reason about**.

If this were moving toward production, my next step would be to **swap the polling loop for WebSocket subscriptions** without changing the core domain model.

---

## Security and robustness considerations

- **Passwords**:
  - Never stored in plain text.
  - Hashed with bcrypt using a reasonable work factor.
- **Sessions**:
  - JWT signed with `HS256` using `JWT_SECRET`.
  - Stored in an **httpOnly**, `SameSite=Lax` cookie.
- **Multi‑tenancy**:
  - All queries and updates filter by `companyId` from the session to prevent cross‑company data leakage.
- **Validation & errors**:
  - Zod validates:
    - Environment variables (`src/env.ts`).
    - Auth payloads.
    - Project/task payloads.
  - APIs return clear 4xx/5xx responses with small, user‑friendly error messages on the client.

---

## Known limitations and future improvements

- **Real‑time transport**:
  - Currently uses short‑interval polling instead of WebSockets.
  - Next step: introduce Socket.IO channels per project for push‑based updates.
- **Auth scope**:
  - No password reset, email verification, or advanced security hardening (intentionally out of scope).
- **Features intentionally not implemented** (per brief):
  - Role‑based permissions.
  - Notifications.
  - Comments.
  - File uploads.
  - Task dependencies.
  - Reporting/analytics.

---

- **Maintainability**:
  - Point out the separation between:
    - DB layer (`lib/db`).
    - Auth (`lib/auth`).
    - Validation (`lib/validation`).
    - UI components vs. page routes.
  - Highlight how this structure makes it easy to extend the system with minimal coupling.

Overall, the implementation focuses on **clarity, correctness, and trade‑off awareness**, which is exactly what this assessment is designed to evaluate.
