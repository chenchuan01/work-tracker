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

  const recordsCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach(r => { map[r.workDate] = (map[r.workDate] || 0) + 1; });
    return map;
  }, [records]);

  const calendarDays = useMemo(() => {
    const startOfMonth  = current.startOf('month');
    const endOfMonth    = current.endOf('month');
    const startDayOfWeek = startOfMonth.day();
    const daysInMonth   = endOfMonth.date();
    const days: DayCell[] = [];
    const today = dayjs();

    const prevMonth = current.subtract(1, 'month');
    const daysInPrev = prevMonth.daysInMonth();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = prevMonth.date(daysInPrev - i);
      days.push({ date, isCurrentMonth: false, isToday: date.isSame(today, 'day'), recordCount: recordsCountByDate[date.format('YYYY-MM-DD')] || 0 });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = current.date(i);
      days.push({ date, isCurrentMonth: true, isToday: date.isSame(today, 'day'), recordCount: recordsCountByDate[date.format('YYYY-MM-DD')] || 0 });
    }
    const nextMonth = current.add(1, 'month');
    for (let i = 1; i <= 42 - days.length; i++) {
      const date = nextMonth.date(i);
      days.push({ date, isCurrentMonth: false, isToday: date.isSame(today, 'day'), recordCount: recordsCountByDate[date.format('YYYY-MM-DD')] || 0 });
    }
    return days;
  }, [current, recordsCountByDate]);

  // Heatmap intensity based on olive green
  const getCellStyle = (count: number, isCurrentMonth: boolean, isSelected: boolean, isToday: boolean) => {
    if (isSelected) return { background: 'var(--su7-black)', color: '#fff' };
    if (!isCurrentMonth) return { background: 'transparent', color: '#D1D1D6' };
    if (isToday) return { background: 'rgba(107,123,74,0.15)', color: 'var(--su7-olive)', fontWeight: 600 };
    if (count === 0) return { background: 'transparent', color: '#4A4A52' };
    const alpha = count <= 2 ? 0.18 : count <= 4 ? 0.32 : count <= 6 ? 0.52 : 0.75;
    return { background: `rgba(107,123,74,${alpha})`, color: count >= 5 ? '#fff' : '#2A3A1A', fontWeight: 500 };
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="card p-5 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">{current.format('YYYY 年 M 月')}</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => onDateSelect?.(current.subtract(1, 'month').format('YYYY-MM-DD'))} className="p-1.5 rounded-md btn-ghost">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => onDateSelect?.(dayjs().format('YYYY-MM-DD'))}
            className="px-2 py-0.5 rounded text-xs transition-colors"
            style={{ color: 'var(--su7-silver)' }}
          >
            今天
          </button>
          <button onClick={() => onDateSelect?.(current.add(1, 'month').format('YYYY-MM-DD'))} className="p-1.5 rounded-md btn-ghost">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium py-1" style={{ color: 'var(--su7-silver)' }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const dateStr   = day.date.format('YYYY-MM-DD');
          const isSelected = dateStr === currentDate;
          const cellStyle  = getCellStyle(day.recordCount, day.isCurrentMonth, isSelected, day.isToday);

          return (
            <button
              key={i}
              onClick={() => day.isCurrentMonth && onDateSelect?.(dateStr)}
              disabled={!day.isCurrentMonth}
              className="relative aspect-square rounded-lg text-xs transition-opacity flex flex-col items-center justify-center"
              style={{ ...cellStyle, cursor: day.isCurrentMonth ? 'pointer' : 'default' }}
            >
              {day.date.date()}
              {day.recordCount > 0 && day.isCurrentMonth && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: day.recordCount >= 5 ? 'rgba(255,255,255,0.7)' : 'var(--su7-olive)' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--su7-silver)' }}>记录量</span>
        {[0, 0.18, 0.35, 0.52, 0.75].map((a, i) => (
          <div key={i} className="w-4 h-4 rounded-sm" style={{ background: a === 0 ? '#EBEBEF' : `rgba(107,123,74,${a})` }} />
        ))}
        <span className="text-xs" style={{ color: 'var(--su7-silver)' }}>多</span>
      </div>
    </div>
  );
};
