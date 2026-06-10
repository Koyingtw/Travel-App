import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Trash2 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { TripSummary } from '../types';

interface TripCardProps {
  trip: TripSummary;
  onDelete?: (id: string) => void;
}

// Default cover images (optimized: smaller size + WebP)
const defaultCovers = [
  'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=400&q=60&fm=webp', // Tokyo
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=60&fm=webp', // Paris
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=60&fm=webp', // Rome
  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=60&fm=webp', // New York
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=60&fm=webp', // London
];

// Use memo to prevent unnecessary re-renders
const TripCard = memo(function TripCard({ trip, onDelete }: TripCardProps) {
  // Memoize computed values
  const { startDate, endDate, duration, coverImage } = useMemo(() => {
    const start = parseISO(trip.start_date);
    const end = parseISO(trip.end_date);
    // Use consistent cover based on trip id to avoid random re-renders
    const coverIndex = trip._id.charCodeAt(0) % defaultCovers.length;
    return {
      startDate: start,
      endDate: end,
      duration: differenceInDays(end, start) + 1,
      coverImage: trip.cover_image || defaultCovers[coverIndex],
    };
  }, [trip._id, trip.start_date, trip.end_date, trip.cover_image]);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && window.confirm('確定要刪除此行程嗎？')) {
      onDelete(trip._id);
    }
  };

  return (
    <Link
      to={`/trip/${trip._id}`}
      className="group block bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 overflow-hidden card-hover border border-gray-100 dark:border-gray-700 transition-all"
    >
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
        <img
          src={coverImage}
          alt={trip.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Duration Badge */}
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200">
          {duration} 天
        </div>

        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={18} />
          </button>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-xl font-bold text-white truncate">{trip.title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Destination */}
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
          <MapPin size={16} className="text-primary-500 dark:text-primary-400" />
          <span className="text-sm">{trip.destination}</span>
        </div>

        {/* Dates */}
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
          <Calendar size={16} className="text-primary-500 dark:text-primary-400" />
          <span className="text-sm">
            {format(startDate, 'yyyy/MM/dd', { locale: zhTW })} - {format(endDate, 'MM/dd', { locale: zhTW })}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {trip.total_places || 0} 個景點
          </span>
          <span className="text-sm text-primary-600 dark:text-primary-400 font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
            查看詳情 →
          </span>
        </div>
      </div>
    </Link>
  );
});

export default TripCard;
