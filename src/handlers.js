import * as conversation from './conversation.js';
import * as db from './database.js';
import * as messages from './messages.js';
import * as scheduler from './scheduler.js';
import { sendMeetingNotification } from './email.js';

export async function handleEvent(event, client) {
  if (event.type === 'message' && event.message.type === 'text') {
    return handleTextMessage(event, client);
  } else if (event.type === 'postback') {
    return handlePostback(event, client);
  } else if (event.type === 'follow') {
    return handleFollow(event, client);
  }
  return null;
}

async function handleFollow(event, client) {
  await client.replyMessage({
    replyToken: event.replyToken,
    messages: [messages.createWelcomeMessage()]
  });
}

async function handleTextMessage(event, client) {
  const userId = event.source.userId;
  const text = event.message.text.trim();

  // 處理全域指令
  if (text === '取消') {
    conversation.resetState(userId);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: '✅ 已取消目前操作。' }]
    });
  } else if (text === '查看會議' || text === '我的會議') {
    const userMeetings = db.getMeetingsByUser(userId);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [messages.createMeetingListCard(userMeetings)]
    });
  } else if (text === '幫助' || text.toLowerCase() === 'help') {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [messages.createHelpMessage()]
    });
  } else if (text === '開會' || text === '新增會議' || text === '會議') {
    conversation.startMeetingFlow(userId);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [messages.createAskTitleMessage()]
    });
  }

  // 處理對話狀態
  const state = conversation.getState(userId);
  if (state === conversation.STATES.IDLE) {
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [messages.createWelcomeMessage()]
    });
  }

  switch (state) {
    case conversation.STATES.AWAITING_TITLE:
      conversation.setTitle(userId, text);
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [messages.createAskDatetimeMessage()]
      });

    case conversation.STATES.AWAITING_DATETIME:
      // 日期時間應該由 datetimepicker 透過 postback 處理，若使用者亂打則提示
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [messages.createAskDatetimeMessage()]
      });

    case conversation.STATES.AWAITING_LOCATION:
      conversation.setLocation(userId, text);
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [messages.createAskEmailsMessage()]
      });

    case conversation.STATES.AWAITING_EMAILS:
      conversation.setEmails(userId, text);
      const meetingData = conversation.getMeetingData(userId);
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [messages.createMeetingConfirmCard(meetingData)]
      });

    case conversation.STATES.CONFIRMING:
      // 等待按鈕確認
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: '請點選上方卡片的「確認建立」或「取消」按鈕。' }]
      });
  }
}

async function handlePostback(event, client) {
  const userId = event.source.userId;
  const data = event.postback.data;
  const params = new URLSearchParams(data);
  const action = params.get('action');

  if (action === 'pick_datetime') {
    const state = conversation.getState(userId);
    if (state === conversation.STATES.AWAITING_DATETIME && event.postback.params && event.postback.params.datetime) {
      conversation.setDatetime(userId, event.postback.params.datetime);
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [messages.createAskLocationMessage()]
      });
    }
  } else if (action === 'confirm_meeting') {
    const state = conversation.getState(userId);
    if (state === conversation.STATES.CONFIRMING) {
      const missing = conversation.getMissingFields(userId);
      if (missing.length > 0) {
        return client.replyMessage({
          replyToken: event.replyToken,
          messages: [messages.createIncompleteWarning(missing)]
        });
      }

      const meetingData = conversation.getMeetingData(userId);
      // 寫入資料庫
      const newMeeting = db.createMeeting({
        userId,
        title: meetingData.title,
        datetime: meetingData.datetime,
        location: meetingData.location,
        emails: meetingData.emails === '跳過' ? '' : meetingData.emails
      });

      // 清除狀態
      conversation.resetState(userId);

      // 寄送 Email
      if (newMeeting.emails) {
        await sendMeetingNotification(newMeeting);
      }

      // 設定排程提醒
      scheduler.scheduleMeetingReminder(newMeeting, client);

      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [messages.createMeetingCreatedMessage(newMeeting)]
      });
    } else {
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: '此會議流程已過期或已完成。' }]
      });
    }
  } else if (action === 'cancel_meeting') {
    conversation.resetState(userId);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: '✅ 已取消建立會議。' }]
    });
  } else if (action === 'delete_meeting') {
    const id = parseInt(params.get('id'), 10);
    db.deleteMeeting(id);
    scheduler.cancelReminder(id);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: '✅ 已成功刪除會議。' }]
    });
  }
}
