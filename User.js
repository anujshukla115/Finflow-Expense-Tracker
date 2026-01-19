const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: 50
    },

    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false // IMPORTANT: never return password
    },

    monthlyIncome: {
        type: Number,
        default: 0,
        min: 0
    },

    monthlyBudget: {
        type: Number,
        default: 0,
        min: 0
    },

    currency: {
        type: String,
        enum: ['INR', 'USD', 'EUR', 'GBP'],
        default: 'INR'
    },

    categories: {
        type: [String],
        default: [
            'Food',
            'Transport',
            'Bills',
            'Shopping',
            'Entertainment',
            'Healthcare',
            'Education',
            'Other'
        ]
    }
},
{
    timestamps: true
}
);

/* =========================
   PASSWORD HASHING
========================= */
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

/* =========================
   PASSWORD COMPARISON
========================= */
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
