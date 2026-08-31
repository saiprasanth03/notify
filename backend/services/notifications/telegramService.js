const TelegramBot = require('node-telegram-bot-api');
const User = require('../../models/User');
const Otp = require('../../models/Otp');

let bot = null;

if (process.env.TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
  
  // Handle /login command or /start login - ask for phone number
  bot.onText(/\/(login|start login)/, async (msg) => {
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
    
    try {
      // Find a pending OTP that matches this phone number
      const otps = await Otp.find({ expiresAt: { $gt: new Date() } });
      const pendingOtp = otps.find(o => phone.endsWith(o.identifier.replace(/\D/g, '')) || o.identifier.replace(/\D/g, '').endsWith(phone));
      
      let identifier = pendingOtp ? pendingOtp.identifier : phone;

      // Link user
      let user = await User.findOne({ identifier });
      if (!user) {
        user = await User.create({
          identifier,
          name: identifier,
          telegramChatId: chatId.toString(),
          telegramUsername: msg.chat.username || 'Unknown',
          telegramConnected: true
        });
      } else {
        user.telegramChatId = chatId.toString();
        user.telegramUsername = msg.chat.username || 'Unknown';
        user.telegramConnected = true;
        await user.save();
      }

      // Generate a fresh OTP for them to use right now
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await Otp.create({
        identifier,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60000)
      });

      const message = `
🔑 *Verification Successful!*

Your One-Time Password is: \`${otp}\`

Please enter this on the website to log in. It expires in 10 minutes.
      `;
      
      // Remove the keyboard
      const removeKeyboard = { reply_markup: { remove_keyboard: true }, parse_mode: 'Markdown' };
      bot.sendMessage(chatId, message, removeKeyboard);
    } catch (err) {
      console.error('Error linking Telegram account:', err);
      bot.sendMessage(chatId, "An error occurred while linking your account. Please try again.");
    }
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

  let resultsText = '';
  if (monitor.allotmentResults && monitor.allotmentResults.length > 0) {
    resultsText = '\n*Results:*\n' + monitor.allotmentResults.map(r => 
      `• *${r.pan}*: ${r.status}${r.name && r.name !== 'N/A' && r.name !== r.status ? ` - ${r.name}` : ''}`
    ).join('\n') + '\n';
  }

  const message = `
🚨 *Update Detected!*

*${monitor.name}* has just been updated.
${resultsText}
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
