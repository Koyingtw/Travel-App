import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Clock, GripVertical, Trash2, MapPin, Hotel } from 'lucide-react';
import type { ItineraryItem } from '../types';
import RouteInfo from './RouteInfo';

interface TimelineScheduleProps {
  items: ItineraryItem[];
  onUpdateItem: (itemId: string, updates: Partial<ItineraryItem>) => void;
  onRemoveItem: (itemId: string, isCustom?: boolean) => void;
  onToggleComplete: (itemId: string) => void;
  accommodation?: ItineraryItem;
  startHour?: number; // 開始時間（小時），預設 6
  endHour?: number;   // 結束時間（小時），預設 24
}

interface DragState {
  itemId: string;
  type: 'move' | 'resize-top' | 'resize-bottom';
  startY: number;
  originalStartTime: string;
  originalEndTime: string;
}

const HOUR_HEIGHT = 80; // 每小時的像素高度
const MINUTE_HEIGHT = HOUR_HEIGHT / 60; // 每分鐘的像素高度

export default function TimelineSchedule({
  items,
  onUpdateItem,
  onRemoveItem,
  onToggleComplete,
  accommodation,
  startHour = 6,
  endHour = 24,
}: TimelineScheduleProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [tempPosition, setTempPosition] = useState<{ itemId: string; time: string; endTime: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 時間轉換輔助函數
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const pixelsToMinutes = (pixels: number): number => {
    return Math.round(pixels / MINUTE_HEIGHT);
  };

  const minutesToPixels = (minutes: number): number => {
    return minutes * MINUTE_HEIGHT;
  };

  // 計算項目在時間軸上的位置
  const getItemPosition = (item: ItineraryItem) => {
    // 如果正在拖曳此項目，使用臨時位置
    const isBeingDragged = tempPosition?.itemId === item.id;
    const startTime = isBeingDragged ? tempPosition.time : item.time;
    const endTime = isBeingDragged ? tempPosition.endTime : item.end_time;
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = endTime ? timeToMinutes(endTime) : startMinutes + 60;
    
    const startOffset = startMinutes - startHour * 60;
    const top = minutesToPixels(startOffset);
    const height = minutesToPixels(endMinutes - startMinutes);

    return { top, height, startMinutes, endMinutes, startTime, endTime };
  };

  // 開始拖曳
  const handleMouseDown = (
    e: React.MouseEvent,
    itemId: string,
    type: 'move' | 'resize-top' | 'resize-bottom'
  ) => {
    e.preventDefault();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setDragState({
      itemId,
      type,
      startY: e.clientY,
      originalStartTime: item.time,
      originalEndTime: item.end_time || item.time,
    });
  };

  // 拖曳中
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState || !containerRef.current) return;

      const deltaY = e.clientY - dragState.startY;
      const deltaMinutes = pixelsToMinutes(deltaY);

      const originalStartMinutes = timeToMinutes(dragState.originalStartTime);
      const originalEndMinutes = timeToMinutes(dragState.originalEndTime);
      const duration = originalEndMinutes - originalStartMinutes;

      let newStartMinutes = originalStartMinutes;
      let newEndMinutes = originalEndMinutes;

      if (dragState.type === 'move') {
        // 移動整個項目
        newStartMinutes = originalStartMinutes + deltaMinutes;
        newEndMinutes = newStartMinutes + duration;
      } else if (dragState.type === 'resize-top') {
        // 調整開始時間
        newStartMinutes = Math.min(
          originalStartMinutes + deltaMinutes,
          originalEndMinutes - 15 // 最少 15 分鐘
        );
      } else if (dragState.type === 'resize-bottom') {
        // 調整結束時間
        newEndMinutes = Math.max(
          originalEndMinutes + deltaMinutes,
          originalStartMinutes + 15 // 最少 15 分鐘
        );
      }

      // 限制在時間範圍內
      const minMinutes = startHour * 60;
      const maxMinutes = endHour * 60;
      
      if (newStartMinutes < minMinutes) {
        const offset = minMinutes - newStartMinutes;
        newStartMinutes = minMinutes;
        if (dragState.type === 'move') {
          newEndMinutes += offset;
        }
      }
      
      if (newEndMinutes > maxMinutes) {
        const offset = newEndMinutes - maxMinutes;
        newEndMinutes = maxMinutes;
        if (dragState.type === 'move') {
          newStartMinutes -= offset;
        }
      }

      // 四捨五入到最近的 5 分鐘
      newStartMinutes = Math.round(newStartMinutes / 5) * 5;
      newEndMinutes = Math.round(newEndMinutes / 5) * 5;

      // 只更新臨時狀態，不調用 onUpdateItem
      setTempPosition({
        itemId: dragState.itemId,
        time: minutesToTime(newStartMinutes),
        endTime: minutesToTime(newEndMinutes),
      });
    },
    [dragState, startHour, endHour]
  );

  // 結束拖曳
  const handleMouseUp = useCallback(() => {
    if (tempPosition) {
      onUpdateItem(tempPosition.itemId, {
        time: tempPosition.time,
        end_time: tempPosition.endTime,
      });
    }
    setDragState(null);
    setTempPosition(null);
  }, [tempPosition, onUpdateItem]);

  // 註冊全局事件監聽
  useEffect(() => {
    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  // 生成時間刻度
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(hour);
    }
    return slots;
  }, [startHour, endHour]);

  // 計算總高度
  const totalHeight = (endHour - startHour) * HOUR_HEIGHT;

  // 按時間排序的項目列表（用於顯示路線資訊），排除住宿
  const sortedItems = useMemo(() => {
    return [...items]
      .filter(item => !item.is_custom && !item.id.startsWith('accommodation-')) // 排除自訂活動和住宿
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [items]);

  // 分離住宿和一般項目
  const { regularItems, accommodationItem } = useMemo(() => {
    const regular = items.filter(item => !item.id.startsWith('accommodation-'));
    const accom = items.find(item => item.id.startsWith('accommodation-')) || accommodation;
    return { regularItems: regular, accommodationItem: accom };
  }, [items, accommodation]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* 時間軸主要區域（時間標籤 + 行程） */}
        <div className="flex flex-1 min-w-0">
          {/* 時間標籤列 */}
          <div className="w-16 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 p-2 border-b border-gray-200 dark:border-gray-700">
              <Clock size={16} className="text-gray-400 dark:text-gray-500 mx-auto" />
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

          {/* 時間軸區域 */}
          <div className="flex-1 relative min-w-0 overflow-x-auto" ref={containerRef}>
          {/* 背景網格 */}
          <div className="absolute inset-0">
            {timeSlots.map((hour) => (
              <div
                key={hour}
                className="border-b border-gray-100 dark:border-gray-800"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                {/* 半小時分隔線 */}
                <div
                  className="border-b border-dashed border-gray-100 dark:border-gray-700"
                  style={{ height: `${HOUR_HEIGHT / 2}px` }}
                />
              </div>
            ))}
          </div>

          {/* 行程項目 */}
          <div className="relative" style={{ height: `${totalHeight}px` }}>
            {regularItems.map((item) => {
              const { top, height, startTime, endTime } = getItemPosition(item);
              const isDragging = dragState?.itemId === item.id;

              return (
                <div
                  key={item.id}
                  className={`absolute left-1 right-1 sm:left-2 sm:right-2 rounded-lg shadow-sm border-2 overflow-hidden transition-shadow ${
                    item.is_custom
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600'
                      : item.completed
                      ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600'
                  } ${isDragging ? 'shadow-lg ring-2 ring-blue-500 dark:ring-blue-400 z-50' : 'hover:shadow-md z-10'}`}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    minHeight: '60px',
                  }}
                >
                  {/* 上邊緣調整手柄 */}
                  <div
                    className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-400/30 flex items-center justify-center"
                    onMouseDown={(e) => handleMouseDown(e, item.id, 'resize-top')}
                  >
                    <div className="w-8 h-1 bg-blue-400 rounded-full opacity-0 hover:opacity-100" />
                  </div>

                  {/* 內容區域 */}
                  <div
                    className="px-2 py-2 h-full cursor-move flex flex-col"
                    onMouseDown={(e) => handleMouseDown(e, item.id, 'move')}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                        <GripVertical size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <h4 className={`font-medium text-sm truncate ${
                          item.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {item.place_name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {!item.is_custom && (
                          <button
                            onClick={() => onToggleComplete(item.id)}
                            className="p-1 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition-colors"
                            title={item.completed ? '標記為未完成' : '標記為已完成'}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              item.completed
                                ? 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600'
                                : 'border-gray-400 dark:border-gray-500'
                            }`}>
                              {item.completed && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveItem(item.id, item.is_custom)}
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition-colors"
                          title={item.is_custom ? '刪除活動' : '移回候選景點'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {item.address && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <MapPin size={10} />
                        <span className="truncate">{item.address}</span>
                      </div>
                    )}

                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-auto">
                      <span className="font-medium">
                        {startTime}
                      </span>
                      {endTime && (
                        <>
                          <span className="mx-1">-</span>
                          <span className="font-medium">{endTime}</span>
                        </>
                      )}
                      {endTime && (
                        <span className="ml-2 text-gray-400 dark:text-gray-500">
                          ({Math.round((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60 * 10) / 10}h)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 下邊緣調整手柄 */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-400/30 dark:hover:bg-blue-600/30 flex items-center justify-center"
                    onMouseDown={(e) => handleMouseDown(e, item.id, 'resize-bottom')}
                  >
                    <div className="w-8 h-1 bg-blue-400 dark:bg-blue-600 rounded-full opacity-0 hover:opacity-100" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 住宿顯示在底部 */}
          {accommodationItem && (
            <div className="mt-4 mx-2 mb-2">
              <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 pt-4">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-2 border-indigo-300 dark:border-indigo-600 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="px-3 py-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Hotel size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {accommodationItem.place_name}
                          </h4>
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                            住宿
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveItem(accommodationItem.id, true)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition-colors"
                        title="移除住宿"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {accommodationItem.address && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <MapPin size={10} />
                        <span className="truncate">{accommodationItem.address}</span>
                      </div>
                    )}

                    {accommodationItem.notes && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {accommodationItem.notes}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs">
                      <Clock size={12} className="text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {accommodationItem.time}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500">入住</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
        
        {/* 右側邊欄 - 路線資訊 */}
        <div className="w-full lg:w-64 flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 overflow-y-auto overflow-x-hidden lg:max-h-screen">
          <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 p-2 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MapPin size={14} />
              路線資訊
            </h4>
          </div>
          <div className="p-2 space-y-3">
            {sortedItems.map((item, index) => {
              const nextItem = index < sortedItems.length - 1 ? sortedItems[index + 1] : null;
              const showRouteInfo = nextItem && item.coordinates && nextItem.coordinates;
              
              if (!showRouteInfo) return null;
              
              return (
                <div key={`route-${item.id}`} className="space-y-2 min-w-0">
                  <div className="text-xs text-gray-600 dark:text-gray-400 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.place_name}</div>
                    <div className="flex items-center gap-1 mt-0.5 min-w-0">
                      <span className="flex-shrink-0">↓</span>
                      <span className="truncate">{nextItem.place_name}</span>
                    </div>
                  </div>
                  <RouteInfo
                    from={{
                      name: item.place_name,
                      coordinates: item.coordinates,
                    }}
                    to={{
                      name: nextItem.place_name,
                      coordinates: nextItem.coordinates,
                    }}
                  />
                </div>
              );
            })}

            {/* 最後一個景點到住宿的路線 */}
            {sortedItems.length > 0 && accommodationItem && sortedItems[sortedItems.length - 1].coordinates && accommodationItem.coordinates && (
              <div className="space-y-2 pt-3 border-t-2 border-dashed border-gray-300 dark:border-gray-600 min-w-0">
                <div className="text-xs text-gray-600 dark:text-gray-400 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {sortedItems[sortedItems.length - 1].place_name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 min-w-0">
                    <span className="flex-shrink-0">↓</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <Hotel size={10} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      <span className="text-indigo-600 dark:text-indigo-400 truncate">{accommodationItem.place_name}</span>
                    </div>
                  </div>
                </div>
                <RouteInfo
                  from={{
                    name: sortedItems[sortedItems.length - 1].place_name,
                    coordinates: sortedItems[sortedItems.length - 1].coordinates,
                  }}
                  to={{
                    name: accommodationItem.place_name,
                    coordinates: accommodationItem.coordinates,
                  }}
                />
              </div>
            )}

            {/* 無住宿時的住宿資訊顯示 */}
            {sortedItems.length > 0 && accommodationItem && (!sortedItems[sortedItems.length - 1].coordinates || !accommodationItem.coordinates) && (
              <div className="pt-3 border-t-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg p-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Hotel size={12} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {accommodationItem.place_name}
                      </div>
                      <div className="text-indigo-600 dark:text-indigo-400 mt-0.5">
                        住宿
                      </div>
                    </div>
                  </div>
                  {accommodationItem.address && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mt-1 ml-5">
                      <MapPin size={8} />
                      <span className="truncate text-[10px]">{accommodationItem.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {sortedItems.filter((item, index) => {
              const nextItem = index < sortedItems.length - 1 ? sortedItems[index + 1] : null;
              return nextItem && item.coordinates && nextItem.coordinates;
            }).length === 0 && !accommodationItem && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-600 text-sm">
                <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                <p>無路線資訊</p>
                <p className="text-xs mt-1">需要至少兩個有座標的景點</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
