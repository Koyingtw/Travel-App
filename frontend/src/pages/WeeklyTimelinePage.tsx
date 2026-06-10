import { useTripStore } from '../store/tripStore';
import WeeklyTimeline from '../components/WeeklyTimeline';
import { Loader2, CalendarDays } from 'lucide-react';

export default function WeeklyTimelinePage() {
  const { currentTrip, isLoading } = useTripStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin text-primary-500 dark:text-primary-400" size={48} />
      </div>
    );
  }

  if (!currentTrip) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500">
        <CalendarDays size={64} className="mb-4" />
        <p className="text-xl">未找到行程資料</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
      <div className="container mx-auto px-4">
        <WeeklyTimeline trip={currentTrip} />
      </div>
    </div>
  );
}
