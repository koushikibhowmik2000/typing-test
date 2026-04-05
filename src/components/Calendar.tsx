import React, { useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, isBefore, startOfDay } from 'date-fns';

interface CalendarProps {
  practiceDates: Date[];
}

const PracticeCalendar: React.FC<CalendarProps> = ({ practiceDates }) => {
  const earliestDate = useMemo(() => {
    if (practiceDates.length === 0) return null;
    return new Date(Math.min(...practiceDates.map(d => d.getTime())));
  }, [practiceDates]);

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isPracticed = practiceDates.some(d => format(d, 'yyyy-MM-dd') === dateStr);
      
      if (isPracticed) {
        return '!bg-green-500 !text-white !rounded-full font-bold';
      }

      const today = startOfDay(new Date());
      const tileDate = startOfDay(date);
      
      if (earliestDate && !isBefore(tileDate, startOfDay(earliestDate)) && isBefore(tileDate, today)) {
        return '!bg-red-500 !text-white !rounded-full font-bold opacity-70';
      }
    }
    return null;
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-white">Practice History</h3>
      <div className="flex justify-center gap-4 mb-6 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Practiced</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 opacity-70"></div> Skipped</div>
      </div>
      <style>{`
        .react-calendar { border: none !important; background: transparent !important; font-family: inherit !important; width: 100% !important; }
        .react-calendar__navigation button { color: inherit !important; font-weight: bold; font-size: 1.1rem; }
        .react-calendar__month-view__days__day--weekend { color: inherit !important; }
        .react-calendar__tile { padding: 0.75em 0.5em !important; }
        .react-calendar__tile--now { background: transparent !important; border: 2px solid #3b82f6 !important; border-radius: 9999px; }
        .react-calendar__tile--active { background: transparent !important; color: inherit !important; }
        .dark .react-calendar__month-view__days__day--neighboringMonth { color: #4b5563 !important; }
      `}</style>
      <Calendar 
        tileClassName={tileClassName}
        className="dark:text-white"
      />
    </div>
  );
};

export default PracticeCalendar;
