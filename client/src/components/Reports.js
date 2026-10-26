import React, { useEffect, useState } from 'react';
import { downloadReport, getReport } from '../api/reportApi';
import Loading from './Loading';
import './Reports.css';

const Reports = () => {
  const today = new Date();
  const [range, setRange] = useState({ startDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`, endDate: today.toISOString().slice(0, 10) });
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { getReport(range).then(setReport).catch((err) => setError(err.response?.data?.message || 'Unable to load report.')); }, [range]);
  return <div className="reports-container">
    <div className="report-toolbar"><label className="sr-only" htmlFor="report-start-date">Report start date</label><input id="report-start-date" name="startDate" className="filter-select" type="date" value={range.startDate} onChange={(e) => setRange({ ...range, startDate: e.target.value })} /><label className="sr-only" htmlFor="report-end-date">Report end date</label><input id="report-end-date" name="endDate" className="filter-select" type="date" value={range.endDate} onChange={(e) => setRange({ ...range, endDate: e.target.value })} /><button className="btn-add-expense" type="button" onClick={() => downloadReport({ ...range, type: 'all' })}>Export CSV</button></div>
    {error && <div className="table-error">{error}</div>}
    {!report ? <Loading text="Loading report..." /> : <><div className="report-cards"><div><span>Income</span><strong>₹ {report.totalIncome.toLocaleString('en-IN')}</strong></div><div><span>Expenses</span><strong>₹ {report.totalExpenses.toLocaleString('en-IN')}</strong></div><div><span>Net cash flow</span><strong>₹ {report.netCashFlow.toLocaleString('en-IN')}</strong></div><div><span>Savings rate</span><strong>{report.savingsRate.toFixed(1)}%</strong></div></div><div className="table-card report-breakdown"><h2>Expense breakdown</h2>{report.expenseCategoryBreakdown.length ? report.expenseCategoryBreakdown.map((item) => <p key={item.category}><span>{item.category}</span><strong>₹ {item.total.toLocaleString('en-IN')}</strong></p>) : <div className="table-empty">No expenses in this period.</div>}</div></>}
  </div>;
};
export default Reports;
