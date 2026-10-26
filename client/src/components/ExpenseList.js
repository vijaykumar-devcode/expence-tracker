import React, { useState, useEffect, useCallback } from 'react';
import { getExpenses, deleteExpense } from '../api/expenseApi';
import {
  SearchIcon,
  RefreshIcon,
  PlusCircleIcon,
  EditIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  getCategoryIcon,
  categoryColors,
  paymentColors,
} from './Icons';
import Loading from './Loading';
import ConfirmModal from './ConfirmModal';
import './ExpenseList.css';

const categories = [
  'All Categories',
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Health',
  'Education',
  'Other',
];
const paymentMethods = ['All Payment Methods', 'Cash', 'UPI', 'Card', 'Other'];
const sortOptions = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Amount: high to low', value: 'amountDesc' },
  { label: 'Amount: low to high', value: 'amountAsc' },
];

const dateRanges = [
  { label: 'All Dates', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
];

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDateRangeBounds = (rangeKey) => {
  const now = new Date();
  let startDate = null;
  let endDate = null;

  if (rangeKey === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    startDate = start.toISOString();
    endDate = end.toISOString();
  } else if (rangeKey === '7days') {
    const start = new Date();
    start.setDate(now.getDate() - 7);
    startDate = start.toISOString();
    endDate = now.toISOString();
  } else if (rangeKey === '30days') {
    const start = new Date();
    start.setDate(now.getDate() - 30);
    startDate = start.toISOString();
    endDate = now.toISOString();
  } else if (rangeKey === 'thisMonth') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    startDate = start.toISOString();
    endDate = end.toISOString();
  } else if (rangeKey === 'lastMonth') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    startDate = start.toISOString();
    endDate = end.toISOString();
  }

  return { startDate, endDate };
};

const ExpenseList = ({ onEdit, onNavigate, refreshKey }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [dateRange, setDateRange] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('All Payment Methods');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Modal delete state
  const [deleteId, setDeleteId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { startDate, endDate } = getDateRangeBounds(dateRange);

      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        category: category !== 'All Categories' ? category : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        paymentMethod: paymentMethod !== 'All Payment Methods' ? paymentMethod : undefined,
        sort,
      };

      const res = await getExpenses(params);
      setExpenses(res.expenses || []);
      setTotalPages(res.pages || 1);
      setTotalExpenses(res.total || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch expenses. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, dateRange, paymentMethod, sort]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses, refreshKey]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
    setPage(1);
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('All Categories');
    setDateRange('all');
    setPaymentMethod('All Payment Methods');
    setSort('newest');
    setPage(1);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteExpense(deleteId);
      setModalOpen(false);
      setDeleteId(null);
      fetchExpenses();
    } catch (err) {
      alert('Failed to delete expense. Please try again.');
    }
  };

  return (
    <div className="expense-list-container">
      {/* Filter Toolbar */}
      <div className="filters-card">
        <div className="filters-row">
          {/* Search box */}
          <div className="search-box">
            <SearchIcon size={18} color="#94A3B8" className="search-icon" />
            <input
              id="expense-search"
              name="search"
              type="text"
              className="search-input"
              placeholder="Search by title or description..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <div className="filter-dropdown-wrapper">
            <label className="filter-label" htmlFor="expense-payment">Payment</label>
            <select id="expense-payment" name="paymentMethod" className="filter-select" value={paymentMethod} onChange={handlePaymentMethodChange}>
              {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
            </select>
          </div>

          <div className="filter-dropdown-wrapper">
            <label className="filter-label" htmlFor="expense-sort">Sort</label>
            <select id="expense-sort" name="sort" className="filter-select" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          {/* Category dropdown */}
          <div className="filter-dropdown-wrapper">
            <label className="filter-label" htmlFor="expense-category">Category</label>
            <select
              id="expense-category"
              name="category"
              className="filter-select"
              value={category}
              onChange={handleCategoryChange}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range dropdown */}
          <div className="filter-dropdown-wrapper">
            <label className="filter-label" htmlFor="expense-date-range">Date Range</label>
            <select
              id="expense-date-range"
              name="dateRange"
              className="filter-select"
              value={dateRange}
              onChange={handleDateRangeChange}
            >
              {dateRanges.map((dr) => (
                <option key={dr.value} value={dr.value}>
                  {dr.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters button */}
          <button
            type="button"
            className="btn-clear-filters"
            onClick={handleClearFilters}
            title="Clear filters"
          >
            <RefreshIcon size={16} color="#475569" />
            <span>Clear Filters</span>
          </button>

          {/* Add Expense button */}
          <button
            type="button"
            className="btn-add-expense"
            onClick={() => onNavigate('add')}
          >
            <PlusCircleIcon size={18} color="#FFFFFF" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="table-card">
        {loading ? (
          <div className="table-loading">
            <Loading text="Loading expenses..." />
          </div>
        ) : error ? (
          <div className="table-error">{error}</div>
        ) : expenses.length === 0 ? (
          <div className="table-empty">
            <p className="empty-title">No expenses found</p>
            <p className="empty-subtitle">
              {search || category !== 'All Categories' || dateRange !== 'all' || paymentMethod !== 'All Payment Methods'
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first expense.'}
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: '16px' }}
              onClick={() => onNavigate('add')}
            >
              Add Expense
            </button>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Payment Method</th>
                    <th>Date</th>
                    <th className="th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const CatIcon = getCategoryIcon(expense.category);
                    const catTheme = categoryColors[expense.category] || {
                      color: '#6B7280',
                      bg: '#F3F4F6',
                    };
                    const payTheme = paymentColors[expense.paymentMethod] || {
                      color: '#6B7280',
                      bg: '#F3F4F6',
                    };

                    return (
                      <tr key={expense._id}>
                        <td>
                          <div className="expense-title-cell">
                            <div
                              className="category-circle"
                              style={{ backgroundColor: catTheme.bg }}
                            >
                              <CatIcon size={18} color={catTheme.color} />
                            </div>
                            <div className="title-details">
                              <span className="expense-name">{expense.title}</span>
                              <span className="expense-category-sub">{expense.category}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="expense-amount">
                            ₹ {Number(expense.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <span
                            className="badge badge-category"
                            style={{
                              color: catTheme.color,
                              backgroundColor: catTheme.bg,
                            }}
                          >
                            {expense.category}
                          </span>
                        </td>
                        <td>
                          <span
                            className="badge badge-payment"
                            style={{
                              color: payTheme.color,
                              backgroundColor: payTheme.bg,
                            }}
                          >
                            {expense.paymentMethod}
                          </span>
                        </td>
                        <td>
                          <span className="expense-date">
                            {formatDate(expense.date)}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              type="button"
                              className="action-btn action-btn--edit"
                              onClick={() => onEdit(expense)}
                              title="Edit expense"
                            >
                              <EditIcon size={16} color="#3B82F6" />
                            </button>
                            <button
                              type="button"
                              className="action-btn action-btn--delete"
                              onClick={() => handleDeleteClick(expense._id)}
                              title="Delete expense"
                            >
                              <TrashIcon size={16} color="#EF4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="table-footer">
              <span className="showing-text">
                Showing {expenses.length} of {totalExpenses} expenses
              </span>
              <div className="pagination">
                <button
                  type="button"
                  className="page-btn page-arrow"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  title="Previous page"
                >
                  <ChevronLeftIcon size={16} color={page <= 1 ? '#CBD5E1' : '#475569'} />
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`page-btn ${p === page ? 'page-btn--active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  className="page-btn page-arrow"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  title="Next page"
                >
                  <ChevronRightIcon
                    size={16}
                    color={page >= totalPages ? '#CBD5E1' : '#475569'}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={modalOpen}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setModalOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
};

export default ExpenseList;
