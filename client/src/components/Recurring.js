import React, { useCallback, useEffect, useState } from 'react';
import {
  createRecurring, deleteRecurring, getRecurring, processRecurring,
  setRecurringStatus, updateRecurring,
} from '../api/recurringApi';
import Loading from './Loading';
import './Recurring.css';

const expenseCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Education', 'Other'];
const incomeCategories = ['Salary', 'Freelance', 'Business', 'Investment Returns', 'Gift', 'Other'];
const paymentMethods = ['Cash', 'UPI', 'Card', 'Other'];
const today = new Date().toISOString().slice(0, 10);
const initial = {
  type: 'expense', title: '', amount: '', category: 'Food', paymentMethod: 'Cash',
  description: '', frequency: 'monthly', startDate: today, endDate: '',
  autoGenerate: false, timezone: 'UTC',
};

const Recurring = ({ onChanged }) => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const categories = form.type === 'income' ? incomeCategories : expenseCategories;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setItems((await getRecurring()).recurringTransactions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load recurring transactions.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => {
      if (name === 'type') return { ...current, type: value, category: value === 'income' ? incomeCategories[0] : expenseCategories[0] };
      return { ...current, [name]: type === 'checkbox' ? checked : value };
    });
  };
  const submit = async (event) => {
    event.preventDefault();
    try {
      setBusy(true);
      const payload = { ...form, amount: Number(form.amount), endDate: form.endDate || null };
      if (editing) await updateRecurring(editing, payload);
      else await createRecurring(payload);
      setEditing(null);
      setForm(initial);
      await load();
      onChanged();
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Unable to save schedule.');
    } finally { setBusy(false); }
  };
  const edit = (item) => {
    setEditing(item._id);
    setForm({ ...initial, ...item, type: item.type, startDate: item.startDate.slice(0, 10), endDate: item.endDate ? item.endDate.slice(0, 10) : '' });
  };
  const process = async () => {
    try { setBusy(true); const result = await processRecurring(); setError(`${result.generated.length} transaction(s) generated.`); await load(); onChanged(); }
    catch (err) { setError(err.response?.data?.message || 'Unable to process schedules.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="recurring-container">
      <div className="recurring-header">
        <button className="btn-add-expense" type="button" onClick={process} disabled={busy}>Process due automatic schedules</button>
      </div>
      {error && <div className="table-error">{error}</div>}
      <form className="expense-form-card recurring-form" onSubmit={submit}>
        <div className="recurring-grid">
          <select className="form-select" name="type" value={form.type} onChange={change}><option value="expense">Expense</option><option value="income">Income</option></select>
          <input className="form-input" name="title" placeholder="Title" value={form.title} onChange={change} required maxLength="100" />
          <input className="form-input" name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" value={form.amount} onChange={change} required />
          <select className="form-select" name="category" value={form.category} onChange={change}><option value="">No category</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="form-select" name="paymentMethod" value={form.paymentMethod} onChange={change}><option value="">No payment method</option>{paymentMethods.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="form-select" name="frequency" value={form.frequency} onChange={change}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
          <input className="form-input" name="startDate" type="date" value={form.startDate} onChange={change} required />
          <input className="form-input" name="endDate" type="date" value={form.endDate} onChange={change} />
          <input className="form-input recurring-wide" name="description" placeholder="Description (optional)" value={form.description} onChange={change} maxLength="500" />
        </div>
        <label className="recurring-consent"><input type="checkbox" name="autoGenerate" checked={form.autoGenerate} onChange={change} /> Automatically create due transactions when I press “Process due”</label>
        <div><button className="btn-add-expense" type="submit" disabled={busy}>{editing ? 'Update Schedule' : 'Create Schedule'}</button>{editing && <button className="btn-clear-filters" type="button" onClick={() => { setEditing(null); setForm(initial); }}>Cancel</button>}</div>
      </form>
      <div className="recurring-list">
        {loading ? <Loading text="Loading schedules..." /> : items.length === 0 ? <div className="table-empty">No recurring schedules yet.</div> : items.map((item) => {
          const completed = item.endDate && item.nextDueDate > item.endDate;
          return <div className="recurring-card" key={item._id}>
            <div><h2>{item.title}</h2><p>{item.type} · {item.frequency} · next due {item.nextDueDate}</p><p>₹ {item.amount.toLocaleString('en-IN')} · {item.autoGenerate ? 'Automatic generation enabled' : 'Reminder/manual confirmation'}</p></div>
            <span className={`recurring-status ${completed ? 'completed' : item.active ? 'active' : 'paused'}`}>{completed ? 'Completed' : item.active ? 'Active' : 'Paused'}</span>
            <div className="recurring-actions">
              <button className="action-btn action-btn--edit" type="button" onClick={() => edit(item)}>Edit</button>
              {!completed && <button className="action-btn" type="button" onClick={async () => { try { await setRecurringStatus(item._id, !item.active); await load(); } catch (err) { setError(err.response?.data?.message || 'Unable to change schedule status.'); } }}>{item.active ? 'Pause' : 'Resume'}</button>}
              <button className="action-btn action-btn--delete" type="button" onClick={async () => { if (!window.confirm('Delete this recurring schedule?')) return; try { await deleteRecurring(item._id); await load(); } catch (err) { setError(err.response?.data?.message || 'Unable to delete schedule.'); } }}>Delete</button>
            </div>
          </div>;
        })}
      </div>
    </div>
  );
};
export default Recurring;
