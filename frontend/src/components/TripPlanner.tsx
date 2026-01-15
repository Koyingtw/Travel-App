import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { format, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { 
  Plus, 
  Route, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Loader2,
  Upload,
  ArrowDownUp,
  Clock,
  PlusCircle,
  Hotel
} from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { BacklogPlaceCard } from './PlaceCards';
import TimelineSchedule from './TimelineSchedule';
import type { BacklogPlace } from '../types';

// Lazy load modals - they're only needed when opened
const AddPlaceModal = lazy(() => import('./AddPlaceModal'));
const ImportGoogleMapsModal = lazy(() => import('./ImportGoogleMapsModal'));
const AddCustomActivityModal = lazy(() => import('./AddCustomActivityModal'));
const AccommodationModal = lazy(() => import('./AccommodationModal'));

interface TripPlannerProps {
  isReadOnly?: boolean;
}

export default function TripPlanner({ isReadOnly = false }: TripPlannerProps) {
  const {
    currentTrip,
    selectedDate,
    setSelectedDate,
    addBacklogPlace,
    addBacklogPlaces,
    removeBacklogPlace,
    moveToItinerary,
    removeItineraryItem,
    updateItineraryItem,
    optimizeRoute,
    addCustomActivity,
    setDayAccommodation,
  } = useTripStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCustomActivityModalOpen, setIsCustomActivityModalOpen] = useState(false);
  const [isAccommodationModalOpen, setIsAccommodationModalOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'time'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // desc = 最新在前, asc = 最舊在前

  // Get current day's itinerary
  const currentDayItinerary = useMemo(() => {
    if (!currentTrip || !selectedDate) return null;
    return currentTrip.itinerary.find((day) => day.date === selectedDate);
  }, [currentTrip, selectedDate]);

  // 動態計算時間軸開始時間：基於當天第一個行程
  const scheduleStartHour = useMemo(() => {
    if (!currentDayItinerary || currentDayItinerary.items.length === 0) return 6;
    
    // 找出所有非住宿項目
    const regularItems = currentDayItinerary.items.filter(
      item => !item.id.startsWith('accommodation-')
    );
    
    if (regularItems.length === 0) return 6;
    
    // 找出最早的開始時間
    const earliestTime = regularItems.reduce((earliest, item) => {
      const [hours] = item.time.split(':').map(Number);
      return Math.min(earliest, hours);
    }, 24);
    
    // 往前推 1 小時作為緩衝，但最早不早於 6 點
    return Math.max(6, earliestTime - 1);
  }, [currentDayItinerary]);

  // Get current accommodation from items array
  const currentAccommodation = useMemo(() => {
    if (!currentDayItinerary) return null;
    const accommodationItem = currentDayItinerary.items.find(item => 
      item.id.startsWith('accommodation-')
    );
    return accommodationItem || currentDayItinerary.accommodation || null;
  }, [currentDayItinerary]);

  // Get sorted backlog places
  const sortedBacklogPlaces = useMemo(() => {
    if (!currentTrip) return [];
    const places = [...currentTrip.backlog_places];
    return places.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'zh-TW');
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else { // sortBy === 'time'
        // Treat null/undefined created_at as very old (sort to end when desc, start when asc)
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        comparison = timeA - timeB; // A - B means ascending (oldest first)
      }
      
      // Apply sort direction (desc reverses the comparison)
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [currentTrip, sortBy, sortDirection]);

  const handleAddToItinerary = useCallback((place: BacklogPlace) => {
    if (!selectedDate) return;
    
    // Find next available time slot to avoid overlapping
    let time = '09:00';
    if (currentDayItinerary && currentDayItinerary.items.length > 0) {
      // Sort items by time
      const sortedItems = [...currentDayItinerary.items].sort((a, b) => a.time.localeCompare(b.time));
      const lastItem = sortedItems[sortedItems.length - 1];
      
      // Use end_time of last item as start time for new item
      if (lastItem.end_time) {
        time = lastItem.end_time;
      } else {
        // If no end_time, calculate based on start time + duration
        const [hours, minutes] = lastItem.time.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + lastItem.duration;
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        time = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
      }
    }
    moveToItinerary(place, selectedDate, time);
  }, [selectedDate, currentDayItinerary, moveToItinerary]);

  const handleOptimizeRoute = async () => {
    if (!selectedDate) return;
    setIsOptimizing(true);
    await optimizeRoute(selectedDate);
    setIsOptimizing(false);
  };

  const handleAddCustomActivity = useCallback(async (activity: {
    place_name: string;
    time: string;
    end_time: string;
    category: any;
    notes?: string;
  }) => {
    if (!selectedDate || !currentTrip) return;

    await addCustomActivity(selectedDate, {
      place_name: activity.place_name,
      time: activity.time,
      end_time: activity.end_time,
      category: activity.category,
      notes: activity.notes,
      is_custom: true,
      duration: 60,
      completed: false,
    });
    
    setIsCustomActivityModalOpen(false);
  }, [selectedDate, currentTrip, addCustomActivity]);

  const handleSetAccommodation = useCallback(async (accommodation: {
    place_name: string;
    address?: string;
    coordinates?: any;
    notes?: string;
    time: string;
  }) => {
    if (!selectedDate) return;
    
    await setDayAccommodation(selectedDate, {
      place_name: accommodation.place_name,
      address: accommodation.address,
      coordinates: accommodation.coordinates,
      notes: accommodation.notes,
      time: accommodation.time,
      end_time: '23:59', // 住宿結束時間設為當日最後
      category: 'hotel',
      duration: 600, // 10小時（僅供顯示）
      completed: false,
      is_custom: true,
    });
    
    setIsAccommodationModalOpen(false);
  }, [selectedDate, setDayAccommodation]);

  const handleDateChange = (direction: 'prev' | 'next') => {
    if (!currentTrip || !selectedDate) return;
    
    const currentIndex = currentTrip.itinerary.findIndex((d) => d.date === selectedDate);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < currentTrip.itinerary.length) {
      setSelectedDate(currentTrip.itinerary[newIndex].date);
    }
  };

  if (!currentTrip) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-maple-500" size={32} />
      </div>
    );
  }

  const currentDateIndex = currentTrip.itinerary.findIndex((d) => d.date === selectedDate);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Backlog Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  候選景點
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({currentTrip.backlog_places.length})
                  </span>
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => !isReadOnly && currentTrip && setIsImportModalOpen(true)}
                    className={`p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition-colors ${
                      isReadOnly || !currentTrip ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title={isReadOnly ? '唯讀模式' : !currentTrip ? '載入中...' : '匯入 Google Maps 清單'}
                    disabled={isReadOnly || !currentTrip}
                  >
                    <Upload size={18} />
                  </button>
                  <button
                    onClick={() => !isReadOnly && currentTrip && setIsAddModalOpen(true)}
                    className={`p-2 bg-gradient-to-r from-maple-500 to-maple-600 dark:from-maple-600 dark:to-maple-700 text-white rounded-lg transition-all ${
                      isReadOnly || !currentTrip ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
                    }`}
                    title={isReadOnly ? '唯讀模式' : !currentTrip ? '載入中...' : '新增景點'}
                    disabled={isReadOnly || !currentTrip}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              
              {/* Sort Controls */}
              <div className="flex items-center space-x-2">
                <ArrowDownUp size={14} className="text-gray-400 dark:text-gray-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">排序：</span>
                <button
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title={sortDirection === 'desc' ? '點擊切換為遞增' : '點擊切換為遞減'}
                >
                  {sortDirection === 'desc' ? '↓' : '↑'}
                </button>
                <button
                  onClick={() => setSortBy('time')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    sortBy === 'time'
                      ? 'bg-maple-100 dark:bg-maple-900/50 text-maple-700 dark:text-maple-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  時間
                </button>
                <button
                  onClick={() => setSortBy('name')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    sortBy === 'name'
                      ? 'bg-maple-100 dark:bg-maple-900/50 text-maple-700 dark:text-maple-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  名稱
                </button>
                <button
                  onClick={() => setSortBy('category')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    sortBy === 'category'
                      ? 'bg-maple-100 dark:bg-maple-900/50 text-maple-700 dark:text-maple-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  類別
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-3 min-h-[300px] max-h-[600px] overflow-y-auto bg-gray-50 dark:bg-gray-900">
              {sortedBacklogPlaces.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <Calendar size={32} className="mx-auto mb-2" />
                  <p className="text-sm">尚無候選景點</p>
                  <p className="text-xs mt-1">點擊上方 + 新增景點</p>
                </div>
              ) : (
                sortedBacklogPlaces.map((place) => (
                  <BacklogPlaceCard
                    key={place.id}
                    place={place}
                    onRemove={() => !isReadOnly && removeBacklogPlace(place.id)}
                    onAddToItinerary={selectedDate && !isReadOnly ? () => handleAddToItinerary(place) : undefined}
                    isReadOnly={isReadOnly}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Itinerary Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200">
            {/* Date Navigation */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
              <button
                onClick={() => handleDateChange('prev')}
                disabled={currentDateIndex <= 0}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="text-center">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedDate && format(parseISO(selectedDate), 'yyyy年 M月 d日 (EEE)', { locale: zhTW })}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  第 {currentDateIndex + 1} 天 / 共 {currentTrip.itinerary.length} 天
                </p>
              </div>
              
              <button
                onClick={() => handleDateChange('next')}
                disabled={currentDateIndex >= currentTrip.itinerary.length - 1}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Start Time Control */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">開始時間：</span>
                <select
                  value={scheduleStartHour}
                  onChange={(e) => setScheduleStartHour(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-maple-500 dark:focus:ring-maple-600"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((hour) => (
                    <option key={hour} value={hour}>
                      {hour.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => !isReadOnly && setIsAccommodationModalOpen(true)}
                  disabled={!selectedDate || isReadOnly}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                    !isReadOnly && selectedDate ? 'hover:shadow-md' : ''
                  }`}
                  title={isReadOnly ? '唯讀模式' : '設定住宿'}
                >
                  <Hotel size={16} />
                  <span>住宿</span>
                </button>
                <button
                  onClick={() => !isReadOnly && setIsCustomActivityModalOpen(true)}
                  disabled={!selectedDate || isReadOnly}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                    !isReadOnly && selectedDate ? 'hover:shadow-md' : ''
                  }`}
                  title={isReadOnly ? '唯讀模式' : '新增自訂活動'}
                >
                  <PlusCircle size={16} />
                  <span>自訂活動</span>
                </button>
                <button
                  onClick={handleOptimizeRoute}
                  disabled={isOptimizing || !currentDayItinerary || currentDayItinerary.items.length < 2 || isReadOnly}
                  className={`flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-forest-500 to-forest-600 dark:from-forest-600 dark:to-forest-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                    !isReadOnly && currentDayItinerary && currentDayItinerary.items.length >= 2 && !isOptimizing ? 'hover:shadow-md' : ''
                  }`}
                  title={isReadOnly ? '唯讀模式' : '智慧路線規劃'}
                >
                  {isOptimizing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Route size={16} />
                  )}
                  <span>優化路徑</span>
                </button>
              </div>
            </div>

            {/* Timeline Schedule */}
            <div className="overflow-auto bg-gray-50 dark:bg-gray-900" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              {currentDayItinerary && currentDayItinerary.items.length > 0 ? (
                <TimelineSchedule
                  items={currentDayItinerary.items}
                  accommodation={currentDayItinerary.accommodation}
                  onUpdateItem={(itemId, updates) => 
                    selectedDate && !isReadOnly && updateItineraryItem(selectedDate, itemId, updates)
                  }
                  onRemoveItem={(itemId, isCustom) => {
                    if (selectedDate && !isReadOnly) {
                      if (isCustom) {
                        // 自訂活動直接刪除
                        const dayItinerary = currentDayItinerary;
                        if (dayItinerary) {
                          removeItineraryItem(selectedDate, itemId);
                        }
                      } else {
                        // 一般景點移回候選清單
                        removeItineraryItem(selectedDate, itemId);
                      }
                    }
                  }}
                  onToggleComplete={(itemId) => {
                    if (isReadOnly) return;
                    const item = currentDayItinerary.items.find(i => i.id === itemId);
                    if (item && selectedDate) {
                      updateItineraryItem(selectedDate, itemId, { completed: !item.completed });
                    }
                  }}
                  onEditAccommodation={() => !isReadOnly && setIsAccommodationModalOpen(true)}
                  startHour={scheduleStartHour}
                  endHour={24}
                  isReadOnly={isReadOnly}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800">
                  <Calendar size={48} className="mb-3" />
                  <p className="text-lg">尚無行程</p>
                  <p className="text-sm mt-1">點擊候選景點的 + 按鈕加入行程</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Place Modal */}
      {isAddModalOpen && (
        <Suspense fallback={null}>
          <AddPlaceModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={(place: Omit<BacklogPlace, 'id'>) => addBacklogPlace(place)}
          />
        </Suspense>
      )}

      {/* Import Google Maps Modal */}
      {isImportModalOpen && (
        <Suspense fallback={null}>
          <ImportGoogleMapsModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImport={(places: Omit<BacklogPlace, 'id'>[]) => addBacklogPlaces(places)}
          />
        </Suspense>
      )}

      {/* Add Custom Activity Modal */}
      {isCustomActivityModalOpen && (
        <Suspense fallback={null}>
          <AddCustomActivityModal
            isOpen={isCustomActivityModalOpen}
            onClose={() => setIsCustomActivityModalOpen(false)}
            onAdd={handleAddCustomActivity}
          />
        </Suspense>
      )}

      {/* Accommodation Modal */}
      {isAccommodationModalOpen && (
        <Suspense fallback={null}>
          <AccommodationModal
            isOpen={isAccommodationModalOpen}
            onClose={() => setIsAccommodationModalOpen(false)}
            onSave={handleSetAccommodation}
            currentAccommodation={currentAccommodation ? {
              place_name: currentAccommodation.place_name,
              address: currentAccommodation.address,
              coordinates: currentAccommodation.coordinates,
              notes: currentAccommodation.notes,
              time: currentAccommodation.time,
            } : null}
          />
        </Suspense>
      )}
    </>
  );
}
