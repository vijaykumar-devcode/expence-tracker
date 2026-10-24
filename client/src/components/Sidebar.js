import React, { useState } from 'react';
import { HomeIcon, PlusCircleIcon, ListIcon, WalletIcon, MenuIcon, CloseIcon, CalendarIcon } from './Icons';
import './Sidebar.css';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'add', label: 'Add Expense', icon: PlusCircleIcon },
  { id: 'expenses', label: 'All Expenses', icon: ListIcon },
  { id: 'budgets', label: 'Budgets', icon: CalendarIcon },
  { id: 'income', label: 'Income', icon: WalletIcon },
  { id: 'recurring', label: 'Recurring', icon: CalendarIcon },
  { id: 'reports', label: 'Reports', icon: ListIcon },
  { id: 'goals', label: 'Savings Goals', icon: WalletIcon },
  { id: 'settings', label: 'Settings', icon: CalendarIcon },
];

const Sidebar = ({ currentPage, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <>
      <button className="sidebar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <CloseIcon size={24} color="#1E293B" /> : <MenuIcon size={24} color="#1E293B" />}
      </button>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <WalletIcon size={22} color="#FFFFFF" />
          </div>
          <span className="sidebar-logo-text">Finora</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
                onClick={() => handleNavigate(item.id)}
              >
                <Icon size={20} color={isActive ? '#3B82F6' : '#64748B'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p><em>Track your spending.</em></p>
          <p><em>Build a better tomorrow.</em></p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
