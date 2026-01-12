// lib/utils/csvParser.ts

/**
 * 將原始 CSV 文字轉換為物件陣列
 * 確保匯出 parseCSV 以供教師端 page.tsx 使用
 */
export const parseCSV = (text: string): any[] => {
  const lines = text.split('\n');
  if (lines.length === 0) return [];

  // 取得表頭並清理空格與引號
  const headers = lines[0].split(',').map(header => 
    header.trim().replace(/^"|"$/g, '')
  );

  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const currentLine = line.split(',');
    const obj: any = {};

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentLine[j]?.trim().replace(/^"|"$/g, '') || '';
    }
    result.push(obj);
  }
  return result;
};

/**
 * 處理從 CSV 得到的原始行資料，轉換為以學號為 Key 的 Map
 */
export const processStudentData = (rows: any[]): Map<string, { totalPoints: number; history: any[] }> => {
  const studentMap = new Map<string, { totalPoints: number; history: any[] }>();

  rows.forEach((row) => {
    // 1. 取得 CSV 中的學號 (ID 欄位)
    const rawId = row['ID'] || '';
    // 處理數字格式 (如 113360246.0)，只取整數部分
    const cleanNumberId = String(rawId).split('.')[0].trim();
    
    if (!cleanNumberId) return;

    // 2. 核心修正：加上 't' 前綴以符合您的 Firestore 資料格式
    const studentId = cleanNumberId.startsWith('t') ? cleanNumberId : `t${cleanNumberId}`;

    // 3. 取得總分
    const totalPoints = parseFloat(row['Total learning-progress points']) || 0;

    // 4. 提取日期歷史數據 (用於學生端的折線圖趨勢)
    const history: any[] = [];
    Object.keys(row).forEach(key => {
      // 找尋表頭帶有斜線且內容是數字的欄位 (例如 9/24, 10/8, 12/17)
      if (key.includes('/') && !isNaN(parseFloat(row[key]))) {
        history.push({
          date: key,
          points: parseFloat(row[key]) || 0
        });
      }
    });

    // 依日期排序，確保折線圖顯示正確趨勢
    const sortedHistory = history.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    studentMap.set(studentId, {
      totalPoints: totalPoints,
      history: sortedHistory
    });
  });

  return studentMap;
};