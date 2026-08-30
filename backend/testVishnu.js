const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  await page.goto('https://vishnu.edu.in/Student-Results', { waitUntil: 'networkidle2' });
  
  await page.waitForSelector('#sroll', { timeout: 10000 });
  await page.type('#sroll', '24PA1A05K6');
  await page.click('#browse');
  
  await new Promise(r => setTimeout(r, 4000));
  
  const pageText = await page.content();
  console.log("--- PAGE HTML ---");
  console.log(pageText.substring(0, 500));
  
  console.log("Includes NAN?", pageText.includes('NAN'));
  console.log("Includes CGPA?", pageText.includes('CGPA'));
  console.log("Includes not found?", pageText.toLowerCase().includes('not found'));
  
  // Let's also grab innerText to see what the user would see
  const innerText = await page.evaluate(() => document.body.innerText);
  console.log("--- INNER TEXT ---");
  console.log(innerText);
  
  await browser.close();
})();
