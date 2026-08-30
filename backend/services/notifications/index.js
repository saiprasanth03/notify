const { sendEmail } = require('./emailService');
const { sendTelegramMessage } = require('./telegramService');
const { readData, writeData } = require('../../store');
const crypto = require('crypto');

const sendNotifications = async (monitor, contentSnippet) => {
  try {
    const data = readData();
    const user = data.users.find(u => u._id === monitor.userId);
    if (!user) return;

    let emailSent = false;
    let telegramSent = false;
    let methodsUsed = [];

    // Assuming email settings exist on user if implementing later, 
    // for now we'll just check if monitor has email checked.
    if (monitor.notificationMethods.email) {
      // In OTP login we don't have email unless they add it in settings later
      // We will skip email for now if no user.email exists
      if (user.email) {
        emailSent = await sendEmail(user.email, monitor);
        if (emailSent) methodsUsed.push('Email');
      }
    }

    if (monitor.notificationMethods.telegram && user.telegramChatId) {
      telegramSent = await sendTelegramMessage(user.telegramChatId, monitor);
      if (telegramSent) methodsUsed.push('Telegram');
    }

    if (methodsUsed.length > 0) {
      data.notifications.push({
        _id: crypto.randomUUID(),
        userId: user._id,
        monitorId: monitor._id,
        type: methodsUsed.join(' + '),
        title: `${monitor.name} Result Detected`,
        message: `Content change detected for ${monitor.url}`,
        status: 'SENT',
        createdAt: new Date().toISOString()
      });
      writeData(data);
    }
  } catch (error) {
    console.error('Error in sendNotifications dispatcher:', error);
  }
};

module.exports = { sendNotifications };
