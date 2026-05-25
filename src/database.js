// ====================================
// 資料庫模組 - 使用 better-sqlite3
// 負責會議資料的存取與管理
// ====================================

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';

// 取得目前檔案的目錄路徑，用於定位資料庫檔案
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 在專案根目錄建立 meetings.db 資料庫檔案
const dbPath = path.join(__dirname, '..', 'meetings.db');
const db = new Database(dbPath);

// 啟用 WAL 模式以提升效能
db.pragma('journal_mode = WAL');

// ====================================
// 初始化資料表：若不存在則自動建立
// ====================================
db.exec(`
  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    datetime TEXT NOT NULL,
    location TEXT NOT NULL,
    emails TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    reminder_sent INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

/**
 * 建立新會議
 * 將會議資料寫入資料庫，並回傳包含新 ID 的會議物件
 * @param {Object} param0 - 會議資料
 * @param {string} param0.userId - 使用者 ID
 * @param {string} param0.title - 會議標題
 * @param {string} param0.datetime - 會議日期時間
 * @param {string} param0.location - 會議地點
 * @param {string} param0.emails - 通知信箱（逗號分隔）
 * @returns {Object} 新建立的會議資料（含 id）
 */
export function createMeeting({ userId, title, datetime, location, emails }) {
  const stmt = db.prepare(`
    INSERT INTO meetings (user_id, title, datetime, location, emails)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(userId, title, datetime, location, emails || '');

  // 回傳新建立的會議，包含自動產生的 ID
  return {
    id: result.lastInsertRowid,
    user_id: userId,
    title,
    datetime,
    location,
    emails,
  };
}

/**
 * 取得指定使用者的所有有效會議
 * 依照會議時間升冪排序，僅回傳狀態為 active 的會議
 * @param {string} userId - 使用者 ID
 * @returns {Array} 會議列表
 */
export function getMeetingsByUser(userId) {
  const stmt = db.prepare(`
    SELECT * FROM meetings
    WHERE user_id = ? AND status = 'active'
    ORDER BY datetime ASC
  `);
  return stmt.all(userId);
}

/**
 * 依照 ID 取得單一會議
 * @param {number} id - 會議 ID
 * @returns {Object|undefined} 會議資料，若不存在則回傳 undefined
 */
export function getMeetingById(id) {
  const stmt = db.prepare('SELECT * FROM meetings WHERE id = ?');
  return stmt.get(id);
}

/**
 * 刪除（取消）會議
 * 不做實際刪除，而是將狀態更新為 cancelled（軟刪除）
 * @param {number} id - 會議 ID
 * @returns {Object} 更新結果
 */
export function deleteMeeting(id) {
  const stmt = db.prepare(`
    UPDATE meetings SET status = 'cancelled' WHERE id = ?
  `);
  return stmt.run(id);
}

/**
 * 取得即將到來且尚未發送提醒的會議
 * 篩選條件：狀態為 active、尚未發送提醒、會議時間在當前時間之後
 * @returns {Array} 即將到來的會議列表
 */
export function getUpcomingMeetings() {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const stmt = db.prepare(`
    SELECT * FROM meetings
    WHERE status = 'active'
      AND reminder_sent = 0
      AND datetime > ?
  `);
  return stmt.all(now);
}

/**
 * 標記會議提醒已發送
 * 將 reminder_sent 欄位設為 1，避免重複發送提醒
 * @param {number} id - 會議 ID
 * @returns {Object} 更新結果
 */
export function markReminderSent(id) {
  const stmt = db.prepare(`
    UPDATE meetings SET reminder_sent = 1 WHERE id = ?
  `);
  return stmt.run(id);
}

/**
 * 取得已過期的會議
 * 篩選條件：會議時間已過且狀態仍為 active，用於定期清理
 * @returns {Array} 已過期的會議列表
 */
export function getPastMeetings() {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const stmt = db.prepare(`
    SELECT * FROM meetings
    WHERE datetime < ?
      AND status = 'active'
  `);
  return stmt.all(now);
}

// 匯出資料庫實例，供關閉程式時使用（例如 graceful shutdown）
export { db };
