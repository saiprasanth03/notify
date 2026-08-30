require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const User = require('./models/User');
const Monitor = require('./models/Monitor');
const Notification = require('./models/Notification');

async function runMigration() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env file!');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Read local data.json
    const dataPath = path.join(__dirname, 'data.json');
    if (!fs.existsSync(dataPath)) {
      console.log('No data.json found. Nothing to migrate.');
      process.exit(0);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Clear existing collections just in case
    await User.deleteMany({});
    await Monitor.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared existing MongoDB collections');

    // Insert Users
    if (data.users && data.users.length > 0) {
      // Data.json uses string UUIDs, but Mongoose expects ObjectIds for _id unless we override it.
      // Since models define _id as ObjectId by default, we will just let Mongoose generate new ObjectIds,
      // but we have to map the old string UUIDs to the new ObjectIds for the relationships!
      const userMap = {}; // oldId -> newId

      for (const oldUser of data.users) {
        const newUser = new User({
          name: oldUser.name,
          identifier: oldUser.identifier,
          telegramChatId: oldUser.telegramChatId,
          telegramUsername: oldUser.telegramUsername,
          telegramConnected: oldUser.telegramConnected,
          telegramConnectedAt: oldUser.telegramConnectedAt,
          telegramConnectionToken: oldUser.telegramConnectionToken,
          telegramConnectionTokenExpiresAt: oldUser.telegramConnectionTokenExpiresAt,
          emailNotificationsEnabled: oldUser.emailNotificationsEnabled,
          telegramNotificationsEnabled: oldUser.telegramNotificationsEnabled,
        });
        await newUser.save();
        userMap[oldUser._id] = newUser._id;
      }
      console.log(`Migrated ${data.users.length} users`);

      // Insert Monitors
      if (data.monitors && data.monitors.length > 0) {
        for (const oldMonitor of data.monitors) {
          if (userMap[oldMonitor.userId]) {
            const newMonitor = new Monitor({
              userId: userMap[oldMonitor.userId],
              name: oldMonitor.name,
              url: oldMonitor.url,
              type: oldMonitor.type,
              description: oldMonitor.description,
              identifier: oldMonitor.identifier,
              frequency: oldMonitor.frequency,
              notificationMethods: oldMonitor.notificationMethods,
              status: oldMonitor.status,
              lastCheckedAt: oldMonitor.lastCheckedAt,
              nextCheckAt: oldMonitor.nextCheckAt,
              lastContentHash: oldMonitor.lastContentHash,
              lastRelevantContent: oldMonitor.lastRelevantContent,
              lastChangeDetectedAt: oldMonitor.lastChangeDetectedAt,
              triggeredAt: oldMonitor.triggeredAt,
              errorCount: oldMonitor.errorCount,
              lastError: oldMonitor.lastError,
              allotmentResults: oldMonitor.allotmentResults || []
            });
            await newMonitor.save();
          }
        }
        console.log(`Migrated monitors`);
      }

      // We can skip notifications since they are just historical logs
      console.log('Migration complete!');
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
