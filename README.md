# Expense Tracker

A full-stack expense tracking application built with React, Express, and PostgreSQL. Track your daily expenses, filter by category or date, and view insightful summaries — all in a clean, responsive UI.

## Tech Stack

- **PostgreSQL/Supabase** — Relational database for users and expenses
- **Express.js** — Backend web framework for Node.js
- **React.js** — Frontend UI library
- **Node.js** — JavaScript runtime
- **pg** — PostgreSQL driver for Node.js
- **CSS** — Custom styling for a responsive UI

## Features

- 📊 **Dashboard** — View total expenses, monthly spending, and category breakdown at a glance
- ➕ **Add / Edit / Delete Expenses** — Full CRUD operations for managing your expenses
- 🔍 **Search & Filter** — Search by title, filter by category, date range, and payment method
- 📱 **Responsive UI** — Works on desktop, tablet, and mobile devices

## Project Structure

```
Expense Tracker/
├── client/                  # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── App.js
│       └── index.js
├── server/                  # Express backend
│   ├── config/
│   │   └── db.js            # PostgreSQL pool
│   ├── db/migrations/       # Version-controlled PostgreSQL schema
│   ├── repositories/        # Parameterized PostgreSQL queries
│   ├── controllers/
│   ├── routes/
│   ├── server.js            # Entry point
│   ├── package.json
│   └── .env.example
├── .env.example
└── README.md
```

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- PostgreSQL (local or Supabase)

### 1. Clone or Download

```bash
git clone <your-repo-url>
cd "Expense Tracker"
```

### 2. Configure Environment Variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set your PostgreSQL connection details:

```
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_SSL=true
DATABASE_POOL_MAX=10
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:3000
```

### 3. Apply the PostgreSQL schema

After verifying that `DATABASE_URL` points to the intended non-production or approved database, apply the additive migration:

```bash
cd server
npm run migrate
```

The migration does not import or delete MongoDB data.

Income uses a separate additive `income` table rather than a unified transactions
table. This preserves the existing expense and budget schemas, API response
contracts, ownership rules, and legacy data while allowing PostgreSQL to combine
income and expense aggregates for the finance dashboard. Migration
`003_create_income.sql` is applied by the same tracked migration runner.

Recurring schedules use additive migration `004_create_recurring_transactions.sql`.
The migration creates owner-scoped schedules and a unique occurrence ledger for
database-level idempotency. Schedules are reminders/manual confirmations by
default; automatic generation occurs only when enabled for a schedule and the
user explicitly selects **Process due automatic schedules**. The recurring
screen uses date-based scheduling in UTC, preserves monthly/yearly day anchors
through short months, and processes missed dates transactionally. Do not apply
this migration to an application database without explicit approval.

Reports are available through authenticated `/api/reports` and
`/api/reports/csv` endpoints. CSV values are escaped and spreadsheet formula
prefixes are neutralized before export. Savings goals use additive migration
`005_create_savings_goals.sql`; goal allocations are intentionally separate
from income and expense cash-flow totals, and withdrawals cannot exceed the
goal's allocated balance. Password changes are available through the
authenticated `/api/auth/change-password` and `/api/auth/profile` endpoints.

### 4. Start the Backend

```bash
cd server
npm install
npm run dev
```

The API will be available at `http://localhost:5000`.

### 5. Start the Frontend

```bash
cd client
npm install
npm start
```

The app will open at `http://localhost:3000`.

## API Endpoints

| Method   | Endpoint                     | Description                                         |
| -------- | ---------------------------- | --------------------------------------------------- |
| `GET`    | `/api/expenses`              | Get all expenses (paginated, filterable)            |
| `GET`    | `/api/expenses/summary`      | Get expense summary & stats                         |
| `GET`    | `/api/expenses/:id`          | Get a single expense                                |
| `POST`   | `/api/expenses`              | Create a new expense                                |
| `PUT`    | `/api/expenses/:id`          | Update an expense                                   |
| `DELETE` | `/api/expenses/:id`          | Delete an expense                                   |
| `GET`    | `/api/recurring`             | List recurring schedules                            |
| `POST`   | `/api/recurring`             | Create a recurring schedule                         |
| `PUT`    | `/api/recurring/:id`         | Update a recurring schedule                         |
| `PATCH`  | `/api/recurring/:id/status`  | Pause or resume a schedule                          |
| `DELETE` | `/api/recurring/:id`         | Delete a recurring schedule                         |
| `POST`   | `/api/recurring/process-due` | Generate due opted-in schedules                     |
| `GET`    | `/api/reports`               | Get a user-scoped date-range report                 |
| `GET`    | `/api/reports/csv`           | Export a user-scoped date-range CSV                 |
| `GET`    | `/api/goals`                 | List savings goals                                  |
| `POST`   | `/api/goals`                 | Create a savings goal                               |
| `PUT`    | `/api/goals/:id`             | Update a savings goal                               |
| `DELETE` | `/api/goals/:id`             | Delete a savings goal                               |
| `GET`    | `/api/goals/:id/entries`     | List goal allocations                               |
| `POST`   | `/api/goals/:id/entries`     | Add a contribution or withdrawal                    |
| `POST`   | `/api/auth/change-password`  | Change password after current-password verification |

## Notes

- Authentication uses bcrypt password hashing and JWTs in HttpOnly cookies.
- Expense queries are scoped to the authenticated user.
- MongoDB data is not imported automatically; any future import must be explicit and separate.
- 📝 **No TypeScript** — Written in plain JavaScript.
