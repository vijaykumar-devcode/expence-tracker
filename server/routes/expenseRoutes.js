const express = require('express');
const router = express.Router();
const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getSummary,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// GET /api/expenses/summary — must be before /:id to avoid conflict
router.get('/summary', getSummary);

// GET /api/expenses
router.get('/', getAllExpenses);

// GET /api/expenses/:id
router.get('/:id', getExpenseById);

// POST /api/expenses
router.post('/', createExpense);

// PUT /api/expenses/:id
router.put('/:id', updateExpense);

// DELETE /api/expenses/:id
router.delete('/:id', deleteExpense);

module.exports = router;
