import React, { useState, useEffect, useCallback } from 'react';
import { getSummary } from '../api/expenseApi';
import SummaryCard from './SummaryCard';
import CategoryChart from './CategoryChart';
import Loading from './Loading';
import {
  WalletIcon,
  CalendarIcon,
  ListIcon,
  ClockIcon,
  PlusCircleIcon,
  SearchIcon,
  FilterIcon,
  ArrowRightIcon,
  LightbulbIcon,
  getCategoryIcon,
  categoryColors,
  paymentColors,
} from './Icons';
import './Dashboard.css';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getMonthRangeString = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const nowStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr} – ${nowStr}`;
};

const Dashboard = ({ onNavigate, refreshKey }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getSummary();
      setSummary(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load dashboard data. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loading text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p className="error-text">{error}</p>
        <button className="btn btn-primary" onClick={fetchDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  const {
    totalExpenses = 0,
    monthlyExpenses = 0,
    transactionCount = 0,
    recentTransactions = [],
    categoryBreakdown = [],
  } = summary || {};

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Here's an overview of your expenses</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-grid">
        <SummaryCard
          title="Total Expenses"
          value={`₹ ${Number(totalExpenses).toLocaleString('en-IN')}`}
          subtitle="All time"
          icon={<WalletIcon size={22} color="#FFFFFF" />}
          iconBg="#10B981"
        />
        <SummaryCard
          title="This Month's Expenses"
          value={`₹ ${Number(monthlyExpenses).toLocaleString('en-IN')}`}
          subtitle={getMonthRangeString()}
          icon={<CalendarIcon size={22} color="#FFFFFF" />}
          iconBg="#3B82F6"
        />
        <SummaryCard
          title="Transaction Count"
          value={transactionCount.toString()}
          subtitle="This month"
          icon={<ListIcon size={22} color="#FFFFFF" />}
          iconBg="#8B5CF6"
        />
        <SummaryCard
          title="Recent Transactions"
          value={recentTransactions.length.toString()}
          subtitle={`Last ${recentTransactions.length || 5} transactions`}
          icon={<ClockIcon size={22} color="#FFFFFF" />}
          iconBg="#F59E0B"
        />
      </div>

      {/* Main Grid: Recent Transactions + Expenses by Category */}
      <div className="dashboard-grid">
        {/* Left Column: Recent Transactions */}
        <div className="dashboard-card recent-transactions-card">
          <div className="dashboard-card-header">
            <h2 className="card-heading">Recent Transactions</h2>
            <button
              type="button"
              className="view-all-link"
              onClick={() => onNavigate('expenses')}
            >
              <span>View All</span>
              <ArrowRightIcon size={14} color="#3B82F6" />
            </button>
          </div>

          <div className="recent-list">
            {recentTransactions.length === 0 ? (
              <div className="empty-recent">
                <p>No transactions yet.</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigate('add')}
                >
                  Add Your First Expense
                </button>
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const CatIcon = getCategoryIcon(tx.category);
                const catTheme = categoryColors[tx.category] || {
                  color: '#6B7280',
                  bg: '#F3F4F6',
                };
                const payTheme = paymentColors[tx.paymentMethod] || {
                  color: '#6B7280',
                  bg: '#F3F4F6',
                };

                return (
                  <div key={tx._id} className="recent-item">
                    <div
                      className="recent-icon-circle"
                      style={{ backgroundColor: catTheme.bg }}
                    >
                      <CatIcon size={20} color={catTheme.color} />
                    </div>

                    <div className="recent-details">
                      <span className="recent-title">{tx.title}</span>
                      <span className="recent-category">{tx.category}</span>
                    </div>

                    <div className="recent-meta">
                      <span className="recent-amount">
                        ₹ {Number(tx.amount).toLocaleString('en-IN')}
                      </span>
                      <span className="recent-date">{formatDate(tx.date)}</span>
                    </div>

                    <div className="recent-payment">
                      <span
                        className="badge badge-payment"
                        style={{
                          color: payTheme.color,
                          backgroundColor: payTheme.bg,
                        }}
                      >
                        {tx.paymentMethod}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {recentTransactions.length > 0 && (
            <div className="recent-footer">
              Showing {recentTransactions.length} recent transactions
            </div>
          )}
        </div>

        {/* Right Column: Expenses by Category + Tip */}
        <div className="category-section">
          <div className="dashboard-card category-breakdown-card">
            <div className="dashboard-card-header">
              <h2 className="card-heading">Expenses by Category</h2>
            </div>

            <CategoryChart
              data={categoryBreakdown}
              totalAmount={monthlyExpenses}
            />
          </div>

          {/* Motivational Tip Box */}
          <div className="tip-card">
            <div className="tip-icon-bubble">
              <LightbulbIcon size={20} color="#3B82F6" />
            </div>
            <div className="tip-text">
              <h4 className="tip-title">Good job!</h4>
              <p className="tip-desc">You're on track with your spending.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2 className="quick-actions-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          {/* Action 1: Add New Expense */}
          <div
            className="action-card action-card--primary"
            onClick={() => onNavigate('add')}
          >
            <div className="action-card-icon-bubble action-card-icon-bubble--white">
              <PlusCircleIcon size={20} color="#2563EB" />
            </div>
            <div className="action-card-text">
              <h3 className="action-card-title">Add New Expense</h3>
              <p className="action-card-desc">Record a new transaction</p>
            </div>
          </div>

          {/* Action 2: View All Expenses */}
          <div
            className="action-card"
            onClick={() => onNavigate('expenses')}
          >
            <div className="action-card-icon-bubble">
              <ListIcon size={20} color="#3B82F6" />
            </div>
            <div className="action-card-text">
              <h3 className="action-card-title">View All Expenses</h3>
              <p className="action-card-desc">See your complete history</p>
            </div>
          </div>

          {/* Action 3: Search Expenses */}
          <div
            className="action-card"
            onClick={() => onNavigate('expenses')}
          >
            <div className="action-card-icon-bubble">
              <SearchIcon size={20} color="#3B82F6" />
            </div>
            <div className="action-card-text">
              <h3 className="action-card-title">Search Expenses</h3>
              <p className="action-card-desc">Find by title, category or date</p>
            </div>
          </div>

          {/* Action 4: Filter */}
          <div
            className="action-card"
            onClick={() => onNavigate('expenses')}
          >
            <div className="action-card-icon-bubble">
              <FilterIcon size={20} color="#3B82F6" />
            </div>
            <div className="action-card-text">
              <h3 className="action-card-title">Filter</h3>
              <p className="action-card-desc">Narrow down your results</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
