const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

/**
 * Fetch HTML and extract clean text from it.
 */
const extractStaticContent = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Remove noisy elements
    $('script, style, noscript, iframe, img, svg, nav, footer, header, .advertisement, .sidebar').remove();

    // Extract visible text, normalize whitespace
    let text = $('body').text();
    text = text.replace(/\s+/g, ' ').trim();

    return { success: true, text };
  } catch (error) {
    console.error(`Failed to extract static content from ${url}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Generate SHA-256 hash for content
 */
const generateHash = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

module.exports = {
  extractStaticContent,
  generateHash
};
