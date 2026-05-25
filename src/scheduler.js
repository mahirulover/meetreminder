// ===== 會議提醒排程器 =====
// 使用 node-schedule 排程會議提醒，在會議開始前 2 小時發送 LINE 通知。

import schedule from 'node-schedule';
import dayjs from 'dayjs';
import { getUpcomingMeetings, markReminderSent } from './database.js';

// 儲存進行中的排程工作，key 為會議 ID
const activeJobs = new Map();

/**
 * 為單一會議排程提醒
 * 提醒時間為會議開始前 2 小時。
 * - 若提醒時間已過但會議尚未開始，立即發送提醒。
 * - 若會議已結束，僅記錄日誌並返回。
 * - 否則，排程在提醒時間觸發工作。
 *
 * @param {object} meeting - 會議資料 { id, user_id, title, datetime, location, emails }
 * @param {object} lineClient - LINE Messaging API 客戶端
 */
export async function scheduleMeetingReminder(meeting, lineClient) {
  const meetingTime = dayjs(meeting.datetime, 'YYYY-MM-DDTHH:mm');
  const reminderTime = meetingTime.subtract(2, 'hour');
  const now = dayjs();

  // 若會議時間已過，記錄日誌並返回
  if (meetingTime.isBefore(now)) {
    console.log(`⏭️ 會議「${meeting.title}」已過期，跳過提醒排程`);
    return;
  }

  // 若提醒時間已過但會議尚未開始，立即發送提醒
  if (reminderTime.isBefore(now)) {
    console.log(`⚡ 會議「${meeting.title}」的提醒時間已過，立即發送提醒`);
    try {
      // 動態匯入 messages 模組以避免循環依賴
      const { createReminderMessage } = await import('./messages.js');
      await lineClient.pushMessage({
        to: meeting.user_id,
        messages: [createReminderMessage(meeting)],
      });
      console.log(`✅ 已立即發送會議「${meeting.title}」的提醒`);
    } catch (error) {
      console.error(`❌ 立即發送會議「${meeting.title}」的提醒時發生錯誤：`, error);
    }
    await markReminderSent(meeting.id);
    return;
  }

  // 排程在提醒時間觸發工作
  const job = schedule.scheduleJob(reminderTime.toDate(), async () => {
    try {
      // 動態匯入 messages 模組以避免循環依賴
      const { createReminderMessage } = await import('./messages.js');
      await lineClient.pushMessage({
        to: meeting.user_id,
        messages: [createReminderMessage(meeting)],
      });
      console.log(`✅ 已發送會議「${meeting.title}」的提醒`);
    } catch (error) {
      console.error(`❌ 發送會議「${meeting.title}」的提醒時發生錯誤：`, error);
    }

    // 標記提醒已發送
    await markReminderSent(meeting.id);

    // 從進行中的工作清單移除
    activeJobs.delete(meeting.id);
  });

  // 將工作存入 Map
  activeJobs.set(meeting.id, job);
  console.log(
    `⏰ 已排程會議「${meeting.title}」的提醒，將於 ${reminderTime.format('YYYY-MM-DD HH:mm')} 發送`
  );
}

/**
 * 載入所有待提醒的會議並排程提醒
 * 從資料庫取得所有尚未發送提醒的即將到來會議，逐一排程。
 *
 * @param {object} lineClient - LINE Messaging API 客戶端
 */
export async function loadPendingReminders(lineClient) {
  const meetings = await getUpcomingMeetings();

  for (const meeting of meetings) {
    await scheduleMeetingReminder(meeting, lineClient);
  }

  console.log(`📋 已載入 ${meetings.length} 筆待提醒的會議`);
}

/**
 * 取消指定會議的提醒排程
 * 若該會議有排程中的工作，將其取消並從 Map 中移除。
 *
 * @param {number|string} meetingId - 會議 ID
 */
export function cancelReminder(meetingId) {
  const job = activeJobs.get(meetingId);
  if (job) {
    job.cancel();
    activeJobs.delete(meetingId);
    console.log(`🗑️ 已取消會議 ID ${meetingId} 的提醒排程`);
  }
}
