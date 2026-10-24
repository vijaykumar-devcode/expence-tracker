import React, { useEffect, useState } from 'react';
import { addGoalEntry, createGoal, deleteGoal, getGoalEntries, getGoals, updateGoal } from '../api/goalApi';
import Loading from './Loading';
import './Goals.css';

const initial = { name: '', targetAmount: '', deadline: '', description: '' };
const today = new Date().toISOString().slice(0, 10);
const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState(initial);
  const [entry, setEntry] = useState({ type: 'contribution', amount: '', date: today, note: '' });
  const [editing, setEditing] = useState(null);
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => { try { setLoading(true); setError(''); setGoals((await getGoals()).goals || []); } catch (err) { setError(err.response?.data?.message || 'Unable to load goals.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const submit = async (event) => { event.preventDefault(); try { const payload = { ...form, targetAmount: Number(form.targetAmount), deadline: form.deadline || null }; if (editing) await updateGoal(editing, payload); else await createGoal(payload); setForm(initial); setEditing(null); await load(); } catch (err) { setError(err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Unable to save goal.'); } };
  const addEntry = async (id) => { try { await addGoalEntry(id, { ...entry, amount: Number(entry.amount) }); setEntry({ ...entry, amount: '', note: '' }); await load(); await showHistory(id); } catch (err) { setError(err.response?.data?.message || 'Unable to record goal entry.'); } };
  const showHistory = async (id) => { try { setHistory({ ...history, [id]: (await getGoalEntries(id)).entries || [] }); } catch (err) { setError('Unable to load contribution history.'); } };
  return <div className="goals-container">
    <form className="expense-form-card goals-form" onSubmit={submit}>
      <input className="form-input" placeholder="Goal name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input className="form-input" type="number" min="0.01" step="0.01" placeholder="Target amount" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} required />
      <input className="form-input" type="date" min={today} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
      <input className="form-input" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <button className="btn-add-expense" type="submit">{editing ? 'Update Goal' : 'Create Goal'}</button>
      {editing && <button className="btn-clear-filters" type="button" onClick={() => { setEditing(null); setForm(initial); }}>Cancel</button>}
    </form>
    {error && <div className="table-error">{error}</div>}
    {loading ? <Loading text="Loading goals..." /> : <div className="goals-list">{goals.length === 0 ? <div className="table-empty">No savings goals yet.</div> : goals.map((goal) => <div className="goal-card" key={goal._id}>
      <div className="goal-card-heading"><div><h2>{goal.name}</h2><small>{goal.deadline ? `Deadline: ${goal.deadline}` : 'No deadline'}</small></div><div><button className="action-btn action-btn--edit" type="button" onClick={() => { setEditing(goal._id); setForm({ name: goal.name, targetAmount: goal.targetAmount, deadline: goal.deadline || '', description: goal.description || '' }); }}>Edit</button><button className="action-btn action-btn--delete" type="button" onClick={async () => { await deleteGoal(goal._id); load(); }}>Delete</button></div></div>
      <p>₹ {goal.balance.toLocaleString('en-IN')} of ₹ {goal.targetAmount.toLocaleString('en-IN')} allocated</p><div className="goal-progress"><span style={{ width: `${goal.progress}%` }} /></div><small>{goal.remaining ? `₹ ${goal.remaining.toLocaleString('en-IN')} remaining` : 'Target reached'}</small>
      <div className="goal-entry"><select className="form-select" value={entry.type} onChange={(e) => setEntry({ ...entry, type: e.target.value })}><option value="contribution">Contribution</option><option value="withdrawal">Withdrawal</option></select><input className="form-input" type="number" min="0.01" step="0.01" placeholder="Amount" value={entry.amount} onChange={(e) => setEntry({ ...entry, amount: e.target.value })} /><input className="form-input" type="date" value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} /><input className="form-input" placeholder="Note (optional)" value={entry.note} onChange={(e) => setEntry({ ...entry, note: e.target.value })} /><button className="btn-add-expense" type="button" onClick={() => addEntry(goal._id)}>Record</button></div>
      <button className="btn-clear-filters goal-history-button" type="button" onClick={() => showHistory(goal._id)}>{history[goal._id] ? 'Refresh history' : 'View history'}</button>{history[goal._id] && <div className="goal-history">{history[goal._id].length ? history[goal._id].map((item) => <div key={item._id}><span>{item.type} · {item.date}{item.note ? ` · ${item.note}` : ''}</span><strong>₹ {item.amount.toLocaleString('en-IN')}</strong></div>) : <small>No entries yet.</small>}</div>}
    </div>)}</div>}
  </div>;
};
export default Goals;
