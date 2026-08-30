const TelegramBot = require('node-telegram-bot-api');
const { readData, writeData } = require('../../store');

let bot = null;

if (process.env.TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  
  // Handle /login command - ask for phone number
  bot.onText(/\/login/, async (msg) => {
    const chatId = msg.chat.id;
    
    const opts = {
      reply_markup: {
        keyboard: [
          [{ text: "📱 Share Phone Number", request_contact: true }]
        ],
        one_time_keyboard: true,
        resize_keyboard: true
      },
      parse_mode: 'Markdown'
    };
    
    bot.sendMessage(chatId, "Please share your phone number to verify your login request.", opts);
  });

  // Handle contact sharing
  bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    if (msg.contact.user_id !== msg.from.id) {
      return bot.sendMessage(chatId, "Please share your own contact.");
    }

    // Normalize phone number (remove + or spaces)
    let phone = msg.contact.phone_number.replace(/\D/g, '');
    
    // Check if the user entered this number or a variation on the website
    let data = readData();
    data.otps = data.otps.filter(o => o.expiresAt > Date.now());

    // Try to find if an OTP was requested for this phone number
    // We check exact match, or if one ends with the other (to handle country codes)
    let pendingOtp = data.otps.find(o => phone.endsWith(o.identifier.replace(/\D/g, '')) || o.identifier.replace(/\D/g, '').endsWith(phone));

    let identifier = pendingOtp ? pendingOtp.identifier : phone;

    // Link user
    let user = data.users.find(u => u.identifier === identifier);
    if (!user) {
      const crypto = require('crypto');
      user = {
        _id: crypto.randomUUID(),
        identifier,
        name: identifier,
        telegramChatId: chatId.toString(),
        telegramUsername: msg.chat.username || 'Unknown',
        telegramConnected: true,
        createdAt: new Date().toISOString()
      };
      data.users.push(user);
    } else {
      user.telegramChatId = chatId.toString();
      user.telegramUsername = msg.chat.username || 'Unknown';
      user.telegramConnected = true;
    }

    // Generate a fresh OTP for them to use right now
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    data.otps.push({
      identifier,
      otp,
      expiresAt: Date.now() + 10 * 60000
    });

    writeData(data);

    const message = `
🔑 *Verification Successful!*

Your One-Time Password is: \`${otp}\`

Please enter this on the website to log in. It expires in 10 minutes.
    `;
    
    // Remove the keyboard
    const removeKeyboard = { reply_markup: { remove_keyboard: true }, parse_mode: 'Markdown' };
    bot.sendMessage(chatId, message, removeKeyboard);
  });

  bot.onText(/^\/start$/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Welcome to WatchMyWeb! Send /login to receive an OTP to log into the website.');
  });
}

const sendTelegramMessage = async (chatId, monitor) => {
  if (!bot) {
    console.log(`[Mock Telegram] To: ${chatId}, Monitor: ${monitor.name}`);
    return true;
  }

  const message = `
🚨 *Update Detected!*

*${monitor.name}* has just been updated.

${monitor.identifier ? `*Your Identifier / PAN:* \`${monitor.identifier}\`\n` : ''}
*Description:*
${monitor.description}
  `;

  try {
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌐 Open Website', url: monitor.url }]
        ]
      }
    });
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
};

const sendTelegramTestMessage = async (chatId) => {
  if (!bot) return true;
  
  const message = `
🔔 *WatchMyWeb Test Notification*

Your Telegram account is successfully connected!

You will receive monitoring alerts here.
  `;
  
  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    return true;
  } catch (error) {
    console.error('Error sending Telegram test message:', error);
    return false;
  }
};

module.exports = { 
  sendTelegramMessage, 
  sendTelegramTestMessage,
  getBot: () => bot 
};
