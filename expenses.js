const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const Expense = require('../models/Expense');
const authMiddleware = require('../middleware/auth');

/* =========================
   GET ALL EXPENSES (AUTH)
========================= */
router.get(
    '/',
    authMiddleware,
    [
        query('category').optional().isString().trim(),
        query('month')
            .optional()
            .matches(/^\d{4}-\d{2}$/)
            .withMessage('Month must be YYYY-MM'),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    async (req, res) => {
        try {
            const userId = req.userId;
            const { category, month, limit } = req.query;

            const filter = { userId };

            if (category) {
                filter.category = category;
            }

            if (month) {
                const [year, m] = month.split('-');
                filter.date = {
                    $gte: new Date(year, m - 1, 1),
                    $lte: new Date(year, m, 0, 23, 59, 59)
                };
            }

            let queryBuilder = Expense.find(filter).sort({ date: -1 });

            if (limit) {
                queryBuilder = queryBuilder.limit(Number(limit));
            }

            const expenses = await queryBuilder;
            res.json(expenses);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Failed to fetch expenses' });
        }
    }
);

/* =========================
   CREATE EXPENSE (AUTH)
========================= */
router.post(
    '/',
    authMiddleware,
    [
        body('title').trim().notEmpty(),
        body('amount').isFloat({ min: 0 }),
        body('category').optional().trim(),
        body('date').optional().isISO8601()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const expense = await Expense.create({
                userId: req.userId,
                title: req.body.title,
                amount: req.body.amount,
                category: req.body.category || 'Other',
                date: req.body.date || Date.now(),
                description: req.body.description || ''
            });

            res.status(201).json(expense);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Failed to create expense' });
        }
    }
);

/* =========================
   GET SINGLE EXPENSE
========================= */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const expense = await Expense.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json(expense);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch expense' });
    }
});

/* =========================
   UPDATE EXPENSE
========================= */
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const expense = await Expense.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json(expense);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update expense' });
    }
});

/* =========================
   DELETE EXPENSE
========================= */
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete expense' });
    }
});

module.exports = router;
