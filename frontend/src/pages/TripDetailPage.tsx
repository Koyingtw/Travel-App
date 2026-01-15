import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Loader2, CalendarDays, Lock, Unlock, Settings } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useTripStore } from '../store/tripStore';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import TripPlanner from '../components/TripPlanner';
import MapComponent from '../components/MapComponent';
import NoteEditor from '../components/NoteEditor';
import { PasswordDialog } from '../components/PasswordDialog';
import { PasswordManagementModal } from '../components/PasswordManagementModal';

export default function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { currentTrip, isLoading, error, fetchTrip, selectedDate } = useTripStore();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPasswordManagement, setShowPasswordManagement] = useState(false);
  
  // Pre-load Google Maps API for place autocomplete
  useGoogleMaps();

  useEffect(() => {
    if (tripId) {
      fetchTrip(tripId);
    }
  }, [tripId, fetchTrip]);

  // Reset unlock state when trip changes or on mount
  useEffect(() => {
    setIsUnlocked(false);
  }, [currentTrip?._id]);

  const handleVerifyPassword = async (password: string): Promise<boolean> => {
    if (!tripId) return false;
    
    try {
      const response = await fetch(`/api/trips/${tripId}/password/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      
      if (data.success && data.data?.valid) {
        setIsUnlocked(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Password verification failed:', err);
      return false;
    }
  };

  const handlePasswordChange = () => {
    // Refresh trip data to get updated is_protected status
    if (tripId) {
      fetchTrip(tripId);
      setIsUnlocked(false);
    }
  };

  const isReadOnly = currentTrip?.is_protected && !isUnlocked;
  
  // Debug: Log protection status
  console.log('Trip protection status:', {
    is_protected: currentTrip?.is_protected,
    isUnlocked,
    isReadOnly,
    tripId: currentTrip?._id
  });

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
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-maple-600 to-maple-500 dark:from-maple-400 dark:to-maple-300 bg-clip-text text-transparent">
                    {currentTrip.title}
                  </h1>
                  
                  {/* Lock Status Badge */}
                  {currentTrip.is_protected && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      isUnlocked
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {isUnlocked ? (
                        <>
                          <Unlock size={12} />
                          <span>已解鎖</span>
                        </>
                      ) : (
                        <>
                          <Lock size={12} />
                          <span>唯讀模式</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
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

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Password Management Button */}
              <button
                onClick={() => setShowPasswordManagement(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Settings size={16} />
                <span className="hidden sm:inline">密碼設定</span>
              </button>

              {/* Unlock Button (only show if protected and locked) */}
              {isReadOnly && (
                <button
                  onClick={() => setShowPasswordDialog(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Lock size={16} />
                  <span>解鎖編輯</span>
                </button>
              )}

              {/* Weekly Timeline Button */}
              <Link
                to={`/trip/${tripId}/timeline`}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-maple-500 to-maple-600 dark:from-maple-600 dark:to-maple-700 text-white rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <CalendarDays size={18} />
                <span className="font-medium hidden sm:inline">完整時間表</span>
              </Link>
            </div>
          </div>

          {/* Day Selector Pills - moved outside flex-between container */}
          <div className="flex items-center space-x-2 overflow-x-auto max-w-full mt-4">
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

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Planner */}
          <div className="xl:col-span-2">
            <TripPlanner isReadOnly={isReadOnly} />
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

      {/* Password Dialogs */}
      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        onVerify={handleVerifyPassword}
      />

      <PasswordManagementModal
        isOpen={showPasswordManagement}
        onClose={() => setShowPasswordManagement(false)}
        tripId={tripId || ''}
        isProtected={currentTrip?.is_protected || false}
        onPasswordChange={handlePasswordChange}
      />
    </div>
  );
}
