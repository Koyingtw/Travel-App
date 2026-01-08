import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Trip, ItineraryItem } from '../types';

interface WeeklyTimelineProps {
  trip: Trip;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

const HOUR_HEIGHT = 60; // 每小時的像素高度
const DAY_WIDTH = 160; // 每天的寬度

export default function WeeklyTimeline({ trip, onNavigate }: WeeklyTimelineProps) {
  const [startHour] = useState(6);
  const [endHour] = useState(24);

  // 生成時間刻度
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(hour);
    }
    return slots;
  }, [startHour, endHour]);

  // 時間轉換輔助函數
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToPixels = (minutes: number): number => {
    return (minutes / 60) * HOUR_HEIGHT;
  };

  // 計算項目在時間軸上的位置
  const getItemPosition = (item: ItineraryItem) => {
    const startMinutes = timeToMinutes(item.time);
    const endMinutes = item.end_time ? timeToMinutes(item.end_time) : startMinutes + 60;
    
    const startOffset = startMinutes - startHour * 60;
    const top = minutesToPixels(startOffset);
    const height = minutesToPixels(endMinutes - startMinutes);

    return { top, height };
  };

  const totalHeight = (endHour - startHour) * HOUR_HEIGHT;

  // 獲取顏色類別
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      nature: 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-800 dark:text-green-300',
      museum: 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600 text-purple-800 dark:text-purple-300',
      restaurant: 'bg-orange-100 dark:bg-orange-900/30 border-orange-400 dark:border-orange-600 text-orange-800 dark:text-orange-300',
      hotel: 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-300',
      shopping: 'bg-pink-100 dark:bg-pink-900/30 border-pink-400 dark:border-pink-600 text-pink-800 dark:text-pink-300',
      entertainment: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-300',
      landmark: 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-800 dark:text-red-300',
      transportation: 'bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-300',
      other: 'bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-gray-800 dark:text-gray-300',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-maple-500 to-maple-600 dark:from-maple-600 dark:to-maple-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">完整行程時間表</h2>
            <p className="text-sm text-maple-100 dark:text-maple-200 mt-1">
              {trip.destination} · {trip.start_date} ~ {trip.end_date}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate?.('prev')}
              className="p-2 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => onNavigate?.('next')}
              className="p-2 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full">
          {/* Time Column */}
          <div className="w-20 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 sticky left-0 z-20">
            <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <Clock size={16} className="text-gray-400 dark:text-gray-500" />
            </div>
            {timeSlots.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-gray-100 dark:border-gray-800"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="absolute -top-2 left-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-1">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {trip.itinerary.map((day, dayIndex) => {
            const date = parseISO(day.date);
            
            return (
              <div
                key={day.date}
                className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700"
                style={{ width: `${DAY_WIDTH}px` }}
              >
                {/* Day Header */}
                <div className="h-14 border-b border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-900">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format(date, 'EEE', { locale: zhTW })}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {format(date, 'M/d')}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Day {dayIndex + 1}
                  </div>
                </div>

                {/* Time Grid */}
                <div className="relative bg-white dark:bg-gray-800">
                  {/* Background Grid */}
                  {timeSlots.map((hour) => (
                    <div
                      key={hour}
                      className="border-b border-gray-100 dark:border-gray-800"
                      style={{ height: `${HOUR_HEIGHT}px` }}
                    >
                      <div
                        className="border-b border-dashed border-gray-100 dark:border-gray-800"
                        style={{ height: `${HOUR_HEIGHT / 2}px` }}
                      />
                    </div>
                  ))}

                  {/* Items */}
                  <div className="absolute inset-0" style={{ height: `${totalHeight}px` }}>
                    {day.items.map((item) => {
                      const { top, height } = getItemPosition(item);
                      const colorClass = getCategoryColor(item.category);

                      return (
                        <div
                          key={item.id}
                          className={`absolute left-1 right-1 rounded border-l-4 ${colorClass} p-1.5 shadow-sm overflow-hidden ${
                            item.completed ? 'opacity-60' : ''
                          }`}
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(height, 40)}px`,
                          }}
                          title={`${item.place_name}\n${item.time}${item.end_time ? ` - ${item.end_time}` : ''}`}
                        >
                          <div className="text-xs font-medium truncate leading-tight">
                            {item.place_name}
                          </div>
                          {item.address && height > 50 && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-0.5 text-xs opacity-75 hover:opacity-100 hover:text-blue-600 dark:hover:text-blue-400 mt-0.5 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MapPin size={10} className="flex-shrink-0 mt-0.5" />
                              <span className="truncate leading-tight">{item.address}</span>
                            </a>
                          )}
                          <div className="text-xs opacity-75 mt-0.5">
                            {item.time}
                            {item.end_time && height > 35 && ` - ${item.end_time}`}
                          </div>
                          {item.completed && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border-l-4 border-green-400 dark:border-green-600"></div>
            <span className="text-gray-600 dark:text-gray-400">自然景觀</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-400 dark:border-purple-600"></div>
            <span className="text-gray-600 dark:text-gray-400">博物館</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-400 dark:border-orange-600"></div>
            <span className="text-gray-600 dark:text-gray-400">餐廳</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">住宿</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700 border-l-4 border-gray-400 dark:border-gray-600"></div>
            <span className="text-gray-600 dark:text-gray-400">交通/其他</span>
          </div>
        </div>
      </div>
    </div>
  );
}
