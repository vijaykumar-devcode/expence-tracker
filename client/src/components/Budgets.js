import React, { useCallback, useEffect, useState } from 'react';
import { createBudget, deleteBudget, getBudgets, updateBudget } from '../api/budgetApi';
import Loading from './Loading';
import './Budgets.css';

const categories = ['Overall', 'Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Education', 'Other'];
const currentMonth = () => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

const Budgets = ({ onChanged }) => {
  const [month, setMonth] = useState(currentMonth());
  const [budgets, setBudgets] = useState([]);
  const [category, setCategory] = useState('Overall');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setBudgets((await getBudgets(month)).budgets || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load budgets.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await createBudget({ month, category: category === 'Overall' ? null : category, amount: Number(amount) });
      setAmount('');
      await load();
      onChanged();
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Unable to save budget.');
    }
  };

  const edit = async (budget) => {
    const nextAmount = window.prompt('New budget amount', budget.amount);
    if (nextAmount === null) return;
    try { await updateBudget(budget._id, Number(nextAmount)); await load(); onChanged(); } catch (err) {
      setError(err.response?.data?.message || 'Unable to update budget.');
    }
  };

  return (
    <div className="budgets-container">
      <div className="filters-card budgets-toolbar">
        <label className="filter-label" htmlFor="budget-month">Month</label>
        <input id="budget-month" className="filter-select" type="month" value={month.slice(0, 7)} onChange={(e) => setMonth(`${e.target.value}-01`)} />
        <form className="budget-form" onSubmit={submit}>
          <label className="sr-only" htmlFor="budget-category">Budget category</label>
          <select id="budget-category" name="category" className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
          <label className="sr-only" htmlFor="budget-amount">Budget amount</label>
          <input id="budget-amount" name="amount" className="filter-select" type="number" min="0.01" step="0.01" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <button className="btn-add-expense" type="submit">Add Budget</button>
        </form>
      </div>
      {error && <div className="table-error">{error}</div>}
      {loading ? <Loading text="Loading budgets..." /> : (
        <div className="budget-grid">
          {budgets.length === 0 ? <div className="table-empty">No budgets for this month.</div> : budgets.map((budget) => (
            <div className="budget-card" key={budget._id}>
              <div className="budget-card-heading">
                <h2>{budget.category || 'Overall'}</h2>
                <span className={`budget-status budget-status--${budget.alert}`}>{budget.alert === 'exceeded' ? 'Exceeded' : budget.alert === 'warning' ? '80% used' : 'On track'}</span>
              </div>
              <div className="budget-progress"><span style={{ width: `${Math.min(100, budget.percentageUsed)}%` }} /></div>
              <p>₹ {budget.spent.toLocaleString('en-IN')} spent of ₹ {budget.amount.toLocaleString('en-IN')}</p>
              <p>{budget.remaining >= 0 ? `₹ ${budget.remaining.toLocaleString('en-IN')} remaining` : `₹ ${Math.abs(budget.remaining).toLocaleString('en-IN')} over budget`}</p>
              <div className="budget-actions">
                <button type="button" className="action-btn action-btn--edit" onClick={() => edit(budget)}>Edit</button>
                <button type="button" className="action-btn action-btn--delete" onClick={async () => { try { await deleteBudget(budget._id); await load(); onChanged(); } catch (err) { setError(err.response?.data?.message || 'Unable to delete budget.'); } }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Budgets;
