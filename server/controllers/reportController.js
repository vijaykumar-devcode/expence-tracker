const reportRepository = require('../repositories/reportRepository');
const { parseDate } = require('../utils/validation');

const csvCell = (value) => {
  const text = String(value ?? '');
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

const dates = (query) => {
  const startDate = parseDate(query.startDate);
  const endDate = parseDate(query.endDate);
  if (!startDate || !endDate || startDate > endDate) return null;
  return { startDate, endDate };
};

const getReport = async (req, res) => {
  const range = dates(req.query);
  if (!range) return res.status(400).json({ message: 'Validation Error', errors: ['Valid startDate and endDate are required'] });
  try { return res.json(await reportRepository.report(req.user.id, range.startDate, range.endDate)); }
  catch (error) { console.error(error); return res.status(500).json({ message: 'Server Error' }); }
};

const exportCsv = async (req, res) => {
  const range = dates(req.query);
  const type = req.query.type || 'all';
  if (!range || !['all', 'income', 'expense'].includes(type)) return res.status(400).json({ message: 'Validation Error', errors: ['Valid date range and type are required'] });
  try {
    const rows = await reportRepository.findTransactions({ userId: req.user.id, ...range, type });
    const header = ['Date', 'Type', 'Title', 'Description', 'Category', 'Payment Method', 'Amount'];
    const body = rows.map((row) => [row.date, row.type, row.title, row.description, row.category, row.payment_method, Number(row.amount).toFixed(2)].map(csvCell).join(','));
    res.type('text/csv').attachment(`finance-${range.startDate}-${range.endDate}.csv`);
    return res.send([header.map(csvCell).join(','), ...body].join('\r\n'));
  } catch (error) { console.error(error); return res.status(500).json({ message: 'Unable to export report' }); }
};

module.exports = { getReport, exportCsv };
