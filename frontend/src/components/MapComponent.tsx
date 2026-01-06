import { useMemo, useState } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { Loader2, MapPin } from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import type { PlaceCategory } from '../types';

// 類別對應的顏色
const categoryColors: Record<PlaceCategory, string> = {
  nature: '#22c55e',      // 綠色
  museum: '#a855f7',      // 紫色
  restaurant: '#f97316',  // 橙色
  hotel: '#3b82f6',       // 藍色
  shopping: '#ec4899',    // 粉色
  entertainment: '#eab308', // 黃色
  landmark: '#ef4444',    // 紅色
  transportation: '#6b7280', // 灰色
  other: '#64748b',       // 石板灰
};

// 類別中文標籤
const categoryLabels: Record<PlaceCategory, string> = {
  nature: '自然景觀',
  museum: '博物館',
  restaurant: '餐廳',
  hotel: '飯店',
  shopping: '購物',
  entertainment: '娛樂',
  landmark: '地標',
  transportation: '交通',
  other: '其他',
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Default center: Canada (Toronto)
const defaultCenter = {
  lat: 43.6532,
  lng: -79.3832,
};

// Custom map styles for a clean look
const mapStyles = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

interface MapComponentProps {
  apiKey?: string;
}

export default function MapComponent({ apiKey }: MapComponentProps) {
  const { currentTrip, selectedDate } = useTripStore();
  const { isLoaded, loadError } = useGoogleMaps();
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  // Get markers based on display mode
  const markers = useMemo(() => {
    if (!currentTrip) return [];
    
    if (showAllPlaces) {
      // 顯示所有地點（從所有天數的行程）
      const allItems: Array<{ 
        id: string; 
        position: { lat: number; lng: number }; 
        name: string; 
        category: PlaceCategory;
        date: string;
        order?: number;
      }> = [];
      
      currentTrip.itinerary.forEach((day) => {
        day.items
          .filter((item) => item.coordinates?.lat && item.coordinates?.lng && !item.is_custom)
          .forEach((item) => {
            allItems.push({
              id: `${day.date}-${item.id}`,
              position: {
                lat: item.coordinates!.lat,
                lng: item.coordinates!.lng,
              },
              name: item.place_name,
              category: item.category as PlaceCategory,
              date: day.date,
            });
          });
      });
      
      return allItems;
    } else {
      // 只顯示當日地點
      if (!selectedDate) return [];
      
      const dayItinerary = currentTrip.itinerary.find((d) => d.date === selectedDate);
      if (!dayItinerary) return [];

      return dayItinerary.items
        .filter((item) => item.coordinates?.lat && item.coordinates?.lng && !item.is_custom)
        .map((item, index) => ({
          id: item.id,
          position: {
            lat: item.coordinates!.lat,
            lng: item.coordinates!.lng,
          },
          name: item.place_name,
          category: item.category as PlaceCategory,
          order: index + 1,
          date: selectedDate,
        }));
    }
  }, [currentTrip, selectedDate, showAllPlaces]);

  // Calculate map center
  const center = useMemo(() => {
    if (markers.length === 0) return defaultCenter;
    
    const avgLat = markers.reduce((sum, m) => sum + m.position.lat, 0) / markers.length;
    const avgLng = markers.reduce((sum, m) => sum + m.position.lng, 0) / markers.length;
    
    return { lat: avgLat, lng: avgLng };
  }, [markers]);

  // Polyline path
  const polylinePath = useMemo(() => {
    return markers.map((m) => m.position);
  }, [markers]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-xl">
        <MapPin size={48} className="text-gray-300 mb-3" />
        <p className="text-gray-500">地圖載入失敗</p>
        <p className="text-sm text-gray-400 mt-1">請檢查 API Key 設定</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl">
        <Loader2 className="animate-spin text-maple-500" size={32} />
      </div>
    );
  }

  // Fallback UI when no API key
  if (!apiKey && !(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-forest-50 to-maple-50 rounded-xl p-6">
        <MapPin size={64} className="text-maple-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">地圖預覽</h3>
        <p className="text-sm text-gray-500 text-center mb-4">
          設定 Google Maps API Key 以啟用地圖功能
        </p>
        
        {markers.length > 0 && (
          <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {showAllPlaces ? `所有地點 (${markers.length} 個)` : `今日行程 (${markers.length} 個地點)`}
            </h4>
            <div className="space-y-2">
              {markers.map((marker) => {
                const hasOrder = 'order' in marker && marker.order !== undefined;
                return (
                  <div key={marker.id} className="flex items-center space-x-3">
                    {hasOrder && (
                      <span className="flex-shrink-0 w-6 h-6 bg-maple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {marker.order}
                      </span>
                    )}
                    <span className="text-sm text-gray-600 truncate">{marker.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* 控制按鈕 */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-2">
        <div className="bg-white rounded-lg shadow-md p-2 flex gap-2">
          <button
            onClick={() => setShowAllPlaces(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              !showAllPlaces
                ? 'bg-maple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            當日地點
          </button>
          <button
            onClick={() => setShowAllPlaces(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              showAllPlaces
                ? 'bg-maple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            所有地點
          </button>
        </div>
        
        {/* 圖例 */}
        {showAllPlaces && markers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-2 max-w-xs">
            <div className="text-xs font-semibold text-gray-700 mb-2">圖例</div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {Object.entries(categoryColors).map(([category, color]) => {
                const hasItems = markers.some((m) => m.category === category);
                if (!hasItems) return null;
                
                const labels: Record<PlaceCategory, string> = {
                  nature: '自然景觀',
                  museum: '博物館',
                  restaurant: '餐廳',
                  hotel: '飯店',
                  shopping: '購物',
                  entertainment: '娛樂',
                  landmark: '地標',
                  transportation: '交通',
                  other: '其他',
                };
                
                return (
                  <div key={category} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-gray-600 truncate">{labels[category as PlaceCategory]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={showAllPlaces ? (markers.length > 0 ? 10 : 6) : (markers.length > 0 ? 12 : 6)}
        options={{
          styles: mapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
      {/* Markers */}
      {markers.map((marker) => {
        const color = categoryColors[marker.category] || categoryColors.other;
        const hasOrder = 'order' in marker && marker.order !== undefined;
        const isHovered = hoveredMarker === marker.id;
        
        return (
          <Marker
            key={marker.id}
            position={marker.position}
            label={
              !showAllPlaces && hasOrder
                ? {
                    text: marker.order!.toString(),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '12px',
                  }
                : undefined
            }
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: showAllPlaces ? (isHovered ? 12 : 10) : (isHovered ? 18 : 15),
              fillColor: color,
              fillOpacity: isHovered ? 1 : 0.9,
              strokeColor: 'white',
              strokeWeight: isHovered ? 3 : 2,
            }}
            onMouseOver={() => setHoveredMarker(marker.id)}
            onMouseOut={() => setHoveredMarker(null)}
            options={{
              animation: isHovered ? google.maps.Animation.BOUNCE : undefined,
            }}
          >
            {isHovered && (
              <InfoWindow
                position={marker.position}
                options={{
                  pixelOffset: new google.maps.Size(0, -20),
                  disableAutoPan: true,
                }}
              >
                <div className="p-2 max-w-xs">
                  <div className="font-semibold text-gray-900 text-sm mb-1">
                    {marker.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span>{categoryLabels[marker.category]}</span>
                    {showAllPlaces && (
                      <>
                        <span>·</span>
                        <span>{marker.date}</span>
                      </>
                    )}
                    {hasOrder && (
                      <>
                        <span>·</span>
                        <span>順序 {marker.order}</span>
                      </>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Marker>
        );
      })}

      {/* Route Polyline - 只在當日模式顯示 */}
      {!showAllPlaces && polylinePath.length > 1 && (
        <Polyline
          path={polylinePath}
          options={{
            strokeColor: '#22c55e',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            geodesic: true,
          }}
        />
      )}
      </GoogleMap>
    </div>
  );
}
