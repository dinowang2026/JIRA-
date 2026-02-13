
import { parse, isValid, isBefore, addDays, differenceInDays } from 'date-fns';

export const parseCSVDate = (dateStr: string): Date | null => {
  if (!dateStr || dateStr === 'null' || dateStr.trim() === '') return null;
  
  // 清理常見的中文時間後綴
  const cleaned = dateStr
    .replace(' 上午', ' AM')
    .replace(' 下午', ' PM')
    .replace('上午', ' AM')
    .replace('下午', ' PM')
    .trim();

  // 嘗試多種解析方式
  let date = new Date(cleaned);
  
  // 如果原生 Date 解析失敗，嘗試處理 YYYY/MM/DD HH:mm:ss 格式
  if (!isValid(date)) {
    const parts = cleaned.split(/[\/\-\s:]/);
    if (parts.length >= 3) {
      date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }

  return isValid(date) ? date : null;
};

export const extractReviewDate = (statusUpdate: string): Date | null => {
  if (!statusUpdate) return null;
  // 支援 <review 2024/01/01> 或 <review 2024-01-01> 等格式
  const match = statusUpdate.match(/<review\s+([\d\/\-]+)/i);
  if (match && match[1]) {
    const d = new Date(match[1].replace(/-/g, '/'));
    return isValid(d) ? d : null;
  }
  return null;
};

export const getProjectFromSummary = (summary: string): string => {
  if (!summary) return 'Other';
  const match = summary.match(/^([A-Z0-9-]+)\s/i);
  return match ? match[1] : 'General';
};

export const isTaskStale = (lastUpdated: Date, days: number = 3): boolean => {
  return differenceInDays(new Date(), lastUpdated) >= days;
};

export const isTaskOverdue = (reviewDate: Date | null): boolean => {
  if (!reviewDate) return false;
  return isBefore(reviewDate, new Date());
};

export const isTaskUpcoming = (reviewDate: Date | null, withinDays: number = 3): boolean => {
  if (!reviewDate) return false;
  const today = new Date();
  const threshold = addDays(today, withinDays);
  return isBefore(reviewDate, threshold) && !isBefore(reviewDate, today);
};

// 幫助匹配 CSV 標頭的工具
export const findColumnIndex = (headers: string[], keywords: string[]): number => {
  return headers.findIndex(h => 
    keywords.some(k => h.toLowerCase().includes(k.toLowerCase()))
  );
};
