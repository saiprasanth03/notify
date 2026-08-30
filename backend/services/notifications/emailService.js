const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async (to, monitor) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[Mock Email] To: ${to}, Monitor: ${monitor.name}`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"WatchMyWeb" <noreply@watchmyweb.local>',
      to,
      subject: `🔔 WatchMyWeb: ${monitor.name} Result Available`,
      text: `
WatchMyWeb Alert

The information you were waiting for appears to be available.

Monitor:
${monitor.name}

Description:
${monitor.description}

Website:
${monitor.url}
      `,
    });
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { sendEmail };
