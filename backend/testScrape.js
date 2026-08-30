const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  await page.goto('https://ipostatus.kfintech.com/?hl=en-IN', { waitUntil: 'networkidle2' });
  
  console.log("Waiting for dropdown...");
  await page.waitForSelector('#demo-multiple-name', { timeout: 10000 });
  await page.click('#demo-multiple-name');
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Clicking option...");
  await page.click('.MuiMenuItem-root, li[role="option"]');
  
  console.log("Typing PAN...");
  await page.waitForSelector('#outlined-start-adornment', { timeout: 5000 });
  await page.type('#outlined-start-adornment', 'ABCDE1234F');
  
  console.log("Submitting...");
  
  let dialogMessage = "";
  page.on('dialog', async dialog => {
    dialogMessage = dialog.message();
    console.log("DIALOG CAUGHT:", dialogMessage);
    await dialog.dismiss();
  });
  
  try {
    await page.click('button.content-button');
    
    console.log("Waiting for results...");
    await new Promise(r => setTimeout(r, 4000));
    
    const pageText = await page.content();
    console.log("--- PAGE HTML ---");
    console.log(pageText.includes('not found') ? "YES 'not found' is in HTML!" : "NO 'not found' is NOT in HTML!");
    console.log(pageText.includes('allotment status was not found') ? "YES 'allotment status was not found' is in HTML!" : "NO.");
    console.log("DIALOG MSG:", dialogMessage);
  } catch (e) {
    console.log("Error during submit/wait:", e);
  }
  
  await page.screenshot({ path: 'test_screenshot.png' });
  console.log("Screenshot saved to test_screenshot.png");
  
  await browser.close();
})();
