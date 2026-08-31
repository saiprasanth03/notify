require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Monitor = require('./models/Monitor');
  const res = await Monitor.updateMany({status: 'ERROR'}, {$set: {status: 'ACTIVE', errorCount: 0, lastError: null}});
  console.log('Fixed monitors:', res);
  process.exit(0);
}).catch(console.error);
