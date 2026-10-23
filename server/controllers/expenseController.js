const mongoose = require('mongoose');
const Expense = require('../models/Expense');

// @desc    Get all expenses with filtering, search, and pagination
// @route   GET /api/expenses
const getAllExpenses = async (req, res) => {
  try {
    const {
      search,
      category,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    // Search by title (case-insensitive)
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Filter by category (skip if "All" or empty)
    if (category && category !== 'All') {
      filter.category = category;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Expense.countDocuments(filter),
    ]);

    res.json({
      expenses,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get single expense by ID
// @route   GET /api/expenses/:id
const getExpenseById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new expense
// @route   POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const { title, amount, category, date, paymentMethod } = req.body;

    const expense = new Expense({
      title,
      amount,
      category,
      date,
      paymentMethod,
    });

    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: 'Validation Error', errors: messages });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Update fields from request body
    const { title, amount, category, date, paymentMethod } = req.body;
    if (title !== undefined) expense.title = title;
    if (amount !== undefined) expense.amount = amount;
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = date;
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: 'Validation Error', errors: messages });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get expense summary and statistics
// @route   GET /api/expenses/summary
const getSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalResult,
      monthlyResult,
      transactionCount,
      recentTransactions,
      categoryBreakdown,
    ] = await Promise.all([
      // 1. Total expenses (all time)
      Expense.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // 2. Monthly expenses (current month)
      Expense.aggregate([
        { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // 3. Total transaction count
      Expense.countDocuments(),
      // 4. Recent 5 transactions
      Expense.find().sort({ date: -1, createdAt: -1 }).limit(5),
      // 5. Category breakdown for current month
      Expense.aggregate([
        { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $project: { _id: 0, category: '$_id', total: 1 } },
      ]),
    ]);

    const totalExpenses = totalResult.length > 0 ? totalResult[0].total : 0;
    const monthlyExpenses = monthlyResult.length > 0 ? monthlyResult[0].total : 0;

    res.json({
      totalExpenses,
      monthlyExpenses,
      transactionCount,
      recentTransactions,
      categoryBreakdown,
      currentMonth: {
        start: startOfMonth,
        end: endOfMonth,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
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
