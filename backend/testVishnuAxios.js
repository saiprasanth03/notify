const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

const test = async () => {
  try {
    const form = new FormData();
    form.append('sroll', '24PA1A05K6');
    form.append('browse', 'View Result');

    const res = await axios.post('https://vishnu.edu.in/Student-Results', form, {
      headers: {
        ...form.getHeaders()
      }
    });
    
    const $ = cheerio.load(res.data);
    const pageText = $('body').text().replace(/\s+/g, ' ');
    
    let status = "Not Released";
    let name = "N/A";
    
    if (pageText.includes('NAN') || pageText.toLowerCase().includes('not found') || pageText.toLowerCase().includes('invalid')) {
      status = "Not Released";
    } else if (pageText.includes('CGPA') || pageText.includes('SGPA')) {
      status = "Released!";
      let cgpa = "Check site for details";
      const matches = [...pageText.matchAll(/SGPA\)\s*:\s*([\d\.]+)/gi)];
      if (matches && matches.length > 0) {
        cgpa = "SGPAs: " + matches.map(m => m[1]).join(', ');
      }
      name = cgpa;
    }
    
    console.log({ status, name });
    
  } catch (err) {
    console.error(err);
  }
};

test();
