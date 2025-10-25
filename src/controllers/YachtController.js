const Yacht = require('../models/Yacht');

// In-memory storage (for demonstration purposes)
let yachts = [];
let nextId = 1;

// Sample data
yachts.push(new Yacht(nextId++, 'Sea Breeze', 'sailboat', 45, 'John Smith', 'Miami'));
yachts.push(new Yacht(nextId++, 'Ocean Dream', 'motor yacht', 65, 'Sarah Johnson', 'Fort Lauderdale'));

const YachtController = {
  getAll: (req, res) => {
    res.json(yachts);
  },

  getById: (req, res) => {
    const yacht = yachts.find(y => y.id === parseInt(req.params.id));
    if (!yacht) {
      return res.status(404).json({ error: 'Yacht not found' });
    }
    res.json(yacht);
  },

  create: (req, res) => {
    const { name, type, length, owner, homePort } = req.body;
    
    if (!name || !type || !length) {
      return res.status(400).json({ error: 'Name, type, and length are required' });
    }

    const yacht = new Yacht(nextId++, name, type, length, owner, homePort);
    yachts.push(yacht);
    res.status(201).json(yacht);
  },

  update: (req, res) => {
    const id = parseInt(req.params.id);
    const index = yachts.findIndex(y => y.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Yacht not found' });
    }

    const { name, type, length, owner, homePort } = req.body;
    const yacht = yachts[index];
    
    if (name) yacht.name = name;
    if (type) yacht.type = type;
    if (length) yacht.length = length;
    if (owner) yacht.owner = owner;
    if (homePort) yacht.homePort = homePort;

    res.json(yacht);
  },

  delete: (req, res) => {
    const id = parseInt(req.params.id);
    const index = yachts.findIndex(y => y.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Yacht not found' });
    }

    yachts.splice(index, 1);
    res.status(204).send();
  }
};

module.exports = YachtController;
