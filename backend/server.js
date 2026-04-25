require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// ===== DATABASE =====
connectDB();

// ===== MIDDLEWARE =====
app.use(cors({
  origin: '*', // потом можно заменить на твой frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== ROUTES =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/files', require('./routes/files'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/online', require('./routes/online'));

// static files
app.use('/uploads', express.static('uploads'));

// ===== HEALTH CHECK (Render uses this often) =====
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'MedTech Platform API is running'
  });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error'
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// for testing / serverless compatibility
module.exports = app;