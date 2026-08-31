require('dotenv').config();
const { scrapeAllotment } = require('./services/monitoring/scraperService');

const testScraper = async () => {
  const monitor = {
    url: 'https://ipostatus.kfintech.com/',
    identifier: 'TESTPAN123'
  };
  
  console.log('Testing Kfintech scraper...');
  const results = await scrapeAllotment(monitor);
  console.log('Results:', results);
};

testScraper();
