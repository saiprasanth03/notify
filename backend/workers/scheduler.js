const cron = require('node-cron');
const Monitor = require('../models/Monitor');
const Notification = require('../models/Notification');
const { extractStaticContent, scrapeAllotment } = require('../services/monitoring/scraperService');
const { sendTelegramMessage } = require('../services/notifications/telegramService');
const { isContentRelevant } = require('../services/relevance/relevanceService');

let schedulerTask = null;

const checkMonitors = async () => {
  console.log('Running scheduler...');
  
  try {
    const now = new Date();
    // Find active monitors that are due for a check
    const dueMonitors = await Monitor.find({
      status: 'ACTIVE',
      nextCheckAt: { $lte: now }
    }).populate('userId');

    console.log(`Found ${dueMonitors.length} due monitors.`);

    for (const monitor of dueMonitors) {
      console.log(`Checking monitor: ${monitor.name} (${monitor.url})`);
      
      try {
        let contentHash = '';
        let relevantContent = '';
        let allotmentResults = [];

        if (monitor.url.includes('kfintech') || monitor.url.includes('mufg') || monitor.url.includes('vishnu.edu')) {
          console.log(`Starting automated scraping for ${monitor.name}...`);
          allotmentResults = await scrapeAllotment(monitor);
          
          if (allotmentResults.length > 0) {
            contentHash = JSON.stringify(allotmentResults); // Simple hash approach
            relevantContent = `Scraped ${allotmentResults.length} records.`;
          }
        } else {
          // General monitoring logic
          contentHash = await extractStaticContent(monitor.url);
          relevantContent = "Content extracted successfully.";
        }

        // Detect changes
        let contentChanged = false;
        
        if (monitor.lastContentHash && monitor.lastContentHash !== contentHash) {
          contentChanged = true;
          console.log(`Content changed for monitor: ${monitor.name}`);
        }

        const isRelevant = isContentRelevant(relevantContent, monitor);

        if (contentChanged && isRelevant) {
          console.log(`Relevant change detected for monitor: ${monitor.name}`);
          
          // Determine if we need to send a notification
          // We don't want to spam if it's continuously triggered, so maybe only notify if it was previously ACTIVE
          
          if (monitor.notificationMethods.telegram && monitor.userId.telegramChatId) {
             const success = await sendTelegramMessage(monitor.userId.telegramChatId, monitor);
             if (success) {
               await Notification.create({
                 userId: monitor.userId._id,
                 monitorId: monitor._id,
                 type: 'Telegram',
                 title: `${monitor.name} Update Detected`,
                 message: `Content change detected for ${monitor.url}`,
                 status: 'SENT'
               });
             }
          }

          monitor.status = 'TRIGGERED';
          monitor.triggeredAt = new Date();
          monitor.lastChangeDetectedAt = new Date();
        }

        monitor.lastContentHash = contentHash || monitor.lastContentHash;
        monitor.lastRelevantContent = relevantContent || monitor.lastRelevantContent;
        if (allotmentResults && allotmentResults.length > 0) {
          monitor.allotmentResults = allotmentResults;
        }
        monitor.lastCheckedAt = new Date();
        monitor.nextCheckAt = new Date(Date.now() + monitor.frequency * 60000);
        monitor.errorCount = 0;
        monitor.lastError = null;
        
        await monitor.save();
      } catch (err) {
        console.error(`Error checking monitor ${monitor.name}:`, err.message);
        monitor.errorCount += 1;
        monitor.lastError = err.message;
        
        if (monitor.errorCount >= 5) {
          monitor.status = 'ERROR';
        } else {
          monitor.nextCheckAt = new Date(Date.now() + monitor.frequency * 60000);
        }
        await monitor.save();
      }
    }
  } catch (err) {
    console.error('Scheduler error:', err);
  }
};

const startScheduler = () => {

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
