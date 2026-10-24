const incomeRepository = require('../repositories/incomeRepository');
const { validateUuid, parseDate, parseAmount, parsePage, paymentMethods } = require('../utils/validation');

const incomeCategories = new Set(['Salary', 'Freelance', 'Business', 'Investment Returns', 'Gift', 'Other']);
const errorResponse = (res, errors) => res.status(400).json({ message: 'Validation Error', errors });
const validateFields = (body, partial = false) => {
  const errors = [];
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.trim().length > 100) errors.push('Title must be between 1 and 100 characters');
  }
  if (!partial || body.amount !== undefined) if (parseAmount(body.amount) === null) errors.push('Amount must be greater than 0');
  if (!partial || body.category !== undefined) if (!incomeCategories.has(body.category)) errors.push('Invalid income category');
  if (!partial || body.date !== undefined) if (!parseDate(body.date)) errors.push('Invalid date');
  if (!partial || body.paymentMethod !== undefined) if (!paymentMethods.has(body.paymentMethod)) errors.push('Invalid payment method');
  if (body.description !== undefined && (typeof body.description !== 'string' || body.description.trim().length > 500)) errors.push('Description cannot exceed 500 characters');
  return errors;
};
const dbError = (res, error) => {
  if (['22P02', '22007', '23514', '23502'].includes(error.code)) return errorResponse(res, ['Invalid income data']);
  if (error.code === '42P01') return res.status(503).json({ message: 'Income migration has not been applied' });
  console.error(error); return res.status(500).json({ message: 'Server Error' });
};

const list = async (req, res) => {
  try {
    const page = parsePage(req.query.page, 1, 1000000);
    const limit = parsePage(req.query.limit, 10, 100);
    const sort = req.query.sort || 'newest';
    const starts = req.query.startDate ? parseDate(req.query.startDate) : null;
    const ends = req.query.endDate ? parseDate(req.query.endDate) : null;
    const errors = [];
    if (req.query.page && !/^\d+$/.test(String(req.query.page))) errors.push('Invalid page');
    if (req.query.limit && !/^\d+$/.test(String(req.query.limit))) errors.push('Invalid limit');
    if (!['newest', 'oldest', 'amountDesc', 'amountAsc'].includes(sort)) errors.push('Invalid sort');
    if (req.query.startDate && !starts) errors.push('Invalid start date');
    if (req.query.endDate && !ends) errors.push('Invalid end date');
    if (starts && ends && starts > ends) errors.push('Start date must be before end date');
    if (req.query.category && !incomeCategories.has(req.query.category)) errors.push('Invalid income category');
    if (req.query.paymentMethod && !paymentMethods.has(req.query.paymentMethod)) errors.push('Invalid payment method');
    if (errors.length) return errorResponse(res, errors);
    const result = await incomeRepository.findMany({
      userId: req.user.id, search: typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '',
      category: req.query.category, paymentMethod: req.query.paymentMethod, startDate: starts, endDate: ends, page, limit, sort,
    });
    return res.json({ incomes: result.incomes, total: result.total, page, pages: Math.ceil(result.total / limit) });
  } catch (error) { return dbError(res, error); }
};
const get = async (req, res) => {
  if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Income not found' });
  try { const item = await incomeRepository.findById(req.params.id, req.user.id); return item ? res.json(item) : res.status(404).json({ message: 'Income not found' }); } catch (error) { return dbError(res, error); }
};
const create = async (req, res) => {
  const body = req.body || {}; const errors = validateFields(body);
  if (errors.length) return errorResponse(res, errors);
  try { return res.status(201).json(await incomeRepository.create({ userId: req.user.id, title: body.title.trim(), description: body.description?.trim() || null, amount: parseAmount(body.amount), category: body.category, date: parseDate(body.date), paymentMethod: body.paymentMethod })); } catch (error) { return dbError(res, error); }
};
const update = async (req, res) => {
  if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Income not found' });
  const body = req.body || {}; const errors = validateFields(body, true);
  if (errors.length) return errorResponse(res, errors);
  try {
    const item = await incomeRepository.update({ id: req.params.id, userId: req.user.id, title: body.title === undefined ? null : body.title.trim(), description: body.description === undefined ? null : body.description.trim() || null, amount: body.amount === undefined ? null : parseAmount(body.amount), category: body.category === undefined ? null : body.category, date: body.date === undefined ? null : parseDate(body.date), paymentMethod: body.paymentMethod === undefined ? null : body.paymentMethod, hasDescription: body.description !== undefined });
    return item ? res.json(item) : res.status(404).json({ message: 'Income not found' });
  } catch (error) { return dbError(res, error); }
};
const remove = async (req, res) => {
  if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Income not found' });
  try { return (await incomeRepository.remove(req.params.id, req.user.id)) ? res.json({ message: 'Income deleted successfully' }) : res.status(404).json({ message: 'Income not found' }); } catch (error) { return dbError(res, error); }
};
module.exports = { list, get, create, update, remove, incomeCategories };
