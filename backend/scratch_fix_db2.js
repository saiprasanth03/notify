require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Monitor = require('./models/Monitor');
  
  // Reset all monitors to force a new check without baseline, so the new logic kicks in and notifies!
  const res = await Monitor.updateMany({}, {
    $set: { 
      status: 'ACTIVE', 
      errorCount: 0, 
      lastError: null,
      lastContentHash: null,
      lastCheckedAt: null
    }
  });
  
  console.log('Fixed monitors:', res);
  process.exit(0);
}).catch(console.error);
