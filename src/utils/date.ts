import dayjs, { Dayjs } from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import 'dayjs/locale/zh-cn';

dayjs.extend(weekOfYear);
dayjs.locale('zh-cn');

export const formatDate = (date: Dayjs | Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatDateTime = (timestamp: number): string => {
  return dayjs(timestamp).format('HH:mm');
};

export const formatDisplayDate = (date: Dayjs | string): string => {
  return dayjs(date).format('YYYY 年 M 月 D 日 dddd');
};

export const getWeekRange = (date: Dayjs | string): { start: string; end: string } => {
  const d = dayjs(date);
  const start = d.startOf('week').format('YYYY-MM-DD');
  const end = d.endOf('week').format('YYYY-MM-DD');
  return { start, end };
};

export const getMonthRange = (date: Dayjs | string): { start: string; end: string } => {
  const d = dayjs(date);
  const start = d.startOf('month').format('YYYY-MM-DD');
  const end = d.endOf('month').format('YYYY-MM-DD');
  return { start, end };
};

export const getDateRange = (viewType: 'day' | 'week' | 'month', date: Dayjs | string): { start: string; end: string } => {
  const d = dayjs(date);
  
  switch (viewType) {
    case 'day':
      return { start: d.format('YYYY-MM-DD'), end: d.format('YYYY-MM-DD') };
    case 'week':
      return getWeekRange(d);
    case 'month':
      return getMonthRange(d);
    default:
      return { start: d.format('YYYY-MM-DD'), end: d.format('YYYY-MM-DD') };
  }
};

export const isToday = (date: string): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};

export const generateId = (): string => {
  return `wt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
