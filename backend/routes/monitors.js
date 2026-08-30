const express = require('express');
const router = express.Router();
const Monitor = require('../models/Monitor');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const monitors = await Monitor.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(monitors);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.user._id });
    if (!monitor) return res.status(404).json({ message: 'Monitor not found' });
    res.json(monitor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, url, type, description, identifier, frequency, notificationMethods } = req.body;
  
  try {
    const newMonitor = await Monitor.create({
      userId: req.user._id,
      name,
      url,
      type,
      description,
      identifier,
      frequency,
      notificationMethods,
      status: 'ACTIVE',
      nextCheckAt: new Date()
    });
    res.status(201).json(newMonitor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const monitor = await Monitor.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!monitor) return res.status(404).json({ message: 'Monitor not found' });
    res.json(monitor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const monitor = await Monitor.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!monitor) return res.status(404).json({ message: 'Monitor not found' });
    res.json({ message: 'Monitor deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/pause', async (req, res) => {
  try {
    const monitor = await Monitor.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { status: 'PAUSED' } },
      { new: true }
    );
    if (!monitor) return res.status(404).json({ message: 'Monitor not found' });
    res.json(monitor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/resume', async (req, res) => {
  try {
    const monitor = await Monitor.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { status: 'ACTIVE', nextCheckAt: new Date(Date.now() + 5000) } },
      { new: true }
    );
    if (!monitor) return res.status(404).json({ message: 'Monitor not found' });
    res.json(monitor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/scrape', async (req, res) => {
  try {
    const monitor = await Monitor.findOne({ _id: req.params.id, userId: req.user._id });
    if (!monitor) return res.status(404).json({ message: 'Monitor not found' });
    
    if (!monitor.url.includes('kfintech') && !monitor.url.includes('mufg') && !monitor.url.includes('vishnu.edu')) {
      return res.status(400).json({ message: 'Automated scraping only supported for KFintech, MUFG, and Vishnu.' });
    }

    const { scrapeAllotment } = require('../services/monitoring/scraperService');
    const results = await scrapeAllotment(monitor);
    
    monitor.allotmentResults = results;
    await monitor.save();
    
    res.json(monitor);
  } catch (err) {
    res.status(500).json({ message: 'Scraping failed', error: err.message });
  }
});

module.exports = router;
