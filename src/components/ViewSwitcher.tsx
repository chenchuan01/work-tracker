import React from 'react';
import { ViewType } from '../types';
import { formatDisplayDate } from '../utils/date';
import dayjs from 'dayjs';

interface ViewSwitcherProps {
  currentView: ViewType;
  currentDate: string;
  onViewChange: (view: ViewType) => void;
  onDateChange: (date: string) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, currentDate, onViewChange, onDateChange }) => {
  const handlePrev = () => {
    const d = dayjs(currentDate);
    const unit = currentView === 'day' ? 'day' : currentView === 'week' ? 'week' : 'month';
    onDateChange(d.subtract(1, unit).format('YYYY-MM-DD'));
  };
  const handleNext = () => {
    const d = dayjs(currentDate);
    const unit = currentView === 'day' ? 'day' : currentView === 'week' ? 'week' : 'month';
    onDateChange(d.add(1, unit).format('YYYY-MM-DD'));
  };
  const handleToday = () => onDateChange(dayjs().format('YYYY-MM-DD'));

  const NavBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className="p-1.5 rounded-md btn-ghost">
      {children}
    </button>
  );

  const views: { type: ViewType; label: string }[] = [
    { type: 'day', label: '日' },
    { type: 'week', label: '周' },
    { type: 'month', label: '月' },
  ];

  return (
    <div className="card px-5 py-3 mb-4 flex items-center justify-between animate-in">
      <div className="flex items-center gap-1.5">
        <NavBtn onClick={handlePrev}>
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </NavBtn>
        <button onClick={handleToday} className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors" style={{ color: 'var(--su7-sky)', background: 'rgba(74,143,168,0.1)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,143,168,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,143,168,0.1)'; }}
        >
          今天
        </button>
        <NavBtn onClick={handleNext}>
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </NavBtn>
        <span className="ml-2 text-sm font-semibold text-gray-800">{formatDisplayDate(currentDate)}</span>
      </div>

      <div className="flex rounded-lg overflow-hidden border text-xs font-medium" style={{ borderColor: 'var(--border)' }}>
        {views.map(v => (
          <button
            key={v.type}
            onClick={() => onViewChange(v.type)}
            className="px-3 py-1.5 transition-colors"
            style={currentView === v.type
              ? { background: 'var(--su7-black)', color: '#fff' }
              : { background: '#fff', color: '#6B6B76' }}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
};
