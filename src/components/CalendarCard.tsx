import { useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { WorkRecord } from '../types';

interface CalendarCardProps {
  records: WorkRecord[];
  currentDate: string;
  onDateSelect?: (date: string) => void;
}

interface DayCell {
  date: Dayjs;
  isCurrentMonth: boolean;
  isToday: boolean;
  recordCount: number;
}

export const CalendarCard = ({ records, currentDate, onDateSelect }: CalendarCardProps) => {
  const current = dayjs(currentDate);

  // 计算每日记录数量
  const recordsCountByDate = useMemo(() => {
    const countMap: Record<string, number> = {};
    records.forEach(record => {
      const date = record.workDate;
      countMap[date] = (countMap[date] || 0) + 1;
    });
    return countMap;
  }, [records]);

  // 生成日历网格
  const calendarDays = useMemo(() => {
    const startOfMonth = current.startOf('month');
    const endOfMonth = current.endOf('month');
    
    // 获取当月第一天是周几，以及需要显示的上月天数
    const startDayOfWeek = startOfMonth.day(); // 0 是周日
    const daysInMonth = endOfMonth.date();
    
    const days: DayCell[] = [];
    const today = dayjs();
    
    // 添加上月的日期
    const prevMonth = current.subtract(1, 'month');
    const daysInPrevMonth = prevMonth.daysInMonth();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = prevMonth.date(daysInPrevMonth - i);
      days.push({
        date: date,
        isCurrentMonth: false,
        isToday: date.isSame(today, 'day'),
        recordCount: recordsCountByDate[date.format('YYYY-MM-DD')] || 0,
      });
    }
    
    // 添加当月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = current.date(i);
      days.push({
        date: date,
        isCurrentMonth: true,
        isToday: date.isSame(today, 'day'),
        recordCount: recordsCountByDate[date.format('YYYY-MM-DD')] || 0,
      });
    }
    
    // 添加下月的日期（补齐 6 行）
    const remainingDays = 42 - days.length; // 6 行 x 7 天 = 42 天
    const nextMonth = current.add(1, 'month');
    for (let i = 1; i <= remainingDays; i++) {
      const date = nextMonth.date(i);
      days.push({
        date: date,
        isCurrentMonth: false,
        isToday: date.isSame(today, 'day'),
        recordCount: recordsCountByDate[date.format('YYYY-MM-DD')] || 0,
      });
    }
    
    return days;
  }, [current, recordsCountByDate]);

  // 根据记录数量获取背景颜色
  const getBackgroundColor = (count: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return 'bg-gray-50';
    if (count === 0) return 'bg-white';
    if (count <= 2) return 'bg-blue-100';
    if (count <= 4) return 'bg-blue-200';
    if (count <= 6) return 'bg-blue-300';
    return 'bg-blue-400';
  };

  // 根据记录数量获取文字颜色
  const getTextColor = (count: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return 'text-gray-400';
    if (count === 0) return 'text-gray-700';
    if (count <= 4) return 'text-gray-800';
    return 'text-white';
  };

  const handlePrevMonth = () => {
    if (onDateSelect) {
      onDateSelect(current.subtract(1, 'month').format('YYYY-MM-DD'));
    }
  };

  const handleNextMonth = () => {
    if (onDateSelect) {
      onDateSelect(current.add(1, 'month').format('YYYY-MM-DD'));
    }
  };

  const handleToday = () => {
    if (onDateSelect) {
      onDateSelect(dayjs().format('YYYY-MM-DD'));
    }
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* 日历头部 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {current.format('YYYY 年 M 月')}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="上月"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleToday}
            className="px-2 py-1 text-sm hover:bg-gray-100 rounded transition-colors"
          >
            今天
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="下月"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-medium py-1 ${
              index === 0 || index === 6 ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, index) => {
          const dateStr = cell.date.format('YYYY-MM-DD');
          const isSelected = dateStr === currentDate;
          
          return (
            <button
              key={index}
              onClick={() => onDateSelect?.(dateStr)}
              className={`
                relative p-2 rounded-lg transition-all min-h-[50px] flex flex-col items-center justify-start
                ${getBackgroundColor(cell.recordCount, cell.isCurrentMonth)}
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                hover:opacity-80
              `}
            >
              <span className={`text-sm font-medium ${getTextColor(cell.recordCount, cell.isCurrentMonth)}`}>
                {cell.date.date()}
              </span>
              {cell.recordCount > 0 && (
                <span className={`text-xs mt-1 ${getTextColor(cell.recordCount, cell.isCurrentMonth)}`}>
                  {cell.recordCount}条
                </span>
              )}
              {cell.isToday && (
                <div className="absolute bottom-1 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
            <span>无记录</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-100 rounded"></div>
            <span>1-2 条</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-200 rounded"></div>
            <span>3-4 条</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-300 rounded"></div>
            <span>5-6 条</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span>7 条+</span>
          </div>
        </div>
      </div>
    </div>
  );
};
