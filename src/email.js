// ====================================
// 電子郵件模組 - 使用 Nodemailer 透過 Gmail 發送
// 負責會議通知與提醒郵件的發送
// ====================================

import nodemailer from 'nodemailer';
import dayjs from 'dayjs';
import { createEvent } from 'ics';

// ====================================
// 建立 Gmail SMTP 傳輸器
// 使用應用程式密碼進行驗證（需在 Google 帳號設定中產生）
// ====================================
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * 產生會議通知的 HTML 郵件內容
 * 使用內嵌 CSS 打造專業、美觀的郵件版面，以綠色 (#2ecc71) 作為主題色
 * @param {Object} meeting - 會議資料
 * @param {string} type - 郵件類型：'notification'（通知）或 'reminder'（提醒）
 * @returns {string} HTML 格式的郵件內容
 */
function buildEmailHTML(meeting, type = 'notification') {
  const formattedDate = dayjs(meeting.datetime).format('YYYY/MM/DD HH:mm');
  const headerText = type === 'reminder' ? '會議即將開始' : '會議通知';
  const headerIcon = type === 'reminder' ? '⏰' : '📅';

  return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Microsoft JhengHei', 'PingFang TC', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- 頂部綠色標題區域 -->
              <tr>
                <td style="background-color: #2ecc71; padding: 30px 40px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                    ${headerIcon} ${headerText}
                  </h1>
                </td>
              </tr>
              <!-- 郵件主體內容 -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 24px 0; color: #2c3e50; font-size: 20px; border-bottom: 2px solid #2ecc71; padding-bottom: 12px;">
                    ${meeting.title}
                  </h2>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <!-- 會議時間 -->
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #ecf0f1;">
                        <span style="color: #7f8c8d; font-size: 14px; display: inline-block; width: 80px;">🕐 時間</span>
                        <span style="color: #2c3e50; font-size: 16px; font-weight: bold;">${formattedDate}</span>
                      </td>
                    </tr>
                    <!-- 會議地點 -->
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #ecf0f1;">
                        <span style="color: #7f8c8d; font-size: 14px; display: inline-block; width: 80px;">📍 地點</span>
                        <span style="color: #2c3e50; font-size: 16px; font-weight: bold;">${meeting.location}</span>
                      </td>
                    </tr>
                  </table>
                  <!-- 提示訊息 -->
                  <p style="margin: 24px 0 0 0; padding: 16px; background-color: #f0faf4; border-left: 4px solid #2ecc71; color: #2c3e50; font-size: 14px; border-radius: 0 4px 4px 0;">
                    ${type === 'reminder'
                      ? '此為會議提醒通知，請準時出席。'
                      : '您已被加入此會議，請確認時間並準時出席。'}
                  </p>
                </td>
              </tr>
              <!-- 底部資訊 -->
              <tr>
                <td style="background-color: #f9f9f9; padding: 20px 40px; text-align: center; border-top: 1px solid #ecf0f1;">
                  <p style="margin: 0; color: #95a5a6; font-size: 12px;">
                    此郵件由會議提醒系統自動發送，請勿直接回覆。
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * 產生會議的 iCalendar (.ics) 事件物件
 * @param {Object} meeting - 會議資料
 * @returns {Object|null} nodemailer 的 icalEvent 設定物件
 */
function getIcalEvent(meeting) {
  const start = dayjs(meeting.datetime);
  const event = {
    start: [start.year(), start.month() + 1, start.date(), start.hour(), start.minute()],
    duration: { hours: 1, minutes: 0 }, // 預設會議長度 1 小時
    title: meeting.title,
    location: meeting.location,
    status: 'CONFIRMED',
    organizer: { name: '會議小助手', email: process.env.GMAIL_USER || 'bot@example.com' },
  };
  
  const { error, value } = createEvent(event);
  if (error) {
    console.error('❌ 生成 ics 失敗：', error);
    return null;
  }
  
  return {
    filename: 'meeting.ics',
    method: 'request',
    content: value
  };
}

/**
 * 發送會議通知郵件
 * 當新會議建立時，通知所有與會者
 * @param {Object} meeting - 會議資料（包含 title, datetime, location, emails）
 */
export async function sendMeetingNotification(meeting) {
  // 若無收件人信箱，記錄訊息後直接返回
  if (!meeting.emails || meeting.emails.trim() === '') {
    console.log('📧 未設定收件人信箱，跳過會議通知郵件發送。');
    return;
  }

  try {
    const html = buildEmailHTML(meeting, 'notification');

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: meeting.emails,
      subject: `📅 會議通知：${meeting.title}`,
      html,
    };

    const ical = getIcalEvent(meeting);
    if (ical) mailOptions.icalEvent = ical;

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ 會議通知郵件已成功發送：${info.messageId}`);
  } catch (error) {
    // 捕捉錯誤但不拋出，避免郵件發送失敗導致整個應用程式崩潰
    console.error('❌ 會議通知郵件發送失敗：', error.message);
  }
}

/**
 * 發送會議提醒郵件
 * 在會議即將開始前，提醒所有與會者
 * @param {Object} meeting - 會議資料（包含 title, datetime, location, emails）
 */
export async function sendReminderEmail(meeting) {
  // 若無收件人信箱，記錄訊息後直接返回
  if (!meeting.emails || meeting.emails.trim() === '') {
    console.log('📧 未設定收件人信箱，跳過會議提醒郵件發送。');
    return;
  }

  try {
    const html = buildEmailHTML(meeting, 'reminder');

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: meeting.emails,
      subject: `⏰ 會議提醒：${meeting.title} 即將開始`,
      html,
    };

    const ical = getIcalEvent(meeting);
    if (ical) mailOptions.icalEvent = ical;

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ 會議提醒郵件已成功發送：${info.messageId}`);
  } catch (error) {
    // 捕捉錯誤但不拋出，避免郵件發送失敗導致整個應用程式崩潰
    console.error('❌ 會議提醒郵件發送失敗：', error.message);
  }
}
