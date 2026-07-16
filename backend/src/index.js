require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/companies',  require('./routes/companies'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/jobfairs',   require('./routes/jobfairs'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/trainer',    require('./routes/trainer'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/chat',       require('./routes/chat'));
app.use('/api/sessions',   require('./routes/sessions'));
app.use('/api/donors',     require('./routes/donors'));

app.use('/api/stats',      require('./routes/stats'));

// Health check
app.get('/', (req, res) => res.json({ status: 'Unnatva API Running', version: '2.0.0' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Unnatva API running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
});
