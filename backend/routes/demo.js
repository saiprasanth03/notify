const express = require('express');
const router = express.Router();

// Mock state for demo
let resultReleased = false;

// @route   GET /api/demo/test-result
router.get('/test-result', (req, res) => {
  if (resultReleased) {
    res.send(`
      <html>
        <head><title>University Results</title></head>
        <body>
          <h1>3rd Year 1st Semester Result</h1>
          <p>Status: RELEASED</p>
          <p>The results for the 3rd Year 1st Semester have been officially released. Please check your roll number.</p>
        </body>
      </html>
    `);
  } else {
    res.send(`
      <html>
        <head><title>University Results</title></head>
        <body>
          <h1>3rd Year 1st Semester Result</h1>
          <p>Status: Not Released</p>
          <p>The results are currently being processed. Please check back later.</p>
        </body>
      </html>
    `);
  }
});

// @route   POST /api/demo/toggle-result
router.post('/toggle-result', (req, res) => {
  resultReleased = !resultReleased;
  res.json({ message: 'Result state toggled', resultReleased });
});

module.exports = router;
