import React, { useState, useEffect, useCallback } from 'react';
import { getFinanceSummary } from '../api/financeApi';
import { getBudgets } from '../api/budgetApi';
import SummaryCard from './SummaryCard';
import CategoryChart from './CategoryChart';
import Loading from './Loading';
import {
  WalletIcon,
  CalendarIcon,
  ListIcon,
  ClockIcon,
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

const Dashboard = ({ user, onNavigate, refreshKey }) => {
  const [summary, setSummary] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [budgets, setBudgets] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getFinanceSummary(month);
      setSummary(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load dashboard data. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  useEffect(() => {
    getBudgets(`${month}-01`).then((data) => setBudgets(data.budgets || [])).catch(() => setBudgets([]));
  }, [month, refreshKey]);

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
    totalIncome = 0,
    totalExpenses = 0,
    netCashFlow = 0,
    savingsRate = 0,
    incomeCategoryBreakdown = [],
    expenseCategoryBreakdown = [],
    recentTransactions = [],
    monthlyTrend = [],
  } = summary || {};

  const greetingName = user?.name || 'there';

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <div>
            <h2>Hi {greetingName}</h2>
            <p>Here's your financial overview of this month</p>
          </div>
          <input id="dashboard-month" name="dashboardMonth" className="filter-select" type="month" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Dashboard month" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards-grid">
        <SummaryCard
          title="Total Income"
          value={`₹ ${Number(totalIncome).toLocaleString('en-IN')}`}
          subtitle={month}
          icon={<WalletIcon size={22} color="#FFFFFF" />}
          iconBg="#10B981"
        />
        <SummaryCard
          title="Total Expenses"
          value={`₹ ${Number(totalExpenses).toLocaleString('en-IN')}`}
          subtitle={month}
          icon={<CalendarIcon size={22} color="#FFFFFF" />}
          iconBg="#3B82F6"
        />
        <SummaryCard
          title="Net Cash Flow"
          value={`₹ ${Number(netCashFlow).toLocaleString('en-IN')}`}
          subtitle={`Savings rate ${Number(savingsRate).toFixed(1)}%`}
          icon={<ListIcon size={22} color="#FFFFFF" />}
          iconBg="#8B5CF6"
        />
        <SummaryCard
          title="Recent Transactions"
          value={recentTransactions.length.toString()}
          subtitle="Income and expenses"
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

          {budgets.length > 0 && (
            <div className="dashboard-card budget-indicators-card">
              <div className="dashboard-card-header">
                <h2 className="card-heading">This Month's Budgets</h2>
                <button type="button" className="view-all-link" onClick={() => onNavigate('budgets')}>Manage</button>
              </div>
              <div className="budget-indicators">
                {budgets.map((budget) => (
                  <div className="budget-indicator" key={budget._id}>
                    <div className="budget-indicator-label">
                      <span>{budget.category || 'Overall'}</span>
                      <span>{Math.round(budget.percentageUsed)}%</span>
                    </div>
                    <div className="budget-progress"><span style={{ width: `${Math.min(100, budget.percentageUsed)}%` }} /></div>
                    <small className={`budget-status budget-status--${budget.alert}`}>{budget.alert === 'exceeded' ? 'Budget exceeded' : budget.alert === 'warning' ? 'Approaching limit' : 'On track'}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="recent-list">
            {recentTransactions.length === 0 ? (
              <div className="empty-recent">
                <p>No transactions yet.</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigate('income')}
                >
                  Add Your First Income
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
                      <span className="recent-category">{tx.type === 'income' ? 'Income · ' : ''}{tx.category}</span>
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
                        {tx.type === 'income' ? 'Income' : tx.paymentMethod}
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
              data={expenseCategoryBreakdown}
              totalAmount={totalExpenses}
            />
            <h2 className="card-heading dashboard-subsection-heading">Income by Category</h2>
            <CategoryChart
              data={incomeCategoryBreakdown}
              totalAmount={totalIncome}
            />
          </div>

          <div className="dashboard-card trend-card">
            <div className="dashboard-card-header">
              <h2 className="card-heading">Cash-flow trend</h2>
            </div>
            {monthlyTrend.length === 0 ? <p className="empty-recent">No monthly data yet.</p> : (
              <div className="cash-flow-trend">
                {monthlyTrend.map((item) => (
                  <div className="trend-row" key={item.month}>
                    <span>{item.month}</span>
                    <span className={item.netCashFlow < 0 ? 'trend-negative' : 'trend-positive'}>
                      ₹ {item.netCashFlow.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
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

    </div>
  );
};

export default Dashboard;
