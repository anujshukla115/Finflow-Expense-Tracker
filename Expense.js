const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    title: {
        type: String,
        required: [true, 'Please provide expense title'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    amount: {
        type: Number,
        required: [true, 'Please provide expense amount'],
        min: [0, 'Amount cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        default: 'Other'
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update the updatedAt field on save
expenseSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for better query performance
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, createdAt: -1 });

// Virtual for formatted date
expenseSchema.virtual('formattedDate').get(function() {
    return this.date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
});

// Static method to get total expenses for a user
expenseSchema.statics.getTotalExpenses = async function(userId, startDate, endDate) {
    const matchQuery = { userId };
    
    if (startDate || endDate) {
        matchQuery.date = {};
        if (startDate) matchQuery.date.$gte = new Date(startDate);
        if (endDate) matchQuery.date.$lte = new Date(endDate);
    }
    
    const result = await this.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    return result.length > 0 ? result[0].total : 0;
};

// Static method to get expenses by category
expenseSchema.statics.getExpensesByCategory = async function(userId, startDate, endDate) {
    const matchQuery = { userId };
    
    if (startDate || endDate) {
        matchQuery.date = {};
        if (startDate) matchQuery.date.$gte = new Date(startDate);
        if (endDate) matchQuery.date.$lte = new Date(endDate);
    }
    
    return await this.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
    ]);
};

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;