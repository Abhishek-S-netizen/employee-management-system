const express = require('express');
const cors = require('cors');
require('dotenv').config();

const employeeRoutes = require('./src/routes/employeeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// Global Middleware
// ==========================================
// app.use(cors()); // Allow cross-origin requests from the React frontend
app.use(express.json()); // Parse incoming JSON payloads
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

// ==========================================
// Sanity Check / Health Route
// ==========================================
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Employee Management Backend is running perfectly.' });
});

// ==========================================
// API Routes
// ==========================================
app.use('/api/employees', employeeRoutes);

// ==========================================
// 404 Route Not Found Handler
// ==========================================
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found or does not exist.' });
});

// ==========================================
// Global Error Handler
// ==========================================
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.stack);
    res.status(500).json({ error: 'An unexpected error occurred on the server backend.' });
});

// ==========================================
// Boot Server
// ==========================================
app.listen(PORT, () => {
    console.log(`\n🚀 Employee Management Backend is running on http://localhost:${PORT}`);
    console.log(`---> Database expected at ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}\n`);
});
