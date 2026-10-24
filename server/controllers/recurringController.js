const recurringRepository = require('../repositories/recurringRepository');
const { categories, paymentMethods, validateUuid, parseDate, parseAmount } = require('../utils/validation');
const { incomeCategories } = require('./incomeController');

const frequencies = new Set(['daily', 'weekly', 'monthly', 'yearly']);
const types = new Set(['income', 'expense']);
const validationError = (res, errors) => res.status(400).json({ message: 'Validation Error', errors });

const validate = (body, partial = false) => {
  const errors = [];
  if (!partial || body.type !== undefined) if (!types.has(body.type)) errors.push('Invalid transaction type');
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 1 || body.title.trim().length > 100) errors.push('Title must be between 1 and 100 characters');
  }
  if (!partial || body.amount !== undefined) if (parseAmount(body.amount) === null) errors.push('Amount must be greater than 0');
  if (!partial || body.frequency !== undefined) if (!frequencies.has(body.frequency)) errors.push('Invalid frequency');
  if (!partial || body.startDate !== undefined) if (!parseDate(body.startDate)) errors.push('Invalid start date');
  if (body.endDate !== undefined && body.endDate !== null && body.endDate !== '' && !parseDate(body.endDate)) errors.push('Invalid end date');
  if (body.nextDueDate !== undefined && !parseDate(body.nextDueDate)) errors.push('Invalid next due date');
  if (body.description !== undefined && body.description !== null && (typeof body.description !== 'string' || body.description.trim().length > 500)) errors.push('Description cannot exceed 500 characters');
  if (body.paymentMethod !== undefined && body.paymentMethod !== null && body.paymentMethod !== '' && !paymentMethods.has(body.paymentMethod)) errors.push('Invalid payment method');
  if (body.category !== undefined && body.category !== null && body.category !== '') {
    const validCategories = body.type === 'income' ? incomeCategories : categories;
    if (!validCategories.has(body.category)) errors.push('Invalid category');
  }
  if (body.endDate && body.startDate && parseDate(body.endDate) < parseDate(body.startDate)) errors.push('End date must be on or after start date');
  if (body.nextDueDate && body.startDate && parseDate(body.nextDueDate) < parseDate(body.startDate)) errors.push('Next due date must be on or after start date');
  if (body.autoGenerate && (!body.category || !body.paymentMethod)) errors.push('Automatic generation requires a category and payment method');
  return errors;
};

const normalize = (body, existing) => {
  const startDate = parseDate(body.startDate ?? existing?.startDate);
  return {
    type: body.type ?? existing?.type,
    title: (body.title ?? existing?.title).trim(),
    description: body.description === undefined ? existing?.description || null : body.description?.trim() || null,
    amount: body.amount === undefined ? existing?.amount : parseAmount(body.amount),
    category: body.category === undefined ? existing?.category || null : body.category || null,
    paymentMethod: body.paymentMethod === undefined ? existing?.paymentMethod || null : body.paymentMethod || null,
    frequency: body.frequency ?? existing?.frequency,
    startDate,
    endDate: body.endDate === undefined ? existing?.endDate || null : body.endDate ? parseDate(body.endDate) : null,
    nextDueDate: body.nextDueDate ? parseDate(body.nextDueDate) : (existing?.nextDueDate || startDate),
    active: existing?.active ?? true,
    autoGenerate: body.autoGenerate === undefined ? existing?.autoGenerate || false : body.autoGenerate === true,
    anchorDay: Number(startDate.slice(8, 10)),
    timezone: body.timezone || existing?.timezone || 'UTC',
  };
};

const list = async (req, res) => {
  try { return res.json({ recurringTransactions: await recurringRepository.findMany(req.user.id) }); }
  catch (error) {
    if (error.code === '42P01') return res.status(503).json({ message: 'Recurring transactions migration has not been applied' });
    console.error(error); return res.status(500).json({ message: 'Server Error' });
  }
};

const create = async (req, res) => {
  const body = req.body || {};
  const errors = validate(body);
  if (errors.length) return validationError(res, errors);
  const data = normalize(body);
  if (data.endDate && data.endDate < data.nextDueDate) data.nextDueDate = data.endDate;
  try { return res.status(201).json(await recurringRepository.create(req.user.id, data)); }
  catch (error) { if (error.code === '42P01') return res.status(503).json({ message: 'Recurring transactions migration has not been applied' }); console.error(error); return res.status(500).json({ message: 'Server Error' }); }
};

const update = async (req, res) => {
  if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Recurring transaction not found' });
  try {
    const current = (await recurringRepository.findMany(req.user.id)).find((item) => item._id === req.params.id);
    if (!current) return res.status(404).json({ message: 'Recurring transaction not found' });
    const errors = validate({ ...current, ...req.body }, true);
    if (errors.length) return validationError(res, errors);
    return res.json(await recurringRepository.update(req.user.id, req.params.id, normalize(req.body, current)));
  } catch (error) {
    if (error.code === '42P01') return res.status(503).json({ message: 'Recurring transactions migration has not been applied' });
    console.error(error); return res.status(500).json({ message: 'Server Error' });
  }
};

const setActive = async (req, res) => {
  if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Recurring transaction not found' });
  try {
    const item = await recurringRepository.setActive(req.user.id, req.params.id, req.body?.active === true);
    return item ? res.json(item) : res.status(404).json({ message: 'Recurring transaction not found' });
  } catch (error) {
    if (error.code === '42P01') return res.status(503).json({ message: 'Recurring transactions migration has not been applied' });
    console.error(error); return res.status(500).json({ message: 'Server Error' });
  }
};

const remove = async (req, res) => {
  if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Recurring transaction not found' });
  try { return (await recurringRepository.remove(req.user.id, req.params.id)) ? res.json({ message: 'Recurring transaction deleted successfully' }) : res.status(404).json({ message: 'Recurring transaction not found' }); }
  catch (error) {
    if (error.code === '42P01') return res.status(503).json({ message: 'Recurring transactions migration has not been applied' });
    console.error(error); return res.status(500).json({ message: 'Server Error' });
  }
};

const processDue = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const generated = await recurringRepository.processDue(req.user.id, today);
    return res.json({ generated, processedAt: today });
  } catch (error) {
    if (error.code === '42P01') return res.status(503).json({ message: 'Recurring transactions migration has not been applied' });
    console.error(error); return res.status(500).json({ message: 'Unable to process recurring transactions' });
  }
};

module.exports = { list, create, update, setActive, remove, processDue };
