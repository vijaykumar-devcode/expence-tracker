const financeRepository = require('../repositories/financeRepository');
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const getSummary = async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  if (!monthPattern.test(month)) return res.status(400).json({ message: 'Validation Error', errors: ['Month must be YYYY-MM'] });
  try { return res.json(await financeRepository.summary(req.user.id, month)); } catch (error) {
    if (error.code === '42P01') return res.status(503).json({ message: 'Income migration has not been applied' });
    console.error(error); return res.status(500).json({ message: 'Server Error' });
  }
};
module.exports = { getSummary };
