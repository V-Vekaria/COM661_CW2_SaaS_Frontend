# SaaS Monitor — Frontend

An Angular 21 single-page application for monitoring and managing a SaaS platform's customer base. Provides role-based dashboards for admin and analyst operators to view usage data, activity logs, anomaly flags, and analytics.

Built for **COM661 – Full Stack Development** at Ulster University.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Angular 21 | SPA framework (standalone components) |
| TypeScript | Language |
| Bootstrap 5 | Responsive UI layout and components |
| ng2-charts + Chart.js | Pie, bar, and doughnut charts |
| Angular Reactive Forms | Form validation and submission |
| Angular Router | Client-side routing with route guards |
| Vitest | Unit test runner (via `@angular/build:unit-test`) |

---

## Prerequisites

- Node.js 20+
- Angular CLI (`npm install -g @angular/cli`)
- Backend API running at `http://localhost:5001` — see [COM661 Backend repo](../COM661-FullStack-Backend)

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The app reloads automatically on file changes.

### 3. Run unit tests

```bash
npx ng test --watch=false
```

251 unit tests across all services and components.

---

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| admin@cloudmetrics.io | password123 | admin |
| analyst@cloudmetrics.io | password123 | analyst |

---

## Application Pages

| Route | Description |
|---|---|
| `/login` | Login form — JWT token stored in localStorage |
| `/dashboard` | Stat cards, charts, recent anomalies |
| `/users` | Paginated user list with search |
| `/users/:id` | User profile, usage logs, API keys, alerts |
| `/activity-logs` | Activity log table with filters |
| `/anomaly-flags` | Anomaly flag table with resolve modal |
| `/analytics` | Charts and tables for usage, anomalies, and risk data |

---

## Role-Based Access Control

| Feature | Admin | Analyst |
|---|---|---|
| View all pages | ✅ | ✅ |
| Search users | ✅ | ✅ |
| View user details | ✅ | ✅ |
| Add / delete users | ✅ | ✗ |
| Add usage logs | ✅ | ✗ |
| Delete usage logs | ✅ | ✗ |
| Generate / revoke API keys | ✅ | ✗ |
| Create alerts | ✅ | ✗ |
| Acknowledge alerts | ✅ | ✅ |
| Log activity | ✅ | ✅ |
| Delete activity logs | ✅ | ✗ |
| Resolve anomaly flags | ✅ | ✅ |
| Delete anomaly flags | ✅ | ✗ |
| View analytics | ✅ | ✅ |

Route guards redirect unauthenticated users to `/login`. A global HTTP interceptor automatically clears the session and redirects to `/login` on any 401 response.

---

## Project Structure

```
src/app/
├── components/
│   ├── login/              Login form
│   ├── nav/                Navigation bar with role display
│   ├── dashboard/          Stat cards + charts + recent anomalies
│   ├── users/              User list, search, add user form
│   ├── user/               User detail — profile, logs, keys, alerts
│   ├── activity-logs/      Activity log table with filters and add form
│   ├── anomaly-flags/      Anomaly flag table with resolve modal
│   └── analytics/          Charts and risk tables
│
├── services/
│   ├── auth.ts             Login, logout, role checks (isAdmin, isAnalyst, canView*)
│   └── web-service.ts      All HTTP calls to the backend API
│
├── guards/
│   └── auth.guard.ts       Route guard — redirects unauthenticated users
│
└── interceptors/
    └── auth.interceptor.ts Global 401 handler — auto logout on expired token
```

---

## Key Features

- **JWT authentication** — token stored in localStorage, sent as `x-access-token` header on every request
- **Token blacklist** — logout calls `POST /logout` to invalidate the token server-side
- **Loading spinners** — all list pages show a spinner while data is fetching
- **Inline expand** — anomaly flag rows expand to show resolution log history
- **Pagination** — all list pages support prev/next navigation
- **Success/error banners** — auto-dismiss after 3 seconds
- **Confirm dialogs** — destructive actions (delete user, delete flag, etc.) require confirmation
