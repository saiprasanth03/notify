const axios = require('axios');
const qs = require('querystring');

const test = async () => {
  try {
    const res = await axios.post('https://vishnu.edu.in/ExamResults/BTech_III_Year_II_Sem_Regular_Examinations_April_2024.htm', qs.stringify({
      sroll: '24PA1A05K6',
      Submit: 'Submit'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log(res.data.substring(0, 500));
    console.log(res.data.includes('24PA1A05K6'));
  } catch (err) {
    console.error(err.message);
  }
}
test();
