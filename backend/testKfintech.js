const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('request', request => {
    if (request.url().includes('api') || request.method() === 'POST') {
      console.log(request.method(), request.url(), request.postData() ? request.postData().substring(0, 100) : '');
    }
  });

  await page.goto('https://ipostatus.kfintech.com', { waitUntil: 'networkidle2' });
  
  try {
    await page.waitForSelector('#demo-multiple-name', { timeout: 10000 });
    await page.click('#demo-multiple-name');
    await new Promise(r => setTimeout(r, 1000));
    await page.click('.MuiMenuItem-root, li[role="option"]');
    await page.type('#outlined-start-adornment', 'TESTPAN123');
    await page.click('button.content-button');
    await new Promise(r => setTimeout(r, 4000));
  } catch (e) {
    console.error(e);
  }
  
  await browser.close();
})();
