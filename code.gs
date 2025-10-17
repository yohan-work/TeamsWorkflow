// === 설정 ===
const SHEET_NAME = "Menu";
const TIMEZONE = "Asia/Seoul";
const SLACK_WEBHOOK_URL = "";
const TEAMS_WEBHOOK_URL = "";

// 주말 판단(KST) — ISO 요일: 월=1 … 일=7
function isWeekendKST() {
  const isoDow = Number(Utilities.formatDate(new Date(), TIMEZONE, "u"));
  return isoDow === 6 || isoDow === 7; // 토=6, 일=7
}

// === 메인 함수 ===
function postTodayMenu() {
  if (isWeekendKST()) return;

  const today = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");

  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  // getValues() 대신 getDisplayValues() 사용
  const data = sheet.getDataRange().getDisplayValues();
  const header = data[0];
  const dateIdx = header.indexOf("date");
  const cornerIdx = header.indexOf("corner");
  const dishesIdx = header.indexOf("dishes");

  if (dateIdx < 0 || cornerIdx < 0 || dishesIdx < 0) {
    throw new Error('⚠️ 시트에 "date", "corner", "dishes" 헤더가 필요합니다.');
  }

  // 오늘 날짜만 필터 (공백/널 문자 제거)
  const todayRows = data.slice(1).filter((row) => {
    const d = (row[dateIdx] || "")
      .toString()
      .trim()
      .replace(/\u00A0/g, "");
    return d === today;
  });

  let text = `🍱 *${today} 점심메뉴*\n\n`;

  if (todayRows.length === 0) {
    text += "_오늘은 등록된 메뉴가 없습니다._";
  } else {
    todayRows.forEach((row) => {
      const corner = (row[cornerIdx] || "").toString().trim();
      const dishes = (row[dishesIdx] || "").toString().trim();
      text += `• *${corner}*\n  - ${dishes}\n\n`;
    });
  }

  if (SLACK_WEBHOOK_URL) {
    UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
      method: "post",
      contentType: "application/json; charset=utf-8",
      payload: JSON.stringify({ text }),
    });
  }

  if (TEAMS_WEBHOOK_URL) {
    UrlFetchApp.fetch(TEAMS_WEBHOOK_URL, {
      method: "post",
      contentType: "application/json; charset=utf-8",
      payload: JSON.stringify({ text }),
    });
  }
}
