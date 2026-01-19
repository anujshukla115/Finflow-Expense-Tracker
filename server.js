const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Routes
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const userRoutes = require('./routes/users');

const app = express();

/* =====================
   MIDDLEWARE
===================== */
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'http://localhost:5500'
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =====================
   REQUEST LOGGER
===================== */
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

/* =====================
   ROUTES
===================== */
// Auth routes (PUBLIC)
app.use('/api/auth', authRoutes);

// User routes (mostly protected later)
app.use('/api/users', userRoutes);

// Expense routes (PROTECTED internally)
app.use('/api/expenses', expenseRoutes);

/* =====================
   HEALTH CHECK
===================== */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

/* =====================
   ERROR HANDLER
===================== */
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

/* =====================
   404 HANDLER
===================== */
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

/* =====================
   DATABASE + SERVER
===================== */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });

module.exports = app;
