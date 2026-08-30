const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { readData, writeData } = require('../store');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', (req, res) => {
  const data = readData();
  const monitors = data.monitors.filter(m => m.userId === req.user._id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(monitors);
});

router.get('/:id', (req, res) => {
  const data = readData();
  const monitor = data.monitors.find(m => m._id === req.params.id && m.userId === req.user._id);
  if (!monitor) return res.status(404).json({ message: 'Monitor not found' });
  res.json(monitor);
});

router.post('/', (req, res) => {
  const { name, url, type, description, identifier, frequency, notificationMethods } = req.body;
  // Set nextCheckAt to right now so the very first check happens immediately on the next scheduler tick
  const nextCheckAt = new Date().toISOString();

  const data = readData();
  const newMonitor = {
    _id: crypto.randomUUID(),
    userId: req.user._id,
    name,
    url,
    type,
    description,
    identifier,
    frequency,
    notificationMethods,
    status: 'ACTIVE',
    lastCheckedAt: null,
    nextCheckAt,
    lastContentHash: null,
    lastRelevantContent: null,
    lastChangeDetectedAt: null,
    triggeredAt: null,
    errorCount: 0,
    lastError: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data.monitors.push(newMonitor);
  writeData(data);
  
  res.status(201).json(newMonitor);
});

router.put('/:id', (req, res) => {
  const data = readData();
  const index = data.monitors.findIndex(m => m._id === req.params.id && m.userId === req.user._id);
  if (index === -1) return res.status(404).json({ message: 'Monitor not found' });
  
  data.monitors[index] = { ...data.monitors[index], ...req.body, updatedAt: new Date().toISOString() };
  writeData(data);
  
  res.json(data.monitors[index]);
});

router.delete('/:id', (req, res) => {
  const data = readData();
  const initialLength = data.monitors.length;
  data.monitors = data.monitors.filter(m => !(m._id === req.params.id && m.userId === req.user._id));
  
  if (data.monitors.length === initialLength) return res.status(404).json({ message: 'Monitor not found' });
  
  writeData(data);
  res.json({ message: 'Monitor deleted' });
});

router.post('/:id/pause', (req, res) => {
  const data = readData();
  const index = data.monitors.findIndex(m => m._id === req.params.id && m.userId === req.user._id);
  if (index === -1) return res.status(404).json({ message: 'Monitor not found' });
  
  data.monitors[index].status = 'PAUSED';
  data.monitors[index].updatedAt = new Date().toISOString();
  writeData(data);
  
  res.json(data.monitors[index]);
});

router.post('/:id/resume', (req, res) => {
  const data = readData();
  const index = data.monitors.findIndex(m => m._id === req.params.id && m.userId === req.user._id);
  if (index === -1) return res.status(404).json({ message: 'Monitor not found' });
  
  data.monitors[index].status = 'ACTIVE';
  data.monitors[index].nextCheckAt = new Date(Date.now() + 5000).toISOString();
  data.monitors[index].updatedAt = new Date().toISOString();
  writeData(data);
  
  res.json(data.monitors[index]);
});

router.post('/:id/scrape', async (req, res) => {
  const data = readData();
  const index = data.monitors.findIndex(m => m._id === req.params.id && m.userId === req.user._id);
  if (index === -1) return res.status(404).json({ message: 'Monitor not found' });
  
  const monitor = data.monitors[index];
  
  if (!monitor.url.includes('kfintech') && !monitor.url.includes('mufg') && !monitor.url.includes('vishnu.edu')) {
    return res.status(400).json({ message: 'Automated scraping only supported for KFintech, MUFG, and Vishnu.' });
  }

  const { scrapeAllotment } = require('../services/monitoring/scraperService');
  
  try {
    const results = await scrapeAllotment(monitor);
    data.monitors[index].allotmentResults = results;
    data.monitors[index].updatedAt = new Date().toISOString();
    writeData(data);
    res.json(data.monitors[index]);
  } catch (err) {
    res.status(500).json({ message: 'Scraping failed' });
  }
});

module.exports = router;
