const cron = require('node-cron');
const { readData, writeData } = require('../store');
const { extractStaticContent, generateHash } = require('../services/monitoring/extractor');
const { determineRelevance } = require('../services/relevance/relevanceService');
const { sendNotifications } = require('../services/notifications');
const { scrapeAllotment } = require('../services/monitoring/scraperService');

const processMonitor = async (monitor, data) => {
  try {
    console.log(`Checking monitor: ${monitor.name} (${monitor.url})`);

    const result = await extractStaticContent(monitor.url);
    if (!result.success) {
      monitor.errorCount += 1;
      monitor.lastError = result.error;
    } else {
      const newHash = generateHash(result.text);

      if (newHash !== monitor.lastContentHash) {
        console.log(`Content changed for monitor: ${monitor.name}`);
        monitor.lastContentHash = newHash;
        monitor.lastChangeDetectedAt = new Date().toISOString();

        const relevance = determineRelevance(result.text, monitor);
        if (relevance.relevant) {
          console.log(`Relevant change detected for monitor: ${monitor.name}`);
          monitor.status = 'TRIGGERED';
          monitor.triggeredAt = new Date().toISOString();
          monitor.lastRelevantContent = result.text.substring(0, 1000); // Save a snippet
          
          // Trigger notifications
          await sendNotifications(monitor, result.text);
          
          // Trigger automated scraping if applicable
          if (monitor.url.includes('kfintech') || monitor.url.includes('mufg') || monitor.url.includes('vishnu.edu')) {
            console.log(`Starting automated scraping for ${monitor.name}...`);
            const scrapeResults = await scrapeAllotment(monitor);
            monitor.allotmentResults = scrapeResults;
          }
        } else {
          console.log(`Change not relevant for monitor: ${monitor.name}. Reason: ${relevance.reason}`);
        }
      } else {
        console.log(`No change for monitor: ${monitor.name}`);
      }
      
      // Reset errors on success
      monitor.errorCount = 0;
      monitor.lastError = null;
    }

    monitor.lastCheckedAt = new Date().toISOString();
    
    // Only schedule next check if not triggered
    if (monitor.status === 'ACTIVE') {
      monitor.nextCheckAt = new Date(Date.now() + monitor.frequency * 60000).toISOString();
    }
    
    monitor.updatedAt = new Date().toISOString();
  } catch (error) {
    console.error(`Error processing monitor ${monitor._id}:`, error);
  }
};

const startScheduler = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    console.log('Running scheduler...');
    try {
      const data = readData();
      const now = new Date().toISOString();
      
      // Find monitors that are ACTIVE and whose next check time has passed
      const dueMonitors = data.monitors.filter(m => m.status === 'ACTIVE' && m.nextCheckAt <= now);

      console.log(`Found ${dueMonitors.length} due monitors.`);

      if (dueMonitors.length > 0) {
        for (const monitor of dueMonitors) {
          await processMonitor(monitor, data);
          // find and update the monitor in array
          const index = data.monitors.findIndex(m => m._id === monitor._id);
          if (index !== -1) {
            data.monitors[index] = monitor;
          }
        }
        writeData(data);
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });
};

module.exports = { startScheduler, processMonitor };
