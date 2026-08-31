require('dotenv').config();
const { scrapeAllotment } = require('./services/monitoring/scraperService');

const testScraper = async () => {
  const monitor = {
    url: 'https://vishnu.edu.in/Student-Results',
    identifier: '24PA1A05K6'
  };
  
  console.log('Testing scraper...');
  const results = await scrapeAllotment(monitor);
  console.log('Results:', results);
};

testScraper();
