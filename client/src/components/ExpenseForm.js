import React, { useState, useEffect } from 'react';
import {
  createExpense,
  updateExpense,
} from '../api/expenseApi';
import {
  InfoIcon,
  getCategoryIcon,
  categoryColors,
  CalendarIcon,
  PaymentIcon,
  FoodIcon,
  TravelIcon,
  ShoppingIcon,
  BillsIcon,
  HealthIcon,
  EducationIcon,
  OtherIcon,
} from './Icons';
import './ExpenseForm.css';

const categories = [
  { name: 'Food', icon: FoodIcon, color: '#F59E0B' },
  { name: 'Travel', icon: TravelIcon, color: '#3B82F6' },
  { name: 'Shopping', icon: ShoppingIcon, color: '#8B5CF6' },
  { name: 'Bills', icon: BillsIcon, color: '#10B981' },
  { name: 'Health', icon: HealthIcon, color: '#EF4444' },
  { name: 'Education', icon: EducationIcon, color: '#06B6D4' },
  { name: 'Other', icon: OtherIcon, color: '#6B7280' },
];

const paymentMethods = ['Cash', 'UPI', 'Card', 'Other'];

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ExpenseForm = ({ editingExpense, onSave, onCancel }) => {
  const isEditing = Boolean(editingExpense);

  const initialFormState = {
    title: '',
    amount: '',
    category: 'Food',
    date: getTodayString(),
    paymentMethod: 'Cash',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        title: editingExpense.title || '',
        amount: editingExpense.amount || '',
        category: editingExpense.category || 'Food',
        date: editingExpense.date ? editingExpense.date.substring(0, 10) : getTodayString(),
        paymentMethod: editingExpense.paymentMethod || 'Cash',
      });
    } else {
      setFormData(initialFormState);
    }
    setErrors({});
    setServerError('');
  }, [editingExpense]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCategorySelect = (categoryName) => {
    setFormData((prev) => ({ ...prev, category: categoryName }));
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Title is required';
    } else if (formData.title.trim().length > 100) {
      errs.title = 'Title cannot exceed 100 characters';
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      errs.amount = 'Amount must be greater than 0';
    }

    if (!formData.category) {
      errs.category = 'Category is required';
    }

    if (!formData.date) {
      errs.date = 'Date is required';
    }

    if (!formData.paymentMethod) {
      errs.paymentMethod = 'Payment method is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setServerError('');
      const payload = {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
      };

      if (isEditing) {
        await updateExpense(editingExpense._id, payload);
      } else {
        await createExpense(payload);
      }

      onSave();
    } catch (err) {
      const msg =
        err.response?.data?.errors?.join(', ') ||
        err.response?.data?.message ||
        'Failed to save expense. Please try again.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isEditing && editingExpense) {
      setFormData({
        title: editingExpense.title || '',
        amount: editingExpense.amount || '',
        category: editingExpense.category || 'Food',
        date: editingExpense.date ? editingExpense.date.substring(0, 10) : getTodayString(),
        paymentMethod: editingExpense.paymentMethod || 'Cash',
      });
    } else {
      setFormData(initialFormState);
    }
    setErrors({});
    setServerError('');
  };

  const SelectedCategoryIcon = getCategoryIcon(formData.category);

  return (
    <div className="expense-form-container">
      <div className="expense-form-header">
        <h1 className="expense-form-title">
          {isEditing ? 'Edit Expense' : 'Add Expense'}
        </h1>
        <p className="expense-form-subtitle">
          {isEditing
            ? 'Update the details below for this expense.'
            : 'Fill in the details below to add a new expense.'}
        </p>
      </div>

      <div className="expense-form-card">
        {serverError && <div className="expense-form-alert error">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            {/* Title field */}
            <div className="form-group">
              <label className="form-label" htmlFor="title">
                Title <span className="required-star">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                className={`form-input ${errors.title ? 'form-input--error' : ''}`}
                placeholder="e.g. Lunch, Bus Ticket, Medicines"
                value={formData.title}
                onChange={handleChange}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            {/* Amount field */}
            <div className="form-group">
              <label className="form-label" htmlFor="amount">
                Amount <span className="required-star">*</span>
              </label>
              <div className="input-with-prefix">
                <span className="input-prefix">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  id="amount"
                  name="amount"
                  className={`form-input input-prefixed ${errors.amount ? 'form-input--error' : ''}`}
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                />
              </div>
              {errors.amount && <span className="field-error">{errors.amount}</span>}
            </div>

            {/* Category dropdown */}
            <div className="form-group">
              <label className="form-label" htmlFor="category">
                Category <span className="required-star">*</span>
              </label>
              <div className="select-with-icon">
                <div className="select-prefix-icon">
                  <SelectedCategoryIcon
                    size={18}
                    color={categoryColors[formData.category]?.color || '#F59E0B'}
                  />
                </div>
                <select
                  id="category"
                  name="category"
                  className={`form-select select-prefixed ${errors.category ? 'form-input--error' : ''}`}
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.category && <span className="field-error">{errors.category}</span>}
            </div>

            {/* Date field */}
            <div className="form-group">
              <label className="form-label" htmlFor="date">
                Date <span className="required-star">*</span>
              </label>
              <div className="select-with-icon">
                <div className="select-prefix-icon">
                  <CalendarIcon size={18} color="#64748B" />
                </div>
                <input
                  type="date"
                  id="date"
                  name="date"
                  className={`form-input select-prefixed ${errors.date ? 'form-input--error' : ''}`}
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>
              {errors.date && <span className="field-error">{errors.date}</span>}
            </div>

            {/* Payment Method field */}
            <div className="form-group form-group--full">
              <label className="form-label" htmlFor="paymentMethod">
                Payment Method <span className="required-star">*</span>
              </label>
              <div className="select-with-icon">
                <div className="select-prefix-icon">
                  <PaymentIcon size={18} color="#64748B" />
                </div>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  className={`form-select select-prefixed ${errors.paymentMethod ? 'form-input--error' : ''}`}
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
              {errors.paymentMethod && <span className="field-error">{errors.paymentMethod}</span>}
            </div>
          </div>

          {/* Category Icons quick selector */}
          <div className="category-icons-section">
            <h3 className="category-icons-title">Category Icons</h3>
            <div className="category-icons-list">
              {categories.map((cat) => {
                const IconComp = cat.icon;
                const isSelected = formData.category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    className={`category-icon-item ${isSelected ? 'category-icon-item--selected' : ''}`}
                    onClick={() => handleCategorySelect(cat.name)}
                    title={`Select ${cat.name}`}
                  >
                    <div
                      className="category-icon-bubble"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconComp size={20} color="#FFFFFF" />
                    </div>
                    <span className="category-icon-label">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Tips box */}
          <div className="quick-tips-box">
            <div className="quick-tips-icon">
              <InfoIcon size={20} color="#3B82F6" />
            </div>
            <div className="quick-tips-content">
              <span className="quick-tips-title">Quick Tips</span>
              <span className="quick-tips-text">
                • Use a clear and short title &nbsp;•&nbsp; Select the right category &nbsp;•&nbsp; Keep the amount accurate
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            {onCancel && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={submitting}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting
                ? 'Saving...'
                : isEditing
                ? 'Update Expense'
                : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
