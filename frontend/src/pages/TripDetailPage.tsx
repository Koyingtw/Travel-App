import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Loader2, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useTripStore } from '../store/tripStore';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import TripPlanner from '../components/TripPlanner';
import MapComponent from '../components/MapComponent';
import NoteEditor from '../components/NoteEditor';

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { currentTrip, isLoading, error, fetchTrip, selectedDate } = useTripStore();
  
  // Pre-load Google Maps API for place autocomplete
  useGoogleMaps();

  useEffect(() => {
    if (tripId) {
      fetchTrip(tripId);
    }
  }, [tripId, fetchTrip]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="animate-spin text-maple-500 dark:text-maple-400 mx-auto" size={48} />
          <p className="mt-4 text-gray-600 dark:text-gray-300">載入中...</p>
        </div>
      </div>
    );
  }

  if (error || !currentTrip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-xl text-gray-700 dark:text-gray-200 mb-4">找不到此行程</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-maple-600 dark:text-maple-400 hover:text-maple-700 dark:hover:text-maple-300"
          >
            <ArrowLeft size={20} />
            <span>返回首頁</span>
          </Link>
        </div>
      </div>
    );
  }

  const startDate = parseISO(currentTrip.start_date);
  const endDate = parseISO(currentTrip.end_date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-16 z-40">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-maple-600 to-maple-500 dark:from-maple-400 dark:to-maple-300 bg-clip-text text-transparent">
                  {currentTrip.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="flex items-center space-x-1">
                    <MapPin size={14} />
                    <span>{currentTrip.destination}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>
                      {format(startDate, 'MM/dd', { locale: zhTW })} - {format(endDate, 'MM/dd', { locale: zhTW })}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly Timeline Button */}
            <Link
              to={`/trip/${tripId}/timeline`}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-maple-500 to-maple-600 dark:from-maple-600 dark:to-maple-700 text-white rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <CalendarDays size={18} />
              <span className="font-medium">完整時間表</span>
            </Link>

            {/* Day Selector Pills */}
            <div className="hidden md:flex items-center space-x-2 overflow-x-auto max-w-xl">
              {currentTrip.itinerary.slice(0, 7).map((day, index) => {
                const isSelected = selectedDate === day.date;
                return (
                  <button
                    key={day.date}
                    onClick={() => useTripStore.getState().setSelectedDate(day.date)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-maple-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Day {index + 1}
                  </button>
                );
              })}
              {currentTrip.itinerary.length > 7 && (
                <span className="text-gray-400 text-sm">+{currentTrip.itinerary.length - 7}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Planner */}
          <div className="xl:col-span-2">
            <TripPlanner />
          </div>

          {/* Right Column: Map and Notes */}
          <div className="space-y-6">
            {/* Map - 加大尺寸 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-xl">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                  <MapPin size={18} className="text-maple-500 dark:text-maple-400" />
                  <span>地圖預覽</span>
                </h3>
              </div>
              <div className="h-96">
                <MapComponent />
              </div>
            </div>

            {/* Notes */}
            <NoteEditor />
          </div>
        </div>
      </div>
    </div>
  );
}
