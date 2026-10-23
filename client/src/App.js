import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import { CalendarIcon } from './components/Icons';
import './App.css';

const getFormattedHeaderDate = () => {
  const d = new Date();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [editingExpense, setEditingExpense] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const todayFormatted = getFormattedHeaderDate();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header Bar */}
        <header className="top-header">
          <div className="header-date-badge">
            <CalendarIcon size={16} color="#64748B" />
            <span className="header-date-text">{todayFormatted}</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="main-content">
          {currentPage === 'dashboard' && (
            <Dashboard onNavigate={handleNavigate} refreshKey={refreshKey} />
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
        </main>
      </div>
    </div>
  );
}

export default App;
