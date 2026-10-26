import React, { useCallback, useEffect, useState } from 'react';
import { createIncome, deleteIncome, getIncome, updateIncome } from '../api/incomeApi';
import Loading from './Loading';
import './Income.css';

const categories = ['Salary', 'Freelance', 'Business', 'Investment Returns', 'Gift', 'Other'];
const paymentMethods = ['Cash', 'UPI', 'Card', 'Other'];
const initial = { title: '', amount: '', category: 'Salary', date: new Date().toISOString().slice(0, 10), paymentMethod: 'Cash', description: '' };

const Income = ({ onChanged }) => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const result = await getIncome({ search: search || undefined, category: category || undefined, paymentMethod: paymentMethod || undefined, sort, page, limit: 10 });
      setItems(result.incomes || []); setPages(result.pages || 1);
    } catch (err) { setError(err.response?.data?.message || 'Unable to load income.'); } finally { setLoading(false); }
  }, [search, category, paymentMethod, sort, page]);
  useEffect(() => { load(); }, [load]);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    try {
      setError('');
      if (editing) await updateIncome(editing, { ...form, amount: Number(form.amount) });
      else await createIncome({ ...form, amount: Number(form.amount) });
      setForm(initial); setEditing(null); await load(); onChanged();
    } catch (err) { setError(err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Unable to save income.'); }
  };
  const edit = (item) => { setEditing(item._id); setForm({ ...initial, ...item, date: item.date.slice(0, 10) }); };
  const remove = async (id) => { try { await deleteIncome(id); await load(); onChanged(); } catch (err) { setError(err.response?.data?.message || 'Unable to delete income.'); } };

  return <div className="income-container">
    <form className="expense-form-card income-form" onSubmit={submit}>
      <div className="income-form-grid">
        <label className="sr-only" htmlFor="income-title">Title</label><input id="income-title" className="form-input" name="title" placeholder="Title" value={form.title} onChange={change} required maxLength="100" />
        <label className="sr-only" htmlFor="income-amount">Amount</label><input id="income-amount" className="form-input" name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" value={form.amount} onChange={change} required />
        <label className="sr-only" htmlFor="income-category">Category</label><select id="income-category" className="form-select" name="category" value={form.category} onChange={change}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <label className="sr-only" htmlFor="income-date">Date</label><input id="income-date" className="form-input" name="date" type="date" value={form.date} onChange={change} required />
        <label className="sr-only" htmlFor="income-payment-method">Payment method</label><select id="income-payment-method" className="form-select" name="paymentMethod" value={form.paymentMethod} onChange={change}>{paymentMethods.map((item) => <option key={item}>{item}</option>)}</select>
        <label className="sr-only" htmlFor="income-description">Description</label><input id="income-description" className="form-input" name="description" placeholder="Description (optional)" value={form.description} onChange={change} maxLength="500" />
      </div>
      <button className="btn-add-expense" type="submit">{editing ? 'Update Income' : 'Add Income'}</button>
      {editing && <button className="btn-clear-filters" type="button" onClick={() => { setEditing(null); setForm(initial); }}>Cancel</button>}
    </form>
    <div className="filters-card income-filters">
      <label className="sr-only" htmlFor="income-search">Search income</label><input id="income-search" name="search" className="search-input" placeholder="Search title or description" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      <label className="sr-only" htmlFor="income-filter-category">Filter by category</label><select id="income-filter-category" name="filterCategory" className="filter-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}><option value="">All Categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
      <label className="sr-only" htmlFor="income-filter-payment">Filter by payment method</label><select id="income-filter-payment" name="filterPaymentMethod" className="filter-select" value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}><option value="">All Payment Methods</option>{paymentMethods.map((item) => <option key={item}>{item}</option>)}</select>
      <label className="sr-only" htmlFor="income-sort">Sort income</label><select id="income-sort" name="sort" className="filter-select" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="amountDesc">Amount high to low</option><option value="amountAsc">Amount low to high</option></select>
    </div>
    {error && <div className="table-error">{error}</div>}
    <div className="table-card">{loading ? <Loading text="Loading income..." /> : items.length === 0 ? <div className="table-empty">No income records found.</div> : <div className="table-wrapper"><table className="expenses-table"><thead><tr><th>Title</th><th>Amount</th><th>Category</th><th>Date</th><th>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}><td>{item.title}<small>{item.description}</small></td><td>₹ {item.amount.toLocaleString('en-IN')}</td><td>{item.category}</td><td>{new Date(item.date).toLocaleDateString()}</td><td><button className="action-btn action-btn--edit" onClick={() => edit(item)}>Edit</button><button className="action-btn action-btn--delete" onClick={() => remove(item._id)}>Delete</button></td></tr>)}</tbody></table></div>}</div>
    {pages > 1 && <div className="pagination-controls"><button className="btn-clear-filters" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button className="btn-clear-filters" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button></div>}
  </div>;
};
export default Income;
