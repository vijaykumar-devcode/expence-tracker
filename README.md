# Expense Tracker (MERN Stack)

A full-stack expense tracking application built with the MERN stack. Track your daily expenses, filter by category or date, and view insightful summaries — all in a clean, responsive UI.

## Tech Stack

- **MongoDB** — NoSQL database for storing expenses
- **Express.js** — Backend web framework for Node.js
- **React.js** — Frontend UI library
- **Node.js** — JavaScript runtime
- **Mongoose** — MongoDB object modeling for Node.js
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
│   │   └── db.js            # MongoDB connection
│   ├── controllers/
│   │   └── expenseController.js
│   ├── models/
│   │   └── Expense.js       # Mongoose schema
│   ├── routes/
│   │   └── expenseRoutes.js
│   ├── server.js            # Entry point
│   ├── package.json
│   └── .env.example
├── .env.example
└── README.md
```

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)

### 1. Clone or Download

```bash
git clone <your-repo-url>
cd "Expense Tracker"
```

### 2. Configure Environment Variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set your MongoDB connection string:

```
MONGODB_URI=mongodb://localhost:27017/expense-tracker
PORT=5000
```

### 3. Start MongoDB

Make sure MongoDB is running locally, or use a MongoDB Atlas connection string in your `.env` file.

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

| Method   | Endpoint                | Description              |
| -------- | ----------------------- | ------------------------ |
| `GET`    | `/api/expenses`         | Get all expenses (paginated, filterable) |
| `GET`    | `/api/expenses/summary` | Get expense summary & stats |
| `GET`    | `/api/expenses/:id`     | Get a single expense     |
| `POST`   | `/api/expenses`         | Create a new expense     |
| `PUT`    | `/api/expenses/:id`     | Update an expense        |
| `DELETE` | `/api/expenses/:id`     | Delete an expense        |

## Notes

- 🔓 **No Authentication** — This app does not include user authentication. All data is shared.
- 📝 **No TypeScript** — Written in plain JavaScript for simplicity.
- 🎓 **Beginner-Friendly** — Designed as a learning project for the MERN stack.
