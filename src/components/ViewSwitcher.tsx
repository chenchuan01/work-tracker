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

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  currentDate,
  onViewChange,
  onDateChange,
}) => {
  const handlePrev = () => {
    const d = dayjs(currentDate);
    let newDate: dayjs.Dayjs;

    switch (currentView) {
      case 'day':
        newDate = d.subtract(1, 'day');
        break;
      case 'week':
        newDate = d.subtract(1, 'week');
        break;
      case 'month':
        newDate = d.subtract(1, 'month');
        break;
    }

    onDateChange(newDate.format('YYYY-MM-DD'));
  };

  const handleNext = () => {
    const d = dayjs(currentDate);
    let newDate: dayjs.Dayjs;

    switch (currentView) {
      case 'day':
        newDate = d.add(1, 'day');
        break;
      case 'week':
        newDate = d.add(1, 'week');
        break;
      case 'month':
        newDate = d.add(1, 'month');
        break;
    }

    onDateChange(newDate.format('YYYY-MM-DD'));
  };

  const handleToday = () => {
    onDateChange(dayjs().format('YYYY-MM-DD'));
  };

  const views: { type: ViewType; label: string }[] = [
    { type: 'day', label: '日' },
    { type: 'week', label: '周' },
    { type: 'month', label: '月' },
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleToday}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          今天
        </button>
        <button
          onClick={handleNext}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <h2 className="ml-3 text-lg font-semibold text-gray-800">
          {formatDisplayDate(currentDate)}
        </h2>
      </div>
      <div className="flex bg-gray-100 rounded-lg p-1">
        {views.map((view) => (
          <button
            key={view.type}
            onClick={() => onViewChange(view.type)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              currentView === view.type
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
};
