const Delivery = require('../models/Delivery');

// In-memory storage (for demonstration purposes)
let deliveries = [];
let nextId = 1;

// Sample data with dynamic dates
const now = new Date();
const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const ninetyDaysFromNow = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000);

deliveries.push(new Delivery(
  nextId++,
  1, // yachtId
  1, // captainId
  'Miami, FL',
  'Nassau, Bahamas',
  oneWeekFromNow,
  ninetyDaysFromNow,
  'scheduled'
));

const DeliveryController = {
  getAll: (req, res) => {
    const { status } = req.query;
    let result = deliveries;
    
    if (status) {
      result = deliveries.filter(d => d.status === status);
    }
    
    res.json(result);
  },

  getById: (req, res) => {
    const delivery = deliveries.find(d => d.id === parseInt(req.params.id));
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    res.json(delivery);
  },

  create: (req, res) => {
    const { yachtId, captainId, origin, destination, departureDate, estimatedArrival, status } = req.body;
    
    if (!yachtId || !captainId || !origin || !destination) {
      return res.status(400).json({ 
        error: 'YachtId, captainId, origin, and destination are required' 
      });
    }

    const delivery = new Delivery(
      nextId++,
      yachtId,
      captainId,
      origin,
      destination,
      departureDate,
      estimatedArrival,
      status
    );
    
    deliveries.push(delivery);
    res.status(201).json(delivery);
  },

  update: (req, res) => {
    const id = parseInt(req.params.id);
    const index = deliveries.findIndex(d => d.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const { yachtId, captainId, origin, destination, departureDate, estimatedArrival, status } = req.body;
    const delivery = deliveries[index];
    
    if (yachtId !== undefined) delivery.yachtId = yachtId;
    if (captainId !== undefined) delivery.captainId = captainId;
    if (origin) delivery.origin = origin;
    if (destination) delivery.destination = destination;
    if (departureDate) delivery.departureDate = departureDate;
    if (estimatedArrival) delivery.estimatedArrival = estimatedArrival;
    if (status) delivery.status = status;

    res.json(delivery);
  },

  delete: (req, res) => {
    const id = parseInt(req.params.id);
    const index = deliveries.findIndex(d => d.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    deliveries.splice(index, 1);
    res.status(204).send();
  }
};

module.exports = DeliveryController;
