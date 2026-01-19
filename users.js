const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

/* =========================
   GET CURRENT USER (AUTH)
========================= */
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch user' });
    }
});

/* =========================
   UPDATE CURRENT USER
========================= */
router.put(
    '/me',
    authMiddleware,
    [
        body('name').optional().trim().notEmpty(),
        body('monthlyIncome').optional().isFloat({ min: 0 }),
        body('monthlyBudget').optional().isFloat({ min: 0 }),
        body('currency').optional().isIn(['INR', 'USD', 'EUR', 'GBP'])
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const updatedUser = await User.findByIdAndUpdate(
                req.userId,
                req.body,
                { new: true, runValidators: true }
            ).select('-password');

            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json(updatedUser);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Failed to update user' });
        }
    }
);

module.exports = router;
