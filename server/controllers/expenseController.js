const {
  categories,
  paymentMethods,
  validateUuid,
  parseDate,
  parseAmount,
  parsePage,
} = require('../utils/validation');
const expenseRepository = require('../repositories/expenseRepository');

const validationError = (res, errors) =>
  res.status(400).json({ message: 'Validation Error', errors });

const databaseError = (res, error) => {
  if (['22P02', '22007', '23514', '23502'].includes(error.code)) {
    return res.status(400).json({ message: 'Validation Error', errors: ['Invalid expense data'] });
  }
  console.error(error);
  return res.status(500).json({ message: 'Server Error' });
};

const validateExpenseFields = (body, partial = false) => {
  const errors = [];
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.trim().length > 100) {
      errors.push('Title must be between 1 and 100 characters');
    }
  }
  if (!partial || body.amount !== undefined) {
    if (parseAmount(body.amount) === null) errors.push('Amount must be greater than 0');
  }
  if (!partial || body.category !== undefined) {
    if (!categories.has(body.category)) errors.push('Invalid category');
  }
  if (!partial || body.date !== undefined) {
    if (!parseDate(body.date)) errors.push('Invalid date');
  }
  if (!partial || body.paymentMethod !== undefined) {
    if (!paymentMethods.has(body.paymentMethod)) errors.push('Invalid payment method');
  }
  if (body.description !== undefined &&
      (typeof body.description !== 'string' || body.description.trim().length > 500)) {
    errors.push('Description cannot exceed 500 characters');
  }
  return errors;
};

const getAllExpenses = async (req, res) => {
  try {
    const page = parsePage(req.query.page, 1, 1000000);
    const limit = parsePage(req.query.limit, 10, 100);
    const startDate = req.query.startDate ? parseDate(req.query.startDate) : null;
    const endDate = req.query.endDate ? parseDate(req.query.endDate) : null;
    const allowedSorts = new Set(['newest', 'oldest', 'amountDesc', 'amountAsc']);
    const sort = req.query.sort || 'newest';
    const errors = [];

    if (req.query.page && !/^\d+$/.test(String(req.query.page))) errors.push('Invalid page');
    if (req.query.limit && !/^\d+$/.test(String(req.query.limit))) errors.push('Invalid limit');
    if (req.query.startDate && !startDate) errors.push('Invalid start date');
    if (req.query.endDate && !endDate) errors.push('Invalid end date');
    if (startDate && endDate && startDate > endDate) errors.push('Start date must be before end date');
    if (!allowedSorts.has(sort)) errors.push('Invalid sort');
    if (req.query.category && req.query.category !== 'All' && req.query.category !== 'All Categories' && !categories.has(req.query.category)) errors.push('Invalid category');
    if (req.query.paymentMethod && req.query.paymentMethod !== 'All' && req.query.paymentMethod !== 'All Payment Methods' && !paymentMethods.has(req.query.paymentMethod)) errors.push('Invalid payment method');
    if (errors.length) return validationError(res, errors);

    const result = await expenseRepository.findMany({
      userId: req.user.id,
      search: typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '',
      category: req.query.category,
      paymentMethod: req.query.paymentMethod,
      startDate,
      endDate,
      page,
      limit,
      sort,
    });
    return res.json({
      expenses: result.expenses,
      total: result.total,
      page,
      pages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    return databaseError(res, error);
  }
};

const getExpenseById = async (req, res) => {
  if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Expense not found' });
  try {
    const expense = await expenseRepository.findById(req.params.id, req.user.id);
    return expense ? res.json(expense) : res.status(404).json({ message: 'Expense not found' });
  } catch (error) {
    return databaseError(res, error);
  }
};

const createExpense = async (req, res) => {
  const body = req.body || {};
  const errors = validateExpenseFields(body);
  if (errors.length) return validationError(res, errors);
  try {
    const expense = await expenseRepository.create({
      userId: req.user.id,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      amount: parseAmount(body.amount),
      category: body.category,
      date: parseDate(body.date),
      paymentMethod: body.paymentMethod,
    });
    return res.status(201).json(expense);
  } catch (error) {
    return databaseError(res, error);
  }
};

const updateExpense = async (req, res) => {
  if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Expense not found' });
  const body = req.body || {};
  const errors = validateExpenseFields(body, true);
  if (errors.length) return validationError(res, errors);
  try {
    const expense = await expenseRepository.update({
      id: req.params.id,
      userId: req.user.id,
      title: body.title === undefined ? null : body.title.trim(),
      description: body.description === undefined ? null : body.description.trim() || null,
      amount: body.amount === undefined ? null : parseAmount(body.amount),
      category: body.category === undefined ? null : body.category,
      date: body.date === undefined ? null : parseDate(body.date),
      paymentMethod: body.paymentMethod === undefined ? null : body.paymentMethod,
      hasDescription: body.description !== undefined,
    });
    return expense ? res.json(expense) : res.status(404).json({ message: 'Expense not found' });
  } catch (error) {
    return databaseError(res, error);
  }
};

const deleteExpense = async (req, res) => {
  if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Expense not found' });
  try {
    const deleted = await expenseRepository.remove(req.params.id, req.user.id);
    return deleted
      ? res.json({ message: 'Expense deleted successfully' })
      : res.status(404).json({ message: 'Expense not found' });
  } catch (error) {
    return databaseError(res, error);
  }
};

const getSummary = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const startDate = formatDate(start);
    const endDate = formatDate(end);
    const summary = await expenseRepository.getSummary(req.user.id, startDate, endDate);
    return res.json({
      ...summary,
      currentMonth: {
        start: `${startDate}T00:00:00.000Z`,
        end: `${endDate}T23:59:59.999Z`,
      },
    });
  } catch (error) {
    return databaseError(res, error);
  }
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getSummary,
};
