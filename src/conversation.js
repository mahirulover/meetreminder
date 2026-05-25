// ===== 會議建立流程的對話狀態機 =====
// 使用 Map 儲存每位使用者的對話狀態，追蹤會議建立的各個步驟。
// 單一使用者系統。

/**
 * 對話狀態列舉
 * IDLE：閒置，尚未開始建立會議
 * AWAITING_TITLE：等待使用者輸入會議主題
 * AWAITING_DATETIME：等待使用者輸入會議時間
 * AWAITING_LOCATION：等待使用者輸入會議地點
 * AWAITING_EMAILS：等待使用者輸入與會者電子郵件
 * CONFIRMING：所有資料已填寫，等待使用者確認
 */
export const STATES = {
  IDLE: 'IDLE',
  AWAITING_TITLE: 'AWAITING_TITLE',
  AWAITING_DATETIME: 'AWAITING_DATETIME',
  AWAITING_LOCATION: 'AWAITING_LOCATION',
  AWAITING_EMAILS: 'AWAITING_EMAILS',
  CONFIRMING: 'CONFIRMING',
};

// 使用 Map 儲存各使用者的對話狀態與會議資料
const conversations = new Map();

/**
 * 取得使用者目前的對話狀態
 * @param {string} userId - 使用者 ID
 * @returns {string} 目前的狀態，預設為 IDLE
 */
export function getState(userId) {
  const entry = conversations.get(userId);
  return entry ? entry.state : STATES.IDLE;
}

/**
 * 開始會議建立流程
 * 將狀態設為 AWAITING_TITLE，並初始化空的會議資料
 * @param {string} userId - 使用者 ID
 */
export function startMeetingFlow(userId) {
  conversations.set(userId, {
    state: STATES.AWAITING_TITLE,
    meetingData: {
      title: null,
      datetime: null,
      location: null,
      emails: null,
    },
  });
}

/**
 * 設定會議主題，並將狀態推進到 AWAITING_DATETIME
 * @param {string} userId - 使用者 ID
 * @param {string} title - 會議主題
 */
export function setTitle(userId, title) {
  const entry = conversations.get(userId);
  if (entry) {
    entry.meetingData.title = title;
    entry.state = STATES.AWAITING_DATETIME;
  }
}

/**
 * 設定會議時間，並將狀態推進到 AWAITING_LOCATION
 * @param {string} userId - 使用者 ID
 * @param {string} datetime - 會議時間字串
 */
export function setDatetime(userId, datetime) {
  const entry = conversations.get(userId);
  if (entry) {
    entry.meetingData.datetime = datetime;
    entry.state = STATES.AWAITING_LOCATION;
  }
}

/**
 * 設定會議地點，並將狀態推進到 AWAITING_EMAILS
 * @param {string} userId - 使用者 ID
 * @param {string} location - 會議地點
 */
export function setLocation(userId, location) {
  const entry = conversations.get(userId);
  if (entry) {
    entry.meetingData.location = location;
    entry.state = STATES.AWAITING_EMAILS;
  }
}

/**
 * 設定與會者電子郵件，並將狀態推進到 CONFIRMING
 * @param {string} userId - 使用者 ID
 * @param {string} emails - 與會者電子郵件字串
 */
export function setEmails(userId, emails) {
  const entry = conversations.get(userId);
  if (entry) {
    entry.meetingData.emails = emails;
    entry.state = STATES.CONFIRMING;
  }
}

/**
 * 取得使用者目前的會議資料物件
 * @param {string} userId - 使用者 ID
 * @returns {object|null} 會議資料，若無則回傳 null
 */
export function getMeetingData(userId) {
  const entry = conversations.get(userId);
  return entry ? entry.meetingData : null;
}

/**
 * 重設使用者的對話狀態（從 Map 中移除，回到 IDLE）
 * @param {string} userId - 使用者 ID
 */
export function resetState(userId) {
  conversations.delete(userId);
}

/**
 * 取得使用者尚未填寫的會議欄位名稱（以中文回傳）
 * @param {string} userId - 使用者 ID
 * @returns {string[]} 缺少的欄位名稱陣列，例如 ['主題', '時間', '地點']
 */
export function getMissingFields(userId) {
  const entry = conversations.get(userId);

  // 若使用者不存在於 Map 中，則所有欄位皆缺少
  if (!entry) {
    return ['主題', '時間', '地點', '電子郵件'];
  }

  // 欄位名稱對應表：英文 key → 中文名稱
  const fieldLabels = {
    title: '主題',
    datetime: '時間',
    location: '地點',
    emails: '電子郵件',
  };

  const missing = [];
  for (const [key, label] of Object.entries(fieldLabels)) {
    if (!entry.meetingData[key]) {
      missing.push(label);
    }
  }

  return missing;
}
