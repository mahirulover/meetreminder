import express from 'express';
import * as line from '@line/bot-sdk';
import 'dotenv/config';
import { handleEvent } from './handlers.js';
import { loadPendingReminders } from './scheduler.js';

// 確認環境變數
if (!process.env.CHANNEL_SECRET || !process.env.CHANNEL_ACCESS_TOKEN) {
  console.error('❌ 錯誤：未設定 LINE_CHANNEL_SECRET 或 LINE_CHANNEL_ACCESS_TOKEN');
  process.exit(1);
}

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
};

// 建立 LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
});

const app = express();

// LINE Webhook 路由
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(event => handleEvent(event, client)))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('❌ Webhook 處理錯誤:', err);
      res.status(500).end();
    });
});

// 健康檢查
app.get('/', (req, res) => {
  res.send('LINE Bot Server is running!');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 伺服器已啟動於 port ${port}`);
  // 伺服器啟動時，載入資料庫中所有尚未提醒的會議，重新排程
  loadPendingReminders(client);
});

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n關閉伺服器...');
  // db 關閉等清理作業可在此執行
  process.exit(0);
});
