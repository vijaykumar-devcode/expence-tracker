const goalRepository = require('../repositories/goalRepository');
const { parseAmount, parseDate, validateUuid } = require('../utils/validation');
const error = (res, errors) => res.status(400).json({ message: 'Validation Error', errors });
const validGoal = (body, partial = false) => {
  const errors = [];
  if (!partial || body.name !== undefined) if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 100) errors.push('Name must be between 1 and 100 characters');
  if (!partial || body.targetAmount !== undefined) if (parseAmount(body.targetAmount) === null) errors.push('Target amount must be greater than 0');
  if (body.deadline && !parseDate(body.deadline)) errors.push('Invalid deadline');
  if (body.deadline && parseDate(body.deadline) < new Date().toISOString().slice(0, 10)) errors.push('Deadline cannot be in the past');
  if (body.description !== undefined && body.description !== null && body.description.length > 500) errors.push('Description cannot exceed 500 characters');
  return errors;
};
const dbError = (res, e) => {
  if (e.code === '42P01') return res.status(503).json({ message: 'Savings goals migration has not been applied' });
  console.error(e); return res.status(500).json({ message: 'Server Error' });
};
const list = async (req, res) => { try { return res.json({ goals: await goalRepository.list(req.user.id) }); } catch (e) { return dbError(res, e); } };
const create = async (req, res) => { const body = req.body || {}; const errors = validGoal(body); if (errors.length) return error(res, errors); try { return res.status(201).json(await goalRepository.create(req.user.id, { name: body.name.trim(), targetAmount: parseAmount(body.targetAmount), deadline: body.deadline ? parseDate(body.deadline) : null, description: body.description?.trim() || null })); } catch (e) { return dbError(res, e); } };
const update = async (req, res) => { if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Goal not found' }); const body = req.body || {}; const errors = validGoal(body, true); if (errors.length) return error(res, errors); try { const item = await goalRepository.update(req.user.id, req.params.id, { name: body.name?.trim(), targetAmount: body.targetAmount === undefined ? null : parseAmount(body.targetAmount), deadline: body.deadline ? parseDate(body.deadline) : null, description: body.description?.trim() || null }); return item ? res.json(item) : res.status(404).json({ message: 'Goal not found' }); } catch (e) { return dbError(res, e); } };
const remove = async (req, res) => { if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Goal not found' }); try { return (await goalRepository.remove(req.user.id, req.params.id)) ? res.json({ message: 'Goal deleted successfully' }) : res.status(404).json({ message: 'Goal not found' }); } catch (e) { console.error(e); return res.status(500).json({ message: 'Server Error' }); } };
const entries = async (req, res) => { if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Goal not found' }); try { return res.json({ entries: await goalRepository.entries(req.user.id, req.params.id) }); } catch (e) { console.error(e); return res.status(500).json({ message: 'Server Error' }); } };
const addEntry = async (req, res) => { if (!validateUuid(req.params.id)) return res.status(404).json({ message: 'Goal not found' }); const body = req.body || {}; const errors = []; if (!['contribution', 'withdrawal'].includes(body.type)) errors.push('Invalid entry type'); if (parseAmount(body.amount) === null) errors.push('Amount must be greater than 0'); if (!parseDate(body.date)) errors.push('Invalid date'); if (body.note && body.note.length > 500) errors.push('Note cannot exceed 500 characters'); if (errors.length) return error(res, errors); try { const result = await goalRepository.addEntry(req.user.id, req.params.id, { ...body, amount: parseAmount(body.amount), date: parseDate(body.date) }); if (!result) return res.status(404).json({ message: 'Goal not found' }); if (result.insufficient) return res.status(409).json({ message: 'Withdrawal exceeds available goal balance' }); return res.status(201).json(result); } catch (e) { console.error(e); return res.status(500).json({ message: 'Server Error' }); } };
module.exports = { list, create, update, remove, entries, addEntry };
