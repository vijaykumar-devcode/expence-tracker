const budgetRepository = require('../repositories/budgetRepository');
const { categories, validateUuid, parseAmount } = require('../utils/validation');

const monthPattern = /^\d{4}-\d{2}-01$/;
const validMonth = (value) => {
  if (!monthPattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
};

const validationError = (res, errors) => res.status(400).json({ message: 'Validation Error', errors });
const validateBudget = (body, requireMonth) => {
  const errors = [];
  if (requireMonth && (!validMonth(body.month))) errors.push('Month must be the first day in YYYY-MM-01 format');
  if (!categories.has(body.category) && body.category !== undefined && body.category !== null && body.category !== '') {
    errors.push('Invalid category');
  }
  if (parseAmount(body.amount) === null) errors.push('Amount must be greater than 0');
  return errors;
};

const getBudgets = async (req, res) => {
  const month = req.query.month || `${new Date().toISOString().slice(0, 7)}-01`;
  if (!validMonth(month)) return validationError(res, ['Month must be the first day in YYYY-MM-01 format']);
  try {
    return res.json({ budgets: await budgetRepository.findMany(req.user.id, month), month });
  } catch (error) {
    if (error.code === '42P01') return res.status(503).json({ message: 'Budget migration has not been applied' });
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

const createBudget = async (req, res) => {
  const body = req.body || {};
  const errors = validateBudget(body, true);
  if (errors.length) return validationError(res, errors);
  try {
    return res.status(201).json(await budgetRepository.create({
      userId: req.user.id,
      month: body.month,
      category: body.category || null,
      amount: parseAmount(body.amount),
    }));
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'A budget already exists for this month and scope' });
    if (error.code === '42P01') return res.status(503).json({ message: 'Budget migration has not been applied' });
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

const updateBudget = async (req, res) => {
  if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Budget not found' });
  const errors = validateBudget(req.body || {}, false);
  if (errors.length) return validationError(res, errors);
  try {
    const budget = await budgetRepository.update({
      id: req.params.id,
      userId: req.user.id,
      amount: parseAmount(req.body.amount),
    });
    return budget ? res.json(budget) : res.status(404).json({ message: 'Budget not found' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

const deleteBudget = async (req, res) => {
  if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Budget not found' });
  try {
    const deleted = await budgetRepository.remove(req.params.id, req.user.id);
    return deleted ? res.json({ message: 'Budget deleted successfully' }) : res.status(404).json({ message: 'Budget not found' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
