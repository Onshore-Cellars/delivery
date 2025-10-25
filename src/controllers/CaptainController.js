const Captain = require('../models/Captain');

// In-memory storage (for demonstration purposes)
let captains = [];
let nextId = 1;

// Sample data
captains.push(new Captain(nextId++, 'Captain Jack Morrison', 'CPT-12345', 15, ['sailboat', 'motor yacht']));
captains.push(new Captain(nextId++, 'Captain Maria Rodriguez', 'CPT-67890', 10, ['catamaran', 'sailboat']));

const CaptainController = {
  getAll: (req, res) => {
    res.json(captains);
  },

  getById: (req, res) => {
    const captain = captains.find(c => c.id === parseInt(req.params.id));
    if (!captain) {
      return res.status(404).json({ error: 'Captain not found' });
    }
    res.json(captain);
  },

  create: (req, res) => {
    const { name, license, experience, specializations } = req.body;
    
    if (!name || !license) {
      return res.status(400).json({ error: 'Name and license are required' });
    }

    const captain = new Captain(nextId++, name, license, experience || 0, specializations || []);
    captains.push(captain);
    res.status(201).json(captain);
  },

  update: (req, res) => {
    const id = parseInt(req.params.id);
    const index = captains.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Captain not found' });
    }

    const { name, license, experience, specializations } = req.body;
    const captain = captains[index];
    
    if (name) captain.name = name;
    if (license) captain.license = license;
    if (experience !== undefined) captain.experience = experience;
    if (specializations) captain.specializations = specializations;

    res.json(captain);
  },

  delete: (req, res) => {
    const id = parseInt(req.params.id);
    const index = captains.findIndex(c => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Captain not found' });
    }

    captains.splice(index, 1);
    res.status(204).send();
  }
};

module.exports = CaptainController;
