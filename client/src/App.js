import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import Budgets from './components/Budgets';
import Income from './components/Income';
import Recurring from './components/Recurring';
import Reports from './components/Reports';
import Goals from './components/Goals';
import Settings from './components/Settings';
import AuthPage from './components/AuthPage';
import { getCurrentUser, logout } from './api/authApi';
import './App.css';

const sectionHeadings = {
  dashboard: {
    title: 'Dashboard',
    subtitle: "Here's an overview of your personal cash flow",
  },
  add: {
    title: 'Add Expense',
    subtitle: 'Fill in the details below to add a new expense.',
  },
  expenses: {
    title: 'Expenses',
    subtitle: 'View and manage all your expenses. Newest first.',
  },
  income: {
    title: 'Income',
    subtitle: 'Track money received and review your income history.',
  },
  budgets: {
    title: 'Budgets',
    subtitle: 'Set overall and category spending limits.',
  },
  recurring: {
    title: 'Recurring Transactions',
    subtitle: 'Schedules are reminders by default. Automatic generation occurs only when explicitly enabled and processed.',
  },
  reports: { title: 'Reports', subtitle: 'Review your cash flow and export financial records.' },
  goals: { title: 'Savings Goals', subtitle: 'Track allocated savings separately from cash-flow transactions.' },
  settings: { title: 'Settings', subtitle: 'Manage your account security.' },
};

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [editingExpense, setEditingExpense] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((response) => setUser(response.user))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      setCurrentPage('dashboard');
    }
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (page !== 'add') {
      setEditingExpense(null);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setCurrentPage('add');
  };

  const handleSave = () => {
    setRefreshKey((prev) => prev + 1);
    setEditingExpense(null);
    setCurrentPage('expenses');
  };

  const activeSection = currentPage === 'add' && editingExpense
    ? { title: 'Edit Expense', subtitle: 'Update the details below for this expense.' }
    : sectionHeadings[currentPage];

  if (authLoading) {
    return <div className="auth-loading">Loading...</div>;
  }

  if (!user) {
    return <AuthPage onAuthenticated={setUser} />;
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header Bar */}
        <header className="top-header">
          <div className="section-heading-group">
            <h1 className="section-heading">{activeSection.title}</h1>
            <p className="section-subheading">{activeSection.subtitle}</p>
          </div>
        </header>

        {/* Content Body */}
        <main className="main-content">
          {currentPage === 'dashboard' && (
            <Dashboard user={user} onNavigate={handleNavigate} refreshKey={refreshKey} />
          )}

          {currentPage === 'add' && (
            <ExpenseForm
              editingExpense={editingExpense}
              onSave={handleSave}
              onCancel={() => handleNavigate('expenses')}
            />
          )}

          {currentPage === 'expenses' && (
            <ExpenseList
              onEdit={handleEdit}
              onNavigate={handleNavigate}
              refreshKey={refreshKey}
            />
          )}

          {currentPage === 'budgets' && (
            <Budgets onChanged={() => setRefreshKey((prev) => prev + 1)} />
          )}
          {currentPage === 'income' && (
            <Income onChanged={() => setRefreshKey((prev) => prev + 1)} />
          )}
          {currentPage === 'recurring' && (
            <Recurring onChanged={() => setRefreshKey((prev) => prev + 1)} />
          )}
          {currentPage === 'reports' && <Reports />}
          {currentPage === 'goals' && <Goals />}
          {currentPage === 'settings' && (
            <Settings user={user} onProfileUpdated={setUser} onLogout={handleLogout} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
