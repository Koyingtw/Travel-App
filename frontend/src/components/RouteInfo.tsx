import { useEffect, useState } from 'react';
import { Navigation, Clock, MapPin } from 'lucide-react';
import type { Coordinates } from '../types';

interface RouteInfoProps {
  from: {
    name: string;
    coordinates?: Coordinates;
  };
  to: {
    name: string;
    coordinates?: Coordinates;
  };
}

interface RouteData {
  distance: string;
  duration: string;
  distanceValue: number; // in meters
  durationValue: number; // in seconds
}

export default function RouteInfo({ from, to }: RouteInfoProps) {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 檢查是否有座標
    if (!from.coordinates || !to.coordinates) {
      setError(true);
      return;
    }

    // 檢查 Google Maps API 是否已載入
    if (typeof google === 'undefined' || !google.maps) {
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    // 使用 Google Maps Distance Matrix API
    const service = new google.maps.DistanceMatrixService();
    
    service.getDistanceMatrix(
      {
        origins: [new google.maps.LatLng(from.coordinates.lat, from.coordinates.lng)],
        destinations: [new google.maps.LatLng(to.coordinates.lat, to.coordinates.lng)],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        setLoading(false);
        
        if (status === 'OK' && response?.rows[0]?.elements[0]?.status === 'OK') {
          const result = response.rows[0].elements[0];
          setRouteData({
            distance: result.distance.text,
            duration: result.duration.text,
            distanceValue: result.distance.value,
            durationValue: result.duration.value,
          });
        } else {
          setError(true);
        }
      }
    );
  }, [from.coordinates, to.coordinates]);

  // 生成 Google Maps 導航連結
  const getNavigationUrl = () => {
    if (!from.coordinates || !to.coordinates) return '#';
    
    const origin = `${from.coordinates.lat},${from.coordinates.lng}`;
    const destination = `${to.coordinates.lat},${to.coordinates.lng}`;
    
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
  };

  if (error || (!from.coordinates || !to.coordinates)) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-100 dark:bg-gray-800 border-l-4 border-gray-300 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 rounded-r">
        <Clock size={12} className="animate-pulse" />
        <span>計算中...</span>
      </div>
    );
  }

  if (!routeData) {
    return null;
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-l-4 border-blue-400 dark:border-blue-600 p-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs">
            <MapPin size={12} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="font-medium text-gray-700 dark:text-gray-300">{routeData.distance}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Clock size={12} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="font-medium text-gray-700 dark:text-gray-300">{routeData.duration}</span>
          </div>
        </div>
        
        <a
          href={getNavigationUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-xs font-medium shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <Navigation size={12} />
          <span>導航</span>
        </a>
      </div>
    </div>
  );
}
