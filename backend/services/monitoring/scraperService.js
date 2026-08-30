const puppeteer = require('puppeteer');

const scrapeAllotment = async (monitor) => {
  if (!monitor.identifier) return [];

  // Parse comma-separated PAN numbers
  const pans = monitor.identifier.split(/[\n,]+/).map(p => p.trim()).filter(p => p.length > 5);
  if (pans.length === 0) return [];

  const results = [];
  
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const pan of pans) {
      try {
        await page.goto(monitor.url, { waitUntil: 'networkidle2', timeout: 30000 });

        let status = "Not Found / Error";
        let name = "N/A";

        if (monitor.url.includes('kfintech.com')) {
          // KFintech logic
          try {
            await page.waitForSelector('#demo-multiple-name', { timeout: 10000 });
            
            // Click dropdown to open it
            await page.click('#demo-multiple-name');
            // Wait for dropdown list to render
            await new Promise(r => setTimeout(r, 1000));
            // Click the first available IPO in the dropdown
            await page.click('.MuiMenuItem-root, li[role="option"]');
            
            await page.waitForSelector('#outlined-start-adornment', { timeout: 5000 });
            await page.type('#outlined-start-adornment', pan);
            
            // Handle browser alerts (just in case KFintech uses window.alert)
            let dialogMessage = "";
            const dialogHandler = async dialog => {
              dialogMessage = dialog.message();
              await dialog.dismiss();
            };
            page.on('dialog', dialogHandler);
            
            await page.click('button.content-button');
            
            // Wait for result table or error alert
            await new Promise(r => setTimeout(r, 4000));
            
            const pageText = await page.content();
            const combinedText = (pageText + " " + dialogMessage).toLowerCase();
            
            if (combinedText.includes('not found') || combinedText.includes('not allotted') || combinedText.includes('invalid')) {
              status = "Not Allotted";
            } else if (combinedText.includes('allotted')) {
              status = "Allotted";
            }
            
            page.off('dialog', dialogHandler);
            
            // Aggressive Name Extractor
            let extractedName = await page.evaluate(() => {
              // Attempt 1: Regex on full page text
              const fullText = document.body.innerText;
              // Look for "Name" followed by colon or newlines/spaces, then capture uppercase letters/spaces
              const regexMatch = fullText.match(/(?:Applicant Name|Name)[\s\n:]+([A-Z\s\.\-]{4,50})(?:\n|$)/i);
              if (regexMatch && regexMatch[1].trim().length > 2) {
                // Ensure it's not capturing table headers like "Shares"
                const possibleName = regexMatch[1].trim();
                if (!possibleName.toLowerCase().includes('shares') && !possibleName.toLowerCase().includes('application')) {
                   return possibleName;
                }
              }

              // Attempt 2: Table structure (<th>Name</th> -> <td>John Doe</td>)
              const ths = Array.from(document.querySelectorAll('th, td, .MuiTableCell-root'));
              const nameThIndex = ths.findIndex(el => {
                const txt = el.innerText.trim().toLowerCase();
                return txt === 'name' || txt === 'applicant name' || txt === 'name of the applicant';
              });
              
              if (nameThIndex !== -1) {
                const headerEl = ths[nameThIndex];
                // Try next sibling
                if (headerEl.nextElementSibling && headerEl.nextElementSibling.innerText.trim()) {
                  return headerEl.nextElementSibling.innerText.trim();
                }
                // Try jumping a spacer
                if (headerEl.nextElementSibling?.nextElementSibling && headerEl.nextElementSibling.nextElementSibling.innerText.trim()) {
                  return headerEl.nextElementSibling.nextElementSibling.innerText.trim();
                }
                
                // Try parent row's next cell if it's a grid
                const tr = headerEl.closest('tr');
                if (tr) {
                  const cells = Array.from(tr.querySelectorAll('td, th'));
                  const idx = cells.indexOf(headerEl);
                  if (idx !== -1 && cells[idx+1]) {
                    return cells[idx+1].innerText.trim();
                  }
                  
                  // Or if it's a standard table where header is in thead
                  const table = tr.closest('table');
                  if (table) {
                    const tbodyTr = table.querySelector('tbody tr');
                    if (tbodyTr) {
                      const tbodyCells = tbodyTr.querySelectorAll('td');
                      if (tbodyCells[idx]) return tbodyCells[idx].innerText.trim();
                    }
                  }
                }
              }
              
              return null;
            });

            name = extractedName || (combinedText.includes('not found') ? "N/A" : "Check site for details");
            
          } catch (e) {
            status = "Scraper Error (KFintech structure changed?)";
          }
          
        } else if (monitor.url.includes('mufg.com')) {
          // MUFG logic
          try {
            await page.waitForSelector('#ddlCompany', { timeout: 10000 });
            await page.waitForSelector('#txtStat', { timeout: 5000 });
            await page.type('#txtStat', pan);
            await page.click('#btnsearc');
            
            await new Promise(r => setTimeout(r, 4000));
            
            const pageText = await page.content();
            if (pageText.includes('Not Allotted') || pageText.includes('Zero')) status = "Not Allotted";
            else if (pageText.includes('Allotted')) status = "Allotted";
            
            // Aggressive Name Extractor
            let extractedName = await page.evaluate(() => {
              const fullText = document.body.innerText;
              const regexMatch = fullText.match(/(?:Applicant Name|Name)[\s\n:]+([A-Z\s\.\-]{4,50})(?:\n|$)/i);
              if (regexMatch && regexMatch[1].trim().length > 2) {
                const possibleName = regexMatch[1].trim();
                if (!possibleName.toLowerCase().includes('shares') && !possibleName.toLowerCase().includes('application')) {
                   return possibleName;
                }
              }

              const ths = Array.from(document.querySelectorAll('th, td, .MuiTableCell-root'));
              const nameThIndex = ths.findIndex(el => {
                const txt = el.innerText.trim().toLowerCase();
                return txt === 'name' || txt === 'applicant name' || txt === 'name of the applicant';
              });
              
              if (nameThIndex !== -1) {
                const headerEl = ths[nameThIndex];
                if (headerEl.nextElementSibling && headerEl.nextElementSibling.innerText.trim()) {
                  return headerEl.nextElementSibling.innerText.trim();
                }
                if (headerEl.nextElementSibling?.nextElementSibling && headerEl.nextElementSibling.nextElementSibling.innerText.trim()) {
                  return headerEl.nextElementSibling.nextElementSibling.innerText.trim();
                }
                
                const tr = headerEl.closest('tr');
                if (tr) {
                  const cells = Array.from(tr.querySelectorAll('td, th'));
                  const idx = cells.indexOf(headerEl);
                  if (idx !== -1 && cells[idx+1]) return cells[idx+1].innerText.trim();
                  
                  const table = tr.closest('table');
                  if (table) {
                    const tbodyTr = table.querySelector('tbody tr');
                    if (tbodyTr) {
                      const tbodyCells = tbodyTr.querySelectorAll('td');
                      if (tbodyCells[idx]) return tbodyCells[idx].innerText.trim();
                    }
                  }
                }
              }
              
              return null;
            });

            name = extractedName || "Check site for details";
          } catch (e) {
            status = "Scraper Error (MUFG structure changed?)";
          }
        } else if (monitor.url.includes('vishnu.edu.in')) {
          // Vishnu Institute of Technology logic
          try {
            await page.waitForSelector('#sroll', { timeout: 10000 });
            await page.type('#sroll', pan);
            
            // It might be an AJAX call or navigation, so wait for specific text to appear
            await page.click('#browse');
            
            // Poll for up to 15 seconds for the result text to appear
            let foundResult = false;
            for (let i = 0; i < 15; i++) {
              await new Promise(r => setTimeout(r, 1000));
              const currentHtml = await page.content();
              if (currentHtml.includes('CGPA') || currentHtml.includes('SGPA') || currentHtml.includes('NAN') || currentHtml.toLowerCase().includes('not found') || currentHtml.toLowerCase().includes('invalid')) {
                foundResult = true;
                break;
              }
            }
            
            const pageText = await page.evaluate(() => document.body.innerText);
            
            if (pageText.includes('NAN') || pageText.toLowerCase().includes('not found') || pageText.toLowerCase().includes('invalid')) {
              status = "Not Released";
              name = "N/A";
            } else if (pageText.includes('CGPA') || pageText.includes('SGPA')) {
              status = "Released!";
              
              let cgpa = "Check site for details";
              // Grab all SGPAs (ignoring the overall CGPA at the very bottom)
              const matches = [...pageText.matchAll(/SGPA\)\s*:\s*([\d\.]+)/gi)];
              if (matches && matches.length > 0) {
                // Get the very last SGPA on the page (latest semester)
                const lastMatch = matches[matches.length - 1];
                cgpa = "Latest SGPA: " + lastMatch[1];
              }
              name = cgpa;
            } else {
               status = "Unknown Status";
               name = "Site took too long";
            }
          } catch (e) {
            status = "Scraper Error (Vishnu structure changed?)";
          }
        } else {
           status = "Unsupported Website (No Scraper Built)";
        }

        results.push({ pan, status, name });
      } catch (err) {
        console.error(`Error scraping PAN ${pan} on ${monitor.url}:`, err);
        results.push({ pan, status: 'Error', name: 'N/A' });
      }
    }
  } catch (err) {
    console.error('Puppeteer launch error:', err);
  } finally {
    if (browser) await browser.close();
  }

  return results;
};

module.exports = { scrapeAllotment };
