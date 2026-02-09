const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// LINE credentials from environment variables
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_GROUP_ID = process.env.TELEGRAM_GROUP_ID;

// Health check
app.get('/', (req, res) => {
  res.send('LINE Webhook Server is running!');
});

// LINE Webhook endpoint
app.post('/webhook', async (req, res) => {
  res.status(200).send('OK');
  
  const events = req.body.events || [];
  
  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const text = event.message.text;
      const replyToken = event.replyToken;
      
      console.log(`Received: ${text} from ${userId}`);
      
      // Notify Telegram
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_GROUP_ID) {
        try {
          await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_GROUP_ID,
            text: `📱 LINE 訊息\n👤 用戶: ${userId}\n💬 內容: ${text}`
          });
        } catch (err) {
          console.error('Telegram notify error:', err.message);
        }
      }
      
      // Simple auto-reply
      await replyToLine(replyToken, '感謝您的訊息！我們會盡快回覆您。');
    }
  }
});

async function replyToLine(replyToken, text) {
  try {
    await axios.post('https://api.line.me/v2/bot/message/reply', {
      replyToken,
      messages: [{ type: 'text', text }]
    }, {
      headers: {
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('LINE reply error:', err.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
