const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log("Navigating...");
    await page.goto('https://vishnu.edu.in/Student-Results', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log("Typing...");
    await page.waitForSelector('#sroll', { timeout: 10000 });
    await page.type('#sroll', '24PA1A05K6');
    
    console.log("Clicking browse...");
    await page.click('#browse');
    
    console.log("Waiting for results...");
    await new Promise(r => setTimeout(r, 8000));
    
    const pageText = await page.content();
    console.log("--- RESULTS ---");
    console.log("Includes NAN?", pageText.includes('NAN'));
    console.log("Includes CGPA?", pageText.includes('CGPA'));
    
    const innerText = await page.evaluate(() => document.body.innerText);
    console.log("TEXT SAMPLE:");
    console.log(innerText.substring(0, 1000));
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
