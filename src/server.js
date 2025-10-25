const express = require('express');
const cors = require('cors');
const path = require('path');

const yachtRoutes = require('./routes/yachts');
const captainRoutes = require('./routes/captains');
const deliveryRoutes = require('./routes/deliveries');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/yachts', yachtRoutes);
app.use('/api/captains', captainRoutes);
app.use('/api/deliveries', deliveryRoutes);

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Yacht Delivery Platform API',
    version: '1.0.0',
    endpoints: {
      yachts: '/api/yachts',
      captains: '/api/captains',
      deliveries: '/api/deliveries'
    }
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Yacht Delivery Platform running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`Web interface at http://localhost:${PORT}`);
  });
}

module.exports = app;
