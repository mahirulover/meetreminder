import dayjs from 'dayjs';
import 'dayjs/locale/zh-tw.js';
dayjs.locale('zh-tw');

export function createWelcomeMessage() {
  return {
    type: 'text',
    text: '👋 您好！我是會議小助手\n\n我可以幫您：\n📅 建立會議並通知與會者\n⏰ 在會議前 2 小時提醒您\n\n請點選下方按鈕或輸入指令開始！',
    quickReply: {
      items: [
        { type: 'action', action: { type: 'message', label: '📅 新增會議', text: '開會' } },
        { type: 'action', action: { type: 'message', label: '📋 查看會議', text: '查看會議' } },
        { type: 'action', action: { type: 'message', label: '❓ 幫助', text: '幫助' } }
      ]
    }
  };
}

export function createAskTitleMessage() {
  return { type: 'text', text: '📌 請輸入會議主題：\n\n例如：Q3 進度檢討會議' };
}

export function createAskDatetimeMessage() {
  return {
    type: 'text',
    text: '📅 請選擇會議日期與時間：',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'datetimepicker',
            label: '選擇日期時間',
            data: 'action=pick_datetime',
            mode: 'datetime'
          }
        }
      ]
    }
  };
}

export function createAskLocationMessage() {
  return { type: 'text', text: '📍 請輸入會議地點：\n\n例如：3F 會議室A / Google Meet 連結' };
}

export function createAskEmailsMessage() {
  return {
    type: 'text',
    text: '📧 請輸入與會者的 Email（以逗號分隔）：\n\n例如：alice@example.com, bob@example.com\n\n💡 如果不需要寄送通知，請輸入「跳過」',
    quickReply: {
      items: [
        { type: 'action', action: { type: 'message', label: '跳過', text: '跳過' } }
      ]
    }
  };
}

export function createMeetingConfirmCard(meeting) {
  const formattedTime = dayjs(meeting.datetime).format('YYYY/MM/DD (dd) HH:mm');
  const emailsText = meeting.emails && meeting.emails !== '跳過' ? meeting.emails : '無';

  return {
    type: 'flex',
    altText: '📅 會議確認',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1DB446',
        contents: [
          { type: 'text', text: '📅 會議確認', weight: 'bold', color: '#FFFFFF', size: 'lg' }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: '主題', weight: 'bold', color: '#555555', flex: 1 },
              { type: 'text', text: meeting.title, wrap: true, flex: 3 }
            ]
          },
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: '時間', weight: 'bold', color: '#555555', flex: 1 },
              { type: 'text', text: formattedTime, wrap: true, flex: 3 }
            ]
          },
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: '地點', weight: 'bold', color: '#555555', flex: 1 },
              { type: 'text', text: meeting.location, wrap: true, flex: 3 }
            ]
          },
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: '與會者', weight: 'bold', color: '#555555', flex: 1 },
              { type: 'text', text: emailsText, wrap: true, flex: 3 }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          { type: 'separator' },
          {
            type: 'button',
            style: 'primary',
            color: '#1DB446',
            action: { type: 'postback', label: '✅ 確認建立', data: 'action=confirm_meeting' },
            margin: 'md'
          },
          {
            type: 'button',
            style: 'secondary',
            action: { type: 'postback', label: '❌ 取消', data: 'action=cancel_meeting' }
          }
        ]
      }
    }
  };
}

export function createMeetingCreatedMessage(meeting) {
  const formattedTime = dayjs(meeting.datetime).format('YYYY/MM/DD (dd) HH:mm');
  const hasEmails = meeting.emails && meeting.emails !== '跳過';
  const emailsText = hasEmails ? meeting.emails : '無';

  const footerContents = [
    { type: 'separator' },
    { type: 'text', text: '⏰ 將在會議前 2 小時提醒您', color: '#888888', size: 'xs', margin: 'md', align: 'center' }
  ];

  if (hasEmails) {
    footerContents.push({ type: 'text', text: '📧 已發送通知信給與會者', color: '#888888', size: 'xs', align: 'center' });
  }

  return {
    type: 'flex',
    altText: '✅ 會議已建立',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1DB446',
        contents: [
          { type: 'text', text: '✅ 會議已建立', weight: 'bold', color: '#FFFFFF', size: 'lg' }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: '主題', weight: 'bold', color: '#555555', flex: 1 },
              { type: 'text', text: meeting.title, wrap: true, flex: 3 }
            ]
          },
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: '時間', weight: 'bold', color: '#555555', flex: 1 },
              { type: 'text', text: formattedTime, wrap: true, flex: 3 }
            ]
          },
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: '地點', weight: 'bold', color: '#555555', flex: 1 },
              { type: 'text', text: meeting.location, wrap: true, flex: 3 }
            ]
          },
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: '與會者', weight: 'bold', color: '#555555', flex: 1 },
              { type: 'text', text: emailsText, wrap: true, flex: 3 }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: footerContents
      }
    }
  };
}

export function createReminderMessage(meeting) {
  const formattedTime = dayjs(meeting.datetime).format('YYYY/MM/DD (dd) HH:mm');
  return {
    type: 'flex',
    altText: '⏰ 會議提醒',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#F39C12',
        contents: [
          { type: 'text', text: '⏰ 會議提醒', weight: 'bold', color: '#FFFFFF', size: 'lg' }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: '以下會議將在 2 小時後開始：', weight: 'bold', color: '#F39C12', wrap: true },
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: '主題', weight: 'bold', color: '#555555', flex: 1 },
              { type: 'text', text: meeting.title, wrap: true, flex: 3 }
            ]
          },
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: '時間', weight: 'bold', color: '#555555', flex: 1 },
              { type: 'text', text: formattedTime, wrap: true, flex: 3 }
            ]
          },
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: '地點', weight: 'bold', color: '#555555', flex: 1 },
              { type: 'text', text: meeting.location, wrap: true, flex: 3 }
            ]
          }
        ]
      }
    }
  };
}

export function createMeetingListCard(meetings) {
  if (!meetings || meetings.length === 0) {
    return { type: 'text', text: '📋 您目前沒有任何會議' };
  }

  const bubbles = meetings.slice(0, 10).map(meeting => {
    const formattedTime = dayjs(meeting.datetime).format('YYYY/MM/DD (dd) HH:mm');
    return {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: meeting.title, weight: 'bold', size: 'lg', wrap: true },
          { type: 'text', text: `📅 ${formattedTime}`, color: '#666666', size: 'sm', wrap: true },
          { type: 'text', text: `📍 ${meeting.location}`, color: '#666666', size: 'sm', wrap: true }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'secondary',
            color: '#E74C3C',
            action: { type: 'postback', label: '🗑️ 取消會議', data: `action=delete_meeting&id=${meeting.id}` }
          }
        ]
      }
    };
  });

  return {
    type: 'flex',
    altText: '📋 會議列表',
    contents: {
      type: 'carousel',
      contents: bubbles
    }
  };
}

export function createHelpMessage() {
  return {
    type: 'text',
    text: '📖 使用說明：\n\n📅 新增會議 → 輸入「開會」\n📋 查看會議 → 輸入「查看會議」\n❌ 取消操作 → 輸入「取消」\n\n建立會議時，我會引導您輸入：\n1️⃣ 會議主題\n2️⃣ 日期時間\n3️⃣ 地點\n4️⃣ 與會者 Email\n\n確認後會自動：\n📧 寄送 Email 通知\n⏰ 會議前 2 小時 LINE 提醒',
    quickReply: {
      items: [
        { type: 'action', action: { type: 'message', label: '📅 新增會議', text: '開會' } },
        { type: 'action', action: { type: 'message', label: '📋 查看會議', text: '查看會議' } }
      ]
    }
  };
}

export function createIncompleteWarning(missingFields) {
  const fieldsText = missingFields.map(f => `❌ ${f}`).join('\n');
  return {
    type: 'text',
    text: `⚠️ 以下資訊尚未填寫：\n${fieldsText}\n\n請補充完整資訊後再確認。`
  };
}
