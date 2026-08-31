require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const Otp = require('./models/Otp');
  const phone = '919441207547';
  const chatId = '6949444268';
  const msg = { chat: { username: 'Test' } };

  try {
    const otps = await Otp.find({ expiresAt: { $gt: new Date() } });
    const pendingOtp = otps.find(o => phone.endsWith(o.identifier.replace(/\D/g, '')) || o.identifier.replace(/\D/g, '').endsWith(phone));
    let identifier = pendingOtp ? pendingOtp.identifier : phone;
    let user = await User.findOne({ identifier });
    
    if (!user) {
      console.log('Creating user');
      user = await User.create({
        identifier,
        name: identifier,
        telegramChatId: chatId.toString(),
        telegramUsername: msg.chat.username || 'Unknown',
        telegramConnected: true
      });
    } else {
      console.log('Updating user');
      user.telegramChatId = chatId.toString();
      user.telegramUsername = msg.chat.username || 'Unknown';
      user.telegramConnected = true;
      await user.save();
    }
    
    console.log('Creating OTP');
    await Otp.create({
      identifier,
      otp: '123456',
      expiresAt: new Date(Date.now() + 10 * 60000)
    });
    
    console.log('Success');
  } catch(e) {
    console.log('Error:', e.message);
  }
  process.exit(0);
});
